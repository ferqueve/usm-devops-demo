package com.utec.backend.service;

import com.utec.backend.dto.reserva.ReservaCreateDto;
import com.utec.backend.dto.reserva.ReservaResponseDto;
import com.utec.backend.model.Carrera;
import com.utec.backend.model.Espacio;
import com.utec.backend.model.Reserva;
import com.utec.backend.model.Usuario;
import com.utec.backend.repository.CarreraRepository;
import com.utec.backend.repository.EspacioRepository;
import com.utec.backend.repository.ReservaRepository;
import com.utec.backend.repository.UsuarioRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentMatchers;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static com.utec.backend.security.Constants.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Tests extendidos para ReservaService
 * Cobertura de casos críticos: roles, permisos, recurrencia, conflictos
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("Tests extendidos para ReservaService - Roles, Permisos y Conflictos")
class ReservaServiceExtendedTest {

    @Mock
    private ReservaRepository reservaRepository;

    @Mock
    private EspacioRepository espacioRepository;

    @Mock
    private UsuarioRepository usuarioRepository;

    @Mock
    private CarreraRepository carreraRepository;

    @Mock
    private ReservaItemSolicitadoService reservaItemSolicitadoService;

    @Mock
    private EmailService emailService;

    @Mock
    private RecomendacionService recomendacionService;

    @Mock
    private FileStorageService fileStorageService;

    @InjectMocks
    private ReservaService reservaService;

    private Espacio espacioTest;
    private Usuario usuarioDocente;
    private Usuario usuarioExterno;
    private Usuario usuarioAnalista1;
    private Usuario usuarioAnalista2;
    private Usuario usuarioAdmin;
    private Carrera carreraActiva;
    private Carrera carreraEliminada;
    private final Long espacioId = 1L;
    private final Instant inicioFuturo = Instant.now().plus(1, ChronoUnit.DAYS);
    private final Instant finFuturo = inicioFuturo.plus(1, ChronoUnit.HOURS);

    @BeforeEach
    void setUp() {
        // Setup Espacio
        espacioTest = new Espacio();
        espacioTest.setId(espacioId);
        espacioTest.setNombre("Aula 101");
        espacioTest.setCapacidad(30);
        espacioTest.setEstado("DISPONIBLE");
        espacioTest.setTipoEspacioId(1L);

        // Setup Usuarios con diferentes roles
        usuarioDocente = new Usuario();
        usuarioDocente.setId(1L);
        usuarioDocente.setEmail("docente@utec.edu.uy");
        usuarioDocente.setNombre("Docente Test");
        usuarioDocente.setRolApp(Usuario.RolApp.DOCENTE);
        usuarioDocente.setDeletedAt(null);

        usuarioExterno = new Usuario();
        usuarioExterno.setId(2L);
        usuarioExterno.setEmail("externo@gmail.com");
        usuarioExterno.setNombre("Externo Test");
        usuarioExterno.setRolApp(Usuario.RolApp.EXTERNO);
        usuarioExterno.setDeletedAt(null);

        usuarioAnalista1 = new Usuario();
        usuarioAnalista1.setId(3L);
        usuarioAnalista1.setEmail("analista1@utec.edu.uy");
        usuarioAnalista1.setNombre("Analista Uno");
        usuarioAnalista1.setRolApp(Usuario.RolApp.ANALISTA);
        usuarioAnalista1.setDeletedAt(null);

        usuarioAnalista2 = new Usuario();
        usuarioAnalista2.setId(4L);
        usuarioAnalista2.setEmail("analista2@utec.edu.uy");
        usuarioAnalista2.setNombre("Analista Dos");
        usuarioAnalista2.setRolApp(Usuario.RolApp.ANALISTA);
        usuarioAnalista2.setDeletedAt(null);

        usuarioAdmin = new Usuario();
        usuarioAdmin.setId(5L);
        usuarioAdmin.setEmail("admin@utec.edu.uy");
        usuarioAdmin.setNombre("Admin Test");
        usuarioAdmin.setRolApp(Usuario.RolApp.ADMIN);
        usuarioAdmin.setDeletedAt(null);

        // Setup Carreras
        carreraActiva = new Carrera();
        carreraActiva.setId(1L);
        carreraActiva.setNombre("Ingeniería");
        carreraActiva.setCodigo("ING");
        carreraActiva.setDeletedAt(null);

        carreraEliminada = new Carrera();
        carreraEliminada.setId(2L);
        carreraEliminada.setNombre("Carrera Eliminada");
        carreraEliminada.setCodigo("DEL");
        carreraEliminada.setDeletedAt(Instant.now());
    }

