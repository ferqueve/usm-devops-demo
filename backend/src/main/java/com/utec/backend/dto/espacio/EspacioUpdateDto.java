package com.utec.backend.dto.espacio;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class EspacioUpdateDto {
    
    @NotBlank(message = "El nombre del espacio es obligatorio")
    @Size(max = 100, message = "El nombre no puede exceder 100 caracteres")
    private String nombre;
    
    @NotNull(message = "La capacidad es obligatoria")
    @Positive(message = "La capacidad debe ser un número positivo")
    private Integer capacidad;
    
    private String imagenUrl;
    
    @NotNull(message = "El ID del tipo de espacio es obligatorio")
    private Long tipoEspacioId;
}
