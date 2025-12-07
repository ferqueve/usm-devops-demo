package com.utec.backend.dto.espacio;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class EspacioResponseDto {
    private Long id;
    private String nombre;
    private Integer capacidad;
    private String imagenUrl;
    private Long tipoEspacioId;
    private String tipoEspacioNombre;
    private String tipoEspacioColor; // Color del tipo de espacio
    private String estado;
    private Long edificioId;
    private String edificioNombre;
    private String edificioCodigo;
    private Instant createdAt;
    private Instant updatedAt;
}