    // ==================== TESTS DE ROLES Y PERMISOS ====================

    @Test
    @DisplayName("EXTERNO debe crear reserva pública automáticamente")
    void externoDebeCrearReservaPublica() {
        // Given
        ReservaCreateDto createDto = new ReservaCreateDto();
        createDto.setEspacioId(espacioId);
        createDto.setTitulo("Evento Externo");
        createDto.setInicio(inicioFuturo);
        createDto.setFin(finFuturo);
        createDto.setEsPublica(false); // Intentamos crear privada, pero debe ser pública

        Reserva reservaGuardada = new Reserva();
        reservaGuardada.setId(1L);
        reservaGuardada.setEspacio(espacioTest);
        reservaGuardada.setUsuario(usuarioExterno);
        reservaGuardada.setInicio(inicioFuturo);
        reservaGuardada.setFin(finFuturo);
        reservaGuardada.setEstado(Reserva.EstadoReserva.PENDIENTE);
        reservaGuardada.setEsPublica(true); // Debe ser pública
        reservaGuardada.setTitulo("Evento Externo");

        lenient().when(usuarioRepository.findByEmail("externo@gmail.com")).thenReturn(Optional.of(usuarioExterno));
        when(espacioRepository.findById(espacioId)).thenReturn(Optional.of(espacioTest));
        when(reservaRepository.save(any(Reserva.class))).thenAnswer(invocation -> {
            Reserva r = invocation.getArgument(0);
            assertTrue(r.getEsPublica(), "La reserva de un EXTERNO debe ser pública");
            assertEquals(Reserva.EstadoReserva.PENDIENTE, r.getEstado(), "EXTERNO crea reserva PENDIENTE");
            return reservaGuardada;
        });
        lenient().when(fileStorageService.getImageUrl(anyString())).thenReturn("url");

        // When
        ReservaResponseDto resultado = reservaService.createReserva(createDto, "externo@gmail.com", ROLE_EXTERNO);

        // Then
        assertNotNull(resultado);
        verify(reservaRepository).save(argThat(reserva ->
                reserva.getEsPublica() == true &&
                        reserva.getEstado() == Reserva.EstadoReserva.PENDIENTE
        ));
    }

    @Test
    @DisplayName("ANALISTA debe auto-asignarse al crear reserva")
    void analistaDebeAutoAsignarse() {
        // Given
        ReservaCreateDto createDto = new ReservaCreateDto();
        createDto.setEspacioId(espacioId);
        createDto.setTitulo("Reserva Analista");
        createDto.setInicio(inicioFuturo);
        createDto.setFin(finFuturo);
        // No se proporciona analistaId

        Reserva reservaGuardada = new Reserva();
        reservaGuardada.setId(1L);
        reservaGuardada.setEspacio(espacioTest);
        reservaGuardada.setUsuario(usuarioAnalista1);
        reservaGuardada.setAnalistaAsignado(usuarioAnalista1); // Auto-asignado
        reservaGuardada.setInicio(inicioFuturo);
        reservaGuardada.setFin(finFuturo);
        reservaGuardada.setEstado(Reserva.EstadoReserva.APROBADO);
        reservaGuardada.setTitulo("Reserva Analista");

        lenient().when(usuarioRepository.findByEmail("analista1@utec.edu.uy")).thenReturn(Optional.of(usuarioAnalista1));
        when(espacioRepository.findById(espacioId)).thenReturn(Optional.of(espacioTest));
        when(reservaRepository.findConflictingReservas(anyLong(), any(), any(), any()))
                .thenReturn(Collections.emptyList());
        when(reservaRepository.save(any(Reserva.class))).thenAnswer(invocation -> {
            Reserva r = invocation.getArgument(0);
            assertEquals(usuarioAnalista1, r.getAnalistaAsignado(), "ANALISTA debe auto-asignarse");
            assertEquals(Reserva.EstadoReserva.APROBADO, r.getEstado(), "ANALISTA crea reserva APROBADO");
            return reservaGuardada;
        });
        lenient().when(fileStorageService.getImageUrl(anyString())).thenReturn("url");

        // When
        ReservaResponseDto resultado = reservaService.createReserva(createDto, "analista1@utec.edu.uy", ROLE_ANALISTA);

        // Then
        assertNotNull(resultado);
        verify(reservaRepository).save(argThat(reserva ->
                reserva.getAnalistaAsignado() != null &&
                        reserva.getAnalistaAsignado().equals(usuarioAnalista1)
        ));
    }

