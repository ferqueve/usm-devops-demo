package com.utec.backend.repository;

import com.utec.backend.dto.stats.AcademicoDto;
import com.utec.backend.dto.stats.FiltroReservas;
import com.utec.backend.dto.stats.Periodo;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;

import static com.utec.backend.repository.ConsultasSql.*;

/**
 * Consultas de la capa académica: tutorías y eventos.
 *
 * Los filtros de edificio, espacio y tipo aplican por el espacio de la sesión
 * (las virtuales sin espacio quedan afuera al filtrar). La carrera sale de la
 * materia de la tutoría; los eventos no tienen carrera. El rol no aplica.
 */
@Repository
@RequiredArgsConstructor
public class EstadisticasAcademicoConsultas {

    private final NamedParameterJdbcTemplate jdbc;

    /**
     * Tutorías del período con sus inscripciones y feedback ya agregados, una
     * fila por tutoría. Las inscripciones cuentan sin borrar, sin canceladas y
     * sin lista de espera.
     */
    private static String tutorias(FiltroReservas f, MapSqlParameterSource p) {
        String carrera = "";
        if (f.carreraId() != null) {
            carrera = " AND m.carrera_id = :carreraId";
            p.addValue("carreraId", f.carreraId());
        }
        return """
                WITH tut AS (
                  SELECT t.id, t.materia_id, t.modalidad, t.tipo, t.cupo, t.inicio, t.fin,
                         COALESCE(ins.agendadas, 0)  AS agendadas,
                         COALESCE(ins.asistieron, 0) AS asistieron,
                         COALESCE(fb.suma, 0)        AS rating_suma,
                         COALESCE(fb.n, 0)           AS feedbacks
                  FROM tutoria t
                  JOIN materia m ON m.id = t.materia_id
                  LEFT JOIN espacio e ON e.id = t.espacio_id
                  LEFT JOIN (SELECT tutoria_id, COUNT(*) AS agendadas,
                                    COUNT(*) FILTER (WHERE estado = 'ASISTIO') AS asistieron
                             FROM tutoria_reserva
                             WHERE deleted_at IS NULL AND estado NOT IN ('CANCELADA', 'ESPERA')
                             GROUP BY tutoria_id) ins ON ins.tutoria_id = t.id
                  LEFT JOIN (SELECT tutoria_id, SUM(rating) AS suma, COUNT(*) AS n
                             FROM tutoria_feedback WHERE deleted_at IS NULL
                             GROUP BY tutoria_id) fb ON fb.tutoria_id = t.id
                  WHERE t.deleted_at IS NULL AND t.estado <> 'CANCELADA'
                    AND t.inicio >= :desde AND t.inicio < :hasta
                """ + filtroEspacio(f, p) + carrera + "\n)\n";
    }

    /**
     * @param inscripcionesPasadas inscripciones de tutorías que ya terminaron (denominador de asistencia)
     */
    public record FilaTutorias(long total, long presenciales, long virtuales, long grupales, long individuales,
                               long cupoTotal, long agendadas, long asistieron, long inscripcionesPasadas,
                               long asistieronPasadas, Double ratingPromedio, long feedbacks) {
    }

    public FilaTutorias resumenTutorias(Periodo periodo, Instant ahora, FiltroReservas f) {
        MapSqlParameterSource p = rango(periodo).addValue("ahora", instante(ahora));
        String sql = tutorias(f, p) + """
                SELECT COUNT(*)                                          AS total,
                       COUNT(*) FILTER (WHERE modalidad = 'PRESENCIAL')  AS presenciales,
                       COUNT(*) FILTER (WHERE modalidad = 'VIRTUAL')     AS virtuales,
                       COUNT(*) FILTER (WHERE tipo = 'GRUPAL')           AS grupales,
                       COUNT(*) FILTER (WHERE tipo = 'INDIVIDUAL')       AS individuales,
                       COALESCE(SUM(cupo), 0)                            AS cupo_total,
                       COALESCE(SUM(agendadas), 0)                       AS agendadas,
                       COALESCE(SUM(asistieron), 0)                      AS asistieron,
                       COALESCE(SUM(agendadas) FILTER (WHERE fin < :ahora), 0)  AS agendadas_pasadas,
                       COALESCE(SUM(asistieron) FILTER (WHERE fin < :ahora), 0) AS asistieron_pasadas,
                       SUM(rating_suma) * 1.0 / NULLIF(SUM(feedbacks), 0) AS rating,
                       COALESCE(SUM(feedbacks), 0)                       AS feedbacks
                FROM tut
                """;
        return jdbc.queryForObject(sql, p, (rs, i) -> new FilaTutorias(entero(rs, "total"),
                entero(rs, "presenciales"), entero(rs, "virtuales"), entero(rs, "grupales"),
                entero(rs, "individuales"), entero(rs, "cupo_total"), entero(rs, "agendadas"),
                entero(rs, "asistieron"), entero(rs, "agendadas_pasadas"), entero(rs, "asistieron_pasadas"),
                decimalONull(rs, "rating"), entero(rs, "feedbacks")));
    }

