package com.utec.backend.service;

import com.utec.backend.dto.inventario.InventarioItemCreateDto;
import com.utec.backend.dto.inventario.InventarioItemResponseDto;
import com.utec.backend.dto.inventario.InventarioItemUpdateDto;
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
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

import java.time.Instant;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("Tests para InventarioItemService")
class InventarioItemServiceTest {

    @Mock
    private InventarioItemRepository inventarioItemRepository;

    @Mock
    private EspacioRepository espacioRepository;

    @Mock
    private TipoElementoRepository tipoElementoRepository;

    @InjectMocks
    private InventarioItemService inventarioItemService;

    private InventarioItem itemTest;
    private Espacio espacioTest;
    private TipoElemento tipoElementoTest;
    private final Long itemId = 1L;
    private final String estadoDisponible = "DISPONIBLE";

    @BeforeEach
    void setUp() {
        espacioTest = new Espacio();
        espacioTest.setId(1L);
        espacioTest.setNombre("Aula 101");

        tipoElementoTest = new TipoElemento();
        tipoElementoTest.setId(1L);
        tipoElementoTest.setNombre("Proyector");

        itemTest = new InventarioItem();
        itemTest.setId(itemId);
        itemTest.setEspacio(espacioTest);
        itemTest.setTipoElemento(tipoElementoTest);
        itemTest.setCantidad(5);
        itemTest.setEstado(estadoDisponible);
        itemTest.setActivo(true);
        itemTest.setCreatedAt(Instant.now());
        itemTest.setUpdatedAt(Instant.now());
    }

    @Test
    @DisplayName("Debe crear item de inventario exitosamente con espacio")
    void debeCrearItemConEspacioExitosamente() {
        // Given
        InventarioItemCreateDto createDto = new InventarioItemCreateDto();
        createDto.setEspacioId(1L);
        createDto.setTipoElementoId(1L);
        createDto.setCantidad(3);
        createDto.setEstado("DISPONIBLE");

        when(espacioRepository.findById(1L)).thenReturn(Optional.of(espacioTest));
        when(tipoElementoRepository.findById(1L)).thenReturn(Optional.of(tipoElementoTest));
        when(inventarioItemRepository.save(any(InventarioItem.class))).thenReturn(itemTest);

        // When
        InventarioItemResponseDto resultado = inventarioItemService.createInventarioItem(createDto);

        // Then
        assertNotNull(resultado);
        verify(espacioRepository).findById(1L);
        verify(tipoElementoRepository).findById(1L);
        verify(inventarioItemRepository).save(any(InventarioItem.class));
    }

    @Test
    @DisplayName("Debe crear item de inventario sin espacio asignado")
    void debeCrearItemSinEspacio() {
        // Given
        InventarioItemCreateDto createDto = new InventarioItemCreateDto();
        createDto.setEspacioId(null);
        createDto.setTipoElementoId(1L);
        createDto.setCantidad(2);

        when(tipoElementoRepository.findById(1L)).thenReturn(Optional.of(tipoElementoTest));
        when(inventarioItemRepository.save(any(InventarioItem.class))).thenReturn(itemTest);

        // When
        InventarioItemResponseDto resultado = inventarioItemService.createInventarioItem(createDto);

        // Then
        assertNotNull(resultado);
        verify(espacioRepository, never()).findById(anyLong());
        verify(tipoElementoRepository).findById(1L);
    }

    @Test
    @DisplayName("Debe lanzar excepción cuando el espacio no existe")
    void debeLanzarExcepcionEspacioNoExiste() {
        // Given
        InventarioItemCreateDto createDto = new InventarioItemCreateDto();
        createDto.setEspacioId(999L);
        createDto.setTipoElementoId(1L);

        when(espacioRepository.findById(999L)).thenReturn(Optional.empty());

        // When & Then
        RuntimeException exception = assertThrows(RuntimeException.class, () -> {
            inventarioItemService.createInventarioItem(createDto);
        });

        assertTrue(exception.getMessage().contains("Espacio no encontrado"));
    }

    @Test
    @DisplayName("Debe lanzar excepción cuando el tipo de elemento no existe")
    void debeLanzarExcepcionTipoElementoNoExiste() {
        // Given
        InventarioItemCreateDto createDto = new InventarioItemCreateDto();
        createDto.setEspacioId(1L);
        createDto.setTipoElementoId(999L);

        when(espacioRepository.findById(1L)).thenReturn(Optional.of(espacioTest));
        when(tipoElementoRepository.findById(999L)).thenReturn(Optional.empty());

        // When & Then
        RuntimeException exception = assertThrows(RuntimeException.class, () -> {
            inventarioItemService.createInventarioItem(createDto);
        });

        assertTrue(exception.getMessage().contains("Tipo de elemento no encontrado"));
    }

