package com.utec.backend.security.oauth;

import com.utec.backend.common.api.ApiResponse;
import com.utec.backend.security.auth.AuthenticationResponse;
import com.utec.backend.security.auth.GoogleTokenRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/oauth2")
@RequiredArgsConstructor
public class OAuthController {

    private final OAuth2Service oauth2Service;

    /**
     * Endpoint para autenticación con Google OAuth
     * 
     * @param request Token de Google obtenido desde el frontend
     * @return Tokens JWT y datos del usuario
     */
    @PostMapping("/google")
    public ResponseEntity<ApiResponse<AuthenticationResponse>> googleLogin(
        @Valid @RequestBody GoogleTokenRequest request
    ) {
        AuthenticationResponse response = oauth2Service.authenticateWithGoogle(request);
        return ResponseEntity.ok(ApiResponse.success(response, "Login con Google exitoso"));
    }
}

