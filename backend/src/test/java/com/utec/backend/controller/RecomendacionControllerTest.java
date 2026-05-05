package com.utec.backend.controller;

import com.utec.backend.dto.recomendacion.DashboardRecomendacionesDto;
import com.utec.backend.dto.recomendacion.RecomendacionEspacioDto;
import com.utec.backend.model.Usuario;
import com.utec.backend.repository.UsuarioRepository;
import com.utec.backend.service.RecomendacionService;
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
import java.time.temporal.ChronoUnit;
import java.util.Arrays;
import java.util.Collections;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@DisplayName("Tests de integración para RecomendacionController")
class RecomendacionControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private RecomendacionService recomendacionService;

    @MockitoBean
    private UsuarioRepository usuarioRepository;

    private Usuario usuarioTest;
    private final String userEmail = "test@utec.edu.uy";
    private final Long usuarioId = 1L;
    private final Long espacioId = 1L;

    @BeforeEach
    void setUp() {
        usuarioTest = new Usuario();
        usuarioTest.setId(usuarioId);
        usuarioTest.setEmail(userEmail);
        usuarioTest.setNombre("Test User");
        usuarioTest.setRolApp(Usuario.RolApp.DOCENTE);
    }

    @Test
    @DisplayName("GET /api/v1/recomendaciones/reservas/espacios - Debe obtener recomendaciones de espacios")
    @WithMockUser(username = userEmail, roles = {"DOCENTE"})
    void debeObtenerRecomendacionesEspacios() throws Exception {
        // Given
        RecomendacionEspacioDto dto = new RecomendacionEspacioDto();
        dto.setEspacioId(espacioId);
        dto.setEspacioNombre("Aula 101");

        when(usuarioRepository.findByEmail(userEmail)).thenReturn(Optional.of(usuarioTest));
        when(recomendacionService.obtenerRecomendacionesEspacios(eq(usuarioId), any(Instant.class), any(Instant.class), any()))
                .thenReturn(Arrays.asList(dto));

        // When & Then
        mockMvc.perform(get("/api/v1/recomendaciones/reservas/espacios")
                        .param("inicio", Instant.now().toString())
                        .param("fin", Instant.now().plus(1, ChronoUnit.DAYS).toString())
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        verify(recomendacionService).obtenerRecomendacionesEspacios(eq(usuarioId), any(Instant.class), any(Instant.class), any());
    }

    @Test
    @DisplayName("GET /api/v1/recomendaciones/reservas/horarios - Debe obtener horarios óptimos")
    @WithMockUser(username = userEmail, roles = {"DOCENTE"})
    void debeObtenerHorariosOptimos() throws Exception {
        // Given
        when(usuarioRepository.findByEmail(userEmail)).thenReturn(Optional.of(usuarioTest));
        when(recomendacionService.obtenerHorariosOptimos(eq(usuarioId), eq(espacioId), any(Instant.class)))
                .thenReturn(Collections.emptyList());

        // When & Then
        mockMvc.perform(get("/api/v1/recomendaciones/reservas/horarios")
                        .param("espacioId", espacioId.toString())
                        .param("fecha", Instant.now().toString())
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        verify(recomendacionService).obtenerHorariosOptimos(eq(usuarioId), eq(espacioId), any(Instant.class));
    }

    @Test
    @DisplayName("GET /api/v1/recomendaciones/reservas/espacios-similares - Debe obtener espacios similares")
    @WithMockUser(username = userEmail, roles = {"DOCENTE"})
    void debeObtenerEspaciosSimilares() throws Exception {
        // Given
        RecomendacionEspacioDto dto = new RecomendacionEspacioDto();
        dto.setEspacioId(2L);
        dto.setEspacioNombre("Aula 102");

        when(usuarioRepository.findByEmail(userEmail)).thenReturn(Optional.of(usuarioTest));
        when(recomendacionService.obtenerEspaciosSimilares(espacioId, usuarioId))
                .thenReturn(Arrays.asList(dto));

        // When & Then
        mockMvc.perform(get("/api/v1/recomendaciones/reservas/espacios-similares")
                        .param("espacioId", espacioId.toString())
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        verify(recomendacionService).obtenerEspaciosSimilares(espacioId, usuarioId);
    }

    @Test
    @DisplayName("GET /api/v1/recomendaciones/inventario/mantenimiento - Debe obtener items de mantenimiento")
    @WithMockUser(username = userEmail, roles = {"MANTENIMIENTO"})
    void debeObtenerItemsMantenimiento() throws Exception {
        // Given
        when(recomendacionService.obtenerItemsMantenimientoUrgente())
                .thenReturn(Collections.emptyList());

        // When & Then
        mockMvc.perform(get("/api/v1/recomendaciones/inventario/mantenimiento")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        verify(recomendacionService).obtenerItemsMantenimientoUrgente();
    }

    @Test
    @DisplayName("GET /api/v1/recomendaciones/inventario/espacios-atencion - Debe obtener espacios que requieren atención")
    @WithMockUser(username = userEmail, roles = {"MANTENIMIENTO"})
    void debeObtenerEspaciosAtencion() throws Exception {
        // Given
        when(recomendacionService.obtenerEspaciosAtencion())
                .thenReturn(Collections.emptyList());

        // When & Then
        mockMvc.perform(get("/api/v1/recomendaciones/inventario/espacios-atencion")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        verify(recomendacionService).obtenerEspaciosAtencion();
    }

    @Test
    @DisplayName("GET /api/v1/recomendaciones/items/para-reserva - Debe obtener items recomendados para reserva")
    @WithMockUser(username = userEmail, roles = {"DOCENTE"})
    void debeObtenerItemsParaReserva() throws Exception {
        // Given
        when(usuarioRepository.findByEmail(userEmail)).thenReturn(Optional.of(usuarioTest));
        when(recomendacionService.obtenerItemsRecomendadosParaReserva(espacioId, usuarioId))
                .thenReturn(Collections.emptyList());

        // When & Then
        mockMvc.perform(get("/api/v1/recomendaciones/items/para-reserva")
                        .param("espacioId", espacioId.toString())
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        verify(recomendacionService).obtenerItemsRecomendadosParaReserva(espacioId, usuarioId);
    }

    @Test
    @DisplayName("GET /api/v1/recomendaciones/items/combinaciones - Debe obtener combinaciones de items")
    @WithMockUser(username = userEmail, roles = {"DOCENTE"})
    void debeObtenerCombinacionesItems() throws Exception {
        // Given
        when(recomendacionService.obtenerCombinacionesItems(espacioId))
                .thenReturn(Collections.emptyList());

        // When & Then
        mockMvc.perform(get("/api/v1/recomendaciones/items/combinaciones")
                        .param("espacioId", espacioId.toString())
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        verify(recomendacionService).obtenerCombinacionesItems(espacioId);
    }

    @Test
    @DisplayName("GET /api/v1/recomendaciones/analistas/prioritarias - Debe obtener reservas prioritarias")
    @WithMockUser(username = userEmail, roles = {"ANALISTA"})
    void debeObtenerReservasPrioritarias() throws Exception {
        // Given
        usuarioTest.setRolApp(Usuario.RolApp.ANALISTA);
        when(usuarioRepository.findByEmail(userEmail)).thenReturn(Optional.of(usuarioTest));
        when(recomendacionService.obtenerReservasPrioritarias(usuarioId))
                .thenReturn(Collections.emptyList());

        // When & Then
        mockMvc.perform(get("/api/v1/recomendaciones/analistas/prioritarias")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        verify(recomendacionService).obtenerReservasPrioritarias(usuarioId);
    }

    @Test
    @DisplayName("GET /api/v1/recomendaciones/dashboard - Debe obtener recomendaciones del dashboard")
    @WithMockUser(username = userEmail, roles = {"DOCENTE"})
    void debeObtenerRecomendacionesDashboard() throws Exception {
        // Given
        DashboardRecomendacionesDto dto = new DashboardRecomendacionesDto();
        dto.setTotalRecomendaciones(0);

        when(usuarioRepository.findByEmail(userEmail)).thenReturn(Optional.of(usuarioTest));
        when(recomendacionService.obtenerRecomendacionesDashboard(usuarioId, Usuario.RolApp.DOCENTE))
                .thenReturn(dto);

        // When & Then
        mockMvc.perform(get("/api/v1/recomendaciones/dashboard")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        verify(recomendacionService).obtenerRecomendacionesDashboard(usuarioId, Usuario.RolApp.DOCENTE);
    }
}

