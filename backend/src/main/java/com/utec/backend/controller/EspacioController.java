package com.utec.backend.controller;

import com.utec.backend.common.ApiResponse;
import com.utec.backend.dto.common.PagedResponseDto;
import com.utec.backend.dto.espacio.EspacioCreateDto;
import com.utec.backend.dto.espacio.EspacioResponseDto;
import com.utec.backend.dto.espacio.EspacioUpdateDto;
import com.utec.backend.service.EspacioService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/espacios")
@RequiredArgsConstructor
public class EspacioController {

    private static final String MSG_ESPACIOS_OBTENIDOS = "Espacios obtenidos exitosamente";
    private static final String MSG_ERROR_OBTENER_ESPACIOS = "Error al obtener espacios: ";

    private final EspacioService espacioService;

    @PostMapping
    @PreAuthorize("hasPermission(null, 'espacio:crear')")
    public ResponseEntity<ApiResponse<EspacioResponseDto>> createEspacio(
            @Valid @RequestBody EspacioCreateDto createDto) {
        try {
            EspacioResponseDto espacio = espacioService.createEspacio(createDto);
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ApiResponse.success(espacio, "Espacio creado exitosamente"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error("Error al crear espacio: " + e.getMessage()));
        }
    }

    @GetMapping
    @PreAuthorize("hasPermission(null, 'espacio:ver')")
    public ResponseEntity<ApiResponse<List<EspacioResponseDto>>> getAllEspacios() {
        try {
            List<EspacioResponseDto> espacios = espacioService.getAllEspacios();
            return ResponseEntity.ok(ApiResponse.success(espacios, MSG_ESPACIOS_OBTENIDOS));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error(MSG_ERROR_OBTENER_ESPACIOS + e.getMessage()));
        }
    }

    @GetMapping("/paged")
    @PreAuthorize("hasPermission(null, 'espacio:ver')")
    public ResponseEntity<ApiResponse<PagedResponseDto<EspacioResponseDto>>> getAllEspaciosPaged(Pageable pageable) {
        try {
            Page<EspacioResponseDto> espacios = espacioService.getAllEspaciosPaged(pageable);
            PagedResponseDto<EspacioResponseDto> pagedResponse = PagedResponseDto.of(espacios);
            return ResponseEntity.ok(ApiResponse.success(pagedResponse, MSG_ESPACIOS_OBTENIDOS));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error(MSG_ERROR_OBTENER_ESPACIOS + e.getMessage()));
        }
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasPermission(null, 'espacio:ver')")
    public ResponseEntity<ApiResponse<EspacioResponseDto>> getEspacioById(@PathVariable Long id) {
        try {
            EspacioResponseDto espacio = espacioService.getEspacioById(id);
            return ResponseEntity.ok(ApiResponse.success(espacio, "Espacio obtenido exitosamente"));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Error al obtener espacio: " + e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasPermission(null, 'espacio:editar')")
    public ResponseEntity<ApiResponse<EspacioResponseDto>> updateEspacio(
            @PathVariable Long id,
            @Valid @RequestBody EspacioUpdateDto updateDto) {
        try {
            EspacioResponseDto espacio = espacioService.updateEspacio(id, updateDto);
            return ResponseEntity.ok(ApiResponse.success(espacio, "Espacio actualizado exitosamente"));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error("Error al actualizar espacio: " + e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasPermission(null, 'espacio:eliminar')")
    public ResponseEntity<ApiResponse<Void>> deleteEspacio(@PathVariable Long id) {
        try {
            espacioService.deleteEspacio(id);
            return ResponseEntity.ok(ApiResponse.success(null, "Espacio eliminado exitosamente"));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Error al eliminar espacio: " + e.getMessage()));
        }
    }

    @GetMapping("/search")
    @PreAuthorize("hasPermission(null, 'espacio:ver')")
    public ResponseEntity<ApiResponse<List<EspacioResponseDto>>> searchEspaciosByNombre(
            @RequestParam String nombre) {
        try {
            List<EspacioResponseDto> espacios = espacioService.getEspaciosByNombre(nombre);
            return ResponseEntity.ok(ApiResponse.success(espacios, "Búsqueda completada exitosamente"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Error en la búsqueda: " + e.getMessage()));
        }
    }

    @GetMapping("/filter")
    @PreAuthorize("hasPermission(null, 'espacio:ver')")
    public ResponseEntity<ApiResponse<List<EspacioResponseDto>>> filterEspacios(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Long tipoEspacioId,
            @RequestParam(required = false) Long edificioId,
            @RequestParam(required = false) Integer capacidadMin,
            @RequestParam(required = false) Integer capacidadMax,
            @RequestParam(required = false) String estado,
            @RequestParam(required = false) List<Long> tipoElementoIds,
            @RequestParam(required = false) List<Integer> cantidadMins,
            @RequestParam(required = false) List<Integer> cantidadMaxs) {
        try {
            List<EspacioResponseDto> espacios = espacioService.filterEspacios(
                search, tipoEspacioId, edificioId, capacidadMin, capacidadMax, estado,
                tipoElementoIds, cantidadMins, cantidadMaxs);
            return ResponseEntity.ok(ApiResponse.success(espacios, "Filtros aplicados exitosamente"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Error al aplicar filtros: " + e.getMessage()));
        }
    }

    @GetMapping("/capacidad/{capacidadMinima}")
    @PreAuthorize("hasPermission(null, 'espacio:ver')")
    public ResponseEntity<ApiResponse<List<EspacioResponseDto>>> getEspaciosByCapacidadMinima(
            @PathVariable Integer capacidadMinima) {
        try {
            List<EspacioResponseDto> espacios = espacioService.getEspaciosByCapacidadMinima(capacidadMinima);
            return ResponseEntity.ok(ApiResponse.success(espacios, MSG_ESPACIOS_OBTENIDOS));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error(MSG_ERROR_OBTENER_ESPACIOS + e.getMessage()));
        }
    }

    @GetMapping("/disponibles")
    @PreAuthorize("hasPermission(null, 'espacio:ver')")
    public ResponseEntity<ApiResponse<List<EspacioResponseDto>>> getEspaciosDisponibles(
            @RequestParam Instant inicio,
            @RequestParam Instant fin) {
        try {
            List<EspacioResponseDto> espacios = espacioService.getEspaciosDisponibles(inicio, fin);
            return ResponseEntity.ok(ApiResponse.success(espacios, "Espacios disponibles obtenidos exitosamente"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Error al obtener espacios disponibles: " + e.getMessage()));
        }
    }

    @GetMapping("/stats")
    @PreAuthorize("hasPermission(null, 'espacio:ver')")
    public ResponseEntity<ApiResponse<Object>> getEspacioStats() {
        try {
            Long totalEspacios = espacioService.getTotalEspacios();
            Double capacidadPromedio = espacioService.getCapacidadPromedio();
            Integer capacidadMaxima = espacioService.getCapacidadMaxima();
            Integer capacidadMinima = espacioService.getCapacidadMinima();

            // Crear un Map para las estadísticas
            Map<String, Object> stats = new HashMap<>();
            stats.put("totalEspacios", totalEspacios);
            stats.put("capacidadPromedio", capacidadPromedio);
            stats.put("capacidadMaxima", capacidadMaxima);
            stats.put("capacidadMinima", capacidadMinima);

            return ResponseEntity.ok(ApiResponse.success(stats, "Estadísticas obtenidas exitosamente"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Error al obtener estadísticas: " + e.getMessage()));
        }
    }
}