    @Test
    @DisplayName("DOCENTE sin seleccionar analista debe lanzar excepción")
    void docenteSinAnalistaDebeFallar() {
        // Given
        ReservaCreateDto createDto = new ReservaCreateDto();
        createDto.setEspacioId(espacioId);
        createDto.setTitulo("Reserva Docente");
        createDto.setInicio(inicioFuturo);
        createDto.setFin(finFuturo);
        createDto.setAnalistaId(null); // Sin analista

        lenient().when(usuarioRepository.findByEmail("docente@utec.edu.uy")).thenReturn(Optional.of(usuarioDocente));
        when(espacioRepository.findById(espacioId)).thenReturn(Optional.of(espacioTest));

        // When & Then
        RuntimeException exception = assertThrows(RuntimeException.class, () ->
                reservaService.createReserva(createDto, "docente@utec.edu.uy", ROLE_DOCENTE)
        );

        assertTrue(exception.getMessage().contains("debe seleccionar un analista"));
        verify(reservaRepository, never()).save(any());
    }

    @Test
    @DisplayName("Asignar usuario que NO es ANALISTA debe fallar")
    void asignarNoAnalistaDebeFallar() {
        // Given
        ReservaCreateDto createDto = new ReservaCreateDto();
        createDto.setEspacioId(espacioId);
        createDto.setTitulo("Reserva Docente");
        createDto.setInicio(inicioFuturo);
        createDto.setFin(finFuturo);
        createDto.setAnalistaId(usuarioDocente.getId()); // Intentar asignar a otro docente

        lenient().when(usuarioRepository.findByEmail("docente@utec.edu.uy")).thenReturn(Optional.of(usuarioDocente));
        when(espacioRepository.findById(espacioId)).thenReturn(Optional.of(espacioTest));
        when(usuarioRepository.findById(usuarioDocente.getId())).thenReturn(Optional.of(usuarioDocente));

        // When & Then
        RuntimeException exception = assertThrows(RuntimeException.class, () ->
                reservaService.createReserva(createDto, "docente@utec.edu.uy", ROLE_DOCENTE)
        );

        assertTrue(exception.getMessage().contains("no es un analista"));
        verify(reservaRepository, never()).save(any());
    }

    @Test
    @DisplayName("Asignar analista eliminado debe fallar")
    void asignarAnalistaEliminadoDebeFallar() {
        // Given
        Usuario analistaEliminado = new Usuario();
        analistaEliminado.setId(99L);
        analistaEliminado.setRolApp(Usuario.RolApp.ANALISTA);
        analistaEliminado.setDeletedAt(Instant.now()); // Eliminado

        ReservaCreateDto createDto = new ReservaCreateDto();
        createDto.setEspacioId(espacioId);
        createDto.setTitulo("Reserva Docente");
        createDto.setInicio(inicioFuturo);
        createDto.setFin(finFuturo);
        createDto.setAnalistaId(analistaEliminado.getId());

        lenient().when(usuarioRepository.findByEmail("docente@utec.edu.uy")).thenReturn(Optional.of(usuarioDocente));
        when(espacioRepository.findById(espacioId)).thenReturn(Optional.of(espacioTest));
        when(usuarioRepository.findById(analistaEliminado.getId())).thenReturn(Optional.of(analistaEliminado));

        // When & Then
        RuntimeException exception = assertThrows(RuntimeException.class, () ->
                reservaService.createReserva(createDto, "docente@utec.edu.uy", ROLE_DOCENTE)
        );

        assertTrue(exception.getMessage().contains("ha sido eliminado"));
        verify(reservaRepository, never()).save(any());
    }

