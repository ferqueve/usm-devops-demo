package com.utec.backend.service;

import com.utec.backend.model.Espacio;
import com.utec.backend.model.InventarioItem;
import com.utec.backend.model.TipoElemento;
import com.utec.backend.repository.EspacioRepository;
import com.utec.backend.repository.InventarioItemRepository;
import com.utec.backend.repository.TipoElementoRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.Arrays;
import java.util.Collections;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("Tests para StatisticsService")
class StatisticsServiceTest {

    @Mock
    private InventarioItemRepository inventarioItemRepository;

    @Mock
    private EspacioRepository espacioRepository;

    @Mock
    private TipoElementoRepository tipoElementoRepository;

    @InjectMocks
    private StatisticsService statisticsService;

    private InventarioItem itemTest;
    private Espacio espacioTest;
    private TipoElemento tipoElementoTest;

    @BeforeEach
    void setUp() {
        tipoElementoTest = new TipoElemento();
        tipoElementoTest.setId(1L);
        tipoElementoTest.setNombre("Proyector");
        tipoElementoTest.setActivo(true);

        espacioTest = new Espacio();
        espacioTest.setId(1L);
        espacioTest.setNombre("Aula 101");

        itemTest = new InventarioItem();
        itemTest.setId(1L);
        itemTest.setTipoElemento(tipoElementoTest);
        itemTest.setEspacio(espacioTest);
        itemTest.setCantidad(1);
        itemTest.setEstado("DISPONIBLE");
        itemTest.setActivo(true);
        itemTest.setCreatedAt(Instant.now());
        itemTest.setUpdatedAt(Instant.now());
    }

    @Test
    @DisplayName("Debe obtener estadísticas detalladas de inventario")
    void debeObtenerEstadisticasDetalladas() {
        // Given
        when(inventarioItemRepository.findAll()).thenReturn(Arrays.asList(itemTest));
        when(espacioRepository.findAll()).thenReturn(Arrays.asList(espacioTest));
        when(tipoElementoRepository.findAll()).thenReturn(Arrays.asList(tipoElementoTest));
        when(inventarioItemRepository.count()).thenReturn(1L);

        // When
        Map<String, Object> resultado = statisticsService.getDetailedInventarioStatistics(null, null, null);

        // Then
        assertNotNull(resultado);
        assertTrue(resultado.containsKey("totalItems"));
        assertTrue(resultado.containsKey("disponibles"));
        verify(inventarioItemRepository, atLeastOnce()).findAll();
    }

    @Test
    @DisplayName("Debe obtener estadísticas con filtro por espacio")
    void debeObtenerEstadisticasConFiltroPorEspacio() {
        // Given
        Long espacioId = 1L;
        when(inventarioItemRepository.findAll()).thenReturn(Arrays.asList(itemTest));
        when(espacioRepository.findAll()).thenReturn(Arrays.asList(espacioTest));
        when(tipoElementoRepository.findAll()).thenReturn(Arrays.asList(tipoElementoTest));
        when(inventarioItemRepository.count()).thenReturn(1L);

        // When
        Map<String, Object> resultado = statisticsService.getDetailedInventarioStatistics(espacioId, null, null);

        // Then
        assertNotNull(resultado);
        verify(inventarioItemRepository, atLeastOnce()).findAll();
    }

    @Test
    @DisplayName("Debe obtener estadísticas con filtro por tipo de elemento")
    void debeObtenerEstadisticasConFiltroPorTipoElemento() {
        // Given
        Long tipoElementoId = 1L;
        when(inventarioItemRepository.findAll()).thenReturn(Arrays.asList(itemTest));
        when(espacioRepository.findAll()).thenReturn(Arrays.asList(espacioTest));
        when(tipoElementoRepository.findAll()).thenReturn(Arrays.asList(tipoElementoTest));
        when(inventarioItemRepository.count()).thenReturn(1L);

        // When
        Map<String, Object> resultado = statisticsService.getDetailedInventarioStatistics(null, tipoElementoId, null);

        // Then
        assertNotNull(resultado);
        verify(inventarioItemRepository, atLeastOnce()).findAll();
    }

    @Test
    @DisplayName("Debe obtener estadísticas con filtro por estado")
    void debeObtenerEstadisticasConFiltroPorEstado() {
        // Given
        String estado = "DISPONIBLE";
        when(inventarioItemRepository.findAll()).thenReturn(Arrays.asList(itemTest));
        when(espacioRepository.findAll()).thenReturn(Arrays.asList(espacioTest));
        when(tipoElementoRepository.findAll()).thenReturn(Arrays.asList(tipoElementoTest));
        when(inventarioItemRepository.count()).thenReturn(1L);

        // When
        Map<String, Object> resultado = statisticsService.getDetailedInventarioStatistics(null, null, estado);

        // Then
        assertNotNull(resultado);
        verify(inventarioItemRepository, atLeastOnce()).findAll();
    }

    @Test
    @DisplayName("Debe calcular estadísticas correctamente con items vacíos")
    void debeCalcularEstadisticasConItemsVacios() {
        // Given
        when(inventarioItemRepository.findAll()).thenReturn(Collections.emptyList());
        when(espacioRepository.findAll()).thenReturn(Arrays.asList(espacioTest));
        when(tipoElementoRepository.findAll()).thenReturn(Arrays.asList(tipoElementoTest));
        when(inventarioItemRepository.count()).thenReturn(0L);

        // When
        Map<String, Object> resultado = statisticsService.getDetailedInventarioStatistics(null, null, null);

        // Then
        assertNotNull(resultado);
        assertEquals(0, resultado.get("totalItems"));
        assertEquals(0.0, resultado.get("porcentajeDisponibles"));
    }
}

