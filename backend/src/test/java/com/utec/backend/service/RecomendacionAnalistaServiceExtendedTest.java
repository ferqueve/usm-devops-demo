package com.utec.backend.service;

import com.utec.backend.dto.recomendacion.RecomendacionAnalistaDto;
import com.utec.backend.model.Espacio;
import com.utec.backend.model.Reserva;
import com.utec.backend.model.Usuario;
import com.utec.backend.repository.ReservaRepository;
import com.utec.backend.repository.UsuarioRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("Tests Extendidos - RecomendacionAnalistaService - Algoritmos de Asignación")
class RecomendacionAnalistaServiceExtendedTest {

    @Mock
    private UsuarioRepository usuarioRepository;

    @Mock
    private ReservaRepository reservaRepository;

    @InjectMocks
    private RecomendacionAnalistaService recomendacionAnalistaService;

    private Usuario docenteJuan;
    private Usuario analistaAna;
    private Usuario analistaLuis;
    private Usuario analistaCarlos;
    private Espacio espacioTest;

    @BeforeEach
    void setUp() {
        docenteJuan = new Usuario();
        docenteJuan.setId(10L);
        docenteJuan.setEmail("juan@utec.edu.uy");
        docenteJuan.setNombre("Juan Docente");
        docenteJuan.setRolApp(Usuario.RolApp.DOCENTE);

        analistaAna = new Usuario();
        analistaAna.setId(1L);
        analistaAna.setEmail("ana@utec.edu.uy");
        analistaAna.setNombre("Ana Analista");
        analistaAna.setRolApp(Usuario.RolApp.ANALISTA);

        analistaLuis = new Usuario();
        analistaLuis.setId(2L);
        analistaLuis.setEmail("luis@utec.edu.uy");
        analistaLuis.setNombre("Luis Analista");
        analistaLuis.setRolApp(Usuario.RolApp.ANALISTA);

        analistaCarlos = new Usuario();
        analistaCarlos.setId(3L);
        analistaCarlos.setEmail("carlos@utec.edu.uy");
        analistaCarlos.setNombre("Carlos Analista");
        analistaCarlos.setRolApp(Usuario.RolApp.ANALISTA);

        espacioTest = new Espacio();
        espacioTest.setId(1L);
        espacioTest.setNombre("Aula 101");
    }

    // ==================== TESTS DE ALGORITMO DE ASIGNACIÓN ====================

    @Test
    @DisplayName("Analista que ya trabajó con docente debe tener +0.4 de puntaje (40% peso)")
    void analistaConHistorialConDocenteMejorPuntaje() {
        // Given - Ana ya trabajó 3 veces con Juan, Luis nunca
        List<Reserva> historialJuan = Arrays.asList(
            crearReserva(1L, docenteJuan, analistaAna, Reserva.EstadoReserva.APROBADO),
            crearReserva(2L, docenteJuan, analistaAna, Reserva.EstadoReserva.APROBADO),
            crearReserva(3L, docenteJuan, analistaAna, Reserva.EstadoReserva.CANCELADO)
        );

        // Ambos tienen 0 pendientes y 100% aprobación (para aislar factor historial)
        List<Reserva> todasReservas = new ArrayList<>(historialJuan);

        when(usuarioRepository.findByRolAppAndDeletedAtIsNull(Usuario.RolApp.ANALISTA))
            .thenReturn(Arrays.asList(analistaAna, analistaLuis));
        when(reservaRepository.findByUsuarioId(docenteJuan.getId())).thenReturn(historialJuan);
        when(reservaRepository.findAll()).thenReturn(todasReservas);

        // When
        List<RecomendacionAnalistaDto> resultado = recomendacionAnalistaService.obtenerAnalistaRecomendado(
            docenteJuan.getId());

        // Then
        assertNotNull(resultado);
        assertEquals(2, resultado.size());

        // Ana debe estar primero (tiene historial)
        RecomendacionAnalistaDto ana = resultado.stream()
            .filter(r -> r.getAnalistaId().equals(analistaAna.getId()))
            .findFirst().orElse(null);

        RecomendacionAnalistaDto luis = resultado.stream()
            .filter(r -> r.getAnalistaId().equals(analistaLuis.getId()))
            .findFirst().orElse(null);

        assertNotNull(ana);
        assertNotNull(luis);

        // Ana debe tener 0.4 puntos más que Luis por historial
        // Ana: 0.4 (historial) + 0.3 (sin carga) + 0.15 (tasa 50% - 1 aprobado, 1 cancelado de 2 completadas)
        // Luis: 0.0 (sin historial) + 0.3 (sin carga) + 0.15 (tasa base 50%)
        assertTrue(ana.getPuntaje().compareTo(luis.getPuntaje()) > 0,
            String.format("Ana con historial (%s) debe tener más puntaje que Luis sin historial (%s)",
                ana.getPuntaje(), luis.getPuntaje()));

        // Verificar diferencia aproximada de 0.4 (con margen por redondeo y diferencias en tasa)
        BigDecimal diferencia = ana.getPuntaje().subtract(luis.getPuntaje());
        assertTrue(diferencia.compareTo(BigDecimal.valueOf(0.35)) > 0 &&
                   diferencia.compareTo(BigDecimal.valueOf(0.50)) < 0,
            "Diferencia debe ser ~0.4 (historial). Actual: " + diferencia);

        // Verificar razón menciona historial
        assertTrue(ana.getRazon().toLowerCase().contains("trabajó") ||
                  ana.getRazon().toLowerCase().contains("historial"),
            "Razón de Ana debe mencionar historial");
    }

