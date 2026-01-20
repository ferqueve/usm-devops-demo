package com.utec.backend.controller;

import com.utec.backend.common.ApiResponse;
import com.utec.backend.dto.carrera.CarreraCreateDto;
import com.utec.backend.dto.carrera.CarreraResponseDto;
import com.utec.backend.dto.carrera.CarreraUpdateDto;
import com.utec.backend.dto.common.PagedResponseDto;
import com.utec.backend.service.CarreraService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/carreras")
@RequiredArgsConstructor
public class CarreraController {

    private final CarreraService carreraService;

    @PostMapping
    @PreAuthorize("hasPermission(null, 'carrera:crear')")
    public ResponseEntity<ApiResponse<CarreraResponseDto>> createCarrera(
            @Valid @RequestBody CarreraCreateDto createDto) {
        try {
            CarreraResponseDto carrera = carreraService.createCarrera(createDto);
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ApiResponse.success(carrera, "Carrera creada exitosamente"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error("Error al crear carrera: " + e.getMessage()));
        }
    }

    @GetMapping
    @PreAuthorize("hasPermission(null, 'carrera:ver')")
    public ResponseEntity<ApiResponse<List<CarreraResponseDto>>> getAllCarreras() {
        try {
            List<CarreraResponseDto> carreras = carreraService.getAllCarreras();
            return ResponseEntity.ok(ApiResponse.success(carreras, "Carreras obtenidas exitosamente"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Error al obtener carreras: " + e.getMessage()));
        }
    }

    @GetMapping("/paged")
    @PreAuthorize("hasPermission(null, 'carrera:ver')")
    public ResponseEntity<ApiResponse<PagedResponseDto<CarreraResponseDto>>> getAllCarrerasPaged(Pageable pageable) {
        try {
            Page<CarreraResponseDto> carreras = carreraService.getAllCarrerasPaged(pageable);
            PagedResponseDto<CarreraResponseDto> pagedResponse = PagedResponseDto.of(carreras);
            return ResponseEntity.ok(ApiResponse.success(pagedResponse, "Carreras obtenidas exitosamente"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Error al obtener carreras: " + e.getMessage()));
        }
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasPermission(null, 'carrera:ver')")
    public ResponseEntity<ApiResponse<CarreraResponseDto>> getCarreraById(@PathVariable Long id) {
        try {
            CarreraResponseDto carrera = carreraService.getCarreraById(id);
            return ResponseEntity.ok(ApiResponse.success(carrera, "Carrera obtenida exitosamente"));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Error al obtener carrera: " + e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasPermission(null, 'carrera:editar')")
    public ResponseEntity<ApiResponse<CarreraResponseDto>> updateCarrera(
            @PathVariable Long id,
            @Valid @RequestBody CarreraUpdateDto updateDto) {
        try {
            CarreraResponseDto carrera = carreraService.updateCarrera(id, updateDto);
            return ResponseEntity.ok(ApiResponse.success(carrera, "Carrera actualizada exitosamente"));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error("Error al actualizar carrera: " + e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasPermission(null, 'carrera:eliminar')")
    public ResponseEntity<ApiResponse<Void>> deleteCarrera(@PathVariable Long id) {
        try {
            carreraService.deleteCarrera(id);
            return ResponseEntity.ok(ApiResponse.success(null, "Carrera eliminada exitosamente"));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Error al eliminar carrera: " + e.getMessage()));
        }
    }

    @GetMapping("/search")
    @PreAuthorize("hasPermission(null, 'carrera:ver')")
    public ResponseEntity<ApiResponse<List<CarreraResponseDto>>> searchCarrerasByNombre(
            @RequestParam String nombre) {
        try {
            List<CarreraResponseDto> carreras = carreraService.searchCarrerasByNombre(nombre);
            return ResponseEntity.ok(ApiResponse.success(carreras, "Búsqueda completada exitosamente"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Error en la búsqueda: " + e.getMessage()));
        }
    }

    @GetMapping("/stats")
    @PreAuthorize("hasPermission(null, 'carrera:ver')")
    public ResponseEntity<ApiResponse<Object>> getCarreraStats() {
        try {
            Long totalCarreras = carreraService.getTotalCarreras();

            Map<String, Object> stats = new HashMap<>();
            stats.put("totalCarreras", totalCarreras);

            return ResponseEntity.ok(ApiResponse.success(stats, "Estadísticas obtenidas exitosamente"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Error al obtener estadísticas: " + e.getMessage()));
        }
    }
}
