package com.utec.backend.repository;

import com.utec.backend.dto.stats.AprobacionReservasDto;
import com.utec.backend.dto.stats.ExternosDto;
import com.utec.backend.dto.stats.FiltroReservas;
import com.utec.backend.dto.stats.OpcionesFiltroDto;
import com.utec.backend.dto.stats.Periodo;
import com.utec.backend.dto.stats.ResumenReservasDto;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

import static com.utec.backend.repository.ConsultasSql.*;

/**
 * Consultas de las estadísticas de reservas, todas en vivo sobre la tabla
 * transaccional y con los filtros comunes (edificio, espacio, tipo de espacio,
 * rol de quien pide y carrera).
 *
 * Las tablas de hechos no guardan rol ni tipo de espacio, así que no pueden
 * responder con filtros; con los volúmenes del campus leer {@code reserva}
 * directo tarda milisegundos.
 *
 * Todas cuentan las reservas por su inicio: [desde, hasta) en instantes del
 * campus, que arma {@link Periodo}.
 */
@Repository
@RequiredArgsConstructor
public class EstadisticasReservaConsultas {

    private static final String DESDE_RESERVAS = """
            FROM reserva r
            JOIN espacio e ON e.id = r.espacio_id
            WHERE r.inicio >= :desde AND r.inicio < :hasta
            """;

    private final NamedParameterJdbcTemplate jdbc;

    public record FilaSerie(LocalDate periodo, String estado, long cantidad) {
    }

    public record FilaOcupacion(Long espacioId, String espacioNombre, String edificioNombre, double horas,
                                long reservas) {
    }

    public record FilaCarrera(Long carreraId, String nombre, long aprobadas, long canceladas, long pendientes,
                              long canceladasTarde) {
    }

    public record FilaEdificio(Long edificioId, String nombre, long reservas) {
    }

    /** {@code diaSemana} 0 = domingo, como EXTRACT(DOW). */
    public record FilaHeatmap(int diaSemana, int hora, long cantidad) {
    }

    public record FilaTopUsuario(Long usuarioId, String nombre, String email, String rol, long total,
                                 long aprobadas, long canceladas) {
    }

    /** Totales del tiempo de respuesta; las medianas vienen en null si no hay datos. */
    public record FilaRespuesta(long resueltas, long conDato, Double mediana, Double p90, long dentroDe24h) {
    }

    /** Conteos de un tramo: {@code valores} en el orden que documenta cada consulta. */
    public record FilaTramo(int tramo, long[] valores) {
    }

    // ---------------------------------------------------------------- resumen

    public ResumenReservasDto.Totales totales(Periodo periodo, Instant ahora, FiltroReservas f) {
        MapSqlParameterSource p = rango(periodo).addValue("ahora", instante(ahora));
        String sql = """
                SELECT
                  COUNT(*)                                                                     AS total,
                  COUNT(*) FILTER (WHERE r.estado = 'APROBADO')                                AS aprobadas,
                  COUNT(*) FILTER (WHERE r.estado = 'PENDIENTE')                               AS pendientes,
                  COUNT(*) FILTER (WHERE r.estado = 'PENDIENTE' AND r.inicio < :ahora)         AS pendientes_vencidas,
                  COUNT(*) FILTER (WHERE r.estado = 'CANCELADO')                               AS canceladas,
                  COALESCE(SUM(EXTRACT(EPOCH FROM (r.fin - r.inicio)))
                           FILTER (WHERE r.estado = 'APROBADO'), 0) / 3600.0                   AS horas_aprobadas,
                  COALESCE(AVG(EXTRACT(EPOCH FROM (r.fin - r.inicio)))
                           FILTER (WHERE r.estado = 'APROBADO'), 0) / 3600.0                   AS duracion_promedio,
                  COALESCE(AVG(GREATEST(EXTRACT(EPOCH FROM (r.inicio - r.created_at)), 0))
                           FILTER (WHERE r.estado = 'APROBADO'), 0) / 86400.0                  AS anticipacion_dias,
                  COUNT(DISTINCT r.espacio_id) FILTER (WHERE r.estado = 'APROBADO')            AS espacios_usados,
                  COUNT(DISTINCT r.usuario_id)                                                 AS usuarios
                """ + DESDE_RESERVAS + filtroReserva(f, p);
        return jdbc.queryForObject(sql, p, (rs, i) -> new ResumenReservasDto.Totales(
                entero(rs, "total"), entero(rs, "aprobadas"), entero(rs, "pendientes"),
                entero(rs, "pendientes_vencidas"), entero(rs, "canceladas"), decimal(rs, "horas_aprobadas"),
                decimal(rs, "duracion_promedio"), decimal(rs, "anticipacion_dias"),
                entero(rs, "espacios_usados"), entero(rs, "usuarios")));
    }

