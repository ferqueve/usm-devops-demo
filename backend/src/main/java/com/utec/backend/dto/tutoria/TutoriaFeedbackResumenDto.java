package com.utec.backend.dto.tutoria;

import java.time.Instant;
import java.util.List;

/** Resumen de satisfacción de una tutoría: promedio, distribución y comentarios. */
public record TutoriaFeedbackResumenDto(
        double promedio,
        long total,
        List<Long> distribucion,
        Integer miRating,
        boolean puedeValorar,
        List<Item> items) {

    public record Item(
            Long id,
            String estudianteNombre,
            Integer rating,
            String comentario,
            Instant createdAt) {
    }
}
