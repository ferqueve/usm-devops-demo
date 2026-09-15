package com.utec.backend.dto.stats;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

/**
 * ¿Va a alcanzar el equipamiento? Pico diario esperado de unidades pedidas en
 * simultáneo por tipo de elemento contra el stock disponible de hoy.
 */
public record PrediccionInventarioDto(Modelo modelo, Resumen resumen, List<Tipo> tipos) {

    /** Sin modelo activo sólo {@code entrenado=false}; el resto null. */
    public record Modelo(boolean entrenado, String algoritmo, Instant entrenadoEn, Double wape, Double wapeIngenuo,
                         String historicoDesde, String historicoHasta, Integer holdoutDias, Integer horizonteDias,
                         Double intervalo) {
    }

    /**
     * @param tiposEnRiesgo  tipos con riesgo alto (algún día con probabilidad de faltante ≥ 0,5)
     * @param tiposSinStock  tipos sin unidades disponibles y con demanda esperada
     * @param primerFaltante el día más cercano con probabilidad de faltante ≥ 0,5; null si no hay
     */
    public record Resumen(int tipos, int tiposEnRiesgo, int tiposSinStock, PrimerFaltante primerFaltante) {
    }

    public record PrimerFaltante(Long tipoElementoId, String nombre, LocalDate fecha, double probabilidad) {
    }

    /**
     * Un tipo omitido por el modelo trae status, detalle y stock; lo demás
     * null y las listas vacías.
     *
     * @param riesgo sin_stock, alto, medio o bajo
     */
    public record Tipo(Long tipoElementoId, String nombre, String status, String detalle, Long stockDisponible,
                       Long stockTotal, Double mediaHistorica, Double wape, Double wapeIngenuo, Double alpha,
                       Double tendenciaSemanalPct, List<DiaSemana> diaSemana, Double picoEsperado,
                       LocalDate fechaPico, Double probFaltanteMax, Integer diasEnRiesgo, String riesgo,
                       List<Dia> serie, List<Semana> semanas) {
    }

    /** Multiplicador del día de la semana sobre la media (exp del coeficiente del GLM). */
    public record DiaSemana(String dia, Double multiplicador) {
    }

    /**
     * @param comprometidas pico de unidades ya pedidas para ese día cuando se entrenó
     * @param probFaltante  P(pico > stock disponible hoy); 1 si lo comprometido ya lo supera
     */
    public record Dia(LocalDate fecha, double prediccion, Double bandaInferior, Double bandaSuperior,
                      int comprometidas, double probFaltante) {
    }

    /** {@code semana} es el lunes. */
    public record Semana(LocalDate semana, double picoEsperado, double probFaltanteMax, int comprometidasMax) {
    }
}
