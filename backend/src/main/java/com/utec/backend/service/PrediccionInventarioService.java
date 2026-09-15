package com.utec.backend.service;

import com.utec.backend.dto.stats.PrediccionInventarioDto;
import com.utec.backend.dto.stats.PrediccionInventarioDto.Dia;
import com.utec.backend.dto.stats.PrediccionInventarioDto.DiaSemana;
import com.utec.backend.dto.stats.PrediccionInventarioDto.Modelo;
import com.utec.backend.dto.stats.PrediccionInventarioDto.PrimerFaltante;
import com.utec.backend.dto.stats.PrediccionInventarioDto.Resumen;
import com.utec.backend.dto.stats.PrediccionInventarioDto.Semana;
import com.utec.backend.dto.stats.PrediccionInventarioDto.Tipo;
import com.utec.backend.model.ModeloForecast;
import com.utec.backend.repository.ModeloForecastRepository;
import com.utec.backend.repository.PrediccionesConsultas;
import com.utec.backend.repository.PrediccionesConsultas.FilaPrediccionEquipo;
import com.utec.backend.repository.PrediccionesConsultas.FilaStock;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.temporal.TemporalAdjusters;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.TreeMap;
import java.util.function.Function;
import java.util.stream.Collectors;

import static com.utec.backend.service.CalculosEstadisticos.hoy;

