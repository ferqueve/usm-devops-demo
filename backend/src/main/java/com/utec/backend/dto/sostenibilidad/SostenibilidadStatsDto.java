package com.utec.backend.dto.sostenibilidad;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

/**
 * KPIs de sostenibilidad derivados de los recursos académicos digitales.
 * No proviene de IoT: todos los valores se calculan en memoria a partir de
 * los recursos de tipo ARCHIVO (no eliminados) y la cantidad de inscriptos
 * por materia, que aproxima cuántas copias físicas se habrían impreso.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SostenibilidadStatsDto {

    /** Total de hojas de papel que se evitaron imprimir. */
    private long hojasEvitadas;

    /** Papel ahorrado en kilogramos (hojasEvitadas * 4.5 g / 1000). */
    private double papelAhorradoKg;

    /** CO2 evitado en kilogramos (hojasEvitadas * 4.7 g / 1000). */
    private double co2EvitadoKg;

    /** Agua ahorrada en litros (hojasEvitadas * 10 L/hoja). */
    private double aguaAhorradaL;

    /** Total de recursos digitales no eliminados (ARCHIVO + ENLACE). */
    private long recursosDigitalesTotales;

    /** Recursos de tipo ARCHIVO no eliminados. */
    private long recursosArchivo;

    /** Recursos de tipo ENLACE no eliminados. */
    private long recursosEnlace;

    /** Árboles salvados equivalentes (papelAhorradoKg / 8.3 kg por árbol). */
    private double arbolesSalvados;

    /** Km en auto equivalentes al CO2 evitado (co2EvitadoKg / 0.12 kg CO2/km). */
    private double kmAutoEquivalente;

    /** Serie temporal: hojas evitadas agrupadas por mes (YYYY-MM). */
    private List<Map<String, Object>> ahorroPorMes;
}
