package com.utec.backend.service;

import java.util.ArrayList;
import java.util.List;

/**
 * Agregación de valoraciones de 1 a 5 estrellas, compartida por tutorías y eventos.
 *
 * <p>El promedio y la distribución se calculaban con el mismo código escrito dos veces,
 * uno en {@code TutoriaService} y otro en {@code EventoService}.
 *
 * <p>Se comparte el cálculo, no las tablas: {@code TutoriaFeedback} apunta a una tutoría
 * y {@code EventoFeedback} a un evento, cada uno con su FK real. Fusionarlas en una tabla
 * polimórfica obligaría a renunciar a esa integridad referencial a cambio de nada.
 */
public final class ValoracionAgregada {

    /** Cantidad de niveles de la escala (1 a 5 estrellas). */
    private static final int NIVELES = 5;

    private ValoracionAgregada() {
    }

    /** Promedio redondeado a un decimal. Devuelve 0.0 si no hay valoraciones. */
    public static double promedio(List<Integer> ratings) {
        if (ratings.isEmpty()) {
            return 0.0;
        }
        double media = ratings.stream().mapToInt(Integer::intValue).average().orElse(0);
        return Math.round(media * 10) / 10.0;
    }

    /**
     * Conteo por nivel: la posición 0 son las de 1★ y la 4 las de 5★.
     * Los valores fuera de rango se acotan al nivel más cercano.
     */
    public static List<Long> distribucion(List<Integer> ratings) {
        List<Long> conteo = new ArrayList<>(List.of(0L, 0L, 0L, 0L, 0L));
        for (Integer rating : ratings) {
            int idx = Math.min(NIVELES, Math.max(1, rating)) - 1;
            conteo.set(idx, conteo.get(idx) + 1);
        }
        return conteo;
    }
}
