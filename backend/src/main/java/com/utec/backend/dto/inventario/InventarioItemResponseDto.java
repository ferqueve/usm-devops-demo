package com.utec.backend.dto.inventario;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class InventarioItemResponseDto {
    private Long id;
    private Long espacioId;
    private String espacioNombre;
    private String espacioColor;
    private Long tipoElementoId;
    private String tipoElementoNombre;
    private Integer cantidad;
    private String estado;
    private String observaciones;
    private Boolean activo;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
