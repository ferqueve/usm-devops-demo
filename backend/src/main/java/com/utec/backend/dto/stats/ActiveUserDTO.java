package com.utec.backend.dto.stats;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

/**
 * DTO para representar un usuario activo en el sistema
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ActiveUserDTO {
    private String email;
    private String nombre;
    private String apellido;
    private String rol;
    private Instant lastActivity;
    private String ipAddress;
    private String userAgent;
}
