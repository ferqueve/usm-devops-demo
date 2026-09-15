package com.utec.backend.dto.stats;

import java.time.LocalDate;
import java.util.List;

/**
 * Las reservas de un período, con otro período para comparar (el anterior
 * del mismo largo o el mismo del año pasado) y la serie para graficar.
 *
 * Todo cuenta por la fecha de inicio en la hora del campus.
 */
public record ResumenReservasDto(
        LocalDate desde,
        LocalDate hasta,
        Totales actual,
        /** El período de comparación: los días anteriores o las mismas fechas del año pasado. */
        Totales anterior,
        LocalDate desdeAnterior,
        LocalDate hastaAnterior,
        /** "anterior" o "anio". */
        String comparacion,
        long espaciosTotal,
        /** "dia", "semana" o "mes", según el largo del período. */
        String granularidad,
        List<PuntoSerie> serie,
        /** Siempre por día, para el calendario y los mini gráficos. */
        List<PuntoSerie> diario,
        /** Reservas del período según el rol de quien las pidió. */
        List<Conteo> porRol
) {

    public record Conteo(String nombre, long total, long aprobadas) {
    }

    public record Totales(
            long total,
            long aprobadas,
            long pendientes,
            /** Pendientes cuya fecha ya pasó: nadie las resolvió a tiempo. */
            long pendientesVencidas,
            long canceladas,
            double horasAprobadas,
            double duracionPromedioHoras,
            /** Días promedio entre que se pide una reserva aprobada y su inicio. */
            double anticipacionPromedioDias,
            long espaciosUsados,
            long usuarios
    ) {
    }

    /** {@code periodo} es el primer día del día, la semana (lunes) o el mes. */
    public record PuntoSerie(LocalDate periodo, long aprobadas, long pendientes, long canceladas) {
    }
}
