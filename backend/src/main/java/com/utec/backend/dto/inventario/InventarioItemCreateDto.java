package com.utec.backend.dto.inventario;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class InventarioItemCreateDto {
    
    @NotNull(message = "El ID del espacio es obligatorio")
    private Long espacioId;
    
    @NotNull(message = "El ID del tipo de elemento es obligatorio")
    private Long tipoElementoId;
    
    @NotNull(message = "La cantidad es obligatoria")
    @Positive(message = "La cantidad debe ser un número positivo")
    private Integer cantidad = 1;
    
    @Size(max = 100, message = "La marca no puede exceder 100 caracteres")
    private String marca;
    
    @Size(max = 100, message = "El modelo no puede exceder 100 caracteres")
    private String modelo;
    
    @Size(max = 100, message = "El número de serie no puede exceder 100 caracteres")
    private String numeroSerie;
    
    @Size(max = 20, message = "El estado no puede exceder 20 caracteres")
    private String estado = "DISPONIBLE";
    
    @Size(max = 1000, message = "Las observaciones no pueden exceder 1000 caracteres")
    private String observaciones;
    
    private LocalDate fechaAdquisicion;
    
    private BigDecimal valorEstimado;
}
