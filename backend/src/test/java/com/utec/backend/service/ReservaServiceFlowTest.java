package com.utec.backend.service;

import com.utec.backend.dto.reserva.ReservaCreateDto;
import com.utec.backend.dto.reserva.ReservaResponseDto;
import com.utec.backend.dto.reserva.ReservaUpdateDto;
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
import org.springframework.data.jpa.domain.Specification;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.*;

import static com.utec.backend.security.Constants.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Tests de FLUJOS COMPLETOS para ReservaService
 * Prueba interacciones entre múltiples usuarios y operaciones
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("Tests de Flujos Completos - ReservaService")
class ReservaServiceFlowTest {

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
    private Usuario docenteJuan;
    private Usuario docentePedro;
    private Usuario externoCarlos;
    private Usuario externoMaria;
    private Usuario analistaAna;
    private Usuario analistaLuis;
    private Usuario adminRosa;
    private final Long espacioId = 1L;
    private final Instant inicioFuturo = Instant.now().plus(2, ChronoUnit.DAYS);
    private final Instant finFuturo = inicioFuturo.plus(2, ChronoUnit.HOURS);

    // Simulador de BD
    private Map<Long, Reserva> reservasDB = new HashMap<>();
    private Long nextId = 1L;

    @BeforeEach
    void setUp() {
        reservasDB.clear();
        nextId = 1L;

        // Setup Espacio
        espacioTest = new Espacio();
        espacioTest.setId(espacioId);
        espacioTest.setNombre("Aula 101");
        espacioTest.setCapacidad(30);
        espacioTest.setEstado("DISPONIBLE");

        // Setup Usuarios
        docenteJuan = crearUsuario(1L, "juan@utec.edu.uy", "Juan Docente", Usuario.RolApp.DOCENTE);
        docentePedro = crearUsuario(2L, "pedro@utec.edu.uy", "Pedro Docente", Usuario.RolApp.DOCENTE);
        externoCarlos = crearUsuario(3L, "carlos@gmail.com", "Carlos Externo", Usuario.RolApp.EXTERNO);
        externoMaria = crearUsuario(4L, "maria@yahoo.com", "Maria Externa", Usuario.RolApp.EXTERNO);
        analistaAna = crearUsuario(5L, "ana@utec.edu.uy", "Ana Analista", Usuario.RolApp.ANALISTA);
        analistaLuis = crearUsuario(6L, "luis@utec.edu.uy", "Luis Analista", Usuario.RolApp.ANALISTA);
        adminRosa = crearUsuario(7L, "rosa@utec.edu.uy", "Rosa Admin", Usuario.RolApp.ADMIN);

        // Configurar mocks base
        lenient().when(espacioRepository.findById(espacioId)).thenReturn(Optional.of(espacioTest));
        lenient().when(fileStorageService.getImageUrl(anyString())).thenReturn("url");
        lenient().when(emailService.enviarEmailNotificacionNuevaSolicitud(anyString(), any())).thenReturn(true);
        lenient().when(emailService.enviarEmailNotificacionReservaAprobada(anyString(), any())).thenReturn(true);
        lenient().when(emailService.enviarEmailNotificacionReservaRechazada(anyString(), any())).thenReturn(true);
        lenient().when(emailService.enviarEmailNotificacionReservaCancelada(anyString(), any())).thenReturn(true);
        lenient().when(emailService.enviarEmailNotificacionReservaActualizada(anyString(), any(), anyString(), anyBoolean())).thenReturn(true);

        // Simular BD para save
        lenient().when(reservaRepository.save(any(Reserva.class))).thenAnswer(invocation -> {
            Reserva r = invocation.getArgument(0);
            if (r.getId() == null) {
                r.setId(nextId++);
            }
            reservasDB.put(r.getId(), r);
            return r;
        });

        // Simular BD para findById
        lenient().when(reservaRepository.findById(anyLong())).thenAnswer(invocation -> {
            Long id = invocation.getArgument(0);
            return Optional.ofNullable(reservasDB.get(id));
        });

        lenient().when(reservaRepository.findByIdWithRelations(anyLong())).thenAnswer(invocation -> {
            Long id = invocation.getArgument(0);
            return reservasDB.get(id);
        });

        // Simular findAll con Specification
        lenient().when(reservaRepository.findAll(any(Specification.class))).thenAnswer(invocation -> {
            // Retornar todas las reservas (simplificado)
            return new ArrayList<>(reservasDB.values());
        });

        lenient().when(reservaRepository.findByUsuarioId(anyLong())).thenAnswer(invocation -> {
            Long usuarioId = invocation.getArgument(0);
            return reservasDB.values().stream()
                    .filter(r -> r.getUsuario().getId().equals(usuarioId))
                    .toList();
        });
    }

    private Usuario crearUsuario(Long id, String email, String nombre, Usuario.RolApp rol) {
        Usuario u = new Usuario();
        u.setId(id);
        u.setEmail(email);
        u.setNombre(nombre);
        u.setRolApp(rol);
        u.setDeletedAt(null);
        return u;
    }

