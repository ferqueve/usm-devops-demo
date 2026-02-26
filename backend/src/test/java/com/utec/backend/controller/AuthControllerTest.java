package com.utec.backend.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.utec.backend.dto.auth.AuthenticationRequest;
import com.utec.backend.dto.auth.AuthenticationResponse;
import com.utec.backend.dto.auth.RegisterRequest;
import com.utec.backend.dto.auth.RegisterResponse;
import com.utec.backend.dto.auth.ResendVerificationRequest;
import com.utec.backend.service.AuthService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.http.MediaType;
import org.mockito.ArgumentMatchers;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.util.HashMap;
import java.util.Map;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc(addFilters = false)
@ActiveProfiles("test")
@DisplayName("Tests de integración para AuthenticationController")
class AuthenticationControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private AuthService authenticationService;

    private final String testEmail = "test@utec.edu.uy";

    @Test
    @DisplayName("POST /api/v1/auth/login - Debe hacer login exitosamente")
    void debeHacerLoginExitosamente() throws Exception {
        // Given
        AuthenticationRequest request = new AuthenticationRequest(testEmail, "password123");
        
        AuthenticationResponse response = new AuthenticationResponse(
                "accessToken",
                "refreshToken",
                testEmail,
                "Juan Pérez",
                "EXTERNO",
                3600000L,
                1L
        );

        when(authenticationService.authenticate(ArgumentMatchers.any(AuthenticationRequest.class)))
                .thenReturn(response);

        // When & Then
        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Login exitoso"))
                .andExpect(jsonPath("$.data.token").value("accessToken"))
                .andExpect(jsonPath("$.data.refreshToken").value("refreshToken"))
                .andExpect(jsonPath("$.data.email").value(testEmail));

        verify(authenticationService).authenticate(ArgumentMatchers.any(AuthenticationRequest.class));
    }

    @Test
    @DisplayName("POST /api/v1/auth/login - Debe retornar error con credenciales inválidas")
    void debeRetornarErrorCredencialesInvalidas() throws Exception {
        // Given
        AuthenticationRequest request = new AuthenticationRequest(testEmail, "wrongPassword");

        when(authenticationService.authenticate(ArgumentMatchers.any(AuthenticationRequest.class)))
                .thenThrow(new org.springframework.security.authentication.BadCredentialsException("Credenciales inválidas"));

        // When & Then
        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized());

        verify(authenticationService).authenticate(ArgumentMatchers.any(AuthenticationRequest.class));
    }

    @Test
    @DisplayName("POST /api/v1/auth/register - Debe registrar usuario exitosamente")
    void debeRegistrarUsuarioExitosamente() throws Exception {
        // Given
        RegisterRequest request = new RegisterRequest();
        request.setNombre("Juan");
        request.setApellido("Pérez");
        request.setEmail("nuevo@utec.edu.uy");
        request.setPassword("password123");
        request.setConfirmPassword("password123");

        RegisterResponse response = new RegisterResponse(
                "Usuario registrado exitosamente",
                "nuevo@utec.edu.uy",
                "Juan Pérez"
        );

        when(authenticationService.register(ArgumentMatchers.any(RegisterRequest.class)))
                .thenReturn(response);

        // When & Then
        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Usuario registrado exitosamente"))
                .andExpect(jsonPath("$.data.email").value("nuevo@utec.edu.uy"))
                .andExpect(jsonPath("$.data.nombre").value("Juan Pérez"));

        verify(authenticationService).register(ArgumentMatchers.any(RegisterRequest.class));
    }

    @Test
    @DisplayName("POST /api/v1/auth/logout - Debe hacer logout exitosamente")
    void debeHacerLogoutExitosamente() throws Exception {
        // Given
        String validToken = "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ0ZXN0QHV0ZWMuZWR1LnV5IiwiaWF0IjoxNzU5Mjg0OTY4LCJleHAiOjk5OTk5OTk5OTl9.test";
        String authHeader = "Bearer " + validToken;
        doNothing().when(authenticationService).logout(anyString());

        // When & Then
        mockMvc.perform(post("/api/v1/auth/logout")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("Authorization", authHeader))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data").value("Logout exitoso"));

        verify(authenticationService).logout(authHeader);
    }

    @Test
    @DisplayName("POST /api/v1/auth/refresh - Debe refrescar token exitosamente")
    void debeRefrescarTokenExitosamente() throws Exception {
        // Given
        String refreshToken = "validRefreshToken";
        
        AuthenticationResponse response = new AuthenticationResponse(
                "newAccessToken",
                "newRefreshToken",
                testEmail,
                "Juan Pérez",
                "EXTERNO",
                3600000L,
                1L
        );

        when(authenticationService.refreshToken(refreshToken))
                .thenReturn(response);

        // When & Then
        mockMvc.perform(post("/api/v1/auth/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("Refresh-Token", refreshToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Token refrescado exitosamente"))
                .andExpect(jsonPath("$.data.token").value("newAccessToken"))
                .andExpect(jsonPath("$.data.refreshToken").value("newRefreshToken"));

        verify(authenticationService).refreshToken(refreshToken);
    }

    @Test
    @DisplayName("GET /api/v1/auth/verify - Debe verificar token válido")
    void debeVerificarTokenValido() throws Exception {
        // Given
        String validToken = "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ0ZXN0QHV0ZWMuZWR1LnV5IiwiaWF0IjoxNzU5Mjg0OTY4LCJleHAiOjk5OTk5OTk5OTl9.test";
        String authHeader = "Bearer " + validToken;
        when(authenticationService.verifyToken(authHeader)).thenReturn(true);

        // When & Then
        mockMvc.perform(get("/api/v1/auth/verify")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("Authorization", authHeader))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data").value(true));

        verify(authenticationService).verifyToken(authHeader);
    }

    @Test
    @DisplayName("POST /api/v1/auth/verify-email - Debe verificar email exitosamente")
    void debeVerificarEmailExitosamente() throws Exception {
        // Given
        Map<String, String> request = new HashMap<>();
        request.put("token", "validVerificationToken");

        when(authenticationService.verifyEmail("validVerificationToken")).thenReturn(true);

        // When & Then
        mockMvc.perform(post("/api/v1/auth/verify-email")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data").value("¡Email verificado exitosamente! Ya puedes iniciar sesión"));

        verify(authenticationService).verifyEmail("validVerificationToken");
    }

    @Test
    @DisplayName("POST /api/v1/auth/verify-email - Debe retornar error con token inválido")
    void debeRetornarErrorTokenVerificacionInvalido() throws Exception {
        // Given
        Map<String, String> request = new HashMap<>();
        request.put("token", "invalidToken");

        when(authenticationService.verifyEmail("invalidToken")).thenReturn(false);

        // When & Then
        mockMvc.perform(post("/api/v1/auth/verify-email")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.error").value("El código de verificación ha expirado o es inválido. Solicita uno nuevo."));

        verify(authenticationService).verifyEmail("invalidToken");
    }

    @Test
    @DisplayName("POST /api/v1/auth/verify-email - Debe retornar error sin token")
    void debeRetornarErrorSinToken() throws Exception {
        // Given
        Map<String, String> request = new HashMap<>();
        request.put("token", "");

        // When & Then
        mockMvc.perform(post("/api/v1/auth/verify-email")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.error").value("Código de verificación requerido"));

        verify(authenticationService, never()).verifyEmail(anyString());
    }

    @Test
    @DisplayName("POST /api/v1/auth/resend-verification - Debe reenviar email de verificación")
    void debeReenviarEmailVerificacion() throws Exception {
        // Given
        ResendVerificationRequest request = new ResendVerificationRequest();
        request.setEmail(testEmail);

        when(authenticationService.resendVerificationEmail(testEmail)).thenReturn(true);

        // When & Then
        mockMvc.perform(post("/api/v1/auth/resend-verification")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data").value("Se ha enviado un nuevo código de verificación a tu email"));

        verify(authenticationService).resendVerificationEmail(testEmail);
    }

    @Test
    @DisplayName("POST /api/v1/auth/resend-verification - Debe retornar error al fallar reenvío")
    void debeRetornarErrorAlFallarReenvio() throws Exception {
        // Given
        ResendVerificationRequest request = new ResendVerificationRequest();
        request.setEmail(testEmail);

        when(authenticationService.resendVerificationEmail(testEmail)).thenReturn(false);

        // When & Then
        mockMvc.perform(post("/api/v1/auth/resend-verification")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.error").value("No se pudo enviar el código de verificación. Inténtalo nuevamente."));

        verify(authenticationService).resendVerificationEmail(testEmail);
    }

    @Test
    @DisplayName("POST /api/v1/auth/register - Debe validar datos de entrada")
    void debeValidarDatosRegistro() throws Exception {
        // Given - request con datos inválidos (email vacío)
        RegisterRequest request = new RegisterRequest();
        request.setNombre("Juan");
        request.setApellido("Pérez");
        request.setEmail(""); // Email vacío
        request.setPassword("password123");
        request.setConfirmPassword("password123");

        // When & Then
        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());

        verify(authenticationService, never()).register(ArgumentMatchers.any(RegisterRequest.class));
    }
}

