package com.utec.backend.dto.sostenibilidad;

import java.util.List;

/** Ranking de sostenibilidad: carreras y docentes por impacto, más comparativa mensual. */
public record SostenibilidadRankingDto(
        List<Item> carreras,
        List<Item> docentes,
        Comparativa comparativa) {

    /** Una fila del ranking (carrera o docente). {@code deltaPct} = variación de hojas mes actual vs anterior. */
    public record Item(String nombre, long hojas, long recursos, double papelKg, double co2Kg, double deltaPct) {
    }

    /** Comparativa de hojas evitadas entre el mes actual y el anterior. */
    public record Comparativa(long mesActual, long mesAnterior, double deltaPct) {
    }
}
