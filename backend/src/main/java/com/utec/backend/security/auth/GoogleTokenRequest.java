package com.utec.backend.security.auth;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class GoogleTokenRequest {
    @NotBlank(message = "El token de Google es requerido")
    private String token;
}

