package com.utec.backend.controller;

import com.utec.backend.dto.stats.ActiveUsersStatsDTO;
import com.utec.backend.service.UserActivityTrackingService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

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

    /**
     * Obtiene usuarios activos (solo ADMIN)
     */
    @Operation(summary = "Obtener usuarios activos", description = "Obtener lista de usuarios actualmente conectados (solo ADMIN)")
    @GetMapping("/active-users")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ActiveUsersStatsDTO> getActiveUsers() {
        log.info("Solicitando estadísticas de usuarios activos");
        ActiveUsersStatsDTO stats = activityTrackingService.getActiveUsers();
        return ResponseEntity.ok(stats);
    }
}

