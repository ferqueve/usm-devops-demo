package com.utec.backend.dto.stats;

import java.time.LocalDate;
import java.util.List;

/** Demanda de reservas esperada por tipo de espacio, un modelo Prophet por tipo. */
public record PrediccionTiposEspacioDto(List<Tipo> tipos) {

    /**
     * Sin modelo activo, {@code entrenado} es false y todo lo que sigue a
     * {@code entrenado} viene null (la serie vacía).
     *
     * @param promedioDiarioHistorico reservas aprobadas por día en los últimos 30 días antes de hoy
     * @param esperadoProximos7       suma de la predicción de los primeros 7 días de la serie
     * @param esperadoProximos30      suma de la predicción de toda la serie (hasta 30 días)
     * @param cambioPct               promedio diario esperado de la serie contra {@code promedioDiarioHistorico}
     * @param reservadasProximos7     reservas ya aprobadas en los primeros 7 días de la serie
     */
    public record Tipo(Long tipoEspacioId, String nombre, long espacios, boolean entrenado, Double wape,
                       Double wapeIngenuo, Double promedioDiarioHistorico, Double esperadoProximos7,
                       Double esperadoProximos30, Double cambioPct, Integer reservadasProximos7,
                       LocalDate picoFecha, Double picoValor, List<Punto> serie) {
    }

    /** Un día desde hoy: lo que predice el modelo y lo que ya está aprobado. */
    public record Punto(LocalDate fecha, double prediccion, Double bandaInferior, Double bandaSuperior,
                        long reservadas) {
    }
}
