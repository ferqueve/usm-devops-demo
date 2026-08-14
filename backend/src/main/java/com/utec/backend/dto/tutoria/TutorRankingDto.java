package com.utec.backend.dto.tutoria;

/** Fila del ranking de tutores: agregados de un docente. */
public record TutorRankingDto(
        Long docenteId,
        String docenteNombre,
        double promedio,
        long totalValoraciones,
        long totalTutorias,
        long totalEstudiantes,
        String badge) {
}