    @Test
    @DisplayName("Analista con poca carga debe tener mejor puntaje que analista sobrecargado (30% peso)")
    void analistaPocaCargaMejorPuntaje() {
        // Given - Ana tiene 2 pendientes, Luis tiene 15 pendientes
        List<Reserva> pendientesAna = Arrays.asList(
            crearReservaPendiente(10L, docenteJuan, analistaAna),
            crearReservaPendiente(11L, docenteJuan, analistaAna)
        );

        List<Reserva> pendientesLuis = new ArrayList<>();
        for (int i = 20; i < 35; i++) {
            pendientesLuis.add(crearReservaPendiente((long) i, docenteJuan, analistaLuis));
        }

        List<Reserva> todasReservas = new ArrayList<>();
        todasReservas.addAll(pendientesAna);
        todasReservas.addAll(pendientesLuis);

        when(usuarioRepository.findByRolAppAndDeletedAtIsNull(Usuario.RolApp.ANALISTA))
            .thenReturn(Arrays.asList(analistaAna, analistaLuis));
        when(reservaRepository.findByUsuarioId(docenteJuan.getId())).thenReturn(Collections.emptyList());
        when(reservaRepository.findAll()).thenReturn(todasReservas);

        // When
        List<RecomendacionAnalistaDto> resultado = recomendacionAnalistaService.obtenerAnalistaRecomendado(
            docenteJuan.getId());

        // Then
        assertEquals(2, resultado.size());

        RecomendacionAnalistaDto ana = resultado.stream()
            .filter(r -> r.getAnalistaId().equals(analistaAna.getId()))
            .findFirst().orElse(null);

        RecomendacionAnalistaDto luis = resultado.stream()
            .filter(r -> r.getAnalistaId().equals(analistaLuis.getId()))
            .findFirst().orElse(null);

        assertNotNull(ana);
        assertNotNull(luis);

        // Ana (2 pendientes) debe tener mejor puntaje que Luis (15 pendientes)
        assertTrue(ana.getPuntaje().compareTo(luis.getPuntaje()) > 0,
            String.format("Ana con 2 pendientes (%s) debe tener más puntaje que Luis con 15 (%s)",
                ana.getPuntaje(), luis.getPuntaje()));

        // Verificar carga reportada
        assertEquals(2, ana.getCargaTrabajoActual());
        assertEquals(15, luis.getCargaTrabajoActual());

        // Cálculo esperado para factor carga:
        // Ana: 1.0 - min(2/10, 1.0) = 1.0 - 0.2 = 0.8 → 0.8 * 0.3 = 0.24
        // Luis: 1.0 - min(15/10, 1.0) = 1.0 - 1.0 = 0.0 → 0.0 * 0.3 = 0.0
        // Diferencia en este factor: ~0.24
    }

