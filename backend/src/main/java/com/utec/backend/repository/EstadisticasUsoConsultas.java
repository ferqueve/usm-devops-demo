package com.utec.backend.repository;

import com.utec.backend.dto.stats.EquiposReservasDto;
import com.utec.backend.dto.stats.FiltroInventario;
import com.utec.backend.dto.stats.FiltroReservas;
import com.utec.backend.dto.stats.Periodo;
import com.utec.backend.dto.stats.UsoEspaciosDto;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.List;

import static com.utec.backend.repository.ConsultasSql.*;

/**
 * Consultas de uso físico: espacios (horas, saturación, aforo), con los
 * filtros de reservas, y demanda de inventario, con los filtros de inventario.
 */
@Repository
@RequiredArgsConstructor
public class EstadisticasUsoConsultas {

    private final NamedParameterJdbcTemplate jdbc;

    /**
     * Tutorías y eventos presenciales del período con su espacio, cupo e
     * inscriptos. Una tutoría virtual con espacio cargado no ocupa el aula, así
     * que no cuenta para el aforo.
     *
     * Inscriptos: sin borrar y sin las canceladas ni la lista de espera, igual
     * que el cupo que controla la aplicación.
     */
    private static String sesiones(FiltroReservas f, MapSqlParameterSource p) {
        String carrera = "";
        if (f.carreraId() != null) {
            carrera = " AND m.carrera_id = :carreraId";
            p.addValue("carreraId", f.carreraId());
        }
        return """
                WITH sesiones AS (
                  SELECT 'TUTORIA' AS tipo, t.id, 'Tutoría ' || m.nombre AS titulo, t.inicio, t.espacio_id, t.cupo,
                         (SELECT COUNT(*) FROM tutoria_reserva tr
                           WHERE tr.tutoria_id = t.id AND tr.deleted_at IS NULL
                             AND tr.estado NOT IN ('CANCELADA', 'ESPERA')) AS inscriptos
                  FROM tutoria t
                  JOIN materia m ON m.id = t.materia_id
                  WHERE t.deleted_at IS NULL AND t.estado <> 'CANCELADA' AND t.modalidad = 'PRESENCIAL'
                    AND t.espacio_id IS NOT NULL AND t.inicio >= :desde AND t.inicio < :hasta
                """ + carrera + """

                  UNION ALL
                  SELECT 'EVENTO', ev.id, ev.titulo, ev.inicio, ev.espacio_id, ev.cupo,
                         (SELECT COUNT(*) FROM evento_inscripcion ei
                           WHERE ei.evento_id = ev.id AND ei.deleted_at IS NULL
                             AND ei.estado IN ('INSCRITO', 'ASISTIO'))
                  FROM evento ev
                  WHERE ev.deleted_at IS NULL AND ev.estado NOT IN ('BORRADOR', 'CANCELADO')
                    AND ev.espacio_id IS NOT NULL AND ev.inicio >= :desde AND ev.inicio < :hasta
                )
                """;
    }

    public record FilaUsoEspacio(Long espacioId, String nombre, String edificioNombre, String tipoEspacio,
                                 Integer capacidad, double horas, long reservas, Double cupoPromedio,
                                 Double inscriptosPromedio) {
    }

