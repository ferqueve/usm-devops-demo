package com.utec.backend.service;

import com.utec.backend.dto.recomendacion.HorarioRecomendadoDto;
import com.utec.backend.dto.recomendacion.RecomendacionEspacioDto;
import com.utec.backend.model.Espacio;
import com.utec.backend.model.Reserva;
import com.utec.backend.model.TipoEspacio;
import com.utec.backend.model.Usuario;
import com.utec.backend.repository.EspacioRepository;
import com.utec.backend.repository.ReservaRepository;
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
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("Tests Extendidos - RecomendacionReservaService - Algoritmos de Scoring")
class RecomendacionReservaServiceTestExtended {

    @Mock
    private ReservaRepository reservaRepository;

    @Mock
    private EspacioRepository espacioRepository;

    @Mock
    private FileStorageService fileStorageService;

    @InjectMocks
    private RecomendacionReservaService recomendacionReservaService;

    private Usuario usuarioTest;
    private Espacio espacioFrecuente;
    private Espacio espacioSimilar;
    private Espacio espacioNuevo;
    private TipoEspacio tipoAula;
    private final Long usuarioId = 1L;
    private final Instant inicioFuturo = Instant.now().plus(7, ChronoUnit.DAYS);
    private final Instant finFuturo = inicioFuturo.plus(2, ChronoUnit.HOURS);

    @BeforeEach
    void setUp() {
        usuarioTest = new Usuario();
        usuarioTest.setId(usuarioId);
        usuarioTest.setEmail("docente@utec.edu.uy");
        usuarioTest.setNombre("Docente Test");

        tipoAula = new TipoEspacio();
        tipoAula.setId(1L);
        tipoAula.setNombre("Aula");
        tipoAula.setColor("#FF5733");

        // Espacio que el usuario ha reservado frecuentemente
        espacioFrecuente = new Espacio();
        espacioFrecuente.setId(1L);
        espacioFrecuente.setNombre("Aula 101");
        espacioFrecuente.setCapacidad(30);
        espacioFrecuente.setTipoEspacioId(1L);
        espacioFrecuente.setTipoEspacio(tipoAula);
        espacioFrecuente.setEstado("DISPONIBLE");
        espacioFrecuente.setImagenUrl("aula101.jpg");

        // Espacio similar (mismo tipo, capacidad cercana)
        espacioSimilar = new Espacio();
        espacioSimilar.setId(2L);
        espacioSimilar.setNombre("Aula 102");
        espacioSimilar.setCapacidad(32);
        espacioSimilar.setTipoEspacioId(1L);
        espacioSimilar.setTipoEspacio(tipoAula);
        espacioSimilar.setEstado("DISPONIBLE");
        espacioSimilar.setImagenUrl("aula102.jpg");

        // Espacio nuevo (nunca usado por el usuario)
        espacioNuevo = new Espacio();
        espacioNuevo.setId(3L);
        espacioNuevo.setNombre("Laboratorio 201");
        espacioNuevo.setCapacidad(20);
        espacioNuevo.setTipoEspacioId(2L);
        espacioNuevo.setEstado("DISPONIBLE");

        lenient().when(fileStorageService.getImageUrl(anyString())).thenReturn("http://example.com/image.jpg");
    }

    // ==================== TESTS DE ALGORITMO DE SCORING ====================

