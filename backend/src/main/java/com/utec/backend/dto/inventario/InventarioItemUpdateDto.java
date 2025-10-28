package com.utec.backend.dto.inventario;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class InventarioItemUpdateDto {
    
    // Espacio es opcional para permitir desasignación
    private Long espacioId;
    
    @NotNull(message = "El ID del tipo de elemento es obligatorio")
    private Long tipoElementoId;
    
    @NotNull(message = "La cantidad es obligatoria")
    @Positive(message = "La cantidad debe ser un número positivo")
    private Integer cantidad;
    
    @Size(max = 20, message = "El estado no puede exceder 20 caracteres")
    private String estado;
    
    @Size(max = 1000, message = "Las observaciones no pueden exceder 1000 caracteres")
    private String observaciones;
}
