package com.utec.backend.dto.stats;

import java.time.LocalDate;
import java.util.List;

/** Tutorías y eventos de un período. Los eventos externos están en /stats/reservas/externos. */
public record AcademicoDto(
        Tutorias tutorias,
        List<PorMateria> porMateria,
        List<PorSemana> porSemana,
        Eventos eventos,
        List<EventoFila> eventosLista
) {

    /**
     * @param agendadas       inscripciones vigentes (agendadas o con asistencia)
     * @param asistenciaPct   asistencias sobre inscripciones de tutorías que ya terminaron; null si no hay
     * @param ocupacionCupoPct inscripciones sobre cupo total; null si no hay cupo
     */
    public record Tutorias(long total, long presenciales, long virtuales, long grupales, long individuales,
                           long cupoTotal, long agendadas, long asistieron, Double ocupacionCupoPct,
                           Double asistenciaPct, Double ratingPromedio, long feedbacks) {
    }

    public record PorMateria(Long materiaId, String nombre, String carreraNombre, long tutorias,
                             long agendadas, long asistieron, Double ratingPromedio) {
    }

    /** {@code semana} es el lunes. */
    public record PorSemana(LocalDate semana, long tutorias, long agendadas, long asistieron) {
    }

    public record Eventos(long total, long inscripciones, long cupoTotal, Double ratingPromedio) {
    }

    public record EventoFila(Long id, String titulo, String tipo, LocalDate fecha, String espacioNombre,
                             Integer cupo, long inscriptos, Double ratingPromedio) {
    }
}
