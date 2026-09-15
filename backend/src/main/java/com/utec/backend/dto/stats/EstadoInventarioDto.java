package com.utec.backend.dto.stats;

import java.util.List;

/**
 * Cómo está el inventario ahora, con los filtros de espacio, tipo y edificio
 * aplicados a todo por igual.
 */
public record EstadoInventarioDto(
        Totales totales,
        /** Null cuando se filtra por un espacio: cubrir uno solo no dice nada. */
        Cobertura cobertura,
        /** Todos los tipos activos del alcance, también los que no tienen items. */
        List<Grupo> porTipo,
        /** Todos los espacios activos del alcance, también los vacíos. */
        List<Grupo> porEspacio,
        List<Celda> matriz,
        /** Items en mantenimiento o dañados, los que llevan más tiempo sin cambios primero. */
        List<ItemAtencion> atencion,
        Antiguedad antiguedad,
        /** Todo lo elegible en los filtros, sin filtrar: para armar los selectores. */
        Opciones opciones
) {

    public record Opciones(List<Opcion> edificios, List<Opcion> espacios, List<Opcion> tipos) {
    }

    /** {@code padreId} es el edificio de un espacio; null en el resto. */
    public record Opcion(long id, String nombre, Long padreId) {
    }

    public record Totales(long items, long unidades, long disponibles, long mantenimiento, long danados, long sinEspacio) {
    }

    public record Cobertura(long espacios, long conInventario) {
    }

    /** {@code detalle} es el edificio para los espacios; null para los tipos. */
    public record Grupo(long id, String nombre, String detalle,
                        long items, long unidades, long disponibles, long mantenimiento, long danados) {
    }

    public record Celda(long espacioId, long tipoId, long items, long unidades) {
    }

    public record ItemAtencion(long id, String tipo, String espacio, String estado,
                               int cantidad, long diasSinCambios, String observaciones) {
    }

    /** Por fecha de alta, más los que no se tocan hace más de seis meses. */
    public record Antiguedad(long menosDe30Dias, long de30a90Dias, long de90DiasAUnAnio, long masDeUnAnio,
                             long sinCambiosHace6Meses) {
    }
}
