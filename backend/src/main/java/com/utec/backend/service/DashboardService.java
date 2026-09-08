package com.utec.backend.service;

import com.utec.backend.dto.dashboard.DashboardDto;
import com.utec.backend.dto.evento.EventoResponseDto;
import com.utec.backend.dto.materia.MateriaResponseDto;
import com.utec.backend.dto.tutoria.TutoriaResponseDto;
import com.utec.backend.dto.reserva.ReservaFilters;
import com.utec.backend.dto.reserva.ReservaResponseDto;
import com.utec.backend.dto.reserva.ReservaStatsDto;
import com.utec.backend.dto.usuario.UsuarioStatsDto;
import com.utec.backend.model.ReservaItemSolicitado;
import com.utec.backend.model.Usuario;
import com.utec.backend.repository.ReservaItemSolicitadoRepository;
import com.utec.backend.repository.EspacioRepository;
import com.utec.backend.repository.ReservaRepository;
import com.utec.backend.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.Comparator;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.Map;

/**
 * Arma la pantalla de inicio de un solo golpe.
 *
 * Lo que trae depende del rol, y por eso vive en el backend y no en el cliente:
 * el rol ya decide aca que puede ver cada uno, en vez de que el frontend pida
 * seis endpoints distintos y cada uno vuelva a resolver el permiso.
 *
 * Todo corre en una transaccion de solo lectura, o sea una sola conexion. Las
 * doce llamadas paralelas que hacia el frontend competian por un pool de diez.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class DashboardService {

    /** Cuantas reservas proximas muestra la pantalla. */
    private static final int PROXIMAS = 10;
    /** Cuantas filas de la cola de pendientes se precargan. */
    private static final int COLA_PENDIENTES = 30;
    /** Cuantas reservas propias necesita el resumen del usuario. */
    private static final int MIS_RESERVAS = 50;

    /** Zona en la que se decide que es "hoy" para el campus. */
    private static final ZoneId ZONA = ZoneId.of("America/Montevideo");

    private final ReservaService reservaService;
    private final ReservaEstadisticasService reservaEstadisticasService;
    private final ReservaRepository reservaRepository;
    private final ReservaItemSolicitadoRepository solicitudRepository;
    private final EspacioService espacioService;
    private final UsuarioService usuarioService;
    private final UsuarioRepository usuarioRepository;
    private final InventarioItemService inventarioItemService;
    private final UserActivityTrackingService activityTrackingService;
    private final MateriaService materiaService;
    private final TutoriaService tutoriaService;
    private final EventoService eventoService;
    private final EspacioRepository espacioRepository;
    private final RecomendacionService recomendacionService;
    private final AuditService auditService;
    private final SostenibilidadService sostenibilidadService;
    private final org.springframework.boot.actuate.health.HealthEndpoint healthEndpoint;

    @Transactional(readOnly = true)
    public DashboardDto cargar(String email, String rol) {
        boolean aprueba = esAprobador(rol);
        boolean administraInventario = Usuario.RolApp.MANTENIMIENTO.name().equals(rol)
                || Usuario.RolApp.ADMIN.name().equals(rol);
        boolean esMantenimiento = Usuario.RolApp.MANTENIMIENTO.name().equals(rol);

        // Global para quien aprueba, propio para quien reserva. Mantenimiento no
        // mira reservas: se ahorra el agregado entero.
        ReservaStatsDto reservaStats = null;
        if (!esMantenimiento) {
            Long usuarioId = aprueba ? null : idDeUsuario(email);
            // Sin id no se puede acotar a un usuario, y calcular(null) devolveria
            // las de todo el sistema: preferimos no mostrar numeros a mostrar
            // los de otros.
            if (aprueba || usuarioId != null) {
                reservaStats = reservaEstadisticasService.calcular(usuarioId);
            }
        }

        List<ReservaResponseDto> proximas = esMantenimiento ? List.of() : proximasDelCampus(email, rol);
        List<ReservaResponseDto> mias = (!aprueba && !esMantenimiento) ? misUltimasReservas(email) : List.of();
        List<ReservaResponseDto> pendientes = aprueba ? colaPendiente(email, rol) : List.of();

        UsuarioStatsDto userStats = Usuario.RolApp.ADMIN.name().equals(rol)
                ? usuarioService.obtenerEstadisticas()
                : null;
        long usuariosActivos = Usuario.RolApp.ADMIN.name().equals(rol)
                ? activityTrackingService.getActiveUsers().getTotalActiveUsers()
                : 0L;

        Map<String, Object> inventarioStats = administraInventario
                ? inventarioItemService.getInventarioStatistics()
                : null;
        long solicitudesPendientes = administraInventario
                ? solicitudRepository.countByEstado(ReservaItemSolicitado.EstadoSolicitud.PENDIENTE)
                : 0L;

        boolean esAdmin = Usuario.RolApp.ADMIN.name().equals(rol);
        boolean esDocente = Usuario.RolApp.DOCENTE.name().equals(rol);
        boolean esEstudiante = Usuario.RolApp.ESTUDIANTE.name().equals(rol);

        // Cada rol suma lo suyo. Un bloque que no le toca viaja vacio, no null:
        // la pantalla no tiene que preguntar dos cosas para dibujar una lista.
        List<DashboardDto.MateriaBreve> misMaterias = List.of();
        List<DashboardDto.TutoriaBreve> misTutorias = List.of();
        long creditos = 0;
        long inscriptos = 0;
        long racha = 0;
        if (esDocente) {
            misMaterias = materiasBreves(materiaService.getMateriasQueDicta(email));
            misTutorias = tutoriasBreves(tutoriaService.tutoriasQueDicta(email));
            inscriptos = misMaterias.stream().mapToLong(m -> m.inscriptos() == null ? 0 : m.inscriptos()).sum();
        } else if (esEstudiante) {
            misMaterias = materiasBreves(materiaService.getMateriasQueCursa(email));
            misTutorias = tutoriasBreves(tutoriaService.tutoriasAgendadas(email));
            racha = tutoriaService.racha(email).rachaActual();
        }
        creditos = misMaterias.stream().mapToLong(m -> m.creditos() == null ? 0 : m.creditos()).sum();

        List<DashboardDto.EventoBreve> eventos = veEventos(rol) ? eventosProximos(email, rol) : List.of();

        List<DashboardDto.ItemAtencion> inventarioAtencion = List.of();
        List<DashboardDto.EspacioBreve> fueraDeServicio = List.of();
        if (administraInventario) {
            inventarioAtencion = itemsQuePidenAtencion();
            fueraDeServicio = espaciosFueraDeServicio();
        }

        List<DashboardDto.Actividad> actividad = esAdmin ? ultimaActividad() : List.of();
        DashboardDto.Salud salud = esAdmin ? saludDelSistema() : null;
        DashboardDto.Sostenibilidad sostenibilidad =
                (esAdmin || esMantenimiento) ? impactoAmbiental() : null;
        List<DashboardDto.EspacioPresion> presion = aprueba ? espaciosConPresion() : List.of();
        long resueltas = aprueba ? resueltasPor(email) : 0;

        DashboardDto.Stats stats = stats(reservaStats, esMantenimiento, userStats, usuariosActivos,
                misMaterias.size(), creditos, inscriptos, misTutorias.size(), racha, resueltas, eventos.size());

        return new DashboardDto(
                stats,
                proximas,
                mias,
                pendientes,
                reservaStats,
                userStats,
                inventarioStats,
                solicitudesPendientes,
                misMaterias,
                misTutorias,
                eventos,
                inventarioAtencion,
                fueraDeServicio,
                actividad,
                salud,
                sostenibilidad,
                presion
        );
    }

    private DashboardDto.Stats stats(ReservaStatsDto reservas,
                                     boolean esMantenimiento,
                                     UsuarioStatsDto usuarios,
                                     long usuariosActivos,
                                     long materias,
                                     long creditos,
                                     long inscriptos,
                                     long tutorias,
                                     long racha,
                                     long resueltasPorMi,
                                     long eventosProximos) {
        long totalEspacios = valor(espacioService.getTotalEspacios());
        long disponibles = valor(espacioService.countByEstado("DISPONIBLE"));
        long enMantenimiento = valor(espacioService.countByEstado("MANTENIMIENTO"));
        Double capacidad = espacioService.getCapacidadPromedio();

        long aprobadas = reservas != null ? reservas.getTotalAprobadas() : 0L;
        double porEspacio = totalEspacios > 0
                ? Math.round((aprobadas / (double) totalEspacios) * 10) / 10.0
                : 0.0;

        return new DashboardDto.Stats(
                reservas != null ? reservas.getTotalReservas() : 0L,
                esMantenimiento ? 0L : reservasDeHoy(),
                reservas != null ? reservas.getTotalPendientes() : 0L,
                aprobadas,
                reservas != null ? reservas.getTotalCanceladas() : 0L,
                totalEspacios,
                disponibles,
                Math.max(0, totalEspacios - disponibles - enMantenimiento),
                enMantenimiento,
                capacidad != null ? capacidad : 0.0,
                usuarios != null ? valor(usuarios.getTotalUsuarios()) : 0L,
                usuariosActivos,
                0L,
                porEspacio,
                materias,
                creditos,
                inscriptos,
                tutorias,
                racha,
                resueltasPorMi,
                eventosProximos
        );
    }

    /** Cuantas materias y tutorias se listan: una pantalla, no un listado. */
    private static final int FILAS = 6;

    private List<DashboardDto.MateriaBreve> materiasBreves(List<MateriaResponseDto> materias) {
        return materias.stream()
                .limit(FILAS)
                .map(m -> new DashboardDto.MateriaBreve(m.getId(), m.getNombre(), m.getCodigo(),
                        m.getCreditos(), m.getTotalInscriptos(), m.getDocenteNombre()))
                .toList();
    }

    /** Las tutorias que todavia no pasaron, de la mas proxima a la mas lejana. */
    private List<DashboardDto.TutoriaBreve> tutoriasBreves(List<TutoriaResponseDto> tutorias) {
        Instant ahora = Instant.now();
        return tutorias.stream()
                .filter(t -> t.getFin() != null && t.getFin().isAfter(ahora))
                .sorted(Comparator.comparing(TutoriaResponseDto::getInicio))
                .limit(FILAS)
                .map(t -> {
                    int cupo = t.getCupo() == null ? 0 : t.getCupo();
                    int libres = t.getPlazasDisponibles() == null ? cupo : t.getPlazasDisponibles();
                    return new DashboardDto.TutoriaBreve(t.getId(), t.getMateriaId(), t.getMateriaNombre(),
                            t.getInicio(), t.getFin(), t.getEspacioNombre(), t.getDocenteNombre(),
                            Math.max(0, cupo - libres), cupo);
                })
                .toList();
    }

    /** Todos los roles ven eventos menos el que solo administra infraestructura. */
    private boolean veEventos(String rol) {
        return !Usuario.RolApp.MANTENIMIENTO.name().equals(rol);
    }

    private List<DashboardDto.EventoBreve> eventosProximos(String email, String rol) {
        Instant ahora = Instant.now();
        Set<Long> mios = eventoService.misInscripciones(email).stream()
                .map(EventoResponseDto::getId)
                .collect(Collectors.toSet());
        return eventoService.listar(email, rol).stream()
                .filter(e -> e.getInicio() != null && e.getInicio().isAfter(ahora))
                .sorted(Comparator.comparing(EventoResponseDto::getInicio))
                .limit(FILAS)
                .map(e -> new DashboardDto.EventoBreve(e.getId(), e.getTitulo(), e.getInicio(),
                        e.getEspacioNombre(), e.getInscriptosCount(), e.getCupo(), mios.contains(e.getId())))
                .toList();
    }

    /**
     * Los items que piden reparacion, con el motivo que ya redacta el
     * recomendador y la urgencia en porcentaje.
     */
    private List<DashboardDto.ItemAtencion> itemsQuePidenAtencion() {
        return recomendacionService.obtenerItemsMantenimientoUrgente().stream()
                .limit(FILAS)
                .map(r -> new DashboardDto.ItemAtencion(
                        r.getInventarioItemId() != null ? r.getInventarioItemId() : r.getId(),
                        r.getTipoElementoNombre() != null ? r.getTipoElementoNombre() : "Item",
                        r.getRazon(),
                        r.getPuntaje() == null ? 0 : (int) Math.round(r.getPuntaje().doubleValue() * 100)))
                .toList();
    }

    private List<DashboardDto.EspacioBreve> espaciosFueraDeServicio() {
        return espacioRepository.findAll().stream()
                .filter(e -> e.getEstado() != null && !"DISPONIBLE".equals(e.getEstado()))
                .limit(FILAS)
                .map(e -> new DashboardDto.EspacioBreve(e.getId(), e.getNombre(), e.getEstado(),
                        e.getEdificio() != null ? e.getEdificio().getNombre() : null))
                .toList();
    }

    /** Los ultimos movimientos del registro de auditoria. */
    private List<DashboardDto.Actividad> ultimaActividad() {
        return auditService.buscarLogs(null, null, null, null, null, null,
                        PageRequest.of(0, FILAS)).getContent().stream()
                .map(l -> new DashboardDto.Actividad(l.getTimestamp(),
                        l.getUsuarioNombre() != null ? l.getUsuarioNombre() : l.getUsuarioEmail(),
                        l.getAccion() == null ? null : l.getAccion().name(), l.getEntidad()))
                .toList();
    }

    /**
     * Estado de los componentes, del mismo actuator que muestra la pantalla de
     * Sistema. Si falla, se informa desconocido en vez de tumbar el dashboard.
     */
    private DashboardDto.Salud saludDelSistema() {
        try {
            var componente = healthEndpoint.health();
            if (componente instanceof org.springframework.boot.actuate.health.CompositeHealth compuesto) {
                Map<String, org.springframework.boot.actuate.health.HealthComponent> partes = compuesto.getComponents();
                List<String> caidos = partes.entrySet().stream()
                        .filter(e -> !"UP".equals(e.getValue().getStatus().getCode()))
                        .map(Map.Entry::getKey)
                        .toList();
                return new DashboardDto.Salud(compuesto.getStatus().getCode(), partes.size(), caidos);
            }
            return new DashboardDto.Salud(componente.getStatus().getCode(), 0, List.of());
        } catch (Exception e) {
            log.warn("No se pudo leer la salud del sistema: {}", e.getMessage());
            return new DashboardDto.Salud("UNKNOWN", 0, List.of());
        }
    }

    private DashboardDto.Sostenibilidad impactoAmbiental() {
        try {
            var stats = sostenibilidadService.getStats();
            return new DashboardDto.Sostenibilidad(stats.getHojasEvitadas(),
                    stats.getArbolesSalvados(), stats.getCo2EvitadoKg());
        } catch (Exception e) {
            log.warn("No se pudo calcular el impacto ambiental: {}", e.getMessage());
            return null;
        }
    }

    /** Donde se acumula la cola: los espacios con mas solicitudes esperando. */
    private List<DashboardDto.EspacioPresion> espaciosConPresion() {
        return reservaRepository.contarPendientesPorEspacio(PageRequest.of(0, 5)).stream()
                .map(f -> new DashboardDto.EspacioPresion(
                        ((Number) f[0]).longValue(), (String) f[1], ((Number) f[2]).longValue()))
                .toList();
    }

    /** Cuantas solicitudes resolvio este analista. */
    private long resueltasPor(String email) {
        Long id = idDeUsuario(email);
        return id == null ? 0 : reservaRepository.contarResueltasPorAnalista(id);
    }

    /** Reservas que empiezan hoy en todo el campus: es un contador, no una lista. */
    private long reservasDeHoy() {
        LocalDate hoy = LocalDate.now(ZONA);
        Instant desde = hoy.atStartOfDay(ZONA).toInstant();
        Instant hasta = hoy.plusDays(1).atStartOfDay(ZONA).toInstant();
        return reservaRepository.countByInicioBetween(desde, hasta);
    }

    /**
     * Las proximas aprobadas que el usuario puede ver. Va por la consulta
     * publica porque es la unica que oculta las reservas privadas a un EXTERNO.
     */
    private List<ReservaResponseDto> proximasDelCampus(String email, String rol) {
        ReservaFilters filtros = ReservaFilters.of("APROBADO", null, null, null, null, null, "futuras");
        return reservaService.getReservasPublicasPaged(
                PageRequest.of(0, PROXIMAS, Sort.by(Sort.Direction.ASC, "inicio")),
                filtros, email, rol).getContent();
    }

    private List<ReservaResponseDto> misUltimasReservas(String email) {
        ReservaFilters filtros = ReservaFilters.of(null, null, null, null, null, null, null);
        return reservaService.getReservasByUsuarioPaged(email,
                PageRequest.of(0, MIS_RESERVAS, Sort.by(Sort.Direction.DESC, "inicio")),
                filtros).getContent();
    }

    private List<ReservaResponseDto> colaPendiente(String email, String rol) {
        ReservaFilters filtros = ReservaFilters.of("PENDIENTE", null, null, null, null, null, null);
        return reservaService.getAllReservasPaged(
                PageRequest.of(0, COLA_PENDIENTES, Sort.by(Sort.Direction.DESC, "inicio")),
                filtros, email, rol).getContent();
    }

    private boolean esAprobador(String rol) {
        return Usuario.RolApp.ADMIN.name().equals(rol) || Usuario.RolApp.ANALISTA.name().equals(rol);
    }

    private Long idDeUsuario(String email) {
        return usuarioRepository.findByEmail(email).map(Usuario::getId).orElse(null);
    }

    private long valor(Long numero) {
        return numero != null ? numero : 0L;
    }
}