    /** Reservas por estado agrupadas por {@code unidad} ('day', 'week' o 'month'; semanas desde el lunes). */
    public List<FilaSerie> seriePorEstado(String unidad, Periodo periodo, FiltroReservas f) {
        MapSqlParameterSource p = rango(periodo).addValue("unidad", unidad);
        String sql = """
                SELECT CAST(date_trunc(:unidad, r.inicio AT TIME ZONE %s) AS date) AS periodo,
                       r.estado, COUNT(*) AS cantidad
                """.formatted(ZONA) + DESDE_RESERVAS + filtroReserva(f, p) + " GROUP BY 1, 2";
        return jdbc.query(sql, p, (rs, i) ->
                new FilaSerie(fecha(rs, "periodo"), rs.getString("estado"), entero(rs, "cantidad")));
    }

    public List<ResumenReservasDto.Conteo> porRol(Periodo periodo, FiltroReservas f) {
        MapSqlParameterSource p = rango(periodo);
        String sql = """
                SELECT u.rol_app AS rol, COUNT(*) AS total, COUNT(*) FILTER (WHERE r.estado = 'APROBADO') AS aprobadas
                FROM reserva r
                JOIN espacio e ON e.id = r.espacio_id
                JOIN usuario u ON u.id = r.usuario_id
                WHERE r.inicio >= :desde AND r.inicio < :hasta
                """ + filtroReserva(f, p) + " GROUP BY u.rol_app ORDER BY 2 DESC";
        return jdbc.query(sql, p, (rs, i) ->
                new ResumenReservasDto.Conteo(rs.getString("rol"), entero(rs, "total"), entero(rs, "aprobadas")));
    }

    /** Espacios activos que pasan los filtros de espacio (rol y carrera no aplican a un espacio). */
    public long contarEspacios(FiltroReservas f) {
        MapSqlParameterSource p = new MapSqlParameterSource();
        String sql = "SELECT COUNT(*) FROM espacio e WHERE e.deleted_at IS NULL" + filtroEspacio(f, p);
        Long total = jdbc.queryForObject(sql, p, Long.class);
        return total == null ? 0 : total;
    }

    // ------------------------------------------------------ vistas existentes

    /**
     * Horas y reservas APROBADAS de cada espacio activo, también los que no
     * tuvieron ninguna: esos son justamente los subutilizados.
     */
    public List<FilaOcupacion> ocupacion(Periodo periodo, FiltroReservas f) {
        MapSqlParameterSource p = rango(periodo);
        String sql = """
                SELECT e.id AS espacio_id, e.nombre AS espacio_nombre, ed.nombre AS edificio_nombre,
                       COALESCE(SUM(EXTRACT(EPOCH FROM (r.fin - r.inicio))), 0) / 3600.0 AS horas,
                       COUNT(r.id) AS reservas
                FROM espacio e
                LEFT JOIN edificio ed ON ed.id = e.edificio_id
                LEFT JOIN reserva r ON r.espacio_id = e.id AND r.estado = 'APROBADO'
                                   AND r.inicio >= :desde AND r.inicio < :hasta
                """ + filtroSolicitante(f, p) + """

                WHERE e.deleted_at IS NULL
                """ + filtroEspacio(f, p) + """

                GROUP BY e.id, e.nombre, ed.nombre
                ORDER BY horas DESC, e.nombre
                """;
        return jdbc.query(sql, p, (rs, i) -> new FilaOcupacion(idONull(rs, "espacio_id"),
                rs.getString("espacio_nombre"), rs.getString("edificio_nombre"), decimal(rs, "horas"),
                entero(rs, "reservas")));
    }

