package com.utec.backend.dto.tipo_espacio;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TipoEspacioResponseDto {
    private Long id;
    private String nombre;
    private String descripcion;
    private String color;
    private Boolean activo;
    private Instant createdAt;
    private Instant updatedAt;
    private Instant deletedAt;
}
