package com.utec.backend.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.utec.backend.dto.reserva.ReservaCreateDto;
import com.utec.backend.dto.reserva.ReservaResponseDto;
import com.utec.backend.model.Reserva;
import com.utec.backend.service.ReservaService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@DisplayName("Tests Extendidos de ReservaController - Roles y Permisos")
class ReservaControllerExtendedTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private ReservaService reservaService;

    private ReservaResponseDto reservaResponseDto;
    private ReservaCreateDto createDto;
    private final Long reservaId = 1L;
    private final Long espacioId = 1L;
    private final Instant inicioFuturo = Instant.now().plus(1, ChronoUnit.DAYS).truncatedTo(ChronoUnit.HOURS);
    private final Instant finFuturo = inicioFuturo.plus(1, ChronoUnit.HOURS);

    @BeforeEach
    void setUp() {
        reservaResponseDto = new ReservaResponseDto();
        reservaResponseDto.setId(reservaId);
        reservaResponseDto.setEspacioId(espacioId);
        reservaResponseDto.setEspacioNombre("Aula 101");
        reservaResponseDto.setUsuarioId(1L);
        reservaResponseDto.setUsuarioEmail("test@utec.edu.uy");
        reservaResponseDto.setInicio(inicioFuturo);
        reservaResponseDto.setFin(finFuturo);
        reservaResponseDto.setEstado(Reserva.EstadoReserva.PENDIENTE);
        reservaResponseDto.setTitulo("Reserva de prueba");
        reservaResponseDto.setMotivoSolicitud("Motivo de prueba");
        reservaResponseDto.setEsPublica(true);
        reservaResponseDto.setCreatedAt(Instant.now());
        reservaResponseDto.setUpdatedAt(Instant.now());

        createDto = new ReservaCreateDto();
        createDto.setEspacioId(espacioId);
        createDto.setTitulo("Reserva de prueba");
        createDto.setMotivoSolicitud("Motivo de prueba");
        createDto.setInicio(inicioFuturo);
        createDto.setFin(finFuturo);
        createDto.setEsPublica(true);
    }

    // ==================== TESTS PARA DIFERENTES ROLES ====================

    @Test
    @DisplayName("POST /api/v1/reservas - DOCENTE debe crear solicitud PENDIENTE")
    @WithMockUser(username = "docente@utec.edu.uy", roles = {"DOCENTE"})
    void docenteDebeCrearSolicitudPendiente() throws Exception {
        // Given
        reservaResponseDto.setEstado(Reserva.EstadoReserva.PENDIENTE);
        when(reservaService.createReserva(any(ReservaCreateDto.class), eq("docente@utec.edu.uy"), eq("DOCENTE")))
                .thenReturn(reservaResponseDto);

        // When & Then
        mockMvc.perform(post("/api/v1/reservas")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createDto)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Solicitud de reserva enviada exitosamente. Esperando aprobación."))
                .andExpect(jsonPath("$.data.estado").value("PENDIENTE"));

        verify(reservaService).createReserva(any(ReservaCreateDto.class), eq("docente@utec.edu.uy"), eq("DOCENTE"));
    }

    @Test
    @DisplayName("POST /api/v1/reservas - EXTERNO debe crear solicitud PENDIENTE y pública")
    @WithMockUser(username = "externo@gmail.com", roles = {"EXTERNO"})
    void externoDebeCrearSolicitudPendientePublica() throws Exception {
        // Given
        reservaResponseDto.setEstado(Reserva.EstadoReserva.PENDIENTE);
        reservaResponseDto.setEsPublica(true);
        when(reservaService.createReserva(any(ReservaCreateDto.class), eq("externo@gmail.com"), eq("EXTERNO")))
                .thenReturn(reservaResponseDto);

        // When & Then
        mockMvc.perform(post("/api/v1/reservas")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createDto)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Solicitud de reserva enviada exitosamente. Esperando aprobación."))
                .andExpect(jsonPath("$.data.esPublica").value(true));

        verify(reservaService).createReserva(any(ReservaCreateDto.class), eq("externo@gmail.com"), eq("EXTERNO"));
    }

    @Test
    @DisplayName("POST /api/v1/reservas - ANALISTA debe crear reserva auto-aprobada")
    @WithMockUser(username = "analista@utec.edu.uy", roles = {"ANALISTA"})
    void analistaDebeCrearReservaAutoAprobada() throws Exception {
        // Given
        reservaResponseDto.setEstado(Reserva.EstadoReserva.APROBADO);
        when(reservaService.createReserva(any(ReservaCreateDto.class), eq("analista@utec.edu.uy"), eq("ANALISTA")))
                .thenReturn(reservaResponseDto);

        // When & Then
        mockMvc.perform(post("/api/v1/reservas")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createDto)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Reserva creada exitosamente"))
                .andExpect(jsonPath("$.data.estado").value("APROBADO"));

        verify(reservaService).createReserva(any(ReservaCreateDto.class), eq("analista@utec.edu.uy"), eq("ANALISTA"));
    }

    @Test
    @DisplayName("POST /api/v1/reservas - Debe fallar con datos inválidos")
    @WithMockUser(username = "admin@utec.edu.uy", roles = {"ADMIN"})
    void debeFallarConDatosInvalidos() throws Exception {
        // Given
        when(reservaService.createReserva(any(ReservaCreateDto.class), eq("admin@utec.edu.uy"), eq("ADMIN")))
                .thenThrow(new RuntimeException("El espacio ya está reservado en ese horario"));

        // When & Then
        mockMvc.perform(post("/api/v1/reservas")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createDto)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.error").value("Error al crear reserva: El espacio ya está reservado en ese horario"));
    }

    // ==================== TESTS PARA ENDPOINT /todas ====================

    @Test
    @DisplayName("GET /api/v1/reservas/todas - ADMIN debe ver todas las reservas")
    @WithMockUser(username = "admin@utec.edu.uy", roles = {"ADMIN"})
    void adminDebeVerTodasLasReservas() throws Exception {
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
    @DisplayName("GET /api/v1/reservas/todas - ANALISTA debe ver solo reservas asignadas")
    @WithMockUser(username = "analista@utec.edu.uy", roles = {"ANALISTA"})
    void analistaDebeVerSoloReservasAsignadas() throws Exception {
        // Given - El servicio ya filtra por analista
        List<ReservaResponseDto> reservasAsignadas = Arrays.asList(reservaResponseDto);
        when(reservaService.getTodasLasReservas(any(com.utec.backend.dto.reserva.ReservaFilters.class), eq("analista@utec.edu.uy"), eq("ANALISTA")))
                .thenReturn(reservasAsignadas);

        // When & Then
        mockMvc.perform(get("/api/v1/reservas/todas")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data", org.hamcrest.Matchers.hasSize(1)));

        verify(reservaService).getTodasLasReservas(any(com.utec.backend.dto.reserva.ReservaFilters.class), eq("analista@utec.edu.uy"), eq("ANALISTA"));
    }

    @Test
    @DisplayName("GET /api/v1/reservas/todas - EXTERNO debe ver solo reservas públicas")
    @WithMockUser(username = "externo@gmail.com", roles = {"EXTERNO"})
    void externoDebeVerSoloReservasPublicas() throws Exception {
        // Given - El servicio ya filtra para externos
        reservaResponseDto.setEsPublica(true);
        List<ReservaResponseDto> reservasPublicas = Arrays.asList(reservaResponseDto);
        when(reservaService.getTodasLasReservas(any(com.utec.backend.dto.reserva.ReservaFilters.class), eq("externo@gmail.com"), eq("EXTERNO")))
                .thenReturn(reservasPublicas);

        // When & Then
        mockMvc.perform(get("/api/v1/reservas/todas")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data[0].esPublica").value(true));

        verify(reservaService).getTodasLasReservas(any(com.utec.backend.dto.reserva.ReservaFilters.class), eq("externo@gmail.com"), eq("EXTERNO"));
    }

    @Test
    @DisplayName("GET /api/v1/reservas/todas - Debe aplicar filtros correctamente")
    @WithMockUser(username = "admin@utec.edu.uy", roles = {"ADMIN"})
    void debeAplicarFiltrosCorrectamente() throws Exception {
        // Given
        List<ReservaResponseDto> reservas = Arrays.asList(reservaResponseDto);
        when(reservaService.getTodasLasReservas(
                any(com.utec.backend.dto.reserva.ReservaFilters.class),
                eq("admin@utec.edu.uy"),
                eq("ADMIN")))
                .thenReturn(reservas);

        // When & Then
        mockMvc.perform(get("/api/v1/reservas/todas")
                        .param("estado", "APROBADO")
                        .param("espacioId", "1")
                        .param("carreraId", "2")
                        .param("tipoEspacioId", "3")
                        .param("fechaInicio", inicioFuturo.toString())
                        .param("fechaFin", finFuturo.toString())
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        verify(reservaService).getTodasLasReservas(
                any(com.utec.backend.dto.reserva.ReservaFilters.class),
                eq("admin@utec.edu.uy"),
                eq("ADMIN"));
    }

    // ==================== TESTS PARA ENDPOINT /espacio/{espacioId} ====================

    @Test
    @DisplayName("GET /api/v1/reservas/espacio/{espacioId} - Debe obtener reservas del espacio")
    @WithMockUser(username = "docente@utec.edu.uy", roles = {"DOCENTE"})
    void debeObtenerReservasDelEspacio() throws Exception {
        // Given
        List<ReservaResponseDto> reservas = Arrays.asList(reservaResponseDto);
        when(reservaService.getReservasByEspacio(espacioId)).thenReturn(reservas);

        // When & Then
        mockMvc.perform(get("/api/v1/reservas/espacio/{espacioId}", espacioId)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data", org.hamcrest.Matchers.hasSize(1)))
                .andExpect(jsonPath("$.data[0].espacioId").value(espacioId));

        verify(reservaService).getReservasByEspacio(espacioId);
    }

    @Test
    @DisplayName("GET /api/v1/reservas/espacio/{espacioId} - Espacio sin reservas debe retornar lista vacía")
    @WithMockUser(username = "docente@utec.edu.uy", roles = {"DOCENTE"})
    void espacioSinReservasDebeRetornarListaVacia() throws Exception {
        // Given
        when(reservaService.getReservasByEspacio(espacioId)).thenReturn(Collections.emptyList());

        // When & Then
        mockMvc.perform(get("/api/v1/reservas/espacio/{espacioId}", espacioId)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data", org.hamcrest.Matchers.hasSize(0)));

        verify(reservaService).getReservasByEspacio(espacioId);
    }

    // ==================== TESTS PARA CAMBIO DE ESTADO ====================

    @Test
    @DisplayName("PATCH /api/v1/reservas/{id}/estado - ANALISTA debe poder aprobar reserva asignada")
    @WithMockUser(username = "analista@utec.edu.uy", roles = {"ANALISTA"})
    void analistaDebePodeAprobarReservaAsignada() throws Exception {
        // Given
        reservaResponseDto.setEstado(Reserva.EstadoReserva.APROBADO);
        when(reservaService.cambiarEstadoReserva(eq(reservaId), eq("APROBADO"), eq("analista@utec.edu.uy"), eq("ANALISTA"), any()))
                .thenReturn(reservaResponseDto);

        // When & Then
        mockMvc.perform(patch("/api/v1/reservas/{id}/estado", reservaId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"estado\":\"APROBADO\",\"mensajeAnalista\":\"Aprobado\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.estado").value("APROBADO"));

        verify(reservaService).cambiarEstadoReserva(reservaId, "APROBADO", "analista@utec.edu.uy", "ANALISTA", "Aprobado");
    }

    @Test
    @DisplayName("PATCH /api/v1/reservas/{id}/estado - Debe fallar sin campo estado")
    @WithMockUser(username = "admin@utec.edu.uy", roles = {"ADMIN"})
    void debeFallarSinCampoEstado() throws Exception {
        // When & Then
        mockMvc.perform(patch("/api/v1/reservas/{id}/estado", reservaId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.error").value("El campo 'estado' es requerido"));

        verify(reservaService, never()).cambiarEstadoReserva(anyLong(), anyString(), anyString(), anyString(), any());
    }

    @Test
    @DisplayName("PATCH /api/v1/reservas/{id}/estado - Debe rechazar reserva con mensaje")
    @WithMockUser(username = "analista@utec.edu.uy", roles = {"ANALISTA"})
    void debeRechazarReservaConMensaje() throws Exception {
        // Given
        reservaResponseDto.setEstado(Reserva.EstadoReserva.CANCELADO);
        when(reservaService.cambiarEstadoReserva(reservaId, "CANCELADO", "analista@utec.edu.uy", "ANALISTA", "No cumple requisitos"))
                .thenReturn(reservaResponseDto);

        // When & Then
        mockMvc.perform(patch("/api/v1/reservas/{id}/estado", reservaId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"estado\":\"CANCELADO\",\"mensajeAnalista\":\"No cumple requisitos\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Reserva rechazada exitosamente"));

        verify(reservaService).cambiarEstadoReserva(reservaId, "CANCELADO", "analista@utec.edu.uy", "ANALISTA", "No cumple requisitos");
    }

    // ==================== TESTS PARA CANCELACIÓN ====================

    @Test
    @DisplayName("DELETE /api/v1/reservas/{id} - ADMIN puede cancelar cualquier reserva")
    @WithMockUser(username = "admin@utec.edu.uy", roles = {"ADMIN"})
    void adminPuedeCancelarCualquierReserva() throws Exception {
        // Given
        doNothing().when(reservaService).cancelReserva(reservaId, "admin@utec.edu.uy");

        // When & Then
        mockMvc.perform(delete("/api/v1/reservas/{id}", reservaId)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        verify(reservaService).cancelReserva(reservaId, "admin@utec.edu.uy");
    }

    @Test
    @DisplayName("DELETE /api/v1/reservas/{id} - Debe fallar si reserva no existe")
    @WithMockUser(username = "docente@utec.edu.uy", roles = {"DOCENTE"})
    void debeFallarSiReservaNoExiste() throws Exception {
        // Given
        doThrow(new RuntimeException("Reserva no encontrada"))
                .when(reservaService).cancelReserva(999L, "docente@utec.edu.uy");

        // When & Then
        mockMvc.perform(delete("/api/v1/reservas/{id}", 999L)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false));

        verify(reservaService).cancelReserva(999L, "docente@utec.edu.uy");
    }

    // ==================== TESTS PARA PAGINACIÓN ====================

    @Test
    @DisplayName("GET /api/v1/reservas/paged - ANALISTA debe ver solo sus reservas asignadas paginadas")
    @WithMockUser(username = "analista@utec.edu.uy", roles = {"ANALISTA"})
    void analistaDebeVerSoloReservasAsignadasPaginadas() throws Exception {
        // Given
        Page<ReservaResponseDto> page = new PageImpl<>(Arrays.asList(reservaResponseDto), PageRequest.of(0, 10), 1);
        when(reservaService.getAllReservasPaged(
                any(org.springframework.data.domain.Pageable.class),
                any(com.utec.backend.dto.reserva.ReservaFilters.class),
                eq("analista@utec.edu.uy"),
                eq("ANALISTA")))
                .thenReturn(page);

        // When & Then
        mockMvc.perform(get("/api/v1/reservas/paged")
                        .param("page", "0")
                        .param("size", "10")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.content", org.hamcrest.Matchers.hasSize(1)));

        verify(reservaService).getAllReservasPaged(
                any(org.springframework.data.domain.Pageable.class),
                any(com.utec.backend.dto.reserva.ReservaFilters.class),
                eq("analista@utec.edu.uy"),
                eq("ANALISTA"));
    }

    @Test
    @DisplayName("GET /api/v1/reservas/paged - Debe aplicar múltiples filtros en paginación")
    @WithMockUser(username = "admin@utec.edu.uy", roles = {"ADMIN"})
    void debeAplicarMultiplesFiltrosEnPaginacion() throws Exception {
        // Given
        Page<ReservaResponseDto> page = new PageImpl<>(Collections.emptyList(), PageRequest.of(0, 10), 0);
        when(reservaService.getAllReservasPaged(
                any(org.springframework.data.domain.Pageable.class),
                any(com.utec.backend.dto.reserva.ReservaFilters.class),
                eq("admin@utec.edu.uy"),
                eq("ADMIN")))
                .thenReturn(page);

        // When & Then
        mockMvc.perform(get("/api/v1/reservas/paged")
                        .param("page", "0")
                        .param("size", "10")
                        .param("estado", "PENDIENTE")
                        .param("espacioId", "1")
                        .param("carreraId", "2")
                        .param("tipoEspacioId", "3")
                        .param("usuarioId", "4")
                        .param("fechaInicio", inicioFuturo.toString())
                        .param("fechaFin", finFuturo.toString())
                        .param("tiempo", "futuro")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        verify(reservaService).getAllReservasPaged(
                any(org.springframework.data.domain.Pageable.class),
                any(com.utec.backend.dto.reserva.ReservaFilters.class),
                eq("admin@utec.edu.uy"),
                eq("ADMIN"));
    }

    // ==================== TESTS PARA ESTADÍSTICAS ====================

    @Test
    @DisplayName("GET /api/v1/reservas/mis-reservas/stats - EXTERNO obtiene estadísticas globales (bug actual)")
    @WithMockUser(username = "externo@gmail.com", roles = {"EXTERNO"})
    void externoObtienEstadisticasGlobales() throws Exception {
        // Given - El controller actual solo da stats personales a DOCENTE, resto obtiene globales
        // Esto es un bug ya que EXTERNO debería obtener sus propias estadísticas
        com.utec.backend.dto.reserva.ReservaStatsDto stats = new com.utec.backend.dto.reserva.ReservaStatsDto();
        stats.setTotalReservas(100L);
        when(reservaService.obtenerEstadisticasGlobales()).thenReturn(stats);

        // When & Then - EXTERNO no es DOCENTE, así que cae en el else y obtiene stats globales
        mockMvc.perform(get("/api/v1/reservas/mis-reservas/stats")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.totalReservas").value(100));

        verify(reservaService).obtenerEstadisticasGlobales();
    }
}
