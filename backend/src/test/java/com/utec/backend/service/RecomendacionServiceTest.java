package com.utec.backend.service;

import com.utec.backend.dto.recomendacion.DashboardRecomendacionesDto;
import com.utec.backend.dto.recomendacion.RecomendacionEspacioDto;
import com.utec.backend.model.Espacio;
import com.utec.backend.model.TipoRecomendacion;
import com.utec.backend.model.Usuario;
import com.utec.backend.repository.EspacioRepository;
import com.utec.backend.repository.RecomendacionRepository;
import com.utec.backend.repository.UsuarioRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.ValueOperations;

import com.fasterxml.jackson.databind.ObjectMapper;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("Tests para RecomendacionService")
class RecomendacionServiceTest {

    @Mock
    private RecomendacionRepository recomendacionRepository;

    @Mock
    private UsuarioRepository usuarioRepository;

    @Mock
    private EspacioRepository espacioRepository;

    @Mock
    private RedisTemplate<String, Object> redisTemplate;

    private ObjectMapper objectMapper = new ObjectMapper();

    @Mock
    private RecomendacionReservaService recomendacionReservaService;

    @Mock
    private RecomendacionInventarioService recomendacionInventarioService;

    @Mock
    private RecomendacionItemService recomendacionItemService;

    @Mock
    private RecomendacionAnalistaService recomendacionAnalistaService;

    @Mock
    private ValueOperations<String, Object> valueOperations;

    @InjectMocks
    private RecomendacionService recomendacionService;
    
    @BeforeEach
    void initService() {
        // Inyectar objectMapper manualmente ya que no es un mock
        recomendacionService = new RecomendacionService(
            recomendacionRepository,
            usuarioRepository,
            espacioRepository,
            redisTemplate,
            objectMapper,
            recomendacionReservaService,
            recomendacionInventarioService,
            recomendacionItemService,
            recomendacionAnalistaService
        );
    }

    private Usuario usuarioTest;
    private Espacio espacioTest;
    private final Long usuarioId = 1L;
    private final Long espacioId = 1L;

    @BeforeEach
    void setUp() {
        usuarioTest = new Usuario();
        usuarioTest.setId(usuarioId);
        usuarioTest.setEmail("test@utec.edu.uy");
        usuarioTest.setNombre("Test User");
        usuarioTest.setRolApp(Usuario.RolApp.DOCENTE);

        espacioTest = new Espacio();
        espacioTest.setId(espacioId);
        espacioTest.setNombre("Aula 101");
        espacioTest.setCapacidad(30);
        espacioTest.setTipoEspacioId(1L);
        espacioTest.setEstado("DISPONIBLE");

        lenient().when(redisTemplate.opsForValue()).thenReturn(valueOperations);
    }

    @Test
    @DisplayName("Debe invalidar caché de recomendaciones")
    void debeInvalidarCacheRecomendaciones() {
        // Given
        when(redisTemplate.delete(anyString())).thenReturn(true);

        // When
        recomendacionService.invalidarCacheRecomendaciones(usuarioId);

        // Then
        verify(redisTemplate).delete("recomendaciones:usuario:" + usuarioId);
    }

    @Test
    @DisplayName("Debe guardar top 20 recomendaciones en BD")
    void debeGuardarTop20EnBD() {
        // Given
        RecomendacionEspacioDto dto = new RecomendacionEspacioDto();
        dto.setEspacioId(espacioId);
        dto.setTipoRecomendacion(TipoRecomendacion.ESPACIO_PARA_RESERVA);
        dto.setPuntaje(BigDecimal.valueOf(8.5));
        dto.setRazon("Espacio muy utilizado");
        dto.setCapacidad(30);
        dto.setTipoEspacioId(1L);

        List<RecomendacionEspacioDto> recomendaciones = Arrays.asList(dto);
        
        when(usuarioRepository.getReferenceById(usuarioId)).thenReturn(usuarioTest);
        when(espacioRepository.getReferenceById(espacioId)).thenReturn(espacioTest);
        doNothing().when(recomendacionRepository).deleteByUsuarioId(usuarioId);
        when(recomendacionRepository.saveAll(anyList())).thenReturn(Collections.emptyList());
        // ObjectMapper es real, no necesita mock

        // When
        recomendacionService.guardarTop20EnBD(usuarioId, recomendaciones);

        // Then
        verify(recomendacionRepository).deleteByUsuarioId(usuarioId);
        verify(recomendacionRepository).saveAll(anyList());
    }