    @Test
    @DisplayName("Debe obtener todos los items de inventario")
    void debeObtenerTodosLosItems() {
        // Given
        InventarioItem item2 = new InventarioItem();
        item2.setId(2L);
        item2.setEspacio(espacioTest);
        item2.setTipoElemento(tipoElementoTest);
        item2.setCantidad(3);
        item2.setEstado("DISPONIBLE");
        item2.setActivo(true);

        when(inventarioItemRepository.findAll()).thenReturn(Arrays.asList(itemTest, item2));

        // When
        List<InventarioItemResponseDto> resultado = inventarioItemService.getAllInventarioItems();

        // Then
        assertNotNull(resultado);
        assertEquals(2, resultado.size());
        verify(inventarioItemRepository).findAll();
    }

    @Test
    @DisplayName("Debe obtener items paginados")
    void debeObtenerItemsPaginados() {
        // Given
        Page<InventarioItem> page = new PageImpl<>(Arrays.asList(itemTest), PageRequest.of(0, 10), 1);

        when(inventarioItemRepository.findAll(any(org.springframework.data.domain.Pageable.class)))
                .thenReturn(page);

        // When
        Page<InventarioItemResponseDto> resultado = inventarioItemService
                .getAllInventarioItemsPaged(PageRequest.of(0, 10));

        // Then
        assertNotNull(resultado);
        assertEquals(1, resultado.getTotalElements());
    }

    @Test
    @DisplayName("Debe obtener item por ID")
    void debeObtenerItemPorId() {
        // Given
        when(inventarioItemRepository.findById(itemId)).thenReturn(Optional.of(itemTest));

        // When
        InventarioItemResponseDto resultado = inventarioItemService.getInventarioItemById(itemId);

        // Then
        assertNotNull(resultado);
        assertEquals(itemId, resultado.getId());
        verify(inventarioItemRepository).findById(itemId);
    }

    @Test
    @DisplayName("Debe lanzar excepción cuando el item no existe")
    void debeLanzarExcepcionItemNoExiste() {
        // Given
        Long idInexistente = 999L;
        when(inventarioItemRepository.findById(idInexistente)).thenReturn(Optional.empty());

        // When & Then
        assertThrows(RuntimeException.class, () -> {
            inventarioItemService.getInventarioItemById(idInexistente);
        });
    }

    @Test
    @DisplayName("Debe actualizar item exitosamente")
    void debeActualizarItemExitosamente() {
        // Given
        InventarioItemUpdateDto updateDto = new InventarioItemUpdateDto();
        updateDto.setEspacioId(1L);
        updateDto.setTipoElementoId(1L);
        updateDto.setCantidad(10);
        updateDto.setEstado("MANTENIMIENTO");

        when(inventarioItemRepository.findById(itemId)).thenReturn(Optional.of(itemTest));
        when(espacioRepository.findById(1L)).thenReturn(Optional.of(espacioTest));
        when(tipoElementoRepository.findById(1L)).thenReturn(Optional.of(tipoElementoTest));
        when(inventarioItemRepository.save(any(InventarioItem.class))).thenReturn(itemTest);

        // When
        InventarioItemResponseDto resultado = inventarioItemService.updateInventarioItem(itemId, updateDto);

        // Then
        assertNotNull(resultado);
        verify(inventarioItemRepository).findById(itemId);
        verify(inventarioItemRepository).save(itemTest);
    }

    @Test
    @DisplayName("Debe desasignar espacio al actualizar con espacioId null")
    void debeDesasignarEspacio() {
        // Given
        InventarioItemUpdateDto updateDto = new InventarioItemUpdateDto();
        updateDto.setEspacioId(null);
        updateDto.setTipoElementoId(1L);

        when(inventarioItemRepository.findById(itemId)).thenReturn(Optional.of(itemTest));
        when(tipoElementoRepository.findById(1L)).thenReturn(Optional.of(tipoElementoTest));
        when(inventarioItemRepository.save(any(InventarioItem.class))).thenReturn(itemTest);

        // When
        inventarioItemService.updateInventarioItem(itemId, updateDto);

        // Then
        verify(inventarioItemRepository).save(itemTest);
    }

