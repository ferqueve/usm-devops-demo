package com.utec.backend.controller;

import com.utec.backend.common.ApiResponse;
import com.utec.backend.dto.common.PagedResponseDto;
import com.utec.backend.dto.tipo_espacio.TipoEspacioCreateDto;
import com.utec.backend.dto.tipo_espacio.TipoEspacioResponseDto;
import com.utec.backend.dto.tipo_espacio.TipoEspacioUpdateDto;
import com.utec.backend.service.TipoEspacioService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static com.utec.backend.security.Constants.*;

@RestController
@RequestMapping("/api/v1/tipos-espacio")
@RequiredArgsConstructor
public class TipoEspacioController {
    
    private final TipoEspacioService tipoEspacioService;
    
    @PostMapping
    @PreAuthorize("hasRole('" + ROLE_ADMIN + "') or hasRole('" + ROLE_MANTENIMIENTO + "')")
    public ResponseEntity<ApiResponse<TipoEspacioResponseDto>> createTipoEspacio(
            @Valid @RequestBody TipoEspacioCreateDto createDto) {
        try {
            TipoEspacioResponseDto tipoEspacio = tipoEspacioService.createTipoEspacio(createDto);
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ApiResponse.success(tipoEspacio, "Tipo de espacio creado exitosamente"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error("Error al crear tipo de espacio: " + e.getMessage()));
        }
    }
    
    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<List<TipoEspacioResponseDto>>> getAllTiposEspacio() {
        try {
            List<TipoEspacioResponseDto> tiposEspacio = tipoEspacioService.getAllTiposEspacio();
            return ResponseEntity.ok(ApiResponse.success(tiposEspacio, "Tipos de espacio obtenidos exitosamente"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Error al obtener tipos de espacio: " + e.getMessage()));
        }
    }
    
    @GetMapping("/paged")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<PagedResponseDto<TipoEspacioResponseDto>>> getAllTiposEspacioPaged(Pageable pageable) {
        try {
            Page<TipoEspacioResponseDto> tiposEspacio = tipoEspacioService.getAllTiposEspacioPaged(pageable);
            PagedResponseDto<TipoEspacioResponseDto> pagedResponse = PagedResponseDto.of(tiposEspacio);
            return ResponseEntity.ok(ApiResponse.success(pagedResponse, "Tipos de espacio obtenidos exitosamente"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Error al obtener tipos de espacio: " + e.getMessage()));
        }
    }
    
    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<TipoEspacioResponseDto>> getTipoEspacioById(@PathVariable Long id) {
        try {
            TipoEspacioResponseDto tipoEspacio = tipoEspacioService.getTipoEspacioById(id);
            return ResponseEntity.ok(ApiResponse.success(tipoEspacio, "Tipo de espacio obtenido exitosamente"));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Error al obtener tipo de espacio: " + e.getMessage()));
        }
    }
    
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('" + ROLE_ADMIN + "') or hasRole('" + ROLE_MANTENIMIENTO + "')")
    public ResponseEntity<ApiResponse<TipoEspacioResponseDto>> updateTipoEspacio(
            @PathVariable Long id,
            @Valid @RequestBody TipoEspacioUpdateDto updateDto) {
        try {
            TipoEspacioResponseDto tipoEspacio = tipoEspacioService.updateTipoEspacio(id, updateDto);
            return ResponseEntity.ok(ApiResponse.success(tipoEspacio, "Tipo de espacio actualizado exitosamente"));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error("Error al actualizar tipo de espacio: " + e.getMessage()));
        }
    }
    
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('" + ROLE_ADMIN + "')")
    public ResponseEntity<ApiResponse<Void>> deleteTipoEspacio(@PathVariable Long id) {
        try {
            tipoEspacioService.deleteTipoEspacio(id);
            return ResponseEntity.ok(ApiResponse.success(null, "Tipo de espacio eliminado exitosamente"));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Error al eliminar tipo de espacio: " + e.getMessage()));
        }
    }
    
    @PutMapping("/{id}/toggle-activo")
    @PreAuthorize("hasRole('" + ROLE_ADMIN + "')")
    public ResponseEntity<ApiResponse<TipoEspacioResponseDto>> toggleActivo(@PathVariable Long id) {
        try {
            TipoEspacioResponseDto tipoEspacio = tipoEspacioService.toggleActivo(id);
            return ResponseEntity.ok(ApiResponse.success(tipoEspacio, "Estado del tipo de espacio actualizado exitosamente"));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Error al actualizar estado: " + e.getMessage()));
        }
    }
    
    @GetMapping("/search")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<List<TipoEspacioResponseDto>>> searchTiposEspacioByNombre(
            @RequestParam String nombre) {
        try {
            List<TipoEspacioResponseDto> tiposEspacio = tipoEspacioService.searchTiposEspacioByNombre(nombre);
            return ResponseEntity.ok(ApiResponse.success(tiposEspacio, "Búsqueda completada exitosamente"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Error en la búsqueda: " + e.getMessage()));
        }
    }
    
    @GetMapping("/mas-utilizados")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<List<TipoEspacioResponseDto>>> getTiposMasUtilizados() {
        try {
            List<TipoEspacioResponseDto> tiposEspacio = tipoEspacioService.getTiposMasUtilizados();
            return ResponseEntity.ok(ApiResponse.success(tiposEspacio, "Tipos más utilizados obtenidos exitosamente"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Error al obtener tipos más utilizados: " + e.getMessage()));
        }
    }
    
    @GetMapping("/stats")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Object>> getTipoEspacioStats() {
        try {
            Long totalTipos = tipoEspacioService.getTotalTiposEspacio();
            
            Map<String, Object> stats = new HashMap<>();
            stats.put("totalTipos", totalTipos);
            
            return ResponseEntity.ok(ApiResponse.success(stats, "Estadísticas obtenidas exitosamente"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Error al obtener estadísticas: " + e.getMessage()));
        }
    }
}
