package com.utec.backend.dto.stats;

import java.util.List;

/** Demanda de inventario: equipamiento pedido junto con las reservas, contra lo que hay. */
public record EquiposReservasDto(
        Totales totales,
        List<PorTipo> porTipo,
        List<EspacioConProblemas> espaciosConProblemas
) {

    public record Totales(long solicitudes, long unidades, long pendientes, long aprobadas,
                          long entregadas, long rechazadas) {
    }

    /**
     * @param disponibles    unidades en estado DISPONIBLE hoy
     * @param enInventario   unidades activas del tipo, en cualquier estado
     * @param maxUnidadesDia pico de unidades pedidas en un mismo día del campus
     */
    public record PorTipo(Long tipoElementoId, String nombre, long solicitudes, long unidades, long pendientes,
                          long aprobadas, long entregadas, long rechazadas, long disponibles,
                          long enInventario, long maxUnidadesDia) {
    }

    public record EspacioConProblemas(Long espacioId, String nombre, long reservas, long itemsConProblema) {
    }
}
