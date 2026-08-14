package com.utec.backend.dto.materia;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class MateriaCreateDto {

    @NotBlank(message = "El nombre de la materia es obligatorio")
    @Size(max = 150, message = "El nombre no puede exceder 150 caracteres")
    private String nombre;

    @Size(max = 20, message = "El código no puede exceder 20 caracteres")
    private String codigo; // Opcional

    private String descripcion; // Opcional

    @NotNull(message = "La carrera es obligatoria")
    private Long carreraId;

    private Long docenteId; // Opcional

    private Integer semestre;

    private Integer creditos;

    /** IDs de materias correlativas (prerrequisitos) de la misma carrera. */
    private List<Long> prerrequisitoIds;
}
