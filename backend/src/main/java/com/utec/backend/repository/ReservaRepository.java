package com.utec.backend.repository;

import com.utec.backend.model.Reserva;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;

@Repository
public interface ReservaRepository extends JpaRepository<Reserva, Long>, JpaSpecificationExecutor<Reserva> {
    
    // Buscar reservas de un usuario (ordenadas por fecha descendente)
    @Query("SELECT r FROM Reserva r WHERE r.usuario.id = :usuarioId ORDER BY r.inicio DESC")
    List<Reserva> findByUsuarioId(@Param("usuarioId") Long usuarioId);
    
    // Buscar reservas de un espacio
    @Query("SELECT r FROM Reserva r WHERE r.espacio.id = :espacioId ORDER BY r.inicio DESC")
    List<Reserva> findByEspacioId(@Param("espacioId") Long espacioId);
    
    // **CRÍTICO**: Buscar reservas conflictivas con LOCK PESIMISTA
    // Esto previene race conditions en alta concurrencia
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT r FROM Reserva r WHERE r.espacio.id = :espacioId " +
           "AND r.estado = :estado " +
           "AND ((r.inicio <= :fin AND r.fin >= :inicio))")
    List<Reserva> findConflictingReservas(
        @Param("espacioId") Long espacioId,
        @Param("inicio") Instant inicio,
        @Param("fin") Instant fin,
        @Param("estado") Reserva.EstadoReserva estado
    );
    
    // Contar reservas por espacio y estado
    Long countByEspacioIdAndEstado(Long espacioId, Reserva.EstadoReserva estado);
    
    // Buscar reservas futuras de un espacio
    @Query("SELECT r FROM Reserva r WHERE r.espacio.id = :espacioId " +
           "AND r.inicio >= :now AND r.estado = :estado ORDER BY r.inicio ASC")
    List<Reserva> findFutureReservasByEspacio(
        @Param("espacioId") Long espacioId,
        @Param("now") Instant now,
        @Param("estado") Reserva.EstadoReserva estado
    );
    
    // Buscar reserva por ID con datos relacionados
    @Query("SELECT r FROM Reserva r JOIN FETCH r.espacio JOIN FETCH r.usuario LEFT JOIN FETCH r.carrera LEFT JOIN FETCH r.analistaAsignado WHERE r.id = :id")
    Reserva findByIdWithRelations(@Param("id") Long id);
    
    // Buscar reservas aprobadas que inician en un rango de tiempo (para recordatorios)
    @Query("SELECT r FROM Reserva r JOIN FETCH r.espacio JOIN FETCH r.usuario LEFT JOIN FETCH r.carrera LEFT JOIN FETCH r.analistaAsignado " +
           "WHERE r.estado = :estado " +
           "AND r.inicio >= :inicioDesde AND r.inicio <= :inicioHasta " +
           "ORDER BY r.inicio ASC")
    List<Reserva> findReservasAprobadasEnRango(
        @Param("estado") Reserva.EstadoReserva estado,
        @Param("inicioDesde") Instant inicioDesde,
        @Param("inicioHasta") Instant inicioHasta
    );

    // Reservas asignadas a un analista en un estado específico (con joins eager
    // para evitar el N+1 en RecomendacionAnalistaService.obtenerReservasPrioritarias).
    @Query("SELECT r FROM Reserva r JOIN FETCH r.espacio JOIN FETCH r.usuario " +
           "WHERE r.analistaAsignado.id = :analistaId AND r.estado = :estado")
    List<Reserva> findByAnalistaAsignadoAndEstado(
        @Param("analistaId") Long analistaId,
        @Param("estado") Reserva.EstadoReserva estado
    );
}

