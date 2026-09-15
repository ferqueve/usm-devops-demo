package com.utec.backend.service;

import com.utec.backend.dto.reserva.ReservaStatsDto;
import com.utec.backend.model.Reserva;
import com.utec.backend.repository.ReservaEstadisticasRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.DayOfWeek;
import java.time.Duration;
import java.time.Instant;
import java.time.YearMonth;
import java.time.ZoneId;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Estadisticas de reservas, calculadas en la base.
 *
 * Las personales y las globales son la misma cuenta sobre distinto conjunto:
 * con usuarioId se limita a ese usuario, con null abarca todo el sistema.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ReservaEstadisticasService {

    /** Meses que se devuelven en la serie mensual, contando el actual. */
    private static final int MESES_SERIE = 12;

    /** Los meses se cuentan en la hora del campus, igual que las consultas. */
    private static final ZoneId ZONA = ZoneId.of("America/Montevideo");

    private final ReservaEstadisticasRepository repository;

    @Transactional(readOnly = true)
    public ReservaStatsDto calcular(Long usuarioId) {
        Instant ahora = Instant.now();
        YearMonth mesActual = YearMonth.from(ahora.atZone(ZONA));

        List<Object[]> filas = repository.resumen(usuarioId, ahora, mesActual.toString());
        if (filas.isEmpty()) {
            return vacio();
        }
        Object[] resumen = filas.get(0);
        long total = numero(resumen[0]).longValue();

        if (total == 0) {
            return vacio();
        }

        Map<String, Long> porMes = serieMensual(repository.conteoPorMes(usuarioId), mesActual);
        Map<String, Long> porEstado = porEstado(repository.conteoPorEstado(usuarioId));
        Map<String, Long> porDiaSemana = porDiaSemana(repository.conteoPorDiaSemana(usuarioId));

        List<Object[]> espacios = repository.conteoPorEspacio(usuarioId);
        Map<Long, Long> reservasPorEspacio = new LinkedHashMap<>();
        Map<String, Long> distribucionPorEspacio = new LinkedHashMap<>();
        for (Object[] fila : espacios) {
            reservasPorEspacio.put(numero(fila[0]).longValue(), numero(fila[2]).longValue());
            distribucionPorEspacio.put((String) fila[1], numero(fila[2]).longValue());
        }
        // La consulta ya viene ordenada de mayor a menor.
        Long espacioMasUsado = espacios.isEmpty() ? null : numero(espacios.get(0)[0]).longValue();
        String nombreEspacioMasUsado = espacios.isEmpty() ? null : (String) espacios.get(0)[1];

        Instant primera = instante(resumen[12]);
        Instant ultima = instante(resumen[13]);
        Instant proxima = instante(resumen[14]);

        String mesConMasReservas = porMes.entrySet().stream()
                .max(Map.Entry.comparingByValue())
                .map(Map.Entry::getKey)
                .orElse(null);

        double promedioPorMes = porMes.values().stream().mapToLong(Long::longValue).average().orElse(0.0);

        YearMonth mesAnterior = mesActual.minusMonths(1);
        long reservasMesActual = porMes.getOrDefault(mesActual.toString(), 0L);
        long reservasMesAnterior = porMes.getOrDefault(mesAnterior.toString(), 0L);
        long diferencia = reservasMesActual - reservasMesAnterior;
        double porcentajeCambio = reservasMesAnterior > 0
                ? (diferencia * 100.0) / reservasMesAnterior
                : 0.0;

        return new ReservaStatsDto(
                total,
                numero(resumen[1]).longValue(),
                numero(resumen[2]).longValue(),
                numero(resumen[3]).longValue(),
                numero(resumen[4]).longValue(),
                numero(resumen[5]).longValue(),
                numero(resumen[6]).longValue(),
                porEstado,

                reservasMesActual,
                porMes.getOrDefault(mesActual.plusMonths(1).toString(), 0L),
                reservasEsteAnio(porMes, mesActual.getYear()),
                porMes,
                porDiaSemana,
                mesConMasReservas,
                promedioPorMes,

                (long) reservasPorEspacio.size(),
                espacioMasUsado,
                nombreEspacioMasUsado,
                reservasPorEspacio,
                distribucionPorEspacio,

                numero(resumen[7]).doubleValue(),
                numero(resumen[8]).doubleValue(),
                numero(resumen[9]).doubleValue(),
                numero(resumen[10]).doubleValue(),
                numero(resumen[11]).doubleValue(),

                promedioPorSemana(total, primera, ahora),
                ultima != null ? Duration.between(ultima, ahora).toDays() : null,
                proxima != null ? Duration.between(ahora, proxima).toDays() : null,
                ultima,
                proxima,

                reservasMesActual,
                reservasMesAnterior,
                diferencia,
                porcentajeCambio
        );
    }

    /** Serie de los ultimos doce meses, con los meses sin reservas en cero. */
    private Map<String, Long> serieMensual(List<Object[]> filas, YearMonth mesActual) {
        Map<String, Long> contados = new HashMap<>();
        for (Object[] fila : filas) {
            contados.put((String) fila[0], numero(fila[1]).longValue());
        }

        Map<String, Long> serie = new LinkedHashMap<>();
        for (int i = MESES_SERIE - 1; i >= 0; i--) {
            String mes = mesActual.minusMonths(i).toString();
            serie.put(mes, contados.getOrDefault(mes, 0L));
        }
        return serie;
    }

    /** Todos los estados posibles, con cero los que no aparecen. */
    private Map<String, Long> porEstado(List<Object[]> filas) {
        Map<String, Long> conteo = new HashMap<>();
        for (Reserva.EstadoReserva estado : Reserva.EstadoReserva.values()) {
            conteo.put(estado.name(), 0L);
        }
        for (Object[] fila : filas) {
            conteo.put((String) fila[0], numero(fila[1]).longValue());
        }
        return conteo;
    }

    /** Los siete dias, con cero los que no aparecen. La base devuelve 1=lunes. */
    private Map<String, Long> porDiaSemana(List<Object[]> filas) {
        Map<String, Long> conteo = new HashMap<>();
        for (DayOfWeek dia : DayOfWeek.values()) {
            conteo.put(dia.name(), 0L);
        }
        for (Object[] fila : filas) {
            DayOfWeek dia = DayOfWeek.of(numero(fila[0]).intValue());
            conteo.put(dia.name(), numero(fila[1]).longValue());
        }
        return conteo;
    }

    private long reservasEsteAnio(Map<String, Long> porMes, int anio) {
        String prefijo = anio + "-";
        return porMes.entrySet().stream()
                .filter(e -> e.getKey().startsWith(prefijo))
                .mapToLong(Map.Entry::getValue)
                .sum();
    }

    /**
     * Promedio semanal desde la primera reserva. Con menos de una semana de
     * historia se cuenta como una, para no inflar el promedio.
     */
    private double promedioPorSemana(long total, Instant primera, Instant ahora) {
        if (primera == null) {
            return 0.0;
        }
        long dias = Duration.between(primera, ahora).toDays();
        long semanas = Math.max(1, dias / 7);
        return total / (double) semanas;
    }

    /** Los agregados nativos vuelven como BigDecimal, BigInteger o Long segun la funcion. */
    private Number numero(Object valor) {
        if (valor == null) {
            return 0;
        }
        if (valor instanceof Number n) {
            return n;
        }
        return new BigDecimal(valor.toString());
    }

    private Instant instante(Object valor) {
        if (valor == null) {
            return null;
        }
        if (valor instanceof Instant i) {
            return i;
        }
        if (valor instanceof java.sql.Timestamp t) {
            return t.toInstant();
        }
        if (valor instanceof java.time.OffsetDateTime o) {
            return o.toInstant();
        }
        return null;
    }

    private ReservaStatsDto vacio() {
        return new ReservaStatsDto(
                0L, 0L, 0L, 0L, 0L, 0L, 0L, Map.of(),
                0L, 0L, 0L, Map.of(), Map.of(), null, 0.0,
                0L, null, null, Map.of(), Map.of(),
                0.0, 0.0, 0.0, 0.0, 0.0,
                0.0, null, null, null, null,
                0L, 0L, 0L, 0.0
        );
    }
}