    @Test
    @DisplayName("Crear reserva con carrera eliminada debe fallar")
    void crearConCarreraEliminadaDebeFallar() {
        // Given
        ReservaCreateDto createDto = new ReservaCreateDto();
        createDto.setEspacioId(espacioId);
        createDto.setTitulo("Reserva con carrera eliminada");
        createDto.setInicio(inicioFuturo);
        createDto.setFin(finFuturo);
        createDto.setCarreraId(carreraEliminada.getId());

        lenient().when(usuarioRepository.findByEmail("admin@utec.edu.uy")).thenReturn(Optional.of(usuarioAdmin));
        when(espacioRepository.findById(espacioId)).thenReturn(Optional.of(espacioTest));
        when(carreraRepository.findById(carreraEliminada.getId())).thenReturn(Optional.of(carreraEliminada));

        // When & Then
        RuntimeException exception = assertThrows(RuntimeException.class, () ->
                reservaService.createReserva(createDto, "admin@utec.edu.uy", ROLE_ADMIN)
        );

        assertTrue(exception.getMessage().contains("ha sido eliminada"));
        verify(reservaRepository, never()).save(any());
    }

    // ==================== TESTS DE CONFLICTOS ====================

    @Test
    @DisplayName("ADMIN intentando crear en horario ocupado debe fallar")
    void adminCrearEnHorarioOcupadoDebeFallar() {
        // Given
        Reserva reservaExistente = new Reserva();
        reservaExistente.setId(999L);
        reservaExistente.setEstado(Reserva.EstadoReserva.APROBADO);

        ReservaCreateDto createDto = new ReservaCreateDto();
        createDto.setEspacioId(espacioId);
        createDto.setTitulo("Intento de conflicto");
        createDto.setInicio(inicioFuturo);
        createDto.setFin(finFuturo);

        lenient().when(usuarioRepository.findByEmail("admin@utec.edu.uy")).thenReturn(Optional.of(usuarioAdmin));
        when(espacioRepository.findById(espacioId)).thenReturn(Optional.of(espacioTest));
        when(reservaRepository.findConflictingReservas(espacioId, inicioFuturo, finFuturo, Reserva.EstadoReserva.APROBADO))
                .thenReturn(Arrays.asList(reservaExistente)); // Hay conflicto

        // When & Then
        RuntimeException exception = assertThrows(RuntimeException.class, () ->
                reservaService.createReserva(createDto, "admin@utec.edu.uy", ROLE_ADMIN)
        );

        assertTrue(exception.getMessage().contains("ya está reservado"));
        verify(reservaRepository, never()).save(any());
    }

    @Test
    @DisplayName("DOCENTE creando en horario ocupado NO debe fallar - es PENDIENTE")
    void docenteCrearEnHorarioOcupadoNoDebeFallar() {
        // Given
        Reserva reservaExistente = new Reserva();
        reservaExistente.setId(999L);
        reservaExistente.setEstado(Reserva.EstadoReserva.APROBADO);

        ReservaCreateDto createDto = new ReservaCreateDto();
        createDto.setEspacioId(espacioId);
        createDto.setTitulo("Solicitud en horario ocupado");
        createDto.setInicio(inicioFuturo);
        createDto.setFin(finFuturo);
        createDto.setAnalistaId(usuarioAnalista1.getId());

        Reserva reservaGuardada = new Reserva();
        reservaGuardada.setId(1L);
        reservaGuardada.setEstado(Reserva.EstadoReserva.PENDIENTE);
        reservaGuardada.setEspacio(espacioTest);
        reservaGuardada.setUsuario(usuarioDocente);
        reservaGuardada.setAnalistaAsignado(usuarioAnalista1);
        reservaGuardada.setInicio(inicioFuturo);
        reservaGuardada.setFin(finFuturo);
        reservaGuardada.setTitulo("Solicitud en horario ocupado");

        lenient().when(usuarioRepository.findByEmail("docente@utec.edu.uy")).thenReturn(Optional.of(usuarioDocente));
        when(espacioRepository.findById(espacioId)).thenReturn(Optional.of(espacioTest));
        when(usuarioRepository.findById(usuarioAnalista1.getId())).thenReturn(Optional.of(usuarioAnalista1));
        when(reservaRepository.save(any(Reserva.class))).thenReturn(reservaGuardada);
        lenient().when(fileStorageService.getImageUrl(anyString())).thenReturn("url");
        lenient().when(emailService.enviarEmailNotificacionNuevaSolicitud(anyString(), any())).thenReturn(true);

        // NO validamos conflictos para DOCENTE (PENDIENTE)

        // When
        ReservaResponseDto resultado = reservaService.createReserva(createDto, "docente@utec.edu.uy", ROLE_DOCENTE);

        // Then
        assertNotNull(resultado);
        verify(reservaRepository).save(any(Reserva.class));
        // NO debe llamar a findConflictingReservas para DOCENTE
        verify(reservaRepository, never()).findConflictingReservas(anyLong(), any(), any(), any());
    }

