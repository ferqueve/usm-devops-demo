package com.utec.backend.service;

import com.utec.backend.repository.HechosReservaRepository;
import com.utec.backend.repository.ReservaRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Servicio de lectura de la capa analítica. Consume las tablas de hechos para
 * responder las nuevas métricas (ocupación, heatmap, por carrera/edificio,
 * top usuarios) que alimentan la página /statistics.
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class EstadisticasReservaService {

    /**
     * Horas asumidas por día como denominador del cálculo de ocupación.
     * Aproxima un horario académico extendido (08:00 - 22:00).
     */
    private static final int HORAS_DISPONIBLES_POR_DIA = 14;
    private static final int DEFAULT_TOP_USUARIOS = 10;

    private final HechosReservaRepository hechosReservaRepository;
    private final ReservaRepository reservaRepository;

    public List<Map<String, Object>> ocupacionPorEspacio(LocalDate desde, LocalDate hasta) {
        long dias = ChronoUnit.DAYS.between(desde, hasta) + 1;
        BigDecimal horasDisponibles = BigDecimal.valueOf(dias * HORAS_DISPONIBLES_POR_DIA);

        return hechosReservaRepository.ocupacionPorEspacio(desde, hasta).stream()
                .map(row -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("espacioId", row[0]);
                    m.put("espacioNombre", row[1]);
                    BigDecimal horasReservadas = row[2] == null ? BigDecimal.ZERO : (BigDecimal) row[2];
                    m.put("horasReservadas", horasReservadas);
                    m.put("horasDisponibles", horasDisponibles);
                    BigDecimal porcentaje = horasDisponibles.signum() == 0
                            ? BigDecimal.ZERO
                            : horasReservadas.multiply(BigDecimal.valueOf(100))
                                    .divide(horasDisponibles, 2, RoundingMode.HALF_UP);
                    m.put("porcentaje", porcentaje);
                    return m;
                })
                .toList();
    }

    public List<Map<String, Object>> heatmapDiaHora(LocalDate desde, LocalDate hasta) {
        Instant desdeInstant = desde.atStartOfDay(ZoneOffset.UTC).toInstant();
        Instant hastaInstant = hasta.plusDays(1).atStartOfDay(ZoneOffset.UTC).toInstant();
        return reservaRepository.heatmapDiaHora(desdeInstant, hastaInstant).stream()
                .map(row -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("diaSemana", row[0]);
                    m.put("hora", row[1]);
                    m.put("cant", row[2]);
                    return m;
                })
                .toList();
    }

    public List<Map<String, Object>> resumenPorCarrera(LocalDate desde, LocalDate hasta) {
        return hechosReservaRepository.resumenPorCarrera(desde, hasta).stream()
                .map(row -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("carreraId", row[0]);
                    m.put("carreraNombre", row[1] == null ? "Sin carrera" : row[1]);
                    long aprobadas = ((Number) row[2]).longValue();
                    long canceladas = ((Number) row[3]).longValue();
                    m.put("aprobadas", aprobadas);
                    m.put("canceladas", canceladas);
                    long total = aprobadas + canceladas;
                    BigDecimal tasaCancelacion = total == 0
                            ? BigDecimal.ZERO
                            : BigDecimal.valueOf(canceladas * 100.0 / total)
                                    .setScale(2, RoundingMode.HALF_UP);
                    m.put("tasaCancelacion", tasaCancelacion);
                    return m;
                })
                .toList();
    }

    public List<Map<String, Object>> resumenPorEdificio(LocalDate desde, LocalDate hasta) {
        return hechosReservaRepository.resumenPorEdificio(desde, hasta).stream()
                .map(row -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("edificioId", row[0]);
                    m.put("edificioNombre", row[1] == null ? "Sin edificio" : row[1]);
                    m.put("cantReservas", row[2]);
                    return m;
                })
                .toList();
    }

    public List<Map<String, Object>> topUsuarios(LocalDate desde, LocalDate hasta, Integer limite) {
        Instant desdeInstant = desde.atStartOfDay(ZoneOffset.UTC).toInstant();
        Instant hastaInstant = hasta.plusDays(1).atStartOfDay(ZoneOffset.UTC).toInstant();
        int top = limite == null || limite <= 0 ? DEFAULT_TOP_USUARIOS : limite;
        return reservaRepository.topUsuariosReservadores(desdeInstant, hastaInstant, top).stream()
                .map(row -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("usuarioId", row[0]);
                    m.put("nombre", row[1]);
                    m.put("email", row[2]);
                    m.put("cantReservas", row[3]);
                    return m;
                })
                .toList();
    }
}
