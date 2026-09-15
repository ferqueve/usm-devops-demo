package com.utec.backend.repository;

import com.utec.backend.dto.stats.Periodo;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;

import static com.utec.backend.repository.ConsultasSql.*;

/**
 * Lecturas de la capa de predicciones: lo que escribió ml-svc más el contexto
 * vivo que hace falta para mostrarlo (reservas ya tomadas, stock de hoy,
 * inscripciones de las tutorías que vienen).
 *
 * El backend no escribe ninguna de las tablas de predicción; si una consulta
 * de acá empieza a necesitar escribir, el cálculo le corresponde a ml-svc.
 */
@Repository
@RequiredArgsConstructor
public class PrediccionesConsultas {

    private final NamedParameterJdbcTemplate jdbc;

    public record FilaDia(LocalDate fecha, long cantidad) {
    }

    public record FilaTipoEspacio(Long tipoEspacioId, String nombre, long espacios) {
    }

    /**
     * @param primerDia       primer día con reservas aprobadas del tipo antes de hoy (null si nunca tuvo)
     * @param reservasVentana reservas aprobadas del tipo en la ventana pedida, antes de hoy
     */
    public record FilaHistorialTipo(Long tipoEspacioId, LocalDate primerDia, long reservasVentana) {
    }

    public record FilaTipoDia(Long tipoEspacioId, LocalDate fecha, long cantidad) {
    }

    public record FilaPrediccionEquipo(Long tipoElementoId, LocalDate fecha, double prediccion,
                                       Double bandaInferior, Double bandaSuperior, int comprometidas) {
    }

    /**
     * @param disponible unidades de items activos en estado DISPONIBLE hoy
     * @param total      unidades de items activos en cualquier estado
     */
    public record FilaStock(Long tipoElementoId, String nombre, long disponible, long total) {
    }

    public record FilaTutoriaFutura(Long tutoriaId, String materia, String carrera, String docente, Instant inicio,
                                    String modalidad, String tipo, String espacio, Integer capacidadEspacio,
                                    int cupo) {
    }

    /** {@code probabilidad} es null si el modelo activo no predijo esa inscripción. */
    public record FilaInscripcionFutura(Long tutoriaId, Long inscripcionId, String estudiante, Double probabilidad,
                                        int asistenciasPrevias, int inscripcionesPrevias) {
    }

    // ------------------------------------------------------ reservas por tipo

    /** Tipos de espacio vigentes con cuántos espacios sin borrar tiene cada uno. */
    public List<FilaTipoEspacio> tiposEspacio() {
        String sql = """
                SELECT te.id, te.nombre, COUNT(e.id) AS espacios
                FROM tipo_espacio te
                LEFT JOIN espacio e ON e.tipo_espacio_id = te.id AND e.deleted_at IS NULL
                WHERE te.deleted_at IS NULL AND te.activo IS NOT FALSE
                GROUP BY te.id, te.nombre
                ORDER BY te.nombre
                """;
        return jdbc.query(sql, (rs, i) -> new FilaTipoEspacio(
                rs.getLong("id"), rs.getString("nombre"), entero(rs, "espacios")));
    }

    /**
     * Reservas aprobadas de un tipo por día, de la tabla de hechos: es la misma
     * serie con la que entrena ml-svc, así el histórico del gráfico y el modelo
     * hablan de lo mismo. Sólo trae los días con reservas.
     */
    public List<FilaDia> aprobadasHechosPorTipo(Long tipoEspacioId, LocalDate desde, LocalDate hasta) {
        String sql = """
                SELECT h.fecha, SUM(h.cant_reservas) AS cantidad
                FROM hechos_reserva_diario h
                JOIN espacio e ON e.id = h.espacio_id
                WHERE h.estado = 'APROBADO' AND e.tipo_espacio_id = :tipo
                  AND h.fecha BETWEEN :desde AND :hasta
                GROUP BY h.fecha
                ORDER BY h.fecha
                """;
        MapSqlParameterSource p = new MapSqlParameterSource()
                .addValue("tipo", tipoEspacioId)
                .addValue("desde", desde)
                .addValue("hasta", hasta);
        return jdbc.query(sql, p, (rs, i) -> new FilaDia(fecha(rs, "fecha"), entero(rs, "cantidad")));
    }

