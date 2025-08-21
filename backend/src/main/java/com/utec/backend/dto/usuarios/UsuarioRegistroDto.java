package com.utec.backend.dto.usuarios;

import com.utec.backend.model.Usuario.RolApp;
import com.utec.backend.validation.annotations.ValidEmail;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UsuarioRegistroDto {
    @NotBlank(message = "El email es obligatorio")
    @ValidEmail
    private String email;
    
    @NotBlank(message = "El nombre es obligatorio")
    @Size(min = 2, max = 100, message = "El nombre debe tener entre 2 y 100 caracteres")
    private String nombre;
    
    @NotBlank(message = "La contraseña es obligatoria")
    @Size(min = 6, message = "La contraseña debe tener al menos 6 caracteres")
    private String password;
    
    @NotNull(message = "El rol es obligatorio")
    private RolApp rolApp;
}
