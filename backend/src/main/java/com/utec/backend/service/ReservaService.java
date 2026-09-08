package com.utec.backend.service;

import com.utec.backend.dto.reserva.ReservaCreateDto;
import com.utec.backend.dto.reserva_item_solicitado.ReservaItemSolicitadoResponseDto;
import com.utec.backend.dto.reserva.ReservaFilters;
import com.utec.backend.dto.reserva.ReservaResponseDto;
import com.utec.backend.dto.reserva.ReservaStatsDto;
import com.utec.backend.exception.AccesoDenegadoException;
import com.utec.backend.exception.UsuarioNotFoundException;
import com.utec.backend.model.Carrera;
import com.utec.backend.model.Espacio;
import com.utec.backend.model.Reserva;
import com.utec.backend.model.Usuario;
import com.utec.backend.repository.CarreraRepository;
import com.utec.backend.repository.EspacioRepository;
import com.utec.backend.repository.ReservaRepository;
import com.utec.backend.repository.UsuarioRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.cache.annotation.Cacheable;

import java.time.DayOfWeek;
import java.time.Duration;
import java.time.Instant;
import java.time.YearMonth;
import java.time.ZoneOffset;
import java.time.ZonedDateTime;
import java.util.*;
import java.util.stream.Collectors;
import jakarta.persistence.criteria.Predicate;

import static com.utec.backend.security.Constants.*;

@Service
@Slf4j
public class ReservaService {

    private static final String MSG_USUARIO_NO_ENCONTRADO = "Usuario no encontrado: ";
    private static final String LOG_ERROR_INVALIDAR_CACHE_RECOMENDACIONES =
            "Error invalidando caché de recomendaciones: {}";
    private static final String LOG_WARN_EMAIL_ANALISTA_NO_ENVIADO =
            "No se pudo enviar email de notificación al analista: {}";
    private static final String LOG_ERROR_EMAIL_ANALISTA =
            "Error al enviar email de notificación al analista: {}";
    private static final String LOG_WARN_EMAIL_USUARIO_NO_ENVIADO =
            "No se pudo enviar email de notificación al usuario: {}";

    // Claves de campos JPA usadas en Specifications y filtros
    private static final String FIELD_INICIO = "inicio";
    private static final String FIELD_ESPACIO = "espacio";
    private static final String FIELD_ESTADO = "estado";
    private static final String FIELD_CARRERA = "carrera";
    private static final String FIELD_TIPO_ESPACIO_ID = "tipoEspacioId";
    private static final String FIELD_ANALISTA_ASIGNADO = "analistaAsignado";
    private static final String FIELD_USUARIO = "usuario";

    // Valor especial del filtro de estado que significa "sin filtrar"
    private static final String ESTADO_FILTRO_TODAS = "todas";

    private final ReservaRepository reservaRepository;
    private final EspacioRepository espacioRepository;
    private final UsuarioRepository usuarioRepository;
    private final CarreraRepository carreraRepository;
    private final ReservaItemSolicitadoService reservaItemSolicitadoService;
    private final EmailService emailService;
    private final RecomendacionService recomendacionService;
    private final FileStorageService fileStorageService;
    private final ReservaEstadisticasService reservaEstadisticasService;
    private final ReservaService self;

    public ReservaService(
            ReservaRepository reservaRepository,
            EspacioRepository espacioRepository,
            UsuarioRepository usuarioRepository,
            CarreraRepository carreraRepository,
            ReservaItemSolicitadoService reservaItemSolicitadoService,
            EmailService emailService,
            RecomendacionService recomendacionService,
            FileStorageService fileStorageService,
            ReservaEstadisticasService reservaEstadisticasService,
            @Lazy @Autowired ReservaService self) {
        this.reservaRepository = reservaRepository;
        this.espacioRepository = espacioRepository;
        this.usuarioRepository = usuarioRepository;
        this.carreraRepository = carreraRepository;
        this.reservaItemSolicitadoService = reservaItemSolicitadoService;
        this.emailService = emailService;
        this.recomendacionService = recomendacionService;
        this.fileStorageService = fileStorageService;
        this.reservaEstadisticasService = reservaEstadisticasService;
        this.self = self;
    }

    /**
     * Crear una nueva reserva con manejo robusto de concurrencia
     * USADO POR:
     * - Admin y Analista: crean reservas auto-aprobadas (APROBADO)
     * - Docente: crea solicitudes pendientes (PENDIENTE)
     */
    @Transactional(isolation = Isolation.SERIALIZABLE, rollbackFor = Exception.class)
    public ReservaResponseDto createReserva(ReservaCreateDto createDto, String userEmail, String userRole) {
        log.info("Creando reserva para usuario: {} con rol: {}", userEmail, userRole);

        Usuario usuario = obtenerUsuarioParaReserva(userEmail);
        Espacio espacio = obtenerYValidarEspacio(createDto.getEspacioId());
        Carrera carrera = obtenerYValidarCarrera(createDto.getCarreraId());

        validarHorariosBasicos(createDto);
        validarRecurrenciaSiCorresponde(createDto);

        boolean esDocente = ROLE_DOCENTE.equals(userRole);
        boolean esExterno = ROLE_EXTERNO.equals(userRole);
        boolean esAnalista = ROLE_ANALISTA.equals(userRole);

        Usuario analistaAsignado = resolverAnalistaAsignado(createDto, usuario, userEmail, esDocente, esAnalista);
        Boolean esPublica = resolverEsPublica(createDto, esExterno);
        Reserva.EstadoReserva estadoInicial = resolverEstadoInicialYValidarConflictos(createDto, esDocente, esExterno);

        if (createDto.getTipoRecurrencia() != null) {
            return crearReservasRecurrentes(new ReservaRecurrenteContext(createDto, usuario, espacio, carrera,
                    analistaAsignado, estadoInicial, esDocente, esPublica));
        }
        return crearReservaSimple(createDto, usuario, espacio, carrera, analistaAsignado, estadoInicial, esPublica);
    }