    // ==================== TESTS DE CAMBIO DE ESTADO - ANALISTA ====================

    @Test
    @DisplayName("ANALISTA debe poder aprobar reserva asignada a él")
    void analistaAprobarReservaAsignada() {
        // Given
        Reserva reserva = new Reserva();
        reserva.setId(1L);
        reserva.setEstado(Reserva.EstadoReserva.PENDIENTE);
        reserva.setAnalistaAsignado(usuarioAnalista1);
        reserva.setUsuario(usuarioDocente);
        reserva.setEspacio(espacioTest);
        reserva.setInicio(inicioFuturo);
        reserva.setFin(finFuturo);
        reserva.setTitulo("Test");

        when(reservaRepository.findByIdWithRelations(1L)).thenReturn(reserva);
        lenient().when(usuarioRepository.findByEmail("analista1@utec.edu.uy")).thenReturn(Optional.of(usuarioAnalista1));
        when(reservaRepository.findConflictingReservas(anyLong(), any(), any(), any()))
                .thenReturn(Collections.emptyList());
        when(reservaRepository.save(any(Reserva.class))).thenReturn(reserva);
        lenient().when(fileStorageService.getImageUrl(anyString())).thenReturn("url");
        lenient().when(emailService.enviarEmailNotificacionReservaAprobada(anyString(), any())).thenReturn(true);

        // When
        ReservaResponseDto resultado = reservaService.cambiarEstadoReserva(
                1L, "APROBADO", "analista1@utec.edu.uy", ROLE_ANALISTA, "Aprobada por analista"
        );

        // Then
        assertNotNull(resultado);
        verify(reservaRepository).save(argThat(r -> r.getEstado() == Reserva.EstadoReserva.APROBADO));
    }

    @Test
    @DisplayName("ANALISTA NO debe poder aprobar reserva asignada a otro analista")
    void analistaNoAprobarReservaDeOtro() {
        // Given
        Reserva reserva = new Reserva();
        reserva.setId(1L);
        reserva.setEstado(Reserva.EstadoReserva.PENDIENTE);
        reserva.setAnalistaAsignado(usuarioAnalista2); // Asignada a analista2
        reserva.setUsuario(usuarioDocente);
        reserva.setEspacio(espacioTest);
        reserva.setInicio(inicioFuturo);
        reserva.setFin(finFuturo);

        when(reservaRepository.findByIdWithRelations(1L)).thenReturn(reserva);
        lenient().when(usuarioRepository.findByEmail("analista1@utec.edu.uy")).thenReturn(Optional.of(usuarioAnalista1));

        // When & Then
        RuntimeException exception = assertThrows(RuntimeException.class, () ->
                reservaService.cambiarEstadoReserva(1L, "APROBADO", "analista1@utec.edu.uy", ROLE_ANALISTA, null)
        );

        assertTrue(exception.getMessage().contains("No tienes permisos"));
        verify(reservaRepository, never()).save(any());
    }

    @Test
    @DisplayName("ANALISTA debe poder aprobar reserva SIN analista asignado (externo)")
    void analistaAprobarReservaSinAsignar() {
        // Given
        Reserva reserva = new Reserva();
        reserva.setId(1L);
        reserva.setEstado(Reserva.EstadoReserva.PENDIENTE);
        reserva.setAnalistaAsignado(null); // Sin analista asignado (típico de externo)
        reserva.setUsuario(usuarioExterno);
        reserva.setEspacio(espacioTest);
        reserva.setInicio(inicioFuturo);
        reserva.setFin(finFuturo);
        reserva.setTitulo("Reserva de externo");

        when(reservaRepository.findByIdWithRelations(1L)).thenReturn(reserva);
        lenient().when(usuarioRepository.findByEmail("analista1@utec.edu.uy")).thenReturn(Optional.of(usuarioAnalista1));
        when(reservaRepository.findConflictingReservas(anyLong(), any(), any(), any()))
                .thenReturn(Collections.emptyList());
        when(reservaRepository.save(any(Reserva.class))).thenReturn(reserva);
        lenient().when(fileStorageService.getImageUrl(anyString())).thenReturn("url");
        lenient().when(emailService.enviarEmailNotificacionReservaAprobada(anyString(), any())).thenReturn(true);

        // When
        ReservaResponseDto resultado = reservaService.cambiarEstadoReserva(
                1L, "APROBADO", "analista1@utec.edu.uy", ROLE_ANALISTA, null
        );

        // Then
        assertNotNull(resultado);
        verify(reservaRepository).save(argThat(r -> r.getEstado() == Reserva.EstadoReserva.APROBADO));
    }

