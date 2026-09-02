package com.utec.backend.dto.evento;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class EventoResponseDto {
    private Long id;
    private String titulo;
    private String descripcion;
    private String tags;
    private String tipo;
    private Instant inicio;
    private Instant fin;
    private Integer cupo;
    private Integer plazasDisponibles;
    private Boolean esPublico;
    private Long espacioId;
    private String espacioNombre;
    private String organizadorNombre;
    private String estado;
    private String patron;
    private long inscriptosCount;
    private boolean yaInscrito;
    private Instant createdAt;
}
