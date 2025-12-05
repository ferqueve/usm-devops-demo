package com.utec.backend.dto.recomendacion;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;

/**
 * DTO para recomendaciones de horarios
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class HorarioRecomendadoDto {
    private Instant inicio;
    private Instant fin;
    private BigDecimal puntaje;
    private String razon;
    private Boolean disponible;
    private Integer conflictosPotenciales;
    private String metadata; // JSON string
}

