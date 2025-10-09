package com.utec.backend.dto.usuarios;

import com.utec.backend.model.entity.Usuario.RolApp;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

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
    private LocalDateTime createdAt;
}
