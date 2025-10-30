package com.utec.backend.dto.reserva;

import com.utec.backend.model.Reserva;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ReservaUpdateDto {
    private LocalDateTime inicio;
    private LocalDateTime fin;
    private Reserva.EstadoReserva estado;
}

