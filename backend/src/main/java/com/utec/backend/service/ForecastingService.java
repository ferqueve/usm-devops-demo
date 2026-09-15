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
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

import static com.utec.backend.service.CalculosEstadisticos.hoy;
import static com.utec.backend.service.CalculosEstadisticos.redondear;

/**
 * Servicio de lectura del pipeline ML de reservas. La escritura (entrenamiento
 * del modelo, generación de predicciones) la hace el servicio Python ml-svc;
 * acá sólo se leen los resultados desde la base compartida y se proxea el
 * disparo de reentrenamiento.
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class ForecastingService {

    private static final String K_MODELO_ID = "modeloId";

    static final String SCOPE_GLOBAL = "global";
    static final String SCOPE_TIPO_ESPACIO = "tipo_espacio";

    /** Largo de la serie por tipo y de la ventana histórica contra la que se compara. */
    private static final int DIAS_SERIE = 30;
    private static final int DIAS_CORTOS = 7;

    /** Modelo que se pide reentrenar → endpoint de ml-svc. */
    private static final Map<String, String> RUTAS_ENTRENAMIENTO = Map.of(
            "reservas", "/train",
            "inventario", "/train/inventario",
            "academico", "/train/academico",
            "todo", "/train/todo");

    private final ModeloForecastRepository modeloRepository;
    private final PrediccionReservaRepository prediccionRepository;
    private final HechosReservaRepository hechosReservaRepository;
    private final ReservaRepository reservaRepository;
    private final PrediccionesConsultas consultas;
    private final MlServiceClient mlServiceClient;
    private final Clock clock;

    // ---------------------------------------------------------------- calidad

    /** Calidad del modelo global o, con {@code tipoEspacioId}, del de ese tipo de espacio. */
    public Map<String, Object> calidadModelo(Long tipoEspacioId) {
        Map<String, Object> resultado = new LinkedHashMap<>();
        modeloActivo(tipoEspacioId).ifPresentOrElse(
                modelo -> {
                    ParamsModelo params = ParamsModelo.de(modelo);
                    resultado.put(K_MODELO_ID, modelo.getId());
                    resultado.put("algoritmo", modelo.getAlgoritmo());
                    resultado.put("trainedAt", modelo.getTrainedAt());
                    resultado.put("sampleSize", modelo.getSampleSize());
                    resultado.put("holdoutSize", modelo.getHoldoutSize());
                    resultado.put("mape", modelo.getMape());
                    resultado.put("mae", modelo.getMae());
                    // Lo que sigue lo agrega ml-svc en params_json; un modelo
                    // entrenado antes no lo tiene y sale null. Las claves en
                    // inglés son las de los modelos globales anteriores al
                    // contrato de predicciones por área.
                    resultado.put("wape", params.decimal("wape"));
                    resultado.put("wapeIngenuo", params.decimal("wape_ingenuo"));
                    resultado.put("estacionalidadAnual", params.booleano("estacionalidad_anual", "yearly_seasonality"));
                    resultado.put("historicoDesde", params.texto("historico_desde", "desde"));
                    resultado.put("historicoHasta", params.texto("historico_hasta", "hasta"));
                    Object validacion = params.crudo("validacion");
                    resultado.put("validacion", validacion instanceof List<?> ? validacion : List.of());
                    resultado.put("notas", modelo.getNotas());
                },
                () -> resultado.put(K_MODELO_ID, null));
        return resultado;
    }

    private Optional<ModeloForecast> modeloActivo(Long tipoEspacioId) {
        return tipoEspacioId == null
                ? modeloRepository.findActivoByScope(SCOPE_GLOBAL)
                : modeloRepository.findFirstByScopeAndTipoEspacioIdAndActivoTrueOrderByTrainedAtDesc(
                        SCOPE_TIPO_ESPACIO, tipoEspacioId);
    }

    // --------------------------------------------------------------- forecast

    /**
     * Predicción con histórico y reservas ya aprobadas para el gráfico. Sin
     * {@code tipoEspacioId} es la del campus; con él, la misma forma pero con
     * el modelo, el histórico y las reservadas de ese tipo de espacio.
     */
    public Map<String, Object> forecast(LocalDate desde, LocalDate hasta, Integer diasHistorico, Long tipoEspacioId) {
        Map<String, Object> resultado = new LinkedHashMap<>();
        var modeloOpt = modeloActivo(tipoEspacioId);
        if (modeloOpt.isEmpty()) {
            resultado.put(K_MODELO_ID, null);
            resultado.put("historico", List.of());
            resultado.put("predicciones", List.of());
            return resultado;
        }
        ModeloForecast modelo = modeloOpt.get();

        List<PrediccionReserva> preds = (desde != null && hasta != null)
                ? prediccionRepository.findByModeloAndRango(modelo.getId(), desde, hasta)
                : prediccionRepository.findByModelo(modelo.getId());

        List<Map<String, Object>> prediccionesJson = preds.stream()
                .map(p -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("fecha", p.getFechaObjetivo().toString());
                    m.put("prediccion", p.getPrediccion());
                    m.put("bandaInferior", p.getBandaInferior());
                    m.put("bandaSuperior", p.getBandaSuperior());
                    return m;
                })
                .toList();

        // Histórico relevante para contexto del gráfico.
        int ventana = diasHistorico == null || diasHistorico <= 0 ? 90 : diasHistorico;
        LocalDate hoy = hoy(clock);
        LocalDate desdeHist = preds.isEmpty()
                ? hoy.minusDays(ventana)
                : preds.get(0).getFechaObjetivo().minusDays(ventana);
        LocalDate hastaHist = preds.isEmpty()
                ? hoy
                : preds.get(0).getFechaObjetivo().minusDays(1);

        Map<LocalDate, Integer> aprobadasPorFecha = tipoEspacioId == null
                ? aprobadasHechos(desdeHist, hastaHist)
                : porFecha(consultas.aprobadasHechosPorTipo(tipoEspacioId, desdeHist, hastaHist));
        // Con cero los dias sin reservas: sin ellos la linea une un viernes con
        // el lunes y el fin de semana desaparece del grafico.
        LocalDate primerDato = aprobadasPorFecha.keySet().stream().min(LocalDate::compareTo).orElse(hastaHist);
        List<Map<String, Object>> historicoJson = serieDiaria(primerDato, hastaHist, aprobadasPorFecha, "real");

        List<Map<String, Object>> reservadasJson = List.of();
        if (!preds.isEmpty()) {
            LocalDate primera = preds.get(0).getFechaObjetivo();
            LocalDate ultima = preds.get(preds.size() - 1).getFechaObjetivo();
            Map<LocalDate, Integer> reservadas = tipoEspacioId == null
                    ? aprobadasPorDia(primera, ultima)
                    : porFecha(consultas.reservadasPorTipoYDia(tipoEspacioId, primera, ultima).stream()
                            .map(f -> new FilaDia(f.fecha(), f.cantidad())).toList());
            reservadasJson = serieDiaria(primera, ultima, reservadas, "cantidad");
        }

        resultado.put(K_MODELO_ID, modelo.getId());
        resultado.put("trainedAt", modelo.getTrainedAt());
        resultado.put("mape", modelo.getMape());
        resultado.put("hoy", hoy.toString());
        resultado.put("historico", historicoJson);
        resultado.put("predicciones", prediccionesJson);
        resultado.put("reservadas", reservadasJson);
        return resultado;
    }

    private Map<LocalDate, Integer> aprobadasHechos(LocalDate desde, LocalDate hasta) {
        return hechosReservaRepository.findByFechaBetween(desde, hasta).stream()
                .filter(h -> "APROBADO".equals(h.getEstado()))
                .collect(Collectors.groupingBy(HechosReservaDiario::getFecha,
                        Collectors.summingInt(HechosReservaDiario::getCantReservas)));
    }

    private static Map<LocalDate, Integer> porFecha(List<FilaDia> filas) {
        Map<LocalDate, Integer> mapa = new HashMap<>();
        filas.forEach(f -> mapa.merge(f.fecha(), (int) f.cantidad(), Integer::sum));
        return mapa;
    }

    private Map<LocalDate, Integer> aprobadasPorDia(LocalDate desde, LocalDate hasta) {
        Map<LocalDate, Integer> porFecha = new HashMap<>();
        for (Object[] fila : reservaRepository.aprobadasPorDia(desde, hasta)) {
            LocalDate fecha = fila[0] instanceof java.sql.Date d ? d.toLocalDate() : LocalDate.parse(fila[0].toString());
            porFecha.put(fecha, ((Number) fila[1]).intValue());
        }
        return porFecha;
    }

    private static List<Map<String, Object>> serieDiaria(
            LocalDate desde, LocalDate hasta, Map<LocalDate, Integer> valores, String clave) {
        List<Map<String, Object>> serie = new ArrayList<>();
        for (LocalDate dia = desde; !dia.isAfter(hasta); dia = dia.plusDays(1)) {
            Map<String, Object> punto = new LinkedHashMap<>();
            punto.put("fecha", dia.toString());
            punto.put(clave, valores.getOrDefault(dia, 0));
            serie.add(punto);
        }
        return serie;
    }

    // ------------------------------------------------------- tipos de espacio

    /**
     * Resumen por tipo de espacio para comparar la demanda que viene en cada
     * uno. Todo se mide desde hoy: un modelo entrenado hace unos días ya gastó
     * parte de su horizonte y esos días no se muestran como "próximos".
     */
    public PrediccionTiposEspacioDto tiposEspacio() {
        LocalDate hoy = hoy(clock);
        LocalDate desdeVentana = hoy.minusDays(DIAS_SERIE);

        // El más nuevo primero: si quedaran dos activos de un tipo, gana ese.
        Map<Long, ModeloForecast> modeloPorTipo = new HashMap<>();
        for (ModeloForecast m : modeloRepository.findByScopeAndActivoTrueOrderByTrainedAtDesc(SCOPE_TIPO_ESPACIO)) {
            if (m.getTipoEspacioId() != null) {
                modeloPorTipo.putIfAbsent(m.getTipoEspacioId(), m);
            }
        }
        Map<Long, FilaHistorialTipo> historial = consultas.historialPorTipo(desdeVentana, hoy).stream()
                .collect(Collectors.toMap(FilaHistorialTipo::tipoEspacioId, f -> f, (a, b) -> a));

        Map<Long, List<PrediccionReserva>> seriePorTipo = new HashMap<>();
        LocalDate ultimaFecha = hoy;
        for (var entrada : modeloPorTipo.entrySet()) {
            List<PrediccionReserva> desdeHoy = prediccionRepository.findByModelo(entrada.getValue().getId()).stream()
                    .filter(p -> !p.getFechaObjetivo().isBefore(hoy))
                    .sorted(Comparator.comparing(PrediccionReserva::getFechaObjetivo))
                    .limit(DIAS_SERIE)
                    .toList();
            seriePorTipo.put(entrada.getKey(), desdeHoy);
            if (!desdeHoy.isEmpty() && desdeHoy.get(desdeHoy.size() - 1).getFechaObjetivo().isAfter(ultimaFecha)) {
                ultimaFecha = desdeHoy.get(desdeHoy.size() - 1).getFechaObjetivo();
            }
        }
        Map<Long, Map<LocalDate, Long>> reservadas = new HashMap<>();
        if (!modeloPorTipo.isEmpty()) {
            for (FilaTipoDia f : consultas.reservadasPorTipoYDia(null, hoy, ultimaFecha)) {
                reservadas.computeIfAbsent(f.tipoEspacioId(), k -> new HashMap<>()).put(f.fecha(), f.cantidad());
            }
        }

        List<PrediccionTiposEspacioDto.Tipo> tipos = new ArrayList<>();
        for (FilaTipoEspacio fila : consultas.tiposEspacio()) {
            ModeloForecast modelo = modeloPorTipo.get(fila.tipoEspacioId());
            if (modelo == null) {
                tipos.add(new PrediccionTiposEspacioDto.Tipo(fila.tipoEspacioId(), fila.nombre(), fila.espacios(),
                        false, null, null, null, null, null, null, null, null, null, List.of()));
                continue;
            }
            tipos.add(tipoEntrenado(fila, modelo, seriePorTipo.getOrDefault(fila.tipoEspacioId(), List.of()),
                    reservadas.getOrDefault(fila.tipoEspacioId(), Map.of()),
                    promedioDiario(historial.get(fila.tipoEspacioId()), desdeVentana, hoy)));
        }
        // Entrenados primero y, entre ellos, los que más demanda mueven.
        tipos.sort(Comparator.comparing((PrediccionTiposEspacioDto.Tipo t) -> !t.entrenado())
                .thenComparing(t -> t.esperadoProximos30() == null ? 0.0 : t.esperadoProximos30(),
                        Comparator.reverseOrder())
                .thenComparing(PrediccionTiposEspacioDto.Tipo::nombre,
                        Comparator.nullsLast(Comparator.naturalOrder())));
        return new PrediccionTiposEspacioDto(tipos);
    }

    private static PrediccionTiposEspacioDto.Tipo tipoEntrenado(FilaTipoEspacio fila, ModeloForecast modelo,
                                                                List<PrediccionReserva> preds,
                                                                Map<LocalDate, Long> reservadas,
                                                                Double promedioHistorico) {
        ParamsModelo params = ParamsModelo.de(modelo);
        List<PrediccionTiposEspacioDto.Punto> serie = preds.stream()
                .map(p -> new PrediccionTiposEspacioDto.Punto(p.getFechaObjetivo(), doble(p.getPrediccion()),
                        dobleONull(p.getBandaInferior()), dobleONull(p.getBandaSuperior()),
                        reservadas.getOrDefault(p.getFechaObjetivo(), 0L)))
                .toList();

        Double esperado7 = null;
        Double esperado30 = null;
        Integer reservadas7 = null;
        LocalDate picoFecha = null;
        Double picoValor = null;
        Double cambioPct = null;
        if (!serie.isEmpty()) {
            List<PrediccionTiposEspacioDto.Punto> primeros = serie.subList(0, Math.min(DIAS_CORTOS, serie.size()));
            esperado7 = redondear(primeros.stream().mapToDouble(PrediccionTiposEspacioDto.Punto::prediccion).sum());
            reservadas7 = (int) primeros.stream().mapToLong(PrediccionTiposEspacioDto.Punto::reservadas).sum();
            double total = serie.stream().mapToDouble(PrediccionTiposEspacioDto.Punto::prediccion).sum();
            esperado30 = redondear(total);
            PrediccionTiposEspacioDto.Punto pico = serie.stream()
                    .max(Comparator.comparingDouble(PrediccionTiposEspacioDto.Punto::prediccion))
                    .orElseThrow();
            picoFecha = pico.fecha();
            picoValor = redondear(pico.prediccion());
            cambioPct = cambioPct(total / serie.size(), promedioHistorico);
        }
        return new PrediccionTiposEspacioDto.Tipo(fila.tipoEspacioId(), fila.nombre(), fila.espacios(), true,
                params.decimal("wape"), params.decimal("wape_ingenuo"), redondear(promedioHistorico),
                esperado7, esperado30, cambioPct, reservadas7, picoFecha, picoValor, serie);
    }

    /**
     * Reservas aprobadas por día en la ventana antes de hoy. Si el tipo empezó
     * a tener reservas dentro de la ventana, se divide por los días que tuvo
     * y no por 30: si no, un tipo nuevo parecería crecer muchísimo.
     */
    static Double promedioDiario(FilaHistorialTipo historial, LocalDate desdeVentana, LocalDate hoy) {
        if (historial == null || historial.primerDia() == null) {
            return null;
        }
        LocalDate inicio = historial.primerDia().isAfter(desdeVentana) ? historial.primerDia() : desdeVentana;
        long dias = ChronoUnit.DAYS.between(inicio, hoy);
        return dias <= 0 ? null : (double) historial.reservasVentana() / dias;
    }

    /** Cambio % del promedio diario esperado contra el histórico; null si no hay base. */
    static Double cambioPct(double promedioEsperado, Double promedioHistorico) {
        if (promedioHistorico == null || promedioHistorico <= 0) {
            return null;
        }
        return redondear((promedioEsperado - promedioHistorico) * 100.0 / promedioHistorico);
    }

    private static double doble(BigDecimal valor) {
        return valor == null ? 0.0 : valor.doubleValue();
    }

    private static Double dobleONull(BigDecimal valor) {
        return valor == null ? null : valor.doubleValue();
    }

    // --------------------------------------------------------- reentrenamiento

    /**
     * Reentrenamiento semanal de todos los modelos. Corre despues del recalculo
     * nocturno de hechos (03:00), asi los modelos aprenden con la semana entera.
     *
     * La documentacion lo delegaba a un cron de Railway que nunca se creo: en
     * produccion habia un unico modelo, entrenado a mano, y el pronostico
     * quedaba viejo sin que nadie se enterara.
     */
    @Scheduled(cron = "0 0 4 * * SUN", zone = "America/Montevideo")
    @Transactional(propagation = Propagation.NOT_SUPPORTED)
    public void reentrenarSemanal() {
        Map<String, Object> resultado = reentrenar("todo");
        if ("error".equals(resultado.get("status"))) {
            log.warn("El reentrenamiento semanal fallo: {}", resultado.get("error"));
            return;
        }
        // /train/todo responde 200 aunque falle una parte: hay que mirar cada una.
        resultado.forEach((modelo, parte) -> {
            if (parte instanceof Map<?, ?> detalle && "error".equals(detalle.get("status"))) {
                log.warn("El reentrenamiento semanal de {} fallo: {}", modelo, detalle.get("detalle"));
            }
        });
    }

    /**
     * Dispara el entrenamiento de un modelo en ml-svc: reservas (global y por
     * tipo de espacio), inventario, academico o todo. Es bloqueante; si ml-svc
     * falla devuelve el detalle en vez de lanzar.
     */
    @Transactional(propagation = Propagation.NOT_SUPPORTED)
    public Map<String, Object> reentrenar(String modelo) {
        String clave = modelo == null || modelo.isBlank() ? "reservas" : modelo.trim().toLowerCase();
        String ruta = RUTAS_ENTRENAMIENTO.get(clave);
        if (ruta == null) {
            throw new IllegalArgumentException(
                    "Modelo desconocido: " + modelo + ". Opciones: reservas, inventario, academico, todo");
        }
        return mlServiceClient.post(ruta);
    }
}
