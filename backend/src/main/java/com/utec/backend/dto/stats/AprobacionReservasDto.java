package com.utec.backend.dto.stats;

import java.util.List;

/**
 * Cómo se gestionan las solicitudes: cuánto tardan en responderse, quién las
 * atiende, con cuánta antelación se piden y qué quedó sin resolver.
 */
public record AprobacionReservasDto(
        Respuesta respuesta,
        List<Tramo> distribucionRespuesta,
        List<Analista> analistas,
        List<Antelacion> antelacion,
        List<Antiguedad> pendientesPorAntiguedad
) {

    /**
     * @param resueltas     aprobadas + canceladas del período
     * @param conDato       resueltas con tiempo de respuesta real (sin las auto-aprobadas)
     * @param medianaHoras  null si no hay ninguna con dato
     * @param dentroDe24hPct null si no hay ninguna con dato
     */
    public record Respuesta(long resueltas, long conDato, Double medianaHoras, Double p90Horas,
                            Double dentroDe24hPct) {
    }

    public record Tramo(String tramo, long cantidad) {
    }

    public record Analista(Long usuarioId, String nombre, long asignadas, long pendientes, long vencidas,
                           long aprobadas, long canceladas, Double medianaHoras) {
    }

    public record Antelacion(String tramo, long total, long aprobadas, long canceladas, long pendientes) {
    }

    public record Antiguedad(String tramo, long cantidad, long vencidas) {
    }
}
