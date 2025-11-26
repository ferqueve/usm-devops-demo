package com.utec.backend.dto.recomendacion;

import com.utec.backend.model.TipoRecomendacion;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * DTO para recomendaciones de items
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class RecomendacionItemDto {
    private Long id;
    private TipoRecomendacion tipoRecomendacion;
    private BigDecimal puntaje;
    private String razon;
    
    // Información del item
    private Long tipoElementoId;
    private String tipoElementoNombre;
    private String tipoElementoDescripcion;
    private Integer cantidadRecomendada;
    private Boolean disponible;
    private Integer cantidadDisponible;
    
    // Información del espacio relacionado (si aplica)
    private Long espacioId;
    private String espacioNombre;
    
    // Información adicional
    private String metadata; // JSON string
}

