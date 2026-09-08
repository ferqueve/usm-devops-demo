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
import com.utec.backend.security.RolAutenticado;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/eventos")
@RequiredArgsConstructor
public class EventoController {


    private final EventoService eventoService;

    private static String extractRole(Authentication authentication) {
        return RolAutenticado.de(authentication);
    }

    @GetMapping
    @PreAuthorize("hasPermission(null, 'evento:ver')")
    public ResponseEntity<ApiResponse<List<EventoResponseDto>>> listar(Authentication authentication) {
        String email = authentication.getName();
        String rol = extractRole(authentication);
        List<EventoResponseDto> eventos = eventoService.listar(email, rol);
        return ResponseEntity.ok(ApiResponse.success(eventos, "Eventos obtenidos exitosamente"));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasPermission(null, 'evento:ver')")
    public ResponseEntity<ApiResponse<EventoResponseDto>> getById(
            @PathVariable Long id,
            Authentication authentication) {
        EventoResponseDto evento = eventoService.getEventoById(id, authentication.getName());
        return ResponseEntity.ok(ApiResponse.success(evento, "Evento obtenido exitosamente"));
    }

    @PostMapping
    @PreAuthorize("hasPermission(null, 'evento:crear')")
    public ResponseEntity<ApiResponse<EventoResponseDto>> crear(
            @Valid @RequestBody EventoCreateDto createDto,
            Authentication authentication) {
        EventoResponseDto evento = eventoService.createEvento(createDto, authentication.getName());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(evento, "Evento creado exitosamente"));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasPermission(null, 'evento:editar')")
    public ResponseEntity<ApiResponse<EventoResponseDto>> actualizar(
            @PathVariable Long id,
            @Valid @RequestBody EventoUpdateDto updateDto) {
        EventoResponseDto evento = eventoService.updateEvento(id, updateDto);
        return ResponseEntity.ok(ApiResponse.success(evento, "Evento actualizado exitosamente"));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasPermission(null, 'evento:eliminar')")
    public ResponseEntity<ApiResponse<Void>> eliminar(@PathVariable Long id) {
        eventoService.deleteEvento(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Evento eliminado exitosamente"));
    }

    @PostMapping("/{id}/inscripciones")
    @PreAuthorize("hasPermission(null, 'evento:inscribir')")
    public ResponseEntity<ApiResponse<EventoResponseDto>> inscribir(
            @PathVariable Long id,
            Authentication authentication) {
        EventoResponseDto evento = eventoService.inscribir(id, authentication.getName());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(evento, "Inscripción realizada exitosamente"));
    }

    @GetMapping("/inscripciones/mias")
    @PreAuthorize("hasPermission(null, 'evento:ver')")
    public ResponseEntity<ApiResponse<List<EventoResponseDto>>> misInscripciones(Authentication authentication) {
        List<EventoResponseDto> eventos = eventoService.misInscripciones(authentication.getName());
        return ResponseEntity.ok(ApiResponse.success(eventos, "Inscripciones obtenidas exitosamente"));
    }

    @DeleteMapping("/{id}/inscripciones/mia")
    @PreAuthorize("hasPermission(null, 'evento:inscribir')")
    public ResponseEntity<ApiResponse<Void>> cancelarInscripcion(
            @PathVariable Long id,
            Authentication authentication) {
        eventoService.cancelarInscripcion(id, authentication.getName());
        return ResponseEntity.ok(ApiResponse.success(null, "Inscripción cancelada"));
    }

    @GetMapping("/{id}/feedback")
    @PreAuthorize("hasPermission(null, 'evento:ver')")
    public ResponseEntity<ApiResponse<EventoFeedbackResumenDto>> feedback(
            @PathVariable Long id,
            Authentication authentication) {
        EventoFeedbackResumenDto resumen = eventoService.getFeedbackResumen(id, authentication.getName());
        return ResponseEntity.ok(ApiResponse.success(resumen, "Feedback obtenido exitosamente"));
    }

    @PostMapping("/{id}/feedback")
    @PreAuthorize("hasPermission(null, 'evento:inscribir')")
    public ResponseEntity<ApiResponse<EventoFeedbackResumenDto>> dejarFeedback(
            @PathVariable Long id,
            @Valid @RequestBody EventoFeedbackCreateDto dto,
            Authentication authentication) {
        EventoFeedbackResumenDto resumen = eventoService.dejarFeedback(id, authentication.getName(), dto);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(resumen, "¡Gracias por tu valoración!"));
    }

    @GetMapping("/{id}/inscriptos")
    @PreAuthorize("hasPermission(null, 'evento:ver_inscriptos')")
    public ResponseEntity<ApiResponse<List<EventoService.InscriptoDto>>> inscriptos(@PathVariable Long id) {
        List<EventoService.InscriptoDto> inscriptos = eventoService.listarInscriptos(id);
        return ResponseEntity.ok(ApiResponse.success(inscriptos, "Inscriptos obtenidos exitosamente"));
    }

    /**
     * Marca/desmarca la asistencia de una inscripción (check-in).
     */
    @PutMapping("/inscripciones/{inscripcionId}/asistencia")
    @PreAuthorize("hasPermission(null, 'evento:ver_inscriptos')")
    public ResponseEntity<ApiResponse<Void>> marcarAsistencia(
            @PathVariable Long inscripcionId,
            @RequestParam(defaultValue = "true") boolean asistio) {
        eventoService.marcarAsistencia(inscripcionId, asistio);
        return ResponseEntity.ok(ApiResponse.success(null, "Asistencia actualizada"));
    }

    /**
     * Notifica por email a los inscriptos de un evento.
     */
    @PostMapping("/{id}/notificar")
    @PreAuthorize("hasPermission(null, 'evento:ver_inscriptos')")
    public ResponseEntity<ApiResponse<NotificacionResultadoDto>> notificar(
            @PathVariable Long id, @RequestBody Map<String, Object> body) {
        String asunto = body.get("asunto") != null ? body.get("asunto").toString() : null;
        String mensaje = body.get("mensaje") != null ? body.get("mensaje").toString() : "";
        return ResponseEntity.ok(ApiResponse.success(eventoService.notificarInscriptos(id, asunto, mensaje), "Notificación procesada"));
    }
}