    @Test
    @DisplayName("Analista con alta tasa aprobación debe tener mejor puntaje que baja tasa (30% peso)")
    void analistaAltaTasaAprobacionMejorPuntaje() {
        // Given - Ana: 9 aprobadas de 10 = 90%, Luis: 4 aprobadas de 10 = 40%
        List<Reserva> reservasAna = new ArrayList<>();
        for (int i = 0; i < 9; i++) {
            reservasAna.add(crearReserva((long) (100 + i), docenteJuan, analistaAna, Reserva.EstadoReserva.APROBADO));
        }
        reservasAna.add(crearReserva(109L, docenteJuan, analistaAna, Reserva.EstadoReserva.CANCELADO));

        List<Reserva> reservasLuis = new ArrayList<>();
        for (int i = 0; i < 4; i++) {
            reservasLuis.add(crearReserva((long) (200 + i), docenteJuan, analistaLuis, Reserva.EstadoReserva.APROBADO));
        }
        for (int i = 4; i < 10; i++) {
            reservasLuis.add(crearReserva((long) (200 + i), docenteJuan, analistaLuis, Reserva.EstadoReserva.CANCELADO));
        }

        List<Reserva> todasReservas = new ArrayList<>();
        todasReservas.addAll(reservasAna);
        todasReservas.addAll(reservasLuis);

        when(usuarioRepository.findByRolAppAndDeletedAtIsNull(Usuario.RolApp.ANALISTA))
            .thenReturn(Arrays.asList(analistaAna, analistaLuis));
        when(reservaRepository.findByUsuarioId(docenteJuan.getId())).thenReturn(Collections.emptyList());
        when(reservaRepository.findAll()).thenReturn(todasReservas);

        // When
        List<RecomendacionAnalistaDto> resultado = recomendacionAnalistaService.obtenerAnalistaRecomendado(
            docenteJuan.getId());

        // Then
        assertEquals(2, resultado.size());

        RecomendacionAnalistaDto ana = resultado.stream()
            .filter(r -> r.getAnalistaId().equals(analistaAna.getId()))
            .findFirst().orElse(null);

        RecomendacionAnalistaDto luis = resultado.stream()
            .filter(r -> r.getAnalistaId().equals(analistaLuis.getId()))
            .findFirst().orElse(null);

        assertNotNull(ana);
        assertNotNull(luis);

        // Ana (90%) debe tener mejor puntaje que Luis (40%)
        assertTrue(ana.getPuntaje().compareTo(luis.getPuntaje()) > 0,
            String.format("Ana con 90%% aprobación (%s) debe tener más puntaje que Luis con 40%% (%s)",
                ana.getPuntaje(), luis.getPuntaje()));

        // Verificar tasas reportadas
        assertEquals(0.9, ana.getTasaAprobacion(), 0.01);
        assertEquals(0.4, luis.getTasaAprobacion(), 0.01);

        // Cálculo esperado:
        // Ana: 0.9 * 0.3 = 0.27
        // Luis: 0.4 * 0.3 = 0.12
        // Diferencia: ~0.15
    }