    @Test
    @DisplayName("Usuario con historial debe priorizar espacio frecuentemente usado (35% peso)")
    void usuarioConHistorialDebePriorizarEspacioFrecuente() {
        // Given - Usuario ha reservado Aula 101 cinco veces
        List<Reserva> historial = Arrays.asList(
            crearReserva(1L, espacioFrecuente, Reserva.EstadoReserva.APROBADO),
            crearReserva(2L, espacioFrecuente, Reserva.EstadoReserva.APROBADO),
            crearReserva(3L, espacioFrecuente, Reserva.EstadoReserva.APROBADO),
            crearReserva(4L, espacioFrecuente, Reserva.EstadoReserva.APROBADO),
            crearReserva(5L, espacioFrecuente, Reserva.EstadoReserva.APROBADO)
        );

        List<Espacio> disponibles = Arrays.asList(espacioFrecuente, espacioSimilar, espacioNuevo);

        when(reservaRepository.findByUsuarioId(usuarioId)).thenReturn(historial);
        when(espacioRepository.findEspaciosDisponibles(inicioFuturo, finFuturo)).thenReturn(disponibles);
        when(reservaRepository.countByEspacioIdAndEstado(anyLong(), eq(Reserva.EstadoReserva.APROBADO)))
            .thenReturn(10L);

        // When
        List<RecomendacionEspacioDto> resultado = recomendacionReservaService.obtenerRecomendacionesEspacios(
            usuarioId, inicioFuturo, finFuturo, null);

        // Then
        assertNotNull(resultado);
        assertFalse(resultado.isEmpty());

        // El primero debe ser el espacio frecuente por historial
        RecomendacionEspacioDto primero = resultado.get(0);
        assertEquals(espacioFrecuente.getId(), primero.getEspacioId());
        assertEquals("Aula 101", primero.getEspacioNombre());

        // Verificar que tiene puntaje alto (5 veces * 0.35 + otros factores)
        assertTrue(primero.getPuntaje().compareTo(BigDecimal.valueOf(1.5)) > 0,
            "Puntaje debe ser > 1.5 por historial frecuente. Actual: " + primero.getPuntaje());

        // Verificar razón menciona historial
        assertTrue(primero.getRazon().contains("5 reservas anteriores"));
    }

    @Test
    @DisplayName("Usuario sin historial debe recibir puntaje base neutro")
    void usuarioSinHistorialDebeRecibirPuntajeBase() {
        // Given - Usuario nuevo sin historial
        when(reservaRepository.findByUsuarioId(usuarioId)).thenReturn(Collections.emptyList());
        when(espacioRepository.findEspaciosDisponibles(inicioFuturo, finFuturo))
            .thenReturn(Arrays.asList(espacioFrecuente));
        when(reservaRepository.countByEspacioIdAndEstado(anyLong(), eq(Reserva.EstadoReserva.APROBADO)))
            .thenReturn(5L);

        // When
        List<RecomendacionEspacioDto> resultado = recomendacionReservaService.obtenerRecomendacionesEspacios(
            usuarioId, inicioFuturo, finFuturo, null);

        // Then
        assertNotNull(resultado);
        assertFalse(resultado.isEmpty());

        RecomendacionEspacioDto recomendacion = resultado.get(0);

        // Sin historial: 0*0.35 (historial) + 0.5*0.25 (similitud base) + 0.20 (disponible) + peso popularidad + peso capacidad
        // Puntaje esperado ≈ 0.125 + 0.20 + ~0.05 + 0.10 = ~0.475 a 0.5
        assertTrue(recomendacion.getPuntaje().compareTo(BigDecimal.valueOf(0.3)) > 0);
        assertTrue(recomendacion.getPuntaje().compareTo(BigDecimal.valueOf(0.8)) < 0);

        // Razón debe indicar que no hay historial
        assertTrue(recomendacion.getRazon().contains("características similares a tus preferencias"));
    }

    @Test
    @DisplayName("Filtro por capacidad debe excluir espacios pequeños")
    void filtroCapacidadDebeExcluirEspaciosPequenos() {
        // Given - Usuario necesita capacidad 30, Laboratorio tiene 20
        when(reservaRepository.findByUsuarioId(usuarioId)).thenReturn(Collections.emptyList());
        when(espacioRepository.findEspaciosDisponibles(inicioFuturo, finFuturo))
            .thenReturn(Arrays.asList(espacioFrecuente, espacioNuevo)); // 30 y 20 capacidad
        when(reservaRepository.countByEspacioIdAndEstado(anyLong(), eq(Reserva.EstadoReserva.APROBADO)))
            .thenReturn(5L);

        // When
        List<RecomendacionEspacioDto> resultado = recomendacionReservaService.obtenerRecomendacionesEspacios(
            usuarioId, inicioFuturo, finFuturo, 30); // Requiere capacidad 30

        // Then
        assertNotNull(resultado);
        assertEquals(1, resultado.size(), "Solo debe retornar espacios con capacidad >= 30");
        assertEquals(espacioFrecuente.getId(), resultado.get(0).getEspacioId());
        assertEquals(30, resultado.get(0).getCapacidad());
    }

