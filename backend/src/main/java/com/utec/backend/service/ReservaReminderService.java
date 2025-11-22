package com.utec.backend.service;

import com.utec.backend.dto.reserva.ReservaResponseDto;
import com.utec.backend.model.Reserva;
import com.utec.backend.repository.ReservaRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Servicio para enviar recordatorios automáticos de reservas
 * Se ejecuta periódicamente para notificar a los usuarios sobre sus reservas próximas
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ReservaReminderService {

    private final ReservaRepository reservaRepository;
    private final EmailService emailService;
    private final ReservaService reservaService;
    
    // Set para rastrear reservas a las que ya se les envió recordatorio (evitar duplicados)
    // En producción, esto debería ser una tabla en la BD o usar Redis
    private final Set<Long> reservasConRecordatorioEnviado = ConcurrentHashMap.newKeySet();
    
    @Value("${app.reservas.reminder.hours-before:24}")
    private int horasAntesRecordatorio;
    
    @Value("${app.reservas.reminder.enabled:true}")
    private boolean recordatoriosHabilitados;

    /**
     * Tarea programada que se ejecuta cada hora para enviar recordatorios
     * Busca reservas aprobadas que inician en las próximas X horas y envía recordatorios
     */
    @Scheduled(cron = "0 0 * * * ?") // Cada hora en el minuto 0
    @Transactional(readOnly = true)
    public void enviarRecordatoriosProgramados() {
        if (!recordatoriosHabilitados) {
            log.debug("Recordatorios de reservas deshabilitados");
            return;
        }
        
        try {
            LocalDateTime ahora = LocalDateTime.now();
            LocalDateTime inicioDesde = ahora.plusHours(horasAntesRecordatorio);
            LocalDateTime inicioHasta = inicioDesde.plusHours(1); // Ventana de 1 hora
            
            log.info("Buscando reservas para recordatorio entre {} y {}", inicioDesde, inicioHasta);
            
            // Buscar reservas aprobadas que inician en el rango
            List<Reserva> reservas = reservaRepository.findReservasAprobadasEnRango(
                Reserva.EstadoReserva.APROBADO,
                inicioDesde,
                inicioHasta
            );
            
            if (reservas.isEmpty()) {
                log.debug("No se encontraron reservas para enviar recordatorios");
                return;
            }
            
            log.info("Encontradas {} reservas para enviar recordatorios", reservas.size());
            
            int enviados = 0;
            int errores = 0;
            
            for (Reserva reserva : reservas) {
                // Verificar si ya se envió recordatorio para esta reserva
                if (reservasConRecordatorioEnviado.contains(reserva.getId())) {
                    log.debug("Recordatorio ya enviado para reserva ID: {}", reserva.getId());
                    continue;
                }
                
                try {
                    // Convertir a DTO para el email (las relaciones ya están cargadas por JOIN FETCH)
                    ReservaResponseDto reservaDto = reservaService.mapToResponseDto(reserva);
                    
                    // Enviar email de recordatorio
                    boolean emailEnviado = emailService.enviarEmailRecordatorioReserva(
                        reserva.getUsuario().getEmail(),
                        reservaDto,
                        horasAntesRecordatorio
                    );
                    
                    if (emailEnviado) {
                        reservasConRecordatorioEnviado.add(reserva.getId());
                        enviados++;
                        log.info("Recordatorio enviado para reserva ID: {} al usuario: {}", 
                                reserva.getId(), reserva.getUsuario().getEmail());
                    } else {
                        errores++;
                        log.warn("No se pudo enviar recordatorio para reserva ID: {}", reserva.getId());
                    }
                } catch (Exception e) {
                    errores++;
                    log.error("Error al enviar recordatorio para reserva ID {}: {}", 
                            reserva.getId(), e.getMessage());
                }
            }
            
            log.info("Proceso de recordatorios completado. Enviados: {}, Errores: {}", enviados, errores);
            
            // Limpiar set de recordatorios enviados para reservas pasadas (cada 24 horas)
            limpiarRecordatoriosAntiguos(ahora);
            
        } catch (Exception e) {
            log.error("Error en tarea programada de recordatorios: {}", e.getMessage(), e);
        }
    }
    
    /**
     * Limpia el set de recordatorios enviados para reservas que ya pasaron
     * Esto evita que el set crezca indefinidamente
     */
    private void limpiarRecordatoriosAntiguos(LocalDateTime ahora) {
        // Esta es una implementación simple. En producción, se debería usar una tabla en BD
        // o un sistema de cache con TTL como Redis
        int tamañoAntes = reservasConRecordatorioEnviado.size();
        
        // Nota: En esta implementación simple, no podemos verificar fácilmente qué reservas
        // ya pasaron sin hacer queries adicionales. Por simplicidad, limitamos el tamaño
        // del set a 10000 entradas. En producción, usar BD o Redis con TTL.
        if (tamañoAntes > 10000) {
            reservasConRecordatorioEnviado.clear();
            log.info("Set de recordatorios limpiado (límite alcanzado)");
        }
    }
    
    /**
     * Método manual para enviar recordatorios (útil para testing o ejecución manual)
     * 
     * @param horasAntes Horas antes de la reserva para enviar el recordatorio
     * @return Número de recordatorios enviados
     */
    @Transactional(readOnly = true)
    public int enviarRecordatoriosManual(int horasAntes) {
        LocalDateTime ahora = LocalDateTime.now();
        LocalDateTime inicioDesde = ahora.plusHours(horasAntes);
        LocalDateTime inicioHasta = inicioDesde.plusHours(1);
        
        List<Reserva> reservas = reservaRepository.findReservasAprobadasEnRango(
            Reserva.EstadoReserva.APROBADO,
            inicioDesde,
            inicioHasta
        );
        
        int enviados = 0;
        for (Reserva reserva : reservas) {
            if (reservasConRecordatorioEnviado.contains(reserva.getId())) {
                continue;
            }
            
            try {
                // Convertir a DTO (las relaciones ya están cargadas por JOIN FETCH)
                ReservaResponseDto reservaDto = reservaService.mapToResponseDto(reserva);
                boolean emailEnviado = emailService.enviarEmailRecordatorioReserva(
                    reserva.getUsuario().getEmail(),
                    reservaDto,
                    horasAntes
                );
                
                if (emailEnviado) {
                    reservasConRecordatorioEnviado.add(reserva.getId());
                    enviados++;
                }
            } catch (Exception e) {
                log.error("Error al enviar recordatorio manual para reserva ID {}: {}", 
                        reserva.getId(), e.getMessage());
            }
        }
        
        return enviados;
    }
}