    /** Canceladas tarde: con menos de 24 h entre la última modificación y el inicio. */
    public List<FilaCarrera> porCarrera(Periodo periodo, FiltroReservas f) {
        MapSqlParameterSource p = rango(periodo);
        String sql = """
                SELECT r.carrera_id, c.nombre,
                       COUNT(*) FILTER (WHERE r.estado = 'APROBADO')  AS aprobadas,
                       COUNT(*) FILTER (WHERE r.estado = 'CANCELADO') AS canceladas,
                       COUNT(*) FILTER (WHERE r.estado = 'PENDIENTE') AS pendientes,
                       COUNT(*) FILTER (WHERE r.estado = 'CANCELADO'
                                          AND r.inicio - r.updated_at < INTERVAL '24 hours') AS tardias
                FROM reserva r
                JOIN espacio e ON e.id = r.espacio_id
                LEFT JOIN carrera c ON c.id = r.carrera_id
                WHERE r.inicio >= :desde AND r.inicio < :hasta
                """ + filtroReserva(f, p) + " GROUP BY r.carrera_id, c.nombre ORDER BY aprobadas DESC";
        return jdbc.query(sql, p, (rs, i) -> new FilaCarrera(idONull(rs, "carrera_id"), rs.getString("nombre"),
                entero(rs, "aprobadas"), entero(rs, "canceladas"), entero(rs, "pendientes"),
                entero(rs, "tardias")));
    }

    /** Reservas APROBADAS por edificio. */
    public List<FilaEdificio> porEdificio(Periodo periodo, FiltroReservas f) {
        MapSqlParameterSource p = rango(periodo);
        String sql = """
                SELECT e.edificio_id, ed.nombre, COUNT(*) AS reservas
                FROM reserva r
                JOIN espacio e ON e.id = r.espacio_id
                LEFT JOIN edificio ed ON ed.id = e.edificio_id
                WHERE r.inicio >= :desde AND r.inicio < :hasta AND r.estado = 'APROBADO'
                """ + filtroReserva(f, p) + " GROUP BY e.edificio_id, ed.nombre ORDER BY reservas DESC";
        return jdbc.query(sql, p, (rs, i) ->
                new FilaEdificio(idONull(rs, "edificio_id"), rs.getString("nombre"), entero(rs, "reservas")));
    }

    /** Reservas APROBADAS por día de semana y hora de inicio, en la hora del campus. */
    public List<FilaHeatmap> heatmap(Periodo periodo, FiltroReservas f) {
        MapSqlParameterSource p = rango(periodo);
        String sql = """
                SELECT CAST(EXTRACT(DOW  FROM r.inicio AT TIME ZONE %1$s) AS int) AS dia_semana,
                       CAST(EXTRACT(HOUR FROM r.inicio AT TIME ZONE %1$s) AS int) AS hora,
                       COUNT(*) AS cant
                """.formatted(ZONA) + DESDE_RESERVAS + " AND r.estado = 'APROBADO'" + filtroReserva(f, p)
                + " GROUP BY 1, 2 ORDER BY 1, 2";
        return jdbc.query(sql, p, (rs, i) ->
                new FilaHeatmap(rs.getInt("dia_semana"), rs.getInt("hora"), entero(rs, "cant")));
    }

