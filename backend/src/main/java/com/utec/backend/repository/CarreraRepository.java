package com.utec.backend.repository;

import com.utec.backend.model.Carrera;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CarreraRepository extends JpaRepository<Carrera, Long> {
    
    // Buscar carreras activas (deleted_at null)
    @Query("SELECT c FROM Carrera c WHERE c.deletedAt IS NULL")
    List<Carrera> findByActivoTrue();
    
    // Buscar por código (ignorando carreras eliminadas)
    @Query("SELECT c FROM Carrera c WHERE c.codigo = :codigo AND c.deletedAt IS NULL")
    Optional<Carrera> findByCodigo(@Param("codigo") String codigo);
    
    // Buscar por nombre (case insensitive, solo activas)
    @Query("SELECT c FROM Carrera c WHERE LOWER(c.nombre) LIKE LOWER(CONCAT('%', :nombre, '%')) AND c.deletedAt IS NULL")
    List<Carrera> findByNombreContainingIgnoreCase(@Param("nombre") String nombre);
    
    // Buscar carrera por código (incluyendo eliminadas)
    @Query("SELECT c FROM Carrera c WHERE c.codigo = :codigo")
    Optional<Carrera> findByCodigoIncludingDeleted(@Param("codigo") String codigo);
    
    // Verificar si existe una carrera con el mismo código (ignorando eliminadas)
    @Query("SELECT COUNT(c) > 0 FROM Carrera c WHERE c.codigo = :codigo AND c.deletedAt IS NULL")
    boolean existsByCodigo(@Param("codigo") String codigo);
    
    // Verificar si existe una carrera con el mismo código excluyendo un ID específico
    @Query("SELECT COUNT(c) > 0 FROM Carrera c WHERE c.codigo = :codigo AND c.id != :id AND c.deletedAt IS NULL")
    boolean existsByCodigoAndIdNot(@Param("codigo") String codigo, @Param("id") Long id);
    
    // Contar carreras activas
    @Query("SELECT COUNT(c) FROM Carrera c WHERE c.deletedAt IS NULL")
    Long countByActivoTrue();
}

