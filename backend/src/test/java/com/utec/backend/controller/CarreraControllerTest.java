package com.utec.backend.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.utec.backend.dto.carrera.CarreraCreateDto;
import com.utec.backend.dto.carrera.CarreraResponseDto;
import com.utec.backend.dto.carrera.CarreraUpdateDto;
import com.utec.backend.service.CarreraService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.security.test.context.support.WithMockUser;

import java.time.Instant;
import java.util.Arrays;
import java.util.List;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc(addFilters = false)
@ActiveProfiles("test")
@DisplayName("Tests de integración para CarreraController")
class CarreraControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private CarreraService carreraService;

    private CarreraResponseDto carreraResponseDto;
    private final Long carreraId = 1L;

    @BeforeEach
    void setUp() {
        carreraResponseDto = new CarreraResponseDto();
        carreraResponseDto.setId(carreraId);
        carreraResponseDto.setNombre("Ingeniería");
        carreraResponseDto.setCodigo("ING");
        carreraResponseDto.setCreatedAt(Instant.now());
        carreraResponseDto.setUpdatedAt(Instant.now());
        carreraResponseDto.setDeletedAt(null);
    }

    @Test
    @DisplayName("POST /api/v1/carreras - Debe crear carrera exitosamente")
    @WithMockUser(roles = {"ADMIN"})
    void debeCrearCarreraExitosamente() throws Exception {
        // Given
        CarreraCreateDto createDto = new CarreraCreateDto();
        createDto.setNombre("Nueva Carrera");
        createDto.setCodigo("NC");

        when(carreraService.createCarrera(any(CarreraCreateDto.class))).thenReturn(carreraResponseDto);

        // When & Then
        mockMvc.perform(post("/api/v1/carreras")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createDto)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.nombre").value("Ingeniería"));

        verify(carreraService).createCarrera(any(CarreraCreateDto.class));
    }

    @Test
    @DisplayName("GET /api/v1/carreras - Debe obtener todas las carreras")
    @WithMockUser(roles = {"DOCENTE"})
    void debeObtenerTodasLasCarreras() throws Exception {
        // Given
        List<CarreraResponseDto> carreras = Arrays.asList(carreraResponseDto);
        when(carreraService.getAllCarreras()).thenReturn(carreras);

        // When & Then
        mockMvc.perform(get("/api/v1/carreras")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data", org.hamcrest.Matchers.hasSize(1)));

        verify(carreraService).getAllCarreras();
    }

    @Test
    @DisplayName("GET /api/v1/carreras/paged - Debe obtener carreras paginadas")
    @WithMockUser(roles = {"DOCENTE"})
    void debeObtenerCarrerasPaginadas() throws Exception {
        // Given
        Page<CarreraResponseDto> page = new PageImpl<>(Arrays.asList(carreraResponseDto), PageRequest.of(0, 10), 1);
        when(carreraService.getAllCarrerasPaged(any())).thenReturn(page);

        // When & Then
        mockMvc.perform(get("/api/v1/carreras/paged")
                        .param("page", "0")
                        .param("size", "10")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        verify(carreraService).getAllCarrerasPaged(any());
    }

    @Test
    @DisplayName("GET /api/v1/carreras/{id} - Debe obtener carrera por ID")
    @WithMockUser(roles = {"DOCENTE"})
    void debeObtenerCarreraPorId() throws Exception {
        // Given
        when(carreraService.getCarreraById(carreraId)).thenReturn(carreraResponseDto);

        // When & Then
        mockMvc.perform(get("/api/v1/carreras/{id}", carreraId)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.id").value(carreraId));

        verify(carreraService).getCarreraById(carreraId);
    }

    @Test
    @DisplayName("PUT /api/v1/carreras/{id} - Debe actualizar carrera exitosamente")
    @WithMockUser(roles = {"ADMIN"})
    void debeActualizarCarreraExitosamente() throws Exception {
        // Given
        CarreraUpdateDto updateDto = new CarreraUpdateDto();
        updateDto.setNombre("Ingeniería Actualizada");

        when(carreraService.updateCarrera(eq(carreraId), any(CarreraUpdateDto.class)))
                .thenReturn(carreraResponseDto);

        // When & Then
        mockMvc.perform(put("/api/v1/carreras/{id}", carreraId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateDto)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        verify(carreraService).updateCarrera(eq(carreraId), any(CarreraUpdateDto.class));
    }

    @Test
    @DisplayName("DELETE /api/v1/carreras/{id} - Debe eliminar carrera exitosamente")
    @WithMockUser(roles = {"ADMIN"})
    void debeEliminarCarreraExitosamente() throws Exception {
        // Given
        doNothing().when(carreraService).deleteCarrera(carreraId);

        // When & Then
        mockMvc.perform(delete("/api/v1/carreras/{id}", carreraId)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        verify(carreraService).deleteCarrera(carreraId);
    }

    @Test
    @DisplayName("GET /api/v1/carreras/search - Debe buscar carreras por nombre")
    @WithMockUser(roles = {"DOCENTE"})
    void debeBuscarCarrerasPorNombre() throws Exception {
        // Given
        List<CarreraResponseDto> carreras = Arrays.asList(carreraResponseDto);
        when(carreraService.searchCarrerasByNombre("Ingeniería")).thenReturn(carreras);

        // When & Then
        mockMvc.perform(get("/api/v1/carreras/search")
                        .param("nombre", "Ingeniería")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        verify(carreraService).searchCarrerasByNombre("Ingeniería");
    }
}

