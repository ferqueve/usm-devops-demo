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

import org.springframework.data.redis.core.StringRedisTemplate;

import java.time.Duration;
import java.time.Instant;
import java.util.List;

/**
 * Servicio para enviar recordatorios automáticos de reservas
 * Se ejecuta periódicamente para notificar a los usuarios sobre sus reservas próximas
 * Usa Redis para rastrear recordatorios enviados con TTL automático
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ReservaReminderService {

    private final ReservaRepository reservaRepository;
    private final EmailService emailService;
    private final ReservaService reservaService;
    private final StringRedisTemplate redisTemplate;
    
    private static final String REMINDER_SENT_KEY_PREFIX = "reminders:sent:";
    // TTL de 48 horas para cubrir reservas hasta 24h después del evento
    private static final Duration REMINDER_TTL = Duration.ofHours(48);
    
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
            Instant ahora = Instant.now();
            Instant inicioDesde = ahora.plusSeconds((long) horasAntesRecordatorio * 3600);
            Instant inicioHasta = inicioDesde.plusSeconds(3600); // Ventana de 1 hora
            
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
                // Verificar si ya se envió recordatorio para esta reserva en Redis
                String reminderKey = REMINDER_SENT_KEY_PREFIX + reserva.getId();
                Boolean alreadySent = redisTemplate.hasKey(reminderKey);

                if (Boolean.TRUE.equals(alreadySent)) {
                    log.debug("Recordatorio ya enviado para reserva ID: {}", reserva.getId());
                    continue;
                }

                if (intentarEnviarRecordatorio(reserva, reminderKey)) {
                    enviados++;
                } else {
                    errores++;
                }
            }
            
            log.info("Proceso de recordatorios completado. Enviados: {}, Errores: {}", enviados, errores);
            // Redis maneja automáticamente la expiración de recordatorios mediante TTL
            
        } catch (Exception e) {
            log.error("Error en tarea programada de recordatorios: {}", e.getMessage(), e);
        }
    }

    private boolean intentarEnviarRecordatorio(Reserva reserva, String reminderKey) {
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
                // Guardar en Redis con TTL de 48 horas
                redisTemplate.opsForValue().set(reminderKey, "1", REMINDER_TTL);
                log.info("Recordatorio enviado para reserva ID: {} al usuario: {}",
                        reserva.getId(), reserva.getUsuario().getEmail());
                return true;
            }
            log.warn("No se pudo enviar recordatorio para reserva ID: {}", reserva.getId());
            return false;
        } catch (Exception e) {
            log.error("Error al enviar recordatorio para reserva ID {}: {}",
                    reserva.getId(), e.getMessage());
            return false;
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
        Instant ahora = Instant.now();
        Instant inicioDesde = ahora.plusSeconds((long) horasAntes * 3600);
        Instant inicioHasta = inicioDesde.plusSeconds(3600);
        
        List<Reserva> reservas = reservaRepository.findReservasAprobadasEnRango(
            Reserva.EstadoReserva.APROBADO,
            inicioDesde,
            inicioHasta
        );
        
        int enviados = 0;
        for (Reserva reserva : reservas) {
            // Verificar si ya se envió recordatorio para esta reserva en Redis
            String reminderKey = REMINDER_SENT_KEY_PREFIX + reserva.getId();
            Boolean alreadySent = redisTemplate.hasKey(reminderKey);
            
            if (Boolean.TRUE.equals(alreadySent)) {
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
                    // Guardar en Redis con TTL de 48 horas
                    redisTemplate.opsForValue().set(reminderKey, "1", REMINDER_TTL);
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

