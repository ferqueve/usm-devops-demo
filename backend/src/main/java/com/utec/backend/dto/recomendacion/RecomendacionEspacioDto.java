package com.utec.backend.dto.recomendacion;

import com.utec.backend.model.TipoRecomendacion;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * DTO para recomendaciones de espacios
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class RecomendacionEspacioDto {
    private Long id;
    private TipoRecomendacion tipoRecomendacion;
    private BigDecimal puntaje;
    private String razon;
    
    // Información del espacio
    private Long espacioId;
    private String espacioNombre;
    private String espacioImagen;
    private Integer capacidad;
    private Long tipoEspacioId;
    private String tipoEspacioNombre;
    private String tipoEspacioColor;
    private String estado;
    private Boolean disponible;
    
    // Información adicional
    private String metadata; // JSON string
}

