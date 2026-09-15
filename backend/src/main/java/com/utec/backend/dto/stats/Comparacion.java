package com.utec.backend.dto.stats;

/** Contra qué se compara un período. */
public enum Comparacion {
    /** Los mismos días inmediatamente antes. */
    ANTERIOR("anterior"),
    /** Las mismas fechas del año pasado: saca la estacionalidad del semestre. */
    ANIO("anio");

    private final String valor;

    Comparacion(String valor) {
        this.valor = valor;
    }

    public String valor() {
        return valor;
    }

    /** Sin valor es {@link #ANTERIOR}; un valor desconocido es un error del cliente. */
    public static Comparacion de(String valor) {
        if (valor == null || valor.isBlank()) {
            return ANTERIOR;
        }
        for (Comparacion c : values()) {
            if (c.valor.equalsIgnoreCase(valor.trim())) {
                return c;
            }
        }
        throw new IllegalArgumentException("comparar debe ser 'anterior' o 'anio'");
    }
}
