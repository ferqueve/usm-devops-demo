package com.utec.backend.dto.usuario;

import java.time.LocalDate;

/**
 * Filtros para listados paginados de usuarios.
 */
public record UsuarioFilters(
        String search,
        String rol,
        Boolean verificado,
        Boolean activo,
        LocalDate fechaDesde,
        LocalDate fechaHasta) {
}
