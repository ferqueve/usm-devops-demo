package com.utec.backend.controller;

import com.utec.backend.dto.auth.AuthenticationResponse;
import com.utec.backend.service.OAuth2Service;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc(addFilters = false)
@ActiveProfiles("test")
@DisplayName("Tests de integración para OAuthController")
class OAuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private OAuth2Service oauth2Service;

    @Test
    @DisplayName("GET /api/v1/oauth2/google/info - Debe obtener información de OAuth")
    void debeObtenerInfoOAuth() throws Exception {
        // When & Then
        mockMvc.perform(get("/api/v1/oauth2/google/info")
                        .contentType("application/json"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.frontend_url").exists());
    }

    @Test
    @DisplayName("GET /api/v1/oauth2/google/callback - Debe procesar callback exitosamente")
    void debeProcesarCallbackExitosamente() throws Exception {
        // Given
        AuthenticationResponse authResponse = new AuthenticationResponse(
                "accessToken",
                "refreshToken",
                "test@utec.edu.uy",
                "Juan Pérez",
                "ESTUDIANTE",
                3600000L,
                1L
        );

        when(oauth2Service.handleGoogleCallback(anyString())).thenReturn(authResponse);

        // When & Then - El controlador redirige, por lo que esperamos 302
        mockMvc.perform(get("/api/v1/oauth2/google/callback")
                        .param("code", "valid_code"))
                .andExpect(status().isFound()); // Redirect status

        verify(oauth2Service).handleGoogleCallback("valid_code");
    }

    @Test
    @DisplayName("GET /api/v1/oauth2/google/callback - Debe manejar error en callback")
    void debeManejarErrorEnCallback() throws Exception {
        // Given
        when(oauth2Service.handleGoogleCallback(anyString()))
                .thenThrow(new RuntimeException("Error procesando OAuth"));

        // When & Then - Debe redirigir a frontend con error
        mockMvc.perform(get("/api/v1/oauth2/google/callback")
                        .param("code", "invalid_code"))
                .andExpect(status().isFound()); // Redirect status

        verify(oauth2Service).handleGoogleCallback("invalid_code");
    }

    @Test
    @DisplayName("GET /api/v1/oauth2/google/callback - Debe manejar callback con parámetro error")
    void debeManejarCallbackConError() throws Exception {
        // When & Then - Debe redirigir a frontend con error
        mockMvc.perform(get("/api/v1/oauth2/google/callback")
                        .param("error", "access_denied"))
                .andExpect(status().isFound()); // Redirect status

        // No se debe llamar al servicio cuando hay error
        verify(oauth2Service, never()).handleGoogleCallback(anyString());
    }

    @Test
    @DisplayName("GET /api/v1/oauth2/google/callback - Debe manejar callback sin código")
    void debeManejarCallbackSinCodigo() throws Exception {
        // When & Then - Debe redirigir a frontend con error
        mockMvc.perform(get("/api/v1/oauth2/google/callback"))
                .andExpect(status().isFound()); // Redirect status

        // No se debe llamar al servicio cuando no hay código
        verify(oauth2Service, never()).handleGoogleCallback(anyString());
    }

    @Test
    @DisplayName("GET /api/v1/oauth2/google/authorize - Debe redirigir a Google")
    void debeRedirigirAGoogle() throws Exception {
        // When & Then - Debe redirigir a Google OAuth
        mockMvc.perform(get("/api/v1/oauth2/google/authorize"))
                .andExpect(status().isFound()) // Redirect status
                .andExpect(header().exists("Location"));
    }
}
