package com.utec.backend.dto.recomendacion;

import com.utec.backend.model.TipoRecomendacion;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * DTO base para todas las recomendaciones
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class RecomendacionResponseDto {
    private Long id;
    private Long usuarioId;
    private String usuarioNombre;
    private Long espacioId;
    private String espacioNombre;
    private TipoRecomendacion tipoRecomendacion;
    private BigDecimal puntaje;
    private String razon;
    private String metadata; // JSON string
}

