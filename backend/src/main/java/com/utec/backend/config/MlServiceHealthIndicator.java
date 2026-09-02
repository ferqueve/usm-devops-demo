package com.utec.backend.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.actuate.health.Health;
import org.springframework.boot.actuate.health.HealthIndicator;
import org.springframework.stereotype.Component;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;

/**
 * Health del servicio Python ml-svc (Forecasting con Prophet).
 * Aparece bajo /actuator/health → components → mlService.
 */
@Component("mlSvc")
@Slf4j
public class MlServiceHealthIndicator implements HealthIndicator {

    private static final HttpClient HTTP = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(2))
            .build();

    @Value("${app.ml-service-url:http://localhost:8000}")
    private String mlServiceUrl;

    @Override
    public Health health() {
        try {
            HttpRequest req = HttpRequest.newBuilder()
                    .uri(URI.create(mlServiceUrl + "/health"))
                    .timeout(Duration.ofSeconds(3))
                    .GET()
                    .build();
            HttpResponse<String> resp = HTTP.send(req, HttpResponse.BodyHandlers.ofString());
            if (resp.statusCode() == 200) {
                return Health.up()
                        .withDetail("url", mlServiceUrl)
                        .withDetail("statusCode", resp.statusCode())
                        .build();
            }
            return Health.down()
                    .withDetail("url", mlServiceUrl)
                    .withDetail("statusCode", resp.statusCode())
                    .build();
        } catch (Exception e) {
            // HttpClient.send lanza InterruptedException: si la tragamos sin
            // re-interrumpir, el hilo pierde la señal de cancelación.
            if (e instanceof InterruptedException) {
                Thread.currentThread().interrupt();
            }
            log.debug("ml-svc health check falló: {}", e.getMessage());
            return Health.down()
                    .withDetail("url", mlServiceUrl)
                    // getMessage() puede ser null (p. ej. ConnectException). withDetail no
                    // acepta null: tiraba IllegalArgumentException y hacia fallar
                    // /actuator/health entero, no solo este componente.
                    .withDetail("error", descripcionDe(e))
                    .build();
        }
    }

    /** Descripción no nula del error, para que withDetail nunca reciba null. */
    private static String descripcionDe(Exception e) {
        String msg = e.getMessage();
        return (msg != null && !msg.isBlank()) ? msg : e.getClass().getSimpleName();
    }
}
