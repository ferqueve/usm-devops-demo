package com.utec.backend.repository;

import com.utec.backend.model.RecursoAcademico;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RecursoAcademicoRepository extends JpaRepository<RecursoAcademico, Long> {

    // Recursos activos de una materia (no eliminados)
    List<RecursoAcademico> findByMateriaIdAndDeletedAtIsNull(Long materiaId);

    // Todos los recursos activos
    List<RecursoAcademico> findAllByDeletedAtIsNull();

    // Recursos activos por tipo (ARCHIVO | ENLACE)
    List<RecursoAcademico> findByTipoAndDeletedAtIsNull(String tipo);

    // Conteo de recursos activos de una materia (para sostenibilidad/estadísticas)
    long countByMateriaIdAndDeletedAtIsNull(Long materiaId);
}
