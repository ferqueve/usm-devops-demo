package com.utec.backend.dto.materia;

import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class MateriaUpdateDto {

    @Size(max = 150, message = "El nombre no puede exceder 150 caracteres")
    private String nombre;

    @Size(max = 20, message = "El código no puede exceder 20 caracteres")
    private String codigo;

    private String descripcion;

    private Long carreraId;

    private Long docenteId;

    private Integer semestre;

    private Integer creditos;

    /** IDs de materias correlativas (prerrequisitos). Si viene no-null, reemplaza el set completo. */
    private List<Long> prerrequisitoIds;
}
