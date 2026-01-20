package com.utec.backend.service;

import com.utec.backend.dto.reserva.ReservaCreateDto;
import com.utec.backend.dto.reserva.ReservaResponseDto;
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
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static com.utec.backend.security.Constants.ROLE_ADMIN;
import static com.utec.backend.security.Constants.ROLE_DOCENTE;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

/**
 * Tests para funcionalidad de RECURRENCIA en ReservaService
 * CRÍTICO: Esta feature NO tenía ningún test
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("Tests de Recurrencia - ReservaService")
class ReservaServiceRecurrenciaTest {

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
    private Usuario usuarioAdmin;
    private Usuario usuarioDocente;
    private Usuario usuarioAnalista;
    private final Long espacioId = 1L;

    @BeforeEach
    void setUp() {
        // Setup Espacio
        espacioTest = new Espacio();
        espacioTest.setId(espacioId);
        espacioTest.setNombre("Aula 101");
        espacioTest.setCapacidad(30);
        espacioTest.setEstado("DISPONIBLE");

        // Setup Admin
        usuarioAdmin = new Usuario();
        usuarioAdmin.setId(1L);
        usuarioAdmin.setEmail("admin@utec.edu.uy");
        usuarioAdmin.setNombre("Admin Test");
        usuarioAdmin.setRolApp(Usuario.RolApp.ADMIN);

        // Setup Docente
        usuarioDocente = new Usuario();
        usuarioDocente.setId(2L);
        usuarioDocente.setEmail("docente@utec.edu.uy");
        usuarioDocente.setNombre("Docente Test");
        usuarioDocente.setRolApp(Usuario.RolApp.DOCENTE);

        // Setup Analista
        usuarioAnalista = new Usuario();
        usuarioAnalista.setId(3L);
        usuarioAnalista.setEmail("analista@utec.edu.uy");
        usuarioAnalista.setNombre("Analista Test");
        usuarioAnalista.setRolApp(Usuario.RolApp.ANALISTA);
    }

    @Test
    @DisplayName("Crear reservas recurrentes DIARIAS debe generar múltiples reservas")
    void crearReservasRecurrentesDiarias() {
        // Given
        Instant inicio = Instant.now().plus(1, ChronoUnit.DAYS).truncatedTo(ChronoUnit.HOURS);
        Instant fin = inicio.plus(1, ChronoUnit.HOURS);
        Instant fechaFinRecurrencia = inicio.plus(5, ChronoUnit.DAYS); // 5 días = 6 reservas

        ReservaCreateDto createDto = new ReservaCreateDto();
        createDto.setEspacioId(espacioId);
        createDto.setTitulo("Clase Recurrente Diaria");
        createDto.setInicio(inicio);
        createDto.setFin(fin);
        createDto.setTipoRecurrencia(ReservaCreateDto.TipoRecurrencia.DIARIA);
        createDto.setFechaFinRecurrencia(fechaFinRecurrencia);

        when(usuarioRepository.findByEmail("admin@utec.edu.uy")).thenReturn(Optional.of(usuarioAdmin));
        when(espacioRepository.findById(espacioId)).thenReturn(Optional.of(espacioTest));
        when(reservaRepository.findConflictingReservas(anyLong(), any(), any(), any()))
                .thenReturn(Collections.emptyList());
        when(reservaRepository.save(any(Reserva.class))).thenAnswer(invocation -> {
            Reserva r = invocation.getArgument(0);
            r.setId(System.currentTimeMillis()); // Simular ID generado
            return r;
        });
        lenient().when(fileStorageService.getImageUrl(anyString())).thenReturn("url");

        // When
        ReservaResponseDto resultado = reservaService.createReserva(createDto, "admin@utec.edu.uy", ROLE_ADMIN);

        // Then
        assertNotNull(resultado);
        // Debe crear 6 reservas (día 1, 2, 3, 4, 5, 6)
        ArgumentCaptor<Reserva> reservaCaptor = ArgumentCaptor.forClass(Reserva.class);
        verify(reservaRepository, times(6)).save(reservaCaptor.capture());

        List<Reserva> reservasCreadas = reservaCaptor.getAllValues();
        assertEquals(6, reservasCreadas.size(), "Debe crear 6 reservas diarias");

        // Verificar que cada reserva es 1 día después de la anterior
        for (int i = 1; i < reservasCreadas.size(); i++) {
            Instant anteriorInicio = reservasCreadas.get(i - 1).getInicio();
            Instant actualInicio = reservasCreadas.get(i).getInicio();
            long diferenciaDias = ChronoUnit.DAYS.between(anteriorInicio, actualInicio);
            assertEquals(1, diferenciaDias, "Las reservas deben estar separadas por 1 día");
        }
    }

    @Test
    @DisplayName("Crear reservas recurrentes SEMANALES debe generar reservas cada 7 días")
    void crearReservasRecurrentesSemanales() {
        // Given
        Instant inicio = Instant.now().plus(1, ChronoUnit.DAYS).truncatedTo(ChronoUnit.HOURS);
        Instant fin = inicio.plus(2, ChronoUnit.HOURS);
        Instant fechaFinRecurrencia = inicio.plus(21, ChronoUnit.DAYS); // 3 semanas

        ReservaCreateDto createDto = new ReservaCreateDto();
        createDto.setEspacioId(espacioId);
        createDto.setTitulo("Clase Recurrente Semanal");
        createDto.setInicio(inicio);
        createDto.setFin(fin);
        createDto.setTipoRecurrencia(ReservaCreateDto.TipoRecurrencia.SEMANAL);
        createDto.setFechaFinRecurrencia(fechaFinRecurrencia);

        when(usuarioRepository.findByEmail("admin@utec.edu.uy")).thenReturn(Optional.of(usuarioAdmin));
        when(espacioRepository.findById(espacioId)).thenReturn(Optional.of(espacioTest));
        when(reservaRepository.findConflictingReservas(anyLong(), any(), any(), any()))
                .thenReturn(Collections.emptyList());
        when(reservaRepository.save(any(Reserva.class))).thenAnswer(invocation -> {
            Reserva r = invocation.getArgument(0);
            r.setId(System.currentTimeMillis());
            return r;
        });
        lenient().when(fileStorageService.getImageUrl(anyString())).thenReturn("url");

        // When
        ReservaResponseDto resultado = reservaService.createReserva(createDto, "admin@utec.edu.uy", ROLE_ADMIN);

        // Then
        assertNotNull(resultado);
        // Debe crear 4 reservas (semana 0, 1, 2, 3)
        ArgumentCaptor<Reserva> reservaCaptor = ArgumentCaptor.forClass(Reserva.class);
        verify(reservaRepository, times(4)).save(reservaCaptor.capture());

        List<Reserva> reservasCreadas = reservaCaptor.getAllValues();
        assertEquals(4, reservasCreadas.size(), "Debe crear 4 reservas semanales");

        // Verificar que cada reserva es 7 días después de la anterior
        for (int i = 1; i < reservasCreadas.size(); i++) {
            Instant anteriorInicio = reservasCreadas.get(i - 1).getInicio();
            Instant actualInicio = reservasCreadas.get(i).getInicio();
            long diferenciaDias = ChronoUnit.DAYS.between(anteriorInicio, actualInicio);
            assertEquals(7, diferenciaDias, "Las reservas deben estar separadas por 7 días");
        }
    }

    @Test
    @DisplayName("Crear reservas recurrentes MENSUALES debe generar reservas cada mes")
    void crearReservasRecurrentesMensuales() {
        // Given
        Instant inicio = Instant.now().plus(1, ChronoUnit.DAYS).truncatedTo(ChronoUnit.HOURS);
        Instant fin = inicio.plus(2, ChronoUnit.HOURS);
        Instant fechaFinRecurrencia = inicio.plus(90, ChronoUnit.DAYS); // ~3 meses

        ReservaCreateDto createDto = new ReservaCreateDto();
        createDto.setEspacioId(espacioId);
        createDto.setTitulo("Reunión Mensual");
        createDto.setInicio(inicio);
        createDto.setFin(fin);
        createDto.setTipoRecurrencia(ReservaCreateDto.TipoRecurrencia.MENSUAL);
        createDto.setFechaFinRecurrencia(fechaFinRecurrencia);

        when(usuarioRepository.findByEmail("admin@utec.edu.uy")).thenReturn(Optional.of(usuarioAdmin));
        when(espacioRepository.findById(espacioId)).thenReturn(Optional.of(espacioTest));
        when(reservaRepository.findConflictingReservas(anyLong(), any(), any(), any()))
                .thenReturn(Collections.emptyList());
        when(reservaRepository.save(any(Reserva.class))).thenAnswer(invocation -> {
            Reserva r = invocation.getArgument(0);
            r.setId(System.currentTimeMillis());
            return r;
        });
        lenient().when(fileStorageService.getImageUrl(anyString())).thenReturn("url");

        // When
        ReservaResponseDto resultado = reservaService.createReserva(createDto, "admin@utec.edu.uy", ROLE_ADMIN);

        // Then
        assertNotNull(resultado);
        // Debe crear al menos 3 reservas mensuales
        ArgumentCaptor<Reserva> reservaCaptor = ArgumentCaptor.forClass(Reserva.class);
        verify(reservaRepository, atLeast(3)).save(reservaCaptor.capture());

        List<Reserva> reservasCreadas = reservaCaptor.getAllValues();
        assertTrue(reservasCreadas.size() >= 3, "Debe crear al menos 3 reservas mensuales");
    }

    @Test
    @DisplayName("Recurrencia sin fechaFinRecurrencia debe lanzar excepción")
    void recurrenciaSinFechaFinDebeFallar() {
        // Given
        Instant inicio = Instant.now().plus(1, ChronoUnit.DAYS);
        Instant fin = inicio.plus(1, ChronoUnit.HOURS);

        ReservaCreateDto createDto = new ReservaCreateDto();
        createDto.setEspacioId(espacioId);
        createDto.setTitulo("Clase Recurrente");
        createDto.setInicio(inicio);
        createDto.setFin(fin);
        createDto.setTipoRecurrencia(ReservaCreateDto.TipoRecurrencia.DIARIA);
        createDto.setFechaFinRecurrencia(null); // Sin fecha fin

        when(usuarioRepository.findByEmail("admin@utec.edu.uy")).thenReturn(Optional.of(usuarioAdmin));
        when(espacioRepository.findById(espacioId)).thenReturn(Optional.of(espacioTest));

        // When & Then
        RuntimeException exception = assertThrows(RuntimeException.class, () ->
                reservaService.createReserva(createDto, "admin@utec.edu.uy", ROLE_ADMIN)
        );

        assertTrue(exception.getMessage().contains("fecha de fin de recurrencia es requerida"));
        verify(reservaRepository, never()).save(any());
    }

    @Test
    @DisplayName("Recurrencia con fechaFin antes del inicio debe fallar")
    void recurrenciaConFechaFinAntesDeInicioDebeFallar() {
        // Given
        Instant inicio = Instant.now().plus(10, ChronoUnit.DAYS);
        Instant fin = inicio.plus(1, ChronoUnit.HOURS);
        Instant fechaFinRecurrencia = inicio.minus(1, ChronoUnit.DAYS); // Antes del inicio!

        ReservaCreateDto createDto = new ReservaCreateDto();
        createDto.setEspacioId(espacioId);
        createDto.setTitulo("Clase Recurrente");
        createDto.setInicio(inicio);
        createDto.setFin(fin);
        createDto.setTipoRecurrencia(ReservaCreateDto.TipoRecurrencia.DIARIA);
        createDto.setFechaFinRecurrencia(fechaFinRecurrencia);

        when(usuarioRepository.findByEmail("admin@utec.edu.uy")).thenReturn(Optional.of(usuarioAdmin));
        when(espacioRepository.findById(espacioId)).thenReturn(Optional.of(espacioTest));

        // When & Then
        RuntimeException exception = assertThrows(RuntimeException.class, () ->
                reservaService.createReserva(createDto, "admin@utec.edu.uy", ROLE_ADMIN)
        );

        assertTrue(exception.getMessage().contains("debe ser posterior"));
        verify(reservaRepository, never()).save(any());
    }

    @Test
    @DisplayName("Recurrencia que generaría >1000 reservas debe ser rechazada")
    void recurrenciaConDemasiadasReservasDebeFallar() {
        // Given
        Instant inicio = Instant.now().plus(1, ChronoUnit.DAYS);
        Instant fin = inicio.plus(1, ChronoUnit.HOURS);
        // 3 años de reservas diarias = ~1095 reservas
        Instant fechaFinRecurrencia = inicio.plus(1095, ChronoUnit.DAYS);

        ReservaCreateDto createDto = new ReservaCreateDto();
        createDto.setEspacioId(espacioId);
        createDto.setTitulo("Clase Recurrente Excesiva");
        createDto.setInicio(inicio);
        createDto.setFin(fin);
        createDto.setTipoRecurrencia(ReservaCreateDto.TipoRecurrencia.DIARIA);
        createDto.setFechaFinRecurrencia(fechaFinRecurrencia);

        when(usuarioRepository.findByEmail("admin@utec.edu.uy")).thenReturn(Optional.of(usuarioAdmin));
        when(espacioRepository.findById(espacioId)).thenReturn(Optional.of(espacioTest));

        // When & Then
        RuntimeException exception = assertThrows(RuntimeException.class, () ->
                reservaService.createReserva(createDto, "admin@utec.edu.uy", ROLE_ADMIN)
        );

        assertTrue(exception.getMessage().contains("más de 1000 reservas"));
        verify(reservaRepository, never()).save(any());
    }

    @Test
    @DisplayName("Recurrencia con conflictos parciales debe crear las que pueda")
    void recurrenciaConConflictosParciales() {
        // Given
        Instant inicio = Instant.now().plus(1, ChronoUnit.DAYS).truncatedTo(ChronoUnit.HOURS);
        Instant fin = inicio.plus(1, ChronoUnit.HOURS);
        Instant fechaFinRecurrencia = inicio.plus(4, ChronoUnit.DAYS); // 5 días

        ReservaCreateDto createDto = new ReservaCreateDto();
        createDto.setEspacioId(espacioId);
        createDto.setTitulo("Clase con Conflictos");
        createDto.setInicio(inicio);
        createDto.setFin(fin);
        createDto.setTipoRecurrencia(ReservaCreateDto.TipoRecurrencia.DIARIA);
        createDto.setFechaFinRecurrencia(fechaFinRecurrencia);

        Reserva reservaConflicto = new Reserva();
        reservaConflicto.setId(999L);
        reservaConflicto.setEstado(Reserva.EstadoReserva.APROBADO);

        when(usuarioRepository.findByEmail("admin@utec.edu.uy")).thenReturn(Optional.of(usuarioAdmin));
        when(espacioRepository.findById(espacioId)).thenReturn(Optional.of(espacioTest));

        // Simular conflicto en el día 3
        when(reservaRepository.findConflictingReservas(anyLong(), any(), any(), any()))
                .thenAnswer(invocation -> {
                    Instant fecha = invocation.getArgument(1);
                    long diasDesdeInicio = ChronoUnit.DAYS.between(inicio, fecha);
                    if (diasDesdeInicio == 2) { // Día 3 tiene conflicto
                        return List.of(reservaConflicto);
                    }
                    return Collections.emptyList();
                });

        when(reservaRepository.save(any(Reserva.class))).thenAnswer(invocation -> {
            Reserva r = invocation.getArgument(0);
            r.setId(System.currentTimeMillis());
            return r;
        });
        lenient().when(fileStorageService.getImageUrl(anyString())).thenReturn("url");

        // When
        ReservaResponseDto resultado = reservaService.createReserva(createDto, "admin@utec.edu.uy", ROLE_ADMIN);

        // Then
        assertNotNull(resultado);
        // Debe crear 4 reservas (omitiendo la del día 3 por conflicto)
        ArgumentCaptor<Reserva> reservaCaptor = ArgumentCaptor.forClass(Reserva.class);
        verify(reservaRepository, times(4)).save(reservaCaptor.capture());
    }

    @Test
    @DisplayName("ADMIN creando recurrencia con conflicto inmediato debe fallar")
    void adminRecurrenciaConConflictoInmediatoDebeFallar() {
        // Given
        // ADMIN valida conflictos ANTES de entrar al loop de recurrencia
        Instant inicio = Instant.now().plus(1, ChronoUnit.DAYS).truncatedTo(ChronoUnit.HOURS);
        Instant fin = inicio.plus(1, ChronoUnit.HOURS);
        Instant fechaFinRecurrencia = inicio.plus(3, ChronoUnit.DAYS);

        ReservaCreateDto createDto = new ReservaCreateDto();
        createDto.setEspacioId(espacioId);
        createDto.setTitulo("Conflicto Inmediato");
        createDto.setInicio(inicio);
        createDto.setFin(fin);
        createDto.setTipoRecurrencia(ReservaCreateDto.TipoRecurrencia.DIARIA);
        createDto.setFechaFinRecurrencia(fechaFinRecurrencia);

        Reserva reservaConflicto = new Reserva();
        reservaConflicto.setId(999L);
        reservaConflicto.setEstado(Reserva.EstadoReserva.APROBADO);

        when(usuarioRepository.findByEmail("admin@utec.edu.uy")).thenReturn(Optional.of(usuarioAdmin));
        when(espacioRepository.findById(espacioId)).thenReturn(Optional.of(espacioTest));
        // El primer slot ya tiene conflicto
        when(reservaRepository.findConflictingReservas(anyLong(), any(), any(), any()))
                .thenReturn(List.of(reservaConflicto));

        // When & Then
        RuntimeException exception = assertThrows(RuntimeException.class, () ->
                reservaService.createReserva(createDto, "admin@utec.edu.uy", ROLE_ADMIN)
        );

        // ADMIN valida conflictos antes de procesar recurrencia, entonces lanza error de conflicto normal
        assertTrue(exception.getMessage().contains("ya está reservado"),
                "Debe indicar conflicto. Mensaje: " + exception.getMessage());
        verify(reservaRepository, never()).save(any());
    }

    @Test
    @DisplayName("DOCENTE creando recurrencia debe crear todas PENDIENTES")
    void docenteRecurrenciaPendiente() {
        // Given
        Instant inicio = Instant.now().plus(1, ChronoUnit.DAYS).truncatedTo(ChronoUnit.HOURS);
        Instant fin = inicio.plus(1, ChronoUnit.HOURS);
        Instant fechaFinRecurrencia = inicio.plus(2, ChronoUnit.DAYS);

        ReservaCreateDto createDto = new ReservaCreateDto();
        createDto.setEspacioId(espacioId);
        createDto.setTitulo("Clase Recurrente Docente");
        createDto.setInicio(inicio);
        createDto.setFin(fin);
        createDto.setTipoRecurrencia(ReservaCreateDto.TipoRecurrencia.DIARIA);
        createDto.setFechaFinRecurrencia(fechaFinRecurrencia);
        createDto.setAnalistaId(usuarioAnalista.getId());

        when(usuarioRepository.findByEmail("docente@utec.edu.uy")).thenReturn(Optional.of(usuarioDocente));
        when(espacioRepository.findById(espacioId)).thenReturn(Optional.of(espacioTest));
        when(usuarioRepository.findById(usuarioAnalista.getId())).thenReturn(Optional.of(usuarioAnalista));
        when(reservaRepository.save(any(Reserva.class))).thenAnswer(invocation -> {
            Reserva r = invocation.getArgument(0);
            r.setId(System.currentTimeMillis());
            // Verificar que todas sean PENDIENTES
            assertEquals(Reserva.EstadoReserva.PENDIENTE, r.getEstado(),
                    "DOCENTE debe crear reservas PENDIENTES");
            return r;
        });
        lenient().when(fileStorageService.getImageUrl(anyString())).thenReturn("url");
        lenient().when(emailService.enviarEmailNotificacionNuevaSolicitud(anyString(), any())).thenReturn(true);

        // When
        ReservaResponseDto resultado = reservaService.createReserva(createDto, "docente@utec.edu.uy", ROLE_DOCENTE);

        // Then
        assertNotNull(resultado);
        // Debe crear 3 reservas PENDIENTES
        verify(reservaRepository, times(3)).save(any(Reserva.class));
    }

    @Test
    @DisplayName("Recurrencia con fecha inicio futura debe crear reservas correctamente")
    void recurrenciaConFechaInicioFutura() {
        // Given
        // IMPORTANTE: El servicio valida que inicio no sea en pasado ANTES de procesar recurrencia
        // Por lo tanto, la fecha de inicio DEBE ser futura
        Instant inicioFuturo = Instant.now().plus(1, ChronoUnit.DAYS).truncatedTo(ChronoUnit.HOURS);
        Instant finFuturo = inicioFuturo.plus(1, ChronoUnit.HOURS);
        Instant fechaFinRecurrencia = inicioFuturo.plus(5, ChronoUnit.DAYS);

        ReservaCreateDto createDto = new ReservaCreateDto();
        createDto.setEspacioId(espacioId);
        createDto.setTitulo("Clase Recurrente Futura");
        createDto.setInicio(inicioFuturo);
        createDto.setFin(finFuturo);
        createDto.setTipoRecurrencia(ReservaCreateDto.TipoRecurrencia.DIARIA);
        createDto.setFechaFinRecurrencia(fechaFinRecurrencia);

        when(usuarioRepository.findByEmail("admin@utec.edu.uy")).thenReturn(Optional.of(usuarioAdmin));
        when(espacioRepository.findById(espacioId)).thenReturn(Optional.of(espacioTest));
        when(reservaRepository.findConflictingReservas(anyLong(), any(), any(), any()))
                .thenReturn(Collections.emptyList());
        when(reservaRepository.save(any(Reserva.class))).thenAnswer(invocation -> {
            Reserva r = invocation.getArgument(0);
            // Verificar que TODAS las reservas estén en el futuro
            assertTrue(r.getInicio().isAfter(Instant.now()), "Todas las reservas deben estar en el futuro");
            r.setId(System.currentTimeMillis());
            return r;
        });
        lenient().when(fileStorageService.getImageUrl(anyString())).thenReturn("url");

        // When
        ReservaResponseDto resultado = reservaService.createReserva(createDto, "admin@utec.edu.uy", ROLE_ADMIN);

        // Then
        assertNotNull(resultado);
        // Debe crear 6 reservas (días 1-6)
        ArgumentCaptor<Reserva> reservaCaptor = ArgumentCaptor.forClass(Reserva.class);
        verify(reservaRepository, times(6)).save(reservaCaptor.capture());

        // Verificar que TODAS las reservas creadas están en el futuro
        for (Reserva r : reservaCaptor.getAllValues()) {
            assertTrue(r.getInicio().isAfter(Instant.now()),
                    "Todas las reservas deben estar en el futuro");
        }
    }

    @Test
    @DisplayName("Recurrencia debe mantener la misma duración para cada instancia")
    void recurrenciaMantieneDuracion() {
        // Given
        Instant inicio = Instant.now().plus(1, ChronoUnit.DAYS).truncatedTo(ChronoUnit.HOURS);
        Instant fin = inicio.plus(90, ChronoUnit.MINUTES); // 1.5 horas
        Instant fechaFinRecurrencia = inicio.plus(3, ChronoUnit.DAYS);

        ReservaCreateDto createDto = new ReservaCreateDto();
        createDto.setEspacioId(espacioId);
        createDto.setTitulo("Clase de 90 minutos");
        createDto.setInicio(inicio);
        createDto.setFin(fin);
        createDto.setTipoRecurrencia(ReservaCreateDto.TipoRecurrencia.DIARIA);
        createDto.setFechaFinRecurrencia(fechaFinRecurrencia);

        when(usuarioRepository.findByEmail("admin@utec.edu.uy")).thenReturn(Optional.of(usuarioAdmin));
        when(espacioRepository.findById(espacioId)).thenReturn(Optional.of(espacioTest));
        when(reservaRepository.findConflictingReservas(anyLong(), any(), any(), any()))
                .thenReturn(Collections.emptyList());
        when(reservaRepository.save(any(Reserva.class))).thenAnswer(invocation -> {
            Reserva r = invocation.getArgument(0);
            r.setId(System.currentTimeMillis());
            return r;
        });
        lenient().when(fileStorageService.getImageUrl(anyString())).thenReturn("url");

        // When
        ReservaResponseDto resultado = reservaService.createReserva(createDto, "admin@utec.edu.uy", ROLE_ADMIN);

        // Then
        assertNotNull(resultado);
        ArgumentCaptor<Reserva> reservaCaptor = ArgumentCaptor.forClass(Reserva.class);
        verify(reservaRepository, times(4)).save(reservaCaptor.capture());

        // Verificar que TODAS tienen la misma duración
        for (Reserva r : reservaCaptor.getAllValues()) {
            long duracion = ChronoUnit.MINUTES.between(r.getInicio(), r.getFin());
            assertEquals(90, duracion, "Todas las reservas deben durar 90 minutos");
        }
    }
}
