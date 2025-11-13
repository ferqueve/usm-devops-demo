package com.utec.backend.dto.reserva_item_solicitado;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ReservaItemSolicitadoCreateDto {
    
    @NotNull(message = "El ID del tipo de elemento es requerido")
    private Long tipoElementoId;
    
    private Long inventarioItemId; // Opcional - si se especifica un item específico
    
    @NotNull(message = "La cantidad solicitada es requerida")
    @Min(value = 1, message = "La cantidad debe ser al menos 1")
    private Integer cantidadSolicitada = 1;
    
    private String observaciones; // Opcional
}

