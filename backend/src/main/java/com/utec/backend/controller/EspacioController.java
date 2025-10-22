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
import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/v1/espacios")
@RequiredArgsConstructor
public class EspacioController {
    
    private final EspacioService espacioService;
    
    @PostMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('ANALISTA')")
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
    @PreAuthorize("hasRole('ADMIN') or hasRole('ANALISTA')")
    public ResponseEntity<ApiResponse<List<EspacioResponseDto>>> getAllEspacios() {
        try {
            List<EspacioResponseDto> espacios = espacioService.getAllEspacios();
            return ResponseEntity.ok(ApiResponse.success(espacios, "Espacios obtenidos exitosamente"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Error al obtener espacios: " + e.getMessage()));
        }
    }
    
    @GetMapping("/paged")
    @PreAuthorize("hasRole('ADMIN') or hasRole('ANALISTA')")
    public ResponseEntity<ApiResponse<PagedResponseDto<EspacioResponseDto>>> getAllEspaciosPaged(Pageable pageable) {
        try {
            Page<EspacioResponseDto> espacios = espacioService.getAllEspaciosPaged(pageable);
            PagedResponseDto<EspacioResponseDto> pagedResponse = PagedResponseDto.of(espacios);
            return ResponseEntity.ok(ApiResponse.success(pagedResponse, "Espacios obtenidos exitosamente"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Error al obtener espacios: " + e.getMessage()));
        }
    }
    
    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('ANALISTA')")
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
    @PreAuthorize("hasRole('ADMIN') or hasRole('ANALISTA')")
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
    @PreAuthorize("hasRole('ADMIN')")
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
    @PreAuthorize("hasRole('ADMIN') or hasRole('ANALISTA')")
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
    @PreAuthorize("hasRole('ADMIN') or hasRole('ANALISTA')")
    public ResponseEntity<ApiResponse<List<EspacioResponseDto>>> filterEspacios(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Long tipoEspacioId,
            @RequestParam(required = false) Integer capacidadMin,
            @RequestParam(required = false) Integer capacidadMax,
            @RequestParam(required = false) List<Long> tipoElementoIds,
            @RequestParam(required = false) List<Integer> cantidadMins,
            @RequestParam(required = false) List<Integer> cantidadMaxs) {
        try {
            List<EspacioResponseDto> espacios = espacioService.filterEspacios(
                search, tipoEspacioId, capacidadMin, capacidadMax, 
                tipoElementoIds, cantidadMins, cantidadMaxs);
            return ResponseEntity.ok(ApiResponse.success(espacios, "Filtros aplicados exitosamente"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Error al aplicar filtros: " + e.getMessage()));
        }
    }
    
    @GetMapping("/capacidad/{capacidadMinima}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('ANALISTA')")
    public ResponseEntity<ApiResponse<List<EspacioResponseDto>>> getEspaciosByCapacidadMinima(
            @PathVariable Integer capacidadMinima) {
        try {
            List<EspacioResponseDto> espacios = espacioService.getEspaciosByCapacidadMinima(capacidadMinima);
            return ResponseEntity.ok(ApiResponse.success(espacios, "Espacios obtenidos exitosamente"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Error al obtener espacios: " + e.getMessage()));
        }
    }
    
    @GetMapping("/disponibles")
    @PreAuthorize("hasRole('ADMIN') or hasRole('ANALISTA') or hasRole('DOCENTE')")
    public ResponseEntity<ApiResponse<List<EspacioResponseDto>>> getEspaciosDisponibles(
            @RequestParam LocalDateTime inicio,
            @RequestParam LocalDateTime fin) {
        try {
            List<EspacioResponseDto> espacios = espacioService.getEspaciosDisponibles(inicio, fin);
            return ResponseEntity.ok(ApiResponse.success(espacios, "Espacios disponibles obtenidos exitosamente"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Error al obtener espacios disponibles: " + e.getMessage()));
        }
    }
    
    @GetMapping("/stats")
    @PreAuthorize("hasRole('ADMIN') or hasRole('ANALISTA')")
    public ResponseEntity<ApiResponse<Object>> getEspacioStats() {
        try {
            Long totalEspacios = espacioService.getTotalEspacios();
            Double capacidadPromedio = espacioService.getCapacidadPromedio();
            Integer capacidadMaxima = espacioService.getCapacidadMaxima();
            Integer capacidadMinima = espacioService.getCapacidadMinima();
            
            // Crear un Map para las estadísticas
            java.util.Map<String, Object> stats = new java.util.HashMap<>();
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