    @Test
    @DisplayName("Espacios con capacidad exacta deben tener mejor puntaje (10% peso)")
    void capacidadExactaMejorPuntaje() {
        // Given
        Espacio espacioExacto = new Espacio();
        espacioExacto.setId(10L);
        espacioExacto.setNombre("Aula Exacta");
        espacioExacto.setCapacidad(30); // Exactamente lo requerido
        espacioExacto.setTipoEspacioId(1L);
        espacioExacto.setTipoEspacio(tipoAula);
        espacioExacto.setEstado("DISPONIBLE");

        Espacio espacioGrande = new Espacio();
        espacioGrande.setId(11L);
        espacioGrande.setNombre("Auditorio");
        espacioGrande.setCapacidad(100); // Muy grande para lo requerido
        espacioGrande.setTipoEspacioId(1L);
        espacioGrande.setTipoEspacio(tipoAula);
        espacioGrande.setEstado("DISPONIBLE");

        when(reservaRepository.findByUsuarioId(usuarioId)).thenReturn(Collections.emptyList());
        when(espacioRepository.findEspaciosDisponibles(inicioFuturo, finFuturo))
            .thenReturn(Arrays.asList(espacioExacto, espacioGrande));
        when(reservaRepository.countByEspacioIdAndEstado(anyLong(), eq(Reserva.EstadoReserva.APROBADO)))
            .thenReturn(5L);

        // When
        List<RecomendacionEspacioDto> resultado = recomendacionReservaService.obtenerRecomendacionesEspacios(
            usuarioId, inicioFuturo, finFuturo, 30);

        // Then
        assertNotNull(resultado);
        assertEquals(2, resultado.size());

        // El primero debe ser el de capacidad exacta
        assertEquals(espacioExacto.getId(), resultado.get(0).getEspacioId());

        // El de capacidad exacta debe tener mejor puntaje que el muy grande
        assertTrue(resultado.get(0).getPuntaje().compareTo(resultado.get(1).getPuntaje()) > 0,
            String.format("Capacidad exacta (%s) debe tener más puntaje que capacidad excesiva (%s)",
                resultado.get(0).getPuntaje(), resultado.get(1).getPuntaje()));
    }

    @Test
    @DisplayName("Debe retornar máximo 20 recomendaciones ordenadas por puntaje")
    void debeRetornarMaximo20Ordenadas() {
        // Given - 25 espacios disponibles
        List<Espacio> muchosEspacios = new java.util.ArrayList<>();
        for (int i = 1; i <= 25; i++) {
            Espacio e = new Espacio();
            e.setId((long) i);
            e.setNombre("Espacio " + i);
            e.setCapacidad(25 + i); // Capacidades variadas
            e.setTipoEspacioId(1L);
            e.setTipoEspacio(tipoAula);
            e.setEstado("DISPONIBLE");
            muchosEspacios.add(e);
        }

        when(reservaRepository.findByUsuarioId(usuarioId)).thenReturn(Collections.emptyList());
        when(espacioRepository.findEspaciosDisponibles(inicioFuturo, finFuturo)).thenReturn(muchosEspacios);
        when(reservaRepository.countByEspacioIdAndEstado(anyLong(), eq(Reserva.EstadoReserva.APROBADO)))
            .thenReturn(5L);

        // When
        List<RecomendacionEspacioDto> resultado = recomendacionReservaService.obtenerRecomendacionesEspacios(
            usuarioId, inicioFuturo, finFuturo, null);

        // Then
        assertEquals(20, resultado.size(), "Debe retornar exactamente 20 recomendaciones (top 20)");

        // Verificar ordenamiento descendente por puntaje
        for (int i = 0; i < resultado.size() - 1; i++) {
            assertTrue(resultado.get(i).getPuntaje().compareTo(resultado.get(i + 1).getPuntaje()) >= 0,
                String.format("Resultado[%d] (%s) debe tener >= puntaje que resultado[%d] (%s)",
                    i, resultado.get(i).getPuntaje(), i + 1, resultado.get(i + 1).getPuntaje()));
        }
    }

