package com.utec.backend.controller;

import com.utec.backend.dto.preferencias.PreferenciasCompletasDto;
import com.utec.backend.dto.preferencias.PreferenciasEmailDto;
import com.utec.backend.dto.preferencias.PreferenciasVistaDto;
import com.utec.backend.service.UsuarioConfiguracionService;
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

import com.fasterxml.jackson.databind.ObjectMapper;

import java.util.*;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@DisplayName("Tests de integración para UsuarioConfiguracionController")
class UsuarioConfiguracionControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private UsuarioConfiguracionService configuracionService;

    private PreferenciasCompletasDto preferenciasCompletasDto;
    private PreferenciasEmailDto preferenciasEmailDto;
    private PreferenciasVistaDto preferenciasVistaDto;
    private final String userEmail = "test@utec.edu.uy";

    @BeforeEach
    void setUp() {
        Map<String, Object> preferencias = new HashMap<>();
        preferencias.put("email", new HashMap<>());
        preferencias.put("vista", new HashMap<>());
        preferenciasCompletasDto = new PreferenciasCompletasDto(preferencias);

        Map<String, Boolean> emailPrefs = new HashMap<>();
        emailPrefs.put("reservaAprobada", true);
        preferenciasEmailDto = new PreferenciasEmailDto();
        preferenciasEmailDto.setEmail(emailPrefs);

        Map<String, Object> vistaPrefs = new HashMap<>();
        vistaPrefs.put("reservasViewMode", "calendar");
        preferenciasVistaDto = new PreferenciasVistaDto();
        preferenciasVistaDto.setVista(vistaPrefs);
    }

    @Test
    @DisplayName("GET /api/v1/preferencias - Debe obtener preferencias")
    @WithMockUser(username = "test@utec.edu.uy")
    void debeObtenerPreferencias() throws Exception {
        // Given
        when(configuracionService.obtenerPreferencias(userEmail)).thenReturn(preferenciasCompletasDto);

        // When & Then
        mockMvc.perform(get("/api/v1/preferencias")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk());

        verify(configuracionService).obtenerPreferencias(userEmail);
    }

    @Test
    @DisplayName("GET /api/v1/preferencias/email - Debe obtener preferencias de email")
    @WithMockUser(username = "test@utec.edu.uy")
    void debeObtenerPreferenciasEmail() throws Exception {
        // Given
        when(configuracionService.obtenerPreferenciasEmail(userEmail)).thenReturn(preferenciasEmailDto);

        // When & Then
        mockMvc.perform(get("/api/v1/preferencias/email")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk());

        verify(configuracionService).obtenerPreferenciasEmail(userEmail);
    }

    @Test
    @DisplayName("GET /api/v1/preferencias/vista - Debe obtener preferencias de vista")
    @WithMockUser(username = "test@utec.edu.uy")
    void debeObtenerPreferenciasVista() throws Exception {
        // Given
        when(configuracionService.obtenerPreferenciasVista(userEmail)).thenReturn(preferenciasVistaDto);

        // When & Then
        mockMvc.perform(get("/api/v1/preferencias/vista")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk());

        verify(configuracionService).obtenerPreferenciasVista(userEmail);
    }

    @Test
    @DisplayName("PUT /api/v1/preferencias/email - Debe actualizar preferencias de email")
    @WithMockUser(username = "test@utec.edu.uy")
    void debeActualizarPreferenciasEmail() throws Exception {
        // Given
        when(configuracionService.actualizarPreferenciasEmail(eq(userEmail), any(PreferenciasEmailDto.class)))
                .thenReturn(preferenciasEmailDto);

        // When & Then
        mockMvc.perform(put("/api/v1/preferencias/email")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(preferenciasEmailDto)))
                .andExpect(status().isOk());

        verify(configuracionService).actualizarPreferenciasEmail(eq(userEmail), any(PreferenciasEmailDto.class));
    }

    @Test
    @DisplayName("PUT /api/v1/preferencias/vista - Debe actualizar preferencias de vista")
    @WithMockUser(username = "test@utec.edu.uy")
    void debeActualizarPreferenciasVista() throws Exception {
        // Given
        when(configuracionService.actualizarPreferenciasVista(eq(userEmail), any(PreferenciasVistaDto.class)))
                .thenReturn(preferenciasVistaDto);

        // When & Then
        mockMvc.perform(put("/api/v1/preferencias/vista")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(preferenciasVistaDto)))
                .andExpect(status().isOk());

        verify(configuracionService).actualizarPreferenciasVista(eq(userEmail), any(PreferenciasVistaDto.class));
    }

    @Test
    @DisplayName("GET /api/v1/preferencias/email/obligatorios - Debe obtener emails obligatorios")
    @WithMockUser(username = "test@utec.edu.uy")
    void debeObtenerEmailsObligatorios() throws Exception {
        // Given
        Set<String> emailsObligatorios = Set.of("verificacion", "restablecimientoPassword");
        when(configuracionService.getEmailsObligatorios()).thenReturn(emailsObligatorios);

        // When & Then
        mockMvc.perform(get("/api/v1/preferencias/email/obligatorios")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk());

        verify(configuracionService).getEmailsObligatorios();
    }
}

