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
    @Mock private MateriaService materiaService;
    @Mock private TutoriaService tutoriaService;
    @Mock private EventoService eventoService;
    @Mock private com.utec.backend.repository.EspacioRepository espacioRepository;
    @Mock private RecomendacionService recomendacionService;
    @Mock private AuditService auditService;
    @Mock private SostenibilidadService sostenibilidadService;
    @Mock private org.springframework.boot.actuate.health.HealthEndpoint healthEndpoint;

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

        when(materiaService.getMateriasQueDicta(anyString())).thenReturn(List.of());
        when(materiaService.getMateriasQueCursa(anyString())).thenReturn(List.of());
        when(tutoriaService.tutoriasQueDicta(anyString())).thenReturn(List.of());
        when(tutoriaService.tutoriasAgendadas(anyString())).thenReturn(List.of());
        when(tutoriaService.racha(anyString()))
                .thenReturn(new com.utec.backend.dto.tutoria.RachaDto(0, 0, 0, List.of()));
        when(eventoService.listar(anyString(), anyString())).thenReturn(List.of());
        when(eventoService.misInscripciones(anyString())).thenReturn(List.of());
        when(recomendacionService.obtenerItemsMantenimientoUrgente()).thenReturn(List.of());
        when(espacioRepository.findAll()).thenReturn(List.of());
        when(reservaRepository.contarPendientesPorEspacio(any())).thenReturn(List.of());
        when(reservaRepository.contarResueltasPorAnalista(any())).thenReturn(0L);
        when(auditService.buscarLogs(any(), any(), any(), any(), any(), any(), any()))
                .thenReturn(paginaVacia());
    }

    private com.utec.backend.dto.common.PagedResponseDto<com.utec.backend.dto.audit.AuditLogResponseDto> paginaVacia() {
        var pagina = new com.utec.backend.dto.common.PagedResponseDto<com.utec.backend.dto.audit.AuditLogResponseDto>();
        pagina.setContent(List.of());
        return pagina;
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

    @Test
    @DisplayName("el docente recibe sus materias, sus tutorias y cuantos inscriptos suman")
    void docenteRecibeLoAcademico() {
        com.utec.backend.dto.materia.MateriaResponseDto materia = new com.utec.backend.dto.materia.MateriaResponseDto();
        materia.setId(4L);
        materia.setNombre("Matemática I");
        materia.setCreditos(8);
        materia.setTotalInscriptos(23L);
        when(materiaService.getMateriasQueDicta(EMAIL)).thenReturn(List.of(materia));

        com.utec.backend.dto.tutoria.TutoriaResponseDto tutoria = new com.utec.backend.dto.tutoria.TutoriaResponseDto();
        tutoria.setId(9L);
        tutoria.setMateriaNombre("Matemática I");
        tutoria.setInicio(java.time.Instant.now().plusSeconds(3600));
        tutoria.setFin(java.time.Instant.now().plusSeconds(7200));
        tutoria.setCupo(10);
        tutoria.setPlazasDisponibles(4);
        when(tutoriaService.tutoriasQueDicta(EMAIL)).thenReturn(List.of(tutoria));

        DashboardDto dto = service.cargar(EMAIL, Usuario.RolApp.DOCENTE.name());

        assertEquals(1, dto.misMaterias().size());
        assertEquals(23L, dto.stats().inscriptos());
        assertEquals(8L, dto.stats().creditos());
        assertEquals(1, dto.misTutorias().size());
        // Cupo 10 con 4 libres: seis agendados.
        assertEquals(6L, dto.misTutorias().get(0).agendados());
    }

    @Test
    @DisplayName("las tutorias que ya pasaron no se listan")
    void tutoriasPasadasFuera() {
        com.utec.backend.dto.tutoria.TutoriaResponseDto vieja = new com.utec.backend.dto.tutoria.TutoriaResponseDto();
        vieja.setId(1L);
        vieja.setInicio(java.time.Instant.now().minusSeconds(7200));
        vieja.setFin(java.time.Instant.now().minusSeconds(3600));
        when(tutoriaService.tutoriasAgendadas(EMAIL)).thenReturn(List.of(vieja));

        DashboardDto dto = service.cargar(EMAIL, Usuario.RolApp.ESTUDIANTE.name());

        assertTrue(dto.misTutorias().isEmpty());
    }

    @Test
    @DisplayName("mantenimiento recibe los espacios que no estan operativos")
    void mantenimientoRecibeEspaciosCaidos() {
        com.utec.backend.model.Espacio caido = new com.utec.backend.model.Espacio();
        caido.setId(3L);
        caido.setNombre("Aula 9");
        caido.setEstado("MANTENIMIENTO");
        com.utec.backend.model.Espacio ok = new com.utec.backend.model.Espacio();
        ok.setId(4L);
        ok.setNombre("Aula 1");
        ok.setEstado("DISPONIBLE");
        when(espacioRepository.findAll()).thenReturn(List.of(caido, ok));

        DashboardDto dto = service.cargar(EMAIL, Usuario.RolApp.MANTENIMIENTO.name());

        assertEquals(1, dto.espaciosFueraDeServicio().size());
        assertEquals("Aula 9", dto.espaciosFueraDeServicio().get(0).nombre());
    }

    @Test
    @DisplayName("un ESTUDIANTE no recibe los bloques de quien administra")
    void estudianteSinBloquesDeAdmin() {
        DashboardDto dto = service.cargar(EMAIL, Usuario.RolApp.ESTUDIANTE.name());

        assertNull(dto.salud());
        assertNull(dto.sostenibilidad());
        assertTrue(dto.actividadReciente().isEmpty());
        assertTrue(dto.inventarioAtencion().isEmpty());
        assertTrue(dto.espaciosConPresion().isEmpty());
    }

    @Test
    @DisplayName("el analista ve donde se le acumula la cola y cuantas resolvio")
    void analistaVeLaPresion() {
        when(reservaRepository.contarPendientesPorEspacio(any()))
                .thenReturn(List.<Object[]>of(new Object[]{7L, "Aula 5", 42L}));
        when(reservaRepository.contarResueltasPorAnalista(3L)).thenReturn(88L);

        DashboardDto dto = service.cargar(EMAIL, Usuario.RolApp.ANALISTA.name());

        assertEquals(1, dto.espaciosConPresion().size());
        assertEquals(42L, dto.espaciosConPresion().get(0).pendientes());
        assertEquals(88L, dto.stats().resueltasPorMi());
    }

    // La tarjeta dice cuantas materias cursa, no cuantas entran en el panel.
    @Test
    @DisplayName("el contador cuenta todas las materias, aunque la lista se recorte")
    void contadorCuentaElTotal() {
        List<com.utec.backend.dto.materia.MateriaResponseDto> muchas = new java.util.ArrayList<>();
        for (int i = 0; i < 20; i++) {
            var m = new com.utec.backend.dto.materia.MateriaResponseDto();
            m.setId((long) i);
            m.setNombre("Materia " + i);
            m.setCreditos(4);
            m.setSemestre(1 + (i % 4));
            muchas.add(m);
        }
        when(materiaService.getMateriasQueCursa(EMAIL)).thenReturn(muchas);

        DashboardDto dto = service.cargar(EMAIL, Usuario.RolApp.ESTUDIANTE.name());

        assertEquals(20L, dto.stats().materias(), "cuenta las veinte");
        // El grafico suma las veinte, no las seis que entran en el panel.
        assertEquals(80L, dto.creditosPorSemestre().stream().mapToLong(x -> x.valor()).sum());
        assertEquals(80L, dto.stats().creditos(), "y suma los creditos de las veinte");
        assertEquals(6, dto.misMaterias().size(), "pero solo lista una pantalla");
    }
}
