package com.utec.backend.service;

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

import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("Tests extendidos para InventarioItemService - Lógica de negocio completa")
class InventarioItemServiceExtendedTest {

    @Mock
    private InventarioItemRepository inventarioItemRepository;

    @Mock
    private EspacioRepository espacioRepository;

    @Mock
    private TipoElementoRepository tipoElementoRepository;

    @InjectMocks
    private InventarioItemService inventarioItemService;

    private Espacio espacioAula101;
    private Espacio espacioAula102;
    private Espacio espacioLaboratorio;
    private TipoElemento tipoProyector;
    private TipoElemento tipoPizarra;
    private TipoElemento tipoComputadora;

    @BeforeEach
    void setUp() {

        // Espacios
        espacioAula101 = new Espacio();
        espacioAula101.setId(1L);
        espacioAula101.setNombre("Aula 101");

        espacioAula102 = new Espacio();
        espacioAula102.setId(2L);
        espacioAula102.setNombre("Aula 102");

        espacioLaboratorio = new Espacio();
        espacioLaboratorio.setId(3L);
        espacioLaboratorio.setNombre("Laboratorio Informática");

        // Tipos de elemento
        tipoProyector = new TipoElemento();
        tipoProyector.setId(1L);
        tipoProyector.setNombre("Proyector");

        tipoPizarra = new TipoElemento();
        tipoPizarra.setId(2L);
        tipoPizarra.setNombre("Pizarra Digital");

        tipoComputadora = new TipoElemento();
        tipoComputadora.setId(3L);
        tipoComputadora.setNombre("Computadora");

        // Setup lenient mocks
        lenient().when(espacioRepository.findById(1L)).thenReturn(Optional.of(espacioAula101));
        lenient().when(espacioRepository.findById(2L)).thenReturn(Optional.of(espacioAula102));
        lenient().when(espacioRepository.findById(3L)).thenReturn(Optional.of(espacioLaboratorio));
        lenient().when(tipoElementoRepository.findById(1L)).thenReturn(Optional.of(tipoProyector));
        lenient().when(tipoElementoRepository.findById(2L)).thenReturn(Optional.of(tipoPizarra));
        lenient().when(tipoElementoRepository.findById(3L)).thenReturn(Optional.of(tipoComputadora));
    }

    // ============================================
    // TESTS DE TRANSICIONES DE ESTADO
    // ============================================