    @Test
    @DisplayName("Debe obtener recomendaciones de espacios")
    void debeObtenerRecomendacionesEspacios() {
        // Given
        Instant inicio = Instant.now();
        Instant fin = inicio.plusSeconds(86400);
        RecomendacionEspacioDto dto = new RecomendacionEspacioDto();
        dto.setEspacioId(espacioId);
        
        when(recomendacionReservaService.obtenerRecomendacionesEspacios(usuarioId, inicio, fin, null))
                .thenReturn(Arrays.asList(dto));

        // When
        List<RecomendacionEspacioDto> resultado = recomendacionService.obtenerRecomendacionesEspacios(usuarioId, inicio, fin, null);

        // Then
        assertNotNull(resultado);
        assertEquals(1, resultado.size());
        verify(recomendacionReservaService).obtenerRecomendacionesEspacios(usuarioId, inicio, fin, null);
    }

    @Test
    @DisplayName("Debe obtener horarios óptimos")
    void debeObtenerHorariosOptimos() {
        // Given
        Instant fecha = Instant.now();
        when(recomendacionReservaService.obtenerHorariosOptimos(usuarioId, espacioId, fecha))
                .thenReturn(Collections.emptyList());

        // When
        var resultado = recomendacionService.obtenerHorariosOptimos(usuarioId, espacioId, fecha);

        // Then
        assertNotNull(resultado);
        verify(recomendacionReservaService).obtenerHorariosOptimos(usuarioId, espacioId, fecha);
    }

    @Test
    @DisplayName("Debe obtener espacios similares")
    void debeObtenerEspaciosSimilares() {
        // Given
        RecomendacionEspacioDto dto = new RecomendacionEspacioDto();
        dto.setEspacioId(2L);
        when(recomendacionReservaService.obtenerEspaciosSimilares(espacioId, usuarioId))
                .thenReturn(Arrays.asList(dto));

        // When
        List<RecomendacionEspacioDto> resultado = recomendacionService.obtenerEspaciosSimilares(espacioId, usuarioId);

        // Then
        assertNotNull(resultado);
        assertEquals(1, resultado.size());
        verify(recomendacionReservaService).obtenerEspaciosSimilares(espacioId, usuarioId);
    }

    @Test
    @DisplayName("Debe obtener items de mantenimiento urgente")
    void debeObtenerItemsMantenimientoUrgente() {
        // Given
        when(recomendacionInventarioService.obtenerItemsMantenimientoUrgente())
                .thenReturn(Collections.emptyList());

        // When
        var resultado = recomendacionService.obtenerItemsMantenimientoUrgente();

        // Then
        assertNotNull(resultado);
        verify(recomendacionInventarioService).obtenerItemsMantenimientoUrgente();
    }

    @Test
    @DisplayName("Debe obtener recomendaciones del dashboard para DOCENTE")
    void debeObtenerRecomendacionesDashboardDocente() {
        // Given
        RecomendacionEspacioDto dto = new RecomendacionEspacioDto();
        dto.setEspacioId(espacioId);
        when(recomendacionReservaService.obtenerRecomendacionesEspacios(eq(usuarioId), any(Instant.class), any(Instant.class), isNull()))
                .thenReturn(Arrays.asList(dto));

        // When
        DashboardRecomendacionesDto resultado = recomendacionService.obtenerRecomendacionesDashboard(usuarioId, Usuario.RolApp.DOCENTE);

        // Then
        assertNotNull(resultado);
        assertNotNull(resultado.getEspaciosRecomendados());
        assertEquals(1, resultado.getEspaciosRecomendados().size());
        verify(recomendacionReservaService).obtenerRecomendacionesEspacios(eq(usuarioId), any(Instant.class), any(Instant.class), isNull());
    }

