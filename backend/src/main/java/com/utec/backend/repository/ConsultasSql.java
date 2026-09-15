package com.utec.backend.repository;

import com.utec.backend.dto.stats.FiltroReservas;
import com.utec.backend.dto.stats.Periodo;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.Instant;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;

/**
 * Piezas compartidas por las consultas de estadísticas.
 *
 * Los filtros son opcionales y se agregan al SQL sólo cuando vienen: la
 * alternativa {@code (:x IS NULL OR col = :x)} obliga a Postgres a adivinar el
 * tipo de un parámetro null y además le impide usar índices. Los valores van
 * siempre como parámetros; lo único que se concatena son condiciones fijas.
 */
final class ConsultasSql {

    static final String ZONA = "'America/Montevideo'";

    private ConsultasSql() {
    }

    /** Parámetros :desde y :hasta (instantes) del período. */
    static MapSqlParameterSource rango(Periodo periodo) {
        return new MapSqlParameterSource()
                .addValue("desde", instante(periodo.inicio()))
                .addValue("hasta", instante(periodo.fin()));
    }

    /** El driver de Postgres no acepta Instant; OffsetDateTime sí, sin ambigüedad de zona. */
    static OffsetDateTime instante(Instant instante) {
        return instante.atOffset(ZoneOffset.UTC);
    }

    /**
     * Condiciones sobre el espacio, con alias {@code e}. Si el espacio viene de
     * un LEFT JOIN, filtrar deja afuera lo que no tiene espacio, que es lo
     * esperable al pedir un edificio concreto.
     */
    static String filtroEspacio(FiltroReservas f, MapSqlParameterSource p) {
        StringBuilder sql = new StringBuilder();
        if (f.edificioId() != null) {
            sql.append(" AND e.edificio_id = :edificioId");
            p.addValue("edificioId", f.edificioId());
        }
        if (f.espacioId() != null) {
            sql.append(" AND e.id = :espacioId");
            p.addValue("espacioId", f.espacioId());
        }
        if (f.tipoEspacioId() != null) {
            sql.append(" AND e.tipo_espacio_id = :tipoEspacioId");
            p.addValue("tipoEspacioId", f.tipoEspacioId());
        }
        return sql.toString();
    }

    /**
     * Condiciones sobre quién pidió la reserva, con alias {@code r}. El rol va
     * en un EXISTS y no en un JOIN para no duplicar filas ni obligar a cada
     * consulta a unir usuario.
     */
    static String filtroSolicitante(FiltroReservas f, MapSqlParameterSource p) {
        StringBuilder sql = new StringBuilder();
        if (f.rol() != null) {
            sql.append(" AND EXISTS (SELECT 1 FROM usuario uf WHERE uf.id = r.usuario_id AND uf.rol_app = :rol)");
            p.addValue("rol", f.rol());
        }
        if (f.carreraId() != null) {
            sql.append(" AND r.carrera_id = :carreraId");
            p.addValue("carreraId", f.carreraId());
        }
        return sql.toString();
    }

    /** Todos los filtros para una reserva {@code r} unida a su espacio {@code e}. */
    static String filtroReserva(FiltroReservas f, MapSqlParameterSource p) {
        return filtroEspacio(f, p) + filtroSolicitante(f, p);
    }

    /** Tramo de {@code expresion} según los límites (índice 0..n). */
    static String tramo(String expresion, double[] limites) {
        StringBuilder sql = new StringBuilder("CASE");
        for (int i = 0; i < limites.length; i++) {
            sql.append(" WHEN ").append(expresion).append(" < ").append(limites[i]).append(" THEN ").append(i);
        }
        return sql.append(" ELSE ").append(limites.length).append(" END").toString();
    }

    static long entero(ResultSet rs, String columna) throws SQLException {
        return rs.getLong(columna);
    }

    static Long idONull(ResultSet rs, String columna) throws SQLException {
        long valor = rs.getLong(columna);
        return rs.wasNull() ? null : valor;
    }

    static Integer enteroONull(ResultSet rs, String columna) throws SQLException {
        int valor = rs.getInt(columna);
        return rs.wasNull() ? null : valor;
    }

    static Double decimalONull(ResultSet rs, String columna) throws SQLException {
        Object valor = rs.getObject(columna);
        return valor == null ? null : ((Number) valor).doubleValue();
    }

    static double decimal(ResultSet rs, String columna) throws SQLException {
        Double valor = decimalONull(rs, columna);
        return valor == null ? 0.0 : valor;
    }

    static LocalDate fecha(ResultSet rs, String columna) throws SQLException {
        // getObject con LocalDate evita que la zona de la JVM corra el día.
        return rs.getObject(columna, LocalDate.class);
    }
}
