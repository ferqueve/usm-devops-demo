package com.utec.backend.dto.carrera;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CarreraResponseDto {
    private Long id;
    private String nombre;
    private String codigo;
    private Instant createdAt;
    private Instant updatedAt;
    private Instant deletedAt;
}

