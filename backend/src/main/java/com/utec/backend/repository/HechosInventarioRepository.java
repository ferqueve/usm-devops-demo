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
}
