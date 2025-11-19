package com.utec.backend.controller;

import com.utec.backend.common.ApiResponse;
import com.utec.backend.dto.common.PagedResponseDto;
import com.utec.backend.dto.tipo_elemento.TipoElementoCreateDto;
import com.utec.backend.dto.tipo_elemento.TipoElementoResponseDto;
import com.utec.backend.dto.tipo_elemento.TipoElementoUpdateDto;
import com.utec.backend.service.TipoElementoService;
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
@RequestMapping("/api/v1/tipos-elemento")
@RequiredArgsConstructor
public class TipoElementoController {
    
    private final TipoElementoService tipoElementoService;
    
    @PostMapping
    @PreAuthorize("hasRole('" + ROLE_ADMIN + "') or hasRole('" + ROLE_MANTENIMIENTO + "')")
    public ResponseEntity<ApiResponse<TipoElementoResponseDto>> createTipoElemento(
            @Valid @RequestBody TipoElementoCreateDto createDto) {
        try {
            TipoElementoResponseDto tipoElemento = tipoElementoService.createTipoElemento(createDto);
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ApiResponse.success(tipoElemento, "Tipo de elemento creado exitosamente"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error("Error al crear tipo de elemento: " + e.getMessage()));
        }
    }
    
    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<List<TipoElementoResponseDto>>> getAllTiposElemento() {
        try {
            List<TipoElementoResponseDto> tiposElemento = tipoElementoService.getAllTiposElemento();
            return ResponseEntity.ok(ApiResponse.success(tiposElemento, "Tipos de elemento obtenidos exitosamente"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Error al obtener tipos de elemento: " + e.getMessage()));
        }
    }
    
    @GetMapping("/paged")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<PagedResponseDto<TipoElementoResponseDto>>> getAllTiposElementoPaged(Pageable pageable) {
        try {
            Page<TipoElementoResponseDto> tiposElemento = tipoElementoService.getAllTiposElementoPaged(pageable);
            PagedResponseDto<TipoElementoResponseDto> pagedResponse = PagedResponseDto.of(tiposElemento);
            return ResponseEntity.ok(ApiResponse.success(pagedResponse, "Tipos de elemento obtenidos exitosamente"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Error al obtener tipos de elemento: " + e.getMessage()));
        }
    }
    
    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<TipoElementoResponseDto>> getTipoElementoById(@PathVariable Long id) {
        try {
            TipoElementoResponseDto tipoElemento = tipoElementoService.getTipoElementoById(id);
            return ResponseEntity.ok(ApiResponse.success(tipoElemento, "Tipo de elemento obtenido exitosamente"));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Error al obtener tipo de elemento: " + e.getMessage()));
        }
    }
    
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('" + ROLE_ADMIN + "') or hasRole('" + ROLE_MANTENIMIENTO + "')")
    public ResponseEntity<ApiResponse<TipoElementoResponseDto>> updateTipoElemento(
            @PathVariable Long id,
            @Valid @RequestBody TipoElementoUpdateDto updateDto) {
        try {
            TipoElementoResponseDto tipoElemento = tipoElementoService.updateTipoElemento(id, updateDto);
            return ResponseEntity.ok(ApiResponse.success(tipoElemento, "Tipo de elemento actualizado exitosamente"));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error("Error al actualizar tipo de elemento: " + e.getMessage()));
        }
    }
    
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('" + ROLE_ADMIN + "')")
    public ResponseEntity<ApiResponse<Void>> deleteTipoElemento(@PathVariable Long id) {
        try {
            tipoElementoService.deleteTipoElemento(id);
            return ResponseEntity.ok(ApiResponse.success(null, "Tipo de elemento eliminado exitosamente"));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Error al eliminar tipo de elemento: " + e.getMessage()));
        }
    }
    
    @PutMapping("/{id}/toggle-activo")
    @PreAuthorize("hasRole('" + ROLE_ADMIN + "')")
    public ResponseEntity<ApiResponse<TipoElementoResponseDto>> toggleActivo(@PathVariable Long id) {
        try {
            TipoElementoResponseDto tipoElemento = tipoElementoService.toggleActivo(id);
            return ResponseEntity.ok(ApiResponse.success(tipoElemento, "Estado del tipo de elemento actualizado exitosamente"));
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
    public ResponseEntity<ApiResponse<List<TipoElementoResponseDto>>> searchTiposElementoByNombre(
            @RequestParam String nombre) {
        try {
            List<TipoElementoResponseDto> tiposElemento = tipoElementoService.searchTiposElementoByNombre(nombre);
            return ResponseEntity.ok(ApiResponse.success(tiposElemento, "Búsqueda completada exitosamente"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Error en la búsqueda: " + e.getMessage()));
        }
    }
    
    @GetMapping("/mas-utilizados")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<List<TipoElementoResponseDto>>> getTiposMasUtilizados() {
        try {
            List<TipoElementoResponseDto> tiposElemento = tipoElementoService.getTiposMasUtilizados();
            return ResponseEntity.ok(ApiResponse.success(tiposElemento, "Tipos más utilizados obtenidos exitosamente"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Error al obtener tipos más utilizados: " + e.getMessage()));
        }
    }
    
    @GetMapping("/stats")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Object>> getTipoElementoStats() {
        try {
            Long totalTipos = tipoElementoService.getTotalTiposElemento();
            
            Map<String, Object> stats = new HashMap<>();
            stats.put("totalTipos", totalTipos);
            
            return ResponseEntity.ok(ApiResponse.success(stats, "Estadísticas obtenidas exitosamente"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Error al obtener estadísticas: " + e.getMessage()));
        }
    }
}