    /**
     * Cada espacio activo con sus horas APROBADAS en {@code periodoOcupacion}
     * (la parte transcurrida, puede no haber) y el aforo de sus sesiones en
     * {@code periodo}.
     */
    public List<FilaUsoEspacio> usoPorEspacio(Periodo periodo, Periodo periodoOcupacion, FiltroReservas f) {
        MapSqlParameterSource p = rango(periodo);
        String uso;
        if (periodoOcupacion == null) {
            uso = "SELECT NULL::bigint AS espacio_id, 0::numeric AS horas, 0::bigint AS reservas WHERE FALSE";
        } else {
            p.addValue("desdeOcupacion", instante(periodoOcupacion.inicio()))
                    .addValue("hastaOcupacion", instante(periodoOcupacion.fin()));
            uso = """
                    SELECT r.espacio_id, SUM(EXTRACT(EPOCH FROM (r.fin - r.inicio))) / 3600.0 AS horas, COUNT(*) AS reservas
                    FROM reserva r
                    WHERE r.estado = 'APROBADO' AND r.inicio >= :desdeOcupacion AND r.inicio < :hastaOcupacion
                    """ + filtroSolicitante(f, p) + " GROUP BY r.espacio_id";
        }
        String sql = sesiones(f, p) + """
                , uso AS (
                """ + uso + """

                ), aforo AS (
                  SELECT espacio_id, AVG(cupo) AS cupo_promedio, AVG(inscriptos) AS inscriptos_promedio
                  FROM sesiones GROUP BY espacio_id
                )
                SELECT e.id, e.nombre, ed.nombre AS edificio_nombre, te.nombre AS tipo_nombre, e.capacidad,
                       COALESCE(u.horas, 0) AS horas, COALESCE(u.reservas, 0) AS reservas,
                       a.cupo_promedio, a.inscriptos_promedio
                FROM espacio e
                LEFT JOIN edificio ed ON ed.id = e.edificio_id
                LEFT JOIN tipo_espacio te ON te.id = e.tipo_espacio_id
                LEFT JOIN uso u ON u.espacio_id = e.id
                LEFT JOIN aforo a ON a.espacio_id = e.id
                WHERE e.deleted_at IS NULL
                """ + filtroEspacio(f, p) + " ORDER BY horas DESC, e.nombre";
        return jdbc.query(sql, p, (rs, i) -> new FilaUsoEspacio(idONull(rs, "id"), rs.getString("nombre"),
                rs.getString("edificio_nombre"), rs.getString("tipo_nombre"), enteroONull(rs, "capacidad"),
                decimal(rs, "horas"), entero(rs, "reservas"), decimalONull(rs, "cupo_promedio"),
                decimalONull(rs, "inscriptos_promedio")));
    }

    /**
     * Saturación por tipo de espacio y hora (8 a 21) en los días hábiles del
     * período. Cada reserva aprobada se expande a las horas que toca: [h, h+1)
     * está ocupada si la reserva empieza antes de h+1 y termina después de h.
     * Así se cruza con la grilla día × hora por igualdad y no por rangos.
     */
    public List<UsoEspaciosDto.Saturacion> saturacion(Periodo periodo, FiltroReservas f) {
        MapSqlParameterSource p = rango(periodo)
                .addValue("diaDesde", periodo.desde())
                .addValue("diaHasta", periodo.hasta());
        String sql = """
                WITH esp AS (
                  SELECT e.id, COALESCE(e.tipo_espacio_id, 0) AS tipo_id FROM espacio e WHERE e.deleted_at IS NULL
                """ + filtroEspacio(f, p) + """

                ), tipos AS (
                  SELECT tipo_id, COUNT(*) AS n FROM esp GROUP BY tipo_id
                ), grilla AS (
                  SELECT CAST(d AS date) AS dia, h
                  FROM generate_series(CAST(:diaDesde AS date), CAST(:diaHasta AS date), INTERVAL '1 day') d
                  CROSS JOIN generate_series(8, 21) h
                  WHERE EXTRACT(ISODOW FROM d) <= 5
                ), ocupadas AS (
                  SELECT esp.tipo_id, CAST(hs AS date) AS dia, CAST(EXTRACT(HOUR FROM hs) AS int) AS h,
                         COUNT(DISTINCT r.espacio_id) AS ocupados
                  FROM reserva r
                  JOIN esp ON esp.id = r.espacio_id
                  CROSS JOIN LATERAL generate_series(
                      date_trunc('hour', r.inicio AT TIME ZONE %1$s),
                      (r.fin AT TIME ZONE %1$s) - INTERVAL '1 microsecond',
                      INTERVAL '1 hour') hs
                  WHERE r.estado = 'APROBADO' AND r.fin > r.inicio
                    AND r.inicio < :hasta AND r.fin > :desde
                """.formatted(ZONA) + filtroSolicitante(f, p) + """

                  GROUP BY 1, 2, 3
                )
                SELECT COALESCE(te.nombre, 'Sin tipo') AS tipo_nombre, t.n, g.h,
                       AVG(COALESCE(o.ocupados, 0) * 100.0 / t.n)             AS ocupacion,
                       COUNT(*) FILTER (WHERE COALESCE(o.ocupados, 0) >= t.n) AS llenas
                FROM tipos t
                CROSS JOIN grilla g
                LEFT JOIN ocupadas o ON o.tipo_id = t.tipo_id AND o.dia = g.dia AND o.h = g.h
                LEFT JOIN tipo_espacio te ON te.id = t.tipo_id
                GROUP BY te.nombre, t.n, g.h
                ORDER BY te.nombre NULLS LAST, g.h
                """;
        return jdbc.query(sql, p, (rs, i) -> new UsoEspaciosDto.Saturacion(rs.getString("tipo_nombre"),
                entero(rs, "n"), rs.getInt("h"), decimal(rs, "ocupacion"), entero(rs, "llenas")));
    }

