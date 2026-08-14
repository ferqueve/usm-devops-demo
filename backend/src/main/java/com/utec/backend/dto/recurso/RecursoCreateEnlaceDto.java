package com.utec.backend.dto.recurso;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RecursoCreateEnlaceDto {

    @NotBlank(message = "El título es requerido")
    private String titulo;

    @NotBlank(message = "La URL es requerida")
    private String url;

    private String descripcion;
}
