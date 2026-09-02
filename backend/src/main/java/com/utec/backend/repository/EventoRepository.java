package com.utec.backend.repository;

import com.utec.backend.model.Evento;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;

@Repository
public interface EventoRepository extends JpaRepository<Evento, Long> {

    @EntityGraph(attributePaths = {"espacio", "organizador"})
    List<Evento> findByDeletedAtIsNull();

    @EntityGraph(attributePaths = {"espacio", "organizador"})
    List<Evento> findByEsPublicoTrueAndDeletedAtIsNull();

    List<Evento> findByEstadoAndDeletedAtIsNull(String estado);

    List<Evento> findByEstadoAndRecordatorioEnviadoFalseAndDeletedAtIsNull(String estado);

    /**
     * Eventos vigentes que solapan con un rango en un espacio dado.
     *
     * <p>Un evento CANCELADO o FINALIZADO ya no retiene el espacio. Un BORRADOR sí lo
     * retiene: es una intención del organizador, y así publicarlo nunca falla por un
     * conflicto aparecido mientras tanto.
     *
     * <p>El solapamiento es estricto ({@code <}): dos actividades pegadas (una termina
     * 14:00, otra empieza 14:00) no se consideran en conflicto.
     *
     * @param excluirId id a ignorar (el propio evento al editarlo); puede ser null
     */
    @Query("SELECT e FROM Evento e WHERE e.espacio.id = :espacioId " +
           "AND e.deletedAt IS NULL " +
           "AND e.estado NOT IN ('CANCELADO', 'FINALIZADO') " +
           "AND (:excluirId IS NULL OR e.id <> :excluirId) " +
           "AND e.inicio < :fin AND :inicio < e.fin")
    List<Evento> findSolapadosEnEspacio(
        @Param("espacioId") Long espacioId,
        @Param("inicio") Instant inicio,
        @Param("fin") Instant fin,
        @Param("excluirId") Long excluirId
    );
}
