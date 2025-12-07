package com.utec.backend.repository;

import com.utec.backend.model.Edificio;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EdificioRepository extends JpaRepository<Edificio, Long> {
    
    // Buscar edificios activos
    List<Edificio> findByActivoTrue();
    
    // Buscar por código
    Optional<Edificio> findByCodigo(String codigo);
    
    // Buscar por nombre (case insensitive)
    @Query("SELECT e FROM Edificio e WHERE LOWER(e.nombre) LIKE LOWER(CONCAT('%', :nombre, '%')) AND e.activo = true")
    List<Edificio> findByNombreContainingIgnoreCaseAndActivoTrue(@Param("nombre") String nombre);
    
    // Verificar si existe un edificio con el mismo código
    boolean existsByCodigo(String codigo);
    
    // Contar edificios activos
    Long countByActivoTrue();
}