    @Test
    @DisplayName("Debe obtener recomendaciones del dashboard para ANALISTA")
    void debeObtenerRecomendacionesDashboardAnalista() {
        // Given
        when(recomendacionAnalistaService.obtenerReservasPrioritarias(usuarioId))
                .thenReturn(Collections.emptyList());

        // When
        DashboardRecomendacionesDto resultado = recomendacionService.obtenerRecomendacionesDashboard(usuarioId, Usuario.RolApp.ANALISTA);

        // Then
        assertNotNull(resultado);
        verify(recomendacionAnalistaService).obtenerReservasPrioritarias(usuarioId);
    }

    @Test
    @DisplayName("Debe obtener recomendaciones del dashboard para MANTENIMIENTO")
    void debeObtenerRecomendacionesDashboardMantenimiento() {
        // Given
        when(recomendacionInventarioService.obtenerItemsMantenimientoUrgente())
                .thenReturn(Collections.emptyList());
        when(recomendacionInventarioService.obtenerEspaciosAtencion())
                .thenReturn(Collections.emptyList());

        // When
        DashboardRecomendacionesDto resultado = recomendacionService.obtenerRecomendacionesDashboard(usuarioId, Usuario.RolApp.MANTENIMIENTO);

        // Then
        assertNotNull(resultado);
        verify(recomendacionInventarioService).obtenerItemsMantenimientoUrgente();
        verify(recomendacionInventarioService).obtenerEspaciosAtencion();
    }

    @Test
    @DisplayName("Debe obtener recomendaciones del dashboard para ADMIN")
    void debeObtenerRecomendacionesDashboardAdmin() {
        // Given
        when(recomendacionInventarioService.obtenerItemsMantenimientoUrgente())
                .thenReturn(Collections.emptyList());
        when(recomendacionInventarioService.obtenerEspaciosAtencion())
                .thenReturn(Collections.emptyList());

        // When
        DashboardRecomendacionesDto resultado = recomendacionService.obtenerRecomendacionesDashboard(usuarioId, Usuario.RolApp.ADMIN);

        // Then
        assertNotNull(resultado);
        verify(recomendacionInventarioService).obtenerItemsMantenimientoUrgente();
        verify(recomendacionInventarioService).obtenerEspaciosAtencion();
    }

    @Test
    @DisplayName("Debe obtener analista recomendado")
    void debeObtenerAnalistaRecomendado() {
        // Given
        Long docenteId = 2L;
        when(recomendacionAnalistaService.obtenerAnalistaRecomendado(docenteId))
                .thenReturn(Collections.emptyList());

        // When
        var resultado = recomendacionService.obtenerAnalistaRecomendado(docenteId);

        // Then
        assertNotNull(resultado);
        verify(recomendacionAnalistaService).obtenerAnalistaRecomendado(docenteId);
    }

    @Test
    @DisplayName("Debe obtener items recomendados para reserva")
    void debeObtenerItemsRecomendadosParaReserva() {
        // Given
        when(recomendacionItemService.obtenerItemsRecomendadosParaReserva(espacioId, usuarioId))
                .thenReturn(Collections.emptyList());

        // When
        var resultado = recomendacionService.obtenerItemsRecomendadosParaReserva(espacioId, usuarioId);

        // Then
        assertNotNull(resultado);
        verify(recomendacionItemService).obtenerItemsRecomendadosParaReserva(espacioId, usuarioId);
    }
}

