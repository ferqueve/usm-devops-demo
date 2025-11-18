package com.utec.backend.controller;

import com.utec.backend.common.ApiResponse;
import com.utec.backend.dto.common.PagedResponseDto;
import com.utec.backend.dto.reserva.ReservaCreateDto;
import com.utec.backend.dto.reserva.ReservaResponseDto;
import com.utec.backend.dto.reserva.ReservaStatsDto;
import com.utec.backend.dto.reserva.ReservaUpdateDto;
import com.utec.backend.service.ReservaService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

import static com.utec.backend.security.Constants.*;

@RestController
@RequestMapping("/api/v1/reservas")
@RequiredArgsConstructor
public class ReservaController {
    
    private final ReservaService reservaService;
    
    /**
     * Crear una nueva reserva
     * Admin y Analista: crean reservas auto-aprobadas (APROBADO)
     * Docente: crea solicitudes pendientes (PENDIENTE)
     */
    @PostMapping
    @PreAuthorize("hasRole('" + ROLE_ADMIN + "') or hasRole('" + ROLE_ANALISTA + "') or hasRole('" + ROLE_DOCENTE + "')")
    public ResponseEntity<ApiResponse<ReservaResponseDto>> createReserva(
            @Valid @RequestBody ReservaCreateDto createDto,
            Authentication authentication) {
        try {
            String userEmail = authentication.getName();
            // Obtener el rol del usuario desde la autenticación
            String userRole = authentication.getAuthorities().stream()
                    .findFirst()
                    .map(auth -> auth.getAuthority().replace("ROLE_", ""))
                    .orElse("");
            ReservaResponseDto reserva = reservaService.createReserva(createDto, userEmail, userRole);
            String mensaje = "DOCENTE".equals(userRole) 
                    ? "Solicitud de reserva enviada exitosamente. Esperando aprobación."
                    : "Reserva creada exitosamente";
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ApiResponse.success(reserva, mensaje));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error("Error al crear reserva: " + e.getMessage()));
        }
    }
    
    /**
     * Obtener todas las reservas del usuario autenticado
     * Disponible para ADMIN, ANALISTA y DOCENTE
     */
    @GetMapping("/mis-reservas")
    @PreAuthorize("hasRole('" + ROLE_ADMIN + "') or hasRole('" + ROLE_ANALISTA + "') or hasRole('" + ROLE_DOCENTE + "')")
    public ResponseEntity<ApiResponse<List<ReservaResponseDto>>> getMisReservas(
            Authentication authentication) {
        try {
            String userEmail = authentication.getName();
            List<ReservaResponseDto> reservas = reservaService.getReservasByUsuario(userEmail);
            return ResponseEntity.ok(ApiResponse.success(reservas, "Reservas obtenidas exitosamente"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Error al obtener reservas: " + e.getMessage()));
        }
    }
    
    /**
     * Obtener reservas del usuario autenticado con paginación y filtros
     * Disponible para ADMIN, ANALISTA y DOCENTE
     */
    @GetMapping("/mis-reservas/paged")
    @PreAuthorize("hasRole('" + ROLE_ADMIN + "') or hasRole('" + ROLE_ANALISTA + "') or hasRole('" + ROLE_DOCENTE + "')")
    public ResponseEntity<ApiResponse<PagedResponseDto<ReservaResponseDto>>> getMisReservasPaged(
            Authentication authentication,
            @PageableDefault(size = 10, sort = "inicio", direction = Sort.Direction.DESC) Pageable pageable,
            @RequestParam(required = false) String estado,
            @RequestParam(required = false) Long espacioId,
            @RequestParam(required = false) Long carreraId,
            @RequestParam(required = false) Long tipoEspacioId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime fechaInicio,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime fechaFin,
            @RequestParam(required = false) String tiempo) {
        try {
            String userEmail = authentication.getName();
            
            var reservasPage = reservaService.getReservasByUsuarioPaged(
                    userEmail,
                    pageable,
                    estado,
                    espacioId,
                    carreraId,
                    tipoEspacioId,
                    fechaInicio,
                    fechaFin,
                    tiempo);
            
            PagedResponseDto<ReservaResponseDto> pagedResponse = PagedResponseDto.of(reservasPage);
            return ResponseEntity.ok(ApiResponse.success(pagedResponse, "Reservas obtenidas exitosamente"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Error al obtener reservas: " + e.getMessage()));
        }
    }
        /**
     * Obtener una reserva por ID
     * Disponible para ADMIN, ANALISTA y DOCENTE (solo sus propias reservas)
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasRole('" + ROLE_ADMIN + "') or hasRole('" + ROLE_ANALISTA + "') or hasRole('" + ROLE_DOCENTE + "')")
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
     * Actualizar una reserva
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('" + ROLE_ADMIN + "') or hasRole('" + ROLE_ANALISTA + "')")
    public ResponseEntity<ApiResponse<ReservaResponseDto>> updateReserva(
            @PathVariable Long id,
            @RequestBody ReservaUpdateDto updateDto,
            Authentication authentication) {
        try {
            String userEmail = authentication.getName();
            ReservaResponseDto reserva = reservaService.updateReserva(id, updateDto, userEmail);
            return ResponseEntity.ok(ApiResponse.success(reserva, "Reserva actualizada exitosamente"));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error("Error al actualizar reserva: " + e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Error al actualizar reserva: " + e.getMessage()));
        }
    }
    
    /**
     * Cancelar una reserva
     * Disponible para ADMIN, ANALISTA y DOCENTE (solo sus propias reservas)
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('" + ROLE_ADMIN + "') or hasRole('" + ROLE_ANALISTA + "') or hasRole('" + ROLE_DOCENTE + "')")
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
     */
    @GetMapping("/espacio/{espacioId}")
    @PreAuthorize("hasRole('" + ROLE_ADMIN + "') or hasRole('" + ROLE_ANALISTA + "')")
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
     */
    @GetMapping("/todas")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<List<ReservaResponseDto>>> getTodasLasReservas(
            @RequestParam(required = false) String estado,
            @RequestParam(required = false) Long espacioId,
            @RequestParam(required = false) Long carreraId,
            @RequestParam(required = false) Long tipoEspacioId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime fechaInicio,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime fechaFin) {
        try {
            List<ReservaResponseDto> reservas = reservaService.getTodasLasReservas(
                    estado, espacioId, carreraId, tipoEspacioId, fechaInicio, fechaFin);
            return ResponseEntity.ok(ApiResponse.success(reservas, "Reservas obtenidas exitosamente"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Error al obtener reservas: " + e.getMessage()));
        }
    }
    
    /**
     * Obtener estadísticas de reservas
     * DOCENTE: estadísticas personales (solo sus reservas)
     * ANALISTA/ADMIN: estadísticas globales (todas las reservas)
     */
    @GetMapping("/mis-reservas/stats")
    @PreAuthorize("hasRole('" + ROLE_ADMIN + "') or hasRole('" + ROLE_ANALISTA + "') or hasRole('" + ROLE_DOCENTE + "')")
    public ResponseEntity<ApiResponse<ReservaStatsDto>> getMisReservasStats(
            Authentication authentication) {
        try {
            String userEmail = authentication.getName();
            // Obtener el rol del usuario desde la autenticación
            String userRole = authentication.getAuthorities().stream()
                    .findFirst()
                    .map(auth -> auth.getAuthority().replace("ROLE_", ""))
                    .orElse("");
            
            ReservaStatsDto stats;
            if ("DOCENTE".equals(userRole)) {
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
     */
    @GetMapping("/paged")
    @PreAuthorize("hasRole('" + ROLE_ADMIN + "') or hasRole('" + ROLE_ANALISTA + "')")
    public ResponseEntity<ApiResponse<PagedResponseDto<ReservaResponseDto>>> getAllReservasPaged(
            @PageableDefault(size = 10, sort = "inicio", direction = Sort.Direction.DESC) Pageable pageable,
            @RequestParam(required = false) String estado,
            @RequestParam(required = false) Long espacioId,
            @RequestParam(required = false) Long carreraId,
            @RequestParam(required = false) Long tipoEspacioId,
            @RequestParam(required = false) Long usuarioId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime fechaInicio,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime fechaFin,
            @RequestParam(required = false) String tiempo) {
        try {
            var reservasPage = reservaService.getAllReservasPaged(
                    pageable,
                    estado,
                    espacioId,
                    carreraId,
                    tipoEspacioId,
                    usuarioId,
                    fechaInicio,
                    fechaFin,
                    tiempo);
            
            PagedResponseDto<ReservaResponseDto> pagedResponse = PagedResponseDto.of(reservasPage);
            return ResponseEntity.ok(ApiResponse.success(pagedResponse, "Reservas obtenidas exitosamente"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Error al obtener reservas: " + e.getMessage()));
        }
    }
    
    /**
     * Cambiar el estado de una reserva (aprobar/rechazar)
     * Solo disponible para ADMIN y ANALISTA
     * Solo permite cambiar de PENDIENTE a APROBADO o CANCELADO
     */
    @PatchMapping("/{id}/estado")
    @PreAuthorize("hasRole('" + ROLE_ADMIN + "') or hasRole('" + ROLE_ANALISTA + "')")
    public ResponseEntity<ApiResponse<ReservaResponseDto>> cambiarEstadoReserva(
            @PathVariable Long id,
            @RequestBody java.util.Map<String, String> requestBody,
            Authentication authentication) {
        try {
            String nuevoEstado = requestBody.get("estado");
            if (nuevoEstado == null || nuevoEstado.isEmpty()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(ApiResponse.error("El campo 'estado' es requerido"));
            }
            
            ReservaResponseDto reserva = reservaService.cambiarEstadoReserva(id, nuevoEstado);
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

