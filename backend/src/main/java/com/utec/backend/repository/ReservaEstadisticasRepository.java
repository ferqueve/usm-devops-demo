package com.utec.backend.repository;

import com.utec.backend.model.Reserva;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;

/**
 * Consultas de agregacion para las estadisticas de reservas.
 *
 * Estas metricas se calculaban en memoria: se traian todas las reservas del
 * usuario -- o todas las del sistema, para las globales -- y se recorria la
 * lista una vez por metrica. Medido en produccion, con el historial de un
 * usuario activo eso tardaba varios segundos para devolver treinta numeros, y
 * el costo crece con cada reserva nueva.
 *
 * Ahora las cuenta la base. Todas las consultas aceptan un usuarioId opcional:
 * con valor devuelven las de ese usuario, con null las de todo el sistema, que
 * es la unica diferencia entre las estadisticas personales y las globales.
 *
 * Las fechas se agrupan en UTC, igual que hacia el calculo anterior.
 */
@Repository
public interface ReservaEstadisticasRepository extends JpaRepository<Reserva, Long> {

    /**
     * Totales, duraciones y extremos temporales en una sola pasada.
     *
     * Devuelve una sola fila. Se declara como lista porque una consulta nativa
     * que devuelve Object[] se entrega envuelta, y leerla como fila directa
     * confunde el arreglo con su primera columna.
     *
     * @return [total, aprobadas, pendientes, canceladas, futuras, pasadas,
     * activas, horasTotal, horasPromedio, horasMasLarga, horasMasCorta,
     * horasEsteMes, primeraReserva, ultimaReservaPasada, proximaReserva]
     */
    @Query(value = """
            SELECT
              COUNT(*)                                                                    AS total,
              COUNT(*) FILTER (WHERE r.estado = 'APROBADO')                               AS aprobadas,
              COUNT(*) FILTER (WHERE r.estado = 'PENDIENTE')                              AS pendientes,
              COUNT(*) FILTER (WHERE r.estado = 'CANCELADO')                              AS canceladas,
              COUNT(*) FILTER (WHERE r.inicio > :ahora)                                   AS futuras,
              COUNT(*) FILTER (WHERE r.fin < :ahora)                                      AS pasadas,
              COUNT(*) FILTER (WHERE r.estado = 'APROBADO' AND r.inicio > :ahora)          AS activas,
              COALESCE(SUM(EXTRACT(EPOCH FROM (r.fin - r.inicio))), 0) / 3600.0            AS horas_total,
              COALESCE(AVG(EXTRACT(EPOCH FROM (r.fin - r.inicio))), 0) / 3600.0            AS horas_promedio,
              COALESCE(MAX(EXTRACT(EPOCH FROM (r.fin - r.inicio))), 0) / 3600.0            AS horas_max,
              COALESCE(MIN(EXTRACT(EPOCH FROM (r.fin - r.inicio))), 0) / 3600.0            AS horas_min,
              COALESCE(SUM(EXTRACT(EPOCH FROM (r.fin - r.inicio)))
                       FILTER (WHERE to_char(r.inicio AT TIME ZONE 'UTC', 'YYYY-MM') = :mesActual), 0) / 3600.0
                                                                                          AS horas_mes,
              MIN(r.inicio)                                                               AS primera,
              MAX(r.fin) FILTER (WHERE r.fin < :ahora)                                    AS ultima_pasada,
              MIN(r.inicio) FILTER (WHERE r.inicio > :ahora)                              AS proxima
            FROM reserva r
            WHERE (:usuarioId IS NULL OR r.usuario_id = :usuarioId)
            """, nativeQuery = true)
    List<Object[]> resumen(@Param("usuarioId") Long usuarioId,
                           @Param("ahora") Instant ahora,
                           @Param("mesActual") String mesActual);

    /** Cuantas reservas hay de cada estado. Devuelve [estado, cantidad]. */
    @Query(value = """
            SELECT r.estado, COUNT(*)
            FROM reserva r
            WHERE (:usuarioId IS NULL OR r.usuario_id = :usuarioId)
            GROUP BY r.estado
            """, nativeQuery = true)
    List<Object[]> conteoPorEstado(@Param("usuarioId") Long usuarioId);

    /** Reservas por mes de inicio, en UTC. Devuelve [YYYY-MM, cantidad]. */
    @Query(value = """
            SELECT to_char(r.inicio AT TIME ZONE 'UTC', 'YYYY-MM') AS mes, COUNT(*)
            FROM reserva r
            WHERE (:usuarioId IS NULL OR r.usuario_id = :usuarioId)
            GROUP BY 1
            """, nativeQuery = true)
    List<Object[]> conteoPorMes(@Param("usuarioId") Long usuarioId);

    /** Reservas por dia de la semana en UTC. Devuelve [1..7 (lunes a domingo), cantidad]. */
    @Query(value = """
            SELECT EXTRACT(ISODOW FROM r.inicio AT TIME ZONE 'UTC') AS dia, COUNT(*)
            FROM reserva r
            WHERE (:usuarioId IS NULL OR r.usuario_id = :usuarioId)
            GROUP BY 1
            """, nativeQuery = true)
    List<Object[]> conteoPorDiaSemana(@Param("usuarioId") Long usuarioId);

    /** Reservas por espacio, de mayor a menor. Devuelve [espacioId, nombre, cantidad]. */
    @Query(value = """
            SELECT e.id, e.nombre, COUNT(*) AS cantidad
            FROM reserva r
            JOIN espacio e ON e.id = r.espacio_id
            WHERE (:usuarioId IS NULL OR r.usuario_id = :usuarioId)
            GROUP BY e.id, e.nombre
            ORDER BY cantidad DESC
            """, nativeQuery = true)
    List<Object[]> conteoPorEspacio(@Param("usuarioId") Long usuarioId);
}
