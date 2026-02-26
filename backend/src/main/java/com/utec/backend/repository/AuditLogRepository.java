package com.utec.backend.repository;

import com.utec.backend.model.AuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long>, JpaSpecificationExecutor<AuditLog> {
    
    /**
     * Buscar logs por entidad
     */
    @Query("SELECT a FROM AuditLog a WHERE a.entidad = :entidad ORDER BY a.timestamp DESC")
    List<AuditLog> findByEntidad(@Param("entidad") String entidad);
    
    /**
     * Buscar logs por entidad e ID
     */
    @Query("SELECT a FROM AuditLog a WHERE a.entidad = :entidad AND a.entidadId = :entidadId ORDER BY a.timestamp DESC")
    List<AuditLog> findByEntidadAndEntidadId(@Param("entidad") String entidad, @Param("entidadId") Long entidadId);
    
    /**
     * Buscar logs por acción
     */
    @Query("SELECT a FROM AuditLog a WHERE a.accion = :accion ORDER BY a.timestamp DESC")
    Page<AuditLog> findByAccion(@Param("accion") AuditLog.AccionAudit accion, Pageable pageable);
    
    /**
     * Buscar logs por usuario
     */
    @Query("SELECT a FROM AuditLog a WHERE a.usuario.id = :usuarioId ORDER BY a.timestamp DESC")
    Page<AuditLog> findByUsuarioId(@Param("usuarioId") Long usuarioId, Pageable pageable);
    
    /**
     * Buscar logs por rango de fechas
     */
    @Query("SELECT a FROM AuditLog a WHERE a.timestamp BETWEEN :fechaDesde AND :fechaHasta ORDER BY a.timestamp DESC")
    Page<AuditLog> findByTimestampBetween(@Param("fechaDesde") Instant fechaDesde, @Param("fechaHasta") Instant fechaHasta, Pageable pageable);
}

