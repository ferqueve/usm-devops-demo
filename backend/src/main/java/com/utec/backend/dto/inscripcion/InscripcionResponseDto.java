package com.utec.backend.dto.inscripcion;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class InscripcionResponseDto {
    private Long id;
    private Long materiaId;
    private String materiaNombre;
    private Long estudianteId;
    private String estudianteNombre;
    private String estado;
    private Instant createdAt;
}
