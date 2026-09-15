package com.utec.backend.service;

import com.utec.backend.dto.stats.AprobacionReservasDto;
import com.utec.backend.dto.stats.FiltroReservas;
import com.utec.backend.dto.stats.NovedadDto;
import com.utec.backend.dto.stats.Periodo;
import com.utec.backend.dto.stats.ResumenReservasDto;
import com.utec.backend.repository.EstadisticasReservaConsultas;
import com.utec.backend.repository.EstadisticasReservaConsultas.FilaHeatmap;
import com.utec.backend.repository.EstadisticasReservaConsultas.FilaOcupacion;
import com.utec.backend.repository.EstadisticasReservaConsultas.FilaRespuesta;
import com.utec.backend.repository.EstadisticasReservaConsultas.FilaSerie;
import com.utec.backend.repository.EstadisticasReservaConsultas.FilaTopUsuario;
import com.utec.backend.repository.EstadisticasReservaConsultas.FilaTramo;
import com.utec.backend.service.EstadisticasReservaService.DatosNovedades;
import com.utec.backend.service.EstadisticasReservaService.Valor;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class EstadisticasReservaServiceTest {

    @Mock private EstadisticasReservaConsultas consultas;

    // 14/9/2026 a las 12:00 en Montevideo.
    @Spy private Clock clock = Clock.fixed(Instant.parse("2026-09-14T15:00:00Z"), ZoneOffset.UTC);

    @InjectMocks private EstadisticasReservaService service;

    private static final FiltroReservas SIN_FILTRO = FiltroReservas.NINGUNO;

    private static ResumenReservasDto.Totales totales(long total) {
        return new ResumenReservasDto.Totales(total, 0, 0, 0, 0, 0, 0, 0, 0, 0);
    }

    // ---------------------------------------------------------------- resumen

    @Test
    @DisplayName("Compara contra los mismos días inmediatamente anteriores")
    void periodoAnterior() {
        Periodo actual = new Periodo(LocalDate.of(2026, 9, 1), LocalDate.of(2026, 9, 10));
        Periodo anterior = new Periodo(LocalDate.of(2026, 8, 22), LocalDate.of(2026, 8, 31));
        when(consultas.totales(eq(actual), any(), eq(SIN_FILTRO))).thenReturn(totales(100));
        when(consultas.totales(eq(anterior), any(), eq(SIN_FILTRO))).thenReturn(totales(50));
        when(consultas.seriePorEstado(eq("day"), any(), any())).thenReturn(List.of());
        when(consultas.porRol(actual, SIN_FILTRO)).thenReturn(List.of(new ResumenReservasDto.Conteo("DOCENTE", 60, 50)));

        ResumenReservasDto r = service.resumen(actual.desde(), actual.hasta(), SIN_FILTRO, null);

        assertThat(r.actual().total()).isEqualTo(100);
        assertThat(r.anterior().total()).isEqualTo(50);
        assertThat(r.comparacion()).isEqualTo("anterior");
        assertThat(r.desdeAnterior()).isEqualTo(LocalDate.of(2026, 8, 22));
        assertThat(r.hastaAnterior()).isEqualTo(LocalDate.of(2026, 8, 31));
        assertThat(r.porRol()).containsExactly(new ResumenReservasDto.Conteo("DOCENTE", 60, 50));
    }

    @Test
    @DisplayName("comparar=anio usa las mismas fechas del año pasado, con los mismos filtros")
    void comparaContraElAnioAnterior() {
        FiltroReservas filtro = new FiltroReservas(1L, null, 2L, "docente", null);
        Periodo anterior = new Periodo(LocalDate.of(2025, 9, 1), LocalDate.of(2025, 9, 30));
        when(consultas.totales(any(), any(), any())).thenReturn(totales(0));
        when(consultas.totales(eq(anterior), any(), eq(filtro))).thenReturn(totales(7));
        when(consultas.seriePorEstado(any(), any(), any())).thenReturn(List.of());

        ResumenReservasDto r = service.resumen(LocalDate.of(2026, 9, 1), LocalDate.of(2026, 9, 30), filtro, "anio");

        assertThat(r.comparacion()).isEqualTo("anio");
        assertThat(r.desdeAnterior()).isEqualTo(LocalDate.of(2025, 9, 1));
        assertThat(r.hastaAnterior()).isEqualTo(LocalDate.of(2025, 9, 30));
        assertThat(r.anterior().total()).isEqualTo(7);
        assertThat(filtro.rol()).isEqualTo("DOCENTE");
    }

    @Test
    @DisplayName("Contra el año anterior, un 29 de febrero cae en el 28")
    void anioBisiesto() {
        Periodo anterior = new Periodo(LocalDate.of(2028, 2, 20), LocalDate.of(2028, 2, 29))
                .anterior(com.utec.backend.dto.stats.Comparacion.ANIO);
        assertThat(anterior.desde()).isEqualTo(LocalDate.of(2027, 2, 20));
        assertThat(anterior.hasta()).isEqualTo(LocalDate.of(2027, 2, 28));
    }

    @Test
    @DisplayName("Un valor de comparación desconocido es un error del cliente")
    void compararInvalido() {
        assertThatThrownBy(() -> service.resumen(LocalDate.of(2026, 9, 1), LocalDate.of(2026, 9, 2), SIN_FILTRO, "mes"))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    @DisplayName("La serie trae todos los días del período, con cero los que no tienen reservas")
    void serieDiariaSinHuecos() {
        when(consultas.totales(any(), any(), any())).thenReturn(totales(0));
        when(consultas.seriePorEstado(eq("day"), any(), any())).thenReturn(List.of(
                new FilaSerie(LocalDate.of(2026, 9, 2), "APROBADO", 7),
                new FilaSerie(LocalDate.of(2026, 9, 2), "CANCELADO", 1)));

        ResumenReservasDto r = service.resumen(LocalDate.of(2026, 9, 1), LocalDate.of(2026, 9, 3), SIN_FILTRO, null);

        assertThat(r.granularidad()).isEqualTo("dia");
        assertThat(r.serie()).containsExactly(
                new ResumenReservasDto.PuntoSerie(LocalDate.of(2026, 9, 1), 0, 0, 0),
                new ResumenReservasDto.PuntoSerie(LocalDate.of(2026, 9, 2), 7, 0, 1),
                new ResumenReservasDto.PuntoSerie(LocalDate.of(2026, 9, 3), 0, 0, 0));
        // Por día la serie diaria es la misma y no se consulta dos veces.
        assertThat(r.diario()).isSameAs(r.serie());
        verify(consultas, times(1)).seriePorEstado(eq("day"), any(), any());
    }

    @Test
    @DisplayName("Con tres meses agrupa por semana, empezando el lunes")
    void serieSemanal() {
        when(consultas.totales(any(), any(), any())).thenReturn(totales(0));
        when(consultas.seriePorEstado(any(), any(), any())).thenReturn(List.of());

        // El 3 de junio de 2026 es miércoles.
        ResumenReservasDto r = service.resumen(LocalDate.of(2026, 6, 3), LocalDate.of(2026, 8, 31), SIN_FILTRO, null);

        assertThat(r.granularidad()).isEqualTo("semana");
        assertThat(r.diario()).hasSize(90);
        assertThat(r.serie().get(0).periodo()).isEqualTo(LocalDate.of(2026, 6, 1));
        assertThat(r.serie()).allSatisfy(p -> assertThat(p.periodo().getDayOfWeek().getValue()).isEqualTo(1));
        verify(consultas).seriePorEstado(eq("week"), any(), any());
    }

    @Test
    @DisplayName("Rechaza un período invertido o demasiado largo en todos los endpoints")
    void validaElPeriodo() {
        LocalDate d = LocalDate.of(2026, 9, 2);
        LocalDate h = LocalDate.of(2026, 9, 1);
        assertThatThrownBy(() -> service.resumen(d, h, SIN_FILTRO, null)).isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> service.aprobacion(d, h, SIN_FILTRO)).isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> service.novedades(d, h, SIN_FILTRO, null)).isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> service.resumen(LocalDate.of(2020, 1, 1), LocalDate.of(2026, 1, 1), SIN_FILTRO, null))
                .isInstanceOf(IllegalArgumentException.class);
    }

    // ------------------------------------------------------ vistas existentes

    @Test
    @DisplayName("La ocupación divide por los días transcurridos hasta hoy inclusive")
    void ocupacionHastaHoy() {
        // Hoy es 14/9: del 10 al 14 son cinco días, 70 h.
        Periodo transcurrido = new Periodo(LocalDate.of(2026, 9, 10), LocalDate.of(2026, 9, 14));
        when(consultas.ocupacion(transcurrido, SIN_FILTRO)).thenReturn(List.of(
                new FilaOcupacion(1L, "Aula A", "Edificio 1", 35, 10),
                new FilaOcupacion(2L, "Aula B", null, 0, 0)));

        List<Map<String, Object>> r = service.ocupacionPorEspacio(
                LocalDate.of(2026, 9, 10), LocalDate.of(2026, 9, 20), SIN_FILTRO);

        assertThat(r.get(0)).containsEntry("porcentaje", new BigDecimal("50.00"))
                .containsEntry("horasDisponibles", BigDecimal.valueOf(70))
                .containsEntry("reservas", 10L);
        assertThat(r.get(1)).containsEntry("porcentaje", new BigDecimal("0.00"));
    }

    @Test
    @DisplayName("Quiénes más reservan trae rol y cómo terminaron")
    void topUsuarios() {
        when(consultas.topUsuarios(any(), eq(SIN_FILTRO), eq(10))).thenReturn(List.of(
                new FilaTopUsuario(7L, "Ana", "ana@utec.edu.uy", "DOCENTE", 12, 9, 2)));

        List<Map<String, Object>> r = service.topUsuarios(
                LocalDate.of(2026, 9, 1), LocalDate.of(2026, 9, 14), SIN_FILTRO, null);

        assertThat(r.get(0)).containsEntry("rol", "DOCENTE").containsEntry("cantReservas", 12L)
                .containsEntry("aprobadas", 9L).containsEntry("canceladas", 2L);
    }

    @Test
    @DisplayName("Externos: total del período y top de organizadores con horas redondeadas")
    void externos() {
        FiltroReservas filtro = new FiltroReservas(1L, null, null, null, null);
        when(consultas.contarExternos(any(), eq(filtro))).thenReturn(214L);
        when(consultas.organizadoresExternos(any(), eq(filtro), eq(10))).thenReturn(List.of(
                new com.utec.backend.dto.stats.ExternosDto.Organizador("ANTEL", 41, 20, 3, 80.54, 4)));

        com.utec.backend.dto.stats.ExternosDto r =
                service.externos(LocalDate.of(2026, 6, 17), LocalDate.of(2026, 9, 14), filtro);

        assertThat(r.total()).isEqualTo(214);
        assertThat(r.organizadores()).containsExactly(
                new com.utec.backend.dto.stats.ExternosDto.Organizador("ANTEL", 41, 20, 3, 80.5, 4));
    }

    // ------------------------------------------------------------- aprobación

    private void sinTramos() {
        when(consultas.distribucionRespuesta(any(), any(), any())).thenReturn(List.of());
        when(consultas.analistas(any(), any(), any())).thenReturn(List.of());
        when(consultas.antelacion(any(), any(), any())).thenReturn(List.of());
        when(consultas.pendientesPorAntiguedad(any(), any(), any(), any())).thenReturn(List.of());
    }

    @Test
    @DisplayName("Sin tiempos de respuesta, medianas y % dentro de 24 h vienen en null y los tramos en cero")
    void aprobacionSinDatos() {
        when(consultas.respuesta(any(), any())).thenReturn(new FilaRespuesta(40, 0, null, null, 0));
        sinTramos();

        AprobacionReservasDto r = service.aprobacion(LocalDate.of(2026, 9, 1), LocalDate.of(2026, 9, 14), SIN_FILTRO);

        assertThat(r.respuesta()).isEqualTo(new AprobacionReservasDto.Respuesta(40, 0, null, null, null));
        assertThat(r.distribucionRespuesta()).extracting(AprobacionReservasDto.Tramo::tramo)
                .containsExactly("< 1 h", "1–4 h", "4–24 h", "1–3 días", "> 3 días");
        assertThat(r.distribucionRespuesta()).allSatisfy(t -> assertThat(t.cantidad()).isZero());
        assertThat(r.antelacion()).extracting(AprobacionReservasDto.Antelacion::tramo)
                .containsExactly("Mismo día", "1–2 días", "3–7 días", "8–30 días", "Más de 30 días");
        assertThat(r.pendientesPorAntiguedad()).hasSize(4);
    }

    @Test
    @DisplayName("Los tramos que devuelve la base se ubican por índice y el resto queda en cero")
    void aprobacionTramos() {
        when(consultas.respuesta(any(), any())).thenReturn(new FilaRespuesta(100, 80, 5.26, 40.04, 62));
        when(consultas.distribucionRespuesta(any(), any(), eq(EstadisticasReservaService.TRAMOS_RESPUESTA.limites())))
                .thenReturn(List.of(new FilaTramo(2, new long[]{50}), new FilaTramo(4, new long[]{3})));
        when(consultas.analistas(any(), any(), any())).thenReturn(List.of(
                new AprobacionReservasDto.Analista(7L, "Ana", 30, 2, 1, 25, 3, 4.04)));
        when(consultas.antelacion(any(), any(), any()))
                .thenReturn(List.of(new FilaTramo(0, new long[]{10, 6, 2, 2})));
        when(consultas.pendientesPorAntiguedad(any(), any(), any(), any()))
                .thenReturn(List.of(new FilaTramo(3, new long[]{5, 4})));

        AprobacionReservasDto r = service.aprobacion(LocalDate.of(2026, 9, 1), LocalDate.of(2026, 9, 14), SIN_FILTRO);

        assertThat(r.respuesta()).isEqualTo(new AprobacionReservasDto.Respuesta(100, 80, 5.3, 40.0, 77.5));
        assertThat(r.distribucionRespuesta()).extracting(AprobacionReservasDto.Tramo::cantidad)
                .containsExactly(0L, 0L, 50L, 0L, 3L);
        assertThat(r.analistas().get(0).medianaHoras()).isEqualTo(4.0);
        assertThat(r.antelacion().get(0)).isEqualTo(new AprobacionReservasDto.Antelacion("Mismo día", 10, 6, 2, 2));
        assertThat(r.antelacion().get(1).total()).isZero();
        assertThat(r.pendientesPorAntiguedad().get(3))
                .isEqualTo(new AprobacionReservasDto.Antiguedad("> 7 días", 5, 4));
    }

    @Test
    @DisplayName("Los tramos piden un nombre más que límites")
    void tramosMalArmados() {
        assertThatThrownBy(() -> new CalculosEstadisticos.Tramos(List.of("a", "b"), new double[]{1, 2}))
                .isInstanceOf(IllegalArgumentException.class);
    }

    // -------------------------------------------------------------- novedades

    private static DatosNovedades datos(Map<String, Valor> ocupacion, Map<String, Valor> carreras,
                                        Map<String, Valor> roles, Map<String, Valor> edificios,
                                        List<FilaHeatmap> heatmap, Valor respuesta) {
        return new DatosNovedades(ocupacion, carreras, roles, edificios, heatmap, respuesta);
    }

    private static DatosNovedades vacio() {
        return datos(Map.of(), Map.of(), Map.of(), Map.of(), List.of(), null);
    }

    @Test
    @DisplayName("La ocupación de un espacio sólo es novedad si en algún período llega al 10%")
    void novedadOcupacionUmbral() {
        DatosNovedades antes = datos(Map.of("1", new Valor("Aula 1", 2, 5), "2", new Valor("Aula 2", 20, 40)),
                Map.of(), Map.of(), Map.of(), List.of(), null);
        DatosNovedades ahora = datos(Map.of("1", new Valor("Aula 1", 9, 20), "2", new Valor("Aula 2", 60, 90)),
                Map.of(), Map.of(), Map.of(), List.of(), null);

        List<NovedadDto> r = EstadisticasReservaService.calcularNovedades(antes, ahora);

        assertThat(r).containsExactly(
                new NovedadDto("espacio", "2", "Aula 2", "ocupacion", 20.0, 60.0, 40.0, "pp", "sube", null));
    }

    @Test
    @DisplayName("La cancelación por carrera pide 20 resueltas en ambos períodos y bajar es bueno")
    void novedadCancelacionCarrera() {
        DatosNovedades antes = datos(Map.of(), Map.of(
                "1", new Valor("Mecatrónica", 30, 50),
                "2", new Valor("Logística", 10, 19)), Map.of(), Map.of(), List.of(), null);
        DatosNovedades ahora = datos(Map.of(), Map.of(
                "1", new Valor("Mecatrónica", 12, 60),
                "2", new Valor("Logística", 50, 80)), Map.of(), Map.of(), List.of(), null);

        List<NovedadDto> r = EstadisticasReservaService.calcularNovedades(antes, ahora);

        assertThat(r).hasSize(1);
        assertThat(r.get(0).clave()).isEqualTo("1");
        assertThat(r.get(0).cambio()).isEqualTo(-18.0);
        assertThat(r.get(0).sentido()).isEqualTo("baja");
        assertThat(r.get(0).bueno()).isTrue();
    }

    @Test
    @DisplayName("Rol y edificio comparan en % relativo con mínimo 30 y sin base cero")
    void novedadesRelativas() {
        DatosNovedades antes = datos(Map.of(), Map.of(),
                Map.of("DOCENTE", new Valor("DOCENTE", 100, 100), "EXTERNO", new Valor("EXTERNO", 10, 10)),
                Map.of("1", new Valor("Edificio A", 0, 0)), List.of(), null);
        DatosNovedades ahora = datos(Map.of(), Map.of(),
                Map.of("DOCENTE", new Valor("DOCENTE", 150, 150), "EXTERNO", new Valor("EXTERNO", 25, 25)),
                Map.of("1", new Valor("Edificio A", 80, 80)), List.of(), null);

        List<NovedadDto> r = EstadisticasReservaService.calcularNovedades(antes, ahora);

        assertThat(r).containsExactly(
                new NovedadDto("rol", "DOCENTE", "DOCENTE", "reservas", 100.0, 150.0, 50.0, "%", "sube", null));
    }

    @Test
    @DisplayName("Avisa el cambio de hora pico y del tiempo mediano de respuesta")
    void novedadHoraPicoYRespuesta() {
        DatosNovedades antes = datos(Map.of(), Map.of(), Map.of(), Map.of(),
                List.of(new FilaHeatmap(1, 10, 50), new FilaHeatmap(2, 9, 50)),
                new Valor("Tiempo mediano de respuesta", 10, 100));
        DatosNovedades ahora = datos(Map.of(), Map.of(), Map.of(), Map.of(),
                List.of(new FilaHeatmap(1, 10, 20), new FilaHeatmap(3, 18, 80)),
                new Valor("Tiempo mediano de respuesta", 4, 120));

        List<NovedadDto> r = EstadisticasReservaService.calcularNovedades(antes, ahora);

        assertThat(r).extracting(NovedadDto::tipo).containsExactlyInAnyOrder("hora", "aprobacion");
        NovedadDto hora = r.stream().filter(n -> n.tipo().equals("hora")).findFirst().orElseThrow();
        assertThat(hora.titulo()).isEqualTo("Mié 18:00");
        assertThat(hora.antes()).isEqualTo(0.0);
        assertThat(hora.ahora()).isEqualTo(80.0);
        NovedadDto respuesta = r.stream().filter(n -> n.tipo().equals("aprobacion")).findFirst().orElseThrow();
        assertThat(respuesta.cambio()).isEqualTo(-6.0);
        assertThat(respuesta.unidad()).isEqualTo("h");
        assertThat(respuesta.bueno()).isTrue();
    }

    @Test
    @DisplayName("Sin cambios no hay novedades; nunca más de seis ni más de dos del mismo tipo")
    void novedadesTope() {
        assertThat(EstadisticasReservaService.calcularNovedades(vacio(), vacio())).isEmpty();

        Map<String, Valor> ocupAntes = new java.util.HashMap<>();
        Map<String, Valor> ocupAhora = new java.util.HashMap<>();
        Map<String, Valor> rolAntes = new java.util.HashMap<>();
        Map<String, Valor> rolAhora = new java.util.HashMap<>();
        Map<String, Valor> edifAntes = new java.util.HashMap<>();
        Map<String, Valor> edifAhora = new java.util.HashMap<>();
        for (int i = 0; i < 5; i++) {
            ocupAntes.put("e" + i, new Valor("Espacio " + i, 10, 10));
            ocupAhora.put("e" + i, new Valor("Espacio " + i, 20 + i, 10));
            rolAntes.put("r" + i, new Valor("Rol " + i, 100, 100));
            rolAhora.put("r" + i, new Valor("Rol " + i, 200 + i, 200));
            edifAntes.put("b" + i, new Valor("Edificio " + i, 100, 100));
            edifAhora.put("b" + i, new Valor("Edificio " + i, 150 + i, 150));
        }
        List<NovedadDto> r = EstadisticasReservaService.calcularNovedades(
                datos(ocupAntes, Map.of(), rolAntes, edifAntes, List.of(), null),
                datos(ocupAhora, Map.of(), rolAhora, edifAhora, List.of(), null));

        assertThat(r).hasSize(6);
        assertThat(r).extracting(NovedadDto::tipo)
                .containsOnly("espacio", "rol", "edificio")
                .filteredOn("espacio"::equals).hasSize(2);
        // Dentro de un tipo, el mayor cambio primero.
        assertThat(r.stream().filter(n -> n.tipo().equals("espacio")).findFirst().orElseThrow().clave())
                .isEqualTo("e4");
    }
}
