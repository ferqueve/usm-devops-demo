package com.utec.backend.dto.tutoria;

import jakarta.validation.constraints.NotBlank;

import java.time.Instant;

/** Recurso/material de una tutoría. Para crear usar titulo/url; el resto se ignora. */
public record TutoriaRecursoDto(
        Long id,
        @NotBlank(message = "El título es obligatorio") String titulo,
        @NotBlank(message = "El enlace es obligatorio") String url,
        Instant createdAt) {
}