    @Test
    @DisplayName("Debe combinar todos los factores correctamente (historial + carga + tasa)")
    void debeCombinarTodosFactoresCorrectamente() {
        // Given - 3 analistas con diferentes combinaciones
        // Ana: Historial SÍ (3 veces) + Carga baja (2) + Tasa alta (90%) → Puntaje alto
        // Luis: Sin historial + Carga media (5) + Tasa media (60%)
        // Carlos: Sin historial + Carga alta (12) + Tasa baja (30%)

        List<Reserva> historialConJuan = Arrays.asList(
            crearReserva(1L, docenteJuan, analistaAna, Reserva.EstadoReserva.APROBADO),
            crearReserva(2L, docenteJuan, analistaAna, Reserva.EstadoReserva.APROBADO),
            crearReserva(3L, docenteJuan, analistaAna, Reserva.EstadoReserva.APROBADO)
        );

        List<Reserva> todasReservas = new ArrayList<>(historialConJuan);

        // Ana: 2 pendientes, 9 aprobadas de 10 completadas
        todasReservas.add(crearReservaPendiente(10L, docenteJuan, analistaAna));
        todasReservas.add(crearReservaPendiente(11L, docenteJuan, analistaAna));
        for (int i = 0; i < 6; i++) {
            todasReservas.add(crearReserva((long) (20 + i), docenteJuan, analistaAna, Reserva.EstadoReserva.APROBADO));
        }
        todasReservas.add(crearReserva(26L, docenteJuan, analistaAna, Reserva.EstadoReserva.CANCELADO));

        // Luis: 5 pendientes, 6 aprobadas de 10 completadas
        for (int i = 0; i < 5; i++) {
            todasReservas.add(crearReservaPendiente((long) (100 + i), docenteJuan, analistaLuis));
        }
        for (int i = 0; i < 6; i++) {
            todasReservas.add(crearReserva((long) (110 + i), docenteJuan, analistaLuis, Reserva.EstadoReserva.APROBADO));
        }
        for (int i = 0; i < 4; i++) {
            todasReservas.add(crearReserva((long) (120 + i), docenteJuan, analistaLuis, Reserva.EstadoReserva.CANCELADO));
        }

        // Carlos: 12 pendientes, 3 aprobadas de 10 completadas
        for (int i = 0; i < 12; i++) {
            todasReservas.add(crearReservaPendiente((long) (200 + i), docenteJuan, analistaCarlos));
        }
        for (int i = 0; i < 3; i++) {
            todasReservas.add(crearReserva((long) (220 + i), docenteJuan, analistaCarlos, Reserva.EstadoReserva.APROBADO));
        }
        for (int i = 0; i < 7; i++) {
            todasReservas.add(crearReserva((long) (230 + i), docenteJuan, analistaCarlos, Reserva.EstadoReserva.CANCELADO));
        }

        when(usuarioRepository.findByRolAppAndDeletedAtIsNull(Usuario.RolApp.ANALISTA))
            .thenReturn(Arrays.asList(analistaAna, analistaLuis, analistaCarlos));
        when(reservaRepository.findByUsuarioId(docenteJuan.getId())).thenReturn(historialConJuan);
        when(reservaRepository.findAll()).thenReturn(todasReservas);

        // When
        List<RecomendacionAnalistaDto> resultado = recomendacionAnalistaService.obtenerAnalistaRecomendado(
            docenteJuan.getId());

        // Then
        assertEquals(3, resultado.size());

        // Ordenar por puntaje para verificar
        resultado.sort((a, b) -> b.getPuntaje().compareTo(a.getPuntaje()));

        // Ana debe ser la primera (mejor puntaje)
        assertEquals(analistaAna.getId(), resultado.get(0).getAnalistaId(),
            "Ana debe tener el mejor puntaje (historial + baja carga + alta tasa)");

        // Luis debe ser segundo
        assertEquals(analistaLuis.getId(), resultado.get(1).getAnalistaId(),
            "Luis debe ser segundo (sin historial pero carga media y tasa media)");

        // Carlos debe ser tercero (peor opción)
        assertEquals(analistaCarlos.getId(), resultado.get(2).getAnalistaId(),
            "Carlos debe ser tercero (sin historial + alta carga + baja tasa)");

        // Verificar puntajes esperados aproximados:
        // Ana: 0.4 (hist) + 0.24 (carga 2/10) + 0.27 (tasa 90%) ≈ 0.91
        // Luis: 0.0 + 0.15 (carga 5/10) + 0.18 (tasa 60%) ≈ 0.33
        // Carlos: 0.0 + 0.0 (carga >10) + 0.09 (tasa 30%) ≈ 0.09

        assertTrue(resultado.get(0).getPuntaje().compareTo(BigDecimal.valueOf(0.8)) > 0,
            "Ana debe tener puntaje > 0.8");
        assertTrue(resultado.get(2).getPuntaje().compareTo(BigDecimal.valueOf(0.15)) < 0,
            "Carlos debe tener puntaje < 0.15");
    }

