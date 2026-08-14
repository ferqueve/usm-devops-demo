package com.utec.backend.controller;

import com.utec.backend.common.ApiResponse;
import com.utec.backend.dto.inscripcion.InscripcionResponseDto;
import com.utec.backend.dto.materia.MapaCarreraDto;
import com.utec.backend.dto.materia.MateriaCreateDto;
import com.utec.backend.dto.materia.MateriaResponseDto;
import com.utec.backend.dto.materia.MateriaUpdateDto;
import com.utec.backend.service.InscripcionMateriaService;
import com.utec.backend.service.MateriaService;
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
@RequestMapping("/api/v1/materias")
@RequiredArgsConstructor
public class MateriaController {

    private final MateriaService materiaService;
    private final InscripcionMateriaService inscripcionMateriaService;

    @GetMapping
    @PreAuthorize("hasPermission(null, 'materia:ver')")
    public ResponseEntity<ApiResponse<List<MateriaResponseDto>>> getAllMaterias() {
        try {
            List<MateriaResponseDto> materias = materiaService.getAllMaterias();
            return ResponseEntity.ok(ApiResponse.success(materias, "Materias obtenidas exitosamente"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Error al obtener materias: " + e.getMessage()));
        }
    }

    @GetMapping("/mias")
    @PreAuthorize("hasPermission(null, 'materia:ver')")
    public ResponseEntity<ApiResponse<List<MateriaResponseDto>>> getMisMaterias(
            Authentication authentication) {
        try {
            String userEmail = authentication.getName();
            List<MateriaResponseDto> materias = materiaService.getMateriasDelUsuario(userEmail);
            return ResponseEntity.ok(ApiResponse.success(materias, "Materias obtenidas exitosamente"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Error al obtener materias: " + e.getMessage()));
        }
    }

    /**
     * Mapa de correlativas de una carrera con el avance del estudiante autenticado.
     */
    @GetMapping("/mapa")
    @PreAuthorize("hasPermission(null, 'materia:ver')")
    public ResponseEntity<ApiResponse<MapaCarreraDto>> getMapa(
            @RequestParam Long carreraId,
            Authentication authentication) {
        try {
            String email = authentication != null ? authentication.getName() : null;
            return ResponseEntity.ok(ApiResponse.success(
                    materiaService.getMapaCarrera(carreraId, email), "Mapa de carrera obtenido"));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(ApiResponse.error(e.getMessage()));
        }
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasPermission(null, 'materia:ver')")
    public ResponseEntity<ApiResponse<MateriaResponseDto>> getMateriaById(@PathVariable Long id) {
        try {
            MateriaResponseDto materia = materiaService.getMateriaById(id);
            return ResponseEntity.ok(ApiResponse.success(materia, "Materia obtenida exitosamente"));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Error al obtener materia: " + e.getMessage()));
        }
    }

    @GetMapping("/por-carrera/{carreraId}")
    @PreAuthorize("hasPermission(null, 'materia:ver')")
    public ResponseEntity<ApiResponse<List<MateriaResponseDto>>> getMateriasByCarrera(
            @PathVariable Long carreraId) {
        try {
            List<MateriaResponseDto> materias = materiaService.getMateriasByCarrera(carreraId);
            return ResponseEntity.ok(ApiResponse.success(materias, "Materias obtenidas exitosamente"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Error al obtener materias: " + e.getMessage()));
        }
    }

    @GetMapping("/{id}/inscriptos")
    @PreAuthorize("hasPermission(null, 'materia:ver_inscriptos')")
    public ResponseEntity<ApiResponse<List<InscripcionResponseDto>>> getInscriptos(@PathVariable Long id) {
        try {
            List<InscripcionResponseDto> inscriptos = inscripcionMateriaService.getInscriptosByMateria(id);
            return ResponseEntity.ok(ApiResponse.success(inscriptos, "Inscriptos obtenidos exitosamente"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Error al obtener inscriptos: " + e.getMessage()));
        }
    }

    @PostMapping
    @PreAuthorize("hasPermission(null, 'materia:crear')")
    public ResponseEntity<ApiResponse<MateriaResponseDto>> createMateria(
            @Valid @RequestBody MateriaCreateDto createDto) {
        try {
            MateriaResponseDto materia = materiaService.createMateria(createDto);
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ApiResponse.success(materia, "Materia creada exitosamente"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error("Error al crear materia: " + e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasPermission(null, 'materia:editar')")
    public ResponseEntity<ApiResponse<MateriaResponseDto>> updateMateria(
            @PathVariable Long id,
            @Valid @RequestBody MateriaUpdateDto updateDto,
            Authentication authentication) {
        try {
            String userEmail = authentication.getName();
            MateriaResponseDto materia = materiaService.updateMateria(id, updateDto, userEmail);
            return ResponseEntity.ok(ApiResponse.success(materia, "Materia actualizada exitosamente"));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error("Error al actualizar materia: " + e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Error al actualizar materia: " + e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasPermission(null, 'materia:eliminar')")
    public ResponseEntity<ApiResponse<Void>> deleteMateria(@PathVariable Long id) {
        try {
            materiaService.deleteMateria(id);
            return ResponseEntity.ok(ApiResponse.success(null, "Materia eliminada exitosamente"));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Error al eliminar materia: " + e.getMessage()));
        }
    }

    @PostMapping("/{id}/inscripciones")
    @PreAuthorize("hasPermission(null, 'inscripcion:crear')")
    public ResponseEntity<ApiResponse<InscripcionResponseDto>> inscribirse(
            @PathVariable Long id,
            Authentication authentication) {
        try {
            String userEmail = authentication.getName();
            InscripcionResponseDto inscripcion = inscripcionMateriaService.inscribir(id, userEmail);
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ApiResponse.success(inscripcion, "Inscripción realizada exitosamente"));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error("Error al inscribirse: " + e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Error al inscribirse: " + e.getMessage()));
        }
    }

    @GetMapping("/inscripciones/mias")
    @PreAuthorize("hasPermission(null, 'inscripcion:ver_propias')")
    public ResponseEntity<ApiResponse<List<InscripcionResponseDto>>> getMisInscripciones(
            Authentication authentication) {
        try {
            String userEmail = authentication.getName();
            List<InscripcionResponseDto> inscripciones = inscripcionMateriaService.getMisInscripciones(userEmail);
            return ResponseEntity.ok(ApiResponse.success(inscripciones, "Inscripciones obtenidas exitosamente"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Error al obtener inscripciones: " + e.getMessage()));
        }
    }

    @DeleteMapping("/inscripciones/{inscripcionId}")
    @PreAuthorize("hasPermission(null, 'inscripcion:cancelar')")
    public ResponseEntity<ApiResponse<Void>> cancelarInscripcion(
            @PathVariable Long inscripcionId,
            Authentication authentication) {
        try {
            String userEmail = authentication.getName();
            inscripcionMateriaService.cancelarInscripcion(inscripcionId, userEmail);
            return ResponseEntity.ok(ApiResponse.success(null, "Inscripción cancelada exitosamente"));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error("Error al cancelar inscripción: " + e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Error al cancelar inscripción: " + e.getMessage()));
        }
    }

    /**
     * Inscribe a un estudiante específico en la materia (admin/analista).
     */
    @PostMapping("/{id}/inscripciones/admin")
    @PreAuthorize("hasRole('ADMIN') or hasRole('ANALISTA')")
    public ResponseEntity<ApiResponse<InscripcionResponseDto>> inscribirEstudiante(
            @PathVariable Long id,
            @RequestBody Map<String, Object> body) {
        try {
            Object raw = body.get("usuarioId");
            if (raw == null) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(ApiResponse.error("usuarioId es requerido"));
            }
            Long usuarioId = Long.valueOf(raw.toString());
            InscripcionResponseDto inscripcion = inscripcionMateriaService.inscribirEstudiante(id, usuarioId);
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ApiResponse.success(inscripcion, "Estudiante inscripto exitosamente"));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error("Error al inscribir: " + e.getMessage()));
        }
    }

    /**
     * Elimina cualquier inscripción de la materia (admin/analista).
     */
    @DeleteMapping("/inscripciones/{inscripcionId}/admin")
    @PreAuthorize("hasRole('ADMIN') or hasRole('ANALISTA')")
    public ResponseEntity<ApiResponse<Void>> eliminarInscripcion(@PathVariable Long inscripcionId) {
        try {
            inscripcionMateriaService.eliminarInscripcion(inscripcionId);
            return ResponseEntity.ok(ApiResponse.success(null, "Inscripción eliminada exitosamente"));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error("Error al eliminar inscripción: " + e.getMessage()));
        }
    }

    /**
     * Cambia el estado de una inscripción (ACTIVA / APROBADA). Admin/analista o docente de la materia.
     * Alimenta el progreso del mapa de correlativas.
     */
    @PutMapping("/inscripciones/{inscripcionId}/estado")
    @PreAuthorize("hasRole('ADMIN') or hasRole('ANALISTA') or hasRole('DOCENTE')")
    public ResponseEntity<ApiResponse<InscripcionResponseDto>> cambiarEstadoInscripcion(
            @PathVariable Long inscripcionId,
            @RequestParam String valor,
            Authentication authentication) {
        try {
            InscripcionResponseDto dto = inscripcionMateriaService.marcarEstado(
                    inscripcionId, valor, authentication.getName());
            return ResponseEntity.ok(ApiResponse.success(dto, "Estado de inscripción actualizado"));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error("Error al actualizar estado: " + e.getMessage()));
        }
    }

    /**
     * Notifica por email a todos los inscriptos de la materia.
     */
    @PostMapping("/{id}/notificar")
    @PreAuthorize("hasRole('ADMIN') or hasRole('ANALISTA') or hasRole('DOCENTE')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> notificarInscriptos(
            @PathVariable Long id,
            @RequestBody Map<String, Object> body) {
        try {
            String asunto = body.get("asunto") != null ? body.get("asunto").toString() : null;
            String mensaje = body.get("mensaje") != null ? body.get("mensaje").toString() : "";
            Map<String, Object> resultado = inscripcionMateriaService.notificarInscriptos(id, asunto, mensaje);
            return ResponseEntity.ok(ApiResponse.success(resultado, "Notificación procesada"));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error("Error al notificar: " + e.getMessage()));
        }
    }
}
