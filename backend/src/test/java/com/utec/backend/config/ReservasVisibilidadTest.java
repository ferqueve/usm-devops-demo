package com.utec.backend.config;

import com.utec.backend.dto.reserva.ReservaResponseDto;
import com.utec.backend.service.ReservaService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * La tabla de gestión de reservas no es el calendario del campus.
 *
 * Las dos consultas pedían 'reserva:ver_todas', pero solo el calendario aplica
 * el filtro de reservas públicas: un ESTUDIANTE o un EXTERNO, que tienen ese
 * permiso para ver el calendario, podían paginar las 9.000 reservas del sistema
 * con el nombre, el mail y el motivo de cada solicitante.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@DisplayName("Quién ve la tabla de gestión de reservas")
class ReservasVisibilidadTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private ReservaService reservaService;

    private static final String PAGED = "/api/v1/reservas/paged";

    private void sinReservas() {
        Page<ReservaResponseDto> vacia = new PageImpl<>(List.of(), Pageable.unpaged(), 0);
        when(reservaService.getAllReservasPaged(any(), any(), anyString(), anyString())).thenReturn(vacia);
    }

    @Test
    @DisplayName("un ANALISTA entra")
    @WithMockUser(username = "analista@utec.edu.uy", roles = {"ANALISTA"})
    void analistaEntra() throws Exception {
        sinReservas();
        mockMvc.perform(get(PAGED)).andExpect(status().isOk());
    }

    @Test
    @DisplayName("un ESTUDIANTE no")
    @WithMockUser(username = "estudiante@utec.edu.uy", roles = {"ESTUDIANTE"})
    void estudianteNoEntra() throws Exception {
        mockMvc.perform(get(PAGED)).andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("un EXTERNO tampoco")
    @WithMockUser(username = "externo@utec.edu.uy", roles = {"EXTERNO"})
    void externoNoEntra() throws Exception {
        mockMvc.perform(get(PAGED)).andExpect(status().isForbidden());
    }
}