    private Usuario obtenerUsuarioParaReserva(String userEmail) {
        return usuarioRepository.findByEmail(userEmail)
                .orElseThrow(() -> new UsuarioNotFoundException(MSG_USUARIO_NO_ENCONTRADO + userEmail));
    }

    private Espacio obtenerYValidarEspacio(Long espacioId) {
        Espacio espacio = espacioRepository.findById(espacioId)
                .orElseThrow(() -> new IllegalArgumentException("Espacio no encontrado con ID: " + espacioId));
        if (!"DISPONIBLE".equals(espacio.getEstado())) {
            throw new IllegalStateException("El espacio no está disponible. Estado actual: " + espacio.getEstado());
        }
        return espacio;
    }

    private Carrera obtenerYValidarCarrera(Long carreraId) {
        if (carreraId == null) {
            return null;
        }
        Carrera carrera = carreraRepository.findById(carreraId)
                .orElseThrow(() -> new IllegalArgumentException("Carrera no encontrada con ID: " + carreraId));
        if (carrera.getDeletedAt() != null) {
            throw new IllegalStateException("La carrera especificada ha sido eliminada");
        }
        return carrera;
    }

    private void validarHorariosBasicos(ReservaCreateDto createDto) {
        if (!createDto.getInicio().isBefore(createDto.getFin())) {
            throw new IllegalArgumentException("La fecha de inicio debe ser anterior a la fecha de fin");
        }
        if (createDto.getInicio().isBefore(Instant.now())) {
            throw new IllegalArgumentException("No se puede reservar en el pasado");
        }
        long durationMinutes = Duration.between(createDto.getInicio(), createDto.getFin()).toMinutes();
        if (durationMinutes < 30) {
            throw new IllegalArgumentException("La reserva debe tener una duración mínima de 30 minutos");
        }
    }

    private void validarRecurrenciaSiCorresponde(ReservaCreateDto createDto) {
        if (createDto.getTipoRecurrencia() == null) {
            return;
        }
        if (createDto.getFechaFinRecurrencia() == null) {
            throw new IllegalArgumentException(
                    "La fecha de fin de recurrencia es requerida cuando se especifica un tipo de recurrencia");
        }
        if (!createDto.getFechaFinRecurrencia().isAfter(createDto.getInicio())) {
            throw new IllegalArgumentException("La fecha de fin de recurrencia debe ser posterior a la fecha de inicio");
        }
        if (calcularMaxReservas(createDto) > 1000) {
            throw new IllegalArgumentException(
                    "La recurrencia generaría más de 1000 reservas. Por favor, reduzca el rango de fechas.");
        }
    }

    private Usuario resolverAnalistaAsignado(ReservaCreateDto createDto, Usuario usuario, String userEmail,
                                             boolean esDocente, boolean esAnalista) {
        if (esDocente) {
            return validarAnalistaSeleccionadoPorDocente(createDto, userEmail);
        }
        if (esAnalista) {
            log.info("Analista {} se auto-asignó a la reserva que está creando", userEmail);
            return usuario;
        }
        return null; // Externos / admin sin analista
    }

    private Usuario validarAnalistaSeleccionadoPorDocente(ReservaCreateDto createDto, String userEmail) {
        if (createDto.getAnalistaId() == null) {
            throw new IllegalArgumentException("El docente debe seleccionar un analista para gestionar la solicitud");
        }
        Usuario analistaAsignado = usuarioRepository.findById(createDto.getAnalistaId())
                .orElseThrow(() -> new IllegalArgumentException("Analista no encontrado con ID: " + createDto.getAnalistaId()));
        if (analistaAsignado.getRolApp() != Usuario.RolApp.ANALISTA) {
            throw new IllegalArgumentException("El usuario seleccionado no es un analista");
        }
        if (analistaAsignado.getDeletedAt() != null) {
            throw new IllegalStateException("El analista seleccionado ha sido eliminado");
        }
        log.info("Analista {} asignado a solicitud de docente {}", analistaAsignado.getEmail(), userEmail);
        return analistaAsignado;
    }

    private Boolean resolverEsPublica(ReservaCreateDto createDto, boolean esExterno) {
        if (esExterno) {
            log.info("Usuario externo creando reserva pública");
            return true;
        }
        return createDto.getEsPublica() != null && createDto.getEsPublica();
    }

