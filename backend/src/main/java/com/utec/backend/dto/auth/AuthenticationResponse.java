package com.utec.backend.dto.auth;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AuthenticationResponse {
    private String token;
    private String refreshToken;
    private String email;
    private String nombre;
    private String rol;
    private Long expiresIn;
    private Long userId;
}
