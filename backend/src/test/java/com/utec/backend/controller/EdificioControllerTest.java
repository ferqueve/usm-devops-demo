package com.utec.backend.controller;

import com.utec.backend.dto.edificio.EdificioResponseDto;
import com.utec.backend.service.EdificioService;
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
import org.springframework.security.test.context.support.WithMockUser;

import java.time.Instant;
import java.util.Arrays;
import java.util.List;

import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc(addFilters = false)
@ActiveProfiles("test")
@DisplayName("Tests de integración para EdificioController")
class EdificioControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private EdificioService edificioService;

    private EdificioResponseDto edificioResponseDto;
    private final Long edificioId = 1L;

    @BeforeEach
    void setUp() {
        edificioResponseDto = new EdificioResponseDto();
        edificioResponseDto.setId(edificioId);
        edificioResponseDto.setNombre("Edificio Central");
        edificioResponseDto.setCodigo("EC");
        edificioResponseDto.setDescripcion("Edificio principal");
        edificioResponseDto.setActivo(true);
        edificioResponseDto.setCreatedAt(Instant.now());
        edificioResponseDto.setUpdatedAt(Instant.now());
        edificioResponseDto.setDeletedAt(null);
    }

    @Test
    @DisplayName("GET /api/v1/edificios - Debe obtener todos los edificios")
    @WithMockUser(roles = {"DOCENTE"})
    void debeObtenerTodosLosEdificios() throws Exception {
        // Given
        List<EdificioResponseDto> edificios = Arrays.asList(edificioResponseDto);
        when(edificioService.getAllEdificios()).thenReturn(edificios);

        // When & Then
        mockMvc.perform(get("/api/v1/edificios")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data", org.hamcrest.Matchers.hasSize(1)));

        verify(edificioService).getAllEdificios();
    }

    @Test
    @DisplayName("GET /api/v1/edificios/{id} - Debe obtener edificio por ID")
    @WithMockUser(roles = {"DOCENTE"})
    void debeObtenerEdificioPorId() throws Exception {
        // Given
        when(edificioService.getEdificioById(edificioId)).thenReturn(edificioResponseDto);

        // When & Then
        mockMvc.perform(get("/api/v1/edificios/{id}", edificioId)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.id").value(edificioId));

        verify(edificioService).getEdificioById(edificioId);
    }
}

