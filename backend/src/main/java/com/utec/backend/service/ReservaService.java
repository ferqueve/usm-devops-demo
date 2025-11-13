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
        reserva.setCarrera(carrera);
        reserva.setInicio(createDto.getInicio());
        reserva.setFin(createDto.getFin());
        reserva.setEstado(Reserva.EstadoReserva.APROBADO); // Auto-aprobada
        
        Reserva savedReserva = reservaRepository.save(reserva);
        log.info("Reserva creada exitosamente. ID: {}, Espacio: {}, Usuario: {}", 
                savedReserva.getId(), espacio.getNombre(), usuario.getNombre());
        
        // 8. Crear items solicitados si se proporcionaron
        if (createDto.getItemsSolicitados() != null && !createDto.getItemsSolicitados().isEmpty()) {
            reservaItemSolicitadoService.crearSolicitudes(savedReserva.getId(), createDto.getItemsSolicitados());
            log.info("Se crearon {} items solicitados para la reserva {}", 
                    createDto.getItemsSolicitados().size(), savedReserva.getId());
        }
        
        // 9. Retornar DTO con datos completos (incluyendo items solicitados)
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
     * Obtener reservas del usuario autenticado con paginación y filtros
     */
    @Transactional(readOnly = true)
    public Page<ReservaResponseDto> getReservasByUsuarioPaged(
            String userEmail,
            Pageable pageable,
            String estado,
            Long espacioId,
            LocalDateTime fechaInicio,
            LocalDateTime fechaFin,
            String tiempo) {
        Usuario usuario = usuarioRepository.findByEmail(userEmail)
                .orElseThrow(() -> new UsuarioNotFoundException("Usuario no encontrado: " + userEmail));
        
        Specification<Reserva> spec = buildSpecification(usuario.getId(), estado, espacioId, fechaInicio, fechaFin, tiempo);
        
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