    /**
     * Por tipo: primer día con reservas aprobadas y total aprobado desde
     * {@code desdeVentana}, todo antes de {@code hoy}. Con el primer día se
     * sabe cuántos días reales tiene la ventana de un tipo nuevo.
     */
    public List<FilaHistorialTipo> historialPorTipo(LocalDate desdeVentana, LocalDate hoy) {
        String sql = """
                SELECT e.tipo_espacio_id AS tipo_id,
                       MIN(h.fecha)      AS primer_dia,
                       COALESCE(SUM(h.cant_reservas) FILTER (WHERE h.fecha >= :desdeVentana), 0) AS ventana
                FROM hechos_reserva_diario h
                JOIN espacio e ON e.id = h.espacio_id
                WHERE h.estado = 'APROBADO' AND h.fecha < :hoy AND e.tipo_espacio_id IS NOT NULL
                GROUP BY e.tipo_espacio_id
                """;
        MapSqlParameterSource p = new MapSqlParameterSource()
                .addValue("desdeVentana", desdeVentana)
                .addValue("hoy", hoy);
        return jdbc.query(sql, p, (rs, i) -> new FilaHistorialTipo(
                rs.getLong("tipo_id"), fecha(rs, "primer_dia"), entero(rs, "ventana")));
    }

    /**
     * Reservas APROBADAS por tipo y día del campus en [desde, hasta], de la
     * tabla transaccional: es lo ya comprometido del horizonte y la de hechos
     * sólo se recalcula de noche. Con {@code tipoEspacioId} null trae todos.
     */
    public List<FilaTipoDia> reservadasPorTipoYDia(Long tipoEspacioId, LocalDate desde, LocalDate hasta) {
        MapSqlParameterSource p = rango(new Periodo(desde, hasta));
        String filtro = "";
        if (tipoEspacioId != null) {
            filtro = " AND e.tipo_espacio_id = :tipo";
            p.addValue("tipo", tipoEspacioId);
        }
        String sql = """
                SELECT e.tipo_espacio_id AS tipo_id,
                       DATE(r.inicio AT TIME ZONE %s) AS fecha,
                       COUNT(*) AS cantidad
                FROM reserva r
                JOIN espacio e ON e.id = r.espacio_id
                WHERE r.estado = 'APROBADO' AND r.inicio >= :desde AND r.inicio < :hasta
                  AND e.tipo_espacio_id IS NOT NULL
                """.formatted(ZONA) + filtro + """

                GROUP BY 1, 2
                ORDER BY 1, 2
                """;
        return jdbc.query(sql, p, (rs, i) -> new FilaTipoDia(
                rs.getLong("tipo_id"), fecha(rs, "fecha"), entero(rs, "cantidad")));
    }

    // ------------------------------------------------------------- inventario

    /** Predicciones de pico de equipos del modelo desde {@code desde} inclusive. */
    public List<FilaPrediccionEquipo> prediccionesEquipo(Long modeloId, LocalDate desde) {
        String sql = """
                SELECT p.tipo_elemento_id, p.fecha_objetivo, p.prediccion, p.banda_inferior,
                       p.banda_superior, p.comprometidas
                FROM prediccion_demanda_equipo p
                WHERE p.modelo_id = :modeloId AND p.fecha_objetivo >= :desde
                ORDER BY p.tipo_elemento_id, p.fecha_objetivo
                """;
        MapSqlParameterSource p = new MapSqlParameterSource()
                .addValue("modeloId", modeloId)
                .addValue("desde", desde);
        return jdbc.query(sql, p, (rs, i) -> new FilaPrediccionEquipo(
                rs.getLong("tipo_elemento_id"), fecha(rs, "fecha_objetivo"), decimal(rs, "prediccion"),
                decimalONull(rs, "banda_inferior"), decimalONull(rs, "banda_superior"),
                rs.getInt("comprometidas")));
    }

    /**
     * Stock de hoy por tipo de elemento. Se lee en vivo y no del momento del
     * entrenamiento: si llegaron proyectores ayer, el riesgo tiene que bajar
     * sin esperar al próximo reentrenamiento.
     */
    public List<FilaStock> stockPorTipo() {
        String sql = """
                SELECT t.id, t.nombre,
                       COALESCE(SUM(i.cantidad) FILTER (WHERE i.estado = 'DISPONIBLE'), 0) AS disponible,
                       COALESCE(SUM(i.cantidad), 0)                                        AS total
                FROM tipo_elemento t
                LEFT JOIN inventario_item i ON i.tipo_elemento_id = t.id
                                           AND i.activo = TRUE AND i.deleted_at IS NULL
                GROUP BY t.id, t.nombre
                """;
        return jdbc.query(sql, (rs, i) -> new FilaStock(
                rs.getLong("id"), rs.getString("nombre"), entero(rs, "disponible"), entero(rs, "total")));
    }