    @Test
    @DisplayName("Analista sin reservas completadas debe tener tasa aprobación base 0.5")
    void analistaNuevoTasaBase() {
        // Given - Analista nuevo sin ninguna reserva
        when(usuarioRepository.findByRolAppAndDeletedAtIsNull(Usuario.RolApp.ANALISTA))
            .thenReturn(Arrays.asList(analistaAna));
        when(reservaRepository.findByUsuarioId(docenteJuan.getId())).thenReturn(Collections.emptyList());
        when(reservaRepository.findAll()).thenReturn(Collections.emptyList());

        // When
        List<RecomendacionAnalistaDto> resultado = recomendacionAnalistaService.obtenerAnalistaRecomendado(
            docenteJuan.getId());

        // Then
        assertEquals(1, resultado.size());

        RecomendacionAnalistaDto ana = resultado.get(0);
        assertEquals(0.5, ana.getTasaAprobacion(), 0.01,
            "Analista sin historial debe tener tasa base 0.5");

        // Puntaje esperado: 0.0 (sin hist) + 0.3 (sin carga) + 0.15 (tasa 0.5) = 0.45
        assertTrue(ana.getPuntaje().compareTo(BigDecimal.valueOf(0.40)) > 0 &&
                  ana.getPuntaje().compareTo(BigDecimal.valueOf(0.50)) < 0);
    }

    @Test
    @DisplayName("Debe retornar máximo 5 analistas recomendados ordenados por puntaje")
    void debeRetornarMaximoCincoOrdenados() {
        // Given - 7 analistas disponibles
        List<Usuario> analistas = new ArrayList<>();
        for (int i = 1; i <= 7; i++) {
            Usuario a = new Usuario();
            a.setId((long) i);
            a.setEmail("analista" + i + "@utec.edu.uy");
            a.setNombre("Analista " + i);
            a.setRolApp(Usuario.RolApp.ANALISTA);
            analistas.add(a);
        }

        when(usuarioRepository.findByRolAppAndDeletedAtIsNull(Usuario.RolApp.ANALISTA))
            .thenReturn(analistas);
        when(reservaRepository.findByUsuarioId(docenteJuan.getId())).thenReturn(Collections.emptyList());
        when(reservaRepository.findAll()).thenReturn(Collections.emptyList());

        // When
        List<RecomendacionAnalistaDto> resultado = recomendacionAnalistaService.obtenerAnalistaRecomendado(
            docenteJuan.getId());

        // Then
        assertTrue(resultado.size() <= 5, "Debe retornar máximo 5 analistas");

        // Verificar ordenamiento
        for (int i = 0; i < resultado.size() - 1; i++) {
            assertTrue(resultado.get(i).getPuntaje().compareTo(resultado.get(i + 1).getPuntaje()) >= 0,
                "Debe estar ordenado por puntaje descendente");
        }
    }

    // ==================== TESTS DE RESERVAS PRIORITARIAS ====================