    @Test
    @DisplayName("Debe eliminar item exitosamente (soft delete)")
    void debeEliminarItemExitosamente() {
        // Given
        when(inventarioItemRepository.findById(itemId)).thenReturn(Optional.of(itemTest));
        when(inventarioItemRepository.save(any(InventarioItem.class))).thenReturn(itemTest);

        // When
        assertDoesNotThrow(() -> inventarioItemService.deleteInventarioItem(itemId));

        // Then
        verify(inventarioItemRepository).findById(itemId);
        verify(inventarioItemRepository).save(itemTest);
        assertFalse(itemTest.getActivo());
        assertNotNull(itemTest.getDeletedAt());
    }

    @Test
    @DisplayName("Debe obtener inventario por espacio")
    void debeObtenerInventarioPorEspacio() {
        // Given
        Long espacioId = 1L;
        when(inventarioItemRepository.findByEspacioIdAndActivoTrue(espacioId))
                .thenReturn(Arrays.asList(itemTest));

        // When
        List<InventarioItemResponseDto> resultado = inventarioItemService.getInventarioByEspacio(espacioId);

        // Then
        assertNotNull(resultado);
        assertEquals(1, resultado.size());
        verify(inventarioItemRepository).findByEspacioIdAndActivoTrue(espacioId);
    }

    @Test
    @DisplayName("Debe obtener inventario por tipo de elemento")
    void debeObtenerInventarioPorTipoElemento() {
        // Given
        Long tipoElementoId = 1L;
        when(inventarioItemRepository.findByTipoElementoIdAndActivoTrue(tipoElementoId))
                .thenReturn(Arrays.asList(itemTest));

        // When
        List<InventarioItemResponseDto> resultado = inventarioItemService.getInventarioByTipoElemento(tipoElementoId);

        // Then
        assertNotNull(resultado);
        assertEquals(1, resultado.size());
        verify(inventarioItemRepository).findByTipoElementoIdAndActivoTrue(tipoElementoId);
    }

    @Test
    @DisplayName("Debe obtener inventario por estado")
    void debeObtenerInventarioPorEstado() {
        // Given
        when(inventarioItemRepository.findByEstadoAndActivoTrue(estadoDisponible))
                .thenReturn(Arrays.asList(itemTest));

        // When
        List<InventarioItemResponseDto> resultado = inventarioItemService.getInventarioByEstado(estadoDisponible);

        // Then
        assertNotNull(resultado);
        assertEquals(1, resultado.size());
        verify(inventarioItemRepository).findByEstadoAndActivoTrue(estadoDisponible);
    }

    @Test
    @DisplayName("Debe obtener estadísticas de inventario")
    void debeObtenerEstadisticasInventario() {
        // Given
        InventarioItem item2 = new InventarioItem();
        item2.setEstado("MANTENIMIENTO");
        item2.setActivo(true);

        when(inventarioItemRepository.countTotalItems()).thenReturn(2L);
        when(inventarioItemRepository.findAll()).thenReturn(Arrays.asList(itemTest, item2));

        // When
        Map<String, Object> stats = inventarioItemService.getInventarioStatistics();

        // Then
        assertNotNull(stats);
        assertEquals(2L, stats.get("totalItems"));
        verify(inventarioItemRepository).countTotalItems();
    }

    @Test
    @DisplayName("Debe filtrar inventario con búsqueda")
    void debeFiltrarInventarioConBusqueda() {
        // Given
        when(inventarioItemRepository.findAll()).thenReturn(Arrays.asList(itemTest));

        // When
        List<InventarioItemResponseDto> resultado = inventarioItemService.filterInventario(
                "Proyector", null, null, null, null, null, null);

        // Then
        assertNotNull(resultado);
    }

    @Test
    @DisplayName("Debe filtrar inventario sin asignar")
    void debeFiltrarInventarioSinAsignar() {
        // Given
        InventarioItem itemSinEspacio = new InventarioItem();
        itemSinEspacio.setId(2L);
        itemSinEspacio.setEspacio(null);
        itemSinEspacio.setTipoElemento(tipoElementoTest);
        itemSinEspacio.setActivo(true);

        when(inventarioItemRepository.findAll()).thenReturn(Arrays.asList(itemTest, itemSinEspacio));

        // When
        List<InventarioItemResponseDto> resultado = inventarioItemService.filterInventario(
                null, null, null, null, true, null, null);

        // Then
        assertNotNull(resultado);
    }
}