    public List<AcademicoDto.PorMateria> porMateria(Periodo periodo, FiltroReservas f, int limite) {
        MapSqlParameterSource p = rango(periodo).addValue("limite", limite);
        String sql = tutorias(f, p) + """
                SELECT m.id, m.nombre, c.nombre AS carrera_nombre,
                       COUNT(*)                 AS tutorias,
                       SUM(tut.agendadas)       AS agendadas,
                       SUM(tut.asistieron)      AS asistieron,
                       SUM(tut.rating_suma) * 1.0 / NULLIF(SUM(tut.feedbacks), 0) AS rating
                FROM tut
                JOIN materia m ON m.id = tut.materia_id
                LEFT JOIN carrera c ON c.id = m.carrera_id
                GROUP BY m.id, m.nombre, c.nombre
                ORDER BY agendadas DESC, m.nombre
                LIMIT :limite
                """;
        return jdbc.query(sql, p, (rs, i) -> new AcademicoDto.PorMateria(idONull(rs, "id"), rs.getString("nombre"),
                rs.getString("carrera_nombre"), entero(rs, "tutorias"), entero(rs, "agendadas"),
                entero(rs, "asistieron"), decimalONull(rs, "rating")));
    }

    /** Sólo las semanas con tutorías; el servicio completa las vacías. */
    public List<AcademicoDto.PorSemana> porSemana(Periodo periodo, FiltroReservas f) {
        MapSqlParameterSource p = rango(periodo);
        String sql = tutorias(f, p) + """
                SELECT CAST(date_trunc('week', inicio AT TIME ZONE %s) AS date) AS semana,
                       COUNT(*) AS tutorias, SUM(agendadas) AS agendadas, SUM(asistieron) AS asistieron
                FROM tut GROUP BY 1
                """.formatted(ZONA);
        return jdbc.query(sql, p, (rs, i) -> new AcademicoDto.PorSemana(fecha(rs, "semana"),
                entero(rs, "tutorias"), entero(rs, "agendadas"), entero(rs, "asistieron")));
    }

    // ---------------------------------------------------------------- eventos

    private static String eventos(FiltroReservas f, MapSqlParameterSource p) {
        return """
                WITH ev AS (
                  SELECT ev.id, ev.titulo, ev.tipo, ev.inicio, ev.cupo, e.nombre AS espacio_nombre,
                         COALESCE(ins.n, 0) AS inscriptos,
                         COALESCE(fb.suma, 0) AS rating_suma,
                         COALESCE(fb.n, 0) AS feedbacks
                  FROM evento ev
                  LEFT JOIN espacio e ON e.id = ev.espacio_id
                  LEFT JOIN (SELECT evento_id, COUNT(*) AS n FROM evento_inscripcion
                             WHERE deleted_at IS NULL AND estado IN ('INSCRITO', 'ASISTIO')
                             GROUP BY evento_id) ins ON ins.evento_id = ev.id
                  LEFT JOIN (SELECT evento_id, SUM(rating) AS suma, COUNT(*) AS n FROM evento_feedback
                             WHERE deleted_at IS NULL GROUP BY evento_id) fb ON fb.evento_id = ev.id
                  WHERE ev.deleted_at IS NULL AND ev.estado NOT IN ('BORRADOR', 'CANCELADO')
                    AND ev.inicio >= :desde AND ev.inicio < :hasta
                """ + filtroEspacio(f, p) + "\n)\n";
    }

    public record FilaEventos(long total, long inscripciones, long cupoTotal, Double ratingPromedio) {
    }

    public FilaEventos resumenEventos(Periodo periodo, FiltroReservas f) {
        MapSqlParameterSource p = rango(periodo);
        String sql = eventos(f, p) + """
                SELECT COUNT(*) AS total, COALESCE(SUM(inscriptos), 0) AS inscripciones,
                       COALESCE(SUM(cupo), 0) AS cupo_total,
                       SUM(rating_suma) * 1.0 / NULLIF(SUM(feedbacks), 0) AS rating
                FROM ev
                """;
        return jdbc.queryForObject(sql, p, (rs, i) -> new FilaEventos(entero(rs, "total"),
                entero(rs, "inscripciones"), entero(rs, "cupo_total"), decimalONull(rs, "rating")));
    }

    public List<AcademicoDto.EventoFila> listaEventos(Periodo periodo, FiltroReservas f, int limite) {
        MapSqlParameterSource p = rango(periodo).addValue("limite", limite);
        String sql = eventos(f, p) + """
                SELECT id, titulo, tipo, CAST(inicio AT TIME ZONE %s AS date) AS fecha, espacio_nombre, cupo,
                       inscriptos, rating_suma * 1.0 / NULLIF(feedbacks, 0) AS rating
                FROM ev
                ORDER BY inicio DESC
                LIMIT :limite
                """.formatted(ZONA);
        return jdbc.query(sql, p, (rs, i) -> new AcademicoDto.EventoFila(idONull(rs, "id"), rs.getString("titulo"),
                rs.getString("tipo"), fecha(rs, "fecha"), rs.getString("espacio_nombre"),
                enteroONull(rs, "cupo"), entero(rs, "inscriptos"), decimalONull(rs, "rating")));
    }
}
