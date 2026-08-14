package com.utec.backend.controller;

import com.utec.backend.common.ApiResponse;
import com.utec.backend.dto.NotificacionResultadoDto;
import com.utec.backend.dto.tutoria.RachaDto;
import com.utec.backend.dto.tutoria.TutorRankingDto;
import com.utec.backend.dto.tutoria.TutoriaAgendadoDto;
import com.utec.backend.dto.tutoria.TutoriaCreateDto;
import com.utec.backend.dto.tutoria.TutoriaFeedbackCreateDto;
import com.utec.backend.dto.tutoria.TutoriaFeedbackResumenDto;
import com.utec.backend.dto.tutoria.TutoriaRecursoDto;
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
import java.util.Map;

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
     * Detalle de una tutoría.
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasPermission(null, 'tutoria:ver')")
    public ResponseEntity<ApiResponse<TutoriaResponseDto>> getById(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(ApiResponse.success(tutoriaService.getById(id), "Tutoría obtenida"));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.error(e.getMessage()));
        }
    }

    /**
     * Estudiantes agendados en una tutoría.
     */
    @GetMapping("/{id}/agendados")
    @PreAuthorize("hasRole('ADMIN') or hasRole('ANALISTA') or hasRole('DOCENTE')")
    public ResponseEntity<ApiResponse<List<TutoriaAgendadoDto>>> getAgendados(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(ApiResponse.success(tutoriaService.getAgendados(id), "Agendados obtenidos"));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(ApiResponse.error(e.getMessage()));
        }
    }

    /**
     * Eliminar una tutoría (admin/analista o el docente dueño).
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('ANALISTA') or hasRole('DOCENTE')")
    public ResponseEntity<ApiResponse<Void>> eliminar(@PathVariable Long id, Authentication authentication) {
        try {
            tutoriaService.eliminar(id, authentication.getName());
            return ResponseEntity.ok(ApiResponse.success(null, "Tutoría eliminada"));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(ApiResponse.error(e.getMessage()));
        }
    }

    /**
     * Notificar por email a los agendados de una tutoría.
     */
    @PostMapping("/{id}/notificar")
    @PreAuthorize("hasRole('ADMIN') or hasRole('ANALISTA') or hasRole('DOCENTE')")
    public ResponseEntity<ApiResponse<NotificacionResultadoDto>> notificar(
            @PathVariable Long id, @RequestBody Map<String, Object> body) {
        try {
            String asunto = body.get("asunto") != null ? body.get("asunto").toString() : null;
            String mensaje = body.get("mensaje") != null ? body.get("mensaje").toString() : "";
            return ResponseEntity.ok(ApiResponse.success(tutoriaService.notificarAgendados(id, asunto, mensaje), "Notificación procesada"));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(ApiResponse.error(e.getMessage()));
        }
    }

    /**
     * Editar una franja de tutoría (docente dueño o admin/analista).
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
            @RequestBody(required = false) Map<String, Object> body,
            Authentication authentication) {
        try {
            String email = authentication.getName();
            String temario = (body != null && body.get("temario") != null) ? body.get("temario").toString() : null;
            TutoriaResponseDto tutoria = tutoriaService.agendar(id, email, temario);
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ApiResponse.success(tutoria, "Tutoría agendada exitosamente"));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error("Error al agendar tutoría: " + e.getMessage()));
        }
    }

    @PutMapping("/reservas/{id}/confirmar")
    @PreAuthorize("hasPermission(null, 'tutoria:agendar')")
    public ResponseEntity<ApiResponse<Void>> confirmarReserva(@PathVariable Long id, Authentication authentication) {
        try {
            tutoriaService.confirmarReserva(id, authentication.getName());
            return ResponseEntity.ok(ApiResponse.success(null, "Asistencia confirmada"));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(ApiResponse.error(e.getMessage()));
        }
    }

    @PutMapping("/reservas/{id}/asistencia")
    @PreAuthorize("hasRole('ADMIN') or hasRole('ANALISTA') or hasRole('DOCENTE')")
    public ResponseEntity<ApiResponse<Void>> marcarAsistencia(
            @PathVariable Long id,
            @RequestParam(defaultValue = "true") boolean asistio,
            Authentication authentication) {
        try {
            tutoriaService.marcarAsistencia(id, asistio, authentication.getName());
            return ResponseEntity.ok(ApiResponse.success(null, "Asistencia actualizada"));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(ApiResponse.error(e.getMessage()));
        }
    }

    @PutMapping("/{id}/en-vivo")
    @PreAuthorize("hasPermission(null, 'tutoria:editar')")
    public ResponseEntity<ApiResponse<TutoriaResponseDto>> toggleEnVivo(
            @PathVariable Long id,
            @RequestParam(defaultValue = "true") boolean activo,
            Authentication authentication) {
        try {
            return ResponseEntity.ok(ApiResponse.success(
                    tutoriaService.toggleEnVivo(id, authentication.getName(), activo), "Estado actualizado"));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(ApiResponse.error(e.getMessage()));
        }
    }

    @GetMapping("/{id}/feedback")
    @PreAuthorize("hasPermission(null, 'tutoria:ver')")
    public ResponseEntity<ApiResponse<TutoriaFeedbackResumenDto>> feedback(
            @PathVariable Long id, Authentication authentication) {
        try {
            return ResponseEntity.ok(ApiResponse.success(
                    tutoriaService.getFeedbackResumen(id, authentication.getName()), "Feedback obtenido"));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.error(e.getMessage()));
        }
    }

    @PostMapping("/{id}/feedback")
    @PreAuthorize("hasPermission(null, 'tutoria:agendar')")
    public ResponseEntity<ApiResponse<TutoriaFeedbackResumenDto>> dejarFeedback(
            @PathVariable Long id,
            @Valid @RequestBody TutoriaFeedbackCreateDto dto,
            Authentication authentication) {
        try {
            return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(
                    tutoriaService.dejarFeedback(id, authentication.getName(), dto), "¡Gracias por tu valoración!"));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(ApiResponse.error("Error al valorar: " + e.getMessage()));
        }
    }

    @GetMapping("/ranking/tutores")
    @PreAuthorize("hasPermission(null, 'tutoria:ver')")
    public ResponseEntity<ApiResponse<List<TutorRankingDto>>> rankingTutores() {
        return ResponseEntity.ok(ApiResponse.success(tutoriaService.rankingTutores(), "Ranking obtenido"));
    }

    @GetMapping("/mias/racha")
    @PreAuthorize("hasPermission(null, 'tutoria:ver')")
    public ResponseEntity<ApiResponse<RachaDto>> racha(Authentication authentication) {
        return ResponseEntity.ok(ApiResponse.success(tutoriaService.racha(authentication.getName()), "Racha obtenida"));
    }

    @GetMapping("/{id}/recursos")
    @PreAuthorize("hasPermission(null, 'tutoria:ver')")
    public ResponseEntity<ApiResponse<List<TutoriaRecursoDto>>> listarRecursos(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(tutoriaService.listarRecursos(id), "Recursos obtenidos"));
    }

    @PostMapping("/{id}/recursos")
    @PreAuthorize("hasPermission(null, 'tutoria:editar')")
    public ResponseEntity<ApiResponse<TutoriaRecursoDto>> agregarRecurso(
            @PathVariable Long id,
            @Valid @RequestBody TutoriaRecursoDto dto,
            Authentication authentication) {
        try {
            return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(
                    tutoriaService.agregarRecurso(id, authentication.getName(), dto), "Recurso agregado"));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(ApiResponse.error(e.getMessage()));
        }
    }

    @DeleteMapping("/recursos/{id}")
    @PreAuthorize("hasPermission(null, 'tutoria:editar')")
    public ResponseEntity<ApiResponse<Void>> eliminarRecurso(@PathVariable Long id, Authentication authentication) {
        try {
            tutoriaService.eliminarRecurso(id, authentication.getName());
            return ResponseEntity.ok(ApiResponse.success(null, "Recurso eliminado"));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(ApiResponse.error(e.getMessage()));
        }
    }

    @GetMapping("/{id}/temarios")
    @PreAuthorize("hasRole('ADMIN') or hasRole('ANALISTA') or hasRole('DOCENTE')")
    public ResponseEntity<ApiResponse<List<String>>> temarios(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(ApiResponse.success(tutoriaService.temariosPedidos(id), "Temarios obtenidos"));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.error(e.getMessage()));
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