    @Test
    @DisplayName("Aprobar reserva cuando hay conflicto debe fallar")
    void aprobarConConflictoDebeFallar() {
        // Given
        Reserva reserva = new Reserva();
        reserva.setId(1L);
        reserva.setEstado(Reserva.EstadoReserva.PENDIENTE);
        reserva.setAnalistaAsignado(usuarioAnalista1);
        reserva.setUsuario(usuarioDocente);
        reserva.setEspacio(espacioTest);
        reserva.setInicio(inicioFuturo);
        reserva.setFin(finFuturo);

        Reserva otraReserva = new Reserva();
        otraReserva.setId(2L);
        otraReserva.setEstado(Reserva.EstadoReserva.APROBADO);

        when(reservaRepository.findByIdWithRelations(1L)).thenReturn(reserva);
        lenient().when(usuarioRepository.findByEmail("analista1@utec.edu.uy")).thenReturn(Optional.of(usuarioAnalista1));
        when(reservaRepository.findConflictingReservas(espacioId, inicioFuturo, finFuturo, Reserva.EstadoReserva.APROBADO))
                .thenReturn(Arrays.asList(otraReserva)); // Hay conflicto

        // When & Then
        RuntimeException exception = assertThrows(RuntimeException.class, () ->
                reservaService.cambiarEstadoReserva(1L, "APROBADO", "analista1@utec.edu.uy", ROLE_ANALISTA, null)
        );

        assertTrue(exception.getMessage().contains("ya está reservado"));
        verify(reservaRepository, never()).save(any());
    }

    @Test
    @DisplayName("Intentar aprobar reserva ya APROBADA debe fallar")
    void aprobarReservaYaAprobadaDebeFallar() {
        // Given
        Reserva reserva = new Reserva();
        reserva.setId(1L);
        reserva.setEstado(Reserva.EstadoReserva.APROBADO); // Ya aprobada
        reserva.setEspacio(espacioTest);

        when(reservaRepository.findByIdWithRelations(1L)).thenReturn(reserva);

        // When & Then
        RuntimeException exception = assertThrows(RuntimeException.class, () ->
                reservaService.cambiarEstadoReserva(1L, "APROBADO", "admin@utec.edu.uy", ROLE_ADMIN, null)
        );

        assertTrue(exception.getMessage().contains("PENDIENTE"));
        verify(reservaRepository, never()).save(any());
    }

    @Test
    @DisplayName("Intentar aprobar reserva CANCELADA debe fallar")
    void aprobarReservaCanceladaDebeFallar() {
        // Given
        Reserva reserva = new Reserva();
        reserva.setId(1L);
        reserva.setEstado(Reserva.EstadoReserva.CANCELADO); // Cancelada
        reserva.setEspacio(espacioTest);

        when(reservaRepository.findByIdWithRelations(1L)).thenReturn(reserva);

        // When & Then
        RuntimeException exception = assertThrows(RuntimeException.class, () ->
                reservaService.cambiarEstadoReserva(1L, "APROBADO", "admin@utec.edu.uy", ROLE_ADMIN, null)
        );

        assertTrue(exception.getMessage().contains("PENDIENTE"));
        verify(reservaRepository, never()).save(any());
    }

    // ==================== TESTS DE PERMISOS DE ACCESO ====================

