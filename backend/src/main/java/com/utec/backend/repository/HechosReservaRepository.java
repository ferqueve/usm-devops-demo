package com.utec.backend.repository;

import com.utec.backend.model.HechosReservaDiario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface HechosReservaRepository extends JpaRepository<HechosReservaDiario, Long> {

    /**
     * Borra las filas del rango antes de recomputarlas. Hace al recompute idempotente.
     */
    @Modifying
    @Query(value = "DELETE FROM hechos_reserva_diario WHERE fecha BETWEEN :desde AND :hasta", nativeQuery = true)
    int deleteByFechaBetween(@Param("desde") LocalDate desde, @Param("hasta") LocalDate hasta);

    /**
     * Recomputa el rollup para un rango. Agrupa por (fecha, espacio, carrera, estado)
     * y denormaliza edificio_id desde espacio. Las horas se calculan en Postgres
     * para evitar traer reservas a memoria.
     */
    // La fecha es la del campus: agrupando en UTC, una reserva de las 21:00
    // en Montevideo caia en el dia siguiente.
    @Modifying
    @Query(value = """
            INSERT INTO hechos_reserva_diario (
                fecha, espacio_id, carrera_id, edificio_id, estado,
                cant_reservas, horas_totales, cant_canceladas_late,
                lead_time_promedio_dias, computed_at
            )
            SELECT
                DATE(r.inicio AT TIME ZONE 'America/Montevideo')                                    AS fecha,
                r.espacio_id                                                          AS espacio_id,
                r.carrera_id                                                          AS carrera_id,
                e.edificio_id                                                         AS edificio_id,
                r.estado                                                              AS estado,
                COUNT(*)                                                              AS cant_reservas,
                COALESCE(SUM(EXTRACT(EPOCH FROM (r.fin - r.inicio)) / 3600.0), 0)     AS horas_totales,
                SUM(CASE
                        WHEN r.estado = 'CANCELADO'
                         AND EXTRACT(EPOCH FROM (r.inicio - r.updated_at)) < 86400
                        THEN 1 ELSE 0
                    END)                                                              AS cant_canceladas_late,
                AVG(EXTRACT(EPOCH FROM (r.inicio - r.created_at)) / 86400.0)          AS lead_time_promedio_dias,
                now()                                                                 AS computed_at
            FROM reserva r
            LEFT JOIN espacio e ON e.id = r.espacio_id
            WHERE DATE(r.inicio AT TIME ZONE 'America/Montevideo') BETWEEN :desde AND :hasta
            GROUP BY DATE(r.inicio AT TIME ZONE 'America/Montevideo'), r.espacio_id, r.carrera_id, e.edificio_id, r.estado
            """, nativeQuery = true)
    int recomputeRange(@Param("desde") LocalDate desde, @Param("hasta") LocalDate hasta);

    List<HechosReservaDiario> findByFechaBetween(LocalDate desde, LocalDate hasta);
}
