package com.utec.backend.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.utec.backend.dto.tipo_espacio.TipoEspacioCreateDto;
import com.utec.backend.dto.tipo_espacio.TipoEspacioResponseDto;
import com.utec.backend.dto.tipo_espacio.TipoEspacioUpdateDto;
import com.utec.backend.service.TipoEspacioService;
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
@DisplayName("Tests de integración para TipoEspacioController")
class TipoEspacioControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private TipoEspacioService tipoEspacioService;

    private TipoEspacioResponseDto tipoEspacioResponseDto;
    private final Long tipoEspacioId = 1L;

    @BeforeEach
    void setUp() {
        tipoEspacioResponseDto = new TipoEspacioResponseDto();
        tipoEspacioResponseDto.setId(tipoEspacioId);
        tipoEspacioResponseDto.setNombre("Aula");
        tipoEspacioResponseDto.setDescripcion("Espacio para clases");
        tipoEspacioResponseDto.setColor("#FF5733");
        tipoEspacioResponseDto.setActivo(true);
        tipoEspacioResponseDto.setCreatedAt(LocalDateTime.now());
        tipoEspacioResponseDto.setUpdatedAt(LocalDateTime.now());
    }

    @Test
    @DisplayName("POST /api/v1/tipos-espacio - Debe crear tipo de espacio exitosamente")
    void debeCrearTipoEspacioExitosamente() throws Exception {
        // Given
        TipoEspacioCreateDto createDto = new TipoEspacioCreateDto();
        createDto.setNombre("Laboratorio");
        createDto.setDescripcion("Espacio para prácticas");

        when(tipoEspacioService.createTipoEspacio(any(TipoEspacioCreateDto.class)))
                .thenReturn(tipoEspacioResponseDto);

        // When & Then
        mockMvc.perform(post("/api/v1/tipos-espacio")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createDto)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.nombre").value("Aula"));

        verify(tipoEspacioService).createTipoEspacio(any(TipoEspacioCreateDto.class));
    }

    @Test
    @DisplayName("GET /api/v1/tipos-espacio - Debe obtener todos los tipos de espacio")
    void debeObtenerTodosLosTiposEspacio() throws Exception {
        // Given
        List<TipoEspacioResponseDto> tipos = Arrays.asList(tipoEspacioResponseDto);
        when(tipoEspacioService.getAllTiposEspacio()).thenReturn(tipos);

        // When & Then
        mockMvc.perform(get("/api/v1/tipos-espacio")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data", org.hamcrest.Matchers.hasSize(1)));

        verify(tipoEspacioService).getAllTiposEspacio();
    }

    @Test
    @DisplayName("GET /api/v1/tipos-espacio/{id} - Debe obtener tipo de espacio por ID")
    void debeObtenerTipoEspacioPorId() throws Exception {
        // Given
        when(tipoEspacioService.getTipoEspacioById(tipoEspacioId)).thenReturn(tipoEspacioResponseDto);

        // When & Then
        mockMvc.perform(get("/api/v1/tipos-espacio/{id}", tipoEspacioId)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.id").value(tipoEspacioId))
                .andExpect(jsonPath("$.data.nombre").value("Aula"));

        verify(tipoEspacioService).getTipoEspacioById(tipoEspacioId);
    }

    @Test
    @DisplayName("PUT /api/v1/tipos-espacio/{id} - Debe actualizar tipo de espacio exitosamente")
    void debeActualizarTipoEspacioExitosamente() throws Exception {
        // Given
        TipoEspacioUpdateDto updateDto = new TipoEspacioUpdateDto();
        updateDto.setNombre("Aula Actualizada");
        updateDto.setDescripcion("Nueva descripción");

        when(tipoEspacioService.updateTipoEspacio(eq(tipoEspacioId), any(TipoEspacioUpdateDto.class)))
                .thenReturn(tipoEspacioResponseDto);

        // When & Then
        mockMvc.perform(put("/api/v1/tipos-espacio/{id}", tipoEspacioId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateDto)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        verify(tipoEspacioService).updateTipoEspacio(eq(tipoEspacioId), any(TipoEspacioUpdateDto.class));
    }

    @Test
    @DisplayName("DELETE /api/v1/tipos-espacio/{id} - Debe eliminar tipo de espacio exitosamente")
    void debeEliminarTipoEspacioExitosamente() throws Exception {
        // Given
        doNothing().when(tipoEspacioService).deleteTipoEspacio(tipoEspacioId);

        // When & Then
        mockMvc.perform(delete("/api/v1/tipos-espacio/{id}", tipoEspacioId)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        verify(tipoEspacioService).deleteTipoEspacio(tipoEspacioId);
    }

    @Test
    @DisplayName("PUT /api/v1/tipos-espacio/{id}/toggle-activo - Debe toggle activo exitosamente")
    void debeToggleActivoExitosamente() throws Exception {
        // Given
        when(tipoEspacioService.toggleActivo(tipoEspacioId)).thenReturn(tipoEspacioResponseDto);

        // When & Then
        mockMvc.perform(put("/api/v1/tipos-espacio/{id}/toggle-activo", tipoEspacioId)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        verify(tipoEspacioService).toggleActivo(tipoEspacioId);
    }

    @Test
    @DisplayName("GET /api/v1/tipos-espacio/search - Debe buscar tipos de espacio por nombre")
    void debeBuscarTiposEspacioPorNombre() throws Exception {
        // Given
        List<TipoEspacioResponseDto> tipos = Arrays.asList(tipoEspacioResponseDto);
        when(tipoEspacioService.searchTiposEspacioByNombre("Aula")).thenReturn(tipos);

        // When & Then
        mockMvc.perform(get("/api/v1/tipos-espacio/search")
                        .param("nombre", "Aula")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        verify(tipoEspacioService).searchTiposEspacioByNombre("Aula");
    }

    @Test
    @DisplayName("GET /api/v1/tipos-espacio/stats - Debe obtener estadísticas")
    void debeObtenerEstadisticas() throws Exception {
        // Given
        when(tipoEspacioService.getTotalTiposEspacio()).thenReturn(5L);

        // When & Then
        mockMvc.perform(get("/api/v1/tipos-espacio/stats")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.totalTipos").value(5));

        verify(tipoEspacioService).getTotalTiposEspacio();
    }
}
