package com.utec.backend.controller;

import com.utec.backend.common.ApiResponse;
import com.utec.backend.dto.common.PagedResponseDto;
import com.utec.backend.dto.reserva.ReservaCreateDto;
import com.utec.backend.dto.reserva.ReservaFilters;
import com.utec.backend.dto.reserva.ReservaResponseDto;
import com.utec.backend.dto.reserva.ReservaStatsDto;
import com.utec.backend.service.ReservaService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;
import java.util.Map;

import static com.utec.backend.security.Constants.*;

@RestController
@RequestMapping("/api/v1/reservas")
@RequiredArgsConstructor
public class ReservaController {

    private static final String ROLE_PREFIX = "ROLE_";
    private static final String MSG_RESERVAS_OBTENIDAS = "Reservas obtenidas exitosamente";
    private static final String MSG_ERROR_OBTENER_RESERVAS = "Error al obtener reservas: ";

    private final ReservaService reservaService;

    /**
     * Crear una nueva reserva
     * Admin y Analista: crean reservas auto-aprobadas (APROBADO)
     * Docente y Externo: crean solicitudes pendientes (PENDIENTE)
     * Externo: crea reservas públicas automáticamente
     */
    @PostMapping
    @PreAuthorize("hasPermission(null, 'reserva:crear')")
    public ResponseEntity<ApiResponse<ReservaResponseDto>> createReserva(
            @Valid @RequestBody ReservaCreateDto createDto,
            Authentication authentication) {
        try {
            String userEmail = authentication.getName();
            // Obtener el rol del usuario desde la autenticación
            // Buscar específicamente la authority que empieza con "ROLE_" para evitar confusión con permisos
            String userRole = authentication.getAuthorities().stream()
                    .map(auth -> auth.getAuthority())
                    .filter(auth -> auth.startsWith(ROLE_PREFIX))
                    .findFirst()
                    .map(auth -> auth.replace(ROLE_PREFIX, ""))
                    .orElse("");

            ReservaResponseDto reserva = reservaService.createReserva(createDto, userEmail, userRole);
            String mensaje;
            if (ROLE_DOCENTE.equals(userRole) || ROLE_EXTERNO.equals(userRole)) {
                mensaje = "Solicitud de reserva enviada exitosamente. Esperando aprobación.";
            } else {
                mensaje = "Reserva creada exitosamente";
            }
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ApiResponse.success(reserva, mensaje));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error("Error al crear reserva: " + e.getMessage()));
        }
    }

    /**
     * Obtener todas las reservas del usuario autenticado
     */
    @GetMapping("/mis-reservas")
    @PreAuthorize("hasPermission(null, 'reserva:ver_propias')")
    public ResponseEntity<ApiResponse<List<ReservaResponseDto>>> getMisReservas(
            Authentication authentication) {
        try {
            String userEmail = authentication.getName();
            List<ReservaResponseDto> reservas = reservaService.getReservasByUsuario(userEmail);
            return ResponseEntity.ok(ApiResponse.success(reservas, MSG_RESERVAS_OBTENIDAS));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error(MSG_ERROR_OBTENER_RESERVAS + e.getMessage()));
        }
    }

    /**
     * Obtener reservas del usuario autenticado con paginación y filtros
     */
    @GetMapping("/mis-reservas/paged")
    @PreAuthorize("hasPermission(null, 'reserva:ver_propias')")
    public ResponseEntity<ApiResponse<PagedResponseDto<ReservaResponseDto>>> getMisReservasPaged(
            Authentication authentication,
            @PageableDefault(size = 10, sort = "inicio", direction = Sort.Direction.DESC) Pageable pageable,
            @RequestParam(required = false) String estado,
            @RequestParam(required = false) Long espacioId,
            @RequestParam(required = false) Long carreraId,
            @RequestParam(required = false) Long tipoEspacioId,
            @RequestParam(required = false) Instant fechaInicio,
            @RequestParam(required = false) Instant fechaFin,
            @RequestParam(required = false) String tiempo) {
        try {
            String userEmail = authentication.getName();

            var reservasPage = reservaService.getReservasByUsuarioPaged(
                    userEmail,
                    pageable,
                    ReservaFilters.of(
                            estado, espacioId, carreraId, tipoEspacioId,
                            fechaInicio, fechaFin, tiempo));

            PagedResponseDto<ReservaResponseDto> pagedResponse = PagedResponseDto.of(reservasPage);
            return ResponseEntity.ok(ApiResponse.success(pagedResponse, MSG_RESERVAS_OBTENIDAS));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error(MSG_ERROR_OBTENER_RESERVAS + e.getMessage()));
        }
    }

    /**
     * Obtener una reserva por ID
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasPermission(null, 'reserva:ver_propias')")
    public ResponseEntity<ApiResponse<ReservaResponseDto>> getReservaById(
            @PathVariable Long id,
            Authentication authentication) {
        try {
            String userEmail = authentication.getName();
            ReservaResponseDto reserva = reservaService.getReservaById(id, userEmail);
            return ResponseEntity.ok(ApiResponse.success(reserva, "Reserva obtenida exitosamente"));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Error al obtener reserva: " + e.getMessage()));
        }
    }

    /**
     * Cancelar una reserva
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasPermission(null, 'reserva:cancelar')")
    public ResponseEntity<ApiResponse<Void>> cancelReserva(
            @PathVariable Long id,
            Authentication authentication) {
        try {
            String userEmail = authentication.getName();
            reservaService.cancelReserva(id, userEmail);
            return ResponseEntity.ok(ApiResponse.success(null, "Reserva cancelada exitosamente"));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error("Error al cancelar reserva: " + e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Error al cancelar reserva: " + e.getMessage()));
        }
    }

    /**
     * Obtener reservas de un espacio específico
     * Disponible para todos los autenticados (necesario para ver disponibilidad al crear reservas)
     */
    @GetMapping("/espacio/{espacioId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<List<ReservaResponseDto>>> getReservasByEspacio(
            @PathVariable Long espacioId) {
        try {
            List<ReservaResponseDto> reservas = reservaService.getReservasByEspacio(espacioId);
            return ResponseEntity.ok(ApiResponse.success(reservas, "Reservas del espacio obtenidas exitosamente"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Error al obtener reservas del espacio: " + e.getMessage()));
        }
    }

    /**
     * Obtener todas las reservas del sistema (público, para visualización en calendario)
     * Accesible para todos los roles autenticados
     * Si el usuario es ANALISTA, solo muestra las reservas asignadas a él
     */
    @GetMapping("/todas")
    @PreAuthorize("hasPermission(null, 'reserva:ver_todas')")
    public ResponseEntity<ApiResponse<List<ReservaResponseDto>>> getTodasLasReservas(
            Authentication authentication,
            @RequestParam(required = false) String estado,
            @RequestParam(required = false) Long espacioId,
            @RequestParam(required = false) Long carreraId,
            @RequestParam(required = false) Long tipoEspacioId,
            @RequestParam(required = false) Instant fechaInicio,
            @RequestParam(required = false) Instant fechaFin) {
        try {
            String userEmail = authentication.getName();
            String userRole = authentication.getAuthorities().stream()
                    .map(auth -> auth.getAuthority())
                    .filter(auth -> auth.startsWith(ROLE_PREFIX))
                    .findFirst()
                    .map(auth -> auth.replace(ROLE_PREFIX, ""))
                    .orElse("");

            List<ReservaResponseDto> reservas = reservaService.getTodasLasReservas(
                    ReservaFilters.of(
                            estado, espacioId, carreraId, tipoEspacioId,
                            fechaInicio, fechaFin, null),
                    userEmail, userRole);
            return ResponseEntity.ok(ApiResponse.success(reservas, MSG_RESERVAS_OBTENIDAS));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error(MSG_ERROR_OBTENER_RESERVAS + e.getMessage()));
        }
    }

    /**
     * Obtener estadísticas de reservas
     * DOCENTE: estadísticas personales (solo sus reservas)
     * ANALISTA/ADMIN: estadísticas globales (todas las reservas)
     */
    @GetMapping("/mis-reservas/stats")
    @PreAuthorize("hasPermission(null, 'reserva:ver_propias')")
    public ResponseEntity<ApiResponse<ReservaStatsDto>> getMisReservasStats(
            Authentication authentication) {
        try {
            String userEmail = authentication.getName();
            // Obtener el rol del usuario desde la autenticación
            String userRole = authentication.getAuthorities().stream()
                    .findFirst()
                    .map(auth -> auth.getAuthority().replace(ROLE_PREFIX, ""))
                    .orElse("");

            ReservaStatsDto stats;
            if (ROLE_DOCENTE.equals(userRole)) {
                // DOCENTE: estadísticas personales
                stats = reservaService.obtenerEstadisticasPersonales(userEmail);
            } else {
                // ANALISTA/ADMIN: estadísticas globales
                stats = reservaService.obtenerEstadisticasGlobales();
            }
            return ResponseEntity.ok(ApiResponse.success(stats, "Estadísticas obtenidas exitosamente"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Error al obtener estadísticas: " + e.getMessage()));
        }
    }

    /**
     * Obtener todas las reservas del sistema (para ANALISTA/ADMIN)
     * Sin filtrar por usuario, con paginación y filtros
     * Si el usuario es ANALISTA, solo muestra las reservas asignadas a él
     */
    @GetMapping("/paged")
    @PreAuthorize("hasPermission(null, 'reserva:ver_todas')")
    public ResponseEntity<ApiResponse<PagedResponseDto<ReservaResponseDto>>> getAllReservasPaged(
            Authentication authentication,
            @PageableDefault(size = 10, sort = "inicio", direction = Sort.Direction.DESC) Pageable pageable,
            @RequestParam(required = false) String estado,
            @RequestParam(required = false) Long espacioId,
            @RequestParam(required = false) Long carreraId,
            @RequestParam(required = false) Long tipoEspacioId,
            @RequestParam(required = false) Long usuarioId,
            @RequestParam(required = false) Instant fechaInicio,
            @RequestParam(required = false) Instant fechaFin,
            @RequestParam(required = false) String tiempo) {
        try {
            String userEmail = authentication.getName();
            String userRole = authentication.getAuthorities().stream()
                    .map(auth -> auth.getAuthority())
                    .filter(auth -> auth.startsWith(ROLE_PREFIX))
                    .findFirst()
                    .map(auth -> auth.replace(ROLE_PREFIX, ""))
                    .orElse("");

            var reservasPage = reservaService.getAllReservasPaged(
                    pageable,
                    new ReservaFilters(
                            estado, espacioId, carreraId, tipoEspacioId, usuarioId,
                            fechaInicio, fechaFin, tiempo),
                    userEmail,
                    userRole);

            PagedResponseDto<ReservaResponseDto> pagedResponse = PagedResponseDto.of(reservasPage);
            return ResponseEntity.ok(ApiResponse.success(pagedResponse, MSG_RESERVAS_OBTENIDAS));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error(MSG_ERROR_OBTENER_RESERVAS + e.getMessage()));
        }
    }

    /**
     * Cambiar el estado de una reserva (aprobar/rechazar)
     * Solo disponible para quienes tienen permiso de aprobar
     * Solo permite cambiar de PENDIENTE a APROBADO o CANCELADO
     */
    @PatchMapping("/{id}/estado")
    @PreAuthorize("hasPermission(null, 'reserva:aprobar')")
    public ResponseEntity<ApiResponse<ReservaResponseDto>> cambiarEstadoReserva(
            @PathVariable Long id,
            @RequestBody Map<String, String> requestBody,
            Authentication authentication) {
        try {
            String nuevoEstado = requestBody.get("estado");
            if (nuevoEstado == null || nuevoEstado.isEmpty()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(ApiResponse.error("El campo 'estado' es requerido"));
            }

            String mensajeAnalista = requestBody.get("mensajeAnalista");

            String userEmail = authentication.getName();
            String userRole = authentication.getAuthorities().stream()
                    .map(auth -> auth.getAuthority())
                    .filter(auth -> auth.startsWith(ROLE_PREFIX))
                    .findFirst()
                    .map(auth -> auth.replace(ROLE_PREFIX, ""))
                    .orElse("");

            ReservaResponseDto reserva = reservaService.cambiarEstadoReserva(id, nuevoEstado, userEmail, userRole, mensajeAnalista);
            String mensaje = "APROBADO".equals(nuevoEstado)
                    ? "Reserva aprobada exitosamente"
                    : "Reserva rechazada exitosamente";
            return ResponseEntity.ok(ApiResponse.success(reserva, mensaje));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error("Error al cambiar estado: " + e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Error al cambiar estado: " + e.getMessage()));
        }
    }
}
