package com.utec.backend.dto.evento;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class EventoUpdateDto {

    private String titulo;

    private String descripcion;

    /** EVENTO | CURSO */
    private String tipo;

    private Instant inicio;

    private Instant fin;

    private Integer cupo;

    private Boolean esPublico;

    private Long espacioId;

    /** BORRADOR | PUBLICADO | FINALIZADO | CANCELADO */
    private String estado;
}
