package com.utec.backend.repository;

import com.utec.backend.model.InventarioItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface InventarioItemRepository extends JpaRepository<InventarioItem, Long> {
    
    // Buscar inventario por espacio
    List<InventarioItem> findByEspacioIdAndActivoTrue(Long espacioId);
    
    // Buscar inventario por tipo de elemento
    List<InventarioItem> findByTipoElementoIdAndActivoTrue(Long tipoElementoId);
    
    // Buscar por estado
    List<InventarioItem> findByEstadoAndActivoTrue(String estado);
    
    // Buscar por marca
    @Query("SELECT i FROM InventarioItem i WHERE LOWER(i.marca) LIKE LOWER(CONCAT('%', :marca, '%')) AND i.activo = true")
    List<InventarioItem> findByMarcaContainingIgnoreCaseAndActivoTrue(@Param("marca") String marca);
    
    // Buscar por modelo
    @Query("SELECT i FROM InventarioItem i WHERE LOWER(i.modelo) LIKE LOWER(CONCAT('%', :modelo, '%')) AND i.activo = true")
    List<InventarioItem> findByModeloContainingIgnoreCaseAndActivoTrue(@Param("modelo") String modelo);
    
    // Buscar por número de serie
    List<InventarioItem> findByNumeroSerieAndActivoTrue(String numeroSerie);
    
    // Buscar por rango de fechas de adquisición
    List<InventarioItem> findByFechaAdquisicionBetweenAndActivoTrue(LocalDate fechaInicio, LocalDate fechaFin);
    
    // Buscar por rango de valor estimado
    @Query("SELECT i FROM InventarioItem i WHERE i.valorEstimado BETWEEN :valorMin AND :valorMax AND i.activo = true")
    List<InventarioItem> findByValorEstimadoBetweenAndActivoTrue(@Param("valorMin") java.math.BigDecimal valorMin, 
                                                                @Param("valorMax") java.math.BigDecimal valorMax);
    
    // Contar items por espacio
    Long countByEspacioIdAndActivoTrue(Long espacioId);
    
    // Contar items por tipo de elemento
    Long countByTipoElementoIdAndActivoTrue(Long tipoElementoId);
    
    // Contar items por estado
    Long countByEstadoAndActivoTrue(String estado);
    
    // Obtener estadísticas de inventario
    @Query("SELECT COUNT(i) FROM InventarioItem i WHERE i.activo = true")
    Long countTotalItems();
    
    @Query("SELECT AVG(i.valorEstimado) FROM InventarioItem i WHERE i.activo = true AND i.valorEstimado IS NOT NULL")
    java.math.BigDecimal getValorPromedio();
    
    @Query("SELECT SUM(i.valorEstimado) FROM InventarioItem i WHERE i.activo = true AND i.valorEstimado IS NOT NULL")
    java.math.BigDecimal getValorTotal();
    
    // Buscar items que necesitan mantenimiento (fecha de adquisición antigua)
    @Query("SELECT i FROM InventarioItem i WHERE i.fechaAdquisicion < :fechaLimite AND i.activo = true")
    List<InventarioItem> findItemsNecesitanMantenimiento(@Param("fechaLimite") LocalDate fechaLimite);
    
    // Buscar items por espacio y tipo
    List<InventarioItem> findByEspacioIdAndTipoElementoIdAndActivoTrue(Long espacioId, Long tipoElementoId);
}