    @Test
    @DisplayName("Popularidad del espacio debe influir en puntaje (10% peso)")
    void popularidadInfluyeEnPuntaje() {
        // Given
        Espacio espacioPopular = new Espacio();
        espacioPopular.setId(100L);
        espacioPopular.setNombre("Aula Popular");
        espacioPopular.setCapacidad(30);
        espacioPopular.setTipoEspacioId(1L);
        espacioPopular.setTipoEspacio(tipoAula);
        espacioPopular.setEstado("DISPONIBLE");

        Espacio espacioPocoUsado = new Espacio();
        espacioPocoUsado.setId(101L);
        espacioPocoUsado.setNombre("Aula Poco Usada");
        espacioPocoUsado.setCapacidad(30);
        espacioPocoUsado.setTipoEspacioId(1L);
        espacioPocoUsado.setTipoEspacio(tipoAula);
        espacioPocoUsado.setEstado("DISPONIBLE");

        when(reservaRepository.findByUsuarioId(usuarioId)).thenReturn(Collections.emptyList());
        when(espacioRepository.findEspaciosDisponibles(inicioFuturo, finFuturo))
            .thenReturn(Arrays.asList(espacioPopular, espacioPocoUsado));

        // Espacio popular tiene 50 reservas, poco usado tiene 2
        when(reservaRepository.countByEspacioIdAndEstado(100L, Reserva.EstadoReserva.APROBADO)).thenReturn(50L);
        when(reservaRepository.countByEspacioIdAndEstado(101L, Reserva.EstadoReserva.APROBADO)).thenReturn(2L);

        // When
        List<RecomendacionEspacioDto> resultado = recomendacionReservaService.obtenerRecomendacionesEspacios(
            usuarioId, inicioFuturo, finFuturo, null);

        // Then
        assertEquals(2, resultado.size());

        // El popular debe estar primero
        assertEquals(espacioPopular.getId(), resultado.get(0).getEspacioId());

        // Popular debe tener mejor puntaje
        assertTrue(resultado.get(0).getPuntaje().compareTo(resultado.get(1).getPuntaje()) > 0);
    }

    // ==================== TESTS DE HORARIOS ÓPTIMOS ====================

    @Test
    @DisplayName("Horarios frecuentes del usuario deben tener mejor puntaje")
    void horariosFrecuentesMejorPuntaje() {
        // Given - Usuario reserva frecuentemente a las 10 AM
        Instant fecha = Instant.now().plus(3, ChronoUnit.DAYS).truncatedTo(ChronoUnit.DAYS);

        List<Reserva> historial = Arrays.asList(
            crearReservaEnHora(1L, espacioFrecuente, 10),
            crearReservaEnHora(2L, espacioFrecuente, 10),
            crearReservaEnHora(3L, espacioFrecuente, 10),
            crearReservaEnHora(4L, espacioFrecuente, 10),
            crearReservaEnHora(5L, espacioFrecuente, 14) // Una a las 2 PM
        );

        when(reservaRepository.findByUsuarioId(usuarioId)).thenReturn(historial);
        when(reservaRepository.findFutureReservasByEspacio(anyLong(), any(Instant.class), eq(Reserva.EstadoReserva.APROBADO)))
            .thenReturn(Collections.emptyList());

        // When
        List<HorarioRecomendadoDto> resultado = recomendacionReservaService.obtenerHorariosOptimos(
            usuarioId, espacioFrecuente.getId(), fecha);

        // Then
        assertNotNull(resultado);
        assertFalse(resultado.isEmpty());
        assertTrue(resultado.size() <= 10, "Debe retornar max 10 horarios");

        // Buscar el horario de las 10 AM en los resultados
        HorarioRecomendadoDto horario10AM = resultado.stream()
            .filter(h -> h.getInicio().atZone(java.time.ZoneOffset.UTC).getHour() == 10)
            .findFirst()
            .orElse(null);

        assertNotNull(horario10AM, "Debe incluir el horario de 10 AM (el más frecuente)");

        // El horario de 10 AM debe tener puntaje alto (4 veces / 5.0 normalizado = 0.8)
        assertTrue(horario10AM.getPuntaje().compareTo(BigDecimal.valueOf(0.7)) > 0,
            "Horario frecuente (10 AM con 4 usos) debe tener puntaje > 0.7. Actual: " + horario10AM.getPuntaje());
        assertTrue(horario10AM.getRazon().contains("frecuentemente usado") ||
                  horario10AM.getRazon().contains("4 veces"),
            "Razón debe mencionar frecuencia de uso");

        // Verificar que 10 AM tiene mejor puntaje que horarios sin historial
        HorarioRecomendadoDto horarioSinHistorial = resultado.stream()
            .filter(h -> {
                int hora = h.getInicio().atZone(java.time.ZoneOffset.UTC).getHour();
                return hora != 10 && hora != 14; // Ni las 10 AM ni las 2 PM (que tienen historial)
            })
            .findFirst()
            .orElse(null);

        if (horarioSinHistorial != null) {
            assertTrue(horario10AM.getPuntaje().compareTo(horarioSinHistorial.getPuntaje()) > 0,
                "Horario con historial debe tener mejor puntaje que sin historial");
        }
    }

