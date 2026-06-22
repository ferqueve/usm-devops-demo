package com.utec.backend.controller;

import com.utec.backend.common.ApiResponse;
import com.utec.backend.dto.sostenibilidad.SostenibilidadStatsDto;
import com.utec.backend.service.SostenibilidadService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Endpoints del dashboard de sostenibilidad (métricas derivadas).
 */
@Tag(name = "Sostenibilidad", description = "Métricas derivadas de ahorro ambiental por digitalización de recursos")
@RestController
@RequestMapping("/api/v1/stats")
@RequiredArgsConstructor
@Slf4j
public class SostenibilidadController {

    private final SostenibilidadService sostenibilidadService;

    @Operation(summary = "KPIs de sostenibilidad",
               description = "Hojas, papel, CO2 y agua ahorrados estimados a partir de los recursos digitales.")
    @GetMapping("/sostenibilidad")
    @PreAuthorize("hasPermission(null, 'sostenibilidad:ver')")
    public ResponseEntity<ApiResponse<SostenibilidadStatsDto>> getStats() {
        try {
            SostenibilidadStatsDto stats = sostenibilidadService.getStats();
            return ResponseEntity.ok(ApiResponse.success(stats, "Estadísticas de sostenibilidad obtenidas exitosamente"));
        } catch (Exception e) {
            log.error("Error al obtener estadísticas de sostenibilidad", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Error al obtener estadísticas de sostenibilidad: " + e.getMessage()));
        }
    }
}
