package com.utec.backend.service;

import com.utec.backend.repository.HechosInventarioRepository;
import com.utec.backend.repository.HechosReservaRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.ZoneId;

/**
 * Scheduler de la capa analítica: pobla las tablas de hechos diarias.
 *
 * Corre de madrugada en la hora del campus (3:00 / 3:15), después del job de
 * recomendaciones. Los métodos backfill* exponen la misma lógica
 * para correr sobre rangos arbitrarios desde el endpoint admin.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class EstadisticasScheduledService {

    // El servidor corre en UTC: sin zona explícita, "hoy" cambia tres horas
    // antes que en Uruguay.
    private static final ZoneId ZONA = ZoneId.of("America/Montevideo");

    /**
     * Días hacia atrás que se recalculan cada noche. Con siete, cancelar o
     * aprobar a destiempo una reserva de hace dos semanas nunca llegaba a las
     * estadísticas. Es una sola sentencia agregada: sesenta días cuestan poco.
     */
    private static final int VENTANA_RECOMPUTE_RESERVAS_DIAS = 60;

    private final HechosReservaRepository hechosReservaRepository;
    private final HechosInventarioRepository hechosInventarioRepository;

    /**
     * Recomputa las reservas de los últimos días (ver la ventana). Es idempotente: borra y
     * vuelve a calcular para absorber cancelaciones, aprobaciones y creaciones
     * con fecha pasada.
     */
    @Scheduled(cron = "0 0 3 * * ?", zone = "America/Montevideo")
    @Transactional
    public void recalcularHechosReservaDiario() {
        LocalDate hoy = LocalDate.now(ZONA);
        LocalDate desde = hoy.minusDays(VENTANA_RECOMPUTE_RESERVAS_DIAS);
        log.info("Recomputando hechos_reserva_diario en rango {} a {}", desde, hoy);
        backfillReservas(desde, hoy);
    }

    /**
     * Toma una foto del inventario activo y la etiqueta con la fecha de hoy.
     * No reescribe el pasado: cada día es una observación independiente.
     */
    @Scheduled(cron = "0 15 3 * * ?", zone = "America/Montevideo")
    @Transactional
    public void recalcularHechosInventarioDiario() {
        LocalDate hoy = LocalDate.now(ZONA);
        log.info("Tomando snapshot de hechos_inventario_diario para {}", hoy);
        backfillInventario(hoy, hoy);
    }

    /**
     * Backfill idempotente del rollup de reservas. Borra el rango y recomputa
     * con una sola sentencia SQL agregada (sin cargar reservas a memoria).
     */
    @Transactional
    public int backfillReservas(LocalDate desde, LocalDate hasta) {
        if (desde.isAfter(hasta)) {
            throw new IllegalArgumentException("desde no puede ser posterior a hasta");
        }
        int borradas = hechosReservaRepository.deleteByFechaBetween(desde, hasta);
        int insertadas = hechosReservaRepository.recomputeRange(desde, hasta);
        log.info("backfillReservas {} a {}: {} filas borradas, {} insertadas",
                desde, hasta, borradas, insertadas);
        return insertadas;
    }

    /**
     * Backfill del snapshot diario de inventario. Una iteración por día porque
     * el snapshot fotografía el estado ACTUAL del inventario etiquetado con
     * cada fecha — sólo tiene sentido recomputar la fecha de hoy o rellenar
     * fechas pasadas faltantes (asumiendo que el estado no cambió).
     */
    @Transactional
    public int backfillInventario(LocalDate desde, LocalDate hasta) {
        if (desde.isAfter(hasta)) {
            throw new IllegalArgumentException("desde no puede ser posterior a hasta");
        }
        int totalInsertadas = 0;
        LocalDate cursor = desde;
        while (!cursor.isAfter(hasta)) {
            hechosInventarioRepository.deleteByFecha(cursor);
            int insertadas = hechosInventarioRepository.snapshotForDate(cursor);
            totalInsertadas += insertadas;
            log.debug("Snapshot inventario {}: {} filas insertadas", cursor, insertadas);
            cursor = cursor.plusDays(1);
        }
        log.info("backfillInventario {} a {}: {} filas insertadas en total",
                desde, hasta, totalInsertadas);
        return totalInsertadas;
    }
}
