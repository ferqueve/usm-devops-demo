package com.utec.backend.config;

import com.utec.backend.service.EstadisticasReservaService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Quien entra a /api/v1/stats lo decide el @PreAuthorize de cada endpoint, por
 * permiso y no por rol.
 *
 * Habia ademas una regla de URL que pedia ADMIN para todo /stats/**, y las
 * reglas de URL ganan: un ANALISTA veia "Estadisticas" en el menu y la pantalla
 * entera le respondia 403.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@DisplayName("Acceso a las estadisticas por rol")
class StatsAccessSecurityTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private EstadisticasReservaService estadisticasReservaService;

    private static final String OCUPACION =
            "/api/v1/stats/reservas/ocupacion?desde=2026-01-01&hasta=2026-01-31";

    @Test
    @DisplayName("un ANALISTA entra a las estadisticas de reservas")
    @WithMockUser(username = "analista@utec.edu.uy", roles = {"ANALISTA"})
    void analistaVeReservas() throws Exception {
        when(estadisticasReservaService.ocupacionPorEspacio(any(), any())).thenReturn(List.of());

        mockMvc.perform(get(OCUPACION)).andExpect(status().isOk());
    }

    @Test
    @DisplayName("un ESTUDIANTE no entra a las estadisticas de reservas")
    @WithMockUser(username = "estudiante@utec.edu.uy", roles = {"ESTUDIANTE"})
    void estudianteNoVeReservas() throws Exception {
        mockMvc.perform(get(OCUPACION)).andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("un ANALISTA no dispara el reentrenamiento del modelo")
    @WithMockUser(username = "analista@utec.edu.uy", roles = {"ANALISTA"})
    void analistaNoReentrena() throws Exception {
        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders
                        .post("/api/v1/stats/ml/reentrenar")
                        .with(org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf()))
                .andExpect(status().isForbidden());
    }
}
