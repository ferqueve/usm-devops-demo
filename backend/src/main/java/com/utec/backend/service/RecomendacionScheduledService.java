package com.utec.backend.service;

import com.utec.backend.dto.recomendacion.RecomendacionEspacioDto;
import com.utec.backend.model.Reserva;
import com.utec.backend.repository.ReservaRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Servicio para tareas programadas de recomendaciones
 * Actualiza recomendaciones en batch durante horarios de bajo tráfico
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class RecomendacionScheduledService {
    
    private final RecomendacionService recomendacionService;
    private final ReservaRepository reservaRepository;
    
    /**
     * Actualizar recomendaciones batch para usuarios activos
     * Se ejecuta diariamente a las 2 AM
     */
    @Scheduled(cron = "0 0 2 * * ?")
    @Transactional
    public void actualizarRecomendacionesBatch() {
        log.info("Iniciando actualización batch de recomendaciones");
        
        try {
            // Obtener usuarios activos (con reservas en últimos 30 días)
            Instant fechaLimite = Instant.now().minusSeconds(30L * 24 * 3600);
            List<Reserva> reservasRecientes = reservaRepository.findAll();
            List<Long> usuariosActivos = reservasRecientes.stream()
                .filter(r -> r.getInicio().isAfter(fechaLimite))
                .map(r -> r.getUsuario().getId())
                .distinct()
                .toList();
            
            log.info("Encontrados {} usuarios activos para actualizar recomendaciones", usuariosActivos.size());
            
            int procesados = 0;
            int errores = 0;
            
            for (Long usuarioId : usuariosActivos) {
                try {
                    // Calcular recomendaciones para el usuario
                    Instant ahora = Instant.now();
                    Instant finSemana = ahora.plusSeconds(7L * 24 * 3600);
                    List<RecomendacionEspacioDto> recomendaciones = recomendacionService
                        .obtenerRecomendacionesEspacios(usuarioId, ahora, finSemana, null);
                    
                    // Guardar top 20 en BD
                    if (!recomendaciones.isEmpty()) {
                        recomendacionService.guardarTop20EnBD(usuarioId, recomendaciones);
                        procesados++;
                    }
                } catch (Exception e) {
                    log.error("Error procesando recomendaciones para usuario {}: {}", usuarioId, e.getMessage());
                    errores++;
                }
            }
            
            log.info("Actualización batch completada: {} procesados, {} errores", procesados, errores);
            
        } catch (Exception e) {
            log.error("Error en actualización batch de recomendaciones: {}", e.getMessage(), e);
        }
    }
    
    /**
     * Pre-calcular métricas base para recomendaciones
     * Se ejecuta diariamente a las 2:30 AM (después de actualizar recomendaciones)
     */
    @Scheduled(cron = "0 30 2 * * ?")
    @Transactional(readOnly = true)
    public void precalcularMetricasBase() {
        log.info("Iniciando pre-cálculo de métricas base para recomendaciones");
        
        try {
            // Aquí se podrían pre-calcular métricas pesadas como:
            // - Similitud entre espacios
            // - Popularidad de espacios
            // - Patrones temporales globales
            // Por ahora, estas métricas se calculan on-demand
            
            log.info("Pre-cálculo de métricas base completado");
            
        } catch (Exception e) {
            log.error("Error en pre-cálculo de métricas base: {}", e.getMessage(), e);
        }
    }
}

