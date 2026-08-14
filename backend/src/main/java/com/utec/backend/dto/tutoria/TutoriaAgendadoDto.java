package com.utec.backend.dto.tutoria;

import java.time.Instant;

/** Estudiante agendado (activo) en una tutoría, con su temario y estado de confirmación. */
public record TutoriaAgendadoDto(
        Long reservaId,
        Long estudianteId,
        String nombre,
        String email,
        String estado,
        String temario,
        Boolean confirmada,
        Instant createdAt) {
}
