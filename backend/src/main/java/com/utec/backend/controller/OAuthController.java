package com.utec.backend.controller;

import com.utec.backend.dto.auth.AuthenticationResponse;
import com.utec.backend.exception.AuthenticationException;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Map;

@Tag(name = "OAuth2", description = "Endpoints para autenticación con OAuth2 (Google)")
@RestController
@RequestMapping("/api/v1/oauth2")
@RequiredArgsConstructor
@Slf4j
public class OAuthController {

    private final com.utec.backend.service.OAuth2Service oauth2Service;

    @Value("${spring.security.oauth2.client.registration.google.client-id}")
    private String googleClientId;

    @Value("${app.frontend.url:http://localhost:5173}")
    private String frontendUrl;

    @Value("${app.backend.url:http://localhost:8080}")
    private String backendUrl;

    /**
     * Inicia el flujo OAuth redirigiendo al usuario a Google
     * El frontend llama a este endpoint y el usuario es redirigido a Google
     */
    @Operation(summary = "Autorizar con Google", description = "Redirigir al usuario para autenticación con Google OAuth2")
    @GetMapping("/google/authorize")
    public void initiateGoogleLogin(HttpServletResponse response) throws IOException {
        String redirectUri = backendUrl + "/api/v1/oauth2/google/callback";
        String state = generateState();
        
        // Guardar state para validación posterior (implementar si es necesario)
        
        String googleAuthUrl = String.format(
            "https://accounts.google.com/o/oauth2/v2/auth?" +
            "client_id=%s&" +
            "redirect_uri=%s&" +
            "response_type=code&" +
            "scope=openid%%20email%%20profile&" +
            "state=%s&" +
            "access_type=offline",
            googleClientId,
            URLEncoder.encode(redirectUri, StandardCharsets.UTF_8),
            state
        );

        log.info("Redirigiendo usuario a Google OAuth: {}", googleAuthUrl);
        response.sendRedirect(googleAuthUrl);
    }

    /**
     * Callback endpoint que recibe el código de autorización de Google
     * Google redirige aquí después de la autorización del usuario
     */
    @Operation(summary = "Callback de Google", description = "Procesar código de autorización devuelto por Google OAuth2")
    @GetMapping("/google/callback")
    public void handleGoogleCallback(
        @RequestParam(required = false) String code,
        @RequestParam(required = false) String error,
        @RequestParam(required = false) String state,
        HttpServletResponse response
    ) throws IOException {
        
        if (error != null) {
            log.error("Error en OAuth callback: {}", error);
            response.sendRedirect(frontendUrl + "/auth?error=oauth_error");
            return;
        }

        if (code == null) {
            log.error("Código de autorización no recibido");
            response.sendRedirect(frontendUrl + "/auth?error=no_code");
            return;
        }

        try {
            // Intercambiar código por tokens y autenticar usuario
            AuthenticationResponse authResponse = oauth2Service.handleGoogleCallback(code);
            
            // Redirigir al frontend con los tokens en la URL (o usar otro método seguro)
            String redirectUrl = String.format(
                "%s/auth/callback/success?token=%s&refresh_token=%s&email=%s&nombre=%s&rol=%s",
                frontendUrl,
                URLEncoder.encode(authResponse.getToken(), StandardCharsets.UTF_8),
                URLEncoder.encode(authResponse.getRefreshToken(), StandardCharsets.UTF_8),
                URLEncoder.encode(authResponse.getEmail(), StandardCharsets.UTF_8),
                URLEncoder.encode(authResponse.getNombre(), StandardCharsets.UTF_8),
                URLEncoder.encode(authResponse.getRol(), StandardCharsets.UTF_8)
            );
            
            log.info("OAuth exitoso, redirigiendo a frontend");
            response.sendRedirect(redirectUrl);
            
        } catch (AuthenticationException e) {
            // Capturar específicamente AuthenticationException y pasar el mensaje
            log.error("Error de autenticación en callback de Google: {}", e.getMessage());
            String errorMessage = e.getMessage() != null ? e.getMessage() : "Error de autenticación";
            String redirectUrl = String.format(
                "%s/auth?error=%s",
                frontendUrl,
                URLEncoder.encode(errorMessage, StandardCharsets.UTF_8)
            );
            response.sendRedirect(redirectUrl);
        } catch (Exception e) {
            log.error("Error procesando callback de Google: {}", e.getMessage());
            response.sendRedirect(frontendUrl + "/auth?error=callback_error");
        }
    }

    /**
     * Endpoint alternativo para obtener información de OAuth (para debugging)
     */
    @Operation(summary = "Información OAuth", description = "Obtener configuración de OAuth para debugging")
    @GetMapping("/google/info")
    public ResponseEntity<Map<String, String>> getOAuthInfo() {
        return ResponseEntity.ok(Map.of(
            "client_id", googleClientId,
            "frontend_url", frontendUrl,
            "redirect_uri", frontendUrl + "/auth/callback/google"
        ));
    }

    private String generateState() {
        // Implementar generación de state aleatorio para seguridad
        return "random_state_" + System.currentTimeMillis();
    }
}