    // ==================== FLUJOS DE VISIBILIDAD ====================

    @Test
    @DisplayName("FLUJO: Docente crea privada → Externo NO la ve, Analista asignado SÍ")
    void flujoVisibilidadReservaPrivada() {
        // PASO 1: Docente Juan crea reserva PRIVADA asignada a Analista Ana
        lenient().when(usuarioRepository.findByEmail("juan@utec.edu.uy")).thenReturn(Optional.of(docenteJuan));
        lenient().when(usuarioRepository.findById(analistaAna.getId())).thenReturn(Optional.of(analistaAna));
        lenient().when(reservaRepository.findConflictingReservas(anyLong(), any(), any(), any()))
                .thenReturn(Collections.emptyList());

        ReservaCreateDto createDto = new ReservaCreateDto();
        createDto.setEspacioId(espacioId);
        createDto.setTitulo("Reunión Privada");
        createDto.setInicio(inicioFuturo);
        createDto.setFin(finFuturo);
        createDto.setAnalistaId(analistaAna.getId());
        createDto.setEsPublica(false); // PRIVADA

        ReservaResponseDto reservaCreada = reservaService.createReserva(createDto, "juan@utec.edu.uy", ROLE_DOCENTE);
        assertNotNull(reservaCreada);
        assertEquals(false, reservaCreada.getEsPublica());

        Long reservaId = reservaCreada.getId();

        // PASO 2: Externo Carlos intenta listar TODAS las reservas → NO debe ver la privada
        lenient().when(usuarioRepository.findByEmail("carlos@gmail.com")).thenReturn(Optional.of(externoCarlos));
        lenient().when(reservaRepository.findAll(any(Specification.class))).thenAnswer(invocation -> {
            // Simular filtro: solo públicas para EXTERNO
            return reservasDB.values().stream()
                    .filter(Reserva::getEsPublica)
                    .toList();
        });

        List<ReservaResponseDto> reservasExterno = reservaService.getTodasLasReservas(
                com.utec.backend.dto.reserva.ReservaFilters.of(null, null, null, null, null, null, null),
                "carlos@gmail.com", ROLE_EXTERNO
        );

        // Verificar que NO está en la lista (porque es privada)
        assertTrue(reservasExterno.stream().noneMatch(r -> r.getId().equals(reservaId)),
                "EXTERNO NO debe ver reservas privadas");

        // PASO 3: Analista Ana (asignada) lista SUS reservas → SÍ debe verla
        lenient().when(usuarioRepository.findByEmail("ana@utec.edu.uy")).thenReturn(Optional.of(analistaAna));
        when(reservaRepository.findAll(any(Specification.class))).thenAnswer(invocation -> {
            // Simular filtro: asignadas a Ana o sin asignar
            return reservasDB.values().stream()
                    .filter(r -> r.getAnalistaAsignado() == null ||
                                 r.getAnalistaAsignado().getId().equals(analistaAna.getId()))
                    .toList();
        });

        List<ReservaResponseDto> reservasAnalista = reservaService.getTodasLasReservas(
                com.utec.backend.dto.reserva.ReservaFilters.of(null, null, null, null, null, null, null),
                "ana@utec.edu.uy", ROLE_ANALISTA
        );

        // Verificar que SÍ está en su lista
        assertTrue(reservasAnalista.stream().anyMatch(r -> r.getId().equals(reservaId)),
                "ANALISTA asignado SÍ debe ver la reserva");

        // PASO 4: Analista Luis (NO asignado) NO debe verla
        lenient().when(usuarioRepository.findByEmail("luis@utec.edu.uy")).thenReturn(Optional.of(analistaLuis));
        when(reservaRepository.findAll(any(Specification.class))).thenAnswer(invocation -> {
            // Simular filtro: asignadas a Luis o sin asignar
            return reservasDB.values().stream()
                    .filter(r -> r.getAnalistaAsignado() == null ||
                                 r.getAnalistaAsignado().getId().equals(analistaLuis.getId()))
                    .toList();
        });

        List<ReservaResponseDto> reservasLuis = reservaService.getTodasLasReservas(
                com.utec.backend.dto.reserva.ReservaFilters.of(null, null, null, null, null, null, null),
                "luis@utec.edu.uy", ROLE_ANALISTA
        );

        // Verificar que NO está (porque está asignada a Ana)
        assertTrue(reservasLuis.stream().noneMatch(r -> r.getId().equals(reservaId)),
                "ANALISTA NO asignado NO debe ver reserva de otro analista");
    }

