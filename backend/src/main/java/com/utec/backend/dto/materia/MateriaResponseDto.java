package com.utec.backend.dto.materia;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class MateriaResponseDto {
    private Long id;
    private String nombre;
    private String codigo;
    private String descripcion;
    private Long carreraId;
    private String carreraNombre;
    private Long docenteId;
    private String docenteNombre;
    private Integer semestre;
    private Integer creditos;
    private Long totalInscriptos; // Opcional
    private List<Long> prerrequisitoIds; // Correlativas (IDs)
    private Instant createdAt;
    private Instant updatedAt;
    private Instant deletedAt;
}
