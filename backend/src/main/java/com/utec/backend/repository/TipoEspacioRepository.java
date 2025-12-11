package com.utec.backend.repository;

import com.utec.backend.model.TipoEspacio;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TipoEspacioRepository extends JpaRepository<TipoEspacio, Long> {
    
    // Buscar tipos activos
    List<TipoEspacio> findByActivoTrue();
    
    // Buscar por nombre (case insensitive)
    @Query("SELECT t FROM TipoEspacio t WHERE LOWER(t.nombre) LIKE LOWER(CONCAT('%', :nombre, '%')) AND t.activo = true")
    List<TipoEspacio> findByNombreContainingIgnoreCaseAndActivoTrue(@Param("nombre") String nombre);
    
    // Verificar si existe un tipo con el mismo nombre
    boolean existsByNombreIgnoreCase(String nombre);
    
    // Buscar por nombre ignorando si está activo o no
    @Query("SELECT t FROM TipoEspacio t WHERE LOWER(t.nombre) = LOWER(:nombre)")
    java.util.Optional<TipoEspacio> findByNombreIgnoreCase(@Param("nombre") String nombre);
    
    // Verificar si existe un tipo con el mismo nombre excluyendo un ID específico
    @Query("SELECT COUNT(t) > 0 FROM TipoEspacio t WHERE LOWER(t.nombre) = LOWER(:nombre) AND t.id != :id")
    boolean existsByNombreIgnoreCaseAndIdNot(@Param("nombre") String nombre, @Param("id") Long id);
    
    // Contar tipos activos
    Long countByActivoTrue();
    
    // Obtener tipos más utilizados
    @Query("SELECT t FROM TipoEspacio t " +
           "LEFT JOIN t.espacios e " +
           "WHERE t.activo = true " +
           "GROUP BY t.id " +
           "ORDER BY COUNT(e) DESC")
    List<TipoEspacio> findTiposMasUtilizados();
}
