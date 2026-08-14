package com.utec.backend.repository;

import com.utec.backend.model.TutoriaFeedback;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface TutoriaFeedbackRepository extends JpaRepository<TutoriaFeedback, Long> {

    List<TutoriaFeedback> findByTutoriaIdAndDeletedAtIsNullOrderByCreatedAtDesc(Long tutoriaId);

    Optional<TutoriaFeedback> findByTutoriaIdAndEstudianteIdAndDeletedAtIsNull(Long tutoriaId, Long estudianteId);

    List<TutoriaFeedback> findByDeletedAtIsNull();

    /** Promedio y total de rating por tutoría en una sola query (listados). */
    @Query("select f.tutoria.id as id, avg(f.rating) as promedio, count(f) as total "
            + "from TutoriaFeedback f where f.deletedAt is null and f.tutoria.id in :ids "
            + "group by f.tutoria.id")
    List<TutoriaRatingAgg> agregarPorTutorias(@Param("ids") Collection<Long> ids);

    /** Promedio y total de rating por docente (ranking de tutores). */
    @Query("select t.docente.id as docenteId, avg(f.rating) as promedio, count(f) as total "
            + "from TutoriaFeedback f join f.tutoria t "
            + "where f.deletedAt is null and t.docente is not null "
            + "group by t.docente.id")
    List<DocenteRatingAgg> agregarPorDocente();

    interface TutoriaRatingAgg {
        Long getId();
        Double getPromedio();
        long getTotal();
    }

    interface DocenteRatingAgg {
        Long getDocenteId();
        Double getPromedio();
        long getTotal();
    }
}
