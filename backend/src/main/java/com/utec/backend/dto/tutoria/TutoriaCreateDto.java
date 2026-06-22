package com.utec.backend.dto.tutoria;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TutoriaCreateDto {

    @NotNull(message = "La materia es obligatoria")
    private Long materiaId;

    // Espacio opcional
    private Long espacioId;

    @NotNull(message = "La fecha/hora de inicio es obligatoria")
    private Instant inicio;

    @NotNull(message = "La fecha/hora de fin es obligatoria")
    private Instant fin;

    @NotNull(message = "El cupo es obligatorio")
    @Positive(message = "El cupo debe ser mayor que cero")
    private Integer cupo;
}
