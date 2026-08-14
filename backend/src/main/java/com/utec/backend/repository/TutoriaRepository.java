package com.utec.backend.repository;

import com.utec.backend.model.Tutoria;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TutoriaRepository extends JpaRepository<Tutoria, Long> {

    @EntityGraph(attributePaths = {"materia", "docente", "espacio"})
    List<Tutoria> findByDeletedAtIsNull();

    @EntityGraph(attributePaths = {"materia", "docente", "espacio"})
    List<Tutoria> findByMateriaIdAndDeletedAtIsNull(Long materiaId);

    @EntityGraph(attributePaths = {"materia", "docente", "espacio"})
    List<Tutoria> findByDocenteIdAndDeletedAtIsNull(Long docenteId);

    List<Tutoria> findByEstadoAndRecordatorioEnviadoFalseAndDeletedAtIsNull(String estado);

    List<Tutoria> findByEstadoAndDeletedAtIsNull(String estado);
}