    public record FilaCapacidad(String tipo, Long id, String titulo, java.time.LocalDate fecha, String espacioNombre,
                                Integer capacidad, Integer cupo, long inscriptos) {
    }

    /** Sesiones con espacio: primero las que no entran en el aula, después las más vacías. */
    public List<FilaCapacidad> capacidad(Periodo periodo, FiltroReservas f, int limite) {
        MapSqlParameterSource p = rango(periodo).addValue("limite", limite);
        String sql = sesiones(f, p) + """
                SELECT s.tipo, s.id, s.titulo, CAST(s.inicio AT TIME ZONE %s AS date) AS fecha,
                       e.nombre AS espacio_nombre, e.capacidad, s.cupo, s.inscriptos
                FROM sesiones s
                JOIN espacio e ON e.id = s.espacio_id
                WHERE e.deleted_at IS NULL
                """.formatted(ZONA) + filtroEspacio(f, p) + """

                ORDER BY (s.inscriptos > e.capacidad OR COALESCE(s.cupo, 0) > e.capacidad) DESC,
                         s.inscriptos * 1.0 / NULLIF(e.capacidad, 0) ASC NULLS LAST,
                         s.inicio
                LIMIT :limite
                """;
        return jdbc.query(sql, p, (rs, i) -> new FilaCapacidad(rs.getString("tipo"), idONull(rs, "id"),
                rs.getString("titulo"), fecha(rs, "fecha"), rs.getString("espacio_nombre"),
                enteroONull(rs, "capacidad"), enteroONull(rs, "cupo"), entero(rs, "inscriptos")));
    }

    // ------------------------------------------------------- demanda de inventario

    /**
     * Condiciones de inventario sobre un espacio con alias {@code alias}. El
     * tipo de elemento se aplica aparte porque cada consulta lo lee de una
     * tabla distinta.
     */
    private static String filtroUbicacion(FiltroInventario f, MapSqlParameterSource p, String alias) {
        String sql = "";
        if (f.edificioId() != null) {
            sql += " AND " + alias + ".edificio_id = :edificioId";
            p.addValue("edificioId", f.edificioId());
        }
        if (f.espacioId() != null) {
            sql += " AND " + alias + ".id = :espacioId";
            p.addValue("espacioId", f.espacioId());
        }
        return sql;
    }

    private static String filtroTipo(FiltroInventario f, MapSqlParameterSource p, String columna) {
        if (f.tipoElementoId() == null) {
            return "";
        }
        p.addValue("tipoElementoId", f.tipoElementoId());
        return " AND " + columna + " = :tipoElementoId";
    }

