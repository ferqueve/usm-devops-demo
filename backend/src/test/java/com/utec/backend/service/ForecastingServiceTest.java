package com.utec.backend.service;

import com.utec.backend.dto.stats.PrediccionTiposEspacioDto;
import com.utec.backend.model.HechosReservaDiario;
import com.utec.backend.model.ModeloForecast;
import com.utec.backend.model.PrediccionReserva;
import com.utec.backend.repository.HechosReservaRepository;
import com.utec.backend.repository.ModeloForecastRepository;
import com.utec.backend.repository.PrediccionReservaRepository;
import com.utec.backend.repository.PrediccionesConsultas;
import com.utec.backend.repository.PrediccionesConsultas.FilaDia;
import com.utec.backend.repository.PrediccionesConsultas.FilaHistorialTipo;
import com.utec.backend.repository.PrediccionesConsultas.FilaTipoDia;
import com.utec.backend.repository.PrediccionesConsultas.FilaTipoEspacio;
import com.utec.backend.repository.ReservaRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.sql.Date;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ForecastingServiceTest {

    @Mock private ModeloForecastRepository modeloRepository;
    @Mock private PrediccionReservaRepository prediccionRepository;
    @Mock private HechosReservaRepository hechosReservaRepository;
    @Mock private ReservaRepository reservaRepository;
    @Mock private PrediccionesConsultas consultas;
    @Mock private MlServiceClient mlServiceClient;
    // 14/9/2026 a las 12:00 en Montevideo.
    @Spy private Clock clock = Clock.fixed(Instant.parse("2026-09-14T15:00:00Z"), ZoneOffset.UTC);

    @InjectMocks private ForecastingService service;

    private static ModeloForecast modelo(String paramsJson) {
        ModeloForecast m = new ModeloForecast();
        m.setId(7L);
        m.setAlgoritmo("prophet");
        m.setSampleSize(172);
        m.setHoldoutSize(28);
        m.setMape(new BigDecimal("21.64"));
        m.setMae(new BigDecimal("9.54"));
        m.setParamsJson(paramsJson);
        m.setActivo(true);
        return m;
    }

    private static PrediccionReserva prediccion(String fecha, String valor) {
        PrediccionReserva p = new PrediccionReserva();
        p.setModeloId(7L);
        p.setFechaObjetivo(LocalDate.parse(fecha));
        p.setPrediccion(new BigDecimal(valor));
        return p;
    }

    private static HechosReservaDiario hecho(String fecha, String estado, int cantidad) {
        HechosReservaDiario h = new HechosReservaDiario();
        h.setFecha(LocalDate.parse(fecha));
        h.setEstado(estado);
        h.setCantReservas(cantidad);
        return h;
    }

    @Test
    @DisplayName("El histórico trae con cero los días sin reservas aprobadas")
    void historicoSinHuecos() {
        when(modeloRepository.findActivoByScope("global")).thenReturn(Optional.of(modelo(null)));
        when(prediccionRepository.findByModelo(anyLong())).thenReturn(List.of(
                prediccion("2026-09-14", "40"), prediccion("2026-09-15", "42")));
        when(hechosReservaRepository.findByFechaBetween(any(), any())).thenReturn(List.of(
                hecho("2026-09-10", "APROBADO", 30),
                hecho("2026-09-10", "APROBADO", 5),
                hecho("2026-09-11", "CANCELADO", 9),
                hecho("2026-09-13", "APROBADO", 12)));
        when(reservaRepository.aprobadasPorDia(any(), any())).thenReturn(List.<Object[]>of(
                new Object[]{Date.valueOf("2026-09-15"), 18L}));

        Map<String, Object> r = service.forecast(null, null, 90, null);

        assertThat(r.get("historico")).asList().containsExactly(
                Map.of("fecha", "2026-09-10", "real", 35),
                Map.of("fecha", "2026-09-11", "real", 0),
                Map.of("fecha", "2026-09-12", "real", 0),
                Map.of("fecha", "2026-09-13", "real", 12));
        assertThat(r.get("reservadas")).asList().containsExactly(
                Map.of("fecha", "2026-09-14", "cantidad", 0),
                Map.of("fecha", "2026-09-15", "cantidad", 18));
    }

    @Test
    @DisplayName("La calidad expone la validación que guarda ml-svc en params_json")
    void calidadLeeLaValidacion() {
        when(modeloRepository.findActivoByScope("global")).thenReturn(Optional.of(modelo("""
                {"wape": 18.32, "wape_ingenuo": 23.05, "yearly_seasonality": false,
                 "desde": "2026-03-24", "hasta": "2026-09-11",
                 "validacion": [{"fecha": "2026-08-15", "real": 38, "prediccion": 44.38, "ingenuo": 50}]}
                """)));

        Map<String, Object> r = service.calidadModelo(null);

        assertThat(r).containsEntry("wape", 18.32)
                .containsEntry("wapeIngenuo", 23.05)
                .containsEntry("historicoHasta", "2026-09-11");
        assertThat(r.get("validacion")).asList().hasSize(1);
    }

    @Test
    @DisplayName("Un modelo viejo o con params ilegible no rompe la calidad")
    void calidadToleraParamsInvalido() {
        when(modeloRepository.findActivoByScope("global")).thenReturn(Optional.of(modelo("{no es json")));

        Map<String, Object> r = service.calidadModelo(null);

        assertThat(r).containsEntry("modeloId", 7L).containsEntry("wape", null);
        assertThat(r.get("validacion")).asList().isEmpty();
    }

    // ------------------------------------------------------- por tipo de espacio

    private static ModeloForecast modeloTipo(long id, long tipoEspacioId, String paramsJson) {
        ModeloForecast m = modelo(paramsJson);
        m.setId(id);
        m.setScope("tipo_espacio");
        m.setTipoEspacioId(tipoEspacioId);
        return m;
    }

    private static PrediccionReserva prediccion(long modeloId, LocalDate fecha, double valor) {
        PrediccionReserva p = new PrediccionReserva();
        p.setModeloId(modeloId);
        p.setFechaObjetivo(fecha);
        p.setPrediccion(BigDecimal.valueOf(valor));
        p.setBandaInferior(BigDecimal.valueOf(valor - 10));
        p.setBandaSuperior(BigDecimal.valueOf(valor + 10));
        return p;
    }

    @Test
    @DisplayName("Por tipo: próximos 7/30 días, pico y cambio % contra los últimos 30 días, desde hoy")
    void tiposEspacioCambioPct() {
        LocalDate hoy = LocalDate.of(2026, 9, 14);
        when(consultas.tiposEspacio()).thenReturn(List.of(
                new FilaTipoEspacio(2L, "Anfiteatro", 1),
                new FilaTipoEspacio(1L, "Aula", 10)));
        when(modeloRepository.findByScopeAndActivoTrueOrderByTrainedAtDesc("tipo_espacio")).thenReturn(List.of(
                modeloTipo(11L, 1L, "{\"wape\": 18.2, \"wape_ingenuo\": 25.0}")));
        // 1200 aprobadas en los 30 días antes de hoy: 40 por día.
        when(consultas.historialPorTipo(hoy.minusDays(30), hoy)).thenReturn(List.of(
                new FilaHistorialTipo(1L, LocalDate.of(2026, 3, 24), 1200),
                new FilaHistorialTipo(2L, LocalDate.of(2026, 3, 24), 90)));
        List<PrediccionReserva> preds = new ArrayList<>();
        preds.add(prediccion(11L, hoy.minusDays(1), 99)); // ya pasó: no cuenta
        for (int i = 0; i < 30; i++) {
            preds.add(prediccion(11L, hoy.plusDays(i), i == 6 ? 60 : 42));
        }
        when(prediccionRepository.findByModelo(11L)).thenReturn(preds);
        when(consultas.reservadasPorTipoYDia(null, hoy, hoy.plusDays(29))).thenReturn(List.of(
                new FilaTipoDia(1L, hoy.plusDays(1), 35),
                new FilaTipoDia(1L, hoy.plusDays(10), 10),
                new FilaTipoDia(2L, hoy.plusDays(1), 3)));

        PrediccionTiposEspacioDto r = service.tiposEspacio();

        assertThat(r.tipos()).extracting(PrediccionTiposEspacioDto.Tipo::nombre).containsExactly("Aula", "Anfiteatro");
        PrediccionTiposEspacioDto.Tipo aula = r.tipos().get(0);
        assertThat(aula.entrenado()).isTrue();
        assertThat(aula.wape()).isEqualTo(18.2);
        assertThat(aula.serie()).hasSize(30);
        assertThat(aula.serie().get(0).fecha()).isEqualTo(hoy);
        assertThat(aula.serie().get(1).reservadas()).isEqualTo(35);
        assertThat(aula.promedioDiarioHistorico()).isEqualTo(40.0);
        assertThat(aula.esperadoProximos7()).isEqualTo(6 * 42 + 60.0);
        assertThat(aula.esperadoProximos30()).isEqualTo(29 * 42 + 60.0);
        // 1278 / 30 = 42,6 por día contra 40: +6,5%.
        assertThat(aula.cambioPct()).isEqualTo(6.5);
        assertThat(aula.reservadasProximos7()).isEqualTo(35);
        assertThat(aula.picoFecha()).isEqualTo(hoy.plusDays(6));
        assertThat(aula.picoValor()).isEqualTo(60.0);

        PrediccionTiposEspacioDto.Tipo anfiteatro = r.tipos().get(1);
        assertThat(anfiteatro.entrenado()).isFalse();
        assertThat(anfiteatro.espacios()).isEqualTo(1);
        assertThat(anfiteatro.promedioDiarioHistorico()).isNull();
        assertThat(anfiteatro.cambioPct()).isNull();
        assertThat(anfiteatro.serie()).isEmpty();
    }

    @Test
    @DisplayName("Un tipo que empezó hace 10 días promedia sobre 10 días, no sobre 30")
    void promedioDeTipoNuevo() {
        LocalDate hoy = LocalDate.of(2026, 9, 14);
        FilaHistorialTipo nuevo = new FilaHistorialTipo(3L, LocalDate.of(2026, 9, 4), 50);

        assertThat(ForecastingService.promedioDiario(nuevo, hoy.minusDays(30), hoy)).isEqualTo(5.0);
        assertThat(ForecastingService.promedioDiario(null, hoy.minusDays(30), hoy)).isNull();
        assertThat(ForecastingService.cambioPct(4.0, 5.0)).isEqualTo(-20.0);
        assertThat(ForecastingService.cambioPct(4.0, 0.0)).isNull();
        assertThat(ForecastingService.cambioPct(4.0, null)).isNull();
    }

    @Test
    @DisplayName("El forecast con tipoEspacioId usa el modelo, el histórico y las reservadas de ese tipo")
    void forecastPorTipo() {
        when(modeloRepository.findFirstByScopeAndTipoEspacioIdAndActivoTrueOrderByTrainedAtDesc("tipo_espacio", 1L))
                .thenReturn(Optional.of(modeloTipo(11L, 1L, null)));
        when(prediccionRepository.findByModelo(11L)).thenReturn(List.of(
                prediccion("2026-09-14", "30"), prediccion("2026-09-15", "31")));
        when(consultas.aprobadasHechosPorTipo(eq(1L), any(), any())).thenReturn(List.of(
                new FilaDia(LocalDate.of(2026, 9, 11), 20), new FilaDia(LocalDate.of(2026, 9, 13), 8)));
        when(consultas.reservadasPorTipoYDia(1L, LocalDate.of(2026, 9, 14), LocalDate.of(2026, 9, 15)))
                .thenReturn(List.of(new FilaTipoDia(1L, LocalDate.of(2026, 9, 15), 12)));

        Map<String, Object> r = service.forecast(null, null, 90, 1L);

        assertThat(r).containsEntry("modeloId", 11L).containsEntry("hoy", "2026-09-14");
        assertThat(r.get("historico")).asList().containsExactly(
                Map.of("fecha", "2026-09-11", "real", 20),
                Map.of("fecha", "2026-09-12", "real", 0),
                Map.of("fecha", "2026-09-13", "real", 8));
        assertThat(r.get("reservadas")).asList().containsExactly(
                Map.of("fecha", "2026-09-14", "cantidad", 0),
                Map.of("fecha", "2026-09-15", "cantidad", 12));
        verifyNoInteractions(hechosReservaRepository, reservaRepository);
        verify(modeloRepository, never()).findActivoByScope(anyString());
    }

    @Test
    @DisplayName("Un tipo sin modelo activo devuelve la forma vacía del forecast y de la calidad")
    void tipoSinModelo() {
        when(modeloRepository.findFirstByScopeAndTipoEspacioIdAndActivoTrueOrderByTrainedAtDesc("tipo_espacio", 4L))
                .thenReturn(Optional.empty());

        assertThat(service.forecast(null, null, null, 4L)).containsEntry("modeloId", null);
        assertThat(service.calidadModelo(4L)).containsEntry("modeloId", null);
    }

    @Test
    @DisplayName("La calidad por tipo lee las claves nuevas de params_json")
    void calidadPorTipoConClavesNuevas() {
        when(modeloRepository.findFirstByScopeAndTipoEspacioIdAndActivoTrueOrderByTrainedAtDesc("tipo_espacio", 1L))
                .thenReturn(Optional.of(modeloTipo(11L, 1L, """
                        {"wape": 21.5, "wape_ingenuo": 30.1, "estacionalidad_anual": false,
                         "historico_desde": "2026-03-24", "historico_hasta": "2026-09-13", "validacion": []}
                        """)));

        Map<String, Object> r = service.calidadModelo(1L);

        assertThat(r).containsEntry("modeloId", 11L)
                .containsEntry("wape", 21.5)
                .containsEntry("estacionalidadAnual", false)
                .containsEntry("historicoDesde", "2026-03-24")
                .containsEntry("historicoHasta", "2026-09-13");
    }

    // -------------------------------------------------------- reentrenamiento

    @Test
    @DisplayName("Reentrenar manda cada modelo a su endpoint de ml-svc; sin modelo, reservas")
    void reentrenarRuteaPorModelo() {
        when(mlServiceClient.post(anyString())).thenReturn(Map.of("status", "ok"));

        service.reentrenar(null);
        service.reentrenar("reservas");
        service.reentrenar("inventario");
        service.reentrenar("academico");
        service.reentrenar(" TODO ");

        verify(mlServiceClient, org.mockito.Mockito.times(2)).post("/train");
        verify(mlServiceClient).post("/train/inventario");
        verify(mlServiceClient).post("/train/academico");
        verify(mlServiceClient).post("/train/todo");
    }

    @Test
    @DisplayName("Un modelo desconocido es un 400 y no llega a ml-svc")
    void reentrenarModeloDesconocido() {
        assertThatThrownBy(() -> service.reentrenar("prophet"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("prophet");
        verifyNoInteractions(mlServiceClient);
    }

    @Test
    @DisplayName("El reentrenamiento semanal entrena todo y tolera que falle una parte")
    void semanalEntrenaTodo() {
        when(mlServiceClient.post("/train/todo")).thenReturn(Map.of(
                "reservas", Map.of("status", "ok"),
                "inventario", Map.of("status", "error", "detalle", "sin datos"),
                "academico", Map.of("status", "ok")));

        service.reentrenarSemanal();

        verify(mlServiceClient).post("/train/todo");
    }
}
