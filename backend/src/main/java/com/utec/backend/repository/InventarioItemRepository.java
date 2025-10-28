package com.utec.backend.repository;

import com.utec.backend.model.InventarioItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface InventarioItemRepository extends JpaRepository<InventarioItem, Long>, JpaSpecificationExecutor<InventarioItem> {
    
    // Buscar inventario por espacio
    List<InventarioItem> findByEspacioIdAndActivoTrue(Long espacioId);
    
    // Buscar inventario por tipo de elemento
    List<InventarioItem> findByTipoElementoIdAndActivoTrue(Long tipoElementoId);
    
    // Buscar por estado
    List<InventarioItem> findByEstadoAndActivoTrue(String estado);
    
    // Contar items por espacio
    Long countByEspacioIdAndActivoTrue(Long espacioId);
    
    // Contar items por tipo de elemento
    Long countByTipoElementoIdAndActivoTrue(Long tipoElementoId);
    
    // Contar items por estado
    Long countByEstadoAndActivoTrue(String estado);
    
    // Obtener estadísticas de inventario
    @Query("SELECT COUNT(i) FROM InventarioItem i WHERE i.activo = true")
    Long countTotalItems();
    
    // Buscar items por espacio y tipo
    List<InventarioItem> findByEspacioIdAndTipoElementoIdAndActivoTrue(Long espacioId, Long tipoElementoId);
}
