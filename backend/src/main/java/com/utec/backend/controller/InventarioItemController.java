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
import java.util.Map;

@RestController
@RequestMapping("/api/v1/inventario")
@RequiredArgsConstructor
public class InventarioItemController {

    private final InventarioItemService inventarioItemService;

    @PostMapping
    @PreAuthorize("hasPermission(null, 'inventario:crear')")
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
    @PreAuthorize("hasPermission(null, 'inventario:ver')")
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
    @PreAuthorize("hasPermission(null, 'inventario:ver')")
    public ResponseEntity<ApiResponse<PagedResponseDto<InventarioItemResponseDto>>> getAllInventarioItemsPaged(
            Pageable pageable,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Long espacioId,
            @RequestParam(required = false) Long tipoElementoId,
            @RequestParam(required = false) String estado,
            @RequestParam(required = false) Boolean sinAsignar) {
        try {
            Page<InventarioItemResponseDto> inventarioItems = inventarioItemService.getAllInventarioItemsPagedWithFilters(
                pageable, search, espacioId, tipoElementoId, estado, sinAsignar);
            PagedResponseDto<InventarioItemResponseDto> pagedResponse = PagedResponseDto.of(inventarioItems);
            return ResponseEntity.ok(ApiResponse.success(pagedResponse, "Items de inventario obtenidos exitosamente"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Error al obtener items de inventario: " + e.getMessage()));
        }
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasPermission(null, 'inventario:ver')")
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
    @PreAuthorize("hasPermission(null, 'inventario:editar')")
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
    @PreAuthorize("hasPermission(null, 'inventario:eliminar')")
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
    @PreAuthorize("hasPermission(null, 'espacio:ver')")
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
    @PreAuthorize("hasPermission(null, 'inventario:ver')")
    public ResponseEntity<ApiResponse<List<InventarioItemResponseDto>>> getInventarioByTipoElemento(@PathVariable Long tipoElementoId) {
        try {
            List<InventarioItemResponseDto> inventarioItems = inventarioItemService.getInventarioByTipoElemento(tipoElementoId);
            return ResponseEntity.ok(ApiResponse.success(inventarioItems, "Inventario por tipo de elemento obtenido exitosamente"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Error al obtener inventario por tipo: " + e.getMessage()));
        }
    }

    @GetMapping("/estado/{estado}")
    @PreAuthorize("hasPermission(null, 'inventario:ver')")
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
    @PreAuthorize("hasPermission(null, 'estadisticas:ver_inventario')")
    public ResponseEntity<ApiResponse<Object>> getInventarioStats() {
        try {
            Map<String, Object> stats = inventarioItemService.getInventarioStatistics();
            return ResponseEntity.ok(ApiResponse.success(stats, "Estadísticas de inventario obtenidas exitosamente"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Error al obtener estadísticas: " + e.getMessage()));
        }
    }

    @GetMapping("/filter")
    @PreAuthorize("hasPermission(null, 'inventario:ver')")
    public ResponseEntity<ApiResponse<List<InventarioItemResponseDto>>> filterInventario(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Long espacioId,
            @RequestParam(required = false) Long tipoElementoId,
            @RequestParam(required = false) String estado,
            @RequestParam(required = false) Boolean sinAsignar,
            @RequestParam(required = false) String sortBy,
            @RequestParam(required = false) String sortDir) {
        try {
            List<InventarioItemResponseDto> items = inventarioItemService.filterInventario(
                search, espacioId, tipoElementoId, estado, sinAsignar, sortBy, sortDir);
            return ResponseEntity.ok(ApiResponse.success(items, "Filtros aplicados exitosamente"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Error al aplicar filtros: " + e.getMessage()));
        }
    }
}
