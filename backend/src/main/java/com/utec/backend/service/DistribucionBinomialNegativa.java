package com.utec.backend.service;

/**
 * Binomial negativa parametrizada por media y sobredispersión, como la usa
 * ml-svc: varianza = media + alpha·media², o sea n = 1/alpha y
 * p = n / (n + media) en la forma de scipy.stats.nbinom. Con alpha → 0 es una
 * Poisson.
 *
 * Se calcula acá y no se guarda desde ml-svc porque la probabilidad de
 * faltante depende del stock, y el stock cambia todos los días: guardarla al
 * entrenar dejaría el riesgo viejo hasta el próximo reentrenamiento.
 */
final class DistribucionBinomialNegativa {

    /** Por debajo de esto la sobredispersión es ruido de estimación: se usa Poisson. */
    static final double ALPHA_POISSON = 1e-6;

    /**
     * Pasada la media, un término por debajo de e^-700 ya no suma nada que un
     * double pueda representar y la cola sigue bajando: se corta ahí para no
     * recorrer stocks enormes sin necesidad.
     */
    private static final double LOG_TERMINO_DESPRECIABLE = -700.0;

    private DistribucionBinomialNegativa() {
    }

    /** P(X ≤ k). */
    static double cdf(int k, double media, double alpha) {
        if (k < 0) {
            return 0.0;
        }
        // Media cero (o basura): toda la masa está en 0.
        if (!(media > 0) || Double.isInfinite(media)) {
            return 1.0;
        }
        boolean poisson = Double.isNaN(alpha) || alpha < ALPHA_POISSON;
        double n = poisson ? Double.POSITIVE_INFINITY : 1.0 / alpha;

        // Se trabaja en logaritmos: con medias grandes p^n ya da 0 en double
        // (e^-500) y la recurrencia multiplicativa quedaría en cero para siempre.
        // log P(0): Poisson -media; NB n·log(p) = -n·log1p(media/n), estable con n enorme.
        double logTermino = poisson ? -media : -n * Math.log1p(media / n);
        double logRazonCola = poisson ? Math.log(media) : Math.log(media / (n + media));
        double logAcumulado = logTermino;
        for (int j = 0; j < k; j++) {
            // P(j+1)/P(j): Poisson media/(j+1); NB (j+n)/(j+1)·(1-p).
            logTermino += poisson
                    ? logRazonCola - Math.log(j + 1.0)
                    : Math.log((j + n) / (j + 1.0)) + logRazonCola;
            logAcumulado = logSumaExp(logAcumulado, logTermino);
            if (j > media && logTermino < LOG_TERMINO_DESPRECIABLE) {
                break;
            }
        }
        return Math.min(1.0, Math.exp(logAcumulado));
    }

    /** P(X > umbral): con umbral = stock, la probabilidad de que la demanda lo supere. */
    static double probMayorQue(int umbral, double media, double alpha) {
        return Math.max(0.0, Math.min(1.0, 1.0 - cdf(umbral, media, alpha)));
    }

    private static double logSumaExp(double a, double b) {
        double mayor = Math.max(a, b);
        double menor = Math.min(a, b);
        return mayor + Math.log1p(Math.exp(menor - mayor));
    }
}