/**
 * Riesgo de faltante de equipamiento a partir del modelo de binomial negativa
 * de ml-svc. El modelo guarda la media y la banda del pico diario; la
 * probabilidad de quedarse corto se calcula acá contra el stock de hoy.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PrediccionInventarioService {

    static final String SCOPE = "inventario";

    static final String RIESGO_SIN_STOCK = "sin_stock";
    static final String RIESGO_ALTO = "alto";
    static final String RIESGO_MEDIO = "medio";
    static final String RIESGO_BAJO = "bajo";

    /** Desde esta probabilidad un día cuenta como "en riesgo". */
    static final double UMBRAL_ALTO = 0.5;
    static final double UMBRAL_MEDIO = 0.2;

    /** Con menos de media unidad esperada no se considera que haya demanda. */
    private static final double DEMANDA_MINIMA = 0.5;

    private static final List<String> DIAS = List.of("Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom");
    private static final List<String> ORDEN_RIESGO = List.of(RIESGO_SIN_STOCK, RIESGO_ALTO, RIESGO_MEDIO, RIESGO_BAJO);

    private final ModeloForecastRepository modeloRepository;
    private final PrediccionesConsultas consultas;
    private final Clock clock;

    public PrediccionInventarioDto inventario() {
        Optional<ModeloForecast> modeloOpt = modeloRepository.findFirstByScopeAndActivoTrueOrderByTrainedAtDesc(SCOPE);
        if (modeloOpt.isEmpty()) {
            return new PrediccionInventarioDto(
                    new Modelo(false, null, null, null, null, null, null, null, null, null),
                    new Resumen(0, 0, 0, null), List.of());
        }
        ModeloForecast modelo = modeloOpt.get();
        ParamsModelo params = ParamsModelo.de(modelo);
        ParamsModelo paramsTipos = params.objeto("tipos");

        Map<Long, List<FilaPrediccionEquipo>> predsPorTipo = consultas.prediccionesEquipo(modelo.getId(), hoy(clock))
                .stream()
                .collect(Collectors.groupingBy(FilaPrediccionEquipo::tipoElementoId, LinkedHashMap::new,
                        Collectors.toList()));
        Map<Long, FilaStock> stock = consultas.stockPorTipo().stream()
                .collect(Collectors.toMap(FilaStock::tipoElementoId, Function.identity(), (a, b) -> a));

        // Los tipos son los que entrenó el modelo (omitidos incluidos) más
        // cualquiera que tenga predicciones sin figurar en params.
        Set<Long> ids = new LinkedHashSet<>();
        for (String clave : paramsTipos.claves()) {
            try {
                ids.add(Long.valueOf(clave));
            } catch (NumberFormatException ignorada) {
                // Una clave que no es id no describe un tipo de elemento.
            }
        }
        ids.addAll(predsPorTipo.keySet());

        List<Tipo> tipos = new ArrayList<>();
        for (Long id : ids) {
            tipos.add(tipo(id, paramsTipos.objeto(String.valueOf(id)), stock.get(id),
                    predsPorTipo.getOrDefault(id, List.of())));
        }
        ordenar(tipos);

        Modelo datosModelo = new Modelo(true, modelo.getAlgoritmo(), modelo.getTrainedAt(),
                params.decimal("wape"), params.decimal("wape_ingenuo"),
                params.texto("historico_desde"), params.texto("historico_hasta"),
                params.entero("holdout_dias"), params.entero("horizonte_dias"), params.decimal("intervalo"));
        return new PrediccionInventarioDto(datosModelo, resumen(tipos), tipos);
    }

    private static Tipo tipo(Long id, ParamsModelo p, FilaStock stock, List<FilaPrediccionEquipo> preds) {
        String nombre = p.texto("nombre");
        if (nombre == null && stock != null) {
            nombre = stock.nombre();
        }
        Long disponible = stock == null ? 0L : stock.disponible();
        Long total = stock == null ? 0L : stock.total();
        String status = p.texto("status");
        if (status == null) {
            status = "ok";
        }
        if (!"ok".equals(status)) {
            return new Tipo(id, nombre, status, p.texto("detalle"), disponible, total, null, null, null, null,
                    null, List.of(), null, null, null, null, null, List.of(), List.of());
        }

        // Sin alpha (modelo viejo o tipo sin params) se asume Poisson.
        Double alphaParam = p.decimal("alpha");
        double alpha = alphaParam == null ? 0.0 : alphaParam;
        int stockDisponible = (int) Math.min(Integer.MAX_VALUE, disponible);
        List<Dia> serie = preds.stream()
                .map(f -> new Dia(f.fecha(), f.prediccion(), f.bandaInferior(), f.bandaSuperior(),
                        f.comprometidas(), probFaltante(f.prediccion(), alpha, stockDisponible, f.comprometidas())))
                .toList();

        List<DiaSemana> diaSemana = new ArrayList<>();
        List<Double> multiplicadores = p.decimales("coef_dia_semana");
        for (int i = 0; i < Math.min(DIAS.size(), multiplicadores.size()); i++) {
            diaSemana.add(new DiaSemana(DIAS.get(i), multiplicadores.get(i)));
        }

        Double picoEsperado = null;
        LocalDate fechaPico = null;
        Double probMax = null;
        Integer diasEnRiesgo = null;
        String riesgo = null;
        if (!serie.isEmpty()) {
            Dia pico = serie.stream().max(Comparator.comparingDouble(Dia::prediccion)).orElseThrow();
            picoEsperado = pico.prediccion();
            fechaPico = pico.fecha();
            probMax = serie.stream().mapToDouble(Dia::probFaltante).max().orElse(0.0);
            diasEnRiesgo = (int) serie.stream().filter(d -> d.probFaltante() >= UMBRAL_ALTO).count();
            double demandaMax = serie.stream()
                    .mapToDouble(d -> Math.max(d.prediccion(), d.comprometidas())).max().orElse(0.0);
            riesgo = riesgo(disponible, demandaMax, probMax);
        }
        return new Tipo(id, nombre, status, p.texto("detalle"), disponible, total, p.decimal("media_historica"),
                p.decimal("wape"), p.decimal("wape_ingenuo"), alphaParam, p.decimal("tendencia_semanal_pct"),
                diaSemana, picoEsperado, fechaPico, probMax, diasEnRiesgo, riesgo, serie, semanas(serie));
    }

    /**
     * P(pico &gt; stock) con el pico binomial negativo. Si lo ya comprometido
     * supera el stock, faltar no es un riesgo sino un hecho: vale 1.
     */
    static double probFaltante(double media, double alpha, int stockDisponible, int comprometidas) {
        if (comprometidas > stockDisponible) {
            return 1.0;
        }
        double prob = DistribucionBinomialNegativa.probMayorQue(stockDisponible, media, alpha);
        return Math.round(prob * 10_000.0) / 10_000.0;
    }

    /**
     * sin_stock gana aunque la probabilidad sea alta: el problema no es un pico
     * puntual sino que no hay nada que prestar.
     */
    static String riesgo(long stockDisponible, double demandaMaxima, double probFaltanteMax) {
        if (stockDisponible == 0 && demandaMaxima > DEMANDA_MINIMA) {
            return RIESGO_SIN_STOCK;
        }
        if (probFaltanteMax >= UMBRAL_ALTO) {
            return RIESGO_ALTO;
        }
        if (probFaltanteMax >= UMBRAL_MEDIO) {
            return RIESGO_MEDIO;
        }
        return RIESGO_BAJO;
    }

    /** sin_stock, alto, medio, bajo y al final los que no tienen riesgo (omitidos); dentro, más probable primero. */
    static void ordenar(List<Tipo> tipos) {
        tipos.sort(Comparator.comparingInt((Tipo t) -> {
                    // List.of no acepta buscar null: los omitidos van directo al final.
                    int indice = t.riesgo() == null ? -1 : ORDEN_RIESGO.indexOf(t.riesgo());
                    return indice < 0 ? ORDEN_RIESGO.size() : indice;
                })
                .thenComparing(Tipo::probFaltanteMax, Comparator.nullsLast(Comparator.reverseOrder()))
                .thenComparing(Tipo::nombre, Comparator.nullsLast(Comparator.naturalOrder())));
    }

    private static List<Semana> semanas(List<Dia> serie) {
        Map<LocalDate, List<Dia>> porSemana = new TreeMap<>();
        for (Dia d : serie) {
            LocalDate lunes = d.fecha().with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
            porSemana.computeIfAbsent(lunes, k -> new ArrayList<>()).add(d);
        }
        return porSemana.entrySet().stream()
                .map(e -> new Semana(e.getKey(),
                        e.getValue().stream().mapToDouble(Dia::prediccion).max().orElse(0.0),
                        e.getValue().stream().mapToDouble(Dia::probFaltante).max().orElse(0.0),
                        e.getValue().stream().mapToInt(Dia::comprometidas).max().orElse(0)))
                .toList();
    }

    static Resumen resumen(List<Tipo> tipos) {
        int enRiesgo = (int) tipos.stream().filter(t -> RIESGO_ALTO.equals(t.riesgo())).count();
        int sinStock = (int) tipos.stream().filter(t -> RIESGO_SIN_STOCK.equals(t.riesgo())).count();
        PrimerFaltante primero = null;
        for (Tipo t : tipos) {
            for (Dia d : t.serie()) {
                if (d.probFaltante() < UMBRAL_ALTO) {
                    continue;
                }
                boolean antes = primero == null || d.fecha().isBefore(primero.fecha())
                        || (d.fecha().isEqual(primero.fecha()) && d.probFaltante() > primero.probabilidad());
                if (antes) {
                    primero = new PrimerFaltante(t.tipoElementoId(), t.nombre(), d.fecha(), d.probFaltante());
                }
                // La serie viene por fecha: el primer día en riesgo del tipo es el único candidato.
                break;
            }
        }
        return new Resumen(tipos.size(), enRiesgo, sinStock, primero);
    }
}
