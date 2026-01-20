package com.utec.backend.controller;

import com.utec.backend.common.ApiResponse;
import com.utec.backend.dto.stats.ActiveUsersStatsDTO;
import com.utec.backend.service.StatisticsService;
import com.utec.backend.service.UserActivityTrackingService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * Controller para estadísticas del sistema
 */
@Tag(name = "Estadísticas", description = "Endpoints para obtener estadísticas del sistema")
@RestController
@RequestMapping("/api/v1/stats")
@RequiredArgsConstructor
@Slf4j
public class StatsController {

    private final UserActivityTrackingService activityTrackingService;
    private final StatisticsService statisticsService;

    /**
     * Obtiene usuarios activos (solo ADMIN)
     */
    @Operation(summary = "Obtener usuarios activos", description = "Obtener lista de usuarios actualmente conectados (solo ADMIN)")
    @GetMapping("/active-users")
    @PreAuthorize("hasPermission(null, 'sistema:acceder')")
    public ResponseEntity<ActiveUsersStatsDTO> getActiveUsers() {
        log.info("Solicitando estadísticas de usuarios activos");
        ActiveUsersStatsDTO stats = activityTrackingService.getActiveUsers();
        return ResponseEntity.ok(stats);
    }

    /**
     * Obtiene estadísticas detalladas de inventario
     */
    @Operation(summary = "Obtener estadísticas detalladas de inventario",
               description = "Obtiene todas las estadísticas posibles del inventario con filtros opcionales")
    @GetMapping("/inventario/detailed")
    @PreAuthorize("hasPermission(null, 'estadisticas:ver_inventario')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getDetailedInventarioStats(
            @RequestParam(required = false) Long espacioId,
            @RequestParam(required = false) Long tipoElementoId,
            @RequestParam(required = false) String estado) {
        try {
            log.info("Solicitando estadísticas detalladas de inventario - espacioId: {}, tipoElementoId: {}, estado: {}",
                    espacioId, tipoElementoId, estado);
            Map<String, Object> stats = statisticsService.getDetailedInventarioStatistics(espacioId, tipoElementoId, estado);
            return ResponseEntity.ok(ApiResponse.success(stats, "Estadísticas detalladas obtenidas exitosamente"));
        } catch (Exception e) {
            log.error("Error al obtener estadísticas detalladas de inventario", e);
            return ResponseEntity.status(500)
                    .body(ApiResponse.error("Error al obtener estadísticas: " + e.getMessage()));
        }
    }
}