    @Test
    @DisplayName("Reserva próxima a iniciar debe tener alta urgencia")
    void reservaProximaAltaUrgencia() {
        // Given - Reserva pendiente que empieza en 1 día
        Instant inicioCercano = Instant.now().plus(1, ChronoUnit.DAYS);
        Reserva reservaUrgente = crearReservaPendienteConFecha(1L, docenteJuan, analistaAna,
            Instant.now().minus(2, ChronoUnit.DAYS), // Creada hace 2 días
            inicioCercano);

        // Reserva normal que empieza en 15 días
        Instant inicioLejano = Instant.now().plus(15, ChronoUnit.DAYS);
        Reserva reservaNormal = crearReservaPendienteConFecha(2L, docenteJuan, analistaAna,
            Instant.now().minus(1, ChronoUnit.DAYS), // Creada hace 1 día
            inicioLejano);

        when(reservaRepository.findAll()).thenReturn(Arrays.asList(reservaUrgente, reservaNormal));

        // When
        List<RecomendacionAnalistaDto> resultado = recomendacionAnalistaService.obtenerReservasPrioritarias(
            analistaAna.getId());

        // Then
        assertNotNull(resultado);
        assertTrue(resultado.size() <= 10, "Debe retornar max 10 reservas prioritarias");

        // La primera debe ser la urgente
        if (!resultado.isEmpty()) {
            RecomendacionAnalistaDto primera = resultado.get(0);
            assertEquals(reservaUrgente.getId(), primera.getReservaId(),
                "Reserva próxima a iniciar debe ser más prioritaria");

            // Verificar que tiene puntaje alto
            assertTrue(primera.getPuntaje().compareTo(BigDecimal.valueOf(0.5)) > 0,
                "Reserva urgente debe tener puntaje > 0.5");
        }
    }

    @Test
    @DisplayName("Reserva pendiente hace mucho tiempo debe tener alta urgencia")
    void reservaPendienteHacetiempoAltaUrgencia() {
        // Given - Reserva pendiente hace 10 días
        Reserva reservaVieja = crearReservaPendienteConFecha(1L, docenteJuan, analistaAna,
            Instant.now().minus(10, ChronoUnit.DAYS), // Creada hace 10 días
            Instant.now().plus(30, ChronoUnit.DAYS)); // Inicia en 30 días

        // Reserva recién creada
        Reserva reservaNueva = crearReservaPendienteConFecha(2L, docenteJuan, analistaAna,
            Instant.now().minus(1, ChronoUnit.HOURS), // Creada hace 1 hora
            Instant.now().plus(30, ChronoUnit.DAYS));

        when(reservaRepository.findAll()).thenReturn(Arrays.asList(reservaVieja, reservaNueva));

        // When
        List<RecomendacionAnalistaDto> resultado = recomendacionAnalistaService.obtenerReservasPrioritarias(
            analistaAna.getId());

        // Then
        assertNotNull(resultado);

        // La vieja debe tener mejor puntaje que la nueva
        if (resultado.size() >= 2) {
            RecomendacionAnalistaDto vieja = resultado.stream()
                .filter(r -> r.getReservaId().equals(reservaVieja.getId()))
                .findFirst().orElse(null);

            RecomendacionAnalistaDto nueva = resultado.stream()
                .filter(r -> r.getReservaId().equals(reservaNueva.getId()))
                .findFirst().orElse(null);

            assertNotNull(vieja);
            assertNotNull(nueva);

            assertTrue(vieja.getPuntaje().compareTo(nueva.getPuntaje()) > 0,
                "Reserva pendiente hace 10 días debe ser más prioritaria que recién creada");
        }
    }

    // ==================== MÉTODOS AUXILIARES ====================

    private Reserva crearReserva(Long id, Usuario usuario, Usuario analista, Reserva.EstadoReserva estado) {
        Reserva r = new Reserva();
        r.setId(id);
        r.setUsuario(usuario);
        r.setEspacio(espacioTest);
        r.setAnalistaAsignado(analista);
        r.setEstado(estado);
        r.setInicio(Instant.now().plus(7, ChronoUnit.DAYS));
        r.setFin(r.getInicio().plus(2, ChronoUnit.HOURS));
        r.setCreatedAt(Instant.now().minus(5, ChronoUnit.DAYS));
        return r;
    }

    private Reserva crearReservaPendiente(Long id, Usuario usuario, Usuario analista) {
        return crearReserva(id, usuario, analista, Reserva.EstadoReserva.PENDIENTE);
    }

    private Reserva crearReservaPendienteConFecha(Long id, Usuario usuario, Usuario analista,
                                                   Instant createdAt, Instant inicio) {
        Reserva r = crearReservaPendiente(id, usuario, analista);
        r.setCreatedAt(createdAt);
        r.setInicio(inicio);
        r.setFin(inicio.plus(2, ChronoUnit.HOURS));
        return r;
    }
}