    private Reserva.EstadoReserva resolverEstadoInicialYValidarConflictos(ReservaCreateDto createDto,
                                                                          boolean esDocente, boolean esExterno) {
        if (esDocente || esExterno) {
            log.info("{} creando solicitud pendiente", esDocente ? "Docente" : "Usuario externo");
            return Reserva.EstadoReserva.PENDIENTE;
        }
        log.info("Admin/Analista creando reserva auto-aprobada");
        validarSinConflictosAprobado(createDto);
        return Reserva.EstadoReserva.APROBADO;
    }

    private void validarSinConflictosAprobado(ReservaCreateDto createDto) {
        List<Reserva> conflictos = reservaRepository.findConflictingReservas(
                createDto.getEspacioId(),
                createDto.getInicio(),
                createDto.getFin(),
                Reserva.EstadoReserva.APROBADO);
        if (!conflictos.isEmpty()) {
            log.warn("Conflicto de horario detectado. Espacio ocupado en ese rango de tiempo");
            throw new IllegalStateException(
                    "El espacio ya está reservado en ese horario. Por favor, seleccione otro horario.");
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
            log.warn(LOG_ERROR_INVALIDAR_CACHE_RECOMENDACIONES, e.getMessage());
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
                    log.warn(LOG_WARN_EMAIL_ANALISTA_NO_ENVIADO,
                            analistaAsignado.getEmail());
                }
            } catch (Exception e) {
                log.error(LOG_ERROR_EMAIL_ANALISTA, e.getMessage());
                // No lanzar excepción para no interrumpir el flujo de creación de reserva
            }
        }

        return reservaDto;
    }

    /**
     * Contexto inmutable para la creación de reservas recurrentes.
     */
    private record ReservaRecurrenteContext(
            ReservaCreateDto createDto,
            Usuario usuario,
            Espacio espacio,
            Carrera carrera,
            Usuario analistaAsignado,
            Reserva.EstadoReserva estadoInicial,
            boolean esDocente,
            Boolean esPublica) {}

    /**
     * Crear múltiples reservas recurrentes
     */
    private ReservaResponseDto crearReservasRecurrentes(ReservaRecurrenteContext ctx) {
        ReservaCreateDto createDto = ctx.createDto();
        Usuario usuario = ctx.usuario();
        Espacio espacio = ctx.espacio();
        Carrera carrera = ctx.carrera();
        Usuario analistaAsignado = ctx.analistaAsignado();
        Reserva.EstadoReserva estadoInicial = ctx.estadoInicial();
        boolean esDocente = ctx.esDocente();
        Boolean esPublica = ctx.esPublica();

        List<Instant> fechasInicio = generarFechasRecurrentes(createDto);
        log.info("Generando {} reservas recurrentes de tipo {}", fechasInicio.size(), createDto.getTipoRecurrencia());

        long duracionMinutos = Duration.between(createDto.getInicio(), createDto.getFin()).toMinutes();
        List<Reserva> reservasCreadas = new ArrayList<>();

        for (Instant fechaInicio : fechasInicio) {
            Instant fechaFin = fechaInicio.plusSeconds(duracionMinutos * 60);

            if (!esFechaRecurrenteValida(fechaInicio, fechaFin, espacio, esDocente)) {
                continue;
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
            throw new IllegalStateException(
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
                    log.warn(LOG_WARN_EMAIL_ANALISTA_NO_ENVIADO,
                            analistaAsignado.getEmail());
                }
            } catch (Exception e) {
                log.error(LOG_ERROR_EMAIL_ANALISTA, e.getMessage());
                // No lanzar excepción para no interrumpir el flujo de creación de reserva
            }
        }

        return primeraReservaDto;
    }

    /**
     * Determina si una fecha recurrente puede convertirse en reserva: descarta
     * fechas pasadas y, para no-docentes, valida que no haya conflictos con
     * reservas ya aprobadas.
     */
    private boolean esFechaRecurrenteValida(Instant fechaInicio, Instant fechaFin, Espacio espacio, boolean esDocente) {
        if (fechaInicio.isBefore(Instant.now())) {
            return false;
        }
        if (esDocente) {
            return true;
        }
        List<Reserva> conflictos = reservaRepository.findConflictingReservas(
                espacio.getId(), fechaInicio, fechaFin, Reserva.EstadoReserva.APROBADO);
        if (!conflictos.isEmpty()) {
            log.warn("Conflicto detectado para fecha recurrente: {}. Se omite esta reserva.", fechaInicio);
            return false;
        }
        return true;
    }

    /**
     * Generar lista de fechas de inicio para reservas recurrentes
     */
    private List<Instant> generarFechasRecurrentes(ReservaCreateDto createDto) {
        List<Instant> fechas = new ArrayList<>();
        ZonedDateTime fechaActual = createDto.getInicio().atZone(ZoneOffset.UTC);
        // El frontend envía fechaFinRecurrencia como fin de día en la zona del
        // usuario (`toFinDeDiaISO`), por lo que ya cubre el día elegido entero.
        // Se usa directamente como cota superior inclusiva.
        ZonedDateTime fechaFinAjustada = createDto.getFechaFinRecurrencia().atZone(ZoneOffset.UTC);

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
                long meses = (long) (finZdt.getYear() - inicioZdt.getYear()) * 12
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
        return self.createReserva(createDto, userEmail, ROLE_ADMIN); // Por defecto ADMIN para mantener compatibilidad
    }

    /**
     * Obtener todas las reservas del usuario autenticado
     */
    @Transactional(readOnly = true)
    public List<ReservaResponseDto> getReservasByUsuario(String userEmail) {
        Usuario usuario = usuarioRepository.findByEmail(userEmail)
                .orElseThrow(() -> new UsuarioNotFoundException(MSG_USUARIO_NO_ENCONTRADO + userEmail));

        List<Reserva> reservas = reservaRepository.findByUsuarioId(usuario.getId());
        return reservas.stream()
                .map(this::mapToResponseDto)
                .toList();
    }

    /**
     * Obtener reservas del usuario autenticado con paginación y filtros
     */
    @Transactional(readOnly = true)
    public Page<ReservaResponseDto> getReservasByUsuarioPaged(
            String userEmail,
            Pageable pageable,
            ReservaFilters filters) {
        Usuario usuario = usuarioRepository.findByEmail(userEmail)
                .orElseThrow(() -> new UsuarioNotFoundException(MSG_USUARIO_NO_ENCONTRADO + userEmail));

        Specification<Reserva> spec = buildSpecification(usuario.getId(), filters);

        Page<Reserva> reservasPage = reservaRepository.findAll(spec, pageable);
        return reservasPage.map(this::mapToResponseDto);
    }

    /**
     * Construir Specification para filtrar reservas. Aplica filtro obligatorio
     * por {@code usuarioId} y delega los filtros opcionales a métodos privados
     * para mantener baja la complejidad cognitiva.
     */
    private Specification<Reserva> buildSpecification(Long usuarioId, ReservaFilters filters) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(cb.equal(root.get(FIELD_USUARIO).get("id"), usuarioId));
            appendCommonFilters(predicates, root, cb, filters);
            query.orderBy(cb.desc(root.get(FIELD_INICIO)));
            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }

    /**
     * Agrega al listado de predicados los filtros comunes de estado, espacio,
     * carrera, fechas y particionado por tiempo (pasadas/futuras).
     */
    private void appendCommonFilters(
            List<Predicate> predicates,
            jakarta.persistence.criteria.Root<Reserva> root,
            jakarta.persistence.criteria.CriteriaBuilder cb,
            ReservaFilters filters) {
        addEstadoPredicate(predicates, root, cb, filters.estado());
        addIdPredicate(predicates, root.get(FIELD_ESPACIO).get("id"), filters.espacioId(), cb);
        addIdPredicate(predicates, root.get(FIELD_ESPACIO).get(FIELD_TIPO_ESPACIO_ID), filters.tipoEspacioId(), cb);
        addIdPredicate(predicates, root.get(FIELD_CARRERA).get("id"), filters.carreraId(), cb);
        addRangoFechas(predicates, root, cb, filters.fechaInicio(), filters.fechaFin());
        addTiempoPredicate(predicates, root, cb, filters.tiempo());
        addSearchPredicate(predicates, root, cb, filters.search());
    }

    private void addSearchPredicate(List<Predicate> predicates,
                                    jakarta.persistence.criteria.Root<Reserva> root,
                                    jakarta.persistence.criteria.CriteriaBuilder cb,
                                    String search) {
        if (search == null || search.isBlank()) {
            return;
        }
        String like = "%" + search.trim().toLowerCase() + "%";
        Predicate titulo = cb.like(cb.lower(root.get("titulo")), like);
        Predicate usuario = cb.like(cb.lower(root.get(FIELD_USUARIO).get("nombre")), like);
        predicates.add(cb.or(titulo, usuario));
    }

    private void addEstadoPredicate(List<Predicate> predicates,
                                    jakarta.persistence.criteria.Root<Reserva> root,
                                    jakarta.persistence.criteria.CriteriaBuilder cb,
                                    String estado) {
        if (estado == null || estado.isEmpty() || estado.equals(ESTADO_FILTRO_TODAS)) {
            return;
        }
        try {
            Reserva.EstadoReserva estadoEnum = Reserva.EstadoReserva.valueOf(estado.toUpperCase());
            predicates.add(cb.equal(root.get(FIELD_ESTADO), estadoEnum));
        } catch (IllegalArgumentException e) {
            // Estado no válido: se ignora el filtro silenciosamente
        }
    }

    private void addIdPredicate(List<Predicate> predicates,
                                jakarta.persistence.criteria.Path<?> path,
                                Long value,
                                jakarta.persistence.criteria.CriteriaBuilder cb) {
        if (value != null) {
            predicates.add(cb.equal(path, value));
        }
    }

    private void addRangoFechas(List<Predicate> predicates,
                                jakarta.persistence.criteria.Root<Reserva> root,
                                jakarta.persistence.criteria.CriteriaBuilder cb,
                                Instant fechaInicio,
                                Instant fechaFin) {
        if (fechaInicio != null) {
            predicates.add(cb.greaterThanOrEqualTo(root.get(FIELD_INICIO), fechaInicio));
        }
        if (fechaFin != null) {
            predicates.add(cb.lessThanOrEqualTo(root.get(FIELD_INICIO), fechaFin));
        }
    }

    private void addTiempoPredicate(List<Predicate> predicates,
                                    jakarta.persistence.criteria.Root<Reserva> root,
                                    jakarta.persistence.criteria.CriteriaBuilder cb,
                                    String tiempo) {
        Instant ahora = Instant.now();
        if ("futuras".equals(tiempo)) {
            predicates.add(cb.greaterThan(root.get(FIELD_INICIO), ahora));
        } else if ("pasadas".equals(tiempo)) {
            predicates.add(cb.lessThanOrEqualTo(root.get(FIELD_INICIO), ahora));
        }
    }

    /**
     * Obtener todas las reservas del sistema (sin filtrar por usuario)
     * Para ANALISTA/ADMIN con paginación y filtros
     * Si el usuario es ANALISTA, solo muestra las reservas asignadas a él
     */
    @Transactional(readOnly = true)
    public Page<ReservaResponseDto> getAllReservasPaged(
            Pageable pageable,
            ReservaFilters filters,
            String userEmail,
            String userRole) {
        Specification<Reserva> spec = buildSpecificationAll(filters, userEmail, userRole);

        Page<Reserva> reservasPage = reservaRepository.findAll(spec, pageable);
        return reservasPage.map(this::mapToResponseDto);
    }

    /**
     * Construir Specification para filtrar todas las reservas (sin filtrar por
     * usuario por defecto)
     * Si el usuario es ANALISTA, solo muestra las reservas asignadas a él
     */
    private Specification<Reserva> buildSpecificationAll(
            ReservaFilters filters,
            String userEmail,
            String userRole) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            addAnalistaScopePredicate(predicates, root, cb, userEmail, userRole);
            addUsuarioOpcionalPredicate(predicates, root, cb, filters.usuarioId(), userRole);
            appendCommonFilters(predicates, root, cb, filters);
            query.orderBy(cb.desc(root.get(FIELD_INICIO)));
            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }

    private void addAnalistaScopePredicate(List<Predicate> predicates,
                                           jakarta.persistence.criteria.Root<Reserva> root,
                                           jakarta.persistence.criteria.CriteriaBuilder cb,
                                           String userEmail,
                                           String userRole) {
        if (!ROLE_ANALISTA.equals(userRole) || userEmail == null) {
            return;
        }
        Usuario analista = usuarioRepository.findByEmail(userEmail).orElse(null);
        if (analista == null) {
            return;
        }
        Predicate asignadasAMi = cb.equal(root.get(FIELD_ANALISTA_ASIGNADO).get("id"), analista.getId());
        Predicate sinAnalista = cb.isNull(root.get(FIELD_ANALISTA_ASIGNADO));
        predicates.add(cb.or(asignadasAMi, sinAnalista));
        log.debug("Filtrando reservas para analista: {} (ID: {}) - incluyendo sin asignar", userEmail,
                analista.getId());
    }

    private void addUsuarioOpcionalPredicate(List<Predicate> predicates,
                                             jakarta.persistence.criteria.Root<Reserva> root,
                                             jakarta.persistence.criteria.CriteriaBuilder cb,
                                             Long usuarioId,
                                             String userRole) {
        if (usuarioId != null && !ROLE_ANALISTA.equals(userRole)) {
            predicates.add(cb.equal(root.get(FIELD_USUARIO).get("id"), usuarioId));
        }
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

        Reserva.EstadoReserva nuevoEstado = parseNuevoEstado(nuevoEstadoStr);
        Reserva reserva = obtenerReservaPendiente(id);
        validarPermisosAnalista(reserva, userEmail, userRole);

        if (nuevoEstado == Reserva.EstadoReserva.APROBADO) {
            validarSinConflictosAprobacion(reserva);
        }

        Reserva savedReserva = aplicarCambioEstado(reserva, nuevoEstado, mensajeAnalista);
        log.info("Estado de reserva ID: {} cambiado exitosamente a {}", id, nuevoEstado);

        // Si el analista cancela la reserva, también cerramos las solicitudes
        // de inventario activas para que no queden zombies en el panel de mantenimiento.
        if (nuevoEstado == Reserva.EstadoReserva.CANCELADO) {
            try {
                reservaItemSolicitadoService.cerrarSolicitudesDeReserva(savedReserva.getId());
            } catch (Exception e) {
                log.warn("No se pudieron cerrar solicitudes de inventario de reserva {}: {}", id, e.getMessage());
            }
        }

        invalidarCacheRecomendacionesUsuario(reserva.getUsuario().getId());

        ReservaResponseDto reservaDto = mapToResponseDto(savedReserva);
        notificarCambioEstadoUsuario(reserva, reservaDto, nuevoEstado);
        return reservaDto;
    }

    private Reserva.EstadoReserva parseNuevoEstado(String nuevoEstadoStr) {
        Reserva.EstadoReserva nuevoEstado;
        try {
            nuevoEstado = Reserva.EstadoReserva.valueOf(nuevoEstadoStr.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException(
                    "Estado inválido: " + nuevoEstadoStr + ". Estados válidos: PENDIENTE, APROBADO, CANCELADO", e);
        }
        if (nuevoEstado != Reserva.EstadoReserva.APROBADO && nuevoEstado != Reserva.EstadoReserva.CANCELADO) {
            throw new IllegalArgumentException("Solo se puede cambiar el estado a APROBADO o CANCELADO");
        }
        return nuevoEstado;
    }

    private Reserva obtenerReservaPendiente(Long id) {
        Reserva reserva = reservaRepository.findByIdWithRelations(id);
        if (reserva == null) {
            throw new IllegalArgumentException("Reserva no encontrada con ID: " + id);
        }
        if (reserva.getEstado() != Reserva.EstadoReserva.PENDIENTE) {
            throw new IllegalStateException(
                    "Solo se pueden aprobar/rechazar reservas en estado PENDIENTE. Estado actual: "
                            + reserva.getEstado());
        }
        return reserva;
    }

    private void validarPermisosAnalista(Reserva reserva, String userEmail, String userRole) {
        if (!ROLE_ANALISTA.equals(userRole)) {
            return;
        }
        Usuario analista = usuarioRepository.findByEmail(userEmail)
                .orElseThrow(() -> new UsuarioNotFoundException(MSG_USUARIO_NO_ENCONTRADO + userEmail));
        Usuario asignado = reserva.getAnalistaAsignado();
        if (asignado == null) {
            log.info("Analista {} aprobando/rechazando reserva sin analista asignado (posible reserva de externo)",
                    userEmail);
            return;
        }
        if (!asignado.getId().equals(analista.getId())) {
            throw new AccesoDenegadoException(
                    "No tienes permisos para gestionar esta reserva. Solo puedes gestionar las reservas asignadas a ti.");
        }
        log.info("Analista {} aprobando/rechazando reserva asignada a él", userEmail);
    }

    private void validarSinConflictosAprobacion(Reserva reserva) {
        List<Reserva> conflictos = reservaRepository.findConflictingReservas(
                reserva.getEspacio().getId(),
                reserva.getInicio(),
                reserva.getFin(),
                Reserva.EstadoReserva.APROBADO);
        boolean hayConflictoExterno = conflictos.stream()
                .anyMatch(c -> !c.getId().equals(reserva.getId()));
        if (hayConflictoExterno) {
            log.warn("Conflicto de horario detectado al aprobar reserva. Espacio ocupado en ese rango de tiempo");
            throw new IllegalStateException(
                    "No se puede aprobar la reserva: el espacio ya está reservado en ese horario por otra reserva aprobada.");
        }
    }

    private Reserva aplicarCambioEstado(Reserva reserva, Reserva.EstadoReserva nuevoEstado, String mensajeAnalista) {
        reserva.setEstado(nuevoEstado);
        if (mensajeAnalista != null && !mensajeAnalista.trim().isEmpty()) {
            reserva.setMensajeAnalista(mensajeAnalista.trim());
        }
        return reservaRepository.save(reserva);
    }

    private void invalidarCacheRecomendacionesUsuario(Long usuarioId) {
        try {
            recomendacionService.invalidarCacheRecomendaciones(usuarioId);
        } catch (Exception e) {
            log.warn(LOG_ERROR_INVALIDAR_CACHE_RECOMENDACIONES, e.getMessage());
        }
    }

    private void notificarCambioEstadoUsuario(Reserva reserva, ReservaResponseDto reservaDto,
                                              Reserva.EstadoReserva nuevoEstado) {
        try {
            if (nuevoEstado == Reserva.EstadoReserva.APROBADO) {
                notificarAprobacion(reserva, reservaDto);
            } else if (nuevoEstado == Reserva.EstadoReserva.CANCELADO) {
                notificarRechazo(reserva, reservaDto);
            }
        } catch (Exception e) {
            log.error("Error al enviar email de notificación al usuario: {}", e.getMessage());
        }
    }

    private void notificarAprobacion(Reserva reserva, ReservaResponseDto reservaDto) {
        boolean emailEnviado = emailService.enviarEmailNotificacionReservaAprobada(
                reserva.getUsuario().getEmail(), reservaDto);
        if (emailEnviado) {
            log.info("Email de notificación de reserva aprobada enviado al usuario: {}",
                    reserva.getUsuario().getEmail());
        } else {
            log.warn(LOG_WARN_EMAIL_USUARIO_NO_ENVIADO, reserva.getUsuario().getEmail());
        }
        if (reservaDto.getItemsSolicitados() != null && !reservaDto.getItemsSolicitados().isEmpty()) {
            notificarMantenimientoSolicitudInventario(reservaDto);
        }
    }

    private void notificarRechazo(Reserva reserva, ReservaResponseDto reservaDto) {
        boolean emailEnviado = emailService.enviarEmailNotificacionReservaRechazada(
                reserva.getUsuario().getEmail(), reservaDto);
        if (emailEnviado) {
            log.info("Email de notificación de reserva rechazada enviado al usuario: {}",
                    reserva.getUsuario().getEmail());
        } else {
            log.warn(LOG_WARN_EMAIL_USUARIO_NO_ENVIADO, reserva.getUsuario().getEmail());
        }
    }

    private void notificarMantenimientoSolicitudInventario(ReservaResponseDto reservaDto) {
        try {
            List<Usuario> personalMantenimiento = usuarioRepository
                    .findByRolAppAndDeletedAtIsNull(Usuario.RolApp.MANTENIMIENTO);
            if (personalMantenimiento.isEmpty()) {
                log.warn("No se encontró personal de mantenimiento para notificar sobre solicitud de inventario");
                return;
            }
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
        } catch (Exception e) {
            log.error("Error al enviar email de notificación a mantenimiento: {}", e.getMessage());
            // No lanzar excepción para no interrumpir el flujo
        }
    }

    /**
     * Obtener una reserva por ID
     */
    @Transactional(readOnly = true)
    public ReservaResponseDto getReservaById(Long id, String userEmail) {
        Usuario usuario = usuarioRepository.findByEmail(userEmail)
                .orElseThrow(() -> new UsuarioNotFoundException(MSG_USUARIO_NO_ENCONTRADO + userEmail));

        Reserva reserva = reservaRepository.findByIdWithRelations(id);
        if (reserva == null) {
            throw new IllegalArgumentException("Reserva no encontrada con ID: " + id);
        }

        // Verificar que el usuario es dueño de la reserva
        if (!reserva.getUsuario().getId().equals(usuario.getId())) {
            throw new AccesoDenegadoException("No tienes permisos para ver esta reserva");
        }

        return mapToResponseDto(reserva);
    }

    /**
     * Cancelar una reserva
     */
    @Transactional
    public void cancelReserva(Long id, String userEmail) {
        log.info("Cancelando reserva ID: {} para usuario: {}", id, userEmail);

        Usuario usuario = usuarioRepository.findByEmail(userEmail)
                .orElseThrow(() -> new UsuarioNotFoundException(MSG_USUARIO_NO_ENCONTRADO + userEmail));

        Reserva reserva = reservaRepository.findById(id).orElseThrow(
                () -> new IllegalArgumentException("Reserva no encontrada con ID: " + id));

        // Verificar que el usuario es dueño de la reserva
        if (!reserva.getUsuario().getId().equals(usuario.getId())) {
            throw new AccesoDenegadoException("No tienes permisos para cancelar esta reserva");
        }

        // Si ya pasó, no se puede cancelar
        if (reserva.getInicio().isBefore(Instant.now())) {
            throw new IllegalStateException("No se puede cancelar una reserva que ya pasó");
        }

        // Si ya está cancelada
        if (reserva.getEstado() == Reserva.EstadoReserva.CANCELADO) {
            throw new IllegalStateException("La reserva ya está cancelada");
        }

        reserva.setEstado(Reserva.EstadoReserva.CANCELADO);
        reservaRepository.save(reserva);

        log.info("Reserva ID: {} cancelada exitosamente", id);

        // Cerrar las solicitudes de inventario activas asociadas (PENDIENTE/APROBADO).
        // Si la reserva se cancela, no tiene sentido seguir gestionando sus pedidos
        // de items en el panel de mantenimiento.
        try {
            reservaItemSolicitadoService.cerrarSolicitudesDeReserva(reserva.getId());
        } catch (Exception e) {
            log.warn("No se pudieron cerrar solicitudes de inventario de reserva {}: {}", id, e.getMessage());
        }

        // Invalidar caché de recomendaciones para el usuario
        try {
            recomendacionService.invalidarCacheRecomendaciones(usuario.getId());
        } catch (Exception e) {
            log.warn(LOG_ERROR_INVALIDAR_CACHE_RECOMENDACIONES, e.getMessage());
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
                    log.warn(LOG_WARN_EMAIL_ANALISTA_NO_ENVIADO,
                            reserva.getAnalistaAsignado().getEmail());
                }
            } catch (Exception e) {
                log.error(LOG_ERROR_EMAIL_ANALISTA, e.getMessage());
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
                .toList();
    }

    /**
     * Obtener todas las reservas del sistema (público, para visualización)
     * Permite filtros opcionales para visualización
     * Si el usuario es ANALISTA, solo muestra las reservas asignadas a él
     */
    @Transactional(readOnly = true)
    public List<ReservaResponseDto> getTodasLasReservas(
            ReservaFilters filters,
            String userEmail,
            String userRole) {
        Specification<Reserva> spec = buildSpecificationPublico(filters, userEmail, userRole);

        List<Reserva> reservas = reservaRepository.findAll(spec);
        boolean gestiona = ROLE_ADMIN.equals(userRole) || ROLE_ANALISTA.equals(userRole);
        return mapearLista(reservas).stream()
                .map(dto -> gestiona ? dto : sinMailAjeno(dto, userEmail))
                .sorted((a, b) -> b.getInicio().compareTo(a.getInicio()))
                .toList();
    }

    /**
     * Borra el mail del solicitante cuando no es el del que pregunta.
     *
     * Esta consulta alimenta el calendario del campus, que solo muestra el
     * nombre. Iba con el mail de cada uno: un EXTERNO leia treinta direcciones
     * -- alguna personal -- sin mas que abrir el calendario.
     */
    private ReservaResponseDto sinMailAjeno(ReservaResponseDto dto, String userEmail) {
        if (dto.getUsuarioEmail() != null && !dto.getUsuarioEmail().equals(userEmail)) {
            dto.setUsuarioEmail(null);
        }
        // Los items solicitados repiten el mail del solicitante: misma historia.
        if (dto.getItemsSolicitados() != null) {
            dto.getItemsSolicitados().stream()
                    .filter(item -> item.getSolicitanteEmail() != null
                            && !item.getSolicitanteEmail().equals(userEmail))
                    .forEach(item -> item.setSolicitanteEmail(null));
        }
        return dto;
    }

    /**
     * Igual que {@link #getTodasLasReservas}, pero paginado.
     *
     * El dashboard necesita las diez proximas y nada mas. Sin paginar, la
     * consulta publica devuelve la tabla entera: medido en produccion, 6,7 MB
     * para mostrar diez filas.
     */
    @Transactional(readOnly = true)
    public Page<ReservaResponseDto> getReservasPublicasPaged(
            Pageable pageable,
            ReservaFilters filters,
            String userEmail,
            String userRole) {
        Specification<Reserva> spec = buildSpecificationPublico(filters, userEmail, userRole);
        return reservaRepository.findAll(spec, pageable).map(this::mapToResponseDto);
    }

    /**
     * Construir Specification para filtrar reservas públicas (sin filtrar por
     * usuario). Si el usuario es ANALISTA, solo muestra las reservas asignadas
     * a él. Si es EXTERNO, solo las marcadas como públicas.
     */
    private Specification<Reserva> buildSpecificationPublico(
            ReservaFilters filters,
            String userEmail,
            String userRole) {
        return (root, query, cb) -> {
            // Espacio, usuario y compañía son LAZY: sin traerlos en el mismo
            // select, armar el DTO de cada fila dispara sus propias consultas.
            // El count de una paginación no admite fetch, de ahí el chequeo.
            if (query != null && !Long.class.equals(query.getResultType())) {
                root.fetch(FIELD_ESPACIO, jakarta.persistence.criteria.JoinType.LEFT)
                        .fetch("tipoEspacio", jakarta.persistence.criteria.JoinType.LEFT);
                root.fetch(FIELD_USUARIO, jakarta.persistence.criteria.JoinType.LEFT);
                root.fetch("carrera", jakarta.persistence.criteria.JoinType.LEFT);
                root.fetch(FIELD_ANALISTA_ASIGNADO, jakarta.persistence.criteria.JoinType.LEFT);
            }

            List<Predicate> predicates = new ArrayList<>();

            if (ROLE_EXTERNO.equals(userRole)) {
                predicates.add(cb.equal(root.get("esPublica"), true));
                log.debug("Filtrando solo reservas públicas para usuario externo: {}", userEmail);
            }

            addAnalistaScopePredicate(predicates, root, cb, userEmail, userRole);
            appendCommonFilters(predicates, root, cb, filters);
            query.orderBy(cb.desc(root.get(FIELD_INICIO)));
            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }

    /**
     * Obtener estadísticas personales de reservas del usuario
     */
    @Transactional(readOnly = true)
    public ReservaStatsDto obtenerEstadisticasPersonales(String userEmail) {
        log.info("Generando estadísticas personales de reservas para usuario: {}", userEmail);

        Usuario usuario = usuarioRepository.findByEmail(userEmail)
                .orElseThrow(() -> new UsuarioNotFoundException(MSG_USUARIO_NO_ENCONTRADO + userEmail));

        return reservaEstadisticasService.calcular(usuario.getId());
    }

    public ReservaStatsDto obtenerEstadisticasGlobales() {
        log.info("Generando estadísticas globales de reservas");
        return reservaEstadisticasService.calcular(null);
    }


    /**
     * Mapear entidad Reserva a DTO de respuesta
     */
    /**
     * Mapea una lista de reservas trayendo los items solicitados de una sola vez.
     *
     * Mapeadas de a una, cada reserva preguntaba por sus items: el calendario de
     * un mes son casi 1.600 consultas, y tardaba trece segundos.
     */
    private List<ReservaResponseDto> mapearLista(List<Reserva> reservas) {
        if (reservas.isEmpty()) {
            return List.of();
        }
        Map<Long, List<ReservaItemSolicitadoResponseDto>> itemsPorReserva =
                reservaItemSolicitadoService.obtenerPorReservas(reservas.stream().map(Reserva::getId).toList());

        return reservas.stream()
                .map(reserva -> {
                    ReservaResponseDto dto = mapToResponseDto(reserva, false);
                    dto.setItemsSolicitados(itemsPorReserva.get(reserva.getId()));
                    return dto;
                })
                .toList();
    }

    public ReservaResponseDto mapToResponseDto(Reserva reserva) {
        return mapToResponseDto(reserva, true);
    }

    /** @param conItems false cuando el llamador ya los trae en lote. */
    private ReservaResponseDto mapToResponseDto(Reserva reserva, boolean conItems) {
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
        if (conItems && reserva.getItemsSolicitados() != null && !reserva.getItemsSolicitados().isEmpty()) {
            dto.setItemsSolicitados(reservaItemSolicitadoService.obtenerPorReserva(reserva.getId()));
        }
        dto.setCreatedAt(reserva.getCreatedAt());
        dto.setUpdatedAt(reserva.getUpdatedAt());
        return dto;
    }
}
