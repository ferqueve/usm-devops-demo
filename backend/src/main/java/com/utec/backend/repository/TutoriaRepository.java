package com.utec.backend.repository;

import com.utec.backend.model.Tutoria;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
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

    /**
     * Tutorías vigentes que solapan con un rango en un espacio dado.
     *
     * <p>El solapamiento es estricto ({@code <}): dos actividades pegadas (una termina
     * 14:00, otra empieza 14:00) no se consideran en conflicto.
     *
     * @param excluirId id a ignorar (la propia tutoría al editarla); puede ser null
     */
    @Query("SELECT t FROM Tutoria t WHERE t.espacio.id = :espacioId " +
           "AND t.deletedAt IS NULL " +
           "AND t.estado <> 'CANCELADA' " +
           "AND (:excluirId IS NULL OR t.id <> :excluirId) " +
           "AND t.inicio < :fin AND :inicio < t.fin")
    List<Tutoria> findSolapadasEnEspacio(
        @Param("espacioId") Long espacioId,
        @Param("inicio") Instant inicio,
        @Param("fin") Instant fin,
        @Param("excluirId") Long excluirId
    );
}
