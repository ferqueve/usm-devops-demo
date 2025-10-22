package com.utec.backend.controller;

import com.utec.backend.common.ApiResponse;
import com.utec.backend.dto.common.PagedResponseDto;
import com.utec.backend.dto.inventario.InventarioItemCreateDto;
import com.utec.backend.dto.inventario.InventarioItemResponseDto;
import com.utec.backend.dto.inventario.InventarioItemUpdateDto;
import com.utec.backend.service.InventarioItemService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.List;

@RestController
@RequestMapping("/api/v1/inventario")
@RequiredArgsConstructor
public class InventarioItemController {
    
    private final InventarioItemService inventarioItemService;
    
    @PostMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('ANALISTA')")
    public ResponseEntity<ApiResponse<InventarioItemResponseDto>> createInventarioItem(
            @Valid @RequestBody InventarioItemCreateDto createDto) {
        try {
            InventarioItemResponseDto inventarioItem = inventarioItemService.createInventarioItem(createDto);
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ApiResponse.success(inventarioItem, "Item de inventario creado exitosamente"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error("Error al crear item de inventario: " + e.getMessage()));
        }
    }
    
    @GetMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('ANALISTA')")
    public ResponseEntity<ApiResponse<List<InventarioItemResponseDto>>> getAllInventarioItems() {
        try {
            List<InventarioItemResponseDto> inventarioItems = inventarioItemService.getAllInventarioItems();
            return ResponseEntity.ok(ApiResponse.success(inventarioItems, "Items de inventario obtenidos exitosamente"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Error al obtener items de inventario: " + e.getMessage()));
        }
    }
    
    @GetMapping("/paged")
    @PreAuthorize("hasRole('ADMIN') or hasRole('ANALISTA')")
    public ResponseEntity<ApiResponse<PagedResponseDto<InventarioItemResponseDto>>> getAllInventarioItemsPaged(Pageable pageable) {
        try {
            Page<InventarioItemResponseDto> inventarioItems = inventarioItemService.getAllInventarioItemsPaged(pageable);
            PagedResponseDto<InventarioItemResponseDto> pagedResponse = PagedResponseDto.of(inventarioItems);
            return ResponseEntity.ok(ApiResponse.success(pagedResponse, "Items de inventario obtenidos exitosamente"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Error al obtener items de inventario: " + e.getMessage()));
        }
    }
    
    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('ANALISTA')")
    public ResponseEntity<ApiResponse<InventarioItemResponseDto>> getInventarioItemById(@PathVariable Long id) {
        try {
            InventarioItemResponseDto inventarioItem = inventarioItemService.getInventarioItemById(id);
            return ResponseEntity.ok(ApiResponse.success(inventarioItem, "Item de inventario obtenido exitosamente"));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Error al obtener item de inventario: " + e.getMessage()));
        }
    }
    
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('ANALISTA')")
    public ResponseEntity<ApiResponse<InventarioItemResponseDto>> updateInventarioItem(
            @PathVariable Long id,
            @Valid @RequestBody InventarioItemUpdateDto updateDto) {
        try {
            InventarioItemResponseDto inventarioItem = inventarioItemService.updateInventarioItem(id, updateDto);
            return ResponseEntity.ok(ApiResponse.success(inventarioItem, "Item de inventario actualizado exitosamente"));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error("Error al actualizar item de inventario: " + e.getMessage()));
        }
    }
    
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteInventarioItem(@PathVariable Long id) {
        try {
            inventarioItemService.deleteInventarioItem(id);
            return ResponseEntity.ok(ApiResponse.success(null, "Item de inventario eliminado exitosamente"));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Error al eliminar item de inventario: " + e.getMessage()));
        }
    }
    
    @GetMapping("/espacio/{espacioId}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('ANALISTA')")
    public ResponseEntity<ApiResponse<List<InventarioItemResponseDto>>> getInventarioByEspacio(@PathVariable Long espacioId) {
        try {
            List<InventarioItemResponseDto> inventarioItems = inventarioItemService.getInventarioByEspacio(espacioId);
            return ResponseEntity.ok(ApiResponse.success(inventarioItems, "Inventario del espacio obtenido exitosamente"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Error al obtener inventario del espacio: " + e.getMessage()));
        }
    }
    
    @GetMapping("/tipo-elemento/{tipoElementoId}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('ANALISTA')")
    public ResponseEntity<ApiResponse<List<InventarioItemResponseDto>>> getInventarioByTipoElemento(@PathVariable Long tipoElementoId) {
        try {
            List<InventarioItemResponseDto> inventarioItems = inventarioItemService.getInventarioByTipoElemento(tipoElementoId);
            return ResponseEntity.ok(ApiResponse.success(inventarioItems, "Inventario por tipo de elemento obtenido exitosamente"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Error al obtener inventario por tipo: " + e.getMessage()));
        }
    }
    
    @GetMapping("/search/marca")
    @PreAuthorize("hasRole('ADMIN') or hasRole('ANALISTA')")
    public ResponseEntity<ApiResponse<List<InventarioItemResponseDto>>> searchInventarioByMarca(
            @RequestParam String marca) {
        try {
            List<InventarioItemResponseDto> inventarioItems = inventarioItemService.searchInventarioByMarca(marca);
            return ResponseEntity.ok(ApiResponse.success(inventarioItems, "Búsqueda por marca completada exitosamente"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Error en la búsqueda por marca: " + e.getMessage()));
        }
    }
    
    @GetMapping("/search/modelo")
    @PreAuthorize("hasRole('ADMIN') or hasRole('ANALISTA')")
    public ResponseEntity<ApiResponse<List<InventarioItemResponseDto>>> searchInventarioByModelo(
            @RequestParam String modelo) {
        try {
            List<InventarioItemResponseDto> inventarioItems = inventarioItemService.searchInventarioByModelo(modelo);
            return ResponseEntity.ok(ApiResponse.success(inventarioItems, "Búsqueda por modelo completada exitosamente"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Error en la búsqueda por modelo: " + e.getMessage()));
        }
    }
    
    @GetMapping("/estado/{estado}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('ANALISTA')")
    public ResponseEntity<ApiResponse<List<InventarioItemResponseDto>>> getInventarioByEstado(@PathVariable String estado) {
        try {
            List<InventarioItemResponseDto> inventarioItems = inventarioItemService.getInventarioByEstado(estado);
            return ResponseEntity.ok(ApiResponse.success(inventarioItems, "Inventario por estado obtenido exitosamente"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Error al obtener inventario por estado: " + e.getMessage()));
        }
    }
    
    @GetMapping("/stats")
    @PreAuthorize("hasRole('ADMIN') or hasRole('ANALISTA')")
    public ResponseEntity<ApiResponse<Object>> getInventarioStats() {
        try {
            Long totalItems = inventarioItemService.getTotalInventarioItems();
            java.math.BigDecimal valorPromedio = inventarioItemService.getValorPromedioInventario();
            java.math.BigDecimal valorTotal = inventarioItemService.getValorTotalInventario();
            
            java.util.Map<String, Object> stats = new java.util.HashMap<>();
            stats.put("totalItems", totalItems);
            stats.put("valorPromedio", valorPromedio);
            stats.put("valorTotal", valorTotal);
            
            return ResponseEntity.ok(ApiResponse.success(stats, "Estadísticas de inventario obtenidas exitosamente"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Error al obtener estadísticas: " + e.getMessage()));
        }
    }
}
