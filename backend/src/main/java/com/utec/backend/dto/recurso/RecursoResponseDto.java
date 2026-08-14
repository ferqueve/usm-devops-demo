package com.utec.backend.dto.recurso;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RecursoResponseDto {
    private Long id;
    private Long materiaId;
    private String titulo;
    private String descripcion;
    /** ARCHIVO | ENLACE */
    private String tipo;
    /** URL pública: urlOObjectName si ENLACE, getImageUrl(objectName) si ARCHIVO */
    private String url;
    private String mimeType;
    private Long tamanoBytes;
    private Integer paginasEstimadas;
    private String subidoPorNombre;
    private Instant createdAt;
}