    @Test
    @DisplayName("FLUJO: Externo crea → Siempre pública → TODOS la ven")
    void flujoReservaExternoSiemprePublica() {
        // PASO 1: Externo Carlos crea reserva (intenta privada pero debe ser pública)
        lenient().when(usuarioRepository.findByEmail("carlos@gmail.com")).thenReturn(Optional.of(externoCarlos));

        ReservaCreateDto createDto = new ReservaCreateDto();
        createDto.setEspacioId(espacioId);
        createDto.setTitulo("Evento Externo");
        createDto.setInicio(inicioFuturo);
        createDto.setFin(finFuturo);
        createDto.setEsPublica(false); // Intenta crear PRIVADA

        ReservaResponseDto reservaCreada = reservaService.createReserva(createDto, "carlos@gmail.com", ROLE_EXTERNO);

        // Verificar que se forzó a pública
        assertTrue(reservaCreada.getEsPublica(), "Reservas de EXTERNO deben ser públicas siempre");
        Long reservaId = reservaCreada.getId();

        // PASO 2: Otro Externo (Maria) SÍ la ve
        lenient().when(usuarioRepository.findByEmail("maria@yahoo.com")).thenReturn(Optional.of(externoMaria));
        when(reservaRepository.findAll(any(Specification.class))).thenAnswer(invocation -> {
            return reservasDB.values().stream()
                    .filter(Reserva::getEsPublica)
                    .toList();
        });

        List<ReservaResponseDto> reservasMaria = reservaService.getTodasLasReservas(
                com.utec.backend.dto.reserva.ReservaFilters.of(null, null, null, null, null, null, null),
                "maria@yahoo.com", ROLE_EXTERNO
        );

        assertTrue(reservasMaria.stream().anyMatch(r -> r.getId().equals(reservaId)),
                "Otros EXTERNOS SÍ deben ver reservas públicas");

        // PASO 3: Docente Juan SÍ la ve
        lenient().when(usuarioRepository.findByEmail("juan@utec.edu.uy")).thenReturn(Optional.of(docenteJuan));
        when(reservaRepository.findAll(any(Specification.class))).thenReturn(new ArrayList<>(reservasDB.values()));

        List<ReservaResponseDto> reservasJuan = reservaService.getTodasLasReservas(
                com.utec.backend.dto.reserva.ReservaFilters.of(null, null, null, null, null, null, null),
                "juan@utec.edu.uy", ROLE_DOCENTE
        );

        assertTrue(reservasJuan.stream().anyMatch(r -> r.getId().equals(reservaId)),
                "DOCENTE SÍ debe ver reservas públicas");

        // PASO 4: Admin Rosa SÍ la ve (ve todas)
        lenient().when(usuarioRepository.findByEmail("rosa@utec.edu.uy")).thenReturn(Optional.of(adminRosa));

        List<ReservaResponseDto> reservasAdmin = reservaService.getTodasLasReservas(
                com.utec.backend.dto.reserva.ReservaFilters.of(null, null, null, null, null, null, null),
                "rosa@utec.edu.uy", ROLE_ADMIN
        );

        assertTrue(reservasAdmin.stream().anyMatch(r -> r.getId().equals(reservaId)),
                "ADMIN SÍ debe ver TODAS las reservas");
    }

    // ==================== FLUJOS DE MODIFICACIÓN ====================

