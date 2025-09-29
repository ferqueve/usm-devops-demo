package com.utec.backend.security.auth;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ResendVerificationRequest {
    
    @NotBlank(message = "El email es requerido")
    @Email(message = "El formato del email no es válido")
    private String email;
}
