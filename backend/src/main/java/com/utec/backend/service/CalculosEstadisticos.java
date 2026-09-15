package com.utec.backend.service;

import com.utec.backend.dto.stats.Periodo;
import com.utec.backend.repository.EstadisticasReservaConsultas.FilaTramo;

import java.time.Clock;
import java.time.LocalDate;
import java.util.List;

/** Cuentas chicas que repiten los servicios de estadísticas. */
final class CalculosEstadisticos {

    /**
     * Horas asumidas por día como denominador del cálculo de ocupación.
     * Aproxima un horario académico extendido (08:00 - 22:00).
     */
    static final int HORAS_DISPONIBLES_POR_DIA = 14;

    private CalculosEstadisticos() {
    }

    /** Hoy en el campus. */
    static LocalDate hoy(Clock clock) {
        return LocalDate.now(clock.withZone(Periodo.ZONA));
    }

    /** Un decimal: más precisión en una pantalla sólo es ruido. */
    static double redondear(double valor) {
        return Math.round(valor * 10.0) / 10.0;
    }

    static Double redondear(Double valor) {
        return valor == null ? null : redondear(valor.doubleValue());
    }

    /** Porcentaje con un decimal; null si no hay base sobre la cual calcularlo. */
    static Double porcentaje(double parte, double total) {
        return total <= 0 ? null : redondear(parte * 100.0 / total);
    }

    /**
     * Rangos con nombre para agrupar un valor continuo. {@code limites} son los
     * cortes superiores exclusivos: con {1, 4} quedan [<1, 1–4, ≥4]. Hay un
     * nombre más que límites.
     */
    record Tramos(List<String> nombres, double[] limites) {
        Tramos {
            if (nombres.size() != limites.length + 1) {
                throw new IllegalArgumentException("Tiene que haber un nombre más que límites");
            }
        }

        /**
         * Valores por tramo en orden, con cero los tramos que la base no
         * devolvió: el gráfico necesita siempre las mismas barras.
         */
        long[][] completar(List<FilaTramo> filas, int columnas) {
            long[][] valores = new long[nombres.size()][columnas];
            for (FilaTramo fila : filas) {
                if (fila.tramo() >= 0 && fila.tramo() < valores.length) {
                    System.arraycopy(fila.valores(), 0, valores[fila.tramo()], 0, columnas);
                }
            }
            return valores;
        }
    }
}