    @Test
    @DisplayName("FLUJO COMPLETO: Crear → Aprobar → Intentar editar → Cancelar")
    void flujoCompletoCrearAprobarEditarCancelar() {
        // PASO 1: Docente Juan crea reserva PENDIENTE
        lenient().when(usuarioRepository.findByEmail("juan@utec.edu.uy")).thenReturn(Optional.of(docenteJuan));
        lenient().when(usuarioRepository.findById(analistaAna.getId())).thenReturn(Optional.of(analistaAna));

        ReservaCreateDto createDto = new ReservaCreateDto();
        createDto.setEspacioId(espacioId);
        createDto.setTitulo("Clase de Programación");
        createDto.setInicio(inicioFuturo);
        createDto.setFin(finFuturo);
        createDto.setAnalistaId(analistaAna.getId());

        ReservaResponseDto reservaCreada = reservaService.createReserva(createDto, "juan@utec.edu.uy", ROLE_DOCENTE);
        assertEquals(Reserva.EstadoReserva.PENDIENTE, reservaCreada.getEstado());
        Long reservaId = reservaCreada.getId();

        // PASO 2: Docente Pedro (NO dueño) intenta ver → DEBE FALLAR
        lenient().when(usuarioRepository.findByEmail("pedro@utec.edu.uy")).thenReturn(Optional.of(docentePedro));

        assertThrows(RuntimeException.class, () ->
                reservaService.getReservaById(reservaId, "pedro@utec.edu.uy"),
                "Usuario NO dueño NO debe poder ver la reserva");

        // PASO 3: Analista Ana aprueba la reserva
        lenient().when(usuarioRepository.findByEmail("ana@utec.edu.uy")).thenReturn(Optional.of(analistaAna));
        lenient().when(reservaRepository.findConflictingReservas(anyLong(), any(), any(), any()))
                .thenReturn(Collections.emptyList());

        ReservaResponseDto reservaAprobada = reservaService.cambiarEstadoReserva(
                reservaId, "APROBADO", "ana@utec.edu.uy", ROLE_ANALISTA, "Aprobada"
        );

        assertEquals(Reserva.EstadoReserva.APROBADO, reservaAprobada.getEstado());

        // PASO 4: Docente Juan (dueño) intenta modificar horario
        Instant nuevoInicio = inicioFuturo.plus(1, ChronoUnit.HOURS);
        Instant nuevoFin = finFuturo.plus(1, ChronoUnit.HOURS);

        ReservaUpdateDto updateDto = new ReservaUpdateDto();
        updateDto.setInicio(nuevoInicio);
        updateDto.setFin(nuevoFin);

        lenient().when(usuarioRepository.findByEmail("juan@utec.edu.uy")).thenReturn(Optional.of(docenteJuan));
        lenient().when(reservaRepository.findConflictingReservas(eq(espacioId), eq(nuevoInicio), eq(nuevoFin), any()))
                .thenReturn(Collections.emptyList());

        ReservaResponseDto reservaActualizada = reservaService.updateReserva(
                reservaId, updateDto, "juan@utec.edu.uy"
        );

        assertEquals(nuevoInicio, reservaActualizada.getInicio());
        assertEquals(nuevoFin, reservaActualizada.getFin());

        // PASO 5: Docente Pedro intenta modificar → DEBE FALLAR
        assertThrows(RuntimeException.class, () ->
                reservaService.updateReserva(reservaId, updateDto, "pedro@utec.edu.uy"),
                "Usuario NO dueño NO debe poder editar");

        // PASO 6: Docente Juan cancela su reserva
        lenient().when(usuarioRepository.findByEmail("juan@utec.edu.uy")).thenReturn(Optional.of(docenteJuan));

        assertDoesNotThrow(() -> reservaService.cancelReserva(reservaId, "juan@utec.edu.uy"));

        // Verificar que está cancelada
        Reserva reservaCancelada = reservasDB.get(reservaId);
        assertEquals(Reserva.EstadoReserva.CANCELADO, reservaCancelada.getEstado());

        // PASO 7: Intenta editar después de cancelar → DEBE FALLAR
        assertThrows(RuntimeException.class, () ->
                reservaService.updateReserva(reservaId, updateDto, "juan@utec.edu.uy"),
                "NO se puede editar reserva CANCELADA");
    }

    // ==================== FLUJOS DE CONFLICTOS ====================

