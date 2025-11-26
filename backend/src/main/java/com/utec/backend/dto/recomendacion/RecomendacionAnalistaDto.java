package com.utec.backend.dto.recomendacion;

import com.utec.backend.model.TipoRecomendacion;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * DTO para recomendaciones de analistas y reservas prioritarias
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class RecomendacionAnalistaDto {
    private Long id;
    private TipoRecomendacion tipoRecomendacion;
    private BigDecimal puntaje;
    private String razon;
    
    // Para asignación de analista
    private Long analistaId;
    private String analistaNombre;
    private String analistaEmail;
    private Integer cargaTrabajoActual;
    private Integer reservasPendientes;
    private Integer reservasCompletadas;
    private Double tasaAprobacion;
    
    // Para reservas prioritarias
    private Long reservaId;
    private Long docenteId;
    private String docenteNombre;
    private String docenteEmail;
    private Long espacioId;
    private String espacioNombre;
    private LocalDateTime inicio;
    private LocalDateTime fin;
    private Integer diasPendiente;
    private Integer urgencia; // 1-10
    
    // Información adicional
    private String metadata; // JSON string
}

