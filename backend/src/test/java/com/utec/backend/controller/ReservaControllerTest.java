package com.utec.backend.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.utec.backend.dto.reserva.ReservaCreateDto;
import com.utec.backend.dto.reserva.ReservaResponseDto;
import com.utec.backend.dto.reserva.ReservaStatsDto;
import com.utec.backend.service.ReservaService;
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

import com.utec.backend.model.Reserva;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Arrays;
import java.util.List;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@DisplayName("Tests de integración para ReservaController")
class ReservaControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private ReservaService reservaService;

    private ReservaResponseDto reservaResponseDto;
    private final Long reservaId = 1L;
    private final String userEmail = "test@utec.edu.uy";
    private final Instant inicioFuturo = Instant.now().plus(1, ChronoUnit.DAYS);
    private final Instant finFuturo = inicioFuturo.plus(1, ChronoUnit.HOURS);

    @BeforeEach
    void setUp() {
        reservaResponseDto = new ReservaResponseDto();
        reservaResponseDto.setId(reservaId);
        reservaResponseDto.setEspacioId(1L);
        reservaResponseDto.setEspacioNombre("Aula 101");
        reservaResponseDto.setUsuarioId(1L);
        reservaResponseDto.setUsuarioEmail(userEmail);
        reservaResponseDto.setInicio(inicioFuturo);
        reservaResponseDto.setFin(finFuturo);
        reservaResponseDto.setEstado(Reserva.EstadoReserva.PENDIENTE);
        reservaResponseDto.setTitulo("Reserva de prueba");
        reservaResponseDto.setMotivoSolicitud("Motivo de prueba");
        reservaResponseDto.setCreatedAt(Instant.now());
        reservaResponseDto.setUpdatedAt(Instant.now());
    }

    @Test
    @DisplayName("POST /api/v1/reservas - Debe crear reserva exitosamente como ADMIN")
    @WithMockUser(username = "admin@utec.edu.uy", roles = {"ADMIN"})
    void debeCrearReservaExitosamenteComoAdmin() throws Exception {
        // Given
        ReservaCreateDto createDto = new ReservaCreateDto();
        createDto.setEspacioId(1L);
        createDto.setTitulo("Reserva de prueba");
        createDto.setMotivoSolicitud("Motivo de prueba");
        createDto.setInicio(inicioFuturo);
        createDto.setFin(finFuturo);

        when(reservaService.createReserva(any(ReservaCreateDto.class), eq("admin@utec.edu.uy"), eq("ADMIN")))
                .thenReturn(reservaResponseDto);

        // When & Then
        mockMvc.perform(post("/api/v1/reservas")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createDto)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.id").value(reservaId));

        verify(reservaService).createReserva(any(ReservaCreateDto.class), eq("admin@utec.edu.uy"), eq("ADMIN"));
    }

    @Test
    @DisplayName("GET /api/v1/reservas/mis-reservas - Debe obtener reservas del usuario")
    @WithMockUser(username = userEmail, roles = {"DOCENTE"})
    void debeObtenerMisReservas() throws Exception {
        // Given
        List<ReservaResponseDto> reservas = Arrays.asList(reservaResponseDto);
        when(reservaService.getReservasByUsuario(userEmail)).thenReturn(reservas);

        // When & Then
        mockMvc.perform(get("/api/v1/reservas/mis-reservas")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data", org.hamcrest.Matchers.hasSize(1)));

        verify(reservaService).getReservasByUsuario(userEmail);
    }

    @Test
    @DisplayName("GET /api/v1/reservas/mis-reservas/paged - Debe obtener reservas paginadas")
    @WithMockUser(username = userEmail, roles = {"DOCENTE"})
    void debeObtenerMisReservasPaginadas() throws Exception {
        // Given
        Page<ReservaResponseDto> page = new PageImpl<>(Arrays.asList(reservaResponseDto), PageRequest.of(0, 10), 1);
        when(reservaService.getReservasByUsuarioPaged(eq(userEmail), any(org.springframework.data.domain.Pageable.class), any(com.utec.backend.dto.reserva.ReservaFilters.class)))
                .thenReturn(page);

        // When & Then
        mockMvc.perform(get("/api/v1/reservas/mis-reservas/paged")
                        .param("page", "0")
                        .param("size", "10")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        verify(reservaService).getReservasByUsuarioPaged(eq(userEmail), any(org.springframework.data.domain.Pageable.class), any(com.utec.backend.dto.reserva.ReservaFilters.class));
    }

    @Test
    @DisplayName("GET /api/v1/reservas/{id} - Debe obtener reserva por ID")
    @WithMockUser(username = userEmail, roles = {"DOCENTE"})
    void debeObtenerReservaPorId() throws Exception {
        // Given
        when(reservaService.getReservaById(reservaId, userEmail)).thenReturn(reservaResponseDto);

        // When & Then
        mockMvc.perform(get("/api/v1/reservas/{id}", reservaId)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.id").value(reservaId));

        verify(reservaService).getReservaById(reservaId, userEmail);
    }

    @Test
    @DisplayName("DELETE /api/v1/reservas/{id} - Debe cancelar reserva exitosamente")
    @WithMockUser(username = userEmail, roles = {"DOCENTE"})
    void debeCancelarReservaExitosamente() throws Exception {
        // Given
        doNothing().when(reservaService).cancelReserva(reservaId, userEmail);

        // When & Then
        mockMvc.perform(delete("/api/v1/reservas/{id}", reservaId)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        verify(reservaService).cancelReserva(reservaId, userEmail);
    }

    @Test
    @DisplayName("PATCH /api/v1/reservas/{id}/estado - Debe cambiar estado de reserva")
    @WithMockUser(username = "admin@utec.edu.uy", roles = {"ADMIN"})
    void debeCambiarEstadoReserva() throws Exception {
        // Given
        reservaResponseDto.setEstado(Reserva.EstadoReserva.APROBADO);
        when(reservaService.cambiarEstadoReserva(eq(reservaId), eq("APROBADO"), eq("admin@utec.edu.uy"), eq("ADMIN"), any()))
                .thenReturn(reservaResponseDto);

        // When & Then
        mockMvc.perform(patch("/api/v1/reservas/{id}/estado", reservaId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"estado\":\"APROBADO\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        verify(reservaService).cambiarEstadoReserva(eq(reservaId), eq("APROBADO"), eq("admin@utec.edu.uy"), eq("ADMIN"), any());
    }

    @Test
    @DisplayName("GET /api/v1/reservas/todas - Debe obtener todas las reservas sin paginación (ADMIN)")
    @WithMockUser(username = "admin@utec.edu.uy", roles = {"ADMIN"})
    void debeObtenerTodasLasReservasSinPaginacion() throws Exception {
        // Given
        List<ReservaResponseDto> reservas = Arrays.asList(reservaResponseDto);
        when(reservaService.getTodasLasReservas(any(com.utec.backend.dto.reserva.ReservaFilters.class), eq("admin@utec.edu.uy"), eq("ADMIN")))
                .thenReturn(reservas);

        // When & Then
        mockMvc.perform(get("/api/v1/reservas/todas")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data", org.hamcrest.Matchers.hasSize(1)));

        verify(reservaService).getTodasLasReservas(any(com.utec.backend.dto.reserva.ReservaFilters.class), eq("admin@utec.edu.uy"), eq("ADMIN"));
    }

    @Test
    @DisplayName("GET /api/v1/reservas/paged - Debe obtener todas las reservas paginadas (ADMIN)")
    @WithMockUser(username = "admin@utec.edu.uy", roles = {"ADMIN"})
    void debeObtenerTodasLasReservasPaginadas() throws Exception {
        // Given
        Page<ReservaResponseDto> page = new PageImpl<>(Arrays.asList(reservaResponseDto), PageRequest.of(0, 10), 1);
        when(reservaService.getAllReservasPaged(any(org.springframework.data.domain.Pageable.class), any(com.utec.backend.dto.reserva.ReservaFilters.class), eq("admin@utec.edu.uy"), eq("ADMIN")))
                .thenReturn(page);

        // When & Then
        mockMvc.perform(get("/api/v1/reservas/paged")
                        .param("page", "0")
                        .param("size", "10")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        verify(reservaService).getAllReservasPaged(any(org.springframework.data.domain.Pageable.class), any(com.utec.backend.dto.reserva.ReservaFilters.class), eq("admin@utec.edu.uy"), eq("ADMIN"));
    }

    @Test
    @DisplayName("GET /api/v1/reservas/mis-reservas/stats - Debe obtener estadísticas personales (DOCENTE)")
    @WithMockUser(username = userEmail, roles = {"DOCENTE"})
    void debeObtenerEstadisticasPersonales() throws Exception {
        // Given
        ReservaStatsDto stats = new ReservaStatsDto();
        stats.setTotalReservas(10L);
        stats.setTotalAprobadas(5L);
        when(reservaService.obtenerEstadisticasPersonales(userEmail)).thenReturn(stats);

        // When & Then
        mockMvc.perform(get("/api/v1/reservas/mis-reservas/stats")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        verify(reservaService).obtenerEstadisticasPersonales(userEmail);
    }

    @Test
    @DisplayName("GET /api/v1/reservas/mis-reservas/stats - Debe obtener estadísticas globales (ADMIN)")
    @WithMockUser(username = "admin@utec.edu.uy", roles = {"ADMIN"})
    void debeObtenerEstadisticasGlobales() throws Exception {
        // Given
        ReservaStatsDto stats = new ReservaStatsDto();
        stats.setTotalReservas(100L);
        when(reservaService.obtenerEstadisticasGlobales()).thenReturn(stats);

        // When & Then
        mockMvc.perform(get("/api/v1/reservas/mis-reservas/stats")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        verify(reservaService).obtenerEstadisticasGlobales();
    }
}

