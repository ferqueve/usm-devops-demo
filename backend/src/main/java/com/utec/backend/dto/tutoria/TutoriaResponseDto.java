package com.utec.backend.dto.tutoria;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TutoriaResponseDto {
    private Long id;
    private Long materiaId;
    private String materiaNombre;
    private String docenteNombre;
    private Long espacioId;
    private String espacioNombre;
    private Instant inicio;
    private Instant fin;
    private Integer cupo;
    private Integer plazasDisponibles;
    private String estado;
    private Instant createdAt;
    // Solo presente en la vista del estudiante (sus tutorías agendadas): id de su reserva
    private Long reservaId;
}
