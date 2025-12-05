package com.utec.backend.repository;

import com.utec.backend.model.Espacio;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;

@Repository
public interface EspacioRepository extends JpaRepository<Espacio, Long> {
    
    // Buscar espacios por nombre (case insensitive)
    @Query("SELECT e FROM Espacio e WHERE LOWER(e.nombre) LIKE LOWER(CONCAT('%', :nombre, '%'))")
    List<Espacio> findByNombreContainingIgnoreCase(@Param("nombre") String nombre);
    
    // Buscar espacios disponibles (sin reservas activas en un rango de tiempo)
    @Query("SELECT e FROM Espacio e WHERE e.id NOT IN " +
           "(SELECT r.espacio.id FROM Reserva r WHERE r.estado = 'APROBADO' " +
           "AND ((r.inicio <= :fin AND r.fin >= :inicio)))")
    List<Espacio> findEspaciosDisponibles(@Param("inicio") Instant inicio, 
                                         @Param("fin") Instant fin);
    
    // Buscar espacios por capacidad mínima
    List<Espacio> findByCapacidadGreaterThanEqual(Integer capacidadMinima);
    
    // Buscar espacios por capacidad máxima
    List<Espacio> findByCapacidadLessThanEqual(Integer capacidadMaxima);
    
    // Buscar espacios por rango de capacidad
    List<Espacio> findByCapacidadBetween(Integer capacidadMinima, Integer capacidadMaxima);
    
    // Buscar espacios por tipo de espacio
    List<Espacio> findByTipoEspacioId(Long tipoEspacioId);
    
    // Buscar espacios por capacidad exacta
    List<Espacio> findByCapacidad(Integer capacidad);
    
    // Contar espacios por capacidad
    @Query("SELECT COUNT(e) FROM Espacio e WHERE e.capacidad >= :capacidadMinima")
    Long countByCapacidadMinima(@Param("capacidadMinima") Integer capacidadMinima);
    
    // Obtener estadísticas de espacios
    @Query("SELECT COUNT(e) FROM Espacio e")
    Long countTotalEspacios();
    
    @Query("SELECT AVG(e.capacidad) FROM Espacio e")
    Double getCapacidadPromedio();
    
    @Query("SELECT MAX(e.capacidad) FROM Espacio e")
    Integer getCapacidadMaxima();
    
    @Query("SELECT MIN(e.capacidad) FROM Espacio e")
    Integer getCapacidadMinima();
}
