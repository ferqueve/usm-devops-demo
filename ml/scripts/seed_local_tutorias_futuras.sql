-- =============================================================================
-- Semilla LOCAL para la pestaña Académico de Predicciones.
--
-- SÓLO para la base de desarrollo. No es un changeset de Liquibase y no se
-- corre en Railway: son datos inventados.
--
--   docker exec -i ut_db psql -U ut_user -d utec_db -v ON_ERROR_STOP=1 \
--       < ml/scripts/seed_local_tutorias_futuras.sql
--
-- Después hay que reentrenar (POST /train/academico): al borrar lo sembrado
-- antes se borran en cascada las predicciones que apuntaban a esas
-- inscripciones.
--
-- Qué siembra y por qué
-- ---------------------
-- 1. Tutorías FUTURAS (~36, de mañana a +21 días) con inscripciones AGENDADA,
--    que es lo que la pestaña predice. La base local no tenía ninguna.
--    Variadas en materia, docente, espacio (algunas virtuales sin espacio),
--    modalidad, tipo, franja horaria y cupo (4–30); algunas casi llenas y
--    otras con 1–2 inscriptos. La mayoría de los inscriptos tiene historial
--    y unos pocos no, para ver cómo el modelo trata a alguien sin pasado.
--
-- 2. Tutorías PASADAS (~6 semanas hasta ayer) con la asistencia registrada.
--    Hace falta porque la historia que deja AcademicDataInitializer no sirve
--    para entrenar: las tutorías que eran pasadas al sembrar quedaron
--    CERRADA con TODOS en ASISTIO (y con la inscripción cargada después de
--    la tutoría), y las que eran futuras quedaron ABIERTA con TODOS en
--    AGENDADA porque nadie pasó lista. La etiqueta termina siendo "¿la
--    tutoría era anterior al día en que se sembró?", y cualquier modelo
--    aprende eso. ml-svc descarta esas filas (ver
--    academico.preparar_inscripciones), así que sin esta parte no le quedaría
--    nada con qué entrenar.
--    La asistencia sale de un proceso con señal plausible, para que el
--    modelo tenga algo real que encontrar sin que sea trivial: cada
--    estudiante tiene una propensión propia, cada materia un efecto chico, y
--    suman o restan la antelación (anotarse con mucha anticipación hace más
--    fácil olvidarse), dejar temario, la modalidad virtual, el tipo, el fin
--    de semana, la franja y qué tan llena está. Con ruido: nada la determina.
--
-- Todo lleva tags = 'seed-local-predicciones' y es idempotente: lo primero
-- que hace es borrar lo sembrado antes. Con la misma fecha, `setseed` hace
-- que salga siempre lo mismo.
--
-- recordatorio_enviado = true en todas: el @Scheduled de recordatorios
-- mandaría mails a las cuentas sembradas.
-- =============================================================================

BEGIN;

DELETE FROM tutoria WHERE tags = 'seed-local-predicciones';

-- Normal estándar con Box-Muller: postgres no trae una.
CREATE OR REPLACE FUNCTION pg_temp.seed_normal() RETURNS float8
LANGUAGE sql VOLATILE AS $$
    SELECT sqrt(-2.0 * ln(greatest(random(), 1e-12))) * cos(2.0 * pi() * random())
$$;

CREATE TEMP TABLE seed_est ON COMMIT DROP AS
SELECT u.id,
       row_number() OVER (ORDER BY u.id) AS n,
       0.0::float8 AS propension,
       TRUE AS con_historial
FROM usuario u
WHERE u.rol_app = 'ESTUDIANTE'
  AND u.deleted_at IS NULL;

CREATE TEMP TABLE seed_mat ON COMMIT DROP AS
SELECT m.id, m.docente_id, 0.0::float8 AS efecto
FROM materia m
WHERE m.deleted_at IS NULL
  AND m.docente_id IS NOT NULL
  AND m.semestre BETWEEN 1 AND 4
