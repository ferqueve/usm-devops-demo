package com.utec.backend.dto.usuario;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UsuarioStatsDto {
    private Long totalUsuarios;
    private Long totalActivos;
    private Long totalInactivos;
    private Long totalVerificados;
    private Long totalNoVerificados;
    private Map<String, Long> usuariosPorRol; // ADMIN: 5, DOCENTE: 10, etc.
    private Map<String, Long> usuariosPorProveedor; // LOCAL: 15, GOOGLE: 5
}
