package com.utec.backend.controller;

import com.utec.backend.dto.stats.ActiveUserDTO;
import com.utec.backend.dto.stats.ActiveUsersStatsDTO;
import com.utec.backend.service.UserActivityTrackingService;
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

import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc(addFilters = false)
@ActiveProfiles("test")
@DisplayName("Tests de integración para StatsController")
class StatsControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private UserActivityTrackingService activityTrackingService;

    private ActiveUsersStatsDTO activeUsersStats;

    @BeforeEach
    void setUp() {
        ActiveUserDTO activeUser = ActiveUserDTO.builder()
                .email("test@utec.edu.uy")
                .nombre("Juan")
                .apellido("Pérez")
                .rol("ESTUDIANTE")
                .lastActivity(Instant.now())
                .ipAddress("192.168.1.1")
                .userAgent("Mozilla/5.0")
                .build();

        activeUsersStats = ActiveUsersStatsDTO.builder()
                .totalActiveUsers(1)
                .activeUsers(Arrays.asList(activeUser))
                .build();
    }

    @Test
    @DisplayName("GET /api/v1/stats/active-users - Debe obtener usuarios activos")
    @WithMockUser(roles = {"ADMIN"})
    void debeObtenerUsuariosActivos() throws Exception {
        // Given
        when(activityTrackingService.getActiveUsers()).thenReturn(activeUsersStats);

        // When & Then
        mockMvc.perform(get("/api/v1/stats/active-users")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalActiveUsers").value(1))
                .andExpect(jsonPath("$.activeUsers[0].email").value("test@utec.edu.uy"))
                .andExpect(jsonPath("$.activeUsers[0].nombre").value("Juan"));

        verify(activityTrackingService).getActiveUsers();
    }

    @Test
    @DisplayName("GET /api/v1/stats/active-users - Debe retornar lista vacía cuando no hay usuarios")
    @WithMockUser(roles = {"ADMIN"})
    void debeRetornarListaVaciaCuandoNoHayUsuarios() throws Exception {
        // Given
        ActiveUsersStatsDTO emptyStats = ActiveUsersStatsDTO.builder()
                .totalActiveUsers(0)
                .activeUsers(Arrays.asList())
                .build();

        when(activityTrackingService.getActiveUsers()).thenReturn(emptyStats);

        // When & Then
        mockMvc.perform(get("/api/v1/stats/active-users")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalActiveUsers").value(0))
                .andExpect(jsonPath("$.activeUsers", org.hamcrest.Matchers.empty()));

        verify(activityTrackingService).getActiveUsers();
    }
}
