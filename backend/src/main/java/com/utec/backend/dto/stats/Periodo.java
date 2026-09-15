package com.utec.backend.dto.stats;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.util.Optional;

/**
 * Un rango de días del campus, inclusivo en los dos extremos.
 *
 * Valida al construirse: todas las estadísticas comparten el mismo tope, y así
 * ningún endpoint puede olvidarse de chequearlo.
 */
public record Periodo(LocalDate desde, LocalDate hasta) {

    /** Los días del período son los del campus, no los de UTC. */
    public static final ZoneId ZONA = ZoneId.of("America/Montevideo");

    /** Tope del período: más que esto ya no es una consulta de pantalla. */
    public static final long DIAS_MAXIMOS = 1100;

    public Periodo {
        if (desde == null || hasta == null) {
            throw new IllegalArgumentException("desde y hasta son obligatorios");
        }
        if (desde.isAfter(hasta)) {
            throw new IllegalArgumentException("desde no puede ser posterior a hasta");
        }
        if (ChronoUnit.DAYS.between(desde, hasta) + 1 > DIAS_MAXIMOS) {
            throw new IllegalArgumentException("El período no puede superar los " + DIAS_MAXIMOS + " días");
        }
    }

    public long dias() {
        return ChronoUnit.DAYS.between(desde, hasta) + 1;
    }

    /** Primer instante del período en la hora del campus. */
    public Instant inicio() {
        return desde.atStartOfDay(ZONA).toInstant();
    }

    /** Primer instante después del período (exclusivo). */
    public Instant fin() {
        return hasta.plusDays(1).atStartOfDay(ZONA).toInstant();
    }

    /**
     * El período con el que se compara. Contra el año anterior se usan las
     * mismas fechas y no los mismos días de la semana: es lo que la gente
     * espera leer ("setiembre contra setiembre").
     */
    public Periodo anterior(Comparacion comparacion) {
        return switch (comparacion) {
            case ANTERIOR -> new Periodo(desde.minusDays(dias()), desde.minusDays(1));
            case ANIO -> new Periodo(desde.minusYears(1), hasta.minusYears(1));
        };
    }

    /** La parte del período que ya empezó (hasta hoy inclusive); vacío si todavía no llegó. */
    public Optional<Periodo> hastaHoy(LocalDate hoy) {
        if (desde.isAfter(hoy)) {
            return Optional.empty();
        }
        return Optional.of(new Periodo(desde, hasta.isAfter(hoy) ? hoy : hasta));
    }
}
