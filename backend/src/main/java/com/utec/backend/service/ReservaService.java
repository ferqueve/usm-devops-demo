package com.utec.backend.service;

import com.utec.backend.dto.reserva.ReservaCreateDto;
import com.utec.backend.dto.reserva.ReservaResponseDto;
import com.utec.backend.dto.reserva.ReservaUpdateDto;
import com.utec.backend.exception.UsuarioNotFoundException;
import com.utec.backend.model.Espacio;
import com.utec.backend.model.Reserva;
import com.utec.backend.model.Usuario;
import com.utec.backend.repository.EspacioRepository;
import com.utec.backend.repository.ReservaRepository;
import com.utec.backend.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ReservaService {
    
    private final ReservaRepository reservaRepository;
    private final EspacioRepository espacioRepository;
    private final UsuarioRepository usuarioRepository;
    
    /**
     * Crear una nueva reserva con manejo robusto de concurrencia
     * USADO POR: Admin y Analista (auto-aprobadas)
     */
    @Transactional(isolation = Isolation.SERIALIZABLE, rollbackFor = Exception.class)
    public ReservaResponseDto createReserva(ReservaCreateDto createDto, String userEmail) {
        log.info("Creando reserva para usuario: {}", userEmail);
        
        // 1. Validar y obtener usuario autenticado
        Usuario usuario = usuarioRepository.findByEmail(userEmail)
                .orElseThrow(() -> new UsuarioNotFoundException("Usuario no encontrado: " + userEmail));
        
        // 2. Validar y obtener espacio
        Espacio espacio = espacioRepository.findById(createDto.getEspacioId())
                .orElseThrow(() -> new RuntimeException("Espacio no encontrado con ID: " + createDto.getEspacioId()));
        
        // 3. Validar que el espacio está disponible
        if (!"DISPONIBLE".equals(espacio.getEstado())) {
            throw new RuntimeException("El espacio no está disponible. Estado actual: " + espacio.getEstado());
        }
        
        // 4. Validar horarios lógicos
        if (!createDto.getInicio().isBefore(createDto.getFin())) {
            throw new RuntimeException("La fecha de inicio debe ser anterior a la fecha de fin");
        }
        
        // 5. Validar que no sea en el pasado
        if (createDto.getInicio().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("No se puede reservar en el pasado");
        }
        
        // 6. Validar duración mínima (30 minutos)
        long durationMinutes = java.time.Duration.between(createDto.getInicio(), createDto.getFin()).toMinutes();
        if (durationMinutes < 30) {
            throw new RuntimeException("La reserva debe tener una duración mínima de 30 minutos");
        }
        
        // 7. VALIDACIÓN CRÍTICA: Verificar conflictos con LOCK PESIMISTA
        // Este lock previene race conditions y garantiza atomicidad
        List<Reserva> conflictos = reservaRepository.findConflictingReservas(
                createDto.getEspacioId(),
                createDto.getInicio(),
                createDto.getFin(),
                Reserva.EstadoReserva.APROBADO
        );
        
        if (!conflictos.isEmpty()) {
            log.warn("Conflicto de horario detectado. Espacio ocupado en ese rango de tiempo");
            throw new RuntimeException("El espacio ya está reservado en ese horario. Por favor, seleccione otro horario.");
        }
        
        // 7. Crear la reserva con estado APROBADO (Admin/Analista)
        Reserva reserva = new Reserva();
        reserva.setEspacio(espacio);
        reserva.setUsuario(usuario);
        reserva.setInicio(createDto.getInicio());
        reserva.setFin(createDto.getFin());
        reserva.setEstado(Reserva.EstadoReserva.APROBADO); // Auto-aprobada
        
        Reserva savedReserva = reservaRepository.save(reserva);
        log.info("Reserva creada exitosamente. ID: {}, Espacio: {}, Usuario: {}", 
                savedReserva.getId(), espacio.getNombre(), usuario.getNombre());
        
        // 8. Retornar DTO con datos completos
        return mapToResponseDto(savedReserva);
    }
    
    /**
     * Obtener todas las reservas del usuario autenticado
     */
    @Transactional(readOnly = true)
    public List<ReservaResponseDto> getReservasByUsuario(String userEmail) {
        Usuario usuario = usuarioRepository.findByEmail(userEmail)
                .orElseThrow(() -> new UsuarioNotFoundException("Usuario no encontrado: " + userEmail));
        
        List<Reserva> reservas = reservaRepository.findByUsuarioId(usuario.getId());
        return reservas.stream()
                .map(this::mapToResponseDto)
                .collect(Collectors.toList());
    }
    
    /**
     * Obtener una reserva por ID
     */
    @Transactional(readOnly = true)
    public ReservaResponseDto getReservaById(Long id, String userEmail) {
        Usuario usuario = usuarioRepository.findByEmail(userEmail)
                .orElseThrow(() -> new UsuarioNotFoundException("Usuario no encontrado: " + userEmail));
        
        Reserva reserva = reservaRepository.findByIdWithRelations(id);
        if (reserva == null) {
            throw new RuntimeException("Reserva no encontrada con ID: " + id);
        }
        
        // Verificar que el usuario es dueño de la reserva
        if (!reserva.getUsuario().getId().equals(usuario.getId())) {
            throw new RuntimeException("No tienes permisos para ver esta reserva");
        }
        
        return mapToResponseDto(reserva);
    }
    
    /**
     * Actualizar una reserva con validaciones de concurrencia
     */
    @Transactional(isolation = Isolation.SERIALIZABLE, rollbackFor = Exception.class)
    public ReservaResponseDto updateReserva(Long id, ReservaUpdateDto updateDto, String userEmail) {
        log.info("Actualizando reserva ID: {} para usuario: {}", id, userEmail);
        
        Usuario usuario = usuarioRepository.findByEmail(userEmail)
                .orElseThrow(() -> new UsuarioNotFoundException("Usuario no encontrado: " + userEmail));
        
        Reserva reserva = reservaRepository.findByIdWithRelations(id);
        if (reserva == null) {
            throw new RuntimeException("Reserva no encontrada con ID: " + id);
        }
        
        // Verificar que el usuario es dueño de la reserva
        if (!reserva.getUsuario().getId().equals(usuario.getId())) {
            throw new RuntimeException("No tienes permisos para editar esta reserva");
        }
        
        // Si está cancelada, no se puede editar
        if (reserva.getEstado() == Reserva.EstadoReserva.CANCELADO) {
            throw new RuntimeException("No se puede editar una reserva cancelada");
        }
        
        // Si ya pasó, no se puede editar
        if (reserva.getInicio().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("No se puede editar una reserva que ya pasó");
        }
        
        // Actualizar campos si se proporcionaron
        boolean cambioHorarios = false;
        if (updateDto.getInicio() != null && updateDto.getFin() != null) {
            // Validar nuevos horarios
            if (!updateDto.getInicio().isBefore(updateDto.getFin())) {
                throw new RuntimeException("La fecha de inicio debe ser anterior a la fecha de fin");
            }
            
            if (updateDto.getInicio().isBefore(LocalDateTime.now())) {
                throw new RuntimeException("No se puede reservar en el pasado");
            }
            
            // Validar duración mínima (30 minutos)
            long durationMinutes = java.time.Duration.between(updateDto.getInicio(), updateDto.getFin()).toMinutes();
            if (durationMinutes < 30) {
                throw new RuntimeException("La reserva debe tener una duración mínima de 30 minutos");
            }
            
            // Verificar conflictos con los nuevos horarios
            List<Reserva> conflictos = reservaRepository.findConflictingReservas(
                    reserva.getEspacio().getId(),
                    updateDto.getInicio(),
                    updateDto.getFin(),
                    Reserva.EstadoReserva.APROBADO
            );
            
            // Excluir la reserva actual de los conflictos
            conflictos = conflictos.stream()
                    .filter(r -> !r.getId().equals(id))
                    .collect(Collectors.toList());
            
            if (!conflictos.isEmpty()) {
                throw new RuntimeException("El espacio ya está reservado en ese horario");
            }
            
            reserva.setInicio(updateDto.getInicio());
            reserva.setFin(updateDto.getFin());
            cambioHorarios = true;
        }
        
        if (updateDto.getEstado() != null) {
            reserva.setEstado(updateDto.getEstado());
        }
        
        Reserva updatedReserva = reservaRepository.save(reserva);
        
        if (cambioHorarios) {
            log.info("Horarios actualizados para reserva ID: {}", id);
        }
        
        return mapToResponseDto(updatedReserva);
    }
    
    /**
     * Cancelar una reserva
     */
    @Transactional
    public void cancelReserva(Long id, String userEmail) {
        log.info("Cancelando reserva ID: {} para usuario: {}", id, userEmail);
        
        Usuario usuario = usuarioRepository.findByEmail(userEmail)
                .orElseThrow(() -> new UsuarioNotFoundException("Usuario no encontrado: " + userEmail));
        
        Reserva reserva = reservaRepository.findById(id).orElseThrow(
                () -> new RuntimeException("Reserva no encontrada con ID: " + id)
        );
        
        // Verificar que el usuario es dueño de la reserva
        if (!reserva.getUsuario().getId().equals(usuario.getId())) {
            throw new RuntimeException("No tienes permisos para cancelar esta reserva");
        }
        
        // Si ya pasó, no se puede cancelar
        if (reserva.getInicio().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("No se puede cancelar una reserva que ya pasó");
        }
        
        // Si ya está cancelada
        if (reserva.getEstado() == Reserva.EstadoReserva.CANCELADO) {
            throw new RuntimeException("La reserva ya está cancelada");
        }
        
        reserva.setEstado(Reserva.EstadoReserva.CANCELADO);
        reservaRepository.save(reserva);
        
        log.info("Reserva ID: {} cancelada exitosamente", id);
    }
    
    /**
     * Obtener reservas de un espacio específico
     */
    @Transactional(readOnly = true)
    public List<ReservaResponseDto> getReservasByEspacio(Long espacioId) {
        List<Reserva> reservas = reservaRepository.findByEspacioId(espacioId);
        return reservas.stream()
                .map(this::mapToResponseDto)
                .collect(Collectors.toList());
    }
    
    /**
     * Mapear entidad Reserva a DTO de respuesta
     */
    private ReservaResponseDto mapToResponseDto(Reserva reserva) {
        ReservaResponseDto dto = new ReservaResponseDto();
        dto.setId(reserva.getId());
        dto.setEspacioId(reserva.getEspacio().getId());
        dto.setEspacioNombre(reserva.getEspacio().getNombre());
        dto.setEspacioImagen(reserva.getEspacio().getImagenUrl());
        dto.setCapacidadEspacio(reserva.getEspacio().getCapacidad());
        dto.setUsuarioId(reserva.getUsuario().getId());
        dto.setUsuarioNombre(reserva.getUsuario().getNombre());
        dto.setUsuarioEmail(reserva.getUsuario().getEmail());
        dto.setInicio(reserva.getInicio());
        dto.setFin(reserva.getFin());
        dto.setEstado(reserva.getEstado());
        dto.setCreatedAt(reserva.getCreatedAt());
        dto.setUpdatedAt(reserva.getUpdatedAt());
        return dto;
    }
}