    @Test
    @DisplayName("Usuario NO dueño intentando ver reserva debe fallar")
    void noDuenoVerReservaDebeFallar() {
        // Given
        Reserva reserva = new Reserva();
        reserva.setId(1L);
        reserva.setUsuario(usuarioDocente); // Dueño es docente
        reserva.setEspacio(espacioTest);

        when(reservaRepository.findByIdWithRelations(1L)).thenReturn(reserva);
        lenient().when(usuarioRepository.findByEmail("externo@gmail.com")).thenReturn(Optional.of(usuarioExterno));

        // When & Then
        RuntimeException exception = assertThrows(RuntimeException.class, () ->
                reservaService.getReservaById(1L, "externo@gmail.com")
        );

        assertTrue(exception.getMessage().contains("No tienes permisos"));
    }

    @Test
    @DisplayName("Usuario NO dueño intentando cancelar reserva debe fallar")
    void noDuenoCancelarReservaDebeFallar() {
        // Given
        Reserva reserva = new Reserva();
        reserva.setId(1L);
        reserva.setUsuario(usuarioDocente); // Dueño es docente
        reserva.setEstado(Reserva.EstadoReserva.PENDIENTE);
        reserva.setInicio(inicioFuturo);

        when(reservaRepository.findById(1L)).thenReturn(Optional.of(reserva));
        lenient().when(usuarioRepository.findByEmail("externo@gmail.com")).thenReturn(Optional.of(usuarioExterno));

        // When & Then
        RuntimeException exception = assertThrows(RuntimeException.class, () ->
                reservaService.cancelReserva(1L, "externo@gmail.com")
        );

        assertTrue(exception.getMessage().contains("No tienes permisos"));
        verify(reservaRepository, never()).save(any());
    }

    // ==================== TESTS DE VALIDACIONES DE ESTADO ====================

    @Test
    @DisplayName("Cancelar reserva ya PASADA debe fallar")
    void cancelarReservaPasadaDebeFallar() {
        // Given
        Instant inicioPasado = Instant.now().minus(2, ChronoUnit.DAYS);

        Reserva reserva = new Reserva();
        reserva.setId(1L);
        reserva.setUsuario(usuarioDocente);
        reserva.setEstado(Reserva.EstadoReserva.APROBADO);
        reserva.setInicio(inicioPasado); // Ya pasó

        when(reservaRepository.findById(1L)).thenReturn(Optional.of(reserva));
        lenient().when(usuarioRepository.findByEmail("docente@utec.edu.uy")).thenReturn(Optional.of(usuarioDocente));

        // When & Then
        RuntimeException exception = assertThrows(RuntimeException.class, () ->
                reservaService.cancelReserva(1L, "docente@utec.edu.uy")
        );

        assertTrue(exception.getMessage().contains("ya pasó"));
        verify(reservaRepository, never()).save(any());
    }

    @Test
    @DisplayName("Cancelar reserva ya CANCELADA debe fallar")
    void cancelarReservaCanceladaDebeFallar() {
        // Given
        Reserva reserva = new Reserva();
        reserva.setId(1L);
        reserva.setUsuario(usuarioDocente);
        reserva.setEstado(Reserva.EstadoReserva.CANCELADO); // Ya cancelada
        reserva.setInicio(inicioFuturo);

        when(reservaRepository.findById(1L)).thenReturn(Optional.of(reserva));
        lenient().when(usuarioRepository.findByEmail("docente@utec.edu.uy")).thenReturn(Optional.of(usuarioDocente));

        // When & Then
        RuntimeException exception = assertThrows(RuntimeException.class, () ->
                reservaService.cancelReserva(1L, "docente@utec.edu.uy")
        );

        assertTrue(exception.getMessage().contains("ya está cancelada"));
        verify(reservaRepository, never()).save(any());
    }

    // ==================== TESTS DE FILTROS POR ROL ====================

