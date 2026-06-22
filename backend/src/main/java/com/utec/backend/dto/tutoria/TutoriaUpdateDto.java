package com.utec.backend.dto.tutoria;

import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TutoriaUpdateDto {

    private Long materiaId;

    private Long espacioId;

    private Instant inicio;

    private Instant fin;

    @Positive(message = "El cupo debe ser mayor que cero")
    private Integer cupo;

    /** ABIERTA | CERRADA | CANCELADA */
    private String estado;
}
