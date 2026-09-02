package com.utec.backend.service;

import com.utec.backend.model.ModeloForecast;
import com.utec.backend.model.PrediccionReserva;
import com.utec.backend.repository.HechosReservaRepository;
import com.utec.backend.repository.ModeloForecastRepository;
import com.utec.backend.repository.PrediccionReservaRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Servicio de lectura del pipeline ML. La escritura (entrenamiento del
 * modelo, generación de predicciones) la hace el servicio Python ml-svc;
 * acá sólo se leen los resultados desde la base compartida y se proxea el
 * disparo manual de reentrenamiento.
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class ForecastingService {

    // El servidor corre en UTC: sin zona explícita, "hoy" cambia tres horas
    // antes que en Uruguay.
    private static final ZoneId ZONA = ZoneId.of("America/Montevideo");

    private static final String K_MODELO_ID = "modeloId";

    private static final String SCOPE_GLOBAL = "global";

    private final ModeloForecastRepository modeloRepository;
    private final PrediccionReservaRepository prediccionRepository;
    private final HechosReservaRepository hechosReservaRepository;

    @Value("${app.ml-service-url:http://localhost:8000}")
    private String mlServiceUrl;

    public Map<String, Object> calidadModeloGlobal() {
        Map<String, Object> resultado = new LinkedHashMap<>();
        modeloRepository.findActivoByScope(SCOPE_GLOBAL).ifPresentOrElse(
                modelo -> {
                    resultado.put(K_MODELO_ID, modelo.getId());
                    resultado.put("algoritmo", modelo.getAlgoritmo());
                    resultado.put("trainedAt", modelo.getTrainedAt());
                    resultado.put("sampleSize", modelo.getSampleSize());
                    resultado.put("holdoutSize", modelo.getHoldoutSize());
                    resultado.put("mape", modelo.getMape());
                    resultado.put("mae", modelo.getMae());
                    resultado.put("notas", modelo.getNotas());
                },
                () -> resultado.put(K_MODELO_ID, null));
        return resultado;
    }

    public Map<String, Object> forecastGlobal(LocalDate desde, LocalDate hasta, Integer diasHistorico) {
        Map<String, Object> resultado = new LinkedHashMap<>();
        var modeloOpt = modeloRepository.findActivoByScope(SCOPE_GLOBAL);
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
        LocalDate desdeHist = preds.isEmpty()
                ? LocalDate.now(ZONA).minusDays(ventana)
                : preds.get(0).getFechaObjetivo().minusDays(ventana);
        LocalDate hastaHist = preds.isEmpty()
                ? LocalDate.now(ZONA)
                : preds.get(0).getFechaObjetivo().minusDays(1);

        List<Map<String, Object>> historicoJson = hechosReservaRepository
                .findByFechaBetween(desdeHist, hastaHist)
                .stream()
                .filter(h -> "APROBADO".equals(h.getEstado()))
                .collect(java.util.stream.Collectors.groupingBy(
                        com.utec.backend.model.HechosReservaDiario::getFecha,
                        java.util.stream.Collectors.summingInt(com.utec.backend.model.HechosReservaDiario::getCantReservas)))
                .entrySet().stream()
                .sorted(Map.Entry.comparingByKey())
                .map(e -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("fecha", e.getKey().toString());
                    m.put("real", e.getValue());
                    return m;
                })
                .toList();

        resultado.put(K_MODELO_ID, modelo.getId());
        resultado.put("trainedAt", modelo.getTrainedAt());
        resultado.put("mape", modelo.getMape());
        resultado.put("historico", historicoJson);
        resultado.put("predicciones", prediccionesJson);
        return resultado;
    }

    /**
     * Proxy al servicio Python para disparar reentrenamiento manual.
     * No bloquea: si ml-svc no responde, devuelve el detalle del fallo.
     */
    public Map<String, Object> reentrenarGlobal() {
        log.info("Disparando reentrenamiento manual en ml-svc ({})", mlServiceUrl);
        RestClient client = RestClient.builder().baseUrl(mlServiceUrl).build();
        try {
            ResponseEntity<Map<String, Object>> response = client.post()
                    .uri("/train")
                    .retrieve()
                    .toEntity(new org.springframework.core.ParameterizedTypeReference<Map<String, Object>>() {});
            Map<String, Object> body = response.getBody() == null ? Map.of() : response.getBody();
            log.info("Reentrenamiento completado: {}", body);
            return body;
        } catch (RestClientException ex) {
            log.error("Fallo al contactar ml-svc: {}", ex.getMessage());
            Map<String, Object> err = new LinkedHashMap<>();
            err.put("status", "error");
            err.put("error", "No se pudo contactar al servicio ML: " + ex.getMessage());
            err.put("mlServiceUrl", mlServiceUrl);
            return err;
        }
    }
}
