package com.utec.backend.service;

import com.utec.backend.dto.dashboard.DashboardDto;
import com.utec.backend.dto.reserva.ReservaFilters;
import com.utec.backend.dto.reserva.ReservaResponseDto;
import com.utec.backend.dto.reserva.ReservaStatsDto;
import com.utec.backend.dto.usuario.UsuarioStatsDto;
import com.utec.backend.model.ReservaItemSolicitado;
import com.utec.backend.model.Usuario;
import com.utec.backend.repository.ReservaItemSolicitadoRepository;
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
import java.util.List;
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

        return new DashboardDto(
                stats(reservaStats, esMantenimiento, userStats, usuariosActivos),
                proximas,
                mias,
                pendientes,
                reservaStats,
                userStats,
                inventarioStats,
                solicitudesPendientes
        );
    }

    private DashboardDto.Stats stats(ReservaStatsDto reservas,
                                     boolean esMantenimiento,
                                     UsuarioStatsDto usuarios,
                                     long usuariosActivos) {
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
                porEspacio
        );
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
