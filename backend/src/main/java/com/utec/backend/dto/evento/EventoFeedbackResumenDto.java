package com.utec.backend.dto.evento;

import java.time.Instant;
import java.util.List;

/**
 * Resumen de satisfacción de un evento: promedio, total, distribución de
 * estrellas, la valoración del usuario actual (si dejó una) y el listado.
 */
public record EventoFeedbackResumenDto(
        double promedio,
        long total,
        List<Long> distribucion,
        Integer miRating,
        boolean puedeValorar,
        List<Item> items) {

    public record Item(
            Long id,
            String usuarioNombre,
            Integer rating,
            String comentario,
            Instant createdAt) {
    }
}
