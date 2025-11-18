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

@RestController
@RequestMapping("/api/v1/reservas")
@RequiredArgsConstructor
public class ReservaController {
    
    private final ReservaService reservaService;
    
    /**
     * Crear una nueva reserva
     * Solo Admin y Analista pueden crear reservas
     */
    @PostMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('ANALISTA')")
    public ResponseEntity<ApiResponse<ReservaResponseDto>> createReserva(
            @Valid @RequestBody ReservaCreateDto createDto,
            Authentication authentication) {
        try {
            String userEmail = authentication.getName();
            ReservaResponseDto reserva = reservaService.createReserva(createDto, userEmail);
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ApiResponse.success(reserva, "Reserva creada exitosamente"));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error("Error al crear reserva: " + e.getMessage()));
        }
    }
    
    /**
     * Obtener todas las reservas del usuario autenticado
     */
    @GetMapping("/mis-reservas")
    @PreAuthorize("hasRole('ADMIN') or hasRole('ANALISTA')")
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
     */
    @GetMapping("/mis-reservas/paged")
    @PreAuthorize("hasRole('ADMIN') or hasRole('ANALISTA')")
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
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('ANALISTA')")
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
    @PreAuthorize("hasRole('ADMIN') or hasRole('ANALISTA')")
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
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('ANALISTA')")
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
    @PreAuthorize("hasRole('ADMIN') or hasRole('ANALISTA')")
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
     * Obtener estadísticas personales de reservas del usuario autenticado
     */
    @GetMapping("/mis-reservas/stats")
    @PreAuthorize("hasRole('ADMIN') or hasRole('ANALISTA')")
    public ResponseEntity<ApiResponse<ReservaStatsDto>> getMisReservasStats(
            Authentication authentication) {
        try {
            String userEmail = authentication.getName();
            ReservaStatsDto stats = reservaService.obtenerEstadisticasPersonales(userEmail);
            return ResponseEntity.ok(ApiResponse.success(stats, "Estadísticas obtenidas exitosamente"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Error al obtener estadísticas: " + e.getMessage()));
        }
    }
}

