package com.utec.backend.dto.reserva;

import java.time.Instant;

/**
 * Filtros utilizados al consultar reservas (paginadas).
 *
 * <p>Encapsula los criterios de filtrado para reducir el número de
 * parámetros formales en {@code ReservaService}.</p>
 *
 * @param estado          texto del estado de reserva ({@code "TODAS"} para no filtrar)
 * @param espacioId       id del espacio físico
 * @param carreraId       id de la carrera relacionada
 * @param tipoEspacioId   id del tipo de espacio
 * @param usuarioId       id del usuario solicitante (filtro opcional para ADMIN)
 * @param fechaInicio     fecha mínima (inicio &gt;= valor)
 * @param fechaFin        fecha máxima (inicio &lt;= valor)
 * @param tiempo          {@code "futuras"} o {@code "pasadas"} para particionar el dataset
 */
public record ReservaFilters(
        String estado,
        Long espacioId,
        Long carreraId,
        Long tipoEspacioId,
        Long usuarioId,
        Instant fechaInicio,
        Instant fechaFin,
        String tiempo
) {

    public static ReservaFilters of(
            String estado,
            Long espacioId,
            Long carreraId,
            Long tipoEspacioId,
            Instant fechaInicio,
            Instant fechaFin,
            String tiempo) {
        return new ReservaFilters(estado, espacioId, carreraId, tipoEspacioId, null,
                fechaInicio, fechaFin, tiempo);
    }
}
