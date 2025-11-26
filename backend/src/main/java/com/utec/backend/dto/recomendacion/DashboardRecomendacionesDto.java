package com.utec.backend.dto.recomendacion;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * DTO para recomendaciones del dashboard personalizado por rol
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class DashboardRecomendacionesDto {
    private List<RecomendacionEspacioDto> espaciosRecomendados;
    private List<RecomendacionItemDto> itemsRecomendados;
    private List<RecomendacionInventarioDto> mantenimientoUrgente;
    private List<RecomendacionAnalistaDto> reservasPrioritarias;
    private Integer totalRecomendaciones;
}

