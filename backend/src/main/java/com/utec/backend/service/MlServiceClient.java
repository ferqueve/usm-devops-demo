package com.utec.backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestClientResponseException;

import java.net.http.HttpClient;
import java.time.Duration;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Cliente HTTP de ml-svc para disparar entrenamientos.
 *
 * Los timeouts son explícitos porque los defaults no sirven para esto: sin
 * timeout de lectura un ml-svc colgado deja un hilo del backend esperando
 * para siempre, y con uno corto se cortaría /train/todo, que entrena Prophet
 * por cada tipo de espacio más los modelos de inventario y académico y tarda
 * de uno a tres minutos.
 */
@Component
@Slf4j
public class MlServiceClient {

    private static final ObjectMapper MAPPER = new ObjectMapper();

    private final RestClient client;
    private final String baseUrl;

    public MlServiceClient(
            @Value("${app.ml-service-url:http://localhost:8000}") String baseUrl,
            @Value("${app.ml-service-connect-timeout-segundos:5}") int connectTimeoutSegundos,
            @Value("${app.ml-service-read-timeout-segundos:300}") int readTimeoutSegundos) {
        this.baseUrl = baseUrl;
        // HTTP/1.1 fijo: el upgrade a HTTP/2 que intenta el cliente de Java no
        // lo maneja bien Uvicorn (mismo motivo que en AiService).
        HttpClient http = HttpClient.newBuilder()
                .version(HttpClient.Version.HTTP_1_1)
                .connectTimeout(Duration.ofSeconds(connectTimeoutSegundos))
                .build();
        JdkClientHttpRequestFactory fabrica = new JdkClientHttpRequestFactory(http);
        fabrica.setReadTimeout(Duration.ofSeconds(readTimeoutSegundos));
        this.client = RestClient.builder().baseUrl(baseUrl).requestFactory(fabrica).build();
    }

    /**
     * POST sin cuerpo a {@code path}. Nunca lanza: si ml-svc no responde o
     * contesta con error, devuelve {@code status=error} con el motivo, como
     * hacía el proxy de siempre, para que la pantalla pueda mostrarlo.
     */
    public Map<String, Object> post(String path) {
        log.info("Disparando {} en ml-svc ({})", path, baseUrl);
        try {
            Map<String, Object> body = client.post()
                    .uri(path)
                    .retrieve()
                    .body(new ParameterizedTypeReference<Map<String, Object>>() {});
            log.info("ml-svc {} respondió: {}", path, body);
            return body == null ? Map.of() : body;
        } catch (RestClientResponseException ex) {
            // 422 = ml-svc no tiene datos suficientes: el detalle es para el usuario.
            String detalle = detalleFastApi(ex.getResponseBodyAsString());
            log.warn("ml-svc {} respondió {}: {}", path, ex.getStatusCode().value(), detalle);
            return error(path, "El servicio ML respondió " + ex.getStatusCode().value() + ": " + detalle);
        } catch (RestClientException ex) {
            String motivo = ex.getMessage() != null && !ex.getMessage().isBlank()
                    ? ex.getMessage() : ex.getClass().getSimpleName();
            log.error("Fallo al contactar ml-svc en {}: {}", path, motivo);
            return error(path, "No se pudo contactar al servicio ML: " + motivo);
        }
    }

    private Map<String, Object> error(String path, String mensaje) {
        Map<String, Object> err = new LinkedHashMap<>();
        err.put("status", "error");
        err.put("error", mensaje);
        err.put("mlServiceUrl", baseUrl);
        err.put("path", path);
        return err;
    }

    /** FastAPI manda {"detail": "..."}; si no es eso, el cuerpo tal cual. */
    private static String detalleFastApi(String cuerpo) {
        if (cuerpo == null || cuerpo.isBlank()) {
            return "sin detalle";
        }
        try {
            JsonNode detalle = MAPPER.readTree(cuerpo).get("detail");
            if (detalle != null) {
                return detalle.isTextual() ? detalle.asText() : detalle.toString();
            }
        } catch (Exception ignorada) {
            // No era JSON: se devuelve el texto crudo.
        }
        return cuerpo;
    }
}
