package com.utec.backend.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.utec.backend.dto.inventario.InventarioItemCreateDto;
import com.utec.backend.dto.inventario.InventarioItemResponseDto;
import com.utec.backend.dto.inventario.InventarioItemUpdateDto;
import com.utec.backend.service.InventarioItemService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.util.Arrays;
import java.util.List;
import java.util.Map;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc(addFilters = false)
@ActiveProfiles("test")
@DisplayName("Tests de integración para InventarioItemController")
class InventarioItemControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private InventarioItemService inventarioItemService;

    private InventarioItemResponseDto itemResponseDto;
    private final Long itemId = 1L;

    @BeforeEach
    void setUp() {
        itemResponseDto = new InventarioItemResponseDto();
        itemResponseDto.setId(itemId);
        itemResponseDto.setEspacioId(1L);
        itemResponseDto.setEspacioNombre("Aula 101");
        itemResponseDto.setTipoElementoId(1L);
        itemResponseDto.setTipoElementoNombre("Proyector");
        itemResponseDto.setCantidad(5);
        itemResponseDto.setEstado("DISPONIBLE");
        itemResponseDto.setActivo(true);
        itemResponseDto.setCreatedAt(Instant.now());
        itemResponseDto.setUpdatedAt(Instant.now());
    }

    @Test
    @DisplayName("POST /api/v1/inventario - Debe crear item exitosamente")
    void debeCrearItemExitosamente() throws Exception {
        // Given
        InventarioItemCreateDto createDto = new InventarioItemCreateDto();
        createDto.setEspacioId(1L);
        createDto.setTipoElementoId(1L);
        createDto.setCantidad(3);

        when(inventarioItemService.createInventarioItem(any(InventarioItemCreateDto.class)))
                .thenReturn(itemResponseDto);

        // When & Then
        mockMvc.perform(post("/api/v1/inventario")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createDto)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.cantidad").value(5));

        verify(inventarioItemService).createInventarioItem(any(InventarioItemCreateDto.class));
    }

    @Test
    @DisplayName("GET /api/v1/inventario - Debe obtener todos los items")
    void debeObtenerTodosLosItems() throws Exception {
        // Given
        List<InventarioItemResponseDto> items = Arrays.asList(itemResponseDto);
        when(inventarioItemService.getAllInventarioItems()).thenReturn(items);

        // When & Then
        mockMvc.perform(get("/api/v1/inventario")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data", org.hamcrest.Matchers.hasSize(1)));

        verify(inventarioItemService).getAllInventarioItems();
    }

    @Test
    @DisplayName("GET /api/v1/inventario/{id} - Debe obtener item por ID")
    void debeObtenerItemPorId() throws Exception {
        // Given
        when(inventarioItemService.getInventarioItemById(itemId)).thenReturn(itemResponseDto);

        // When & Then
        mockMvc.perform(get("/api/v1/inventario/{id}", itemId)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.id").value(itemId))
                .andExpect(jsonPath("$.data.estado").value("DISPONIBLE"));

        verify(inventarioItemService).getInventarioItemById(itemId);
    }

    @Test
    @DisplayName("PUT /api/v1/inventario/{id} - Debe actualizar item exitosamente")
    void debeActualizarItemExitosamente() throws Exception {
        // Given
        InventarioItemUpdateDto updateDto = new InventarioItemUpdateDto();
        updateDto.setCantidad(10);
        updateDto.setTipoElementoId(1L);
        updateDto.setEstado("MANTENIMIENTO");

        when(inventarioItemService.updateInventarioItem(eq(itemId), any(InventarioItemUpdateDto.class)))
                .thenReturn(itemResponseDto);

        // When & Then
        mockMvc.perform(put("/api/v1/inventario/{id}", itemId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateDto)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        verify(inventarioItemService).updateInventarioItem(eq(itemId), any(InventarioItemUpdateDto.class));
    }

    @Test
    @DisplayName("DELETE /api/v1/inventario/{id} - Debe eliminar item exitosamente")
    void debeEliminarItemExitosamente() throws Exception {
        // Given
        doNothing().when(inventarioItemService).deleteInventarioItem(itemId);

        // When & Then
        mockMvc.perform(delete("/api/v1/inventario/{id}", itemId)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        verify(inventarioItemService).deleteInventarioItem(itemId);
    }

    @Test
    @DisplayName("GET /api/v1/inventario/stats - Debe obtener estadísticas")
    void debeObtenerEstadisticas() throws Exception {
        // Given
        Map<String, Object> stats = Map.of(
                "totalItems", 10L,
                "disponibles", 8L,
                "mantenimiento", 2L
        );
        when(inventarioItemService.getInventarioStatistics()).thenReturn(stats);

        // When & Then
        mockMvc.perform(get("/api/v1/inventario/stats")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.totalItems").value(10));

        verify(inventarioItemService).getInventarioStatistics();
    }
}