    @Test
    @DisplayName("FLUJO: Admin crea APROBADO → Docente intenta mismo horario → Docente crea PENDIENTE → Analista NO puede aprobar por conflicto")
    void flujoConflictoReservas() {
        // PASO 1: Admin Rosa crea reserva APROBADA
        lenient().when(usuarioRepository.findByEmail("rosa@utec.edu.uy")).thenReturn(Optional.of(adminRosa));
        lenient().when(reservaRepository.findConflictingReservas(anyLong(), any(), any(), any()))
                .thenReturn(Collections.emptyList());

        ReservaCreateDto createAdmin = new ReservaCreateDto();
        createAdmin.setEspacioId(espacioId);
        createAdmin.setTitulo("Examen Final");
        createAdmin.setInicio(inicioFuturo);
        createAdmin.setFin(finFuturo);

        ReservaResponseDto reservaAdmin = reservaService.createReserva(createAdmin, "rosa@utec.edu.uy", ROLE_ADMIN);
        assertEquals(Reserva.EstadoReserva.APROBADO, reservaAdmin.getEstado());
        Long reservaAdminId = reservaAdmin.getId();

        // PASO 2: Otro Admin intenta crear en MISMO horario → DEBE FALLAR
        lenient().when(reservaRepository.findConflictingReservas(eq(espacioId), eq(inicioFuturo), eq(finFuturo), any()))
                .thenReturn(List.of(reservasDB.get(reservaAdminId)));

        ReservaCreateDto createConflicto = new ReservaCreateDto();
        createConflicto.setEspacioId(espacioId);
        createConflicto.setTitulo("Intento de Conflicto");
        createConflicto.setInicio(inicioFuturo);
        createConflicto.setFin(finFuturo);

        assertThrows(RuntimeException.class, () ->
                        reservaService.createReserva(createConflicto, "rosa@utec.edu.uy", ROLE_ADMIN),
                "ADMIN NO puede crear en horario ocupado");

        // PASO 3: Docente Juan crea PENDIENTE en mismo horario → SÍ DEBE FUNCIONAR
        lenient().when(usuarioRepository.findByEmail("juan@utec.edu.uy")).thenReturn(Optional.of(docenteJuan));
        lenient().when(usuarioRepository.findById(analistaAna.getId())).thenReturn(Optional.of(analistaAna));

        ReservaCreateDto createPendiente = new ReservaCreateDto();
        createPendiente.setEspacioId(espacioId);
        createPendiente.setTitulo("Solicitud en horario ocupado");
        createPendiente.setInicio(inicioFuturo);
        createPendiente.setFin(finFuturo);
        createPendiente.setAnalistaId(analistaAna.getId());

        // DOCENTE NO valida conflictos al crear (porque es PENDIENTE)
        ReservaResponseDto reservaPendiente = reservaService.createReserva(
                createPendiente, "juan@utec.edu.uy", ROLE_DOCENTE
        );
        assertEquals(Reserva.EstadoReserva.PENDIENTE, reservaPendiente.getEstado());
        Long reservaPendienteId = reservaPendiente.getId();

        // PASO 4: Analista Ana intenta APROBAR la pendiente → DEBE FALLAR (conflicto con la aprobada)
        lenient().when(usuarioRepository.findByEmail("ana@utec.edu.uy")).thenReturn(Optional.of(analistaAna));
        lenient().when(reservaRepository.findConflictingReservas(eq(espacioId), eq(inicioFuturo), eq(finFuturo), eq(Reserva.EstadoReserva.APROBADO)))
                .thenReturn(List.of(reservasDB.get(reservaAdminId)));

        assertThrows(RuntimeException.class, () ->
                        reservaService.cambiarEstadoReserva(reservaPendienteId, "APROBADO", "ana@utec.edu.uy", ROLE_ANALISTA, null),
                "NO se puede aprobar reserva con conflicto");

        // Verificar que sigue PENDIENTE
        assertEquals(Reserva.EstadoReserva.PENDIENTE, reservasDB.get(reservaPendienteId).getEstado());

        // PASO 5: Admin cancela su reserva APROBADA
        lenient().when(usuarioRepository.findByEmail("rosa@utec.edu.uy")).thenReturn(Optional.of(adminRosa));
        reservaService.cancelReserva(reservaAdminId, "rosa@utec.edu.uy");

        // PASO 6: Ahora Analista SÍ puede aprobar (ya no hay conflicto)
        lenient().when(reservaRepository.findConflictingReservas(eq(espacioId), eq(inicioFuturo), eq(finFuturo), eq(Reserva.EstadoReserva.APROBADO)))
                .thenReturn(Collections.emptyList()); // Sin conflictos

        lenient().when(usuarioRepository.findByEmail("ana@utec.edu.uy")).thenReturn(Optional.of(analistaAna));

        ReservaResponseDto reservaAhoraAprobada = reservaService.cambiarEstadoReserva(
                reservaPendienteId, "APROBADO", "ana@utec.edu.uy", ROLE_ANALISTA, "Aprobada tras cancelación"
        );

        assertEquals(Reserva.EstadoReserva.APROBADO, reservaAhoraAprobada.getEstado());
    }

    // ==================== FLUJOS DE RECURRENCIA ====================

    @Test
    @DisplayName("FLUJO: Crear recurrencia semanal → Cancelar una instancia → Otras siguen activas")
    void flujoRecurrenciaCancelarUnaInstancia() {
        // PASO 1: Admin crea reserva recurrente semanal (3 semanas)
        lenient().when(usuarioRepository.findByEmail("rosa@utec.edu.uy")).thenReturn(Optional.of(adminRosa));
        lenient().when(reservaRepository.findConflictingReservas(anyLong(), any(), any(), any()))
                .thenReturn(Collections.emptyList());

        Instant inicioRecurrencia = Instant.now().plus(1, ChronoUnit.DAYS).truncatedTo(ChronoUnit.HOURS);
        Instant finRecurrencia = inicioRecurrencia.plus(2, ChronoUnit.HOURS);
        Instant fechaFinRecurrencia = inicioRecurrencia.plus(14, ChronoUnit.DAYS); // 2 semanas

        ReservaCreateDto createRecurrente = new ReservaCreateDto();
        createRecurrente.setEspacioId(espacioId);
        createRecurrente.setTitulo("Clase Semanal");
        createRecurrente.setInicio(inicioRecurrencia);
        createRecurrente.setFin(finRecurrencia);
        createRecurrente.setTipoRecurrencia(ReservaCreateDto.TipoRecurrencia.SEMANAL);
        createRecurrente.setFechaFinRecurrencia(fechaFinRecurrencia);

        reservaService.createReserva(createRecurrente, "rosa@utec.edu.uy", ROLE_ADMIN);

        // Verificar que se crearon 3 reservas (semana 0, 1, 2)
        assertEquals(3, reservasDB.size(), "Deben crearse 3 instancias semanales");

        List<Long> idsReservas = new ArrayList<>(reservasDB.keySet());
        Collections.sort(idsReservas);

        // Todas deben estar APROBADAS (porque Admin las creó)
        for (Long id : idsReservas) {
            assertEquals(Reserva.EstadoReserva.APROBADO, reservasDB.get(id).getEstado());
        }

        // PASO 2: Admin cancela la SEGUNDA instancia
        Long segundaInstanciaId = idsReservas.get(1);
        lenient().when(usuarioRepository.findByEmail("rosa@utec.edu.uy")).thenReturn(Optional.of(adminRosa));

        reservaService.cancelReserva(segundaInstanciaId, "rosa@utec.edu.uy");

        // Verificar que la segunda está CANCELADA
        assertEquals(Reserva.EstadoReserva.CANCELADO, reservasDB.get(segundaInstanciaId).getEstado());

        // Verificar que las otras DOS siguen APROBADAS
        assertEquals(Reserva.EstadoReserva.APROBADO, reservasDB.get(idsReservas.get(0)).getEstado(),
                "Primera instancia debe seguir APROBADA");
        assertEquals(Reserva.EstadoReserva.APROBADO, reservasDB.get(idsReservas.get(2)).getEstado(),
                "Tercera instancia debe seguir APROBADA");
    }