    /**
     * Pedidos de equipamiento por tipo en reservas que empiezan en el período,
     * con el inventario actual del tipo. Edificio y espacio acotan tanto dónde
     * se pidió como dónde está el inventario.
     */
    public List<EquiposReservasDto.PorTipo> demandaPorTipo(Periodo periodo, FiltroInventario f) {
        MapSqlParameterSource p = rango(periodo);
        String sql = """
                WITH sol AS (
                  SELECT ris.tipo_elemento_id, ris.cantidad_solicitada AS unidades, ris.estado,
                         CAST(r.inicio AT TIME ZONE %s AS date) AS dia
                  FROM reserva_item_solicitado ris
                  JOIN reserva r ON r.id = ris.reserva_id
                  JOIN espacio e ON e.id = r.espacio_id
                  WHERE ris.deleted_at IS NULL AND r.inicio >= :desde AND r.inicio < :hasta
                """.formatted(ZONA) + filtroUbicacion(f, p, "e") + filtroTipo(f, p, "ris.tipo_elemento_id") + """

                ), pico AS (
                  SELECT tipo_elemento_id, MAX(u) AS max_dia
                  FROM (SELECT tipo_elemento_id, dia, SUM(unidades) AS u FROM sol GROUP BY 1, 2) x
                  GROUP BY tipo_elemento_id
                ), inv AS (
                  SELECT i.tipo_elemento_id,
                         COALESCE(SUM(i.cantidad) FILTER (WHERE i.estado = 'DISPONIBLE'), 0) AS disponibles,
                         COALESCE(SUM(i.cantidad), 0) AS en_inventario
                  FROM inventario_item i
                  LEFT JOIN espacio ei ON ei.id = i.espacio_id
                  WHERE i.activo = TRUE AND i.deleted_at IS NULL
                """ + filtroUbicacion(f, p, "ei") + filtroTipo(f, p, "i.tipo_elemento_id") + """

                  GROUP BY i.tipo_elemento_id
                )
                SELECT t.id, t.nombre,
                       COUNT(*)                                        AS solicitudes,
                       COALESCE(SUM(s.unidades), 0)                    AS unidades,
                       COUNT(*) FILTER (WHERE s.estado = 'PENDIENTE')  AS pendientes,
                       COUNT(*) FILTER (WHERE s.estado = 'APROBADO')   AS aprobadas,
                       COUNT(*) FILTER (WHERE s.estado = 'ENTREGADO')  AS entregadas,
                       COUNT(*) FILTER (WHERE s.estado = 'RECHAZADO')  AS rechazadas,
                       COALESCE(MAX(inv.disponibles), 0)               AS disponibles,
                       COALESCE(MAX(inv.en_inventario), 0)             AS en_inventario,
                       COALESCE(MAX(pico.max_dia), 0)                  AS max_dia
                FROM sol s
                JOIN tipo_elemento t ON t.id = s.tipo_elemento_id
                LEFT JOIN inv ON inv.tipo_elemento_id = t.id
                LEFT JOIN pico ON pico.tipo_elemento_id = t.id
                GROUP BY t.id, t.nombre
                ORDER BY unidades DESC, t.nombre
                """;
        return jdbc.query(sql, p, (rs, i) -> new EquiposReservasDto.PorTipo(idONull(rs, "id"), rs.getString("nombre"),
                entero(rs, "solicitudes"), entero(rs, "unidades"), entero(rs, "pendientes"),
                entero(rs, "aprobadas"), entero(rs, "entregadas"), entero(rs, "rechazadas"),
                entero(rs, "disponibles"), entero(rs, "en_inventario"), entero(rs, "max_dia")));
    }

    /**
     * Espacios con items activos rotos o en arreglo hoy (del tipo, si se
     * filtra) y cuántas reservas APROBADAS tuvieron en el período.
     */
    public List<EquiposReservasDto.EspacioConProblemas> espaciosConProblemas(Periodo periodo, FiltroInventario f) {
        MapSqlParameterSource p = rango(periodo);
        String sql = """
                WITH problemas AS (
                  SELECT i.espacio_id, COUNT(*) AS items
                  FROM inventario_item i
                  WHERE i.activo = TRUE AND i.deleted_at IS NULL AND i.espacio_id IS NOT NULL
                    AND i.estado IN ('MANTENIMIENTO', 'DANADO')
                """ + filtroTipo(f, p, "i.tipo_elemento_id") + """

                  GROUP BY i.espacio_id
                )
                SELECT e.id, e.nombre, pr.items, COUNT(r.id) AS reservas
                FROM problemas pr
                JOIN espacio e ON e.id = pr.espacio_id AND e.deleted_at IS NULL
                LEFT JOIN reserva r ON r.espacio_id = e.id AND r.estado = 'APROBADO'
                                   AND r.inicio >= :desde AND r.inicio < :hasta
                WHERE TRUE
                """ + filtroUbicacion(f, p, "e") + """

                GROUP BY e.id, e.nombre, pr.items
                ORDER BY reservas DESC, pr.items DESC, e.nombre
                """;
        return jdbc.query(sql, p, (rs, i) -> new EquiposReservasDto.EspacioConProblemas(idONull(rs, "id"),
                rs.getString("nombre"), entero(rs, "reservas"), entero(rs, "items")));
    }
}
