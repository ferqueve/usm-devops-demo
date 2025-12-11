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
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
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

@ExtendWith(MockitoExtension.class)
@DisplayName("Tests para ReservaService")
class ReservaServiceTest {

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

    @InjectMocks
    private ReservaService reservaService;

    private Reserva reservaTest;
    private Espacio espacioTest;
    private Usuario usuarioTest;
    private Usuario analistaTest;
    private Carrera carreraTest;
    private final Long reservaId = 1L;
    private final Long espacioId = 1L;
    private final String userEmail = "test@utec.edu.uy";
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

        // Setup Usuario
        usuarioTest = new Usuario();
        usuarioTest.setId(1L);
        usuarioTest.setEmail(userEmail);
        usuarioTest.setNombre("Juan Pérez");
        usuarioTest.setRolApp(Usuario.RolApp.DOCENTE);

        // Setup Analista
        analistaTest = new Usuario();
        analistaTest.setId(2L);
        analistaTest.setEmail("analista@utec.edu.uy");
        analistaTest.setNombre("Analista Test");
        analistaTest.setRolApp(Usuario.RolApp.ANALISTA);

        // Setup Carrera
        carreraTest = new Carrera();
        carreraTest.setId(1L);
        carreraTest.setNombre("Ingeniería");
        carreraTest.setCodigo("ING");
        carreraTest.setDeletedAt(null);

