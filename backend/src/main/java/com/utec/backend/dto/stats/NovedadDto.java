package com.utec.backend.dto.stats;

/**
 * Un cambio llamativo entre el período y el de comparación.
 *
 * @param tipo    "espacio", "carrera", "rol", "edificio", "hora" o "aprobacion"
 * @param clave   identificador dentro del tipo (id, rol, "dia-hora")
 * @param unidad  "pp" (puntos porcentuales), "%" (cambio relativo) o "h"
 * @param sentido "sube" o "baja"
 * @param bueno   true/false si el cambio es claramente positivo/negativo; null si es neutro
 */
public record NovedadDto(String tipo, String clave, String titulo, String metrica, Double antes, Double ahora,
                         Double cambio, String unidad, String sentido, Boolean bueno) {
}
