package com.utec.backend.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.utec.backend.dto.tipo_elemento.TipoElementoCreateDto;
import com.utec.backend.dto.tipo_elemento.TipoElementoResponseDto;
import com.utec.backend.dto.tipo_elemento.TipoElementoUpdateDto;
import com.utec.backend.service.TipoElementoService;
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

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc(addFilters = false)
@ActiveProfiles("test")
@DisplayName("Tests de integración para TipoElementoController")
class TipoElementoControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private TipoElementoService tipoElementoService;

    private TipoElementoResponseDto tipoElementoResponseDto;
    private final Long tipoElementoId = 1L;

    @BeforeEach
    void setUp() {
        tipoElementoResponseDto = new TipoElementoResponseDto();
        tipoElementoResponseDto.setId(tipoElementoId);
        tipoElementoResponseDto.setNombre("Proyector");
        tipoElementoResponseDto.setDescripcion("Equipo de proyección");
        tipoElementoResponseDto.setActivo(true);
        tipoElementoResponseDto.setCreatedAt(LocalDateTime.now());
        tipoElementoResponseDto.setUpdatedAt(LocalDateTime.now());
    }

    @Test
    @DisplayName("POST /api/v1/tipos-elemento - Debe crear tipo de elemento exitosamente")
    void debeCrearTipoElementoExitosamente() throws Exception {
        // Given
        TipoElementoCreateDto createDto = new TipoElementoCreateDto();
        createDto.setNombre("Pizarra");
        createDto.setDescripcion("Pizarra blanca");

        when(tipoElementoService.createTipoElemento(any(TipoElementoCreateDto.class)))
                .thenReturn(tipoElementoResponseDto);

        // When & Then
        mockMvc.perform(post("/api/v1/tipos-elemento")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createDto)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.nombre").value("Proyector"));

        verify(tipoElementoService).createTipoElemento(any(TipoElementoCreateDto.class));
    }

    @Test
    @DisplayName("GET /api/v1/tipos-elemento - Debe obtener todos los tipos de elemento")
    void debeObtenerTodosLosTiposElemento() throws Exception {
        // Given
        List<TipoElementoResponseDto> tipos = Arrays.asList(tipoElementoResponseDto);
        when(tipoElementoService.getAllTiposElemento()).thenReturn(tipos);

        // When & Then
        mockMvc.perform(get("/api/v1/tipos-elemento")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data", org.hamcrest.Matchers.hasSize(1)));

        verify(tipoElementoService).getAllTiposElemento();
    }

    @Test
    @DisplayName("GET /api/v1/tipos-elemento/{id} - Debe obtener tipo de elemento por ID")
    void debeObtenerTipoElementoPorId() throws Exception {
        // Given
        when(tipoElementoService.getTipoElementoById(tipoElementoId)).thenReturn(tipoElementoResponseDto);

        // When & Then
        mockMvc.perform(get("/api/v1/tipos-elemento/{id}", tipoElementoId)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.id").value(tipoElementoId))
                .andExpect(jsonPath("$.data.nombre").value("Proyector"));

        verify(tipoElementoService).getTipoElementoById(tipoElementoId);
    }

    @Test
    @DisplayName("PUT /api/v1/tipos-elemento/{id} - Debe actualizar tipo de elemento exitosamente")
    void debeActualizarTipoElementoExitosamente() throws Exception {
        // Given
        TipoElementoUpdateDto updateDto = new TipoElementoUpdateDto();
        updateDto.setNombre("Proyector Actualizado");
        updateDto.setDescripcion("Nueva descripción");

        when(tipoElementoService.updateTipoElemento(eq(tipoElementoId), any(TipoElementoUpdateDto.class)))
                .thenReturn(tipoElementoResponseDto);

        // When & Then
        mockMvc.perform(put("/api/v1/tipos-elemento/{id}", tipoElementoId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateDto)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        verify(tipoElementoService).updateTipoElemento(eq(tipoElementoId), any(TipoElementoUpdateDto.class));
    }

    @Test
    @DisplayName("DELETE /api/v1/tipos-elemento/{id} - Debe eliminar tipo de elemento exitosamente")
    void debeEliminarTipoElementoExitosamente() throws Exception {
        // Given
        doNothing().when(tipoElementoService).deleteTipoElemento(tipoElementoId);

        // When & Then
        mockMvc.perform(delete("/api/v1/tipos-elemento/{id}", tipoElementoId)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        verify(tipoElementoService).deleteTipoElemento(tipoElementoId);
    }

    @Test
    @DisplayName("PUT /api/v1/tipos-elemento/{id}/toggle-activo - Debe toggle activo exitosamente")
    void debeToggleActivoExitosamente() throws Exception {
        // Given
        when(tipoElementoService.toggleActivo(tipoElementoId)).thenReturn(tipoElementoResponseDto);

        // When & Then
        mockMvc.perform(put("/api/v1/tipos-elemento/{id}/toggle-activo", tipoElementoId)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        verify(tipoElementoService).toggleActivo(tipoElementoId);
    }

    @Test
    @DisplayName("GET /api/v1/tipos-elemento/search - Debe buscar tipos de elemento por nombre")
    void debeBuscarTiposElementoPorNombre() throws Exception {
        // Given
        List<TipoElementoResponseDto> tipos = Arrays.asList(tipoElementoResponseDto);
        when(tipoElementoService.searchTiposElementoByNombre("Proyector")).thenReturn(tipos);

        // When & Then
        mockMvc.perform(get("/api/v1/tipos-elemento/search")
                        .param("nombre", "Proyector")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        verify(tipoElementoService).searchTiposElementoByNombre("Proyector");
    }

    @Test
    @DisplayName("GET /api/v1/tipos-elemento/stats - Debe obtener estadísticas")
    void debeObtenerEstadisticas() throws Exception {
        // Given
        when(tipoElementoService.getTotalTiposElemento()).thenReturn(10L);

        // When & Then
        mockMvc.perform(get("/api/v1/tipos-elemento/stats")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.totalTipos").value(10));

        verify(tipoElementoService).getTotalTiposElemento();
    }
}