        // Setup Reserva
        reservaTest = new Reserva();
        reservaTest.setId(reservaId);
        reservaTest.setEspacio(espacioTest);
        reservaTest.setUsuario(usuarioTest);
        reservaTest.setCarrera(carreraTest);
        reservaTest.setAnalistaAsignado(analistaTest);
        reservaTest.setInicio(inicioFuturo);
        reservaTest.setFin(finFuturo);
        reservaTest.setEstado(Reserva.EstadoReserva.PENDIENTE);
        reservaTest.setEsPublica(false);
        reservaTest.setTitulo("Reserva de prueba");
        reservaTest.setMotivoSolicitud("Motivo de prueba");
        reservaTest.setCreatedAt(Instant.now());
        reservaTest.setUpdatedAt(Instant.now());
    }

    @Test
    @DisplayName("Debe crear reserva exitosamente como ADMIN")
    void debeCrearReservaExitosamenteComoAdmin() {
        // Given
        ReservaCreateDto createDto = new ReservaCreateDto();
        createDto.setEspacioId(espacioId);
        createDto.setTitulo("Reserva de prueba");
        createDto.setInicio(inicioFuturo);
        createDto.setFin(finFuturo);

        Usuario admin = new Usuario();
        admin.setId(3L);
        admin.setEmail("admin@utec.edu.uy");
        admin.setRolApp(Usuario.RolApp.ADMIN);

        when(usuarioRepository.findByEmail("admin@utec.edu.uy")).thenReturn(Optional.of(admin));
        when(espacioRepository.findById(espacioId)).thenReturn(Optional.of(espacioTest));
        when(reservaRepository.findConflictingReservas(eq(espacioId), any(Instant.class), any(Instant.class), eq(Reserva.EstadoReserva.APROBADO)))
                .thenReturn(Collections.emptyList());
        when(reservaRepository.save(any(Reserva.class))).thenReturn(reservaTest);

        // When
        ReservaResponseDto resultado = reservaService.createReserva(createDto, "admin@utec.edu.uy", ROLE_ADMIN);

        // Then
        assertNotNull(resultado);
        verify(reservaRepository).save(any(Reserva.class));
        verify(reservaRepository).findConflictingReservas(anyLong(), any(Instant.class), any(Instant.class), eq(Reserva.EstadoReserva.APROBADO));
    }

    @Test
    @DisplayName("Debe crear reserva pendiente como DOCENTE")
    void debeCrearReservaPendienteComoDocente() {
        // Given
        ReservaCreateDto createDto = new ReservaCreateDto();
        createDto.setEspacioId(espacioId);
        createDto.setTitulo("Reserva de prueba");
        createDto.setInicio(inicioFuturo);
        createDto.setFin(finFuturo);
        createDto.setAnalistaId(2L);

        when(usuarioRepository.findByEmail(userEmail)).thenReturn(Optional.of(usuarioTest));
        when(espacioRepository.findById(espacioId)).thenReturn(Optional.of(espacioTest));
        when(usuarioRepository.findById(2L)).thenReturn(Optional.of(analistaTest));
        when(reservaRepository.save(any(Reserva.class))).thenReturn(reservaTest);
        lenient().when(emailService.enviarEmailNotificacionNuevaSolicitud(anyString(), any())).thenReturn(true);

        // When
        ReservaResponseDto resultado = reservaService.createReserva(createDto, userEmail, ROLE_DOCENTE);

        // Then
        assertNotNull(resultado);
        verify(reservaRepository).save(any(Reserva.class));
        verify(usuarioRepository).findById(2L); // Verificar que se buscó el analista
    }

    @Test
    @DisplayName("Debe lanzar excepción cuando el espacio no está disponible")
    void debeLanzarExcepcionCuandoEspacioNoDisponible() {
        // Given
        espacioTest.setEstado("MANTENIMIENTO");
        ReservaCreateDto createDto = new ReservaCreateDto();
        createDto.setEspacioId(espacioId);
        createDto.setInicio(inicioFuturo);
        createDto.setFin(finFuturo);

        when(usuarioRepository.findByEmail(userEmail)).thenReturn(Optional.of(usuarioTest));
        when(espacioRepository.findById(espacioId)).thenReturn(Optional.of(espacioTest));

        // When & Then
        RuntimeException exception = assertThrows(RuntimeException.class, () -> {
            reservaService.createReserva(createDto, userEmail, ROLE_ADMIN);
        });

        assertTrue(exception.getMessage().contains("no está disponible"));
        verify(reservaRepository, never()).save(any(Reserva.class));
    }

    @Test
    @DisplayName("Debe lanzar excepción cuando la fecha de inicio es anterior a la de fin")
    void debeLanzarExcepcionCuandoFechaInicioPosteriorAFechaFin() {
        // Given
        ReservaCreateDto createDto = new ReservaCreateDto();
        createDto.setEspacioId(espacioId);
        createDto.setInicio(finFuturo);
        createDto.setFin(inicioFuturo);

        when(usuarioRepository.findByEmail(userEmail)).thenReturn(Optional.of(usuarioTest));
        when(espacioRepository.findById(espacioId)).thenReturn(Optional.of(espacioTest));

        // When & Then
        RuntimeException exception = assertThrows(RuntimeException.class, () -> {
            reservaService.createReserva(createDto, userEmail, ROLE_ADMIN);
        });

        assertTrue(exception.getMessage().contains("fecha de inicio debe ser anterior"));
        verify(reservaRepository, never()).save(any(Reserva.class));
    }

    @Test
    @DisplayName("Debe lanzar excepción cuando se intenta reservar en el pasado")
    void debeLanzarExcepcionCuandoReservaEnPasado() {
        // Given
        Instant pasado = Instant.now().minus(1, ChronoUnit.DAYS);
        ReservaCreateDto createDto = new ReservaCreateDto();
        createDto.setEspacioId(espacioId);
        createDto.setInicio(pasado);
        createDto.setFin(pasado.plus(1, ChronoUnit.HOURS));

        when(usuarioRepository.findByEmail(userEmail)).thenReturn(Optional.of(usuarioTest));
        when(espacioRepository.findById(espacioId)).thenReturn(Optional.of(espacioTest));

        // When & Then
        RuntimeException exception = assertThrows(RuntimeException.class, () -> {
            reservaService.createReserva(createDto, userEmail, ROLE_ADMIN);
        });

        assertTrue(exception.getMessage().contains("No se puede reservar en el pasado"));
        verify(reservaRepository, never()).save(any(Reserva.class));
    }

    @Test
    @DisplayName("Debe lanzar excepción cuando la duración es menor a 30 minutos")
    void debeLanzarExcepcionCuandoDuracionMenor30Minutos() {
        // Given
        ReservaCreateDto createDto = new ReservaCreateDto();
        createDto.setEspacioId(espacioId);
        createDto.setInicio(inicioFuturo);
        createDto.setFin(inicioFuturo.plus(15, ChronoUnit.MINUTES));

        when(usuarioRepository.findByEmail(userEmail)).thenReturn(Optional.of(usuarioTest));
        when(espacioRepository.findById(espacioId)).thenReturn(Optional.of(espacioTest));

        // When & Then
        RuntimeException exception = assertThrows(RuntimeException.class, () -> {
            reservaService.createReserva(createDto, userEmail, ROLE_ADMIN);
        });

        assertTrue(exception.getMessage().contains("duración mínima de 30 minutos"));
        verify(reservaRepository, never()).save(any(Reserva.class));
    }

    @Test
    @DisplayName("Debe obtener reservas por usuario")
    void debeObtenerReservasPorUsuario() {
        // Given
        when(usuarioRepository.findByEmail(userEmail)).thenReturn(Optional.of(usuarioTest));
        when(reservaRepository.findByUsuarioId(usuarioTest.getId())).thenReturn(Arrays.asList(reservaTest));

        // When
        List<ReservaResponseDto> resultado = reservaService.getReservasByUsuario(userEmail);

        // Then
        assertNotNull(resultado);
        assertEquals(1, resultado.size());
        verify(reservaRepository).findByUsuarioId(usuarioTest.getId());
    }

    @Test
    @DisplayName("Debe lanzar excepción cuando el usuario no existe al obtener reservas")
    void debeLanzarExcepcionCuandoUsuarioNoExisteAlObtenerReservas() {
        // Given
        when(usuarioRepository.findByEmail(userEmail)).thenReturn(Optional.empty());

        // When & Then
        assertThrows(UsuarioNotFoundException.class, () -> {
            reservaService.getReservasByUsuario(userEmail);
        });

        verify(reservaRepository, never()).findByUsuarioId(anyLong());
    }

    @Test
    @DisplayName("Debe obtener reservas por usuario paginadas")
    @SuppressWarnings("unchecked")
    void debeObtenerReservasPorUsuarioPaginadas() {
        // Given
        Pageable pageable = PageRequest.of(0, 10);
        Page<Reserva> page = new PageImpl<>(Arrays.asList(reservaTest), pageable, 1);

        when(usuarioRepository.findByEmail(userEmail)).thenReturn(Optional.of(usuarioTest));
        when(reservaRepository.findAll(any(Specification.class), eq(pageable))).thenReturn(page);

        // When
        Page<ReservaResponseDto> resultado = reservaService.getReservasByUsuarioPaged(
                userEmail, pageable, null, null, null, null, null, null, null);

        // Then
        assertNotNull(resultado);
        assertEquals(1, resultado.getTotalElements());
        verify(reservaRepository).findAll(any(Specification.class), eq(pageable));
    }

    @Test
    @DisplayName("Debe obtener todas las reservas paginadas")
    @SuppressWarnings("unchecked")
    void debeObtenerTodasLasReservasPaginadas() {
        // Given
        Pageable pageable = PageRequest.of(0, 10);
        Page<Reserva> page = new PageImpl<>(Arrays.asList(reservaTest), pageable, 1);

        when(reservaRepository.findAll(any(Specification.class), eq(pageable))).thenReturn(page);

        // When
        Page<ReservaResponseDto> resultado = reservaService.getAllReservasPaged(
                pageable, null, null, null, null, null, null, null, null, "admin@utec.edu.uy", ROLE_ADMIN);

        // Then
        assertNotNull(resultado);
        assertEquals(1, resultado.getTotalElements());
        verify(reservaRepository).findAll(any(Specification.class), eq(pageable));
    }

    @Test
    @DisplayName("Debe cambiar estado de reserva a APROBADO")
    void debeCambiarEstadoReservaAprobado() {
        // Given
        reservaTest.setEstado(Reserva.EstadoReserva.PENDIENTE);
        when(reservaRepository.findByIdWithRelations(reservaId)).thenReturn(reservaTest);
        when(reservaRepository.findConflictingReservas(eq(espacioId), any(Instant.class), any(Instant.class), eq(Reserva.EstadoReserva.APROBADO)))
                .thenReturn(Collections.emptyList());
        when(reservaRepository.save(any(Reserva.class))).thenReturn(reservaTest);
        lenient().when(emailService.enviarEmailNotificacionReservaAprobada(anyString(), any())).thenReturn(true);

        // When
        ReservaResponseDto resultado = reservaService.cambiarEstadoReserva(reservaId, "APROBADO", userEmail, ROLE_ADMIN, null);

        // Then
        assertNotNull(resultado);
        verify(reservaRepository).save(any(Reserva.class));
    }

    @Test
    @DisplayName("Debe obtener reserva por ID")
    void debeObtenerReservaPorId() {
        // Given
        when(reservaRepository.findByIdWithRelations(reservaId)).thenReturn(reservaTest);
        when(usuarioRepository.findByEmail(userEmail)).thenReturn(Optional.of(usuarioTest));

        // When
        ReservaResponseDto resultado = reservaService.getReservaById(reservaId, userEmail);

        // Then
        assertNotNull(resultado);
        verify(reservaRepository).findByIdWithRelations(reservaId);
    }

    @Test
    @DisplayName("Debe actualizar reserva exitosamente")
    void debeActualizarReservaExitosamente() {
        // Given
        ReservaUpdateDto updateDto = new ReservaUpdateDto();
        updateDto.setInicio(inicioFuturo.plus(1, ChronoUnit.HOURS));
        updateDto.setFin(finFuturo.plus(1, ChronoUnit.HOURS));

        when(reservaRepository.findByIdWithRelations(reservaId)).thenReturn(reservaTest);
        when(usuarioRepository.findByEmail(userEmail)).thenReturn(Optional.of(usuarioTest));
        when(reservaRepository.findConflictingReservas(eq(espacioId), any(Instant.class), any(Instant.class), eq(Reserva.EstadoReserva.APROBADO)))
                .thenReturn(Collections.emptyList());
        when(reservaRepository.save(any(Reserva.class))).thenReturn(reservaTest);

        // When
        ReservaResponseDto resultado = reservaService.updateReserva(reservaId, updateDto, userEmail);

        // Then
        assertNotNull(resultado);
        verify(reservaRepository).save(any(Reserva.class));
    }

    @Test
    @DisplayName("Debe cancelar reserva exitosamente")
    void debeCancelarReservaExitosamente() {
        // Given
        when(reservaRepository.findById(reservaId)).thenReturn(Optional.of(reservaTest));
        when(usuarioRepository.findByEmail(userEmail)).thenReturn(Optional.of(usuarioTest));
        when(reservaRepository.save(any(Reserva.class))).thenReturn(reservaTest);
        lenient().when(emailService.enviarEmailNotificacionReservaCancelada(anyString(), any())).thenReturn(true);

        // When
        assertDoesNotThrow(() -> reservaService.cancelReserva(reservaId, userEmail));

        // Then
        verify(reservaRepository).save(any(Reserva.class));
    }

    @Test
    @DisplayName("Debe obtener reservas por espacio")
    void debeObtenerReservasPorEspacio() {
        // Given
        when(reservaRepository.findByEspacioId(espacioId)).thenReturn(Arrays.asList(reservaTest));

        // When
        List<ReservaResponseDto> resultado = reservaService.getReservasByEspacio(espacioId);

        // Then
        assertNotNull(resultado);
        assertEquals(1, resultado.size());
        verify(reservaRepository).findByEspacioId(espacioId);
    }

    @Test
    @DisplayName("Debe obtener estadísticas personales")
    void debeObtenerEstadisticasPersonales() {
        // Given
        when(usuarioRepository.findByEmail(userEmail)).thenReturn(Optional.of(usuarioTest));
        when(reservaRepository.findByUsuarioId(usuarioTest.getId())).thenReturn(Arrays.asList(reservaTest));

        // When
        ReservaStatsDto resultado = reservaService.obtenerEstadisticasPersonales(userEmail);

        // Then
        assertNotNull(resultado);
        verify(reservaRepository).findByUsuarioId(usuarioTest.getId());
    }

    @Test
    @DisplayName("Debe obtener estadísticas globales")
    void debeObtenerEstadisticasGlobales() {
        // Given
        when(reservaRepository.findAll()).thenReturn(Arrays.asList(reservaTest));

        // When
        ReservaStatsDto resultado = reservaService.obtenerEstadisticasGlobales();

        // Then
        assertNotNull(resultado);
        verify(reservaRepository).findAll();
    }
}