-- md5 y no random(): el conjunto de materias no depende del orden en que
-- postgres evalúe las filas.
ORDER BY md5(m.id::text)
LIMIT 18;

-- Crea una tutoría con sus inscripciones.
--   p_pasada:  true = ya terminó y tiene asistencia registrada.
--   p_llenado: 'lleno' | 'vacia' | 'media' (sólo para las futuras).
CREATE OR REPLACE FUNCTION pg_temp.seed_tutoria(p_inicio timestamptz, p_pasada boolean, p_llenado text, p_ahora timestamptz)
RETURNS void
LANGUAGE plpgsql AS $$
DECLARE
    c_tag CONSTANT text := 'seed-local-predicciones';
    v_mat record;
    v_est record;
    v_modalidad text;
    v_tipo text;
    v_cupo int;
    v_fin timestamptz;
    v_creada_tutoria timestamptz;
    v_espacio bigint;
    v_tutoria bigint;
    v_k int;
    v_k_nuevos int;
    v_hora int;
    v_finde boolean;
    v_horas float8;
    v_horas_min float8;
    v_horas_max float8;
    v_temario boolean;
    v_logit float8;
    v_asistio boolean;
    v_confirmada boolean;
    v_temarios text[] := ARRAY[
        'Ejercicios del práctico 2',
        'Dudas con el parcial pasado',
        'Repasar límites y continuidad',
        'No me sale el ejercicio 4 del práctico',
        'Quiero repasar todo antes del final',
        'Derivadas implícitas',
        'Integrales por partes',
        'Consultas sobre el obligatorio'
    ];
