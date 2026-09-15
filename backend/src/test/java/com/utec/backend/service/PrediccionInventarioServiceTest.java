package com.utec.backend.service;

import com.utec.backend.dto.stats.PrediccionInventarioDto;
import com.utec.backend.dto.stats.PrediccionInventarioDto.Tipo;
import com.utec.backend.model.ModeloForecast;
import com.utec.backend.repository.ModeloForecastRepository;
import com.utec.backend.repository.PrediccionesConsultas;
import com.utec.backend.repository.PrediccionesConsultas.FilaPrediccionEquipo;
import com.utec.backend.repository.PrediccionesConsultas.FilaStock;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.within;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PrediccionInventarioServiceTest {

    @Mock private ModeloForecastRepository modeloRepository;
    @Mock private PrediccionesConsultas consultas;
    // 14/9/2026 a las 12:00 en Montevideo (lunes).
    @Spy private Clock clock = Clock.fixed(Instant.parse("2026-09-14T15:00:00Z"), ZoneOffset.UTC);

    @InjectMocks private PrediccionInventarioService service;

    private static final LocalDate HOY = LocalDate.of(2026, 9, 14);

    private static final String PARAMS = """
            {"horizonte_dias": 30, "holdout_dias": 28, "intervalo": 0.8,
             "historico_desde": "2026-03-24", "historico_hasta": "2026-09-13", "wape": 22.1, "wape_ingenuo": 30.4,
             "tipos": {
               "5": {"nombre": "Proyector", "alpha": 0.35, "wape": 21.0, "wape_ingenuo": 28.0, "media_historica": 6.2,
                     "coef_dia_semana": [1.3, 1.1, 1.0, 1.0, 0.9, 0.4, 0.3], "tendencia_semanal_pct": 1.2,
                     "status": "ok", "detalle": null},
               "8": {"nombre": "Computadora", "alpha": 0.0, "status": "ok"},
               "1": {"nombre": "Silla", "alpha": 0.05, "status": "ok"},
               "3": {"nombre": "Escritorio", "status": "omitido", "detalle": "Menos de 20 días con pedidos"},
               "6": {"nombre": "Pantalla", "alpha": 0.8, "status": "ok"}
             }}
            """;

    private static ModeloForecast modelo() {
        ModeloForecast m = new ModeloForecast();
        m.setId(40L);
        m.setScope("inventario");
        m.setAlgoritmo("binomial_negativa");
        m.setTrainedAt(Instant.parse("2026-09-14T03:00:00Z"));
        m.setParamsJson(PARAMS);
        m.setActivo(true);
        return m;
    }

    private static FilaPrediccionEquipo pred(long tipo, LocalDate fecha, double media, int comprometidas) {
        return new FilaPrediccionEquipo(tipo, fecha, media, Math.max(0, media - 3), media + 3, comprometidas);
    }

    private void escenario(long stockProyectores) {
        when(modeloRepository.findFirstByScopeAndActivoTrueOrderByTrainedAtDesc("inventario"))
                .thenReturn(Optional.of(modelo()));
        when(consultas.prediccionesEquipo(40L, HOY)).thenReturn(List.of(
                pred(5, HOY, 7.1, 5),
                pred(5, HOY.plusDays(1), 14.2, 3),
                pred(5, HOY.plusDays(7), 6.2, 9),
                pred(8, HOY.plusDays(1), 2.0, 0),
                pred(1, HOY, 120.0, 40),
                pred(6, HOY.plusDays(2), 3.0, 1)));
        when(consultas.stockPorTipo()).thenReturn(List.of(
                new FilaStock(5L, "Proyector", stockProyectores, 11),
                new FilaStock(8L, "Computadora", 0, 12),
                new FilaStock(1L, "Silla", 428, 428),
                new FilaStock(3L, "Escritorio", 0, 0),
                new FilaStock(6L, "Pantalla", 2, 2)));
    }

    @Test
    @DisplayName("Sin modelo activo: entrenado=false y sin tipos")
    void sinModelo() {
        when(modeloRepository.findFirstByScopeAndActivoTrueOrderByTrainedAtDesc("inventario")).thenReturn(Optional.empty());

        PrediccionInventarioDto r = service.inventario();

        assertThat(r.modelo().entrenado()).isFalse();
        assertThat(r.modelo().algoritmo()).isNull();
        assertThat(r.tipos()).isEmpty();
        assertThat(r.resumen().tipos()).isZero();
        assertThat(r.resumen().primerFaltante()).isNull();
    }

    @Test
    @DisplayName("Probabilidad de faltante por día contra el stock, riesgo y orden sin_stock > alto > medio > bajo > omitido")
    void riesgoYOrden() {
        escenario(8);

        PrediccionInventarioDto r = service.inventario();

        assertThat(r.modelo().entrenado()).isTrue();
        assertThat(r.modelo().wape()).isEqualTo(22.1);
        assertThat(r.modelo().historicoHasta()).isEqualTo("2026-09-13");
        assertThat(r.modelo().horizonteDias()).isEqualTo(30);
        assertThat(r.tipos()).extracting(Tipo::nombre)
                .containsExactly("Computadora", "Proyector", "Pantalla", "Silla", "Escritorio");
        assertThat(r.tipos()).extracting(Tipo::riesgo)
                .containsExactly("sin_stock", "alto", "medio", "bajo", null);

        Tipo proyector = r.tipos().get(1);
        assertThat(proyector.stockDisponible()).isEqualTo(8);
        assertThat(proyector.stockTotal()).isEqualTo(11);
        // scipy: nbinom.sf(8, 1/0.35, ...) con media 7,1 y 14,2.
        assertThat(proyector.serie().get(0).probFaltante()).isCloseTo(0.3205, within(1e-9));
        assertThat(proyector.serie().get(1).probFaltante()).isCloseTo(0.6951, within(1e-9));
        // 9 unidades ya pedidas contra 8 disponibles: falta seguro.
        assertThat(proyector.serie().get(2).probFaltante()).isEqualTo(1.0);
        assertThat(proyector.probFaltanteMax()).isEqualTo(1.0);
        assertThat(proyector.diasEnRiesgo()).isEqualTo(2);
        assertThat(proyector.picoEsperado()).isEqualTo(14.2);
        assertThat(proyector.fechaPico()).isEqualTo(HOY.plusDays(1));
        assertThat(proyector.alpha()).isEqualTo(0.35);
        assertThat(proyector.mediaHistorica()).isEqualTo(6.2);
        assertThat(proyector.diaSemana()).hasSize(7);
        assertThat(proyector.diaSemana().get(0).dia()).isEqualTo("Lun");
        assertThat(proyector.diaSemana().get(6).dia()).isEqualTo("Dom");
        assertThat(proyector.diaSemana().get(6).multiplicador()).isEqualTo(0.3);
        assertThat(proyector.semanas()).hasSize(2);
        assertThat(proyector.semanas().get(0).semana()).isEqualTo(HOY);
        assertThat(proyector.semanas().get(0).picoEsperado()).isEqualTo(14.2);
        assertThat(proyector.semanas().get(0).comprometidasMax()).isEqualTo(5);
        assertThat(proyector.semanas().get(1).semana()).isEqualTo(HOY.plusDays(7));
        assertThat(proyector.semanas().get(1).probFaltanteMax()).isEqualTo(1.0);

        // Poisson (alpha 0) con stock 0: 1 - e^-2.
        Tipo computadora = r.tipos().get(0);
        assertThat(computadora.serie().get(0).probFaltante()).isCloseTo(0.8647, within(1e-9));

        // scipy: nbinom.sf(2, 1/0.8, ...) con media 3 = 0,4405.
        assertThat(r.tipos().get(2).probFaltanteMax()).isCloseTo(0.4405, within(1e-9));

        Tipo escritorio = r.tipos().get(4);
        assertThat(escritorio.status()).isEqualTo("omitido");
        assertThat(escritorio.detalle()).isEqualTo("Menos de 20 días con pedidos");
        assertThat(escritorio.serie()).isEmpty();
        assertThat(escritorio.picoEsperado()).isNull();
        assertThat(escritorio.probFaltanteMax()).isNull();
        assertThat(escritorio.alpha()).isNull();

        assertThat(r.resumen().tipos()).isEqualTo(5);
        assertThat(r.resumen().tiposEnRiesgo()).isEqualTo(1);
        assertThat(r.resumen().tiposSinStock()).isEqualTo(1);
        // Proyector y Computadora faltan el mismo día (15/9): gana la más probable.
        assertThat(r.resumen().primerFaltante().nombre()).isEqualTo("Computadora");
        assertThat(r.resumen().primerFaltante().fecha()).isEqualTo(HOY.plusDays(1));
    }

    @Test
    @DisplayName("El riesgo usa el stock de hoy: con más proyectores baja sin reentrenar")
    void usaElStockActual() {
        escenario(30);

        Tipo proyector = service.inventario().tipos().stream()
                .filter(t -> "Proyector".equals(t.nombre())).findFirst().orElseThrow();

        assertThat(proyector.riesgo()).isEqualTo("bajo");
        assertThat(proyector.diasEnRiesgo()).isZero();
    }

    @Test
    @DisplayName("Lo ya comprometido por encima del stock es faltante seguro; igual al stock, no")
    void comprometidasSobreStock() {
        assertThat(PrediccionInventarioService.probFaltante(0.5, 0.2, 3, 4)).isEqualTo(1.0);
        assertThat(PrediccionInventarioService.probFaltante(0.0, 0.2, 0, 1)).isEqualTo(1.0);
        assertThat(PrediccionInventarioService.probFaltante(0.0, 0.2, 3, 3)).isZero();
        // scipy: nbinom.sf(8, 1/0.35, ...) con media 7,1, redondeado a 4 decimales.
        assertThat(PrediccionInventarioService.probFaltante(7.1, 0.35, 8, 8)).isEqualTo(0.3205);
    }

    @Test
    @DisplayName("Reglas de riesgo: sin_stock sólo con demanda; alto ≥ 0,5; medio ≥ 0,2")
    void reglasDeRiesgo() {
        assertThat(PrediccionInventarioService.riesgo(0, 3.0, 0.95)).isEqualTo("sin_stock");
        assertThat(PrediccionInventarioService.riesgo(0, 0.4, 0.33)).isEqualTo("medio");
        assertThat(PrediccionInventarioService.riesgo(5, 9.0, 0.5)).isEqualTo("alto");
        assertThat(PrediccionInventarioService.riesgo(5, 9.0, 0.2)).isEqualTo("medio");
        assertThat(PrediccionInventarioService.riesgo(5, 9.0, 0.1999)).isEqualTo("bajo");
    }

    @Test
    @DisplayName("Dentro del mismo riesgo va primero el más probable")
    void ordenDentroDelRiesgo() {
        List<Tipo> tipos = new ArrayList<>(List.of(
                tipoConRiesgo("A", "medio", 0.21),
                tipoConRiesgo("B", "alto", 0.6),
                tipoConRiesgo("C", "medio", 0.45),
                tipoConRiesgo("D", "alto", 0.9),
                tipoConRiesgo("E", "sin_stock", 0.3)));

        PrediccionInventarioService.ordenar(tipos);

        assertThat(tipos).extracting(Tipo::nombre).containsExactly("E", "D", "B", "C", "A");
    }

    private static Tipo tipoConRiesgo(String nombre, String riesgo, double probMax) {
        return new Tipo(1L, nombre, "ok", null, 1L, 1L, null, null, null, null, null, List.of(), 1.0, HOY,
                probMax, 0, riesgo, List.of(), List.of());
    }
}
