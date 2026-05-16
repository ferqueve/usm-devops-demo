package com.utec.backend.controller;

import com.utec.backend.common.ApiResponse;
import com.utec.backend.util.TrafficSeedService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Profile;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * Endpoints utilitarios disponibles únicamente en perfil dev.
 * Sirven para sembrar tráfico realista contra el sistema sin tocar la lógica
 * de negocio principal.
 */
@RestController
@RequestMapping("/api/v1/dev")
@Profile("dev")
@RequiredArgsConstructor
@Slf4j
public class DevSeedController {

    private final TrafficSeedService trafficSeedService;

    /**
     * Genera un lote grande de reservas + items + usuarios, repartido en
     * buckets temporales relativos al instante de la invocación.
     *
     * @param multiplier multiplicador opcional sobre las cantidades base
     *                   (default 1.0 ≈ 10k reservas).
     */
    @PostMapping("/seed-traffic")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> seedTraffic(
            @RequestParam(name = "multiplier", required = false, defaultValue = "1.0") double multiplier) {
        if (multiplier <= 0 || multiplier > 5.0) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error("multiplier debe estar entre (0, 5]"));
        }
        log.info("Generando tráfico de seed con multiplicador {}", multiplier);
        Map<String, Object> summary = trafficSeedService.generarTrafico(multiplier);
        return ResponseEntity.ok(ApiResponse.success(summary, "Tráfico generado"));
    }
}
