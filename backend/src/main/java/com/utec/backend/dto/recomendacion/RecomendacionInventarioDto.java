package com.utec.backend.dto.recomendacion;

import com.utec.backend.model.TipoRecomendacion;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * DTO para recomendaciones de inventario y mantenimiento
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class RecomendacionInventarioDto {
    private Long id;
    private TipoRecomendacion tipoRecomendacion;
    private BigDecimal puntaje;
    private String razon;
    
    // Información del item de inventario
    private Long inventarioItemId;
    private Long tipoElementoId;
    private String tipoElementoNombre;
    private Integer cantidad;
    private String estado; // DISPONIBLE, MANTENIMIENTO, DANADO
    private LocalDateTime fechaUltimoMantenimiento;
    private Long diasEnMantenimiento;
    
    // Información del espacio
    private Long espacioId;
    private String espacioNombre;
    private Boolean espacioAsignado;
    
    // Para reasignaciones
    private Long espacioRecomendadoId;
    private String espacioRecomendadoNombre;
    private String razonReasignacion;
    
    // Para compras
    private Integer cantidadNecesaria;
    private Integer stockActual;
    private Integer frecuenciaUso;
    
    // Información adicional
    private String metadata; // JSON string
}

