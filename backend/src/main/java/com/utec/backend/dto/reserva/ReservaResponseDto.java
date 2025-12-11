package com.utec.backend.dto.reserva;

import com.utec.backend.dto.reserva_item_solicitado.ReservaItemSolicitadoResponseDto;
import com.utec.backend.model.Reserva;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ReservaResponseDto {
    private Long id;
    private Long espacioId;
    private String espacioNombre;
    private String espacioImagen;
    private Integer capacidadEspacio;
    private Long tipoEspacioId;
    private String tipoEspacioNombre;
    private String tipoEspacioColor; // Color del tipo de espacio
    private Long usuarioId;
    private String usuarioNombre;
    private String usuarioEmail;
    private Long carreraId;
    private String carreraNombre;
    private String carreraCodigo;
    private Long analistaId;
    private String analistaNombre;
    private String analistaEmail;
    private Instant inicio;
    private Instant fin;
    private Reserva.EstadoReserva estado;
    private Boolean esPublica;
    private String titulo;
    private String motivoSolicitud;
    private String mensajeAnalista;
    private List<ReservaItemSolicitadoResponseDto> itemsSolicitados;
    private Instant createdAt;
    private Instant updatedAt;
}

