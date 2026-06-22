package com.utec.backend.repository;

import com.utec.backend.model.Tutoria;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TutoriaRepository extends JpaRepository<Tutoria, Long> {

    List<Tutoria> findByDeletedAtIsNull();

    List<Tutoria> findByMateriaIdAndDeletedAtIsNull(Long materiaId);

    List<Tutoria> findByDocenteIdAndDeletedAtIsNull(Long docenteId);
}
