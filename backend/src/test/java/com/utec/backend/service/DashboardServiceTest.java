package com.utec.backend.service;

import com.utec.backend.dto.dashboard.DashboardDto;
import com.utec.backend.dto.reserva.ReservaResponseDto;
import com.utec.backend.dto.reserva.ReservaStatsDto;
import com.utec.backend.dto.stats.ActiveUsersStatsDTO;
import com.utec.backend.dto.usuario.UsuarioStatsDto;
import com.utec.backend.model.ReservaItemSolicitado;
import com.utec.backend.model.Usuario;
import com.utec.backend.repository.ReservaItemSolicitadoRepository;
import com.utec.backend.repository.ReservaRepository;
import com.utec.backend.repository.UsuarioRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("DashboardService")
class DashboardServiceTest {

    @Mock private ReservaService reservaService;
    @Mock private ReservaEstadisticasService reservaEstadisticasService;
    @Mock private ReservaRepository reservaRepository;
    @Mock private ReservaItemSolicitadoRepository solicitudRepository;
    @Mock private EspacioService espacioService;
    @Mock private UsuarioService usuarioService;
    @Mock private UsuarioRepository usuarioRepository;
    @Mock private InventarioItemService inventarioItemService;
    @Mock private UserActivityTrackingService activityTrackingService;

    @InjectMocks private DashboardService service;

    private static final String EMAIL = "alguien@utec.edu.uy";

    @BeforeEach
    void setUp() {
        when(espacioService.getTotalEspacios()).thenReturn(10L);
        when(espacioService.countByEstado("DISPONIBLE")).thenReturn(7L);
        when(espacioService.countByEstado("MANTENIMIENTO")).thenReturn(1L);
        when(espacioService.getCapacidadPromedio()).thenReturn(30.0);
        when(reservaRepository.countByInicioBetween(any(), any())).thenReturn(4L);

        when(reservaEstadisticasService.calcular(any())).thenReturn(stats());
        when(reservaService.getReservasPublicasPaged(any(), any(), anyString(), anyString()))
                .thenReturn(pagina());
        when(reservaService.getAllReservasPaged(any(), any(), anyString(), anyString()))
                .thenReturn(pagina());
        when(reservaService.getReservasByUsuarioPaged(anyString(), any(), any()))
                .thenReturn(pagina());

        Usuario usuario = new Usuario();
        usuario.setId(3L);
        when(usuarioRepository.findByEmail(EMAIL)).thenReturn(Optional.of(usuario));

        when(usuarioService.obtenerEstadisticas())
                .thenReturn(new UsuarioStatsDto(100L, 90L, 10L, 80L, 20L, Map.of(), Map.of()));
        ActiveUsersStatsDTO activos = new ActiveUsersStatsDTO();
        activos.setTotalActiveUsers(5);
        when(activityTrackingService.getActiveUsers()).thenReturn(activos);
        when(inventarioItemService.getInventarioStatistics()).thenReturn(Map.of("danados", 2L));
        when(solicitudRepository.countByEstado(ReservaItemSolicitado.EstadoSolicitud.PENDIENTE)).thenReturn(6L);
    }

    private ReservaStatsDto stats() {
        ReservaStatsDto dto = new ReservaStatsDto();
        dto.setTotalReservas(50L);
        dto.setTotalAprobadas(30L);
        dto.setTotalPendientes(15L);
        dto.setTotalCanceladas(5L);
        return dto;
    }

    private Page<ReservaResponseDto> pagina() {
        ReservaResponseDto reserva = new ReservaResponseDto();
        reserva.setId(1L);
        return new PageImpl<>(List.of(reserva), Pageable.unpaged(), 1);
    }

    @Test
    @DisplayName("el admin recibe usuarios, inventario y la cola de pendientes")
    void admin() {
        DashboardDto dto = service.cargar(EMAIL, Usuario.RolApp.ADMIN.name());

        assertEquals(50L, dto.stats().totalReservas());
        assertEquals(4L, dto.stats().reservasHoy());
        assertEquals(100L, dto.stats().totalUsuarios());
        assertEquals(5L, dto.stats().usuariosActivos());
        assertEquals(6L, dto.solicitudesInventarioPendientes());
        assertNotNull(dto.userStats());
        assertNotNull(dto.inventarioStats());
        assertTrue(dto.misReservas().isEmpty());
        assertEquals(1, dto.reservasPendientes().size());
        // Quien aprueba mira todo el sistema: el agregado va sin usuario.
        verify(reservaEstadisticasService).calcular(isNull());
    }

    @Test
    @DisplayName("el analista no recibe metricas de usuarios ni de inventario")
    void analista() {
        DashboardDto dto = service.cargar(EMAIL, Usuario.RolApp.ANALISTA.name());

        assertNull(dto.userStats());
        assertNull(dto.inventarioStats());
        assertEquals(0L, dto.stats().usuariosActivos());
        assertEquals(1, dto.reservasPendientes().size());
    }

    @Test
    @DisplayName("un docente ve sus propios numeros, no los del sistema")
    void docente() {
        DashboardDto dto = service.cargar(EMAIL, Usuario.RolApp.DOCENTE.name());

        verify(reservaEstadisticasService).calcular(eq(3L));
        assertEquals(1, dto.misReservas().size());
        assertTrue(dto.reservasPendientes().isEmpty());
        assertNull(dto.userStats());
    }

    @Test
    @DisplayName("mantenimiento no gasta en el agregado de reservas")
    void mantenimiento() {
        DashboardDto dto = service.cargar(EMAIL, Usuario.RolApp.MANTENIMIENTO.name());

        verify(reservaEstadisticasService, never()).calcular(any());
        assertNull(dto.reservaStats());
        assertEquals(0L, dto.stats().totalReservas());
        assertEquals(0L, dto.stats().reservasHoy());
        assertEquals(6L, dto.solicitudesInventarioPendientes());
        assertNotNull(dto.inventarioStats());
        assertEquals(7L, dto.stats().espaciosDisponibles());
    }

    @Test
    @DisplayName("los espacios ocupados salen de restar, y nunca dan negativo")
    void espacios() {
        when(espacioService.getTotalEspacios()).thenReturn(2L);
        when(espacioService.countByEstado("DISPONIBLE")).thenReturn(5L);

        DashboardDto dto = service.cargar(EMAIL, Usuario.RolApp.ESTUDIANTE.name());

        assertEquals(0L, dto.stats().espaciosOcupados());
    }

    @Test
    @DisplayName("sin usuario conocido no se devuelven los numeros de otro")
    void usuarioDesconocido() {
        when(usuarioRepository.findByEmail(anyString())).thenReturn(Optional.empty());

        DashboardDto dto = service.cargar("nadie@utec.edu.uy", Usuario.RolApp.ESTUDIANTE.name());

        verify(reservaEstadisticasService, never()).calcular(any());
        assertNull(dto.reservaStats());
        assertEquals(0L, dto.stats().totalReservas());
    }
}
