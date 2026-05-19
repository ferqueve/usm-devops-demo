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

    /**
     * Matriz cruzada espacio × tipo de elemento contando items activos.
     * Devuelve filas (espacioId, espacioNombre, tipoElementoId, tipoElementoNombre, total).
     */
    @Query(value = """
            SELECT i.espacio_id          AS espacio_id,
                   e.nombre              AS espacio_nombre,
                   i.tipo_elemento_id    AS tipo_id,
                   t.nombre              AS tipo_nombre,
                   COUNT(*)              AS total
            FROM inventario_item i
            LEFT JOIN espacio e        ON e.id = i.espacio_id
            LEFT JOIN tipo_elemento t  ON t.id = i.tipo_elemento_id
            WHERE i.activo = true
              AND i.espacio_id IS NOT NULL
            GROUP BY i.espacio_id, e.nombre, i.tipo_elemento_id, t.nombre
            """, nativeQuery = true)
    List<Object[]> matrizEspacioTipo();
}