    @Test
    @DisplayName("Horarios sin historial deben tener puntaje base 0.5")
    void horariosSinHistorialPuntajeBase() {
        // Given - Usuario nuevo sin historial
        Instant fecha = Instant.now().plus(3, ChronoUnit.DAYS).truncatedTo(ChronoUnit.DAYS);

        when(reservaRepository.findByUsuarioId(usuarioId)).thenReturn(Collections.emptyList());
        when(reservaRepository.findFutureReservasByEspacio(anyLong(), any(Instant.class), eq(Reserva.EstadoReserva.APROBADO)))
            .thenReturn(Collections.emptyList());

        // When
        List<HorarioRecomendadoDto> resultado = recomendacionReservaService.obtenerHorariosOptimos(
            usuarioId, espacioFrecuente.getId(), fecha);

        // Then
        assertNotNull(resultado);
        assertFalse(resultado.isEmpty());

        // Todos deben tener puntaje 0.5 (base para sin historial)
        for (HorarioRecomendadoDto horario : resultado) {
            assertEquals(0, BigDecimal.valueOf(0.5).compareTo(horario.getPuntaje()),
                "Sin historial, puntaje debe ser 0.5");
            assertEquals("Horario disponible", horario.getRazon());
        }
    }

    @Test
    @DisplayName("Horarios ocupados NO deben aparecer en recomendaciones")
    void horariosOcupadosNoAparecen() {
        // Given
        Instant fecha = Instant.now().plus(3, ChronoUnit.DAYS).truncatedTo(ChronoUnit.DAYS);

        // Reserva existente de 10 AM a 12 PM
        Reserva existente = new Reserva();
        existente.setId(999L);
        existente.setEspacio(espacioFrecuente);
        existente.setInicio(fecha.atZone(java.time.ZoneOffset.UTC).withHour(10).withMinute(0).toInstant());
        existente.setFin(fecha.atZone(java.time.ZoneOffset.UTC).withHour(12).withMinute(0).toInstant());
        existente.setEstado(Reserva.EstadoReserva.APROBADO);

        when(reservaRepository.findByUsuarioId(usuarioId)).thenReturn(Collections.emptyList());
        when(reservaRepository.findFutureReservasByEspacio(
            eq(espacioFrecuente.getId()), any(Instant.class), eq(Reserva.EstadoReserva.APROBADO)))
            .thenReturn(Arrays.asList(existente));

        // When
        List<HorarioRecomendadoDto> resultado = recomendacionReservaService.obtenerHorariosOptimos(
            usuarioId, espacioFrecuente.getId(), fecha);

        // Then
        assertNotNull(resultado);

        // Ningún horario debe empezar a las 10 AM (ocupado)
        for (HorarioRecomendadoDto horario : resultado) {
            int hora = horario.getInicio().atZone(java.time.ZoneOffset.UTC).getHour();
            assertNotEquals(10, hora, "Horario ocupado (10 AM) NO debe aparecer");
        }
    }

    // ==================== TESTS DE ESPACIOS SIMILARES ====================

    @Test
    @DisplayName("Espacios del mismo tipo deben tener alta similitud (40% peso)")
    void mismoTipoAltaSimilitud() {
        // Given
        when(espacioRepository.findById(espacioFrecuente.getId())).thenReturn(Optional.of(espacioFrecuente));
        when(espacioRepository.findAll()).thenReturn(Arrays.asList(espacioSimilar, espacioNuevo));

        // When
        List<RecomendacionEspacioDto> resultado = recomendacionReservaService.obtenerEspaciosSimilares(
            espacioFrecuente.getId(), usuarioId);

        // Then
        assertNotNull(resultado);
        assertFalse(resultado.isEmpty());

        // El primero debe ser espacioSimilar (mismo tipo, capacidad similar)
        assertEquals(espacioSimilar.getId(), resultado.get(0).getEspacioId());

        // Debe tener puntaje alto por tipo y capacidad
        assertTrue(resultado.get(0).getPuntaje().compareTo(BigDecimal.valueOf(0.6)) > 0,
            "Mismo tipo + capacidad similar = puntaje > 0.6");
    }