    @Test
    @DisplayName("ANALISTA debe ver solo reservas asignadas a él + sin asignar")
    void analistaFiltrarSoloSusReservas() {
        // Given
        Reserva reserva1 = new Reserva(); // Asignada a analista1
        reserva1.setId(1L);
        reserva1.setAnalistaAsignado(usuarioAnalista1);
        reserva1.setEspacio(espacioTest);
        reserva1.setUsuario(usuarioDocente);
        reserva1.setInicio(inicioFuturo);

        Reserva reserva2 = new Reserva(); // Sin asignar
        reserva2.setId(2L);
        reserva2.setAnalistaAsignado(null);
        reserva2.setEspacio(espacioTest);
        reserva2.setUsuario(usuarioExterno);
        reserva2.setInicio(inicioFuturo);

        Pageable pageable = PageRequest.of(0, 10);
        Page<Reserva> page = new PageImpl<>(Arrays.asList(reserva1, reserva2), pageable, 2);

        lenient().when(usuarioRepository.findByEmail("analista1@utec.edu.uy")).thenReturn(Optional.of(usuarioAnalista1));
        when(reservaRepository.findAll(ArgumentMatchers.<Specification<Reserva>>any(), eq(pageable))).thenReturn(page);
        lenient().when(fileStorageService.getImageUrl(anyString())).thenReturn("url");

        // When
        Page<ReservaResponseDto> resultado = reservaService.getAllReservasPaged(
                pageable,
                new com.utec.backend.dto.reserva.ReservaFilters(null, null, null, null, null, null, null, null),
                "analista1@utec.edu.uy", ROLE_ANALISTA
        );

        // Then
        assertNotNull(resultado);
        assertEquals(2, resultado.getTotalElements());
        verify(reservaRepository).findAll(ArgumentMatchers.<Specification<Reserva>>any(), eq(pageable));
    }

    @Test
    @DisplayName("EXTERNO debe ver solo reservas públicas")
    void externoFiltrarSoloPublicas() {
        // Given
        Reserva reservaPublica = new Reserva();
        reservaPublica.setId(1L);
        reservaPublica.setEsPublica(true);
        reservaPublica.setEspacio(espacioTest);
        reservaPublica.setUsuario(usuarioDocente);
        reservaPublica.setInicio(inicioFuturo);

        lenient().when(usuarioRepository.findByEmail("externo@gmail.com")).thenReturn(Optional.of(usuarioExterno));
        when(reservaRepository.findAll(ArgumentMatchers.<Specification<Reserva>>any())).thenReturn(Arrays.asList(reservaPublica));
        lenient().when(fileStorageService.getImageUrl(anyString())).thenReturn("url");

        // When
        List<ReservaResponseDto> resultado = reservaService.getTodasLasReservas(
                com.utec.backend.dto.reserva.ReservaFilters.of(null, null, null, null, null, null, null),
                "externo@gmail.com", ROLE_EXTERNO
        );

        // Then
        assertNotNull(resultado);
        verify(reservaRepository).findAll(ArgumentMatchers.<Specification<Reserva>>any());
    }

    @Test
    @DisplayName("Rechazar reserva con mensaje debe guardar mensaje del analista")
    void rechazarConMensajeGuardaMensaje() {
        // Given
        String mensajeAnalista = "No cumple con los requisitos";

        Reserva reserva = new Reserva();
        reserva.setId(1L);
        reserva.setEstado(Reserva.EstadoReserva.PENDIENTE);
        reserva.setAnalistaAsignado(usuarioAnalista1);
        reserva.setUsuario(usuarioDocente);
        reserva.setEspacio(espacioTest);
        reserva.setInicio(inicioFuturo);
        reserva.setFin(finFuturo);
        reserva.setTitulo("Test");

        when(reservaRepository.findByIdWithRelations(1L)).thenReturn(reserva);
        lenient().when(usuarioRepository.findByEmail("analista1@utec.edu.uy")).thenReturn(Optional.of(usuarioAnalista1));
        when(reservaRepository.save(any(Reserva.class))).thenAnswer(invocation -> {
            Reserva r = invocation.getArgument(0);
            assertEquals(Reserva.EstadoReserva.CANCELADO, r.getEstado());
            assertEquals(mensajeAnalista, r.getMensajeAnalista());
            return r;
        });
        lenient().when(fileStorageService.getImageUrl(anyString())).thenReturn("url");
        lenient().when(emailService.enviarEmailNotificacionReservaRechazada(anyString(), any())).thenReturn(true);

        // When
        ReservaResponseDto resultado = reservaService.cambiarEstadoReserva(
                1L, "CANCELADO", "analista1@utec.edu.uy", ROLE_ANALISTA, mensajeAnalista
        );

        // Then
        assertNotNull(resultado);
        verify(reservaRepository).save(argThat(r ->
                r.getEstado() == Reserva.EstadoReserva.CANCELADO &&
                        mensajeAnalista.equals(r.getMensajeAnalista())
        ));
    }
}