    @Test
    @DisplayName("FLUJO: Docente crea recurrencia → Analista aprueba solo ALGUNAS instancias")
    void flujoRecurrenciaAprobarParcialmente() {
        // PASO 1: Docente crea 4 reservas recurrentes PENDIENTES
        lenient().when(usuarioRepository.findByEmail("juan@utec.edu.uy")).thenReturn(Optional.of(docenteJuan));
        lenient().when(usuarioRepository.findById(analistaAna.getId())).thenReturn(Optional.of(analistaAna));

        Instant inicio = Instant.now().plus(1, ChronoUnit.DAYS).truncatedTo(ChronoUnit.HOURS);
        Instant fin = inicio.plus(1, ChronoUnit.HOURS);
        Instant fechaFin = inicio.plus(3, ChronoUnit.DAYS);

        ReservaCreateDto createDto = new ReservaCreateDto();
        createDto.setEspacioId(espacioId);
        createDto.setTitulo("Clases Diarias");
        createDto.setInicio(inicio);
        createDto.setFin(fin);
        createDto.setTipoRecurrencia(ReservaCreateDto.TipoRecurrencia.DIARIA);
        createDto.setFechaFinRecurrencia(fechaFin);
        createDto.setAnalistaId(analistaAna.getId());

        reservaService.createReserva(createDto, "juan@utec.edu.uy", ROLE_DOCENTE);

        // Verificar que se crearon 4 PENDIENTES
        assertEquals(4, reservasDB.size());
        List<Long> ids = new ArrayList<>(reservasDB.keySet());
        Collections.sort(ids);

        for (Long id : ids) {
            assertEquals(Reserva.EstadoReserva.PENDIENTE, reservasDB.get(id).getEstado());
        }

        // PASO 2: Analista Ana aprueba la 1ra y 3ra, rechaza la 2da, deja 4ta pendiente
        lenient().when(usuarioRepository.findByEmail("ana@utec.edu.uy")).thenReturn(Optional.of(analistaAna));
        lenient().when(reservaRepository.findConflictingReservas(anyLong(), any(), any(), any()))
                .thenReturn(Collections.emptyList());

        // Aprobar 1ra
        reservaService.cambiarEstadoReserva(ids.get(0), "APROBADO", "ana@utec.edu.uy", ROLE_ANALISTA, null);

        // Rechazar 2da
        reservaService.cambiarEstadoReserva(ids.get(1), "CANCELADO", "ana@utec.edu.uy", ROLE_ANALISTA, "No disponible ese día");

        // Aprobar 3ra
        reservaService.cambiarEstadoReserva(ids.get(2), "APROBADO", "ana@utec.edu.uy", ROLE_ANALISTA, null);

        // 4ta queda PENDIENTE

        // PASO 3: Verificar estados finales
        assertEquals(Reserva.EstadoReserva.APROBADO, reservasDB.get(ids.get(0)).getEstado());
        assertEquals(Reserva.EstadoReserva.CANCELADO, reservasDB.get(ids.get(1)).getEstado());
        assertEquals(Reserva.EstadoReserva.APROBADO, reservasDB.get(ids.get(2)).getEstado());
        assertEquals(Reserva.EstadoReserva.PENDIENTE, reservasDB.get(ids.get(3)).getEstado());

        // PASO 4: Docente Juan puede ver TODAS sus reservas (sin importar estado)
        lenient().when(usuarioRepository.findByEmail("juan@utec.edu.uy")).thenReturn(Optional.of(docenteJuan));
        when(reservaRepository.findByUsuarioId(docenteJuan.getId())).thenReturn(new ArrayList<>(reservasDB.values()));

        List<ReservaResponseDto> reservasJuan = reservaService.getReservasByUsuario("juan@utec.edu.uy");
        assertEquals(4, reservasJuan.size(), "Docente debe ver TODAS sus reservas");

        // PASO 5: Contar por estado
        long aprobadas = reservasJuan.stream().filter(r -> r.getEstado() == Reserva.EstadoReserva.APROBADO).count();
        long canceladas = reservasJuan.stream().filter(r -> r.getEstado() == Reserva.EstadoReserva.CANCELADO).count();
        long pendientes = reservasJuan.stream().filter(r -> r.getEstado() == Reserva.EstadoReserva.PENDIENTE).count();

        assertEquals(2, aprobadas);
        assertEquals(1, canceladas);
        assertEquals(1, pendientes);
    }

