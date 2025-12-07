package com.utec.backend.dto.edificio;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class EdificioResponseDto {
    private Long id;
    private String nombre;
    private String codigo;
    private String descripcion;
    private Boolean activo;
    private Instant createdAt;
    private Instant updatedAt;
    private Instant deletedAt;
}