BEGIN
    SELECT * INTO v_mat FROM seed_mat ORDER BY random() LIMIT 1;

    v_modalidad := CASE WHEN random() < 0.3 THEN 'VIRTUAL' ELSE 'PRESENCIAL' END;
    v_tipo := CASE WHEN random() < 0.35 THEN 'INDIVIDUAL' ELSE 'GRUPAL' END;
    v_cupo := CASE WHEN v_tipo = 'INDIVIDUAL' THEN 4 + floor(random() * 5)::int      -- 4..8
                   ELSE 8 + floor(random() * 23)::int                                -- 8..30
              END;
    v_fin := p_inicio + CASE WHEN random() < 0.7 THEN interval '1 hour' ELSE interval '2 hours' END;
    v_hora := extract(hour FROM p_inicio AT TIME ZONE 'America/Montevideo')::int;
    v_finde := extract(isodow FROM p_inicio AT TIME ZONE 'America/Montevideo') >= 6;

    -- Presenciales en un espacio libre (sin otra tutoría ni reserva a esa
    -- hora); algunas virtuales también tienen sala, como en los datos reales.
    IF v_modalidad = 'PRESENCIAL' OR random() < 0.4 THEN
        SELECT e.id INTO v_espacio
        FROM espacio e
        JOIN tipo_espacio te ON te.id = e.tipo_espacio_id
        WHERE e.deleted_at IS NULL
          AND te.nombre <> 'Otro'
          AND e.capacidad >= v_cupo
          AND NOT EXISTS (SELECT 1 FROM tutoria t
                          WHERE t.espacio_id = e.id AND t.deleted_at IS NULL
                            AND t.inicio < v_fin AND t.fin > p_inicio)
          AND NOT EXISTS (SELECT 1 FROM reserva r
                          WHERE r.espacio_id = e.id AND r.estado <> 'CANCELADO'
                            AND r.inicio < v_fin AND r.fin > p_inicio)
        ORDER BY random()
        LIMIT 1;
        IF v_espacio IS NULL THEN
            v_modalidad := 'VIRTUAL';
        END IF;
    END IF;

    v_creada_tutoria := CASE WHEN p_pasada THEN p_inicio - interval '21 days' ELSE p_ahora - interval '14 days' END;

    INSERT INTO tutoria (materia_id, docente_id, espacio_id, inicio, fin, cupo, estado, modalidad, enlace,
                         tipo, tags, en_vivo, recordatorio_enviado, created_at, updated_at)
    VALUES (v_mat.id, v_mat.docente_id, v_espacio, p_inicio, v_fin, v_cupo,
            CASE WHEN p_pasada THEN 'CERRADA' ELSE 'ABIERTA' END,
            v_modalidad,
            CASE WHEN v_modalidad = 'VIRTUAL' THEN 'https://meet.example.com/tutoria-seed-local' END,
            v_tipo, c_tag, FALSE, TRUE, v_creada_tutoria, v_creada_tutoria)
    RETURNING id INTO v_tutoria;

    -- Cuántos se anotan.
    IF p_pasada THEN
        v_k := CASE WHEN v_tipo = 'INDIVIDUAL' THEN 1 + floor(random() * least(v_cupo, 4))::int
                    ELSE greatest(1, round(v_cupo * (0.15 + 0.7 * random()))::int)
               END;
        v_k_nuevos := 0;
    ELSE
        v_k := CASE p_llenado
                   WHEN 'lleno' THEN greatest(1, v_cupo - floor(random() * 2)::int)
                   WHEN 'vacia' THEN 1 + floor(random() * 2)::int
                   ELSE greatest(1, round(v_cupo * (0.3 + 0.4 * random()))::int)
               END;
        v_k_nuevos := floor(v_k * 0.15 + random())::int;
    END IF;
    v_k_nuevos := least(v_k_nuevos, (SELECT count(*) FROM seed_est WHERE NOT con_historial)::int);
    v_k := least(v_k, v_cupo, v_k_nuevos + (SELECT count(*) FROM seed_est WHERE con_historial)::int);

    FOR v_est IN
        (SELECT id, propension FROM seed_est WHERE con_historial ORDER BY random() LIMIT v_k - v_k_nuevos)
        UNION ALL
        (SELECT id, propension FROM seed_est WHERE NOT con_historial ORDER BY random() LIMIT v_k_nuevos)
    LOOP
        -- Antelación log-uniforme: la mayoría se anota con horas o pocos días,
        -- algunos con semanas. Siempre antes del inicio y después de que la
        -- tutoría se publicó; en las futuras, además, antes de ahora.
        v_horas_max := extract(epoch FROM (p_inicio - v_creada_tutoria)) / 3600.0;
        v_horas_min := CASE WHEN p_pasada THEN 0.5
                            ELSE extract(epoch FROM (p_inicio - p_ahora)) / 3600.0 + 0.1 END;
        v_horas := least(v_horas_max, v_horas_min + exp(ln(0.5) + random() * (ln(400.0) - ln(0.5))));
        v_temario := random() < 0.7;

        IF p_pasada THEN
            v_logit := 0.0
                + v_est.propension
                + v_mat.efecto
                - 0.35 * (ln(1 + v_horas) - 3.5)
                + 0.55 * v_temario::int
                - 0.5 * (v_modalidad = 'VIRTUAL')::int
                + 0.45 * (v_tipo = 'INDIVIDUAL')::int
                - 0.6 * v_finde::int
                - 0.4 * (v_hora >= 18)::int
                + 0.15 * (v_hora < 12)::int
                + 0.5 * (v_k::float8 / v_cupo - 0.6);
            v_asistio := random() < 1.0 / (1.0 + exp(-v_logit));
            v_confirmada := CASE WHEN v_asistio THEN random() < 0.8 ELSE random() < 0.3 END;
        ELSE
            v_asistio := FALSE;
            -- Sólo se confirma cerca de la fecha (el recordatorio sale 24 h antes).
            v_confirmada := p_inicio - p_ahora < interval '2 days' AND random() < 0.5;
        END IF;

        INSERT INTO tutoria_reserva (tutoria_id, estudiante_id, estado, created_at, updated_at, temario, confirmada)
        VALUES (v_tutoria, v_est.id,
                CASE WHEN v_asistio THEN 'ASISTIO' ELSE 'AGENDADA' END,
                p_inicio - make_interval(secs => v_horas * 3600),
                p_inicio - make_interval(secs => v_horas * 3600),
                CASE WHEN v_temario THEN v_temarios[1 + floor(random() * array_length(v_temarios, 1))::int] END,
                v_confirmada);
    END LOOP;