    public List<FilaTopUsuario> topUsuarios(Periodo periodo, FiltroReservas f, int limite) {
        MapSqlParameterSource p = rango(periodo).addValue("limite", limite);
        String sql = """
                SELECT r.usuario_id, u.nombre, u.email, u.rol_app,
                       COUNT(*)                                       AS total,
                       COUNT(*) FILTER (WHERE r.estado = 'APROBADO')  AS aprobadas,
                       COUNT(*) FILTER (WHERE r.estado = 'CANCELADO') AS canceladas
                FROM reserva r
                JOIN espacio e ON e.id = r.espacio_id
                JOIN usuario u ON u.id = r.usuario_id
                WHERE r.inicio >= :desde AND r.inicio < :hasta
                """ + filtroReserva(f, p) + """

                GROUP BY r.usuario_id, u.nombre, u.email, u.rol_app
                ORDER BY total DESC
                LIMIT :limite
                """;
        return jdbc.query(sql, p, (rs, i) -> new FilaTopUsuario(idONull(rs, "usuario_id"), rs.getString("nombre"),
                rs.getString("email"), rs.getString("rol_app"), entero(rs, "total"), entero(rs, "aprobadas"),
                entero(rs, "canceladas")));
    }

    // --------------------------------------------------------------- opciones

    public OpcionesFiltroDto opciones() {
        MapSqlParameterSource sinParametros = new MapSqlParameterSource();
        List<OpcionesFiltroDto.Opcion> edificios = jdbc.query("""
                SELECT id, nombre FROM edificio
                WHERE deleted_at IS NULL AND COALESCE(activo, TRUE)
                ORDER BY nombre
                """, sinParametros, (rs, i) -> new OpcionesFiltroDto.Opcion(rs.getLong("id"), rs.getString("nombre")));
        List<OpcionesFiltroDto.EspacioOpcion> espacios = jdbc.query("""
                SELECT id, nombre, edificio_id, tipo_espacio_id FROM espacio
                WHERE deleted_at IS NULL
                ORDER BY nombre
                """, sinParametros, (rs, i) -> new OpcionesFiltroDto.EspacioOpcion(rs.getLong("id"),
                rs.getString("nombre"), idONull(rs, "edificio_id"), idONull(rs, "tipo_espacio_id")));
        List<OpcionesFiltroDto.Opcion> tipos = jdbc.query("""
                SELECT id, nombre FROM tipo_espacio
                WHERE deleted_at IS NULL AND COALESCE(activo, TRUE)
                ORDER BY nombre
                """, sinParametros, (rs, i) -> new OpcionesFiltroDto.Opcion(rs.getLong("id"), rs.getString("nombre")));
        // Los roles salen de quienes efectivamente reservaron: ofrecer MANTENIMIENTO
        // sólo para mostrar una pantalla vacía no le sirve a nadie.
        List<String> roles = jdbc.queryForList("""
                SELECT DISTINCT u.rol_app FROM usuario u
                WHERE u.rol_app IS NOT NULL AND EXISTS (SELECT 1 FROM reserva r WHERE r.usuario_id = u.id)
                ORDER BY 1
                """, sinParametros, String.class);
        List<OpcionesFiltroDto.Opcion> carreras = jdbc.query("""
                SELECT id, nombre FROM carrera WHERE deleted_at IS NULL ORDER BY nombre
                """, sinParametros, (rs, i) -> new OpcionesFiltroDto.Opcion(rs.getLong("id"), rs.getString("nombre")));
        return new OpcionesFiltroDto(edificios, espacios, tipos, roles, carreras);
    }

    // ------------------------------------------------------------- aprobación

    /**
     * Base de las consultas de aprobación. {@code con_dato}: resuelta con un
     * tiempo de respuesta real. Las creadas ya aprobadas tienen resuelta_en =
     * created_at y no son la respuesta de nadie.
     */
    private static String baseAprobacion(FiltroReservas f, MapSqlParameterSource p) {
        return """
                WITH base AS (
                  SELECT r.estado, r.analista_id, r.inicio, r.created_at,
                         (r.estado IN ('APROBADO', 'CANCELADO') AND r.resuelta_en IS NOT NULL
                            AND r.resuelta_en <> r.created_at) AS con_dato,
                         GREATEST(EXTRACT(EPOCH FROM (r.resuelta_en - r.created_at)), 0) / 3600.0 AS horas_respuesta
                """ + DESDE_RESERVAS + filtroReserva(f, p) + "\n)\n";
    }

