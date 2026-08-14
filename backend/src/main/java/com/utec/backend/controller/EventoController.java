package com.utec.backend.controller;

import com.utec.backend.common.ApiResponse;
import com.utec.backend.dto.NotificacionResultadoDto;
import com.utec.backend.dto.evento.EventoCreateDto;
import com.utec.backend.dto.evento.EventoFeedbackCreateDto;
import com.utec.backend.dto.evento.EventoFeedbackResumenDto;
import com.utec.backend.dto.evento.EventoResponseDto;
import com.utec.backend.dto.evento.EventoUpdateDto;
import com.utec.backend.service.EventoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/eventos")
@RequiredArgsConstructor
public class EventoController {

    private static final String ROLE_PREFIX = "ROLE_";

    private final EventoService eventoService;

    private static String extractRole(Authentication authentication) {
        return authentication.getAuthorities().stream()
                .map(auth -> auth.getAuthority())
                .filter(auth -> auth.startsWith(ROLE_PREFIX))
                .findFirst()
                .map(auth -> auth.replace(ROLE_PREFIX, ""))
                .orElse("");
    }

    @GetMapping
    @PreAuthorize("hasPermission(null, 'evento:ver')")
    public ResponseEntity<ApiResponse<List<EventoResponseDto>>> listar(Authentication authentication) {
        try {
            String email = authentication.getName();
            String rol = extractRole(authentication);
            List<EventoResponseDto> eventos = eventoService.listar(email, rol);
            return ResponseEntity.ok(ApiResponse.success(eventos, "Eventos obtenidos exitosamente"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Error al obtener eventos: " + e.getMessage()));
        }
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasPermission(null, 'evento:ver')")
    public ResponseEntity<ApiResponse<EventoResponseDto>> getById(
            @PathVariable Long id,
            Authentication authentication) {
        try {
            EventoResponseDto evento = eventoService.getEventoById(id, authentication.getName());
            return ResponseEntity.ok(ApiResponse.success(evento, "Evento obtenido exitosamente"));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Error al obtener evento: " + e.getMessage()));
        }
    }

    @PostMapping
    @PreAuthorize("hasPermission(null, 'evento:crear')")
    public ResponseEntity<ApiResponse<EventoResponseDto>> crear(
            @Valid @RequestBody EventoCreateDto createDto,
            Authentication authentication) {
        try {
            EventoResponseDto evento = eventoService.createEvento(createDto, authentication.getName());
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ApiResponse.success(evento, "Evento creado exitosamente"));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error("Error al crear evento: " + e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasPermission(null, 'evento:editar')")
    public ResponseEntity<ApiResponse<EventoResponseDto>> actualizar(
            @PathVariable Long id,
            @Valid @RequestBody EventoUpdateDto updateDto) {
        try {
            EventoResponseDto evento = eventoService.updateEvento(id, updateDto);
            return ResponseEntity.ok(ApiResponse.success(evento, "Evento actualizado exitosamente"));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error("Error al actualizar evento: " + e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasPermission(null, 'evento:eliminar')")
    public ResponseEntity<ApiResponse<Void>> eliminar(@PathVariable Long id) {
        try {
            eventoService.deleteEvento(id);
            return ResponseEntity.ok(ApiResponse.success(null, "Evento eliminado exitosamente"));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Error al eliminar evento: " + e.getMessage()));
        }
    }

    @PostMapping("/{id}/inscripciones")
    @PreAuthorize("hasPermission(null, 'evento:inscribir')")
    public ResponseEntity<ApiResponse<EventoResponseDto>> inscribir(
            @PathVariable Long id,
            Authentication authentication) {
        try {
            EventoResponseDto evento = eventoService.inscribir(id, authentication.getName());
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ApiResponse.success(evento, "Inscripción realizada exitosamente"));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error("Error al inscribirse: " + e.getMessage()));
        }
    }

    @GetMapping("/mias/inscripciones")
    @PreAuthorize("hasPermission(null, 'evento:ver')")
    public ResponseEntity<ApiResponse<List<EventoResponseDto>>> misInscripciones(Authentication authentication) {
        try {
            List<EventoResponseDto> eventos = eventoService.misInscripciones(authentication.getName());
            return ResponseEntity.ok(ApiResponse.success(eventos, "Inscripciones obtenidas exitosamente"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Error al obtener inscripciones: " + e.getMessage()));
        }
    }

    @DeleteMapping("/{id}/inscripciones")
    @PreAuthorize("hasPermission(null, 'evento:inscribir')")
    public ResponseEntity<ApiResponse<Void>> cancelarInscripcion(
            @PathVariable Long id,
            Authentication authentication) {
        try {
            eventoService.cancelarInscripcion(id, authentication.getName());
            return ResponseEntity.ok(ApiResponse.success(null, "Inscripción cancelada"));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error("Error al cancelar inscripción: " + e.getMessage()));
        }
    }

    @GetMapping("/{id}/feedback")
    @PreAuthorize("hasPermission(null, 'evento:ver')")
    public ResponseEntity<ApiResponse<EventoFeedbackResumenDto>> feedback(
            @PathVariable Long id,
            Authentication authentication) {
        try {
            EventoFeedbackResumenDto resumen = eventoService.getFeedbackResumen(id, authentication.getName());
            return ResponseEntity.ok(ApiResponse.success(resumen, "Feedback obtenido exitosamente"));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.error(e.getMessage()));
        }
    }

    @PostMapping("/{id}/feedback")
    @PreAuthorize("hasPermission(null, 'evento:inscribir')")
    public ResponseEntity<ApiResponse<EventoFeedbackResumenDto>> dejarFeedback(
            @PathVariable Long id,
            @Valid @RequestBody EventoFeedbackCreateDto dto,
            Authentication authentication) {
        try {
            EventoFeedbackResumenDto resumen = eventoService.dejarFeedback(id, authentication.getName(), dto);
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ApiResponse.success(resumen, "¡Gracias por tu valoración!"));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error("Error al valorar: " + e.getMessage()));
        }
    }

    @GetMapping("/{id}/inscriptos")
    @PreAuthorize("hasPermission(null, 'evento:ver_inscriptos')")
    public ResponseEntity<ApiResponse<List<EventoService.InscriptoDto>>> inscriptos(@PathVariable Long id) {
        try {
            List<EventoService.InscriptoDto> inscriptos = eventoService.listarInscriptos(id);
            return ResponseEntity.ok(ApiResponse.success(inscriptos, "Inscriptos obtenidos exitosamente"));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Error al obtener inscriptos: " + e.getMessage()));
        }
    }

    /**
     * Marca/desmarca la asistencia de una inscripción (check-in).
     */
    @PutMapping("/inscripciones/{inscripcionId}/asistencia")
    @PreAuthorize("hasPermission(null, 'evento:ver_inscriptos')")
    public ResponseEntity<ApiResponse<Void>> marcarAsistencia(
            @PathVariable Long inscripcionId,
            @RequestParam(defaultValue = "true") boolean asistio) {
        try {
            eventoService.marcarAsistencia(inscripcionId, asistio);
            return ResponseEntity.ok(ApiResponse.success(null, "Asistencia actualizada"));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(ApiResponse.error(e.getMessage()));
        }
    }

    /**
     * Notifica por email a los inscriptos de un evento.
     */
    @PostMapping("/{id}/notificar")
    @PreAuthorize("hasPermission(null, 'evento:ver_inscriptos')")
    public ResponseEntity<ApiResponse<NotificacionResultadoDto>> notificar(
            @PathVariable Long id, @RequestBody Map<String, Object> body) {
        try {
            String asunto = body.get("asunto") != null ? body.get("asunto").toString() : null;
            String mensaje = body.get("mensaje") != null ? body.get("mensaje").toString() : "";
            return ResponseEntity.ok(ApiResponse.success(eventoService.notificarInscriptos(id, asunto, mensaje), "Notificación procesada"));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(ApiResponse.error(e.getMessage()));
        }
    }
}
