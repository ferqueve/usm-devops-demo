package com.utec.backend.dto.usuarios;

import com.utec.backend.model.Usuario.RolApp;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UsuarioResponseDto {
    private Long id;
    private String email;
    private String nombre;
    private RolApp rolApp;
}
