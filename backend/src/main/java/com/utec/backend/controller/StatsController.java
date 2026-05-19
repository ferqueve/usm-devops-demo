package com.utec.backend.controller;

import com.utec.backend.common.ApiResponse;
import com.utec.backend.dto.stats.ActiveUsersStatsDTO;
import com.utec.backend.service.EstadisticasInventarioService;
import com.utec.backend.service.EstadisticasReservaService;
import com.utec.backend.service.EstadisticasScheduledService;
import com.utec.backend.service.ForecastingService;
import com.utec.backend.service.StatisticsService;
import com.utec.backend.service.UserActivityTrackingService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.List;
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
    private final EstadisticasScheduledService estadisticasScheduledService;
    private final EstadisticasReservaService estadisticasReservaService;
    private final EstadisticasInventarioService estadisticasInventarioService;
    private final ForecastingService forecastingService;

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

    /**
     * Backfill manual de las tablas de hechos. Pensado para correr una vez tras
     * un deploy nuevo o para recomputar un rango histórico si se detecta drift.
     */
    @Operation(summary = "Backfill de tablas de hechos analíticas",
               description = "Recomputa hechos_reserva_diario y/o hechos_inventario_diario en un rango. Solo ADMIN.")
    @PostMapping("/admin/backfill")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> backfillHechos(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate desde,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate hasta,
            @RequestParam(defaultValue = "true") boolean reservas,
            @RequestParam(defaultValue = "true") boolean inventario) {
        log.info("Backfill solicitado: desde={}, hasta={}, reservas={}, inventario={}",
                desde, hasta, reservas, inventario);
        Map<String, Object> resultado = new LinkedHashMap<>();
        if (reservas) {
            resultado.put("reservasInsertadas", estadisticasScheduledService.backfillReservas(desde, hasta));
        }
        if (inventario) {
            resultado.put("inventarioInsertado", estadisticasScheduledService.backfillInventario(desde, hasta));
        }
        return ResponseEntity.ok(ApiResponse.success(resultado, "Backfill completado"));
    }

    @Operation(summary = "% ocupación por espacio",
               description = "Horas reservadas vs horas disponibles (14h/día) por espacio en un rango.")
    @GetMapping("/reservas/ocupacion")
    @PreAuthorize("hasPermission(null, 'estadisticas:ver_reservas')")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> ocupacionPorEspacio(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate desde,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate hasta) {
        return ResponseEntity.ok(ApiResponse.success(
                estadisticasReservaService.ocupacionPorEspacio(desde, hasta),
                "Ocupación calculada"));
    }

    @Operation(summary = "Heatmap día × hora",
               description = "Conteo de reservas APROBADAS agrupado por día de semana y hora del día.")
    @GetMapping("/reservas/heatmap")
    @PreAuthorize("hasPermission(null, 'estadisticas:ver_reservas')")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> heatmap(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate desde,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate hasta) {
        return ResponseEntity.ok(ApiResponse.success(
                estadisticasReservaService.heatmapDiaHora(desde, hasta),
                "Heatmap calculado"));
    }

    @Operation(summary = "Resumen por carrera",
               description = "Reservas aprobadas, canceladas y tasa de cancelación por carrera.")
    @GetMapping("/reservas/por-carrera")
    @PreAuthorize("hasPermission(null, 'estadisticas:ver_reservas')")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> porCarrera(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate desde,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate hasta) {
        return ResponseEntity.ok(ApiResponse.success(
                estadisticasReservaService.resumenPorCarrera(desde, hasta),
                "Resumen por carrera"));
    }

    @Operation(summary = "Resumen por edificio")
    @GetMapping("/reservas/por-edificio")
    @PreAuthorize("hasPermission(null, 'estadisticas:ver_reservas')")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> porEdificio(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate desde,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate hasta) {
        return ResponseEntity.ok(ApiResponse.success(
                estadisticasReservaService.resumenPorEdificio(desde, hasta),
                "Resumen por edificio"));
    }

    @Operation(summary = "Top usuarios reservadores")
    @GetMapping("/reservas/top-usuarios")
    @PreAuthorize("hasPermission(null, 'estadisticas:ver_reservas')")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> topUsuarios(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate desde,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate hasta,
            @RequestParam(required = false) Integer limite) {
        return ResponseEntity.ok(ApiResponse.success(
                estadisticasReservaService.topUsuarios(desde, hasta, limite),
                "Top usuarios calculado"));
    }

    @Operation(summary = "Evolución del estado del inventario",
               description = "Serie temporal: para cada fecha del rango, cantidad de items por estado.")
    @GetMapping("/inventario/evolucion-estado")
    @PreAuthorize("hasPermission(null, 'estadisticas:ver_inventario')")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> evolucionEstadoInventario(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate desde,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate hasta) {
        return ResponseEntity.ok(ApiResponse.success(
                estadisticasInventarioService.evolucionEstado(desde, hasta),
                "Evolución del estado calculada"));
    }

    @Operation(summary = "Evolución del parque de inventario",
               description = "Serie temporal: items y unidades totales por fecha.")
    @GetMapping("/inventario/evolucion-parque")
    @PreAuthorize("hasPermission(null, 'estadisticas:ver_inventario')")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> evolucionParqueInventario(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate desde,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate hasta) {
        return ResponseEntity.ok(ApiResponse.success(
                estadisticasInventarioService.evolucionParque(desde, hasta),
                "Evolución del parque calculada"));
    }

    @Operation(summary = "Delta entre dos snapshots de inventario",
               description = "Compara los snapshots de dos fechas y devuelve el cambio por espacio.")
    @GetMapping("/inventario/delta")
    @PreAuthorize("hasPermission(null, 'estadisticas:ver_inventario')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> deltaInventario(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaInicio,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaFin) {
        return ResponseEntity.ok(ApiResponse.success(
                estadisticasInventarioService.delta(fechaInicio, fechaFin),
                "Delta calculado"));
    }

    @Operation(summary = "Matriz cruzada espacio × tipo de elemento",
               description = "Estado actual del inventario activo agrupado por espacio y tipo.")
    @GetMapping("/inventario/matriz-espacio-tipo")
    @PreAuthorize("hasPermission(null, 'estadisticas:ver_inventario')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> matrizEspacioTipo() {
        return ResponseEntity.ok(ApiResponse.success(
                estadisticasInventarioService.matrizEspacioTipo(),
                "Matriz calculada"));
    }

    @Operation(summary = "Forecast de demanda global",
               description = "Predicción de cantidad diaria de reservas aprobadas, con banda de confianza, generada por el servicio ML.")
    @GetMapping("/ml/forecast")
    @PreAuthorize("hasPermission(null, 'estadisticas:ver_reservas')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> forecastDemanda(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate desde,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate hasta,
            @RequestParam(required = false) Integer diasHistorico) {
        return ResponseEntity.ok(ApiResponse.success(
                forecastingService.forecastGlobal(desde, hasta, diasHistorico),
                "Forecast leído desde la capa ML"));
    }

    @Operation(summary = "Calidad del modelo ML activo",
               description = "Metadatos y métricas del último modelo entrenado (MAPE, MAE, fecha, tamaño).")
    @GetMapping("/ml/calidad-modelo")
    @PreAuthorize("hasPermission(null, 'estadisticas:ver_reservas')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> calidadModelo() {
        return ResponseEntity.ok(ApiResponse.success(
                forecastingService.calidadModeloGlobal(),
                "Calidad del modelo"));
    }

    @Operation(summary = "Disparar reentrenamiento manual del modelo ML",
               description = "Proxy a ml-svc/train. Solo ADMIN. Operación bloqueante.")
    @PostMapping("/ml/reentrenar")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> reentrenar() {
        return ResponseEntity.ok(ApiResponse.success(
                forecastingService.reentrenarGlobal(),
                "Reentrenamiento solicitado"));
    }
}
