package com.utec.backend.dto.reserva;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ReservaCreateDto {
    
    @NotNull(message = "El ID del espacio es requerido")
    private Long espacioId;
    
    @NotNull(message = "La fecha de inicio es requerida")
    private LocalDateTime inicio;
    
    @NotNull(message = "La fecha de fin es requerida")
    private LocalDateTime fin;
}