    // ==================== FLUJOS DE PERMISOS ENTRE ANALISTAS ====================

    @Test
    @DisplayName("FLUJO: Reserva sin analista (externo) → Cualquier analista puede gestionarla")
    void flujoReservaSinAnalistaCualquieraPuedeGestionar() {
        // PASO 1: Externo Carlos crea reserva SIN analista asignado
        lenient().when(usuarioRepository.findByEmail("carlos@gmail.com")).thenReturn(Optional.of(externoCarlos));

        ReservaCreateDto createDto = new ReservaCreateDto();
        createDto.setEspacioId(espacioId);
        createDto.setTitulo("Evento Comunitario");
        createDto.setInicio(inicioFuturo);
        createDto.setFin(finFuturo);

        ReservaResponseDto reserva = reservaService.createReserva(createDto, "carlos@gmail.com", ROLE_EXTERNO);
        Long reservaId = reserva.getId();

        // Verificar que NO tiene analista asignado
        assertNull(reserva.getAnalistaId(), "Reservas de EXTERNO no tienen analista asignado");

        // PASO 2: Analista Ana puede aprobarla
        lenient().when(usuarioRepository.findByEmail("ana@utec.edu.uy")).thenReturn(Optional.of(analistaAna));
        lenient().when(reservaRepository.findConflictingReservas(anyLong(), any(), any(), any()))
                .thenReturn(Collections.emptyList());

        assertDoesNotThrow(() ->
                reservaService.cambiarEstadoReserva(reservaId, "APROBADO", "ana@utec.edu.uy", ROLE_ANALISTA, null),
                "Analista Ana PUEDE aprobar reserva sin asignar");

        // Resetear a PENDIENTE para siguiente test
        reservasDB.get(reservaId).setEstado(Reserva.EstadoReserva.PENDIENTE);

        // PASO 3: Analista Luis TAMBIÉN puede aprobarla (porque no tiene analista asignado)
        lenient().when(usuarioRepository.findByEmail("luis@utec.edu.uy")).thenReturn(Optional.of(analistaLuis));

        assertDoesNotThrow(() ->
                reservaService.cambiarEstadoReserva(reservaId, "APROBADO", "luis@utec.edu.uy", ROLE_ANALISTA, null),
                "Analista Luis TAMBIÉN PUEDE aprobar reserva sin asignar");
    }

    @Test
    @DisplayName("FLUJO: Docente crea asignada a Ana → Luis NO puede gestionar → Ana SÍ")
    void flujoReservaAsignadaSoloGestionaPorAsignado() {
        // PASO 1: Docente crea reserva asignada a Analista Ana
        lenient().when(usuarioRepository.findByEmail("juan@utec.edu.uy")).thenReturn(Optional.of(docenteJuan));
        lenient().when(usuarioRepository.findById(analistaAna.getId())).thenReturn(Optional.of(analistaAna));

        ReservaCreateDto createDto = new ReservaCreateDto();
        createDto.setEspacioId(espacioId);
        createDto.setTitulo("Taller");
        createDto.setInicio(inicioFuturo);
        createDto.setFin(finFuturo);
        createDto.setAnalistaId(analistaAna.getId());

        ReservaResponseDto reserva = reservaService.createReserva(createDto, "juan@utec.edu.uy", ROLE_DOCENTE);
        Long reservaId = reserva.getId();

        assertEquals(analistaAna.getId(), reserva.getAnalistaId());

        // PASO 2: Analista Luis intenta aprobar → DEBE FALLAR
        lenient().when(usuarioRepository.findByEmail("luis@utec.edu.uy")).thenReturn(Optional.of(analistaLuis));

        assertThrows(RuntimeException.class, () ->
                        reservaService.cambiarEstadoReserva(reservaId, "APROBADO", "luis@utec.edu.uy", ROLE_ANALISTA, null),
                "Analista Luis NO debe poder aprobar reserva asignada a Ana");

        // PASO 3: Analista Ana (asignada) SÍ puede aprobar
        lenient().when(usuarioRepository.findByEmail("ana@utec.edu.uy")).thenReturn(Optional.of(analistaAna));
        lenient().when(reservaRepository.findConflictingReservas(anyLong(), any(), any(), any()))
                .thenReturn(Collections.emptyList());

        assertDoesNotThrow(() ->
                reservaService.cambiarEstadoReserva(reservaId, "APROBADO", "ana@utec.edu.uy", ROLE_ANALISTA, null),
                "Analista Ana SÍ debe poder aprobar su reserva asignada");

        assertEquals(Reserva.EstadoReserva.APROBADO, reservasDB.get(reservaId).getEstado());
    }

