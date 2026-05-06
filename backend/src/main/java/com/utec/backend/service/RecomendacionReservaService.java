package com.utec.backend.service;

import com.utec.backend.dto.recomendacion.HorarioRecomendadoDto;
import com.utec.backend.dto.recomendacion.RecomendacionEspacioDto;
import com.utec.backend.model.Espacio;
import com.utec.backend.model.Reserva;
import com.utec.backend.model.TipoRecomendacion;
import com.utec.backend.repository.EspacioRepository;
import com.utec.backend.repository.ReservaRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.LocalTime;
import java.time.ZoneOffset;
import java.time.ZonedDateTime;
import java.util.*;

/**
 * Servicio para recomendaciones relacionadas con reservas
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class RecomendacionReservaService {

    private final ReservaRepository reservaRepository;
    private final EspacioRepository espacioRepository;
    private final FileStorageService fileStorageService;

    /**
     * Obtener recomendaciones de espacios para una reserva
     */
    @Transactional(readOnly = true)
    public List<RecomendacionEspacioDto> obtenerRecomendacionesEspacios(
            Long usuarioId,
            Instant inicio,
            Instant fin,
            Integer capacidadRequerida) {

        log.debug("Obteniendo recomendaciones de espacios para usuario {} entre {} y {}",
                usuarioId, inicio, fin);

        // 1. Obtener historial del usuario
        List<Reserva> historial = reservaRepository.findByUsuarioId(usuarioId);
        Instant hace6Meses = Instant.now().minusSeconds(6 * 30 * 24 * 3600L);
        List<Reserva> historialAprobado = historial.stream()
                .filter(r -> r.getEstado() == Reserva.EstadoReserva.APROBADO)
                .filter(r -> r.getInicio().isAfter(hace6Meses)) // Últimos 6 meses
                .toList();

        // 2. Obtener espacios disponibles
        List<Espacio> espaciosDisponibles = espacioRepository.findEspaciosDisponibles(inicio, fin);
        espaciosDisponibles = espaciosDisponibles.stream()
                .filter(e -> e.getDeletedAt() == null)
                .filter(e -> "DISPONIBLE".equals(e.getEstado()))
                .filter(e -> capacidadRequerida == null || e.getCapacidad() >= capacidadRequerida)
                .toList();

        // 3. Calcular puntajes
        Map<Long, Double> puntajes = new HashMap<>();

        for (Espacio espacio : espaciosDisponibles) {
            double puntaje = 0.0;

            // Puntaje por historial (35%)
            long vecesReservado = historialAprobado.stream()
                    .filter(r -> r.getEspacio().getId().equals(espacio.getId()))
                    .count();
            puntaje += (vecesReservado * 0.35);

            // Puntaje por similitud (25%)
            double similitud = calcularSimilitudEspacio(espacio, historialAprobado);
            puntaje += (similitud * 0.25);

            // Puntaje por disponibilidad (20%)
            puntaje += 0.20; // Ya está disponible

            // Puntaje por popularidad (10%)
            long totalReservas = reservaRepository.countByEspacioIdAndEstado(
                    espacio.getId(), Reserva.EstadoReserva.APROBADO);
            double popularidad = Math.min(totalReservas / 10.0, 1.0); // Normalizar
            puntaje += (popularidad * 0.10);

            // Puntaje por capacidad adecuada (10%)
            if (capacidadRequerida != null) {
                double capacidadAdecuada = 1.0
                        - Math.abs(espacio.getCapacidad() - capacidadRequerida) / (double) capacidadRequerida;
                capacidadAdecuada = Math.max(0, capacidadAdecuada);
                puntaje += (capacidadAdecuada * 0.10);
            } else {
                puntaje += 0.10;
            }

            puntajes.put(espacio.getId(), puntaje);
        }

        // 4. Crear DTOs ordenados por puntaje
        return espaciosDisponibles.stream()
                .map(espacio -> {
                    RecomendacionEspacioDto dto = new RecomendacionEspacioDto();
                    dto.setId(null); // Se asignará al guardar
                    dto.setTipoRecomendacion(TipoRecomendacion.ESPACIO_PARA_RESERVA);
                    dto.setPuntaje(BigDecimal.valueOf(puntajes.getOrDefault(espacio.getId(), 0.0))
                            .setScale(2, RoundingMode.HALF_UP));
                    dto.setRazon(generarRazonEspacio(espacio, historialAprobado));
                    dto.setEspacioId(espacio.getId());
                    dto.setEspacioNombre(espacio.getNombre());

                    String imagenUrl = espacio.getImagenUrl();
                    if (imagenUrl != null && !imagenUrl.trim().isEmpty()) {
                        dto.setEspacioImagen(fileStorageService.getImageUrl(imagenUrl));
                    } else {
                        dto.setEspacioImagen(null);
                    }

                    dto.setCapacidad(espacio.getCapacidad());
                    dto.setTipoEspacioId(espacio.getTipoEspacioId());
                    if (espacio.getTipoEspacio() != null) {
                        dto.setTipoEspacioNombre(espacio.getTipoEspacio().getNombre());
                        dto.setTipoEspacioColor(espacio.getTipoEspacio().getColor());
                    }
                    dto.setEstado(espacio.getEstado());
                    dto.setDisponible(true);
                    return dto;
                })
                .sorted((a, b) -> b.getPuntaje().compareTo(a.getPuntaje()))
                .limit(20)
                .toList();
    }

    /**
     * Obtener horarios óptimos para un espacio y fecha
     */
    @Transactional(readOnly = true)
    public List<HorarioRecomendadoDto> obtenerHorariosOptimos(
            Long usuarioId,
            Long espacioId,
            Instant fecha) {

        log.debug("Obteniendo horarios óptimos para usuario {} en espacio {} para fecha {}",
                usuarioId, espacioId, fecha);

        // 1. Obtener historial del usuario
        List<Reserva> historial = reservaRepository.findByUsuarioId(usuarioId);
        List<Reserva> historialAprobado = historial.stream()
                .filter(r -> r.getEstado() == Reserva.EstadoReserva.APROBADO)
                .filter(r -> r.getEspacio().getId().equals(espacioId))
                .toList();

        // 2. Analizar patrones de horarios
        ZonedDateTime fechaZdt = fecha.atZone(ZoneOffset.UTC);
        Map<LocalTime, Long> horariosFrecuentes = new HashMap<>();
        for (Reserva r : historialAprobado) {
            LocalTime horaInicio = r.getInicio().atZone(ZoneOffset.UTC).toLocalTime();
            horariosFrecuentes.put(horaInicio, horariosFrecuentes.getOrDefault(horaInicio, 0L) + 1);
        }

        // 3. Obtener reservas existentes del espacio en esa fecha
        ZonedDateTime inicioDia = fechaZdt.withHour(0).withMinute(0).withSecond(0).withNano(0);
        List<Reserva> reservasExistentes = reservaRepository.findFutureReservasByEspacio(
                espacioId, inicioDia.toInstant(), Reserva.EstadoReserva.APROBADO);
        reservasExistentes = reservasExistentes.stream()
                .filter(r -> r.getInicio().atZone(ZoneOffset.UTC).toLocalDate().equals(fechaZdt.toLocalDate()))
                .toList();

        // 4. Generar horarios recomendados
        List<HorarioRecomendadoDto> horarios = new ArrayList<>();
        LocalTime horaActual = LocalTime.of(8, 0); // Empezar a las 8 AM
        LocalTime horaFin = LocalTime.of(20, 0); // Hasta las 8 PM

        while (horaActual.isBefore(horaFin)) {
            ZonedDateTime inicio = fechaZdt.with(horaActual);
            ZonedDateTime fin = inicio.plusHours(2); // Recomendar bloques de 2 horas
            Instant inicioInstant = inicio.toInstant();
            Instant finInstant = fin.toInstant();

            // Verificar disponibilidad
            boolean disponible = reservasExistentes.stream()
                    .noneMatch(r -> inicioInstant.isBefore(r.getFin()) && finInstant.isAfter(r.getInicio()));

            if (disponible) {
                HorarioRecomendadoDto dto = new HorarioRecomendadoDto();
                dto.setInicio(inicioInstant);
                dto.setFin(finInstant);
                dto.setDisponible(true);

                // Calcular puntaje basado en frecuencia
                long frecuencia = horariosFrecuentes.getOrDefault(horaActual, 0L);
                double puntaje = Math.min(frecuencia / 5.0, 1.0); // Normalizar
                if (puntaje == 0)
                    puntaje = 0.5; // Puntaje base si no hay historial

                dto.setPuntaje(BigDecimal.valueOf(puntaje).setScale(2, RoundingMode.HALF_UP));
                dto.setRazon(frecuencia > 0
                        ? String.format("Horario frecuentemente usado (%d veces)", frecuencia)
                        : "Horario disponible");
                dto.setConflictosPotenciales(0);

                horarios.add(dto);
            }

            horaActual = horaActual.plusHours(1);
        }

        return horarios.stream()
                .sorted((a, b) -> b.getPuntaje().compareTo(a.getPuntaje()))
                .limit(10)
                .toList();
    }

    /**
     * Obtener espacios similares a uno dado
     */
    @Transactional(readOnly = true)
    public List<RecomendacionEspacioDto> obtenerEspaciosSimilares(Long espacioId, Long usuarioId) {
        log.debug("Obteniendo espacios similares a {} para usuario {}", espacioId, usuarioId);

        Espacio espacioOriginal = espacioRepository.findById(espacioId)
                .orElseThrow(() -> new RuntimeException("Espacio no encontrado"));

        List<Espacio> todosEspacios = espacioRepository.findAll();
        List<Espacio> espaciosSimilares = todosEspacios.stream()
                .filter(e -> !e.getId().equals(espacioId))
                .filter(e -> e.getDeletedAt() == null)
                .filter(e -> "DISPONIBLE".equals(e.getEstado()))
                .toList();

        return espaciosSimilares.stream()
                .map(espacio -> {
                    double similitud = calcularSimilitudEntreEspacios(espacioOriginal, espacio);

                    RecomendacionEspacioDto dto = new RecomendacionEspacioDto();
                    dto.setTipoRecomendacion(TipoRecomendacion.ESPACIO_SIMILAR);
                    dto.setPuntaje(BigDecimal.valueOf(similitud).setScale(2, RoundingMode.HALF_UP));
                    dto.setRazon(String.format("Similar a %s (tipo: %s, capacidad: %d)",
                            espacioOriginal.getNombre(),
                            espacio.getTipoEspacio() != null ? espacio.getTipoEspacio().getNombre() : "N/A",
                            espacioOriginal.getCapacidad()));
                    dto.setEspacioId(espacio.getId());
                    dto.setEspacioNombre(espacio.getNombre());

                    String imagenUrl = espacio.getImagenUrl();
                    if (imagenUrl != null && !imagenUrl.trim().isEmpty()) {
                        dto.setEspacioImagen(fileStorageService.getImageUrl(imagenUrl));
                    } else {
                        dto.setEspacioImagen(null);
                    }

                    dto.setCapacidad(espacio.getCapacidad());
                    dto.setTipoEspacioId(espacio.getTipoEspacioId());
                    if (espacio.getTipoEspacio() != null) {
                        dto.setTipoEspacioNombre(espacio.getTipoEspacio().getNombre());
                        dto.setTipoEspacioColor(espacio.getTipoEspacio().getColor());
                    }
                    dto.setEstado(espacio.getEstado());
                    dto.setDisponible(true);
                    return dto;
                })
                .sorted((a, b) -> b.getPuntaje().compareTo(a.getPuntaje()))
                .limit(10)
                .toList();
    }

    // Métodos auxiliares privados

    private double calcularSimilitudEspacio(Espacio espacio, List<Reserva> historial) {
        if (historial.isEmpty())
            return 0.5; // Puntaje neutro

        // Espacios más reservados por el usuario
        long vecesReservado = historial.stream()
                .filter(r -> r.getEspacio().getId().equals(espacio.getId()))
                .count();

        return Math.min(vecesReservado / 5.0, 1.0); // Normalizar
    }

    private double calcularSimilitudEntreEspacios(Espacio e1, Espacio e2) {
        double similitud = 0.0;

        // Similitud por tipo (40%)
        if (e1.getTipoEspacioId().equals(e2.getTipoEspacioId())) {
            similitud += 0.4;
        }

        // Similitud por capacidad (30%)
        int diffCapacidad = Math.abs(e1.getCapacidad() - e2.getCapacidad());
        double similitudCapacidad = 1.0 - (diffCapacidad / (double) Math.max(e1.getCapacidad(), e2.getCapacidad()));
        similitud += (similitudCapacidad * 0.3);

        // Similitud por estado (30%)
        if (e1.getEstado().equals(e2.getEstado())) {
            similitud += 0.3;
        }

        return Math.min(similitud, 1.0);
    }

    private String generarRazonEspacio(Espacio espacio, List<Reserva> historial) {
        long vecesReservado = historial.stream()
                .filter(r -> r.getEspacio().getId().equals(espacio.getId()))
                .count();

        if (vecesReservado > 0) {
            return String.format("Espacio frecuentemente usado por ti (%d reservas anteriores)", vecesReservado);
        } else {
            return "Espacio disponible con características similares a tus preferencias";
        }
    }
}
