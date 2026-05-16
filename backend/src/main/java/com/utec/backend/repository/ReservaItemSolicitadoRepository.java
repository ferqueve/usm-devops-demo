package com.utec.backend.repository;

import com.utec.backend.model.ReservaItemSolicitado;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReservaItemSolicitadoRepository extends JpaRepository<ReservaItemSolicitado, Long>, JpaSpecificationExecutor<ReservaItemSolicitado> {

    @Override
    @EntityGraph(attributePaths = {"reserva", "reserva.espacio", "reserva.usuario", "tipoElemento", "inventarioItem"})
    Page<ReservaItemSolicitado> findAll(org.springframework.data.jpa.domain.Specification<ReservaItemSolicitado> spec, Pageable pageable);
    
    // Buscar todos los items solicitados de una reserva (no eliminados)
    @Query("SELECT ris FROM ReservaItemSolicitado ris WHERE ris.reserva.id = :reservaId AND ris.deletedAt IS NULL")
    List<ReservaItemSolicitado> findByReservaId(@Param("reservaId") Long reservaId);
    
    // Buscar items solicitados por estado (no eliminados)
    @Query("SELECT ris FROM ReservaItemSolicitado ris WHERE ris.estado = :estado AND ris.deletedAt IS NULL")
    List<ReservaItemSolicitado> findByEstado(@Param("estado") ReservaItemSolicitado.EstadoSolicitud estado);
    
    // Buscar items solicitados de una reserva con relaciones cargadas (no eliminados)
    @Query("SELECT ris FROM ReservaItemSolicitado ris " +
           "LEFT JOIN FETCH ris.tipoElemento " +
           "LEFT JOIN FETCH ris.inventarioItem " +
           "WHERE ris.reserva.id = :reservaId AND ris.deletedAt IS NULL")
    List<ReservaItemSolicitado> findByReservaIdWithRelations(@Param("reservaId") Long reservaId);

    // Cuenta solicitudes activas (PENDIENTE o APROBADO, no eliminadas) que usan el item dado.
    @Query("SELECT COUNT(ris) FROM ReservaItemSolicitado ris " +
           "WHERE ris.inventarioItem.id = :inventarioItemId " +
           "AND ris.deletedAt IS NULL " +
           "AND ris.estado IN (com.utec.backend.model.ReservaItemSolicitado.EstadoSolicitud.PENDIENTE, " +
           "com.utec.backend.model.ReservaItemSolicitado.EstadoSolicitud.APROBADO)")
    long countActiveByInventarioItemId(@Param("inventarioItemId") Long inventarioItemId);
}

