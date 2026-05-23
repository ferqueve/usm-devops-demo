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
 * Health del servicio Python ai-svc (capa de IA generativa).
 * Aparece bajo /actuator/health → components → aiService.
 */
@Component("aiSvc")
@Slf4j
public class AiServiceHealthIndicator implements HealthIndicator {

    private static final HttpClient HTTP = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(2))
            .build();

    @Value("${app.ai-service-url:http://localhost:8001}")
    private String aiServiceUrl;

    @Override
    public Health health() {
        try {
            HttpRequest req = HttpRequest.newBuilder()
                    .uri(URI.create(aiServiceUrl + "/health"))
                    .timeout(Duration.ofSeconds(3))
                    .GET()
                    .build();
            HttpResponse<String> resp = HTTP.send(req, HttpResponse.BodyHandlers.ofString());
            if (resp.statusCode() == 200) {
                return Health.up()
                        .withDetail("url", aiServiceUrl)
                        .withDetail("statusCode", resp.statusCode())
                        .build();
            }
            return Health.down()
                    .withDetail("url", aiServiceUrl)
                    .withDetail("statusCode", resp.statusCode())
                    .build();
        } catch (Exception e) {
            log.debug("ai-svc health check falló: {}", e.getMessage());
            return Health.down()
                    .withDetail("url", aiServiceUrl)
                    .withDetail("error", e.getMessage())
                    .build();
        }
    }
}
