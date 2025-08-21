package com.utec.backend.dto.usuarios;

import com.utec.backend.model.Usuario.RolApp;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CambioRolDto {
    private RolApp rolApp;
}
