package com.utec.backend.controller;

import com.utec.backend.common.ApiResponse;
import com.utec.backend.dto.recurso.RecursoCreateEnlaceDto;
import com.utec.backend.dto.recurso.RecursoResponseDto;
import com.utec.backend.service.RecursoAcademicoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class RecursoAcademicoController {

    private final RecursoAcademicoService recursoService;

    /**
     * Listar los recursos académicos de una materia.
     */
    @GetMapping("/materias/{materiaId}/recursos")
    @PreAuthorize("hasPermission(null, 'recurso:ver')")
    public ResponseEntity<ApiResponse<List<RecursoResponseDto>>> listarRecursos(
            @PathVariable Long materiaId) {
        try {
            List<RecursoResponseDto> recursos = recursoService.listarPorMateria(materiaId);
            return ResponseEntity.ok(ApiResponse.success(recursos, "Recursos obtenidos exitosamente"));
        } catch (Exception e) {
            log.error("Error al obtener recursos de la materia {}", materiaId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Error al obtener recursos: " + e.getMessage()));
        }
    }

    /**
     * Crear un recurso de tipo ARCHIVO (subida multipart).
     */
    @PostMapping(value = "/materias/{materiaId}/recursos/archivo",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasPermission(null, 'recurso:crear')")
    public ResponseEntity<ApiResponse<RecursoResponseDto>> crearArchivo(
            @PathVariable Long materiaId,
            @RequestParam("file") MultipartFile file,
            @RequestParam("titulo") String titulo,
            @RequestParam(value = "descripcion", required = false) String descripcion,
            Authentication authentication) {
        try {
            String userEmail = authentication.getName();
            RecursoResponseDto recurso = recursoService.crearArchivo(materiaId, file, titulo, descripcion, userEmail);
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ApiResponse.success(recurso, "Recurso subido exitosamente"));
        } catch (IllegalArgumentException e) {
            log.warn("Error de validación al subir recurso: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error("Error de validación: " + e.getMessage()));
        } catch (IOException e) {
            log.error("Error al subir recurso para materia {}", materiaId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Error al subir el recurso: " + e.getMessage()));
        } catch (RuntimeException e) {
            log.error("Error al procesar la subida de recurso", e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error(e.getMessage()));
        }
    }

    /**
     * Crear un recurso de tipo ENLACE (URL externa).
     */
    @PostMapping("/materias/{materiaId}/recursos/enlace")
    @PreAuthorize("hasPermission(null, 'recurso:crear')")
    public ResponseEntity<ApiResponse<RecursoResponseDto>> crearEnlace(
            @PathVariable Long materiaId,
            @Valid @RequestBody RecursoCreateEnlaceDto createDto,
            Authentication authentication) {
        try {
            String userEmail = authentication.getName();
            RecursoResponseDto recurso = recursoService.crearEnlace(
                    materiaId, createDto.getTitulo(), createDto.getDescripcion(), createDto.getUrl(), userEmail);
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ApiResponse.success(recurso, "Enlace agregado exitosamente"));
        } catch (RuntimeException e) {
            log.error("Error al crear enlace para materia {}", materiaId, e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error("Error al crear enlace: " + e.getMessage()));
        }
    }

    /**
     * Eliminar (soft delete) un recurso académico.
     */
    @DeleteMapping("/recursos/{id}")
    @PreAuthorize("hasPermission(null, 'recurso:eliminar')")
    public ResponseEntity<ApiResponse<Void>> eliminarRecurso(
            @PathVariable Long id,
            Authentication authentication) {
        try {
            String userEmail = authentication.getName();
            recursoService.eliminar(id, userEmail);
            return ResponseEntity.ok(ApiResponse.success(null, "Recurso eliminado exitosamente"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error(e.getMessage()));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error("Error al eliminar recurso: " + e.getMessage()));
        }
    }
}
