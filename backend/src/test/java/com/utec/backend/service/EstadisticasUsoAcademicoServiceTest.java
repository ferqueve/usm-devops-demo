package com.utec.backend.service;

import com.utec.backend.dto.stats.AcademicoDto;
import com.utec.backend.dto.stats.EquiposReservasDto;
import com.utec.backend.dto.stats.FiltroInventario;
import com.utec.backend.dto.stats.FiltroReservas;
import com.utec.backend.dto.stats.Periodo;
import com.utec.backend.dto.stats.UsoEspaciosDto;
import com.utec.backend.repository.EstadisticasAcademicoConsultas;
import com.utec.backend.repository.EstadisticasUsoConsultas;
import com.utec.backend.repository.EstadisticasUsoConsultas.FilaCapacidad;
import com.utec.backend.repository.EstadisticasUsoConsultas.FilaUsoEspacio;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class EstadisticasUsoAcademicoServiceTest {

    private final Clock clock = Clock.fixed(Instant.parse("2026-09-14T15:00:00Z"), ZoneOffset.UTC);
    private final FiltroReservas sinFiltro = FiltroReservas.NINGUNO;

    @Test
    @DisplayName("Espacios: ocupación sobre lo transcurrido y aforo null si no hubo sesiones")
    void espacios() {
        EstadisticasUsoConsultas consultas = mock(EstadisticasUsoConsultas.class);
        EstadisticasUsoService service = new EstadisticasUsoService(consultas, clock);
        // Del 13 al 20: transcurren el 13 y el 14, 28 h.
        Periodo transcurrido = new Periodo(LocalDate.of(2026, 9, 13), LocalDate.of(2026, 9, 14));
        when(consultas.usoPorEspacio(any(), eq(transcurrido), eq(sinFiltro))).thenReturn(List.of(
                new FilaUsoEspacio(3L, "Aula 9", "A", "Aula", 40, 7, 3, 12.25, 10.0),
                new FilaUsoEspacio(4L, "Aula 10", "A", "Aula", 30, 0, 0, null, null)));
        when(consultas.saturacion(any(), any())).thenReturn(List.of(
                new UsoEspaciosDto.Saturacion("Aula", 10, 8, 45.26, 2)));
        when(consultas.capacidad(any(), any(), eq(100))).thenReturn(List.of(
                new FilaCapacidad("TUTORIA", 1L, "Tutoría Cálculo", LocalDate.of(2026, 9, 13), "Aula 9", 40, 6, 5)));

        UsoEspaciosDto r = service.espacios(LocalDate.of(2026, 9, 13), LocalDate.of(2026, 9, 20), sinFiltro);

        assertThat(r.espacios().get(0)).isEqualTo(new UsoEspaciosDto.Espacio(
                3L, "Aula 9", "A", "Aula", 40, 7.0, 3, 25.0, 12.3, 25.0));
        assertThat(r.espacios().get(1).cupoPromedio()).isNull();
        assertThat(r.espacios().get(1).usoCapacidadPct()).isNull();
        assertThat(r.saturacion().get(0).ocupacionPct()).isEqualTo(45.3);
        assertThat(r.capacidad().get(0).usoPct()).isEqualTo(12.5);
    }

    @Test
    @DisplayName("Espacios de un período futuro: ocupación cero, sin consultar horas")
    void espaciosFuturos() {
        EstadisticasUsoConsultas consultas = mock(EstadisticasUsoConsultas.class);
        EstadisticasUsoService service = new EstadisticasUsoService(consultas, clock);
        when(consultas.usoPorEspacio(any(), isNull(), any())).thenReturn(List.of(
                new FilaUsoEspacio(3L, "Aula 9", "A", "Aula", 40, 0, 0, null, null)));

        UsoEspaciosDto r = service.espacios(LocalDate.of(2026, 10, 1), LocalDate.of(2026, 10, 5), sinFiltro);

        assertThat(r.espacios().get(0).ocupacionPct()).isZero();
    }

    @Test
    @DisplayName("La demanda de inventario pasa los filtros de inventario y suma los totales por tipo")
    void demandaInventario() {
        EstadisticasUsoConsultas consultas = mock(EstadisticasUsoConsultas.class);
        EstadisticasUsoService service = new EstadisticasUsoService(consultas, clock);
        FiltroInventario filtro = new FiltroInventario(1L, null, 2L);
        when(consultas.demandaPorTipo(any(), eq(filtro))).thenReturn(List.of(
                new EquiposReservasDto.PorTipo(2L, "Proyector", 10, 20, 5, 2, 2, 1, 3, 4, 8)));
        when(consultas.espaciosConProblemas(any(), eq(filtro))).thenReturn(List.of(
                new EquiposReservasDto.EspacioConProblemas(3L, "Aula 9", 40, 2)));

        EquiposReservasDto r = service.demandaInventario(LocalDate.of(2026, 9, 1), LocalDate.of(2026, 9, 14), filtro);

        assertThat(r.totales()).isEqualTo(new EquiposReservasDto.Totales(10, 20, 5, 2, 2, 1));
        assertThat(r.espaciosConProblemas()).hasSize(1);
    }

    @Test
    @DisplayName("Los totales de equipos son la suma por tipo")
    void totalesEquipos() {
        EquiposReservasDto.Totales t = EstadisticasUsoService.totales(List.of(
                new EquiposReservasDto.PorTipo(1L, "Proyector", 10, 20, 5, 2, 2, 1, 3, 4, 8),
                new EquiposReservasDto.PorTipo(2L, "Parlante", 4, 6, 1, 1, 1, 1, 0, 1, 3)));

        assertThat(t).isEqualTo(new EquiposReservasDto.Totales(14, 26, 6, 3, 3, 2));
    }

    @Test
    @DisplayName("Académico: asistencia sólo sobre tutorías pasadas y todas las semanas del período")
    void academico() {
        EstadisticasAcademicoConsultas consultas = mock(EstadisticasAcademicoConsultas.class);
        EstadisticasAcademicoService service = new EstadisticasAcademicoService(consultas, clock);
        when(consultas.resumenTutorias(any(), any(), any())).thenReturn(new EstadisticasAcademicoConsultas.FilaTutorias(
                10, 6, 4, 5, 5, 60, 50, 30, 40, 30, 4.25, 12));
        when(consultas.porMateria(any(), any(), eq(15))).thenReturn(List.of());
        // Del miércoles 2 al martes 15 de setiembre: semanas del 31/8, 7/9 y 14/9.
        when(consultas.porSemana(any(), any())).thenReturn(List.of(
                new AcademicoDto.PorSemana(LocalDate.of(2026, 9, 7), 3, 12, 8)));
        when(consultas.resumenEventos(any(), any())).thenReturn(new EstadisticasAcademicoConsultas.FilaEventos(0, 0, 0, null));
        when(consultas.listaEventos(any(), any(), eq(100))).thenReturn(List.of());

        AcademicoDto r = service.academico(LocalDate.of(2026, 9, 2), LocalDate.of(2026, 9, 15), sinFiltro);

        assertThat(r.tutorias().ocupacionCupoPct()).isEqualTo(83.3);
        assertThat(r.tutorias().asistenciaPct()).isEqualTo(75.0);
        assertThat(r.tutorias().ratingPromedio()).isEqualTo(4.3);
        assertThat(r.porSemana()).extracting(AcademicoDto.PorSemana::semana).containsExactly(
                LocalDate.of(2026, 8, 31), LocalDate.of(2026, 9, 7), LocalDate.of(2026, 9, 14));
        assertThat(r.porSemana().get(1).tutorias()).isEqualTo(3);
        assertThat(r.porSemana().get(0).tutorias()).isZero();
        assertThat(r.eventos().ratingPromedio()).isNull();
    }
}
