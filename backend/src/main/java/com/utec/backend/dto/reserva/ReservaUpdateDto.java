package com.utec.backend.dto.reserva;

import com.utec.backend.model.Reserva;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ReservaUpdateDto {
    private Instant inicio;
    private Instant fin;
    private Reserva.EstadoReserva estado;
}

