package com.utec.backend.controller;

import com.utec.backend.common.ApiResponse;
import com.utec.backend.dto.recomendacion.*;
import com.utec.backend.exception.UsuarioNotFoundException;
import com.utec.backend.model.Usuario;
import com.utec.backend.repository.UsuarioRepository;
import com.utec.backend.service.RecomendacionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;

import static com.utec.backend.security.Constants.*;

@RestController
@RequestMapping("/api/v1/recomendaciones")
@RequiredArgsConstructor
public class RecomendacionController {
    
    private final RecomendacionService recomendacionService;
    private final UsuarioRepository usuarioRepository;
    
    // ========== RECOMENDACIONES DE RESERVAS ==========
    
    /**
     * Obtener recomendaciones de espacios para crear una reserva
     */
    @GetMapping("/reservas/espacios")
    @PreAuthorize("hasRole('" + ROLE_DOCENTE + "') or hasRole('" + ROLE_ANALISTA + "') or hasRole('" + ROLE_ADMIN + "')")
    public ResponseEntity<ApiResponse<List<RecomendacionEspacioDto>>> obtenerRecomendacionesEspacios(
            @RequestParam Instant inicio,
            @RequestParam Instant fin,
            @RequestParam(required = false) Integer capacidad,
            Authentication authentication) {
        try {
            String userEmail = authentication.getName();
            Usuario usuario = usuarioRepository.findByEmail(userEmail)
                .orElseThrow(() -> new UsuarioNotFoundException("Usuario no encontrado: " + userEmail));
            List<RecomendacionEspacioDto> recomendaciones = recomendacionService
                .obtenerRecomendacionesEspacios(usuario.getId(), inicio, fin, capacidad);
            return ResponseEntity.ok(ApiResponse.success(recomendaciones, "Recomendaciones obtenidas exitosamente"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error("Error al obtener recomendaciones: " + e.getMessage()));
        }
    }
    
    /**
     * Obtener horarios óptimos para un espacio y fecha
     */
    @GetMapping("/reservas/horarios")
    @PreAuthorize("hasRole('" + ROLE_DOCENTE + "') or hasRole('" + ROLE_ANALISTA + "') or hasRole('" + ROLE_ADMIN + "')")
    public ResponseEntity<ApiResponse<List<HorarioRecomendadoDto>>> obtenerHorariosOptimos(
            @RequestParam Long espacioId,
            @RequestParam Instant fecha,
            Authentication authentication) {
        try {
            String userEmail = authentication.getName();
            Usuario usuario = usuarioRepository.findByEmail(userEmail)
                .orElseThrow(() -> new UsuarioNotFoundException("Usuario no encontrado: " + userEmail));
            List<HorarioRecomendadoDto> horarios = recomendacionService
                .obtenerHorariosOptimos(usuario.getId(), espacioId, fecha);
            return ResponseEntity.ok(ApiResponse.success(horarios, "Horarios recomendados obtenidos exitosamente"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error("Error al obtener horarios: " + e.getMessage()));
        }
    }
    
    /**
     * Obtener espacios similares a uno dado
     */
    @GetMapping("/reservas/espacios-similares")
    @PreAuthorize("hasRole('" + ROLE_DOCENTE + "') or hasRole('" + ROLE_ANALISTA + "') or hasRole('" + ROLE_ADMIN + "')")
    public ResponseEntity<ApiResponse<List<RecomendacionEspacioDto>>> obtenerEspaciosSimilares(
            @RequestParam Long espacioId,
            Authentication authentication) {
        try {
            String userEmail = authentication.getName();
            Usuario usuario = usuarioRepository.findByEmail(userEmail)
                .orElseThrow(() -> new UsuarioNotFoundException("Usuario no encontrado: " + userEmail));
            List<RecomendacionEspacioDto> espacios = recomendacionService
                .obtenerEspaciosSimilares(espacioId, usuario.getId());
            return ResponseEntity.ok(ApiResponse.success(espacios, "Espacios similares obtenidos exitosamente"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error("Error al obtener espacios similares: " + e.getMessage()));
        }
    }
    
    // ========== RECOMENDACIONES DE INVENTARIO ==========
    
    /**
     * Obtener items que necesitan mantenimiento urgente
     */
    @GetMapping("/inventario/mantenimiento")
    @PreAuthorize("hasRole('" + ROLE_MANTENIMIENTO + "') or hasRole('" + ROLE_ADMIN + "')")
    public ResponseEntity<ApiResponse<List<RecomendacionInventarioDto>>> obtenerItemsMantenimiento(
            Authentication authentication) {
        try {
            List<RecomendacionInventarioDto> items = recomendacionService.obtenerItemsMantenimientoUrgente();
            return ResponseEntity.ok(ApiResponse.success(items, "Items de mantenimiento obtenidos exitosamente"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error("Error al obtener items de mantenimiento: " + e.getMessage()));
        }
    }
    
    /**
     * Obtener espacios que requieren atención
     */
    @GetMapping("/inventario/espacios-atencion")
    @PreAuthorize("hasRole('" + ROLE_MANTENIMIENTO + "') or hasRole('" + ROLE_ADMIN + "')")
    public ResponseEntity<ApiResponse<List<RecomendacionInventarioDto>>> obtenerEspaciosAtencion(
            Authentication authentication) {
        try {
            List<RecomendacionInventarioDto> espacios = recomendacionService.obtenerEspaciosAtencion();
            return ResponseEntity.ok(ApiResponse.success(espacios, "Espacios que requieren atención obtenidos exitosamente"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error("Error al obtener espacios: " + e.getMessage()));
        }
    }
    
    /**
     * Obtener recomendaciones de reasignación de items
     */
    @GetMapping("/inventario/reasignaciones")
    @PreAuthorize("hasRole('" + ROLE_ADMIN + "') or hasRole('" + ROLE_ANALISTA + "')")
    public ResponseEntity<ApiResponse<List<RecomendacionInventarioDto>>> obtenerReasignaciones(
            Authentication authentication) {
        try {
            List<RecomendacionInventarioDto> reasignaciones = recomendacionService.obtenerReasignacionesRecomendadas();
            return ResponseEntity.ok(ApiResponse.success(reasignaciones, "Reasignaciones recomendadas obtenidas exitosamente"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error("Error al obtener reasignaciones: " + e.getMessage()));
        }
    }
    
    /**
     * Obtener recomendaciones de compras necesarias
     */
    @GetMapping("/inventario/compras")
    @PreAuthorize("hasRole('" + ROLE_ADMIN + "')")
    public ResponseEntity<ApiResponse<List<RecomendacionInventarioDto>>> obtenerComprasNecesarias(
            Authentication authentication) {
        try {
            List<RecomendacionInventarioDto> compras = recomendacionService.obtenerComprasNecesarias();
            return ResponseEntity.ok(ApiResponse.success(compras, "Compras recomendadas obtenidas exitosamente"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error("Error al obtener compras: " + e.getMessage()));
        }
    }
    
    // ========== RECOMENDACIONES DE ITEMS ==========
    
    /**
     * Obtener items recomendados para una reserva
     */
    @GetMapping("/items/para-reserva")
    @PreAuthorize("hasRole('" + ROLE_DOCENTE + "') or hasRole('" + ROLE_ANALISTA + "') or hasRole('" + ROLE_ADMIN + "')")
    public ResponseEntity<ApiResponse<List<RecomendacionItemDto>>> obtenerItemsParaReserva(
            @RequestParam Long espacioId,
            Authentication authentication) {
        try {
            String userEmail = authentication.getName();
            Usuario usuario = usuarioRepository.findByEmail(userEmail)
                .orElseThrow(() -> new UsuarioNotFoundException("Usuario no encontrado: " + userEmail));
            List<RecomendacionItemDto> items = recomendacionService
                .obtenerItemsRecomendadosParaReserva(espacioId, usuario.getId());
            return ResponseEntity.ok(ApiResponse.success(items, "Items recomendados obtenidos exitosamente"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error("Error al obtener items: " + e.getMessage()));
        }
    }
    
    /**
     * Obtener combinaciones de items frecuentes
     */
    @GetMapping("/items/combinaciones")
    @PreAuthorize("hasRole('" + ROLE_DOCENTE + "') or hasRole('" + ROLE_ANALISTA + "') or hasRole('" + ROLE_ADMIN + "')")
    public ResponseEntity<ApiResponse<List<RecomendacionItemDto>>> obtenerCombinacionesItems(
            @RequestParam Long espacioId,
            Authentication authentication) {
        try {
            List<RecomendacionItemDto> combinaciones = recomendacionService.obtenerCombinacionesItems(espacioId);
            return ResponseEntity.ok(ApiResponse.success(combinaciones, "Combinaciones de items obtenidas exitosamente"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error("Error al obtener combinaciones: " + e.getMessage()));
        }
    }
    
    // ========== RECOMENDACIONES DE ANALISTAS ==========
    
    /**
     * Obtener analista recomendado para un docente
     */
    @GetMapping("/analistas/asignacion")
    @PreAuthorize("hasRole('" + ROLE_ADMIN + "')")
    public ResponseEntity<ApiResponse<List<RecomendacionAnalistaDto>>> obtenerAnalistaRecomendado(
            @RequestParam Long docenteId,
            Authentication authentication) {
        try {
            List<RecomendacionAnalistaDto> analistas = recomendacionService.obtenerAnalistaRecomendado(docenteId);
            return ResponseEntity.ok(ApiResponse.success(analistas, "Analistas recomendados obtenidos exitosamente"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error("Error al obtener analistas: " + e.getMessage()));
        }
    }
    
    /**
     * Obtener reservas prioritarias para un analista
     * Disponible para ANALISTA y ADMIN
     */
    @GetMapping("/analistas/prioritarias")
    @PreAuthorize("hasRole('" + ROLE_ANALISTA + "') or hasRole('" + ROLE_ADMIN + "')")
    public ResponseEntity<ApiResponse<List<RecomendacionAnalistaDto>>> obtenerReservasPrioritarias(
            Authentication authentication) {
        try {
            String userEmail = authentication.getName();
            Usuario usuario = usuarioRepository.findByEmail(userEmail)
                .orElseThrow(() -> new UsuarioNotFoundException("Usuario no encontrado: " + userEmail));
            List<RecomendacionAnalistaDto> reservas = recomendacionService
                .obtenerReservasPrioritarias(usuario.getId());
            return ResponseEntity.ok(ApiResponse.success(reservas, "Reservas prioritarias obtenidas exitosamente"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error("Error al obtener reservas prioritarias: " + e.getMessage()));
        }
    }
    
    // ========== RECOMENDACIONES DEL DASHBOARD ==========
    
    /**
     * Obtener recomendaciones personalizadas del dashboard según el rol
     */
    @GetMapping("/dashboard")
    public ResponseEntity<ApiResponse<DashboardRecomendacionesDto>> obtenerRecomendacionesDashboard(
            Authentication authentication) {
        try {
            String userEmail = authentication.getName();
            Usuario usuario = usuarioRepository.findByEmail(userEmail)
                .orElseThrow(() -> new UsuarioNotFoundException("Usuario no encontrado: " + userEmail));
            DashboardRecomendacionesDto recomendaciones = recomendacionService
                .obtenerRecomendacionesDashboard(usuario.getId(), usuario.getRolApp());
            return ResponseEntity.ok(ApiResponse.success(recomendaciones, "Recomendaciones del dashboard obtenidas exitosamente"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error("Error al obtener recomendaciones: " + e.getMessage()));
        }
    }
}

