package com.utec.backend.dto.reserva_item_solicitado;

import com.utec.backend.model.ReservaItemSolicitado;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ReservaItemSolicitadoResponseDto {
    private Long id;
    private Long reservaId;
    private Long espacioId;
    private String espacioNombre;
    private Long usuarioId;
    private String solicitanteNombre;
    private String solicitanteEmail;
    private Long tipoElementoId;
    private String tipoElementoNombre;
    private Long inventarioItemId;
    private Integer cantidadSolicitada;
    private ReservaItemSolicitado.EstadoSolicitud estado;
    private String observaciones;
    private LocalDateTime reservaInicio;
    private LocalDateTime reservaFin;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

