package com.utec.backend.dto.dashboard;

import com.utec.backend.dto.reserva.ReservaResponseDto;
import com.utec.backend.dto.reserva.ReservaStatsDto;
import com.utec.backend.dto.usuario.UsuarioStatsDto;

import java.util.List;
import java.util.Map;

/**
 * Todo lo que necesita la pantalla de inicio, en una sola respuesta.
 *
 * Antes el frontend armaba el dashboard con doce llamadas en paralelo -- una
 * por metrica -- contra un pool de diez conexiones: las dos ultimas esperaban a
 * que se liberara una. Ademas descargaba listas enteras (todos los espacios,
 * todas las reservas del mes) para terminar mostrando un contador.
 *
 * Este DTO lo reemplaza. Los campos que un rol no usa vienen en null: un
 * ESTUDIANTE no recibe la cola de pendientes ni las metricas de inventario,
 * porque su pantalla no las muestra y ademas no tiene permiso para verlas.
 *
 * @param stats                          contadores de la tira superior
 * @param proximasReservas               las diez proximas aprobadas del campus
 * @param misReservas                    las ultimas del usuario (roles que reservan)
 * @param reservasPendientes             cola por aprobar (roles que aprueban)
 * @param reservaStats                   agregado de reservas: global para quien aprueba, personal para el resto
 * @param userStats                      metricas de usuarios (solo ADMIN)
 * @param inventarioStats                metricas de inventario (roles que lo administran)
 * @param solicitudesInventarioPendientes solicitudes de items sin responder
 */
public record DashboardDto(
        Stats stats,
        List<ReservaResponseDto> proximasReservas,
        List<ReservaResponseDto> misReservas,
        List<ReservaResponseDto> reservasPendientes,
        ReservaStatsDto reservaStats,
        UsuarioStatsDto userStats,
        Map<String, Object> inventarioStats,
        long solicitudesInventarioPendientes
) {

    /**
     * Los numeros de la tira de tarjetas. Todos salen de agregados en la base:
     * ninguno se calcula recorriendo una lista.
     *
     * @param promedioReservasPorEspacio razon, no porcentaje: aprobadas sobre espacios
     */
    public record Stats(
            long totalReservas,
            long reservasHoy,
            long reservasPendientes,
            long reservasAprobadas,
            long reservasCanceladas,
            long totalEspacios,
            long espaciosDisponibles,
            long espaciosOcupados,
            long espaciosEnMantenimiento,
            double capacidadPromedio,
            long totalUsuarios,
            long usuariosActivos,
            long usuariosNuevosHoy,
            double promedioReservasPorEspacio
    ) {
    }
}