END;
$$;

DO $$
DECLARE
    v_ahora timestamptz := now();
    v_hoy date := (now() AT TIME ZONE 'America/Montevideo')::date;
    v_horas int[] := ARRAY[8, 9, 10, 11, 14, 15, 16, 17, 18, 19, 20];
    v_dia date;
    v_n int;
    v_i int;
    v_llenado text;
BEGIN
    -- Misma semilla para el mismo día: re-correr el script da lo mismo.
    PERFORM setseed(((v_hoy - date '2026-01-01') % 1000) / 1000.0);

    UPDATE seed_est SET propension = 0.9 * pg_temp.seed_normal();
    -- Uno de cada cinco estudiantes no aparece en la historia sembrada: en
    -- las futuras son los "sin historial".
    UPDATE seed_est SET con_historial = FALSE WHERE n % 5 = 0;
    UPDATE seed_mat SET efecto = 0.5 * pg_temp.seed_normal();

    -- Pasadas: seis semanas hasta ayer, 1–3 por día hábil y alguna el fin de semana.
    FOR v_dia IN SELECT d::date FROM generate_series((v_hoy - 42)::timestamp, (v_hoy - 1)::timestamp, interval '1 day') AS d LOOP
        v_n := CASE WHEN extract(isodow FROM v_dia) <= 5 THEN 1 + floor(random() * 3)::int
                    WHEN random() < 0.4 THEN 1
                    ELSE 0 END;
        FOR v_i IN 1..v_n LOOP
            PERFORM pg_temp.seed_tutoria(
                (v_dia + make_interval(hours => v_horas[1 + floor(random() * array_length(v_horas, 1))::int]))
                    AT TIME ZONE 'America/Montevideo',
                TRUE, NULL, v_ahora);
        END LOOP;
    END LOOP;

    -- Futuras: 36 repartidas entre mañana y +21 días.
    FOR v_i IN 0..35 LOOP
        v_dia := v_hoy + 1 + (v_i * 21 / 36);
        -- Pocas en domingo, como en la realidad.
        IF extract(isodow FROM v_dia) = 7 AND random() < 0.7 THEN
            v_dia := v_dia + 1;
        END IF;
        v_llenado := CASE v_i % 6 WHEN 0 THEN 'lleno' WHEN 3 THEN 'vacia' ELSE 'media' END;
        PERFORM pg_temp.seed_tutoria(
            (v_dia + make_interval(hours => v_horas[1 + floor(random() * array_length(v_horas, 1))::int]))
                AT TIME ZONE 'America/Montevideo',
            FALSE, v_llenado, v_ahora);
    END LOOP;
END;
$$;

COMMIT;

-- Resumen de lo sembrado.
SELECT CASE WHEN t.fin < now() THEN 'pasadas' ELSE 'futuras' END AS cuando,
       count(DISTINCT t.id) AS tutorias,
       count(tr.id) AS inscripciones,
       count(DISTINCT tr.estudiante_id) AS estudiantes,
       round(avg((tr.estado = 'ASISTIO')::int), 3) AS tasa_asistencia,
       min(t.inicio AT TIME ZONE 'America/Montevideo')::date AS desde,
       max(t.inicio AT TIME ZONE 'America/Montevideo')::date AS hasta,
       min(t.cupo) AS cupo_min,
       max(t.cupo) AS cupo_max
FROM tutoria t
LEFT JOIN tutoria_reserva tr ON tr.tutoria_id = t.id AND tr.deleted_at IS NULL
WHERE t.tags = 'seed-local-predicciones'
GROUP BY 1
ORDER BY 1 DESC;
