package com.utec.backend.repository;

import com.utec.backend.model.Materia;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MateriaRepository extends JpaRepository<Materia, Long> {

    // Buscar materias activas (deleted_at null)
    @Query("SELECT m FROM Materia m WHERE m.deletedAt IS NULL")
    List<Materia> findByActivoTrue();

    // Buscar materias activas dictadas por un docente
    @Query("SELECT m FROM Materia m WHERE m.docente.id = :docenteId AND m.deletedAt IS NULL")
    List<Materia> findByDocenteId(@Param("docenteId") Long docenteId);

    // Buscar materias activas de una carrera
    @Query("SELECT m FROM Materia m WHERE m.carrera.id = :carreraId AND m.deletedAt IS NULL")
    List<Materia> findByCarreraId(@Param("carreraId") Long carreraId);

    // Buscar por nombre (case insensitive, solo activas)
    @Query("SELECT m FROM Materia m WHERE LOWER(m.nombre) LIKE LOWER(CONCAT('%', :nombre, '%')) AND m.deletedAt IS NULL")
    List<Materia> findByNombreContainingIgnoreCase(@Param("nombre") String nombre);

    // Contar materias activas
    @Query("SELECT COUNT(m) FROM Materia m WHERE m.deletedAt IS NULL")
    Long countByActivoTrue();
}
