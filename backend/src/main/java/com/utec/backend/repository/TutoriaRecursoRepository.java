package com.utec.backend.repository;

import com.utec.backend.model.TutoriaRecurso;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TutoriaRecursoRepository extends JpaRepository<TutoriaRecurso, Long> {

    List<TutoriaRecurso> findByTutoriaIdAndDeletedAtIsNullOrderByCreatedAtAsc(Long tutoriaId);
}
