package com.utec.backend.dto.reserva_item_solicitado;

import com.utec.backend.model.ReservaItemSolicitado;
import jakarta.validation.constraints.Size;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class ReservaItemSolicitadoUpdateDto {

    private ReservaItemSolicitado.EstadoSolicitud estado;

    /**
     * Identificador del item de inventario que se desea asociar.
     * Si es null, se mantiene la asignación anterior; si es 0, se fuerza la desasignación.
     */
    private Long inventarioItemId;

    @Size(max = 2000, message = "Las observaciones no pueden exceder 2000 caracteres")
    private String observaciones;
}

