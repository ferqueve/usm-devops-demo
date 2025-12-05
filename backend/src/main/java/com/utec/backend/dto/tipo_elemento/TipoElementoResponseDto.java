package com.utec.backend.dto.tipo_elemento;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TipoElementoResponseDto {
    private Long id;
    private String nombre;
    private String descripcion;
    private Boolean activo;
    private Instant createdAt;
    private Instant updatedAt;
}
