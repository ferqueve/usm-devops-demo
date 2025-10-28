package com.utec.backend.service;

import com.utec.backend.dto.inventario.InventarioItemCreateDto;
import com.utec.backend.dto.inventario.InventarioItemResponseDto;
import com.utec.backend.dto.inventario.InventarioItemUpdateDto;
import com.utec.backend.model.Espacio;
import com.utec.backend.model.InventarioItem;
import com.utec.backend.model.TipoElemento;
import com.utec.backend.repository.EspacioRepository;
import com.utec.backend.repository.InventarioItemRepository;
import com.utec.backend.repository.TipoElementoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class InventarioItemService {
    
    private final InventarioItemRepository inventarioItemRepository;
    private final EspacioRepository espacioRepository;
    private final TipoElementoRepository tipoElementoRepository;
    
    public InventarioItemResponseDto createInventarioItem(InventarioItemCreateDto createDto) {
        // Verificar que el espacio existe (si se proporciona)
        Espacio espacio = null;
        if (createDto.getEspacioId() != null && createDto.getEspacioId() > 0) {
            espacio = espacioRepository.findById(createDto.getEspacioId())
                    .orElseThrow(() -> new RuntimeException("Espacio no encontrado con ID: " + createDto.getEspacioId()));
        }
        
        // Verificar que el tipo de elemento existe
        TipoElemento tipoElemento = tipoElementoRepository.findById(createDto.getTipoElementoId())
                .orElseThrow(() -> new RuntimeException("Tipo de elemento no encontrado con ID: " + createDto.getTipoElementoId()));
        
        InventarioItem inventarioItem = new InventarioItem();
        inventarioItem.setEspacio(espacio);
        inventarioItem.setTipoElemento(tipoElemento);
        inventarioItem.setCantidad(createDto.getCantidad());
        inventarioItem.setEstado(createDto.getEstado());
        inventarioItem.setObservaciones(createDto.getObservaciones());
        inventarioItem.setActivo(true);
        
        InventarioItem savedItem = inventarioItemRepository.save(inventarioItem);
        return mapToResponseDto(savedItem);
    }
    
    @Transactional(readOnly = true)
    public List<InventarioItemResponseDto> getAllInventarioItems() {
        return inventarioItemRepository.findAll().stream()
                .map(this::mapToResponseDto)
                .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public Page<InventarioItemResponseDto> getAllInventarioItemsPaged(Pageable pageable) {
        return inventarioItemRepository.findAll(pageable)
                .map(this::mapToResponseDto);
    }
    
    @Transactional(readOnly = true)
    public Page<InventarioItemResponseDto> getAllInventarioItemsPagedWithFilters(
            Pageable pageable,
            String search,
            Long espacioId,
            Long tipoElementoId,
            String estado,
            Boolean sinAsignar) {
        
        Specification<InventarioItem> spec = (root, query, cb) -> cb.conjunction();
        
        // Filtro por espacio
        if (espacioId != null) {
            Specification<InventarioItem> espacioSpec = (root, query, cb) -> 
                cb.equal(root.get("espacio").get("id"), espacioId);
            spec = spec.and(espacioSpec);
        }
        
        // Filtro "Sin Asignar" - items que tienen espacio_id = null
        if (Boolean.TRUE.equals(sinAsignar)) {
            Specification<InventarioItem> sinAsignarSpec = (root, query, cb) -> 
                cb.isNull(root.get("espacio"));
            spec = spec.and(sinAsignarSpec);
        }
        
        // Filtro por tipo de elemento
        if (tipoElementoId != null) {
            Specification<InventarioItem> tipoSpec = (root, query, cb) -> 
                cb.equal(root.get("tipoElemento").get("id"), tipoElementoId);
            spec = spec.and(tipoSpec);
        }
        
        // Filtro por estado
        if (estado != null && !estado.isEmpty()) {
            Specification<InventarioItem> estadoSpec = (root, query, cb) -> 
                cb.equal(root.get("estado"), estado);
            spec = spec.and(estadoSpec);
        }
        
        // Solo items activos
        Specification<InventarioItem> activoSpec = (root, query, cb) -> 
            cb.equal(root.get("activo"), true);
        spec = spec.and(activoSpec);
        
        return inventarioItemRepository.findAll(spec, pageable)
                .map(this::mapToResponseDto);
    }
    
    @Transactional(readOnly = true)
    public InventarioItemResponseDto getInventarioItemById(Long id) {
        InventarioItem inventarioItem = inventarioItemRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Item de inventario no encontrado con ID: " + id));
        return mapToResponseDto(inventarioItem);
    }
    
    public InventarioItemResponseDto updateInventarioItem(Long id, InventarioItemUpdateDto updateDto) {
        InventarioItem inventarioItem = inventarioItemRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Item de inventario no encontrado con ID: " + id));
        
        // Verificar que el espacio existe (si se proporciona para actualizar)
        if (updateDto.getEspacioId() != null) {
            Espacio espacio = null;
            if (updateDto.getEspacioId() > 0) {
                espacio = espacioRepository.findById(updateDto.getEspacioId())
                        .orElseThrow(() -> new RuntimeException("Espacio no encontrado con ID: " + updateDto.getEspacioId()));
            }
            // Si espacioId es null o 0, se establece como null (desasignado)
            inventarioItem.setEspacio(espacio);
        }
        
        // Verificar que el tipo de elemento existe
        TipoElemento tipoElemento = tipoElementoRepository.findById(updateDto.getTipoElementoId())
                .orElseThrow(() -> new RuntimeException("Tipo de elemento no encontrado con ID: " + updateDto.getTipoElementoId()));
        
        inventarioItem.setTipoElemento(tipoElemento);
        inventarioItem.setCantidad(updateDto.getCantidad());
        inventarioItem.setEstado(updateDto.getEstado());
        inventarioItem.setObservaciones(updateDto.getObservaciones());
        inventarioItem.setUpdatedAt(LocalDateTime.now());
        
        InventarioItem updatedItem = inventarioItemRepository.save(inventarioItem);
        return mapToResponseDto(updatedItem);
    }
    
    public void deleteInventarioItem(Long id) {
        if (!inventarioItemRepository.existsById(id)) {
            throw new RuntimeException("Item de inventario no encontrado con ID: " + id);
        }
        inventarioItemRepository.deleteById(id);
    }
    
    @Transactional(readOnly = true)
    public List<InventarioItemResponseDto> getInventarioByEspacio(Long espacioId) {
        return inventarioItemRepository.findByEspacioIdAndActivoTrue(espacioId).stream()
                .map(this::mapToResponseDto)
                .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public List<InventarioItemResponseDto> getInventarioByTipoElemento(Long tipoElementoId) {
        return inventarioItemRepository.findByTipoElementoIdAndActivoTrue(tipoElementoId).stream()
                .map(this::mapToResponseDto)
                .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public List<InventarioItemResponseDto> getInventarioByEstado(String estado) {
        return inventarioItemRepository.findByEstadoAndActivoTrue(estado).stream()
                .map(this::mapToResponseDto)
                .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public Long getTotalInventarioItems() {
        return inventarioItemRepository.countTotalItems();
    }
    
    @Transactional(readOnly = true)
    public Map<String, Object> getInventarioStatistics() {
        Map<String, Object> stats = new HashMap<>();
        
        // Total de items
        Long totalItems = getTotalInventarioItems();
        stats.put("totalItems", totalItems);
        
        // Items por estado
        List<InventarioItem> allItems = inventarioItemRepository.findAll();
        long disponibles = allItems.stream()
                .filter(item -> item.getActivo() && item.getEstado().equals("DISPONIBLE"))
                .count();
        long mantenimiento = allItems.stream()
                .filter(item -> item.getActivo() && item.getEstado().equals("MANTENIMIENTO"))
                .count();
        long danados = allItems.stream()
                .filter(item -> item.getActivo() && item.getEstado().equals("DANADO"))
                .count();
        
        stats.put("disponibles", disponibles);
        stats.put("mantenimiento", mantenimiento);
        stats.put("danados", danados);
        
        // Items sin asignar - contar items con espacio_id = null
        long sinAsignar = allItems.stream()
                .filter(item -> item.getActivo() && item.getEspacio() == null)
                .count();
        stats.put("sinAsignar", sinAsignar);
        
        return stats;
    }
    
    @Transactional(readOnly = true)
    public List<InventarioItemResponseDto> filterInventario(String search, Long espacioId, 
                                                           Long tipoElementoId, String estado, 
                                                           Boolean sinAsignar, String sortBy, String sortDir) {
        List<InventarioItem> items = inventarioItemRepository.findAll();
        
        // Aplicar filtros
        if (search != null && !search.trim().isEmpty()) {
            String searchLower = search.toLowerCase();
            items = items.stream()
                    .filter(item -> {
                        boolean matchesSearch = false;
                        // Buscar en tipo de elemento
                        if (item.getTipoElemento().getNombre().toLowerCase().contains(searchLower)) {
                            matchesSearch = true;
                        }
                        // Buscar en espacio
                        if (item.getEspacio() != null && item.getEspacio().getNombre().toLowerCase().contains(searchLower)) {
                            matchesSearch = true;
                        }
                        // Buscar en estado
                        if (item.getEstado() != null && item.getEstado().toLowerCase().contains(searchLower)) {
                            matchesSearch = true;
                        }
                        return matchesSearch;
                    })
                    .collect(Collectors.toList());
        }
        
        if (espacioId != null) {
            items = items.stream()
                    .filter(item -> item.getEspacio() != null && item.getEspacio().getId().equals(espacioId))
                    .collect(Collectors.toList());
        }
        
        if (tipoElementoId != null) {
            items = items.stream()
                    .filter(item -> item.getTipoElemento().getId().equals(tipoElementoId))
                    .collect(Collectors.toList());
        }
        
        if (estado != null) {
            items = items.stream()
                    .filter(item -> item.getEstado().equals(estado))
                    .collect(Collectors.toList());
        }
        
        if (Boolean.TRUE.equals(sinAsignar)) {
            // Filtrar items sin espacio asignado (espacio null)
            items = items.stream()
                    .filter(item -> item.getEspacio() == null)
                    .collect(Collectors.toList());
        }
        
        List<InventarioItemResponseDto> result = items.stream()
                .map(this::mapToResponseDto)
                .collect(Collectors.toList());
        
        // Aplicar ordenamiento si se especifica
        if (sortBy != null && !sortBy.isEmpty()) {
            result = sortList(result, sortBy, sortDir);
        }
        
        return result;
    }
    
    private List<InventarioItemResponseDto> sortList(List<InventarioItemResponseDto> items, String sortBy, String sortDir) {
        boolean ascending = sortDir == null || sortDir.equalsIgnoreCase("asc");
        
        return items.stream()
                .sorted((a, b) -> {
                    int comparison = 0;
                    
                    String sortField = sortBy.toLowerCase();
                    
                    // Manejar nombres con puntos (para relaciones en Spring Data)
                    if (sortField.contains(".")) {
                        sortField = sortField.split("\\.")[1]; // Tomar la parte después del punto
                    }
                    
                    switch (sortField) {
                        case "id":
                            comparison = Long.compare(a.getId(), b.getId());
                            break;
                        case "nombre":  // Para tipoElemento.nombre o espacio.nombre
                            String nombreA = a.getTipoElementoNombre();
                            String nombreB = b.getTipoElementoNombre();
                            comparison = nombreA.compareToIgnoreCase(nombreB);
                            break;
                        case "tipo":
                        case "tipoelementonombre":
                            comparison = a.getTipoElementoNombre().compareToIgnoreCase(b.getTipoElementoNombre());
                            break;
                        case "cantidad":
                            comparison = Integer.compare(a.getCantidad(), b.getCantidad());
                            break;
                        case "estado":
                            comparison = a.getEstado().compareToIgnoreCase(b.getEstado());
                            break;
                        case "espacio":
                            comparison = a.getEspacioNombre().compareToIgnoreCase(b.getEspacioNombre());
                            break;
                        default:
                            return 0;
                    }
                    
                    return ascending ? comparison : -comparison;
                })
                .collect(Collectors.toList());
    }
    
    private InventarioItemResponseDto mapToResponseDto(InventarioItem inventarioItem) {
        InventarioItemResponseDto dto = new InventarioItemResponseDto();
        dto.setId(inventarioItem.getId());
        
        // Manejar espacio nullable
        if (inventarioItem.getEspacio() != null) {
            dto.setEspacioId(inventarioItem.getEspacio().getId());
            dto.setEspacioNombre(inventarioItem.getEspacio().getNombre());
            // Obtener color del tipo de espacio
            if (inventarioItem.getEspacio().getTipoEspacio() != null) {
                dto.setEspacioColor(inventarioItem.getEspacio().getTipoEspacio().getColor());
            } else {
                dto.setEspacioColor(null);
            }
        } else {
            dto.setEspacioId(null);
            dto.setEspacioNombre("Sin asignar");
            dto.setEspacioColor(null);
        }
        
        dto.setTipoElementoId(inventarioItem.getTipoElemento().getId());
        dto.setTipoElementoNombre(inventarioItem.getTipoElemento().getNombre());
        dto.setCantidad(inventarioItem.getCantidad());
        dto.setEstado(inventarioItem.getEstado());
        dto.setObservaciones(inventarioItem.getObservaciones());
        dto.setActivo(inventarioItem.getActivo());
        dto.setCreatedAt(inventarioItem.getCreatedAt());
        dto.setUpdatedAt(inventarioItem.getUpdatedAt());
        return dto;
    }
}
