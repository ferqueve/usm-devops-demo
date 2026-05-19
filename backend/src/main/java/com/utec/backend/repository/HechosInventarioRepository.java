package com.utec.backend.repository;

import com.utec.backend.model.HechosInventarioDiario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface HechosInventarioRepository extends JpaRepository<HechosInventarioDiario, Long> {

    @Modifying
    @Query(value = "DELETE FROM hechos_inventario_diario WHERE fecha = :fecha", nativeQuery = true)
    int deleteByFecha(@Param("fecha") LocalDate fecha);

    /**
     * Snapshot del estado actual del inventario activo, etiquetado con :fecha.
     * Se ejecuta una vez por día; el grano es (fecha × espacio × tipo × estado).
     */
    @Modifying
    @Query(value = """
            INSERT INTO hechos_inventario_diario (
                fecha, espacio_id, tipo_elemento_id, estado,
                count_items, suma_cantidad, computed_at
            )
            SELECT
                :fecha                            AS fecha,
                i.espacio_id                      AS espacio_id,
                i.tipo_elemento_id                AS tipo_elemento_id,
                i.estado                          AS estado,
                COUNT(*)                          AS count_items,
                COALESCE(SUM(i.cantidad), 0)      AS suma_cantidad,
                now()                             AS computed_at
            FROM inventario_item i
            WHERE i.activo = true
            GROUP BY i.espacio_id, i.tipo_elemento_id, i.estado
            """, nativeQuery = true)
    int snapshotForDate(@Param("fecha") LocalDate fecha);

    @Query(value = "SELECT MAX(fecha) FROM hechos_inventario_diario", nativeQuery = true)
    Optional<LocalDate> findUltimaFecha();

    List<HechosInventarioDiario> findByFecha(LocalDate fecha);

    /**
     * Serie temporal del estado del parque: para cada fecha del rango,
     * cuántos ítems había en cada estado.
     */
    @Query(value = """
            SELECT h.fecha           AS fecha,
                   h.estado          AS estado,
                   SUM(h.count_items) AS total
            FROM hechos_inventario_diario h
            WHERE h.fecha BETWEEN :desde AND :hasta
            GROUP BY h.fecha, h.estado
            ORDER BY h.fecha
            """, nativeQuery = true)
    List<Object[]> evolucionEstado(@Param("desde") LocalDate desde, @Param("hasta") LocalDate hasta);

    /**
     * Crecimiento del parque a lo largo del tiempo (filas y unidades por fecha).
     */
    @Query(value = """
            SELECT h.fecha                AS fecha,
                   SUM(h.count_items)     AS items,
                   SUM(h.suma_cantidad)   AS unidades
            FROM hechos_inventario_diario h
            WHERE h.fecha BETWEEN :desde AND :hasta
            GROUP BY h.fecha
            ORDER BY h.fecha
            """, nativeQuery = true)
    List<Object[]> evolucionParque(@Param("desde") LocalDate desde, @Param("hasta") LocalDate hasta);

    /**
     * Comparación entre dos snapshots: para cada espacio, total de ítems en
     * cada fecha. Pensado para calcular el delta en el service.
     */
    @Query(value = """
            SELECT h.fecha                AS fecha,
                   h.espacio_id           AS espacio_id,
                   e.nombre               AS espacio_nombre,
                   SUM(h.count_items)     AS items,
                   SUM(h.suma_cantidad)   AS unidades
            FROM hechos_inventario_diario h
            LEFT JOIN espacio e ON e.id = h.espacio_id
            WHERE h.fecha IN (:fechaInicio, :fechaFin)
            GROUP BY h.fecha, h.espacio_id, e.nombre
            """, nativeQuery = true)
    List<Object[]> snapshotsPorEspacio(@Param("fechaInicio") LocalDate fechaInicio,
                                       @Param("fechaFin") LocalDate fechaFin);
}
