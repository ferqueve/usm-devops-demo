package com.utec.backend.repository;

import com.utec.backend.model.TutoriaReserva;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TutoriaReservaRepository extends JpaRepository<TutoriaReserva, Long> {

    List<TutoriaReserva> findByTutoriaIdAndDeletedAtIsNull(Long tutoriaId);

    List<TutoriaReserva> findByEstudianteIdAndDeletedAtIsNull(Long estudianteId);

    boolean existsByTutoriaIdAndEstudianteIdAndDeletedAtIsNull(Long tutoriaId, Long estudianteId);

    long countByTutoriaIdAndEstadoAndDeletedAtIsNull(Long tutoriaId, String estado);
}
