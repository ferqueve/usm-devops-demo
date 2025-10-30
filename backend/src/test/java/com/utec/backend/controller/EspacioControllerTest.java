package com.utec.backend.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.utec.backend.dto.espacio.EspacioCreateDto;
import com.utec.backend.dto.espacio.EspacioResponseDto;
import com.utec.backend.dto.espacio.EspacioUpdateDto;
import com.utec.backend.service.EspacioService;
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
@DisplayName("Tests de integración para EspacioController")
class EspacioControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private EspacioService espacioService;

    private EspacioResponseDto espacioResponseDto;
    private final Long espacioId = 1L;

    @BeforeEach
    void setUp() {
        espacioResponseDto = new EspacioResponseDto();
        espacioResponseDto.setId(espacioId);
        espacioResponseDto.setNombre("Aula 101");
        espacioResponseDto.setCapacidad(30);
        espacioResponseDto.setImagenUrl("imagen.jpg");
        espacioResponseDto.setTipoEspacioId(1L);
        espacioResponseDto.setTipoEspacioNombre("Aula");
        espacioResponseDto.setTipoEspacioColor("#FF5733");
        espacioResponseDto.setEstado("DISPONIBLE");
        espacioResponseDto.setCreatedAt(LocalDateTime.now());
        espacioResponseDto.setUpdatedAt(LocalDateTime.now());
    }

    @Test
    @DisplayName("POST /api/v1/espacios - Debe crear espacio exitosamente")
    void debeCrearEspacioExitosamente() throws Exception {
        // Given
        EspacioCreateDto createDto = new EspacioCreateDto();
        createDto.setNombre("Aula Nueva");
        createDto.setCapacidad(50);
        createDto.setTipoEspacioId(1L);

        when(espacioService.createEspacio(any(EspacioCreateDto.class))).thenReturn(espacioResponseDto);

        // When & Then
        mockMvc.perform(post("/api/v1/espacios")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createDto)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.nombre").value("Aula 101"));

        verify(espacioService).createEspacio(any(EspacioCreateDto.class));
    }

    @Test
    @DisplayName("GET /api/v1/espacios - Debe obtener todos los espacios")
    void debeObtenerTodosLosEspacios() throws Exception {
        // Given
        List<EspacioResponseDto> espacios = Arrays.asList(espacioResponseDto);
        when(espacioService.getAllEspacios()).thenReturn(espacios);

        // When & Then
        mockMvc.perform(get("/api/v1/espacios")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data", org.hamcrest.Matchers.hasSize(1)));

        verify(espacioService).getAllEspacios();
    }

    @Test
    @DisplayName("GET /api/v1/espacios/{id} - Debe obtener espacio por ID")
    void debeObtenerEspacioPorId() throws Exception {
        // Given
        when(espacioService.getEspacioById(espacioId)).thenReturn(espacioResponseDto);

        // When & Then
        mockMvc.perform(get("/api/v1/espacios/{id}", espacioId)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.id").value(espacioId))
                .andExpect(jsonPath("$.data.nombre").value("Aula 101"));

        verify(espacioService).getEspacioById(espacioId);
    }

    @Test
    @DisplayName("GET /api/v1/espacios/{id} - Debe retornar 404 cuando no existe")
    void debeRetornar404CuandoNoExiste() throws Exception {
        // Given
        when(espacioService.getEspacioById(espacioId))
                .thenThrow(new RuntimeException("Espacio no encontrado"));

        // When & Then
        mockMvc.perform(get("/api/v1/espacios/{id}", espacioId)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isNotFound());

        verify(espacioService).getEspacioById(espacioId);
    }

    @Test
    @DisplayName("PUT /api/v1/espacios/{id} - Debe actualizar espacio exitosamente")
    void debeActualizarEspacioExitosamente() throws Exception {
        // Given
        EspacioUpdateDto updateDto = new EspacioUpdateDto();
        updateDto.setNombre("Aula Actualizada");
        updateDto.setCapacidad(35);
        updateDto.setTipoEspacioId(1L);

        when(espacioService.updateEspacio(eq(espacioId), any(EspacioUpdateDto.class)))
                .thenReturn(espacioResponseDto);

        // When & Then
        mockMvc.perform(put("/api/v1/espacios/{id}", espacioId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateDto)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        verify(espacioService).updateEspacio(eq(espacioId), any(EspacioUpdateDto.class));
    }

    @Test
    @DisplayName("DELETE /api/v1/espacios/{id} - Debe eliminar espacio exitosamente")
    void debeEliminarEspacioExitosamente() throws Exception {
        // Given
        doNothing().when(espacioService).deleteEspacio(espacioId);

        // When & Then
        mockMvc.perform(delete("/api/v1/espacios/{id}", espacioId)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        verify(espacioService).deleteEspacio(espacioId);
    }

    @Test
    @DisplayName("GET /api/v1/espacios/search - Debe buscar espacios por nombre")
    void debeBuscarEspaciosPorNombre() throws Exception {
        // Given
        List<EspacioResponseDto> espacios = Arrays.asList(espacioResponseDto);
        when(espacioService.getEspaciosByNombre("Aula")).thenReturn(espacios);

        // When & Then
        mockMvc.perform(get("/api/v1/espacios/search")
                        .param("nombre", "Aula")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        verify(espacioService).getEspaciosByNombre("Aula");
    }

    @Test
    @DisplayName("GET /api/v1/espacios/stats - Debe obtener estadísticas")
    void debeObtenerEstadisticas() throws Exception {
        // Given
        when(espacioService.getTotalEspacios()).thenReturn(10L);
        when(espacioService.getCapacidadPromedio()).thenReturn(35.5);
        when(espacioService.getCapacidadMaxima()).thenReturn(100);
        when(espacioService.getCapacidadMinima()).thenReturn(10);

        // When & Then
        mockMvc.perform(get("/api/v1/espacios/stats")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.totalEspacios").value(10))
                .andExpect(jsonPath("$.data.capacidadPromedio").value(35.5));

        verify(espacioService).getTotalEspacios();
    }
}