    @Test
    @DisplayName("Espacios con capacidad similar deben tener mejor puntaje (30% peso)")
    void capacidadSimilarMejorPuntaje() {
        // Given - Espacio original 30, Similar 32, Muy diferente 100
        Espacio espacioMuyDiferente = new Espacio();
        espacioMuyDiferente.setId(99L);
        espacioMuyDiferente.setNombre("Auditorio Gigante");
        espacioMuyDiferente.setCapacidad(200);
        espacioMuyDiferente.setTipoEspacioId(1L);
        espacioMuyDiferente.setTipoEspacio(tipoAula);
        espacioMuyDiferente.setEstado("DISPONIBLE");

        when(espacioRepository.findById(espacioFrecuente.getId())).thenReturn(Optional.of(espacioFrecuente));
        when(espacioRepository.findAll()).thenReturn(Arrays.asList(espacioSimilar, espacioMuyDiferente));

        // When
        List<RecomendacionEspacioDto> resultado = recomendacionReservaService.obtenerEspaciosSimilares(
            espacioFrecuente.getId(), usuarioId);

        // Then
        assertEquals(2, resultado.size());

        // espacioSimilar (cap 32) debe tener mejor puntaje que espacioMuyDiferente (cap 200)
        assertEquals(espacioSimilar.getId(), resultado.get(0).getEspacioId());
        assertTrue(resultado.get(0).getPuntaje().compareTo(resultado.get(1).getPuntaje()) > 0);
    }

    @Test
    @DisplayName("Debe retornar máximo 10 espacios similares")
    void maximoDiezEspaciosSimilares() {
        // Given - 15 espacios disponibles
        List<Espacio> muchosEspacios = new java.util.ArrayList<>();
        for (int i = 1; i <= 15; i++) {
            Espacio e = new Espacio();
            e.setId((long) (i + 100));
            e.setNombre("Espacio " + i);
            e.setCapacidad(25 + i);
            e.setTipoEspacioId(1L);
            e.setTipoEspacio(tipoAula);
            e.setEstado("DISPONIBLE");
            muchosEspacios.add(e);
        }

        when(espacioRepository.findById(espacioFrecuente.getId())).thenReturn(Optional.of(espacioFrecuente));
        when(espacioRepository.findAll()).thenReturn(muchosEspacios);

        // When
        List<RecomendacionEspacioDto> resultado = recomendacionReservaService.obtenerEspaciosSimilares(
            espacioFrecuente.getId(), usuarioId);

        // Then
        assertEquals(10, resultado.size(), "Debe retornar exactamente 10 espacios (top 10)");
    }

    // ==================== MÉTODOS AUXILIARES ====================

    private Reserva crearReserva(Long id, Espacio espacio, Reserva.EstadoReserva estado) {
        Reserva r = new Reserva();
        r.setId(id);
        r.setEspacio(espacio);
        r.setUsuario(usuarioTest);
        r.setEstado(estado);
        r.setInicio(Instant.now().minus(30, ChronoUnit.DAYS)); // Hace 30 días
        r.setFin(r.getInicio().plus(2, ChronoUnit.HOURS));
        return r;
    }

    private Reserva crearReservaEnHora(Long id, Espacio espacio, int hora) {
        Reserva r = new Reserva();
        r.setId(id);
        r.setEspacio(espacio);
        r.setUsuario(usuarioTest);
        r.setEstado(Reserva.EstadoReserva.APROBADO);

        Instant inicio = Instant.now().minus(15, ChronoUnit.DAYS)
            .atZone(java.time.ZoneOffset.UTC)
            .withHour(hora)
            .withMinute(0)
            .withSecond(0)
            .withNano(0)
            .toInstant();

        r.setInicio(inicio);
        r.setFin(inicio.plus(2, ChronoUnit.HOURS));
        return r;
    }
}
