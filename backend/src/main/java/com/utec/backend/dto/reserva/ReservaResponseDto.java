package com.utec.backend.dto.reserva;

import com.utec.backend.model.Reserva;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ReservaResponseDto {
    private Long id;
    private Long espacioId;
    private String espacioNombre;
    private String espacioImagen;
    private Integer capacidadEspacio;
    private Long usuarioId;
    private String usuarioNombre;
    private String usuarioEmail;
    private LocalDateTime inicio;
    private LocalDateTime fin;
    private Reserva.EstadoReserva estado;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

