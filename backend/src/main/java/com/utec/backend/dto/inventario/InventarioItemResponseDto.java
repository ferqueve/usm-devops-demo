package com.utec.backend.dto.inventario;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class InventarioItemResponseDto {
    private Long id;
    private Long espacioId;
    private String espacioNombre;
    private Long tipoElementoId;
    private String tipoElementoNombre;
    private Integer cantidad;
    private String marca;
    private String modelo;
    private String numeroSerie;
    private String estado;
    private String observaciones;
    private LocalDate fechaAdquisicion;
    private BigDecimal valorEstimado;
    private Boolean activo;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