    public FilaRespuesta respuesta(Periodo periodo, FiltroReservas f) {
        MapSqlParameterSource p = rango(periodo);
        String sql = baseAprobacion(f, p) + """
                SELECT COUNT(*) FILTER (WHERE estado IN ('APROBADO', 'CANCELADO'))                     AS resueltas,
                       COUNT(*) FILTER (WHERE con_dato)                                                AS con_dato,
                       percentile_cont(0.5) WITHIN GROUP (ORDER BY horas_respuesta) FILTER (WHERE con_dato) AS mediana,
                       percentile_cont(0.9) WITHIN GROUP (ORDER BY horas_respuesta) FILTER (WHERE con_dato) AS p90,
                       COUNT(*) FILTER (WHERE con_dato AND horas_respuesta < 24)                       AS dentro_24h
                FROM base
                """;
        return jdbc.queryForObject(sql, p, (rs, i) -> new FilaRespuesta(entero(rs, "resueltas"),
                entero(rs, "con_dato"), decimalONull(rs, "mediana"), decimalONull(rs, "p90"),
                entero(rs, "dentro_24h")));
    }

    /** @return por tramo de horas de respuesta: valores = [cantidad] */
    public List<FilaTramo> distribucionRespuesta(Periodo periodo, FiltroReservas f, double[] limitesHoras) {
        MapSqlParameterSource p = rango(periodo);
        String sql = baseAprobacion(f, p)
                + "SELECT " + tramo("horas_respuesta", limitesHoras) + " AS tramo, COUNT(*) AS cantidad"
                + " FROM base WHERE con_dato GROUP BY 1";
        return jdbc.query(sql, p, (rs, i) -> new FilaTramo(rs.getInt("tramo"), new long[]{entero(rs, "cantidad")}));
    }

    /** Las reservas sin analista asignado no se atribuyen a nadie. */
    public List<AprobacionReservasDto.Analista> analistas(Periodo periodo, Instant ahora, FiltroReservas f) {
        MapSqlParameterSource p = rango(periodo).addValue("ahora", instante(ahora));
        String sql = baseAprobacion(f, p) + """
                SELECT b.analista_id, a.nombre,
                       COUNT(*)                                                           AS asignadas,
                       COUNT(*) FILTER (WHERE b.estado = 'PENDIENTE')                     AS pendientes,
                       COUNT(*) FILTER (WHERE b.estado = 'PENDIENTE' AND b.inicio < :ahora) AS vencidas,
                       COUNT(*) FILTER (WHERE b.estado = 'APROBADO')                      AS aprobadas,
                       COUNT(*) FILTER (WHERE b.estado = 'CANCELADO')                     AS canceladas,
                       percentile_cont(0.5) WITHIN GROUP (ORDER BY b.horas_respuesta) FILTER (WHERE b.con_dato) AS mediana
                FROM base b
                JOIN usuario a ON a.id = b.analista_id
                GROUP BY b.analista_id, a.nombre
                ORDER BY asignadas DESC, a.nombre
                """;
        return jdbc.query(sql, p, (rs, i) -> new AprobacionReservasDto.Analista(idONull(rs, "analista_id"),
                rs.getString("nombre"), entero(rs, "asignadas"), entero(rs, "pendientes"), entero(rs, "vencidas"),
                entero(rs, "aprobadas"), entero(rs, "canceladas"), decimalONull(rs, "mediana")));
    }

