package com.utec.backend.dto.usuario;

import com.utec.backend.model.Usuario.RolApp;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UsuarioResponseDto {
    private Long id;
    private String email;
    private String nombre;
    private RolApp rolApp;
    private Boolean verificado;
    private Boolean activo; // true si deletedAt es null
    private String oauthProv;
    private Boolean hasPassword; // true si el usuario tiene contraseña establecida
    private Instant createdAt;
    private Instant updatedAt;
}
