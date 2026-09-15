package com.utec.backend.dto.stats;

import java.util.List;

/** Reservas de eventos externos del período, con los organizadores que más piden. */
public record ExternosDto(
        /** Todos los eventos externos del período, no sólo los del top. */
        long total,
        List<Organizador> organizadores
) {

    /**
     * @param horas    horas de las reservas APROBADAS
     * @param espacios espacios distintos que usó (cualquier estado)
     */
    public record Organizador(String organizador, long eventos, long aprobadas, long canceladas, double horas,
                              long espacios) {
    }
}