    @Test
    @DisplayName("Item debe transicionar de DISPONIBLE → MANTENIMIENTO → DISPONIBLE")
    void itemDebeTransicionarDisponibleMantenimientoDisponible() {
        // PASO 1: Crear item DISPONIBLE
        InventarioItem item = crearItem(1L, espacioAula101, tipoProyector, 2, "DISPONIBLE");

        when(inventarioItemRepository.findById(1L)).thenReturn(Optional.of(item));
        when(inventarioItemRepository.save(any(InventarioItem.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // PASO 2: Actualizar a MANTENIMIENTO
        InventarioItemUpdateDto updateToMantenimiento = new InventarioItemUpdateDto();
        updateToMantenimiento.setEstado("MANTENIMIENTO");
        updateToMantenimiento.setTipoElementoId(1L);

        inventarioItemService.updateInventarioItem(1L, updateToMantenimiento);
        assertEquals("MANTENIMIENTO", item.getEstado(), "Estado debe cambiar a MANTENIMIENTO");

        // PASO 3: Volver a DISPONIBLE
        InventarioItemUpdateDto updateToDisponible = new InventarioItemUpdateDto();
        updateToDisponible.setEstado("DISPONIBLE");
        updateToDisponible.setTipoElementoId(1L);

        inventarioItemService.updateInventarioItem(1L, updateToDisponible);
        assertEquals("DISPONIBLE", item.getEstado(), "Estado debe volver a DISPONIBLE");

        verify(inventarioItemRepository, times(2)).save(item);
    }

    @Test
    @DisplayName("Item debe poder cambiar a estado DANADO y quedar marcado")
    void itemDebeCambiarAEstadoDanado() {
        InventarioItem item = crearItem(1L, espacioAula101, tipoProyector, 1, "DISPONIBLE");

        when(inventarioItemRepository.findById(1L)).thenReturn(Optional.of(item));
        when(inventarioItemRepository.save(any(InventarioItem.class))).thenAnswer(invocation -> invocation.getArgument(0));

        InventarioItemUpdateDto updateDto = new InventarioItemUpdateDto();
        updateDto.setEstado("DANADO");
        updateDto.setTipoElementoId(1L);

        inventarioItemService.updateInventarioItem(1L, updateDto);

        assertEquals("DANADO", item.getEstado(), "Estado debe ser DANADO");
        assertNotNull(item.getUpdatedAt(), "updatedAt debe actualizarse");
    }

    @Test
    @DisplayName("Múltiples items en diferentes estados deben mantener sus estados independientes")
    void multiplesItemsEnDiferentesEstadosMantenerIndependencia() {
        InventarioItem item1 = crearItem(1L, espacioAula101, tipoProyector, 3, "DISPONIBLE");
        InventarioItem item2 = crearItem(2L, espacioAula102, tipoProyector, 2, "MANTENIMIENTO");
        InventarioItem item3 = crearItem(3L, espacioLaboratorio, tipoComputadora, 5, "DANADO");

        when(inventarioItemRepository.findAll()).thenReturn(Arrays.asList(item1, item2, item3));

        List<InventarioItemResponseDto> items = inventarioItemService.getAllInventarioItems();

        assertEquals(3, items.size());
        // Verificar que cada item mantiene su estado
        Map<Long, String> estadosPorId = items.stream()
            .collect(Collectors.toMap(InventarioItemResponseDto::getId, InventarioItemResponseDto::getEstado));

        assertEquals("DISPONIBLE", estadosPorId.get(1L));
        assertEquals("MANTENIMIENTO", estadosPorId.get(2L));
        assertEquals("DANADO", estadosPorId.get(3L));
    }

    // ============================================
    // TESTS DE ASIGNACIÓN Y REASIGNACIÓN
    // ============================================

    @Test
    @DisplayName("FLUJO: Item creado asignado → reasignado a otro espacio → desasignado")
    void flujoItemAsignadoReasignadoDesasignado() {
        // PASO 1: Crear item asignado a Aula 101
        InventarioItem item = crearItem(1L, espacioAula101, tipoProyector, 1, "DISPONIBLE");

        when(inventarioItemRepository.findById(1L)).thenReturn(Optional.of(item));
        when(inventarioItemRepository.save(any(InventarioItem.class))).thenAnswer(invocation -> invocation.getArgument(0));

        assertEquals(1L, item.getEspacio().getId(), "Debe estar asignado a Aula 101 inicialmente");

        // PASO 2: Reasignar a Aula 102
        InventarioItemUpdateDto updateToAula102 = new InventarioItemUpdateDto();
        updateToAula102.setEspacioId(2L);
        updateToAula102.setTipoElementoId(1L);
        updateToAula102.setCantidad(1);
        updateToAula102.setEstado("DISPONIBLE");

        inventarioItemService.updateInventarioItem(1L, updateToAula102);

        assertEquals(2L, item.getEspacio().getId(), "Debe reasignarse a Aula 102");

        // PASO 3: Desasignar (0 = sin espacio)
        InventarioItemUpdateDto updateToNull = new InventarioItemUpdateDto();
        updateToNull.setEspacioId(0L);
        updateToNull.setTipoElementoId(1L);
        updateToNull.setCantidad(1);
        updateToNull.setEstado("DISPONIBLE");

        inventarioItemService.updateInventarioItem(1L, updateToNull);

        assertNull(item.getEspacio(), "Debe quedar sin espacio asignado");

        verify(inventarioItemRepository, times(2)).save(item);
    }

    @Test
    @DisplayName("Múltiples items del mismo tipo asignados a diferentes espacios")
    void multiplesItemsMismoTipoDiferentesEspacios() {
        InventarioItem proyector1 = crearItem(1L, espacioAula101, tipoProyector, 1, "DISPONIBLE");
        InventarioItem proyector2 = crearItem(2L, espacioAula102, tipoProyector, 1, "DISPONIBLE");
        InventarioItem proyector3 = crearItem(3L, espacioLaboratorio, tipoProyector, 1, "DISPONIBLE");

        when(inventarioItemRepository.findByTipoElementoIdAndActivoTrue(1L))
            .thenReturn(Arrays.asList(proyector1, proyector2, proyector3));

        List<InventarioItemResponseDto> proyectores = inventarioItemService.getInventarioByTipoElemento(1L);

        assertEquals(3, proyectores.size());

        // Verificar que están en espacios diferentes
        Set<Long> espaciosIds = proyectores.stream()
            .map(InventarioItemResponseDto::getEspacioId)
            .collect(Collectors.toSet());

        assertEquals(3, espaciosIds.size(), "Los 3 proyectores deben estar en espacios diferentes");
        assertTrue(espaciosIds.contains(1L), "Debe haber proyector en Aula 101");
        assertTrue(espaciosIds.contains(2L), "Debe haber proyector en Aula 102");
        assertTrue(espaciosIds.contains(3L), "Debe haber proyector en Laboratorio");
    }

    @Test
    @DisplayName("Mismo espacio puede tener múltiples items de diferentes tipos")
    void mismoEspacioMultiplesItemsDiferentesTipos() {
        InventarioItem proyector = crearItem(1L, espacioAula101, tipoProyector, 1, "DISPONIBLE");
        InventarioItem pizarra = crearItem(2L, espacioAula101, tipoPizarra, 1, "DISPONIBLE");
        InventarioItem computadora = crearItem(3L, espacioAula101, tipoComputadora, 10, "DISPONIBLE");

        when(inventarioItemRepository.findByEspacioIdAndActivoTrue(1L))
            .thenReturn(Arrays.asList(proyector, pizarra, computadora));

        List<InventarioItemResponseDto> itemsEnAula101 = inventarioItemService.getInventarioByEspacio(1L);

        assertEquals(3, itemsEnAula101.size());

        // Verificar tipos diferentes
        Set<String> tiposElementos = itemsEnAula101.stream()
            .map(InventarioItemResponseDto::getTipoElementoNombre)
            .collect(Collectors.toSet());

        assertEquals(3, tiposElementos.size(), "Debe haber 3 tipos diferentes");
        assertTrue(tiposElementos.contains("Proyector"));
        assertTrue(tiposElementos.contains("Pizarra Digital"));
        assertTrue(tiposElementos.contains("Computadora"));
    }

    // ============================================
    // TESTS DE FILTRADO COMPLEJO
    // ============================================

    @Test
    @DisplayName("getInventarioByEspacio debe retornar solo items de ese espacio")
    void getInventarioByEspacioDebeFiltrarCorrectamente() {
        InventarioItem item1 = crearItem(1L, espacioAula101, tipoProyector, 1, "DISPONIBLE");
        InventarioItem item3 = crearItem(3L, espacioAula101, tipoPizarra, 1, "DISPONIBLE");

        List<InventarioItem> itemsAula101 = Arrays.asList(item1, item3);

        when(inventarioItemRepository.findByEspacioIdAndActivoTrue(1L))
            .thenReturn(itemsAula101);

        List<InventarioItemResponseDto> resultado = inventarioItemService.getInventarioByEspacio(1L);

        assertEquals(2, resultado.size(), "Debe haber 2 items en Aula 101");
        assertTrue(resultado.stream().allMatch(item -> item.getEspacioId().equals(1L)),
            "Todos los items deben ser del Aula 101");
    }

    @Test
    @DisplayName("getInventarioByTipoElemento debe retornar solo items de ese tipo")
    void getInventarioByTipoElementoDebeFiltrarCorrectamente() {
        InventarioItem item1 = crearItem(1L, espacioAula101, tipoProyector, 1, "DISPONIBLE");
        InventarioItem item2 = crearItem(2L, espacioAula102, tipoProyector, 1, "DISPONIBLE");

        List<InventarioItem> proyectores = Arrays.asList(item1, item2);

        when(inventarioItemRepository.findByTipoElementoIdAndActivoTrue(1L))
            .thenReturn(proyectores);

        List<InventarioItemResponseDto> resultado = inventarioItemService.getInventarioByTipoElemento(1L);

        assertEquals(2, resultado.size(), "Debe haber 2 proyectores");
        assertTrue(resultado.stream().allMatch(item -> item.getTipoElementoId().equals(1L)),
            "Todos los items deben ser proyectores");
    }

    @Test
    @DisplayName("getInventarioByEstado debe retornar solo items en ese estado")
    void getInventarioByEstadoDebeFiltrarCorrectamente() {
        InventarioItem item1 = crearItem(1L, espacioAula101, tipoProyector, 1, "DISPONIBLE");
        InventarioItem item3 = crearItem(3L, espacioAula101, tipoPizarra, 1, "DISPONIBLE");

        List<InventarioItem> disponibles = Arrays.asList(item1, item3);

        when(inventarioItemRepository.findByEstadoAndActivoTrue("DISPONIBLE"))
            .thenReturn(disponibles);

        List<InventarioItemResponseDto> resultado = inventarioItemService.getInventarioByEstado("DISPONIBLE");

        assertEquals(2, resultado.size(), "Debe haber 2 items disponibles");
        assertTrue(resultado.stream().allMatch(item -> item.getEstado().equals("DISPONIBLE")),
            "Todos los items deben estar DISPONIBLE");
    }

    @Test
    @DisplayName("filterInventario con sinAsignar=true debe retornar solo items sin espacio")
    void filterInventarioDebeFiltrarItemsSinAsignar() {
        InventarioItem item1 = crearItem(1L, espacioAula101, tipoProyector, 1, "DISPONIBLE");
        InventarioItem item2 = crearItem(2L, null, tipoProyector, 2, "DISPONIBLE"); // Sin espacio
        InventarioItem item3 = crearItem(3L, null, tipoPizarra, 1, "DISPONIBLE"); // Sin espacio

        when(inventarioItemRepository.findAll()).thenReturn(Arrays.asList(item1, item2, item3));

        List<InventarioItemResponseDto> resultado = inventarioItemService.filterInventario(
            null, null, null, null, true, null, null);

        assertEquals(2, resultado.size(), "Debe haber 2 items sin asignar");
        assertTrue(resultado.stream().allMatch(item -> item.getEspacioId() == null),
            "Todos los items deben no tener espacio asignado");
    }

    @Test
    @DisplayName("filterInventario debe buscar por nombre de tipo de elemento")
    void filterInventarioDebeBuscarPorNombreTipoElemento() {
        InventarioItem proyector1 = crearItem(1L, espacioAula101, tipoProyector, 1, "DISPONIBLE");
        InventarioItem proyector2 = crearItem(2L, espacioAula102, tipoProyector, 1, "DISPONIBLE");
        InventarioItem pizarra = crearItem(3L, espacioAula101, tipoPizarra, 1, "DISPONIBLE");

        when(inventarioItemRepository.findAll()).thenReturn(Arrays.asList(proyector1, proyector2, pizarra));

        List<InventarioItemResponseDto> resultado = inventarioItemService.filterInventario(
            "Proyector", null, null, null, null, null, null);

        assertEquals(2, resultado.size(), "Debe encontrar 2 proyectores");
        assertTrue(resultado.stream().allMatch(item -> item.getTipoElementoNombre().contains("Proyector")),
            "Todos deben ser proyectores");
    }

    @Test
    @DisplayName("filterInventario debe buscar por nombre de espacio")
    void filterInventarioDebeBuscarPorNombreEspacio() {
        InventarioItem item1 = crearItem(1L, espacioAula101, tipoProyector, 1, "DISPONIBLE");
        InventarioItem item2 = crearItem(2L, espacioAula102, tipoProyector, 1, "DISPONIBLE");
        InventarioItem item3 = crearItem(3L, espacioLaboratorio, tipoComputadora, 5, "DISPONIBLE");

        when(inventarioItemRepository.findAll()).thenReturn(Arrays.asList(item1, item2, item3));

        List<InventarioItemResponseDto> resultado = inventarioItemService.filterInventario(
            "Aula", null, null, null, null, null, null);

        assertEquals(2, resultado.size(), "Debe encontrar 2 items en aulas");
        assertTrue(resultado.stream().allMatch(item -> item.getEspacioNombre().contains("Aula")),
            "Todos deben estar en aulas");
    }

    @Test
    @DisplayName("filterInventario debe ordenar por nombre de tipo de elemento ascendente")
    void filterInventarioDebeOrdenarPorNombreAscendente() {
        InventarioItem pizarra = crearItem(1L, espacioAula101, tipoPizarra, 1, "DISPONIBLE");
        InventarioItem proyector = crearItem(2L, espacioAula102, tipoProyector, 1, "DISPONIBLE");
        InventarioItem computadora = crearItem(3L, espacioLaboratorio, tipoComputadora, 5, "DISPONIBLE");

        when(inventarioItemRepository.findAll()).thenReturn(Arrays.asList(pizarra, proyector, computadora));

        List<InventarioItemResponseDto> resultado = inventarioItemService.filterInventario(
            null, null, null, null, null, "nombre", "asc");

        assertEquals(3, resultado.size());
        // Orden alfabético: Computadora, Pizarra Digital, Proyector
        assertEquals("Computadora", resultado.get(0).getTipoElementoNombre());
        assertEquals("Pizarra Digital", resultado.get(1).getTipoElementoNombre());
        assertEquals("Proyector", resultado.get(2).getTipoElementoNombre());
    }

    // ============================================
    // TESTS DE ESTADÍSTICAS
    // ============================================

    @Test
    @DisplayName("getInventarioStatistics debe contar correctamente items por estado")
    void estadisticasDebenContarCorrectamentePorEstado() {
        InventarioItem item1 = crearItem(1L, espacioAula101, tipoProyector, 2, "DISPONIBLE");
        InventarioItem item2 = crearItem(2L, espacioAula102, tipoProyector, 1, "DISPONIBLE");
        InventarioItem item3 = crearItem(3L, espacioAula101, tipoPizarra, 1, "MANTENIMIENTO");
        InventarioItem item4 = crearItem(4L, espacioLaboratorio, tipoComputadora, 3, "MANTENIMIENTO");
        InventarioItem item5 = crearItem(5L, espacioAula102, tipoProyector, 1, "DANADO");

        when(inventarioItemRepository.countTotalItems()).thenReturn(5L);
        when(inventarioItemRepository.findAll()).thenReturn(Arrays.asList(item1, item2, item3, item4, item5));

        Map<String, Object> stats = inventarioItemService.getInventarioStatistics();

        assertEquals(5L, stats.get("totalItems"));
        assertEquals(2L, stats.get("disponibles"), "Debe haber 2 items disponibles");
        assertEquals(2L, stats.get("mantenimiento"), "Debe haber 2 items en mantenimiento");
        assertEquals(1L, stats.get("danados"), "Debe haber 1 item dañado");
    }

    @Test
    @DisplayName("getInventarioStatistics debe contar items sin asignar correctamente")
    void estadisticasDebenContarItemsSinAsignar() {
        InventarioItem item1 = crearItem(1L, espacioAula101, tipoProyector, 1, "DISPONIBLE");
        InventarioItem item2 = crearItem(2L, null, tipoProyector, 2, "DISPONIBLE"); // Sin asignar
        InventarioItem item3 = crearItem(3L, null, tipoPizarra, 1, "DISPONIBLE"); // Sin asignar
        InventarioItem item4 = crearItem(4L, espacioAula102, tipoComputadora, 3, "DISPONIBLE");

        when(inventarioItemRepository.countTotalItems()).thenReturn(4L);
        when(inventarioItemRepository.findAll()).thenReturn(Arrays.asList(item1, item2, item3, item4));

        Map<String, Object> stats = inventarioItemService.getInventarioStatistics();

        assertEquals(4L, stats.get("totalItems"));
        assertEquals(2L, stats.get("sinAsignar"), "Debe haber 2 items sin asignar");
    }

    @Test
    @DisplayName("getInventarioStatistics con items en todos los estados debe tener estadísticas completas")
    void estadisticasConTodosLosEstados() {
        List<InventarioItem> items = new ArrayList<>();

        // 5 disponibles
        for (int i = 0; i < 5; i++) {
            items.add(crearItem((long) i, espacioAula101, tipoProyector, 1, "DISPONIBLE"));
        }

        // 3 en mantenimiento
        for (int i = 5; i < 8; i++) {
            items.add(crearItem((long) i, espacioAula102, tipoProyector, 1, "MANTENIMIENTO"));
        }

        // 2 dañados
        for (int i = 8; i < 10; i++) {
            items.add(crearItem((long) i, espacioLaboratorio, tipoComputadora, 1, "DANADO"));
        }

        // 3 sin asignar
        for (int i = 10; i < 13; i++) {
            items.add(crearItem((long) i, null, tipoPizarra, 1, "DISPONIBLE"));
        }

        when(inventarioItemRepository.countTotalItems()).thenReturn(13L);
        when(inventarioItemRepository.findAll()).thenReturn(items);

        Map<String, Object> stats = inventarioItemService.getInventarioStatistics();

        assertEquals(13L, stats.get("totalItems"));
        assertEquals(8L, stats.get("disponibles"), "5 disponibles asignados + 3 sin asignar = 8 total");
        assertEquals(3L, stats.get("mantenimiento"));
        assertEquals(2L, stats.get("danados"));
        assertEquals(3L, stats.get("sinAsignar"));
    }

    // ============================================
    // TESTS DE SOFT DELETE
    // ============================================

    @Test
    @DisplayName("Soft delete debe mantener item en BD pero marcarlo como inactivo")
    void softDeleteDebeMantenerItemPeroInactivo() {
        InventarioItem item = crearItem(1L, espacioAula101, tipoProyector, 1, "DISPONIBLE");

        when(inventarioItemRepository.findById(1L)).thenReturn(Optional.of(item));
        when(inventarioItemRepository.save(any(InventarioItem.class))).thenAnswer(invocation -> invocation.getArgument(0));

        assertTrue(item.getActivo(), "Item debe estar activo inicialmente");
        assertNull(item.getDeletedAt(), "deletedAt debe ser null inicialmente");

        inventarioItemService.deleteInventarioItem(1L);

        assertFalse(item.getActivo(), "Item debe estar inactivo después del soft delete");
        assertNotNull(item.getDeletedAt(), "deletedAt debe tener valor después del soft delete");

        verify(inventarioItemRepository).save(item);
        verify(inventarioItemRepository, never()).deleteById(anyLong());
    }

    // ============================================
    // MÉTODOS AUXILIARES
    // ============================================

    private InventarioItem crearItem(Long id, Espacio espacio, TipoElemento tipoElemento,
                                       Integer cantidad, String estado) {
        InventarioItem item = new InventarioItem();
        item.setId(id);
        item.setEspacio(espacio);
        item.setTipoElemento(tipoElemento);
        item.setCantidad(cantidad);
        item.setEstado(estado);
        item.setActivo(true);
        item.setCreatedAt(Instant.now());
        item.setUpdatedAt(Instant.now());
        return item;
    }
}