    /**
     * Días del campus entre que se pidió y el inicio.
     *
     * @return por tramo: valores = [total, aprobadas, canceladas, pendientes]
     */
    public List<FilaTramo> antelacion(Periodo periodo, FiltroReservas f, double[] limitesDias) {
        MapSqlParameterSource p = rango(periodo);
        String dias = "(CAST(inicio AT TIME ZONE %1$s AS date) - CAST(created_at AT TIME ZONE %1$s AS date))"
                .formatted(ZONA);
        String sql = baseAprobacion(f, p) + "SELECT " + tramo(dias, limitesDias) + """
                 AS tramo,
                       COUNT(*) AS total,
                       COUNT(*) FILTER (WHERE estado = 'APROBADO')  AS aprobadas,
                       COUNT(*) FILTER (WHERE estado = 'CANCELADO') AS canceladas,
                       COUNT(*) FILTER (WHERE estado = 'PENDIENTE') AS pendientes
                FROM base GROUP BY 1
                """;
        return jdbc.query(sql, p, (rs, i) -> new FilaTramo(rs.getInt("tramo"), new long[]{
                entero(rs, "total"), entero(rs, "aprobadas"), entero(rs, "canceladas"), entero(rs, "pendientes")}));
    }

    /**
     * Pendientes por horas desde que se pidieron hasta ahora.
     *
     * @return por tramo: valores = [cantidad, vencidas]
     */
    public List<FilaTramo> pendientesPorAntiguedad(Periodo periodo, Instant ahora, FiltroReservas f,
                                                   double[] limitesHoras) {
        MapSqlParameterSource p = rango(periodo).addValue("ahora", instante(ahora));
        String horas = "(EXTRACT(EPOCH FROM (CAST(:ahora AS timestamptz) - created_at)) / 3600.0)";
        String sql = baseAprobacion(f, p) + "SELECT " + tramo(horas, limitesHoras) + """
                 AS tramo,
                       COUNT(*) AS cantidad,
                       COUNT(*) FILTER (WHERE inicio < :ahora) AS vencidas
                FROM base WHERE estado = 'PENDIENTE' GROUP BY 1
                """;
        return jdbc.query(sql, p, (rs, i) -> new FilaTramo(rs.getInt("tramo"),
                new long[]{entero(rs, "cantidad"), entero(rs, "vencidas")}));
    }

    // -------------------------------------------------------------- externos

    private static final String DESDE_EXTERNOS = """
            FROM evento_externo x
            JOIN reserva r ON r.id = x.reserva_id
            JOIN espacio e ON e.id = r.espacio_id
            WHERE r.inicio >= :desde AND r.inicio < :hasta
            """;

    public long contarExternos(Periodo periodo, FiltroReservas f) {
        MapSqlParameterSource p = rango(periodo);
        Long total = jdbc.queryForObject("SELECT COUNT(*) " + DESDE_EXTERNOS + filtroReserva(f, p), p, Long.class);
        return total == null ? 0 : total;
    }

    /** Organizadores sin nombre se agrupan juntos para no perderlos del conteo. */
    public List<ExternosDto.Organizador> organizadoresExternos(Periodo periodo, FiltroReservas f, int limite) {
        MapSqlParameterSource p = rango(periodo).addValue("limite", limite);
        String sql = """
                SELECT COALESCE(NULLIF(TRIM(x.organizador), ''), 'Sin organizador') AS organizador,
                       COUNT(*) AS eventos,
                       COUNT(*) FILTER (WHERE r.estado = 'APROBADO')  AS aprobadas,
                       COUNT(*) FILTER (WHERE r.estado = 'CANCELADO') AS canceladas,
                       COALESCE(SUM(EXTRACT(EPOCH FROM (r.fin - r.inicio)))
                                FILTER (WHERE r.estado = 'APROBADO'), 0) / 3600.0 AS horas,
                       COUNT(DISTINCT r.espacio_id) AS espacios
                """ + DESDE_EXTERNOS + filtroReserva(f, p) + """

                GROUP BY 1
                ORDER BY eventos DESC, organizador
                LIMIT :limite
                """;
        return jdbc.query(sql, p, (rs, i) -> new ExternosDto.Organizador(rs.getString("organizador"),
                entero(rs, "eventos"), entero(rs, "aprobadas"), entero(rs, "canceladas"), decimal(rs, "horas"),
                entero(rs, "espacios")));
    }
}
