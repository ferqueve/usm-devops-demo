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

    /**
     * Resumen del inventario activo en una sola pasada: total, disponibles, en
     * mantenimiento, danados y sin espacio asignado.
     *
     * Antes se traia la tabla entera y se contaba en memoria, una pasada por
     * metrica. Devuelve una sola fila; se declara como lista porque una
     * proyeccion de varias columnas vuelve envuelta.
     *
     * @return [total, disponibles, mantenimiento, danados, sinAsignar, tiposDistintos]
     */
    @Query("""
            SELECT COUNT(i),
                   SUM(CASE WHEN i.estado = 'DISPONIBLE' THEN 1 ELSE 0 END),
                   SUM(CASE WHEN i.estado = 'MANTENIMIENTO' THEN 1 ELSE 0 END),
                   SUM(CASE WHEN i.estado = 'DANADO' THEN 1 ELSE 0 END),
                   SUM(CASE WHEN i.espacio IS NULL THEN 1 ELSE 0 END),
                   COUNT(DISTINCT i.tipoElemento.id)
            FROM InventarioItem i
            WHERE i.activo = true
            """)
    List<Object[]> resumenInventario();
    
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
