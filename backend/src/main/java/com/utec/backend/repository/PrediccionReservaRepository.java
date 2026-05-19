package com.utec.backend.repository;

import com.utec.backend.model.PrediccionReserva;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface PrediccionReservaRepository extends JpaRepository<PrediccionReserva, Long> {

    @Query("""
            SELECT p FROM PrediccionReserva p
             WHERE p.modeloId = :modeloId
             ORDER BY p.fechaObjetivo
            """)
    List<PrediccionReserva> findByModelo(@Param("modeloId") Long modeloId);

    @Query("""
            SELECT p FROM PrediccionReserva p
             WHERE p.modeloId = :modeloId
               AND p.fechaObjetivo BETWEEN :desde AND :hasta
             ORDER BY p.fechaObjetivo
            """)
    List<PrediccionReserva> findByModeloAndRango(
            @Param("modeloId") Long modeloId,
            @Param("desde") LocalDate desde,
            @Param("hasta") LocalDate hasta);
}
