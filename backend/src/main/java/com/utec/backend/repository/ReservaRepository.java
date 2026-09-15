package com.utec.backend.repository;

import com.utec.backend.model.Reserva;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import org.springframework.data.domain.Pageable;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

@Repository
public interface ReservaRepository extends JpaRepository<Reserva, Long>, JpaSpecificationExecutor<Reserva> {
    
    // Buscar reservas de un usuario (ordenadas por fecha descendente).
    //
    // Sin JOIN FETCH del espacio a proposito: agregarlo parecia evitar un N+1,
    // pero las estadisticas solo leen espacio.getId(), que Hibernate resuelve
    // del proxy sin consultar. Materializar los espacios de miles de reservas
    // llevo este endpoint de 348 ms a 7,4 s medidos en produccion.
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

    /**
     * Cuantas reservas empiezan dentro del rango. El dashboard muestra el
     * numero de reservas de hoy: contarlo aca evita traer las filas.
     */
    long countByInicioBetween(Instant desde, Instant hasta);

    /**
     * Espacios con mas reservas esperando aprobacion, de mayor a menor.
     * Le dice al analista donde se le esta acumulando la cola.
     *
     * @return filas [espacioId, nombre, pendientes]
     */
    @Query("SELECT e.id, e.nombre, COUNT(r) FROM Reserva r JOIN r.espacio e "
         + "WHERE r.estado = com.utec.backend.model.Reserva.EstadoReserva.PENDIENTE "
         + "GROUP BY e.id, e.nombre ORDER BY COUNT(r) DESC")
    List<Object[]> contarPendientesPorEspacio(Pageable pageable);

    /** Cuantas solicitudes dejo de estar pendientes en manos de este analista. */
    @Query("SELECT COUNT(r) FROM Reserva r WHERE r.analistaAsignado.id = :analistaId "
         + "AND r.estado <> com.utec.backend.model.Reserva.EstadoReserva.PENDIENTE")
    long contarResueltasPorAnalista(@Param("analistaId") Long analistaId);
    
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

    /**
     * Reservas APROBADAS por dia del campus en un rango de fechas. Es la
     * demanda ya comprometida del horizonte que pronostica el modelo: se lee
     * de la tabla transaccional porque la de hechos solo se recalcula de noche.
     */
    @Query(value = """
            SELECT DATE(r.inicio AT TIME ZONE 'America/Montevideo') AS fecha,
                   COUNT(*)                                          AS cant
            FROM reserva r
            WHERE r.estado = 'APROBADO'
              AND DATE(r.inicio AT TIME ZONE 'America/Montevideo') BETWEEN :desde AND :hasta
            GROUP BY fecha
            ORDER BY fecha
            """, nativeQuery = true)
    List<Object[]> aprobadasPorDia(@Param("desde") LocalDate desde, @Param("hasta") LocalDate hasta);

}

