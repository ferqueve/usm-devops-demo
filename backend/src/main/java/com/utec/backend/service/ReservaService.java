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
import org.springframework.cache.annotation.Cacheable;
import org.springframework.beans.factory.annotation.Value;

import java.time.DayOfWeek;
import java.time.Duration;
import java.time.Instant;
import java.time.YearMonth;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
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
    private final EmailService emailService;
    private final RecomendacionService recomendacionService;
    private final FileStorageService fileStorageService;

    @Value("${app.timezone:America/Montevideo}")
    private String appTimezone;

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
                    .orElseThrow(
                            () -> new RuntimeException("Carrera no encontrada con ID: " + createDto.getCarreraId()));
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
        if (createDto.getInicio().isBefore(Instant.now())) {
            throw new RuntimeException("No se puede reservar en el pasado");
        }

        // 6. Validar duración mínima (30 minutos)
        long durationMinutes = java.time.Duration.between(createDto.getInicio(), createDto.getFin()).toMinutes();
        if (durationMinutes < 30) {
            throw new RuntimeException("La reserva debe tener una duración mínima de 30 minutos");
        }

        // 6.5. Validar recurrencia si se proporciona
        if (createDto.getTipoRecurrencia() != null) {
            if (createDto.getFechaFinRecurrencia() == null) {
                throw new RuntimeException(
                        "La fecha de fin de recurrencia es requerida cuando se especifica un tipo de recurrencia");
            }
            if (!createDto.getFechaFinRecurrencia().isAfter(createDto.getInicio())) {
                throw new RuntimeException("La fecha de fin de recurrencia debe ser posterior a la fecha de inicio");
            }
            // Validar que no se generen demasiadas reservas (límite de seguridad: 1000
            // reservas)
            long maxReservas = calcularMaxReservas(createDto);
            if (maxReservas > 1000) {
                throw new RuntimeException(
                        "La recurrencia generaría más de 1000 reservas. Por favor, reduzca el rango de fechas.");
            }
        }

        // 7. Validar y obtener analista asignado
        Usuario analistaAsignado = null;
        boolean esDocente = ROLE_DOCENTE.equals(userRole);
        boolean esExterno = ROLE_EXTERNO.equals(userRole);
        boolean esAnalista = ROLE_ANALISTA.equals(userRole);

        if (esDocente) {
            if (createDto.getAnalistaId() == null) {
                throw new RuntimeException("El docente debe seleccionar un analista para gestionar la solicitud");
            }

            analistaAsignado = usuarioRepository.findById(createDto.getAnalistaId())
                    .orElseThrow(
                            () -> new RuntimeException("Analista no encontrado con ID: " + createDto.getAnalistaId()));

            // Validar que el usuario seleccionado es realmente un analista
            if (analistaAsignado.getRolApp() != Usuario.RolApp.ANALISTA) {
                throw new RuntimeException("El usuario seleccionado no es un analista");
            }

            // Validar que el analista no esté eliminado
            if (analistaAsignado.getDeletedAt() != null) {
                throw new RuntimeException("El analista seleccionado ha sido eliminado");
            }

            log.info("Analista {} asignado a solicitud de docente {}", analistaAsignado.getEmail(), userEmail);
        } else if (esAnalista) {
            // Si el usuario es ANALISTA, asignarse a sí mismo
            analistaAsignado = usuario;
            log.info("Analista {} se auto-asignó a la reserva que está creando", userEmail);
        }
        // Para externos, no se requiere analista asignado inicialmente

        // 7.5. Determinar si la reserva es pública
        Boolean esPublica;
        if (esExterno) {
            // Los externos siempre crean reservas públicas
            esPublica = true;
            log.info("Usuario externo creando reserva pública");
        } else {
            // Para usuarios internos, usar el valor del DTO o false por defecto
            esPublica = createDto.getEsPublica() != null ? createDto.getEsPublica() : false;
        }

        // 8. Determinar el estado inicial según el rol
        Reserva.EstadoReserva estadoInicial;

        if (esDocente || esExterno) {
            estadoInicial = Reserva.EstadoReserva.PENDIENTE;
            log.info("{} creando solicitud pendiente", esDocente ? "Docente" : "Usuario externo");
        } else {
            estadoInicial = Reserva.EstadoReserva.APROBADO;
            log.info("Admin/Analista creando reserva auto-aprobada");

            // 7.1 VALIDACIÓN CRÍTICA: Verificar conflictos solo para reservas APROBADO
            // Las solicitudes PENDIENTE no bloquean el espacio
            List<Reserva> conflictos = reservaRepository.findConflictingReservas(
                    createDto.getEspacioId(),
                    createDto.getInicio(),
                    createDto.getFin(),
                    Reserva.EstadoReserva.APROBADO);

            if (!conflictos.isEmpty()) {
                log.warn("Conflicto de horario detectado. Espacio ocupado en ese rango de tiempo");
                throw new RuntimeException(
                        "El espacio ya está reservado en ese horario. Por favor, seleccione otro horario.");
            }
        }

        // 9. Crear reserva(s) - simple o recurrente
        if (createDto.getTipoRecurrencia() != null) {
            // Crear múltiples reservas recurrentes
            return crearReservasRecurrentes(createDto, usuario, espacio, carrera, analistaAsignado, estadoInicial,
                    esDocente, esPublica);
        } else {
            // Crear una sola reserva (comportamiento original)
            return crearReservaSimple(createDto, usuario, espacio, carrera, analistaAsignado, estadoInicial, esPublica);
        }
    }

    /**
     * Crear una reserva simple (no recurrente)
     */
    private ReservaResponseDto crearReservaSimple(
            ReservaCreateDto createDto,
            Usuario usuario,
            Espacio espacio,
            Carrera carrera,
            Usuario analistaAsignado,
            Reserva.EstadoReserva estadoInicial,
            Boolean esPublica) {

        Reserva reserva = new Reserva();
        reserva.setEspacio(espacio);
        reserva.setUsuario(usuario);
        reserva.setCarrera(carrera);
        reserva.setAnalistaAsignado(analistaAsignado);
        reserva.setInicio(createDto.getInicio());
        reserva.setFin(createDto.getFin());
        reserva.setEstado(estadoInicial);
        reserva.setEsPublica(esPublica);
        reserva.setTitulo(createDto.getTitulo());
        reserva.setMotivoSolicitud(createDto.getMotivoSolicitud());

        Reserva savedReserva = reservaRepository.save(reserva);
        log.info("Reserva creada exitosamente. ID: {}, Espacio: {}, Usuario: {}, Estado: {}",
                savedReserva.getId(), espacio.getNombre(), usuario.getNombre(), estadoInicial);

        // Crear items solicitados si se proporcionaron
        if (createDto.getItemsSolicitados() != null && !createDto.getItemsSolicitados().isEmpty()) {
            reservaItemSolicitadoService.crearSolicitudes(savedReserva.getId(), createDto.getItemsSolicitados());
            log.info("Se crearon {} items solicitados para la reserva {}",
                    createDto.getItemsSolicitados().size(), savedReserva.getId());
        }

        ReservaResponseDto reservaDto = mapToResponseDto(savedReserva);

        // Invalidar caché de recomendaciones para el usuario
        try {
            recomendacionService.invalidarCacheRecomendaciones(usuario.getId());
        } catch (Exception e) {
            log.warn("Error invalidando caché de recomendaciones: {}", e.getMessage());
        }

        // Enviar notificación al analista si es una solicitud pendiente
        if (estadoInicial == Reserva.EstadoReserva.PENDIENTE && analistaAsignado != null) {
            try {
                boolean emailEnviado = emailService.enviarEmailNotificacionNuevaSolicitud(
                        analistaAsignado.getEmail(), reservaDto);
                if (emailEnviado) {
                    log.info("Email de notificación de nueva solicitud enviado al analista: {}",
                            analistaAsignado.getEmail());
                } else {
                    log.warn("No se pudo enviar email de notificación al analista: {}",
                            analistaAsignado.getEmail());
                }
            } catch (Exception e) {
                log.error("Error al enviar email de notificación al analista: {}", e.getMessage());
                // No lanzar excepción para no interrumpir el flujo de creación de reserva
            }
        }

        return reservaDto;
    }

    /**
     * Crear múltiples reservas recurrentes
     */
    private ReservaResponseDto crearReservasRecurrentes(
            ReservaCreateDto createDto,
            Usuario usuario,
            Espacio espacio,
            Carrera carrera,
            Usuario analistaAsignado,
            Reserva.EstadoReserva estadoInicial,
            boolean esDocente,
            Boolean esPublica) {

        List<Instant> fechasInicio = generarFechasRecurrentes(createDto);
        log.info("Generando {} reservas recurrentes de tipo {}", fechasInicio.size(), createDto.getTipoRecurrencia());

        long duracionMinutos = Duration.between(createDto.getInicio(), createDto.getFin()).toMinutes();
        List<Reserva> reservasCreadas = new ArrayList<>();
        List<Reserva> reservasConError = new ArrayList<>();

        for (Instant fechaInicio : fechasInicio) {
            Instant fechaFin = fechaInicio.plusSeconds(duracionMinutos * 60);

            // Validar que no sea en el pasado
            if (fechaInicio.isBefore(Instant.now())) {
                continue; // Saltar fechas pasadas
            }

            // Si es docente, no validar conflictos (será PENDIENTE)
            // Si es admin/analista, validar conflictos antes de crear
            if (!esDocente) {
                List<Reserva> conflictos = reservaRepository.findConflictingReservas(
                        espacio.getId(),
                        fechaInicio,
                        fechaFin,
                        Reserva.EstadoReserva.APROBADO);

                if (!conflictos.isEmpty()) {
                    log.warn("Conflicto detectado para fecha recurrente: {}. Se omite esta reserva.", fechaInicio);
                    reservasConError.add(null); // Marcador de error
                    continue;
                }
            }

            // Crear la reserva
            Reserva reserva = new Reserva();
            reserva.setEspacio(espacio);
            reserva.setUsuario(usuario);
            reserva.setCarrera(carrera);
            reserva.setAnalistaAsignado(analistaAsignado);
            reserva.setInicio(fechaInicio);
            reserva.setFin(fechaFin);
            reserva.setEstado(estadoInicial);
            reserva.setEsPublica(esPublica);
            reserva.setTitulo(createDto.getTitulo());
            reserva.setMotivoSolicitud(createDto.getMotivoSolicitud());

            Reserva savedReserva = reservaRepository.save(reserva);
            reservasCreadas.add(savedReserva);

            // Crear items solicitados para cada reserva
            if (createDto.getItemsSolicitados() != null && !createDto.getItemsSolicitados().isEmpty()) {
                reservaItemSolicitadoService.crearSolicitudes(savedReserva.getId(), createDto.getItemsSolicitados());
            }
        }

        log.info(
                "Se crearon {} reservas recurrentes exitosamente. {} reservas omitidas por conflictos o fechas pasadas.",
                reservasCreadas.size(), fechasInicio.size() - reservasCreadas.size());

        if (reservasCreadas.isEmpty()) {
            throw new RuntimeException(
                    "No se pudo crear ninguna reserva recurrente. Todas las fechas tienen conflictos o están en el pasado.");
        }

        // Retornar la primera reserva creada como respuesta principal
        ReservaResponseDto primeraReservaDto = mapToResponseDto(reservasCreadas.get(0));

        // Enviar notificación al analista si es una solicitud pendiente (solo para la
        // primera)
        if (estadoInicial == Reserva.EstadoReserva.PENDIENTE && analistaAsignado != null) {
            try {
                boolean emailEnviado = emailService.enviarEmailNotificacionNuevaSolicitud(
                        analistaAsignado.getEmail(), primeraReservaDto);
                if (emailEnviado) {
                    log.info("Email de notificación de nueva solicitud recurrente enviado al analista: {}",
                            analistaAsignado.getEmail());
                } else {
                    log.warn("No se pudo enviar email de notificación al analista: {}",
                            analistaAsignado.getEmail());
                }
            } catch (Exception e) {
                log.error("Error al enviar email de notificación al analista: {}", e.getMessage());
                // No lanzar excepción para no interrumpir el flujo de creación de reserva
            }
        }

        return primeraReservaDto;
    }

    /**
     * Generar lista de fechas de inicio para reservas recurrentes
     */
    private List<Instant> generarFechasRecurrentes(ReservaCreateDto createDto) {
        List<Instant> fechas = new ArrayList<>();
        ZonedDateTime fechaActual = createDto.getInicio().atZone(ZoneOffset.UTC);
        ZonedDateTime fechaFin = createDto.getFechaFinRecurrencia().atZone(ZoneOffset.UTC);

        // Ajustar fechaFin para incluir el día completo si es necesario
        ZonedDateTime fechaFinAjustada = fechaFin.plusDays(1).withHour(0).withMinute(0).minusMinutes(1);

        while (!fechaActual.isAfter(fechaFinAjustada)) {
            fechas.add(fechaActual.toInstant());

            switch (createDto.getTipoRecurrencia()) {
                case DIARIA:
                    fechaActual = fechaActual.plusDays(1);
                    break;
                case SEMANAL:
                    fechaActual = fechaActual.plusWeeks(1);
                    break;
                case MENSUAL:
                    fechaActual = fechaActual.plusMonths(1);
                    break;
            }
        }

        return fechas;
    }

    /**
     * Calcular el número máximo de reservas que se generarían
     */
    private long calcularMaxReservas(ReservaCreateDto createDto) {
        Instant fechaInicio = createDto.getInicio();
        Instant fechaFin = createDto.getFechaFinRecurrencia();

        switch (createDto.getTipoRecurrencia()) {
            case DIARIA:
                return Duration.between(fechaInicio, fechaFin).toDays() + 1;
            case SEMANAL:
                return Duration.between(fechaInicio, fechaFin).toDays() / 7 + 1;
            case MENSUAL:
                // Aproximación: meses entre fechas
                ZonedDateTime inicioZdt = fechaInicio.atZone(ZoneOffset.UTC);
                ZonedDateTime finZdt = fechaFin.atZone(ZoneOffset.UTC);
                long meses = (finZdt.getYear() - inicioZdt.getYear()) * 12
                        + (finZdt.getMonthValue() - inicioZdt.getMonthValue());
                return meses + 1;
            default:
                return 1;
        }
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
            Instant fechaInicio,
            Instant fechaFin,
            String tiempo) {
        Usuario usuario = usuarioRepository.findByEmail(userEmail)
                .orElseThrow(() -> new UsuarioNotFoundException("Usuario no encontrado: " + userEmail));

        Specification<Reserva> spec = buildSpecification(usuario.getId(), estado, espacioId, carreraId, tipoEspacioId,
                fechaInicio, fechaFin, tiempo);

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
            Instant fechaInicio,
            Instant fechaFin,
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
            Instant ahora = Instant.now();
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
     * Si el usuario es ANALISTA, solo muestra las reservas asignadas a él
     */
    @Transactional(readOnly = true)
    public Page<ReservaResponseDto> getAllReservasPaged(
            Pageable pageable,
            String estado,
            Long espacioId,
            Long carreraId,
            Long tipoEspacioId,
            Long usuarioId,
            Instant fechaInicio,
            Instant fechaFin,
            String tiempo,
            String userEmail,
            String userRole) {
        Specification<Reserva> spec = buildSpecificationAll(
                estado, espacioId, carreraId, tipoEspacioId, usuarioId, fechaInicio, fechaFin, tiempo, userEmail,
                userRole);

        Page<Reserva> reservasPage = reservaRepository.findAll(spec, pageable);
        return reservasPage.map(this::mapToResponseDto);
    }

    /**
     * Construir Specification para filtrar todas las reservas (sin filtrar por
     * usuario por defecto)
     * Si el usuario es ANALISTA, solo muestra las reservas asignadas a él
     */
    private Specification<Reserva> buildSpecificationAll(
            String estado,
            Long espacioId,
            Long carreraId,
            Long tipoEspacioId,
            Long usuarioId,
            Instant fechaInicio,
            Instant fechaFin,
            String tiempo,
            String userEmail,
            String userRole) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            // Si el usuario es ANALISTA, mostrar reservas asignadas a él O sin analista
            // asignado (incluye externos)
            if (ROLE_ANALISTA.equals(userRole) && userEmail != null) {
                Usuario analista = usuarioRepository.findByEmail(userEmail)
                        .orElse(null);
                if (analista != null) {
                    // Mostrar reservas asignadas a este analista O sin analista asignado (null)
                    Predicate asignadasAMi = cb.equal(root.get("analistaAsignado").get("id"), analista.getId());
                    Predicate sinAnalista = cb.isNull(root.get("analistaAsignado"));
                    predicates.add(cb.or(asignadasAMi, sinAnalista));
                    log.debug("Filtrando reservas para analista: {} (ID: {}) - incluyendo sin asignar", userEmail,
                            analista.getId());
                }
            }

            // Filtro opcional por usuario (para ADMIN filtrar por solicitante)
            if (usuarioId != null && !ROLE_ANALISTA.equals(userRole)) {
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
            Instant ahora = Instant.now();
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
     * Si el usuario es ANALISTA, solo puede aprobar/rechazar reservas asignadas a
     * él
     */
    @Transactional(isolation = Isolation.SERIALIZABLE, rollbackFor = Exception.class)
    public ReservaResponseDto cambiarEstadoReserva(Long id, String nuevoEstadoStr, String userEmail, String userRole,
            String mensajeAnalista) {
        log.info("Cambiando estado de reserva ID: {} a {} por usuario: {} (rol: {})", id, nuevoEstadoStr, userEmail,
                userRole);

        // Validar que el nuevo estado es válido
        Reserva.EstadoReserva nuevoEstado;
        try {
            nuevoEstado = Reserva.EstadoReserva.valueOf(nuevoEstadoStr.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new RuntimeException(
                    "Estado inválido: " + nuevoEstadoStr + ". Estados válidos: PENDIENTE, APROBADO, CANCELADO");
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
            throw new RuntimeException("Solo se pueden aprobar/rechazar reservas en estado PENDIENTE. Estado actual: "
                    + reserva.getEstado());
        }

        // Si el usuario es ANALISTA, validar permisos
        if (ROLE_ANALISTA.equals(userRole)) {
            Usuario analista = usuarioRepository.findByEmail(userEmail)
                    .orElseThrow(() -> new UsuarioNotFoundException("Usuario no encontrado: " + userEmail));

            // Si la reserva tiene analista asignado, solo ese analista puede gestionarla
            // Si no tiene analista asignado (reservas de externos), cualquier analista
            // puede gestionarla
            if (reserva.getAnalistaAsignado() != null) {
                if (!reserva.getAnalistaAsignado().getId().equals(analista.getId())) {
                    throw new RuntimeException(
                            "No tienes permisos para gestionar esta reserva. Solo puedes gestionar las reservas asignadas a ti.");
                }
                log.info("Analista {} aprobando/rechazando reserva asignada a él", userEmail);
            } else {
                // Reserva sin analista asignado (probablemente de externo), cualquier analista
                // puede gestionarla
                log.info("Analista {} aprobando/rechazando reserva sin analista asignado (posible reserva de externo)",
                        userEmail);
            }
        }

        // Si se aprueba, validar conflictos con otras reservas APROBADO
        if (nuevoEstado == Reserva.EstadoReserva.APROBADO) {
            List<Reserva> conflictos = reservaRepository.findConflictingReservas(
                    reserva.getEspacio().getId(),
                    reserva.getInicio(),
                    reserva.getFin(),
                    Reserva.EstadoReserva.APROBADO);

            // Excluir la reserva actual de los conflictos
            conflictos = conflictos.stream()
                    .filter(c -> !c.getId().equals(reserva.getId()))
                    .collect(Collectors.toList());

            if (!conflictos.isEmpty()) {
                log.warn("Conflicto de horario detectado al aprobar reserva. Espacio ocupado en ese rango de tiempo");
                throw new RuntimeException(
                        "No se puede aprobar la reserva: el espacio ya está reservado en ese horario por otra reserva aprobada.");
            }
        }

        // Cambiar el estado
        reserva.setEstado(nuevoEstado);
        // Guardar mensaje del analista si se proporciona (tanto para aprobar como
        // rechazar)
        if (mensajeAnalista != null && !mensajeAnalista.trim().isEmpty()) {
            reserva.setMensajeAnalista(mensajeAnalista.trim());
        } else {
            // Si no se proporciona mensaje, mantener el existente o dejarlo null
            // No se limpia automáticamente para permitir que el analista pueda actualizarlo
            // después
        }
        Reserva savedReserva = reservaRepository.save(reserva);

        log.info("Estado de reserva ID: {} cambiado exitosamente a {}", id, nuevoEstado);

        // Invalidar caché de recomendaciones para el usuario
        try {
            recomendacionService.invalidarCacheRecomendaciones(reserva.getUsuario().getId());
        } catch (Exception e) {
            log.warn("Error invalidando caché de recomendaciones: {}", e.getMessage());
        }

        ReservaResponseDto reservaDto = mapToResponseDto(savedReserva);

        // Enviar notificación al usuario sobre el cambio de estado
        try {
            if (nuevoEstado == Reserva.EstadoReserva.APROBADO) {
                boolean emailEnviado = emailService.enviarEmailNotificacionReservaAprobada(
                        reserva.getUsuario().getEmail(), reservaDto);
                if (emailEnviado) {
                    log.info("Email de notificación de reserva aprobada enviado al usuario: {}",
                            reserva.getUsuario().getEmail());
                } else {
                    log.warn("No se pudo enviar email de notificación al usuario: {}",
                            reserva.getUsuario().getEmail());
                }

                // Si la reserva tiene items solicitados, notificar a MANTENIMIENTO
                if (reservaDto.getItemsSolicitados() != null && !reservaDto.getItemsSolicitados().isEmpty()) {
                    try {
                        List<Usuario> personalMantenimiento = usuarioRepository
                                .findByRolAppAndDeletedAtIsNull(Usuario.RolApp.MANTENIMIENTO);
                        if (!personalMantenimiento.isEmpty()) {
                            int cantidadItems = reservaDto.getItemsSolicitados().size();
                            for (Usuario mantenimiento : personalMantenimiento) {
                                boolean emailMantenimientoEnviado = emailService
                                        .enviarEmailNotificacionNuevaSolicitudInventario(
                                                mantenimiento.getEmail(), reservaDto, cantidadItems);
                                if (emailMantenimientoEnviado) {
                                    log.info(
                                            "Email de notificación de solicitud de inventario enviado a mantenimiento: {}",
                                            mantenimiento.getEmail());
                                } else {
                                    log.warn("No se pudo enviar email de notificación a mantenimiento: {}",
                                            mantenimiento.getEmail());
                                }
                            }
                        } else {
                            log.warn(
                                    "No se encontró personal de mantenimiento para notificar sobre solicitud de inventario");
                        }
                    } catch (Exception e) {
                        log.error("Error al enviar email de notificación a mantenimiento: {}", e.getMessage());
                        // No lanzar excepción para no interrumpir el flujo
                    }
                }
            } else if (nuevoEstado == Reserva.EstadoReserva.CANCELADO) {
                boolean emailEnviado = emailService.enviarEmailNotificacionReservaRechazada(
                        reserva.getUsuario().getEmail(), reservaDto);
                if (emailEnviado) {
                    log.info("Email de notificación de reserva rechazada enviado al usuario: {}",
                            reserva.getUsuario().getEmail());
                } else {
                    log.warn("No se pudo enviar email de notificación al usuario: {}",
                            reserva.getUsuario().getEmail());
                }
            }
        } catch (Exception e) {
            log.error("Error al enviar email de notificación al usuario: {}", e.getMessage());
            // No lanzar excepción para no interrumpir el flujo de cambio de estado
        }

        return reservaDto;
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
        if (reserva.getInicio().isBefore(Instant.now())) {
            throw new RuntimeException("No se puede editar una reserva que ya pasó");
        }

        // Actualizar campos si se proporcionaron
        boolean cambioHorarios = false;
        if (updateDto.getInicio() != null && updateDto.getFin() != null) {
            // Validar nuevos horarios
            if (!updateDto.getInicio().isBefore(updateDto.getFin())) {
                throw new RuntimeException("La fecha de inicio debe ser anterior a la fecha de fin");
            }

            if (updateDto.getInicio().isBefore(Instant.now())) {
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
                    Reserva.EstadoReserva.APROBADO);

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

            // Enviar notificaciones sobre el cambio de horario
            try {
                ReservaResponseDto reservaDto = mapToResponseDto(updatedReserva);
                DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm")
                        .withZone(ZoneId.of(appTimezone));
                String horarioAnterior = formatter.format(reserva.getInicio()) + " - "
                        + formatter.format(reserva.getFin());

                // Notificar al usuario
                boolean emailUsuarioEnviado = emailService.enviarEmailNotificacionReservaActualizada(
                        reserva.getUsuario().getEmail(),
                        reservaDto,
                        horarioAnterior,
                        false // esAnalista = false
                );
                if (emailUsuarioEnviado) {
                    log.info("Email de notificación de actualización de reserva enviado al usuario: {}",
                            reserva.getUsuario().getEmail());
                } else {
                    log.warn("No se pudo enviar email de notificación al usuario: {}",
                            reserva.getUsuario().getEmail());
                }

                // Notificar al analista si está asignado
                if (reserva.getAnalistaAsignado() != null) {
                    boolean emailAnalistaEnviado = emailService.enviarEmailNotificacionReservaActualizada(
                            reserva.getAnalistaAsignado().getEmail(),
                            reservaDto,
                            horarioAnterior,
                            true // esAnalista = true
                    );
                    if (emailAnalistaEnviado) {
                        log.info("Email de notificación de actualización de reserva enviado al analista: {}",
                                reserva.getAnalistaAsignado().getEmail());
                    } else {
                        log.warn("No se pudo enviar email de notificación al analista: {}",
                                reserva.getAnalistaAsignado().getEmail());
                    }
                }
            } catch (Exception e) {
                log.error("Error al enviar email de notificación de actualización de reserva: {}", e.getMessage());
                // No lanzar excepción para no interrumpir el flujo
            }
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
                () -> new RuntimeException("Reserva no encontrada con ID: " + id));

        // Verificar que el usuario es dueño de la reserva
        if (!reserva.getUsuario().getId().equals(usuario.getId())) {
            throw new RuntimeException("No tienes permisos para cancelar esta reserva");
        }

        // Si ya pasó, no se puede cancelar
        if (reserva.getInicio().isBefore(Instant.now())) {
            throw new RuntimeException("No se puede cancelar una reserva que ya pasó");
        }

        // Si ya está cancelada
        if (reserva.getEstado() == Reserva.EstadoReserva.CANCELADO) {
            throw new RuntimeException("La reserva ya está cancelada");
        }

        reserva.setEstado(Reserva.EstadoReserva.CANCELADO);
        reservaRepository.save(reserva);

        log.info("Reserva ID: {} cancelada exitosamente", id);

        // Invalidar caché de recomendaciones para el usuario
        try {
            recomendacionService.invalidarCacheRecomendaciones(usuario.getId());
        } catch (Exception e) {
            log.warn("Error invalidando caché de recomendaciones: {}", e.getMessage());
        }

        // Enviar notificación al analista si estaba asignado
        if (reserva.getAnalistaAsignado() != null) {
            try {
                ReservaResponseDto reservaDto = mapToResponseDto(reserva);
                boolean emailEnviado = emailService.enviarEmailNotificacionReservaCancelada(
                        reserva.getAnalistaAsignado().getEmail(), reservaDto);
                if (emailEnviado) {
                    log.info("Email de notificación de reserva cancelada enviado al analista: {}",
                            reserva.getAnalistaAsignado().getEmail());
                } else {
                    log.warn("No se pudo enviar email de notificación al analista: {}",
                            reserva.getAnalistaAsignado().getEmail());
                }
            } catch (Exception e) {
                log.error("Error al enviar email de notificación al analista: {}", e.getMessage());
                // No lanzar excepción para no interrumpir el flujo de cancelación
            }
        }
    }

    /**
     * Obtener reservas de un espacio específico
     * Cacheado por 2 minutos ya que las reservas cambian frecuentemente
     */
    @Transactional(readOnly = true)
    @org.springframework.cache.annotation.Cacheable(value = "reservas", key = "'espacio:' + #espacioId")
    public List<ReservaResponseDto> getReservasByEspacio(Long espacioId) {
        List<Reserva> reservas = reservaRepository.findByEspacioId(espacioId);
        return reservas.stream()
                .map(this::mapToResponseDto)
                .collect(Collectors.toList());
    }

    /**
     * Obtener todas las reservas del sistema (público, para visualización)
     * Permite filtros opcionales para visualización
     * Si el usuario es ANALISTA, solo muestra las reservas asignadas a él
     */
    @Transactional(readOnly = true)
    public List<ReservaResponseDto> getTodasLasReservas(
            String estado,
            Long espacioId,
            Long carreraId,
            Long tipoEspacioId,
            Instant fechaInicio,
            Instant fechaFin,
            String userEmail,
            String userRole) {
        Specification<Reserva> spec = buildSpecificationPublico(estado, espacioId, carreraId, tipoEspacioId,
                fechaInicio, fechaFin, userEmail, userRole);

        List<Reserva> reservas = reservaRepository.findAll(spec);
        return reservas.stream()
                .map(this::mapToResponseDto)
                .sorted((a, b) -> b.getInicio().compareTo(a.getInicio())) // Ordenar por fecha descendente
                .collect(Collectors.toList());
    }

    /**
     * Construir Specification para filtrar reservas públicas (sin filtrar por
     * usuario)
     * Si el usuario es ANALISTA, solo muestra las reservas asignadas a él
     */
    private Specification<Reserva> buildSpecificationPublico(
            String estado,
            Long espacioId,
            Long carreraId,
            Long tipoEspacioId,
            Instant fechaInicio,
            Instant fechaFin,
            String userEmail,
            String userRole) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            // Si el usuario es EXTERNO, solo mostrar reservas públicas
            if (ROLE_EXTERNO.equals(userRole)) {
                predicates.add(cb.equal(root.get("esPublica"), true));
                log.debug("Filtrando solo reservas públicas para usuario externo: {}", userEmail);
            }

            // Si el usuario es ANALISTA, mostrar reservas asignadas a él O sin analista
            // asignado (incluye externos)
            if (ROLE_ANALISTA.equals(userRole) && userEmail != null) {
                Usuario analista = usuarioRepository.findByEmail(userEmail)
                        .orElse(null);
                if (analista != null) {
                    // Mostrar reservas asignadas a este analista O sin analista asignado (null)
                    Predicate asignadasAMi = cb.equal(root.get("analistaAsignado").get("id"), analista.getId());
                    Predicate sinAnalista = cb.isNull(root.get("analistaAsignado"));
                    predicates.add(cb.or(asignadasAMi, sinAnalista));
                    log.debug("Filtrando reservas para analista: {} (ID: {}) - incluyendo sin asignar", userEmail,
                            analista.getId());
                }
            }

            // NO filtrar por usuario - mostrar todas las reservas (solo para ADMIN y otros
            // roles internos)

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

            // Filtro por tipo de espacio (tipoEspacioId es un campo directo en Espacio, no
            // una relación)
            if (tipoEspacioId != null) {
                // Acceder al campo tipoEspacioId directamente del espacio
                predicates.add(cb.equal(
                        root.get("espacio").get("tipoEspacioId"),
                        tipoEspacioId));
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
        Instant now = Instant.now();
        ZonedDateTime nowZdt = now.atZone(ZoneOffset.UTC);
        YearMonth mesActual = YearMonth.from(nowZdt);
        YearMonth proximoMes = mesActual.plusMonths(1);
        YearMonth mesAnterior = mesActual.minusMonths(1);
        int anioActual = nowZdt.getYear();

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
                .filter(r -> YearMonth.from(r.getInicio().atZone(ZoneOffset.UTC)).equals(mesActual))
                .count();

        long reservasProximoMes = reservas.stream()
                .filter(r -> YearMonth.from(r.getInicio().atZone(ZoneOffset.UTC)).equals(proximoMes))
                .count();

        long reservasEsteAnio = reservas.stream()
                .filter(r -> r.getInicio().atZone(ZoneOffset.UTC).getYear() == anioActual)
                .count();

        // Reservas por mes (últimos 12 meses)
        Map<String, Long> reservasPorMes = new HashMap<>();
        for (int i = 11; i >= 0; i--) {
            YearMonth mes = mesActual.minusMonths(i);
            long count = reservas.stream()
                    .filter(r -> YearMonth.from(r.getInicio().atZone(ZoneOffset.UTC)).equals(mes))
                    .count();
            reservasPorMes.put(mes.toString(), count);
        }

        // Reservas por día de semana
        Map<String, Long> reservasPorDiaSemana = new HashMap<>();
        for (DayOfWeek dia : DayOfWeek.values()) {
            long count = reservas.stream()
                    .filter(r -> r.getInicio().atZone(ZoneOffset.UTC).getDayOfWeek() == dia)
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
                        Collectors.counting()));

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
                .filter(r -> YearMonth.from(r.getInicio().atZone(ZoneOffset.UTC)).equals(mesActual))
                .mapToDouble(r -> Duration.between(r.getInicio(), r.getFin()).toHours())
                .sum();

        // ========== MÉTRICAS DE FRECUENCIA ==========
        // Promedio reservas por semana (calcular semanas totales)
        Optional<Reserva> primeraReservaOpt = reservas.stream()
                .min(Comparator.comparing(Reserva::getInicio));

        long semanasTotales = 1;
        if (primeraReservaOpt.isPresent()) {
            Instant primeraReserva = primeraReservaOpt.get().getInicio();
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
        Instant fechaUltimaReserva = null;
        if (ultimaReservaOpt.isPresent()) {
            fechaUltimaReserva = ultimaReservaOpt.get().getFin();
            diasDesdeUltimaReserva = Duration.between(fechaUltimaReserva, now).toDays();
        }

        // Días hasta próxima reserva
        Optional<Reserva> proximaReservaOpt = reservas.stream()
                .filter(r -> r.getInicio().isAfter(now))
                .min(Comparator.comparing(Reserva::getInicio));

        Long diasHastaProximaReserva = null;
        Instant fechaProximaReserva = null;
        if (proximaReservaOpt.isPresent()) {
            fechaProximaReserva = proximaReservaOpt.get().getInicio();
            diasHastaProximaReserva = Duration.between(now, fechaProximaReserva).toDays();
        }

        // ========== MÉTRICAS COMPARATIVAS ==========
        long reservasMesActual = reservasEsteMes;

        long reservasMesAnterior = reservas.stream()
                .filter(r -> YearMonth.from(r.getInicio().atZone(ZoneOffset.UTC)).equals(mesAnterior))
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
                porcentajeCambioMesAnterior);
    }

    /**
     * Obtener estadísticas globales de todas las reservas (para ANALISTA/ADMIN)
     */
    @Cacheable(value = "reservas", key = "'global-stats'")
    @Transactional(readOnly = true)
    public ReservaStatsDto obtenerEstadisticasGlobales() {
        log.info("Generando estadísticas globales de reservas");

        // Obtener todas las reservas
        List<Reserva> reservas = reservaRepository.findAll();

        // Si no hay reservas, retornar DTO con valores en 0 o null
        if (reservas.isEmpty()) {
            return crearDtoVacio();
        }

        // Reutilizar la misma lógica que obtenerEstadisticasPersonales pero con todas
        // las reservas
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
    public ReservaResponseDto mapToResponseDto(Reserva reserva) {
        ReservaResponseDto dto = new ReservaResponseDto();
        dto.setId(reserva.getId());
        dto.setEspacioId(reserva.getEspacio().getId());
        dto.setEspacioNombre(reserva.getEspacio().getNombre());

        // Convertir ruta de MinIO a URL pública si es necesario
        String imagenUrl = reserva.getEspacio().getImagenUrl();
        if (imagenUrl != null && !imagenUrl.trim().isEmpty()) {
            dto.setEspacioImagen(fileStorageService.getImageUrl(imagenUrl));
        } else {
            dto.setEspacioImagen(null);
        }

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
        // Información del analista asignado
        if (reserva.getAnalistaAsignado() != null) {
            dto.setAnalistaId(reserva.getAnalistaAsignado().getId());
            dto.setAnalistaNombre(reserva.getAnalistaAsignado().getNombre());
            dto.setAnalistaEmail(reserva.getAnalistaAsignado().getEmail());
        }
        dto.setInicio(reserva.getInicio());
        dto.setFin(reserva.getFin());
        dto.setEstado(reserva.getEstado());
        dto.setEsPublica(reserva.getEsPublica());
        dto.setTitulo(reserva.getTitulo());
        dto.setMotivoSolicitud(reserva.getMotivoSolicitud());
        dto.setMensajeAnalista(reserva.getMensajeAnalista());
        // Mapear items solicitados
        if (reserva.getItemsSolicitados() != null && !reserva.getItemsSolicitados().isEmpty()) {
            dto.setItemsSolicitados(reservaItemSolicitadoService.obtenerPorReserva(reserva.getId()));
        }
        dto.setCreatedAt(reserva.getCreatedAt());
        dto.setUpdatedAt(reserva.getUpdatedAt());
        return dto;
    }
}
