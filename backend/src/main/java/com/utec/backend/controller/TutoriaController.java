package com.utec.backend.controller;

import com.utec.backend.common.ApiResponse;
import com.utec.backend.dto.tutoria.TutoriaCreateDto;
import com.utec.backend.dto.tutoria.TutoriaResponseDto;
import com.utec.backend.dto.tutoria.TutoriaUpdateDto;
import com.utec.backend.service.TutoriaService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/tutorias")
@RequiredArgsConstructor
public class TutoriaController {

    private final TutoriaService tutoriaService;

    /**
     * Listar tutorías. Opcionalmente filtrar por materia.
     */
    @GetMapping
    @PreAuthorize("hasPermission(null, 'tutoria:ver')")
    public ResponseEntity<ApiResponse<List<TutoriaResponseDto>>> listar(
            @RequestParam(required = false) Long materiaId) {
        try {
            List<TutoriaResponseDto> tutorias = tutoriaService.listar(materiaId);
            return ResponseEntity.ok(ApiResponse.success(tutorias, "Tutorías obtenidas exitosamente"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Error al obtener tutorías: " + e.getMessage()));
        }
    }

    /**
     * Tutorías del usuario autenticado.
     * DOCENTE -> sus franjas; ESTUDIANTE -> las que agendó.
     */
    @GetMapping("/mias")
    @PreAuthorize("hasPermission(null, 'tutoria:ver')")
    public ResponseEntity<ApiResponse<List<TutoriaResponseDto>>> misTutorias(
            Authentication authentication) {
        try {
            String email = authentication.getName();
            List<TutoriaResponseDto> tutorias = tutoriaService.misTutorias(email);
            return ResponseEntity.ok(ApiResponse.success(tutorias, "Tutorías obtenidas exitosamente"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Error al obtener tutorías: " + e.getMessage()));
        }
    }

    /**
     * Crear una franja de tutoría (el docente es el usuario autenticado).
     */
    @PostMapping
    @PreAuthorize("hasPermission(null, 'tutoria:crear')")
    public ResponseEntity<ApiResponse<TutoriaResponseDto>> crear(
            @Valid @RequestBody TutoriaCreateDto createDto,
            Authentication authentication) {
        try {
            String email = authentication.getName();
            TutoriaResponseDto tutoria = tutoriaService.crear(createDto, email);
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ApiResponse.success(tutoria, "Tutoría creada exitosamente"));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error("Error al crear tutoría: " + e.getMessage()));
        }
    }

    /**
     * Editar una franja de tutoría (solo el docente dueño).
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasPermission(null, 'tutoria:editar')")
    public ResponseEntity<ApiResponse<TutoriaResponseDto>> editar(
            @PathVariable Long id,
            @Valid @RequestBody TutoriaUpdateDto updateDto,
            Authentication authentication) {
        try {
            String email = authentication.getName();
            TutoriaResponseDto tutoria = tutoriaService.editar(id, updateDto, email);
            return ResponseEntity.ok(ApiResponse.success(tutoria, "Tutoría actualizada exitosamente"));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error("Error al actualizar tutoría: " + e.getMessage()));
        }
    }

    /**
     * Agendar (reservar) una tutoría como estudiante autenticado.
     */
    @PostMapping("/{id}/agendar")
    @PreAuthorize("hasPermission(null, 'tutoria:agendar')")
    public ResponseEntity<ApiResponse<TutoriaResponseDto>> agendar(
            @PathVariable Long id,
            Authentication authentication) {
        try {
            String email = authentication.getName();
            TutoriaResponseDto tutoria = tutoriaService.agendar(id, email);
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ApiResponse.success(tutoria, "Tutoría agendada exitosamente"));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error("Error al agendar tutoría: " + e.getMessage()));
        }
    }

    /**
     * Cancelar una reserva de tutoría.
     */
    @DeleteMapping("/reservas/{id}")
    @PreAuthorize("hasPermission(null, 'tutoria:cancelar_reserva')")
    public ResponseEntity<ApiResponse<Void>> cancelarReserva(
            @PathVariable Long id,
            Authentication authentication) {
        try {
            String email = authentication.getName();
            tutoriaService.cancelarReserva(id, email);
            return ResponseEntity.ok(ApiResponse.success(null, "Reserva cancelada exitosamente"));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error("Error al cancelar reserva: " + e.getMessage()));
        }
    }
}
