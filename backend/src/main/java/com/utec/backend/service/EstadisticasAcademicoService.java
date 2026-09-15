package com.utec.backend.service;

import com.utec.backend.dto.stats.AcademicoDto;
import com.utec.backend.dto.stats.FiltroReservas;
import com.utec.backend.dto.stats.Periodo;
import com.utec.backend.repository.EstadisticasAcademicoConsultas;
import com.utec.backend.repository.EstadisticasAcademicoConsultas.FilaEventos;
import com.utec.backend.repository.EstadisticasAcademicoConsultas.FilaTutorias;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.temporal.TemporalAdjusters;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

import static com.utec.backend.service.CalculosEstadisticos.*;

/** Tutorías y eventos de un período, para la pestaña académica. */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class EstadisticasAcademicoService {

    static final int TOP_MATERIAS = 15;
    static final int MAXIMO_EVENTOS = 100;

    private final EstadisticasAcademicoConsultas consultas;
    private final Clock clock;

    public AcademicoDto academico(LocalDate desde, LocalDate hasta, FiltroReservas filtro) {
        Periodo periodo = new Periodo(desde, hasta);

        FilaTutorias t = consultas.resumenTutorias(periodo, clock.instant(), filtro);
        AcademicoDto.Tutorias tutorias = new AcademicoDto.Tutorias(t.total(), t.presenciales(), t.virtuales(),
                t.grupales(), t.individuales(), t.cupoTotal(), t.agendadas(), t.asistieron(),
                porcentaje(t.agendadas(), t.cupoTotal()),
                // Sólo las que ya terminaron: una tutoría de mañana todavía no tuvo asistencia.
                porcentaje(t.asistieronPasadas(), t.inscripcionesPasadas()),
                redondear(t.ratingPromedio()), t.feedbacks());

        List<AcademicoDto.PorMateria> porMateria = consultas.porMateria(periodo, filtro, TOP_MATERIAS).stream()
                .map(m -> new AcademicoDto.PorMateria(m.materiaId(), m.nombre(), m.carreraNombre(), m.tutorias(),
                        m.agendadas(), m.asistieron(), redondear(m.ratingPromedio())))
                .toList();

        FilaEventos e = consultas.resumenEventos(periodo, filtro);
        AcademicoDto.Eventos eventos = new AcademicoDto.Eventos(e.total(), e.inscripciones(), e.cupoTotal(),
                redondear(e.ratingPromedio()));

        List<AcademicoDto.EventoFila> lista = consultas.listaEventos(periodo, filtro, MAXIMO_EVENTOS).stream()
                .map(ev -> new AcademicoDto.EventoFila(ev.id(), ev.titulo(), ev.tipo(), ev.fecha(),
                        ev.espacioNombre(), ev.cupo(), ev.inscriptos(), redondear(ev.ratingPromedio())))
                .toList();

        return new AcademicoDto(tutorias, porMateria, semanas(periodo, consultas.porSemana(periodo, filtro)),
                eventos, lista);
    }

    /** Todas las semanas (lunes) que toca el período, con cero las que no tuvieron tutorías. */
    static List<AcademicoDto.PorSemana> semanas(Periodo periodo, List<AcademicoDto.PorSemana> filas) {
        Map<LocalDate, AcademicoDto.PorSemana> porLunes = filas.stream()
                .collect(Collectors.toMap(AcademicoDto.PorSemana::semana, Function.identity()));
        List<AcademicoDto.PorSemana> semanas = new ArrayList<>();
        for (LocalDate lunes = periodo.desde().with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
             !lunes.isAfter(periodo.hasta()); lunes = lunes.plusWeeks(1)) {
            semanas.add(porLunes.getOrDefault(lunes, new AcademicoDto.PorSemana(lunes, 0, 0, 0)));
        }
        return semanas;
    }
}
