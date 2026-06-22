package com.utec.backend.repository;

import com.utec.backend.model.InscripcionMateria;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface InscripcionMateriaRepository extends JpaRepository<InscripcionMateria, Long> {

    // Inscripciones activas de un estudiante
    List<InscripcionMateria> findByEstudianteIdAndDeletedAtIsNull(Long estudianteId);

    // Inscripciones activas de una materia
    List<InscripcionMateria> findByMateriaIdAndDeletedAtIsNull(Long materiaId);

    // Verificar si un estudiante ya está inscripto (activo) en una materia
    boolean existsByMateriaIdAndEstudianteIdAndDeletedAtIsNull(Long materiaId, Long estudianteId);

    // Contar inscriptos activos de una materia
    long countByMateriaIdAndDeletedAtIsNull(Long materiaId);
}
