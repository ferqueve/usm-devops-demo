package com.utec.backend.service;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.within;

/**
 * Los valores de referencia salen de scipy 1.x (python 3.11), la misma
 * librería con la que ml-svc arma las bandas:
 * {@code nbinom.sf(stock, n=1/alpha, p=n/(n+media))} y {@code poisson.sf(stock, media)}.
 */
class DistribucionBinomialNegativaTest {

    private static final double TOLERANCIA = 1e-9;

    @ParameterizedTest(name = "media={0}, alpha={1}, stock={2} → {3}")
    @DisplayName("P(X > stock) coincide con scipy.stats.nbinom.sf")
    @CsvSource({
            "7.1,   0.35, 8,   0.3204696009601525",
            "14.2,  0.35, 8,   0.6951203139102144",
            "0.5,   1.2,  0,   0.3240726580498757",
            "0.5,   1.2,  3,   0.014520158308312762",
            "3.0,   0.8,  2,   0.4405216015594479",
            "120.0, 0.05, 163, 0.07602160999478066",
            "400.0, 0.01, 428, 0.25542432668626963",
            "6.2,   0.35, 11,  0.11847753092955736",
            "25.0,  2.5,  60,  0.12570361379150466",
            "2.0,   0.1,  0,   0.8384944171101543",
            "40.0,  0.02, 30,  0.8726699140250322"
    })
    void coincideConScipy(double media, double alpha, int stock, double esperado) {
        assertThat(DistribucionBinomialNegativa.probMayorQue(stock, media, alpha)).isCloseTo(esperado, within(TOLERANCIA));
        assertThat(DistribucionBinomialNegativa.cdf(stock, media, alpha)).isCloseTo(1 - esperado, within(TOLERANCIA));
    }

    @ParameterizedTest(name = "media={0}, stock={1} → {2}")
    @DisplayName("Con alpha≈0 es una Poisson (scipy.stats.poisson.sf)")
    @CsvSource({
            "3.0,  5,  0.08391794203130347",
            "7.1,  8,  0.2840364876349788",
            "0.3,  0,  0.25918177931828207",
            "50.0, 60, 0.07216017981325687"
    })
    void alphaCeroEsPoisson(double media, int stock, double esperado) {
        assertThat(DistribucionBinomialNegativa.probMayorQue(stock, media, 0.0)).isCloseTo(esperado, within(TOLERANCIA));
        assertThat(DistribucionBinomialNegativa.probMayorQue(stock, media, 1e-9)).isCloseTo(esperado, within(TOLERANCIA));
        assertThat(DistribucionBinomialNegativa.probMayorQue(stock, media, Double.NaN)).isCloseTo(esperado, within(TOLERANCIA));
    }

    @Test
    @DisplayName("Justo arriba del corte a Poisson, la binomial negativa ya casi no se distingue")
    void continuidadEnElCorte() {
        // scipy: nbinom.sf(5, n=5e5, p=n/(n+3)).
        assertThat(DistribucionBinomialNegativa.probMayorQue(5, 3.0, 2e-6))
                .isCloseTo(0.08391854694074444, within(TOLERANCIA));
    }

    @Test
    @DisplayName("Con media 0 nunca falta, haya o no stock")
    void mediaCero() {
        assertThat(DistribucionBinomialNegativa.probMayorQue(0, 0.0, 0.35)).isZero();
        assertThat(DistribucionBinomialNegativa.probMayorQue(5, 0.0, 0.0)).isZero();
        assertThat(DistribucionBinomialNegativa.cdf(0, 0.0, 0.35)).isEqualTo(1.0);
    }

    @Test
    @DisplayName("Con stock 0 la probabilidad de faltante es la de que se pida algo: 1 - P(0)")
    void stockCero() {
        // P(0) = p^n con n = 1/alpha.
        double n = 1 / 0.5;
        double p = n / (n + 4.0);
        assertThat(DistribucionBinomialNegativa.probMayorQue(0, 4.0, 0.5)).isCloseTo(1 - Math.pow(p, n), within(TOLERANCIA));
        assertThat(DistribucionBinomialNegativa.probMayorQue(0, 4.0, 0.0)).isCloseTo(1 - Math.exp(-4.0), within(TOLERANCIA));
    }

    @Test
    @DisplayName("Umbral negativo: siempre se supera; media enorme no se rompe por underflow")
    void bordes() {
        assertThat(DistribucionBinomialNegativa.probMayorQue(-1, 3.0, 0.2)).isEqualTo(1.0);
        // e^-2000 da 0 en double: calculado multiplicando, P(X ≤ 2100) quedaría en 0.
        // scipy: poisson.sf(2100, 2000).
        assertThat(DistribucionBinomialNegativa.probMayorQue(2100, 2000.0, 0.0))
                .isCloseTo(0.012790720091920784, within(1e-8));
        assertThat(DistribucionBinomialNegativa.probMayorQue(1_000_000, 5.0, 0.3)).isCloseTo(0.0, within(1e-12));
    }
}
