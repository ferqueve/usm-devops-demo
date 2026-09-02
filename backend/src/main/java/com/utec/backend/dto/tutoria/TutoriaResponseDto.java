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
    private String modalidad;
    private String enlace;
    private String tipo;
    private String tags;
    private Boolean enVivo;
    private String patron;
    private Instant createdAt;
    // Agregados
    private long agendadosCount;
    private long enEsperaCount;
    private double ratingPromedio;
    private long ratingTotal;
    // Solo presente en la vista del estudiante (sus tutorías agendadas)
    private Long reservaId;
    private String reservaEstado;
    private Boolean reservaConfirmada;
    private String reservaTemario;
}
