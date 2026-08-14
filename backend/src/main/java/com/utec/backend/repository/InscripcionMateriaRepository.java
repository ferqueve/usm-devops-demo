package com.utec.backend.repository;

import com.utec.backend.model.InscripcionMateria;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
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

    /** Inscriptos activos agrupados por materia (una sola query, para métricas agregadas). */
    @Query("select i.materia.id as materiaId, count(i) as total from InscripcionMateria i "
            + "where i.deletedAt is null and i.materia is not null group by i.materia.id")
    List<MateriaConteo> contarInscriptosPorMateria();

    interface MateriaConteo {
        Long getMateriaId();
        long getTotal();
    }
}