    // -------------------------------------------------------------- académico

    /** Tutorías que todavía no empezaron, sin borrar ni canceladas, por inicio. */
    public List<FilaTutoriaFutura> tutoriasFuturas(Instant ahora) {
        String sql = """
                SELECT t.id, m.nombre AS materia, c.nombre AS carrera, u.nombre AS docente, t.inicio,
                       t.modalidad, t.tipo, e.nombre AS espacio, e.capacidad AS capacidad_espacio, t.cupo
                FROM tutoria t
                JOIN materia m ON m.id = t.materia_id
                LEFT JOIN carrera c ON c.id = m.carrera_id
                LEFT JOIN usuario u ON u.id = t.docente_id
                LEFT JOIN espacio e ON e.id = t.espacio_id
                WHERE t.deleted_at IS NULL AND t.estado <> 'CANCELADA' AND t.inicio >= :ahora
                ORDER BY t.inicio, t.id
                """;
        MapSqlParameterSource p = new MapSqlParameterSource("ahora", instante(ahora));
        return jdbc.query(sql, p, (rs, i) -> new FilaTutoriaFutura(
                rs.getLong("id"), rs.getString("materia"), rs.getString("carrera"), rs.getString("docente"),
                rs.getObject("inicio", OffsetDateTime.class).toInstant(), rs.getString("modalidad"),
                rs.getString("tipo"), rs.getString("espacio"), enteroONull(rs, "capacidad_espacio"),
                rs.getInt("cupo")));
    }

    /**
     * Inscripciones vigentes de las tutorías futuras con la probabilidad del
     * modelo (si la predijo) y el historial del estudiante en tutorías que ya
     * terminaron. Mismo criterio de inscripción válida que el entrenamiento:
     * sin borrar, sin canceladas y sin lista de espera.
     */
    public List<FilaInscripcionFutura> inscripcionesFuturas(Instant ahora, Long modeloId) {
        String sql = """
                WITH previas AS (
                  SELECT tr.estudiante_id,
                         COUNT(*)                                     AS inscripciones,
                         COUNT(*) FILTER (WHERE tr.estado = 'ASISTIO') AS asistencias
                  FROM tutoria_reserva tr
                  JOIN tutoria t ON t.id = tr.tutoria_id
                  WHERE tr.deleted_at IS NULL AND tr.estado NOT IN ('CANCELADA', 'ESPERA')
                    AND t.deleted_at IS NULL AND t.estado <> 'CANCELADA' AND t.fin < :ahora
                  GROUP BY tr.estudiante_id
                )
                SELECT tr.tutoria_id, tr.id AS inscripcion_id, u.nombre AS estudiante, pa.probabilidad,
                       COALESCE(pv.asistencias, 0)   AS asistencias_previas,
                       COALESCE(pv.inscripciones, 0) AS inscripciones_previas
                FROM tutoria_reserva tr
                JOIN tutoria t ON t.id = tr.tutoria_id
                LEFT JOIN usuario u ON u.id = tr.estudiante_id
                LEFT JOIN prediccion_asistencia pa ON pa.tutoria_reserva_id = tr.id AND pa.modelo_id = :modeloId
                LEFT JOIN previas pv ON pv.estudiante_id = tr.estudiante_id
                WHERE tr.deleted_at IS NULL AND tr.estado NOT IN ('CANCELADA', 'ESPERA')
                  AND t.deleted_at IS NULL AND t.estado <> 'CANCELADA' AND t.inicio >= :ahora
                ORDER BY tr.tutoria_id, pa.probabilidad DESC NULLS LAST, u.nombre
                """;
        MapSqlParameterSource p = new MapSqlParameterSource()
                .addValue("ahora", instante(ahora))
                .addValue("modeloId", modeloId);
        return jdbc.query(sql, p, (rs, i) -> new FilaInscripcionFutura(
                rs.getLong("tutoria_id"), rs.getLong("inscripcion_id"), rs.getString("estudiante"),
                decimalONull(rs, "probabilidad"), rs.getInt("asistencias_previas"),
                rs.getInt("inscripciones_previas")));
    }
}
