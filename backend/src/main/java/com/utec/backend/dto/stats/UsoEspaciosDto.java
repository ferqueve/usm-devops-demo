package com.utec.backend.dto.stats;

import java.time.LocalDate;
import java.util.List;

/** Uso de cada espacio, saturación por tipo y hora, y aforo de tutorías y eventos. */
public record UsoEspaciosDto(
        List<Espacio> espacios,
        List<Saturacion> saturacion,
        List<Capacidad> capacidad
) {

    /**
     * @param cupoPromedio    cupo medio de tutorías y eventos presenciales en el espacio; null si no hubo
     * @param usoCapacidadPct inscriptos promedio sobre la capacidad; null si no hubo
     */
    public record Espacio(Long espacioId, String nombre, String edificioNombre, String tipoEspacio,
                          Integer capacidad, double horas, long reservas, double ocupacionPct,
                          Double cupoPromedio, Double usoCapacidadPct) {
    }

    /**
     * @param ocupacionPct promedio, sobre los días hábiles, de espacios ocupados del tipo en esa hora
     * @param horasLlenas  (día, hora) en que no quedaba ningún espacio libre del tipo
     */
    public record Saturacion(String tipoEspacio, long espacios, int hora, double ocupacionPct, long horasLlenas) {
    }

    /** {@code tipo} es "TUTORIA" o "EVENTO". */
    public record Capacidad(String tipo, Long id, String titulo, LocalDate fecha, String espacioNombre,
                            Integer capacidad, Integer cupo, long inscriptos, Double usoPct) {
    }
}
