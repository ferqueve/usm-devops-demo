package com.utec.backend.repository;

import com.utec.backend.model.EventoInscripcion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;

@Repository
public interface EventoInscripcionRepository extends JpaRepository<EventoInscripcion, Long> {

    List<EventoInscripcion> findByEventoIdAndDeletedAtIsNull(Long eventoId);

    List<EventoInscripcion> findByUsuarioIdAndDeletedAtIsNull(Long usuarioId);

    boolean existsByEventoIdAndUsuarioIdAndDeletedAtIsNull(Long eventoId, Long usuarioId);

    long countByEventoIdAndDeletedAtIsNull(Long eventoId);

    long countByEventoIdAndEstadoNotAndDeletedAtIsNull(Long eventoId, String estado);

    /** Confirmados (excluye ESPERA) por evento en una sola query, para listados. */
    @Query("select i.evento.id as eventoId, count(i) as total from EventoInscripcion i "
            + "where i.deletedAt is null and i.estado <> :estado and i.evento.id in :ids "
            + "group by i.evento.id")
    List<EventoConteo> contarConfirmadosPorEventos(@Param("ids") Collection<Long> ids, @Param("estado") String estado);

    interface EventoConteo {
        Long getEventoId();
        long getTotal();
    }
}
