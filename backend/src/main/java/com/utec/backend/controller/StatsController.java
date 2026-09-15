package com.utec.backend.controller;

import com.utec.backend.common.ApiResponse;
import com.utec.backend.dto.stats.AcademicoDto;
import com.utec.backend.dto.stats.AprobacionReservasDto;
import com.utec.backend.dto.stats.EquiposReservasDto;
import com.utec.backend.dto.stats.EstadoInventarioDto;
import com.utec.backend.dto.stats.ExternosDto;
import com.utec.backend.dto.stats.FiltroInventario;
import com.utec.backend.dto.stats.FiltroReservas;
import com.utec.backend.dto.stats.NovedadDto;
import com.utec.backend.dto.stats.OpcionesFiltroDto;
import com.utec.backend.dto.stats.PrediccionAcademicoDto;
import com.utec.backend.dto.stats.PrediccionInventarioDto;
import com.utec.backend.dto.stats.PrediccionTiposEspacioDto;
import com.utec.backend.dto.stats.ResumenReservasDto;
import com.utec.backend.dto.stats.UsoEspaciosDto;
import com.utec.backend.dto.stats.ActiveUsersStatsDTO;
import com.utec.backend.service.EstadisticasAcademicoService;
import com.utec.backend.service.EstadisticasInventarioService;
import com.utec.backend.service.EstadisticasReservaService;
import com.utec.backend.service.EstadisticasScheduledService;
import com.utec.backend.service.EstadisticasUsoService;
import com.utec.backend.service.ForecastingService;
import com.utec.backend.service.EstadoInventarioService;
import com.utec.backend.service.PrediccionAcademicoService;
import com.utec.backend.service.PrediccionInventarioService;
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
    private final EstadoInventarioService estadoInventarioService;
    private final EstadisticasScheduledService estadisticasScheduledService;
    private final EstadisticasReservaService estadisticasReservaService;
    private final EstadisticasUsoService estadisticasUsoService;
    private final EstadisticasAcademicoService estadisticasAcademicoService;
    private final EstadisticasInventarioService estadisticasInventarioService;
    private final ForecastingService forecastingService;
    private final PrediccionInventarioService prediccionInventarioService;
    private final PrediccionAcademicoService prediccionAcademicoService;

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

    @Operation(summary = "Estado actual del inventario",
               description = "Totales, por tipo, por espacio, matriz, items que requieren atención y antigüedad. "
                       + "Los filtros aplican a todo por igual.")
    @GetMapping("/inventario/estado")
    @PreAuthorize("hasPermission(null, 'estadisticas:ver_inventario')")
    public ResponseEntity<ApiResponse<EstadoInventarioDto>> estadoInventario(
            @RequestParam(required = false) Long espacioId,
            @RequestParam(required = false) Long tipoElementoId,
            @RequestParam(required = false) Long edificioId) {
        return ResponseEntity.ok(ApiResponse.success(
                estadoInventarioService.estado(espacioId, tipoElementoId, edificioId),
                "Estado del inventario"));
    }

    @Operation(summary = "Altas de inventario en un período", description = "Items dados de alta, por tipo.")
    @GetMapping("/inventario/altas")
    @PreAuthorize("hasPermission(null, 'estadisticas:ver_inventario')")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> altasInventario(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate desde,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate hasta) {
        return ResponseEntity.ok(ApiResponse.success(estadoInventarioService.altas(desde, hasta), "Altas calculadas"));
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

    // Todos los endpoints de reservas aceptan los filtros de
    // FiltroReservas como query params opcionales (edificioId, espacioId,
    // tipoEspacioId, rol, carreraId); Spring los arma solo a partir del record.
    // El académico y la demanda de inventario declaran sólo los que les aplican.

    @Operation(summary = "Resumen de reservas de un período",
               description = "Totales, período de comparación (anterior o mismo del año pasado) y serie por estado. "
                       + "Lee la tabla transaccional.")
    @GetMapping("/reservas/resumen")
    @PreAuthorize("hasPermission(null, 'estadisticas:ver_reservas')")
    public ResponseEntity<ApiResponse<ResumenReservasDto>> resumenReservas(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate desde,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate hasta,
            @RequestParam(defaultValue = "anterior") String comparar,
            FiltroReservas filtro) {
        return ResponseEntity.ok(ApiResponse.success(
                estadisticasReservaService.resumen(desde, hasta, filtro, comparar),
                "Resumen calculado"));
    }

    @Operation(summary = "% ocupación por espacio",
               description = "Horas aprobadas vs horas disponibles (14h/día) por espacio, hasta hoy inclusive.")
    @GetMapping("/reservas/ocupacion")
    @PreAuthorize("hasPermission(null, 'estadisticas:ver_reservas')")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> ocupacionPorEspacio(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate desde,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate hasta,
            FiltroReservas filtro) {
        return ResponseEntity.ok(ApiResponse.success(
                estadisticasReservaService.ocupacionPorEspacio(desde, hasta, filtro),
                "Ocupación calculada"));
    }

    @Operation(summary = "Heatmap día × hora",
               description = "Conteo de reservas APROBADAS agrupado por día de semana y hora del día.")
    @GetMapping("/reservas/heatmap")
    @PreAuthorize("hasPermission(null, 'estadisticas:ver_reservas')")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> heatmap(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate desde,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate hasta,
            FiltroReservas filtro) {
        return ResponseEntity.ok(ApiResponse.success(
                estadisticasReservaService.heatmapDiaHora(desde, hasta, filtro),
                "Heatmap calculado"));
    }

    @Operation(summary = "Resumen por carrera",
               description = "Reservas aprobadas, canceladas y tasa de cancelación por carrera.")
    @GetMapping("/reservas/por-carrera")
    @PreAuthorize("hasPermission(null, 'estadisticas:ver_reservas')")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> porCarrera(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate desde,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate hasta,
            FiltroReservas filtro) {
        return ResponseEntity.ok(ApiResponse.success(
                estadisticasReservaService.resumenPorCarrera(desde, hasta, filtro),
                "Resumen por carrera"));
    }

    @Operation(summary = "Resumen por edificio")
    @GetMapping("/reservas/por-edificio")
    @PreAuthorize("hasPermission(null, 'estadisticas:ver_reservas')")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> porEdificio(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate desde,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate hasta,
            FiltroReservas filtro) {
        return ResponseEntity.ok(ApiResponse.success(
                estadisticasReservaService.resumenPorEdificio(desde, hasta, filtro),
                "Resumen por edificio"));
    }

    @Operation(summary = "Top usuarios reservadores")
    @GetMapping("/reservas/top-usuarios")
    @PreAuthorize("hasPermission(null, 'estadisticas:ver_reservas')")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> topUsuarios(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate desde,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate hasta,
            @RequestParam(required = false) Integer limite,
            FiltroReservas filtro) {
        return ResponseEntity.ok(ApiResponse.success(
                estadisticasReservaService.topUsuarios(desde, hasta, filtro, limite),
                "Top usuarios calculado"));
    }

    @Operation(summary = "Opciones de los filtros de reservas",
               description = "Edificios, espacios, tipos de espacio, roles y carreras activos, por nombre.")
    @GetMapping("/reservas/opciones")
    @PreAuthorize("hasPermission(null, 'estadisticas:ver_reservas')")
    public ResponseEntity<ApiResponse<OpcionesFiltroDto>> opcionesReservas() {
        return ResponseEntity.ok(ApiResponse.success(estadisticasReservaService.opciones(), "Opciones de filtros"));
    }

    @Operation(summary = "Gestión de solicitudes",
               description = "Tiempo de respuesta, carga por analista, antelación y pendientes por antigüedad.")
    @GetMapping("/reservas/aprobacion")
    @PreAuthorize("hasPermission(null, 'estadisticas:ver_reservas')")
    public ResponseEntity<ApiResponse<AprobacionReservasDto>> aprobacionReservas(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate desde,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate hasta,
            FiltroReservas filtro) {
        return ResponseEntity.ok(ApiResponse.success(
                estadisticasReservaService.aprobacion(desde, hasta, filtro), "Aprobación calculada"));
    }

    @Operation(summary = "Uso de espacios",
               description = "Ocupación y aforo por espacio, saturación por tipo y hora, y capacidad de sesiones.")
    @GetMapping("/reservas/espacios")
    @PreAuthorize("hasPermission(null, 'estadisticas:ver_reservas')")
    public ResponseEntity<ApiResponse<UsoEspaciosDto>> usoEspacios(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate desde,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate hasta,
            FiltroReservas filtro) {
        return ResponseEntity.ok(ApiResponse.success(
                estadisticasUsoService.espacios(desde, hasta, filtro), "Uso de espacios calculado"));
    }

    @Operation(summary = "Eventos externos del período",
               description = "Total de eventos externos y top 10 de organizadores, con horas y espacios usados.")
    @GetMapping("/reservas/externos")
    @PreAuthorize("hasPermission(null, 'estadisticas:ver_reservas')")
    public ResponseEntity<ApiResponse<ExternosDto>> externosReservas(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate desde,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate hasta,
            FiltroReservas filtro) {
        return ResponseEntity.ok(ApiResponse.success(
                estadisticasReservaService.externos(desde, hasta, filtro), "Eventos externos calculados"));
    }

    @Operation(summary = "Novedades del período",
               description = "Hasta 6 cambios llamativos contra el período de comparación, con los mismos filtros.")
    @GetMapping("/reservas/novedades")
    @PreAuthorize("hasPermission(null, 'estadisticas:ver_reservas')")
    public ResponseEntity<ApiResponse<List<NovedadDto>>> novedadesReservas(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate desde,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate hasta,
            @RequestParam(defaultValue = "anterior") String comparar,
            FiltroReservas filtro) {
        return ResponseEntity.ok(ApiResponse.success(
                estadisticasReservaService.novedades(desde, hasta, filtro, comparar), "Novedades calculadas"));
    }

    @Operation(summary = "Estadísticas académicas",
               description = "Tutorías y eventos del período. Filtra por espacio y carrera; el rol no aplica.")
    @GetMapping("/academico")
    @PreAuthorize("hasPermission(null, 'estadisticas:ver_reservas')")
    public ResponseEntity<ApiResponse<AcademicoDto>> academico(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate desde,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate hasta,
            @RequestParam(required = false) Long edificioId,
            @RequestParam(required = false) Long espacioId,
            @RequestParam(required = false) Long tipoEspacioId,
            @RequestParam(required = false) Long carreraId) {
        FiltroReservas filtro = new FiltroReservas(edificioId, espacioId, tipoEspacioId, null, carreraId);
        return ResponseEntity.ok(ApiResponse.success(
                estadisticasAcademicoService.academico(desde, hasta, filtro), "Estadísticas académicas"));
    }

    @Operation(summary = "Demanda de inventario",
               description = "Equipamiento pedido con las reservas del período por tipo, contra el inventario "
                       + "disponible, y espacios con items con problemas. Mismos filtros que /inventario/estado.")
    @GetMapping("/inventario/demanda")
    @PreAuthorize("hasPermission(null, 'estadisticas:ver_inventario')")
    public ResponseEntity<ApiResponse<EquiposReservasDto>> demandaInventario(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate desde,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate hasta,
            @RequestParam(required = false) Long edificioId,
            @RequestParam(required = false) Long espacioId,
            @RequestParam(required = false) Long tipoElementoId) {
        return ResponseEntity.ok(ApiResponse.success(
                estadisticasUsoService.demandaInventario(desde, hasta,
                        new FiltroInventario(edificioId, espacioId, tipoElementoId)),
                "Demanda de inventario calculada"));
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

    // Predicciones: lo que entrena ml-svc, leído de la base compartida. Todo
    // con el permiso de ver reservas, como el forecast original; reentrenar
    // sigue siendo sólo ADMIN porque ocupa el servicio ML por minutos.

    @Operation(summary = "Forecast de demanda de reservas",
               description = "Predicción de cantidad diaria de reservas aprobadas, con banda de confianza, generada "
                       + "por el servicio ML. Con tipoEspacioId, la del modelo de ese tipo de espacio.")
    @GetMapping("/ml/forecast")
    @PreAuthorize("hasPermission(null, 'estadisticas:ver_reservas')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> forecastDemanda(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate desde,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate hasta,
            @RequestParam(required = false) Integer diasHistorico,
            @RequestParam(required = false) Long tipoEspacioId) {
        return ResponseEntity.ok(ApiResponse.success(
                forecastingService.forecast(desde, hasta, diasHistorico, tipoEspacioId),
                "Forecast leído desde la capa ML"));
    }

    @Operation(summary = "Calidad del modelo ML activo",
               description = "Metadatos y métricas del último modelo entrenado (WAPE, MAPE, MAE, fecha, tamaño). "
                       + "Con tipoEspacioId, la del modelo de ese tipo de espacio.")
    @GetMapping("/ml/calidad-modelo")
    @PreAuthorize("hasPermission(null, 'estadisticas:ver_reservas')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> calidadModelo(
            @RequestParam(required = false) Long tipoEspacioId) {
        return ResponseEntity.ok(ApiResponse.success(
                forecastingService.calidadModelo(tipoEspacioId),
                "Calidad del modelo"));
    }

    @Operation(summary = "Demanda esperada por tipo de espacio",
               description = "Por tipo: próximos 7 y 30 días, cambio contra los últimos 30, pico y serie diaria "
                       + "con las reservas ya aprobadas.")
    @GetMapping("/ml/tipos-espacio")
    @PreAuthorize("hasPermission(null, 'estadisticas:ver_reservas')")
    public ResponseEntity<ApiResponse<PrediccionTiposEspacioDto>> prediccionTiposEspacio() {
        return ResponseEntity.ok(ApiResponse.success(
                forecastingService.tiposEspacio(), "Demanda por tipo de espacio"));
    }

    @Operation(summary = "Riesgo de faltante de equipamiento",
               description = "Pico diario esperado de unidades simultáneas por tipo de elemento contra el stock "
                       + "disponible de hoy, con la probabilidad de quedarse corto.")
    @GetMapping("/ml/inventario")
    @PreAuthorize("hasPermission(null, 'estadisticas:ver_reservas')")
    public ResponseEntity<ApiResponse<PrediccionInventarioDto>> prediccionInventario() {
        return ResponseEntity.ok(ApiResponse.success(
                prediccionInventarioService.inventario(), "Predicción de inventario"));
    }

    @Operation(summary = "Asistencia esperada a las próximas tutorías",
               description = "Probabilidad de asistencia por inscripción, asistencia esperada por tutoría con banda "
                       + "del 80% y calidad del modelo.")
    @GetMapping("/ml/academico")
    @PreAuthorize("hasPermission(null, 'estadisticas:ver_reservas')")
    public ResponseEntity<ApiResponse<PrediccionAcademicoDto>> prediccionAcademico() {
        return ResponseEntity.ok(ApiResponse.success(
                prediccionAcademicoService.academico(), "Predicción académica"));
    }

    @Operation(summary = "Disparar reentrenamiento de un modelo ML",
               description = "Proxy a ml-svc: reservas (/train, default), inventario, academico o todo. "
                       + "Solo ADMIN. Operación bloqueante: todo puede tardar minutos.")
    @PostMapping("/ml/reentrenar")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> reentrenar(
            @RequestParam(defaultValue = "reservas") String modelo) {
        return ResponseEntity.ok(ApiResponse.success(
                forecastingService.reentrenar(modelo),
                "Reentrenamiento solicitado"));
    }
}
