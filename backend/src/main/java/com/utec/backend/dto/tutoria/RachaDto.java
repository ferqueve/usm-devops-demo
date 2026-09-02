package com.utec.backend.dto.tutoria;

import java.util.List;

/** Gamificación del estudiante: asistencias, racha y badges desbloqueados. */
public record RachaDto(
        long asistidas,
        long agendadas,
        int rachaActual,
        List<Badge> badges) {

    public record Badge(String id, String nombre, String emoji, boolean desbloqueado) {
    }
}
