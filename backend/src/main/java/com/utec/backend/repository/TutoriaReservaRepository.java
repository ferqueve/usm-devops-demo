package com.utec.backend.repository;

import com.utec.backend.model.TutoriaReserva;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;

@Repository
public interface TutoriaReservaRepository extends JpaRepository<TutoriaReserva, Long> {

    List<TutoriaReserva> findByTutoriaIdAndDeletedAtIsNull(Long tutoriaId);

    List<TutoriaReserva> findByEstudianteIdAndDeletedAtIsNull(Long estudianteId);

    boolean existsByTutoriaIdAndEstudianteIdAndDeletedAtIsNull(Long tutoriaId, Long estudianteId);

    long countByTutoriaIdAndEstadoAndDeletedAtIsNull(Long tutoriaId, String estado);

    /** Cuenta reservas que NO están en cierto estado (ej. excluir ESPERA del cupo confirmado). */
    long countByTutoriaIdAndEstadoNotAndDeletedAtIsNull(Long tutoriaId, String estado);

    List<TutoriaReserva> findByEstudianteIdAndEstadoAndDeletedAtIsNull(Long estudianteId, String estado);

    /** Conteos agregados por tutoría (una sola query) para listados: evita el N+1 de contar por fila. */
    @Query("select r.tutoria.id as id, "
            + "sum(case when r.estado = :espera then 0L else 1L end) as agendados, "
            + "sum(case when r.estado = :espera then 1L else 0L end) as enEspera "
            + "from TutoriaReserva r where r.deletedAt is null and r.tutoria.id in :ids "
            + "group by r.tutoria.id")
    List<TutoriaReservaCounts> contarPorTutorias(@Param("ids") Collection<Long> ids, @Param("espera") String espera);

    /** Total de estudiantes (excluye ESPERA) por docente, en una query (ranking de tutores). */
    @Query("select t.docente.id as docenteId, count(r) as total "
            + "from TutoriaReserva r join r.tutoria t "
            + "where r.deletedAt is null and t.deletedAt is null "
            + "and r.estado <> :espera and t.docente is not null "
            + "group by t.docente.id")
    List<DocenteConteo> contarEstudiantesPorDocente(@Param("espera") String espera);

    /** Proyección de conteos por tutoría. */
    interface TutoriaReservaCounts {
        Long getId();
        long getAgendados();
        long getEnEspera();
    }

    /** Proyección de conteo por docente. */
    interface DocenteConteo {
        Long getDocenteId();
        long getTotal();
    }
}
