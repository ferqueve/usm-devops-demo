package com.utec.backend.dto.stats;

import java.util.List;

/** Valores posibles de cada filtro de las estadísticas de reservas. */
public record OpcionesFiltroDto(
        List<Opcion> edificios,
        List<EspacioOpcion> espacios,
        List<Opcion> tiposEspacio,
        /** Roles de quienes alguna vez pidieron una reserva. */
        List<String> roles,
        List<Opcion> carreras
) {

    public record Opcion(Long id, String nombre) {
    }

    /** Trae edificio y tipo para que el front pueda acotar la lista según los otros filtros. */
    public record EspacioOpcion(Long id, String nombre, Long edificioId, Long tipoEspacioId) {
    }
}
