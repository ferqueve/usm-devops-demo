package com.utec.backend.dto.evento;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class EventoCreateDto {

    @NotBlank(message = "El título es obligatorio")
    private String titulo;

    private String descripcion;

    /** EVENTO | CURSO */
    private String tipo;

    @NotNull(message = "La fecha de inicio es obligatoria")
    private Instant inicio;

    private Instant fin;

    private Integer cupo;

    private Boolean esPublico;

    private Long espacioId;
}