    // ==================== FLUJO COMPLETO DE ACTUALIZACIÓN CON VALIDACIONES ====================

    @Test
    @DisplayName("FLUJO: Actualizar horario → Validar conflicto → Otro usuario ocupa el nuevo horario → Falla")
    void flujoActualizarConConflictoEnNuevoHorario() {
        // PASO 1: Docente Juan crea y aprueba reserva en horario A
        lenient().when(usuarioRepository.findByEmail("juan@utec.edu.uy")).thenReturn(Optional.of(docenteJuan));
        lenient().when(usuarioRepository.findById(analistaAna.getId())).thenReturn(Optional.of(analistaAna));
        lenient().when(reservaRepository.findConflictingReservas(anyLong(), any(), any(), any()))
                .thenReturn(Collections.emptyList());

        Instant inicioA = inicioFuturo;
        Instant finA = finFuturo;

        ReservaCreateDto createJuan = new ReservaCreateDto();
        createJuan.setEspacioId(espacioId);
        createJuan.setTitulo("Reserva Juan");
        createJuan.setInicio(inicioA);
        createJuan.setFin(finA);
        createJuan.setAnalistaId(analistaAna.getId());

        ReservaResponseDto reservaJuan = reservaService.createReserva(createJuan, "juan@utec.edu.uy", ROLE_DOCENTE);
        Long reservaJuanId = reservaJuan.getId();

        // Aprobar
        lenient().when(usuarioRepository.findByEmail("ana@utec.edu.uy")).thenReturn(Optional.of(analistaAna));
        reservaService.cambiarEstadoReserva(reservaJuanId, "APROBADO", "ana@utec.edu.uy", ROLE_ANALISTA, null);

        // PASO 2: Admin crea reserva en horario B
        Instant inicioB = inicioFuturo.plus(5, ChronoUnit.HOURS);
        Instant finB = finFuturo.plus(5, ChronoUnit.HOURS);

        lenient().when(usuarioRepository.findByEmail("rosa@utec.edu.uy")).thenReturn(Optional.of(adminRosa));
        lenient().when(reservaRepository.findConflictingReservas(eq(espacioId), eq(inicioB), eq(finB), any()))
                .thenReturn(Collections.emptyList());

        ReservaCreateDto createAdmin = new ReservaCreateDto();
        createAdmin.setEspacioId(espacioId);
        createAdmin.setTitulo("Reserva Admin");
        createAdmin.setInicio(inicioB);
        createAdmin.setFin(finB);

        ReservaResponseDto reservaAdmin = reservaService.createReserva(createAdmin, "rosa@utec.edu.uy", ROLE_ADMIN);
        Long reservaAdminId = reservaAdmin.getId();

        // PASO 3: Juan intenta mover SU reserva del horario A al horario B → DEBE FALLAR (ocupado por Admin)
        ReservaUpdateDto updateDto = new ReservaUpdateDto();
        updateDto.setInicio(inicioB);
        updateDto.setFin(finB);

        lenient().when(usuarioRepository.findByEmail("juan@utec.edu.uy")).thenReturn(Optional.of(docenteJuan));
        lenient().when(reservaRepository.findConflictingReservas(eq(espacioId), eq(inicioB), eq(finB), any()))
                .thenReturn(List.of(reservasDB.get(reservaAdminId))); // Conflicto

        assertThrows(RuntimeException.class, () ->
                        reservaService.updateReserva(reservaJuanId, updateDto, "juan@utec.edu.uy"),
                "NO se puede actualizar a horario ocupado");

        // Verificar que la reserva de Juan sigue en horario A
        assertEquals(inicioA, reservasDB.get(reservaJuanId).getInicio());
        assertEquals(finA, reservasDB.get(reservaJuanId).getFin());

        // PASO 4: Admin cancela su reserva del horario B
        lenient().when(usuarioRepository.findByEmail("rosa@utec.edu.uy")).thenReturn(Optional.of(adminRosa));
        reservaService.cancelReserva(reservaAdminId, "rosa@utec.edu.uy");

        // PASO 5: Ahora Juan SÍ puede mover su reserva al horario B
        lenient().when(usuarioRepository.findByEmail("juan@utec.edu.uy")).thenReturn(Optional.of(docenteJuan));
        lenient().when(reservaRepository.findConflictingReservas(eq(espacioId), eq(inicioB), eq(finB), any()))
                .thenReturn(Collections.emptyList()); // Sin conflictos

        ReservaResponseDto reservaActualizada = reservaService.updateReserva(
                reservaJuanId, updateDto, "juan@utec.edu.uy"
        );

        assertEquals(inicioB, reservaActualizada.getInicio());
        assertEquals(finB, reservaActualizada.getFin());
    }
}
