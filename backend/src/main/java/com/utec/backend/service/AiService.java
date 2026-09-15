package com.utec.backend.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Proxy hacia el servicio Python ai-svc (capa de IA generativa).
 * Mantiene la misma forma que ForecastingService: si ai-svc no responde,
 * devuelve un Map con detalle del fallo en vez de propagar la excepción.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AiService {

    private static final ObjectMapper MAPPER = new ObjectMapper();
    // HTTP/1.1: el upgrade a HTTP/2 que hace el cliente Java por default no lo maneja
    // bien Uvicorn (FastAPI) y termina perdiendo el body de los POST.
    private static final HttpClient HTTP = HttpClient.newBuilder()
            .version(HttpClient.Version.HTTP_1_1)
            .connectTimeout(Duration.ofSeconds(10))
            .build();

    @Value("${app.ai-service-url:http://localhost:8001}")
    private String aiServiceUrl;

    private Map<String, Object> proxy(String method, String path, Object body) {
        try {
            HttpRequest.Builder rb = HttpRequest.newBuilder()
                    .uri(URI.create(aiServiceUrl + path))
                    .timeout(Duration.ofSeconds(60))
                    .header("Content-Type", "application/json");
            if ("POST".equals(method)) {
                String jsonBody = MAPPER.writeValueAsString(body == null ? Map.of() : body);
                rb.POST(HttpRequest.BodyPublishers.ofString(jsonBody, StandardCharsets.UTF_8));
            } else {
                rb.GET();
            }
            HttpResponse<String> response = HTTP.send(rb.build(), HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() >= 400) {
                throw new AiUpstreamException("HTTP " + response.statusCode() + ": " + response.body());
            }
            return MAPPER.readValue(response.body(), new TypeReference<>() {});
        } catch (Exception ex) {
            // HttpClient.send lanza InterruptedException: si la tragamos sin
            // re-interrumpir, el hilo pierde la señal de cancelación.
            if (ex instanceof InterruptedException) {
                Thread.currentThread().interrupt();
            }
            // getMessage() es null en varias excepciones de red (ConnectException entre
            // otras), y el mensaje quedaba en "…: null", que no le sirve a nadie.
            String motivo = (ex.getMessage() != null && !ex.getMessage().isBlank())
                    ? ex.getMessage()
                    : ex.getClass().getSimpleName();
            log.error("Fallo al contactar ai-svc en {}: {}", path, motivo);
            Map<String, Object> err = new LinkedHashMap<>();
            err.put("status", "error");
            err.put("error", "No se pudo contactar al servicio de IA (" + motivo + ")");
            err.put("aiServiceUrl", aiServiceUrl);
            err.put("path", path);
            return err;
        }
    }

    /**
     * Señal interna de que el ai-svc respondió con un código de error. Se captura
     * en el mismo {@code proxy(...)} que la lanza; nunca sale de esta clase.
     */
    private static class AiUpstreamException extends RuntimeException {
        AiUpstreamException(String message) {
            super(message);
        }
    }

    public Map<String, Object> resumenStats(Map<String, Object> payload) {
        return proxy("POST", "/insights/stats-summary", payload);
    }

    public Map<String, Object> explainRecomendacion(Map<String, Object> payload) {
        return proxy("POST", "/insights/explain-recomendacion", payload);
    }

    public Map<String, Object> analyzeForecast(Map<String, Object> payload) {
        return proxy("POST", "/insights/analyze-forecast", payload);
    }

    public Map<String, Object> analyzeInventarioForecast(Map<String, Object> payload) {
        return proxy("POST", "/insights/analyze-inventario-forecast", payload);
    }

    public Map<String, Object> analyzeAsistencia(Map<String, Object> payload) {
        return proxy("POST", "/insights/analyze-asistencia", payload);
    }

    public Map<String, Object> semanticSearch(String query, int top) {
        return proxy("GET", "/search/espacios?q=" + java.net.URLEncoder.encode(
                query, java.nio.charset.StandardCharsets.UTF_8) + "&top=" + top, null);
    }

    public Map<String, Object> reindexEspacios() {
        return proxy("POST", "/admin/reindex-espacios", null);
    }

    public Map<String, Object> chat(Map<String, Object> payload) {
        return proxy("POST", "/chat", payload);
    }

    public Map<String, Object> generarEvento(Map<String, Object> payload) {
        return proxy("POST", "/insights/generar-evento", payload);
    }

    public Map<String, Object> resumenTemario(Map<String, Object> payload) {
        return proxy("POST", "/insights/resumen-temario", payload);
    }
}
