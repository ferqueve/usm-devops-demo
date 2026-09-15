package com.utec.backend.repository;

import com.utec.backend.model.InventarioItem;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.Repository;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;

/**
 * Lecturas planas para las estadísticas de inventario.
 *
 * Todo en consultas nativas con los nombres ya resueltos: el cálculo anterior
 * traía la tabla entera tres veces con relaciones perezosas y contaba los
 * espacios dados de baja como espacios sin inventario.
 */
public interface EstadoInventarioRepository extends Repository<InventarioItem, Long> {

    /**
     * Items activos. Un item asignado a un espacio dado de baja queda sin espacio.
     *
     * @return [id, tipoId, tipoNombre, espacioId, espacioNombre, edificioId,
     * estado, cantidad, createdAt, updatedAt, observaciones]
     */
    @Query(value = """
            SELECT i.id, t.id, t.nombre, e.id, e.nombre, e.edificio_id,
                   i.estado, i.cantidad, i.created_at, i.updated_at, i.observaciones
            FROM inventario_item i
            JOIN tipo_elemento t ON t.id = i.tipo_elemento_id
            LEFT JOIN espacio e ON e.id = i.espacio_id AND e.deleted_at IS NULL
            WHERE i.activo = TRUE AND i.deleted_at IS NULL
            """, nativeQuery = true)
    List<Object[]> itemsActivos();

    /** @return [id, nombre, edificioId, edificioNombre], por nombre. */
    @Query(value = """
            SELECT e.id, e.nombre, e.edificio_id, ed.nombre
            FROM espacio e
            LEFT JOIN edificio ed ON ed.id = e.edificio_id
            WHERE e.deleted_at IS NULL
            ORDER BY e.nombre
            """, nativeQuery = true)
    List<Object[]> espaciosActivos();

    /** @return [id, nombre], por nombre. */
    @Query(value = "SELECT t.id, t.nombre FROM tipo_elemento t WHERE t.activo = TRUE ORDER BY t.nombre", nativeQuery = true)
    List<Object[]> tiposActivos();

    /**
     * Items dados de alta en [desde, hasta), por tipo, de mayor a menor.
     *
     * @return [tipoNombre, items, unidades]
     */
    @Query(value = """
            SELECT t.nombre, COUNT(*), COALESCE(SUM(i.cantidad), 0)
            FROM inventario_item i
            JOIN tipo_elemento t ON t.id = i.tipo_elemento_id
            WHERE i.deleted_at IS NULL AND i.created_at >= :desde AND i.created_at < :hasta
            GROUP BY t.nombre
            ORDER BY 2 DESC
            """, nativeQuery = true)
    List<Object[]> altasPorTipo(@Param("desde") Instant desde, @Param("hasta") Instant hasta);

    /** @return [id, nombre] de los edificios que tienen algún espacio activo, por nombre. */
    @Query(value = """
            SELECT DISTINCT ed.id, ed.nombre
            FROM edificio ed
            JOIN espacio e ON e.edificio_id = ed.id AND e.deleted_at IS NULL
            ORDER BY ed.nombre
            """, nativeQuery = true)
    List<Object[]> edificiosConEspacios();
}
