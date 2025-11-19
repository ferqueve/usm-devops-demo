package com.utec.backend.service;

import com.utec.backend.dto.reserva.ReservaCreateDto;
import com.utec.backend.dto.reserva.ReservaResponseDto;
import com.utec.backend.dto.reserva.ReservaStatsDto;
import com.utec.backend.dto.reserva.ReservaUpdateDto;
import com.utec.backend.exception.UsuarioNotFoundException;
import com.utec.backend.model.Carrera;
import com.utec.backend.model.Espacio;
import com.utec.backend.model.Reserva;
import com.utec.backend.model.Usuario;
import com.utec.backend.repository.CarreraRepository;
import com.utec.backend.repository.EspacioRepository;
import com.utec.backend.repository.ReservaRepository;
import com.utec.backend.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.Duration;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.*;
import java.util.stream.Collectors;
import jakarta.persistence.criteria.Predicate;

import static com.utec.backend.security.Constants.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class ReservaService {
    
    private final ReservaRepository reservaRepository;
    private final EspacioRepository espacioRepository;
    private final UsuarioRepository usuarioRepository;
    private final CarreraRepository carreraRepository;
    private final ReservaItemSolicitadoService reservaItemSolicitadoService;
    
    /**
     * Crear una nueva reserva con manejo robusto de concurrencia
     * USADO POR: 
     * - Admin y Analista: crean reservas auto-aprobadas (APROBADO)
     * - Docente: crea solicitudes pendientes (PENDIENTE)
     */
    @Transactional(isolation = Isolation.SERIALIZABLE, rollbackFor = Exception.class)
    public ReservaResponseDto createReserva(ReservaCreateDto createDto, String userEmail, String userRole) {
        log.info("Creando reserva para usuario: {} con rol: {}", userEmail, userRole);
        
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
        
        // 3.5. Validar y obtener carrera si se proporciona
        Carrera carrera = null;
        if (createDto.getCarreraId() != null) {
            carrera = carreraRepository.findById(createDto.getCarreraId())
                    .orElseThrow(() -> new RuntimeException("Carrera no encontrada con ID: " + createDto.getCarreraId()));
            // Verificar que la carrera no esté eliminada
            if (carrera.getDeletedAt() != null) {
                throw new RuntimeException("La carrera especificada ha sido eliminada");
            }
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
        
        // 7. Determinar el estado inicial según el rol
        Reserva.EstadoReserva estadoInicial;
        boolean esDocente = ROLE_DOCENTE.equals(userRole);
        
        if (esDocente) {
            estadoInicial = Reserva.EstadoReserva.PENDIENTE;
            log.info("Docente creando solicitud pendiente");
        } else {
            estadoInicial = Reserva.EstadoReserva.APROBADO;
            log.info("Admin/Analista creando reserva auto-aprobada");
            
            // 7.1 VALIDACIÓN CRÍTICA: Verificar conflictos solo para reservas APROBADO
            // Las solicitudes PENDIENTE no bloquean el espacio
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
        }
        
        // 8. Crear la reserva con el estado apropiado
        Reserva reserva = new Reserva();
        reserva.setEspacio(espacio);
        reserva.setUsuario(usuario);
        reserva.setCarrera(carrera);
        reserva.setInicio(createDto.getInicio());
        reserva.setFin(createDto.getFin());
        reserva.setEstado(estadoInicial);
        
        Reserva savedReserva = reservaRepository.save(reserva);
        log.info("Reserva creada exitosamente. ID: {}, Espacio: {}, Usuario: {}, Estado: {}", 
                savedReserva.getId(), espacio.getNombre(), usuario.getNombre(), estadoInicial);
        
        // 9. Crear items solicitados si se proporcionaron
        if (createDto.getItemsSolicitados() != null && !createDto.getItemsSolicitados().isEmpty()) {
            reservaItemSolicitadoService.crearSolicitudes(savedReserva.getId(), createDto.getItemsSolicitados());
            log.info("Se crearon {} items solicitados para la reserva {}", 
                    createDto.getItemsSolicitados().size(), savedReserva.getId());
        }
        
        // 10. Retornar DTO con datos completos (incluyendo items solicitados)
        return mapToResponseDto(savedReserva);
    }
    
    /**
     * Sobrecarga del método createReserva para mantener compatibilidad
     * Si no se proporciona el rol, asume ADMIN/ANALISTA (comportamiento anterior)
     */
    @Transactional(isolation = Isolation.SERIALIZABLE, rollbackFor = Exception.class)
    public ReservaResponseDto createReserva(ReservaCreateDto createDto, String userEmail) {
        return createReserva(createDto, userEmail, ROLE_ADMIN); // Por defecto ADMIN para mantener compatibilidad
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
     * Obtener reservas del usuario autenticado con paginación y filtros
     */
    @Transactional(readOnly = true)
    public Page<ReservaResponseDto> getReservasByUsuarioPaged(
            String userEmail,
            Pageable pageable,
            String estado,
            Long espacioId,
            Long carreraId,
            Long tipoEspacioId,
            LocalDateTime fechaInicio,
            LocalDateTime fechaFin,
            String tiempo) {
        Usuario usuario = usuarioRepository.findByEmail(userEmail)
                .orElseThrow(() -> new UsuarioNotFoundException("Usuario no encontrado: " + userEmail));
        
        Specification<Reserva> spec = buildSpecification(usuario.getId(), estado, espacioId, carreraId, tipoEspacioId, fechaInicio, fechaFin, tiempo);
        
        Page<Reserva> reservasPage = reservaRepository.findAll(spec, pageable);
        return reservasPage.map(this::mapToResponseDto);
    }
    
    /**
     * Construir Specification para filtrar reservas
     */
    private Specification<Reserva> buildSpecification(
            Long usuarioId,
            String estado,
            Long espacioId,
            Long carreraId,
            Long tipoEspacioId,
            LocalDateTime fechaInicio,
            LocalDateTime fechaFin,
            String tiempo) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            
            // Siempre filtrar por usuario
            predicates.add(cb.equal(root.get("usuario").get("id"), usuarioId));
            
            // Filtro por estado
            if (estado != null && !estado.isEmpty() && !estado.equals("todas")) {
                try {
                    Reserva.EstadoReserva estadoEnum = Reserva.EstadoReserva.valueOf(estado.toUpperCase());
                    predicates.add(cb.equal(root.get("estado"), estadoEnum));
                } catch (IllegalArgumentException e) {
                    // Ignorar si el estado no es válido
                }
            }
            
            // Filtro por espacio
            if (espacioId != null) {
                predicates.add(cb.equal(root.get("espacio").get("id"), espacioId));
            }
            
            // Filtro por tipo de espacio
            if (tipoEspacioId != null) {
                predicates.add(cb.equal(root.get("espacio").get("tipoEspacioId"), tipoEspacioId));
            }
            
            // Filtro por carrera
            if (carreraId != null) {
                predicates.add(cb.equal(root.get("carrera").get("id"), carreraId));
            }
            
            // Filtro por fecha inicio
            if (fechaInicio != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("inicio"), fechaInicio));
            }
            
            // Filtro por fecha fin
            if (fechaFin != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("inicio"), fechaFin));
            }
            
            // Filtro por tiempo (pasadas/futuras)
            LocalDateTime ahora = LocalDateTime.now();
            if ("futuras".equals(tiempo)) {
                predicates.add(cb.greaterThan(root.get("inicio"), ahora));
            } else if ("pasadas".equals(tiempo)) {
                predicates.add(cb.lessThanOrEqualTo(root.get("inicio"), ahora));
            }
            
            // Ordenar por fecha descendente
            query.orderBy(cb.desc(root.get("inicio")));
            
            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
    
    /**
     * Obtener todas las reservas del sistema (sin filtrar por usuario)
     * Para ANALISTA/ADMIN con paginación y filtros
     */
    @Transactional(readOnly = true)
    public Page<ReservaResponseDto> getAllReservasPaged(
            Pageable pageable,
            String estado,
            Long espacioId,
            Long carreraId,
            Long tipoEspacioId,
            Long usuarioId,
            LocalDateTime fechaInicio,
            LocalDateTime fechaFin,
            String tiempo) {
        Specification<Reserva> spec = buildSpecificationAll(
                estado, espacioId, carreraId, tipoEspacioId, usuarioId, fechaInicio, fechaFin, tiempo);
        
        Page<Reserva> reservasPage = reservaRepository.findAll(spec, pageable);
        return reservasPage.map(this::mapToResponseDto);
    }
    
    /**
     * Construir Specification para filtrar todas las reservas (sin filtrar por usuario por defecto)
     */
    private Specification<Reserva> buildSpecificationAll(
            String estado,
            Long espacioId,
            Long carreraId,
            Long tipoEspacioId,
            Long usuarioId,
            LocalDateTime fechaInicio,
            LocalDateTime fechaFin,
            String tiempo) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            
            // Filtro opcional por usuario (para ANALISTA filtrar por solicitante)
            if (usuarioId != null) {
                predicates.add(cb.equal(root.get("usuario").get("id"), usuarioId));
            }
            
            // Filtro por estado
            if (estado != null && !estado.isEmpty() && !estado.equals("todas")) {
                try {
                    Reserva.EstadoReserva estadoEnum = Reserva.EstadoReserva.valueOf(estado.toUpperCase());
                    predicates.add(cb.equal(root.get("estado"), estadoEnum));
                } catch (IllegalArgumentException e) {
                    // Ignorar si el estado no es válido
                }
            }
            
            // Filtro por espacio
            if (espacioId != null) {
                predicates.add(cb.equal(root.get("espacio").get("id"), espacioId));
            }
            
            // Filtro por tipo de espacio
            if (tipoEspacioId != null) {
                predicates.add(cb.equal(root.get("espacio").get("tipoEspacioId"), tipoEspacioId));
            }
            
            // Filtro por carrera
            if (carreraId != null) {
                predicates.add(cb.equal(root.get("carrera").get("id"), carreraId));
            }
            
            // Filtro por fecha inicio
            if (fechaInicio != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("inicio"), fechaInicio));
            }
            
            // Filtro por fecha fin
            if (fechaFin != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("inicio"), fechaFin));
            }
            
            // Filtro por tiempo (pasadas/futuras)
            LocalDateTime ahora = LocalDateTime.now();
            if ("futuras".equals(tiempo)) {
                predicates.add(cb.greaterThan(root.get("inicio"), ahora));
            } else if ("pasadas".equals(tiempo)) {
                predicates.add(cb.lessThanOrEqualTo(root.get("inicio"), ahora));
            }
            
            // Ordenar por fecha descendente
            query.orderBy(cb.desc(root.get("inicio")));
            
            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
    
    /**
     * Cambiar el estado de una reserva (aprobar/rechazar)
     * Solo permite cambiar de PENDIENTE a APROBADO o CANCELADO
     */
    @Transactional(isolation = Isolation.SERIALIZABLE, rollbackFor = Exception.class)
    public ReservaResponseDto cambiarEstadoReserva(Long id, String nuevoEstadoStr) {
        log.info("Cambiando estado de reserva ID: {} a {}", id, nuevoEstadoStr);
        
        // Validar que el nuevo estado es válido
        Reserva.EstadoReserva nuevoEstado;
        try {
            nuevoEstado = Reserva.EstadoReserva.valueOf(nuevoEstadoStr.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new RuntimeException("Estado inválido: " + nuevoEstadoStr + ". Estados válidos: PENDIENTE, APROBADO, CANCELADO");
        }
        
        // Solo permitir APROBADO o CANCELADO
        if (nuevoEstado != Reserva.EstadoReserva.APROBADO && nuevoEstado != Reserva.EstadoReserva.CANCELADO) {
            throw new RuntimeException("Solo se puede cambiar el estado a APROBADO o CANCELADO");
        }
        
        // Obtener la reserva
        Reserva reserva = reservaRepository.findByIdWithRelations(id);
        if (reserva == null) {
            throw new RuntimeException("Reserva no encontrada con ID: " + id);
        }
        
        // Validar que la reserva está en estado PENDIENTE
        if (reserva.getEstado() != Reserva.EstadoReserva.PENDIENTE) {
            throw new RuntimeException("Solo se pueden aprobar/rechazar reservas en estado PENDIENTE. Estado actual: " + reserva.getEstado());
        }
        
        // Si se aprueba, validar conflictos con otras reservas APROBADO
        if (nuevoEstado == Reserva.EstadoReserva.APROBADO) {
            List<Reserva> conflictos = reservaRepository.findConflictingReservas(
                    reserva.getEspacio().getId(),
                    reserva.getInicio(),
                    reserva.getFin(),
                    Reserva.EstadoReserva.APROBADO
            );
            
            // Excluir la reserva actual de los conflictos
            conflictos = conflictos.stream()
                    .filter(c -> !c.getId().equals(reserva.getId()))
                    .collect(Collectors.toList());
            
            if (!conflictos.isEmpty()) {
                log.warn("Conflicto de horario detectado al aprobar reserva. Espacio ocupado en ese rango de tiempo");
                throw new RuntimeException("No se puede aprobar la reserva: el espacio ya está reservado en ese horario por otra reserva aprobada.");
            }
        }
        
        // Cambiar el estado
        reserva.setEstado(nuevoEstado);
        Reserva savedReserva = reservaRepository.save(reserva);
        
        log.info("Estado de reserva ID: {} cambiado exitosamente a {}", id, nuevoEstado);
        return mapToResponseDto(savedReserva);
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
     * Obtener todas las reservas del sistema (público, para visualización)
     * Permite filtros opcionales para visualización
     */
    @Transactional(readOnly = true)
    public List<ReservaResponseDto> getTodasLasReservas(
            String estado,
            Long espacioId,
            Long carreraId,
            Long tipoEspacioId,
            LocalDateTime fechaInicio,
            LocalDateTime fechaFin) {
        Specification<Reserva> spec = buildSpecificationPublico(estado, espacioId, carreraId, tipoEspacioId, fechaInicio, fechaFin);
        
        List<Reserva> reservas = reservaRepository.findAll(spec);
        return reservas.stream()
                .map(this::mapToResponseDto)
                .sorted((a, b) -> b.getInicio().compareTo(a.getInicio())) // Ordenar por fecha descendente
                .collect(Collectors.toList());
    }
    
    /**
     * Construir Specification para filtrar reservas públicas (sin filtrar por usuario)
     */
    private Specification<Reserva> buildSpecificationPublico(
            String estado,
            Long espacioId,
            Long carreraId,
            Long tipoEspacioId,
            LocalDateTime fechaInicio,
            LocalDateTime fechaFin) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            
            // NO filtrar por usuario - mostrar todas las reservas
            
            // Filtro por estado
            if (estado != null && !estado.isEmpty() && !estado.equals("todas")) {
                try {
                    Reserva.EstadoReserva estadoEnum = Reserva.EstadoReserva.valueOf(estado.toUpperCase());
                    predicates.add(cb.equal(root.get("estado"), estadoEnum));
                } catch (IllegalArgumentException e) {
                    // Ignorar si el estado no es válido
                }
            }
            
            // Filtro por espacio
            if (espacioId != null) {
                predicates.add(cb.equal(root.get("espacio").get("id"), espacioId));
            }
            
            // Filtro por tipo de espacio (tipoEspacioId es un campo directo en Espacio, no una relación)
            if (tipoEspacioId != null) {
                // Acceder al campo tipoEspacioId directamente del espacio
                predicates.add(cb.equal(
                    root.get("espacio").get("tipoEspacioId"), 
                    tipoEspacioId
                ));
            }
            
            // Filtro por carrera
            if (carreraId != null) {
                predicates.add(cb.equal(root.get("carrera").get("id"), carreraId));
            }
            
            // Filtro por fecha inicio
            if (fechaInicio != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("inicio"), fechaInicio));
            }
            
            // Filtro por fecha fin
            if (fechaFin != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("inicio"), fechaFin));
            }
            
            // Ordenar por fecha descendente
            query.orderBy(cb.desc(root.get("inicio")));
            
            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
    
    /**
     * Obtener estadísticas personales de reservas del usuario
     */
    @Transactional(readOnly = true)
    public ReservaStatsDto obtenerEstadisticasPersonales(String userEmail) {
        log.info("Generando estadísticas personales de reservas para usuario: {}", userEmail);
        
        // Obtener usuario
        Usuario usuario = usuarioRepository.findByEmail(userEmail)
                .orElseThrow(() -> new UsuarioNotFoundException("Usuario no encontrado: " + userEmail));
        
        // Obtener todas las reservas del usuario
        List<Reserva> reservas = reservaRepository.findByUsuarioId(usuario.getId());
        
        // Si no hay reservas, retornar DTO con valores en 0 o null
        if (reservas.isEmpty()) {
            return crearDtoVacio();
        }
        
        // Reutilizar método auxiliar para calcular estadísticas
        return calcularEstadisticasLegacy(reservas);
    }
    
    /**
     * Método auxiliar para calcular estadísticas a partir de una lista de reservas
     */
    private ReservaStatsDto calcularEstadisticasLegacy(List<Reserva> reservas) {
        LocalDateTime now = LocalDateTime.now();
        YearMonth mesActual = YearMonth.now();
        YearMonth proximoMes = mesActual.plusMonths(1);
        YearMonth mesAnterior = mesActual.minusMonths(1);
        int anioActual = now.getYear();
        
        // ========== MÉTRICAS BÁSICAS ==========
        long totalReservas = reservas.size();
        
        long totalAprobadas = reservas.stream()
                .filter(r -> r.getEstado() == Reserva.EstadoReserva.APROBADO)
                .count();
        
        long totalPendientes = reservas.stream()
                .filter(r -> r.getEstado() == Reserva.EstadoReserva.PENDIENTE)
                .count();
        
        long totalCanceladas = reservas.stream()
                .filter(r -> r.getEstado() == Reserva.EstadoReserva.CANCELADO)
                .count();
        
        long totalFuturas = reservas.stream()
                .filter(r -> r.getInicio().isAfter(now))
                .count();
        
        long totalPasadas = reservas.stream()
                .filter(r -> r.getFin().isBefore(now))
                .count();
        
        long totalActivas = reservas.stream()
                .filter(r -> r.getEstado() == Reserva.EstadoReserva.APROBADO && r.getInicio().isAfter(now))
                .count();
        
        // Reservas por estado
        Map<String, Long> reservasPorEstado = new HashMap<>();
        for (Reserva.EstadoReserva estado : Reserva.EstadoReserva.values()) {
            long count = reservas.stream()
                    .filter(r -> r.getEstado() == estado)
                    .count();
            reservasPorEstado.put(estado.name(), count);
        }
        
        // ========== MÉTRICAS TEMPORALES ==========
        long reservasEsteMes = reservas.stream()
                .filter(r -> YearMonth.from(r.getInicio()).equals(mesActual))
                .count();
        
        long reservasProximoMes = reservas.stream()
                .filter(r -> YearMonth.from(r.getInicio()).equals(proximoMes))
                .count();
        
        long reservasEsteAnio = reservas.stream()
                .filter(r -> r.getInicio().getYear() == anioActual)
                .count();
        
        // Reservas por mes (últimos 12 meses)
        Map<String, Long> reservasPorMes = new HashMap<>();
        for (int i = 11; i >= 0; i--) {
            YearMonth mes = mesActual.minusMonths(i);
            long count = reservas.stream()
                    .filter(r -> YearMonth.from(r.getInicio()).equals(mes))
                    .count();
            reservasPorMes.put(mes.toString(), count);
        }
        
        // Reservas por día de semana
        Map<String, Long> reservasPorDiaSemana = new HashMap<>();
        for (DayOfWeek dia : DayOfWeek.values()) {
            long count = reservas.stream()
                    .filter(r -> r.getInicio().getDayOfWeek() == dia)
                    .count();
            reservasPorDiaSemana.put(dia.name(), count);
        }
        
        // Mes con más reservas
        String mesConMasReservas = reservasPorMes.entrySet().stream()
                .max(Map.Entry.comparingByValue())
                .map(Map.Entry::getKey)
                .orElse(null);
        
        // Promedio reservas por mes
        double promedioReservasPorMes = reservasPorMes.values().stream()
                .mapToLong(Long::longValue)
                .average()
                .orElse(0.0);
        
        // ========== MÉTRICAS DE ESPACIOS ==========
        Set<Long> espaciosDistintos = reservas.stream()
                .map(r -> r.getEspacio().getId())
                .collect(Collectors.toSet());
        long totalEspaciosUsados = espaciosDistintos.size();
        
        // Reservas por espacio
        Map<Long, Long> reservasPorEspacio = reservas.stream()
                .collect(Collectors.groupingBy(
                        r -> r.getEspacio().getId(),
                        Collectors.counting()
                ));
        
        // Espacio más usado
        Long espacioMasUsado = reservasPorEspacio.entrySet().stream()
                .max(Map.Entry.comparingByValue())
                .map(Map.Entry::getKey)
                .orElse(null);
        
        String nombreEspacioMasUsado = null;
        if (espacioMasUsado != null) {
            nombreEspacioMasUsado = reservas.stream()
                    .filter(r -> r.getEspacio().getId().equals(espacioMasUsado))
                    .findFirst()
                    .map(r -> r.getEspacio().getNombre())
                    .orElse(null);
        }
        
        // Distribución por espacio (porcentual)
        Map<String, Long> distribucionPorEspacio = new HashMap<>();
        for (Map.Entry<Long, Long> entry : reservasPorEspacio.entrySet()) {
            long porcentaje = Math.round((entry.getValue() * 100.0) / totalReservas);
            distribucionPorEspacio.put(entry.getKey().toString(), porcentaje);
        }
        
        // ========== MÉTRICAS DE USO Y DURACIÓN ==========
        double duracionTotalHoras = reservas.stream()
                .mapToDouble(r -> Duration.between(r.getInicio(), r.getFin()).toHours())
                .sum();
        
        double duracionPromedioHoras = totalReservas > 0 
                ? duracionTotalHoras / totalReservas 
                : 0.0;
        
        OptionalDouble reservaMasLargaOpt = reservas.stream()
                .mapToDouble(r -> Duration.between(r.getInicio(), r.getFin()).toHours())
                .max();
        double reservaMasLargaHoras = reservaMasLargaOpt.isPresent() ? reservaMasLargaOpt.getAsDouble() : 0.0;
        
        OptionalDouble reservaMasCortaOpt = reservas.stream()
                .mapToDouble(r -> Duration.between(r.getInicio(), r.getFin()).toHours())
                .min();
        double reservaMasCortaHoras = reservaMasCortaOpt.isPresent() ? reservaMasCortaOpt.getAsDouble() : 0.0;
        
        double horasReservadasEsteMes = reservas.stream()
                .filter(r -> YearMonth.from(r.getInicio()).equals(mesActual))
                .mapToDouble(r -> Duration.between(r.getInicio(), r.getFin()).toHours())
                .sum();
        
        // ========== MÉTRICAS DE FRECUENCIA ==========
        // Promedio reservas por semana (calcular semanas totales)
        Optional<Reserva> primeraReservaOpt = reservas.stream()
                .min(Comparator.comparing(Reserva::getInicio));
        
        long semanasTotales = 1;
        if (primeraReservaOpt.isPresent()) {
            LocalDateTime primeraReserva = primeraReservaOpt.get().getInicio();
            long dias = Duration.between(primeraReserva, now).toDays();
            semanasTotales = Math.max(1, dias / 7);
        }
        
        double promedioReservasPorSemana = semanasTotales > 0 
                ? totalReservas / (double) semanasTotales 
                : 0.0;
        
        // Días desde última reserva
        Optional<Reserva> ultimaReservaOpt = reservas.stream()
                .filter(r -> r.getFin().isBefore(now))
                .max(Comparator.comparing(Reserva::getFin));
        
        Long diasDesdeUltimaReserva = null;
        LocalDateTime fechaUltimaReserva = null;
        if (ultimaReservaOpt.isPresent()) {
            fechaUltimaReserva = ultimaReservaOpt.get().getFin();
            diasDesdeUltimaReserva = Duration.between(fechaUltimaReserva, now).toDays();
        }
        
        // Días hasta próxima reserva
        Optional<Reserva> proximaReservaOpt = reservas.stream()
                .filter(r -> r.getInicio().isAfter(now))
                .min(Comparator.comparing(Reserva::getInicio));
        
        Long diasHastaProximaReserva = null;
        LocalDateTime fechaProximaReserva = null;
        if (proximaReservaOpt.isPresent()) {
            fechaProximaReserva = proximaReservaOpt.get().getInicio();
            diasHastaProximaReserva = Duration.between(now, fechaProximaReserva).toDays();
        }
        
        // ========== MÉTRICAS COMPARATIVAS ==========
        long reservasMesActual = reservasEsteMes;
        
        long reservasMesAnterior = reservas.stream()
                .filter(r -> YearMonth.from(r.getInicio()).equals(mesAnterior))
                .count();
        
        long diferenciaMesAnterior = reservasMesActual - reservasMesAnterior;
        
        double porcentajeCambioMesAnterior = 0.0;
        if (reservasMesAnterior > 0) {
            porcentajeCambioMesAnterior = ((diferenciaMesAnterior * 100.0) / reservasMesAnterior);
        } else if (reservasMesActual > 0) {
            porcentajeCambioMesAnterior = 100.0; // Nuevas reservas cuando no había ninguna antes
        }
        
        // Crear y retornar DTO
        return new ReservaStatsDto(
                totalReservas,
                totalAprobadas,
                totalPendientes,
                totalCanceladas,
                totalFuturas,
                totalPasadas,
                totalActivas,
                reservasPorEstado,
                reservasEsteMes,
                reservasProximoMes,
                reservasEsteAnio,
                reservasPorMes,
                reservasPorDiaSemana,
                mesConMasReservas,
                promedioReservasPorMes,
                totalEspaciosUsados,
                espacioMasUsado,
                nombreEspacioMasUsado,
                reservasPorEspacio,
                distribucionPorEspacio,
                duracionTotalHoras,
                duracionPromedioHoras,
                reservaMasLargaHoras,
                reservaMasCortaHoras,
                horasReservadasEsteMes,
                promedioReservasPorSemana,
                diasDesdeUltimaReserva,
                diasHastaProximaReserva,
                fechaUltimaReserva,
                fechaProximaReserva,
                reservasMesActual,
                reservasMesAnterior,
                diferenciaMesAnterior,
                porcentajeCambioMesAnterior
        );
    }
    
    /**
     * Obtener estadísticas globales de todas las reservas (para ANALISTA/ADMIN)
     */
    @Transactional(readOnly = true)
    public ReservaStatsDto obtenerEstadisticasGlobales() {
        log.info("Generando estadísticas globales de reservas");
        
        // Obtener todas las reservas
        List<Reserva> reservas = reservaRepository.findAll();
        
        // Si no hay reservas, retornar DTO con valores en 0 o null
        if (reservas.isEmpty()) {
            return crearDtoVacio();
        }
        
        // Reutilizar la misma lógica que obtenerEstadisticasPersonales pero con todas las reservas
        return calcularEstadisticasLegacy(reservas);
    }
    
    /**
     * Crear DTO vacío cuando no hay reservas
     */
    private ReservaStatsDto crearDtoVacio() {
        return new ReservaStatsDto(
                0L, 0L, 0L, 0L, 0L, 0L, 0L, // básicas
                new HashMap<>(), // reservasPorEstado
                0L, 0L, 0L, // temporales básicas
                new HashMap<>(), new HashMap<>(), // por mes y día
                null, 0.0, // mes más usado y promedio
                0L, null, null, // espacios básicos
                new HashMap<>(), new HashMap<>(), // distribuciones
                0.0, 0.0, 0.0, 0.0, 0.0, // duración
                0.0, // promedio por semana
                null, null, null, null, // frecuencia
                0L, 0L, 0L, 0.0 // comparativas
        );
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
        // Información del tipo de espacio
        if (reserva.getEspacio().getTipoEspacio() != null) {
            dto.setTipoEspacioId(reserva.getEspacio().getTipoEspacio().getId());
            dto.setTipoEspacioNombre(reserva.getEspacio().getTipoEspacio().getNombre());
            dto.setTipoEspacioColor(reserva.getEspacio().getTipoEspacio().getColor());
        }
        dto.setUsuarioId(reserva.getUsuario().getId());
        dto.setUsuarioNombre(reserva.getUsuario().getNombre());
        dto.setUsuarioEmail(reserva.getUsuario().getEmail());
        // Información de carrera
        if (reserva.getCarrera() != null) {
            dto.setCarreraId(reserva.getCarrera().getId());
            dto.setCarreraNombre(reserva.getCarrera().getNombre());
            dto.setCarreraCodigo(reserva.getCarrera().getCodigo());
        }
        dto.setInicio(reserva.getInicio());
        dto.setFin(reserva.getFin());
        dto.setEstado(reserva.getEstado());
        // Mapear items solicitados
        if (reserva.getItemsSolicitados() != null && !reserva.getItemsSolicitados().isEmpty()) {
            dto.setItemsSolicitados(reservaItemSolicitadoService.obtenerPorReserva(reserva.getId()));
        }
        dto.setCreatedAt(reserva.getCreatedAt());
        dto.setUpdatedAt(reserva.getUpdatedAt());
        return dto;
    }
}

