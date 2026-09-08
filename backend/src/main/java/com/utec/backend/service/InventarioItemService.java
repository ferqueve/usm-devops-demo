package com.utec.backend.service;

import com.utec.backend.dto.inventario.InventarioItemCreateDto;
import com.utec.backend.dto.inventario.InventarioItemResponseDto;
import com.utec.backend.dto.inventario.InventarioItemUpdateDto;
import com.utec.backend.model.Espacio;
import com.utec.backend.model.InventarioItem;
import com.utec.backend.model.TipoElemento;
import com.utec.backend.repository.EspacioRepository;
import com.utec.backend.repository.InventarioItemRepository;
import com.utec.backend.repository.ReservaItemSolicitadoRepository;
import com.utec.backend.repository.TipoElementoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@Transactional
public class InventarioItemService {

    private static final String ITEM_NO_ENCONTRADO_MSG = "Item de inventario no encontrado con ID: ";
    private static final String FIELD_ESPACIO = "espacio";

    private final InventarioItemRepository inventarioItemRepository;
    private final EspacioRepository espacioRepository;
    private final TipoElementoRepository tipoElementoRepository;
    private final ReservaItemSolicitadoRepository reservaItemSolicitadoRepository;
    private final InventarioItemService self;

    public InventarioItemService(
            InventarioItemRepository inventarioItemRepository,
            EspacioRepository espacioRepository,
            TipoElementoRepository tipoElementoRepository,
            ReservaItemSolicitadoRepository reservaItemSolicitadoRepository,
            @Lazy @Autowired InventarioItemService self) {
        this.inventarioItemRepository = inventarioItemRepository;
        this.espacioRepository = espacioRepository;
        this.tipoElementoRepository = tipoElementoRepository;
        this.reservaItemSolicitadoRepository = reservaItemSolicitadoRepository;
        this.self = self;
    }
    
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
                .toList();
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
                cb.equal(root.get(FIELD_ESPACIO).get("id"), espacioId);
            spec = spec.and(espacioSpec);
        }
        
        // Filtro "Sin Asignar" - items que tienen espacio_id = null
        if (Boolean.TRUE.equals(sinAsignar)) {
            Specification<InventarioItem> sinAsignarSpec = (root, query, cb) -> 
                cb.isNull(root.get(FIELD_ESPACIO));
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
                .orElseThrow(() -> new RuntimeException(ITEM_NO_ENCONTRADO_MSG + id));
        return mapToResponseDto(inventarioItem);
    }
    
    public InventarioItemResponseDto updateInventarioItem(Long id, InventarioItemUpdateDto updateDto) {
        InventarioItem inventarioItem = inventarioItemRepository.findById(id)
                .orElseThrow(() -> new RuntimeException(ITEM_NO_ENCONTRADO_MSG + id));
        
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
        
        String estadoAnterior = inventarioItem.getEstado();
        inventarioItem.setTipoElemento(tipoElemento);
        inventarioItem.setCantidad(updateDto.getCantidad());
        inventarioItem.setEstado(updateDto.getEstado());
        inventarioItem.setObservaciones(updateDto.getObservaciones());
        inventarioItem.setUpdatedAt(Instant.now());
        
        InventarioItem updatedItem = inventarioItemRepository.save(inventarioItem);
        
        // Invalidar caché de recomendaciones si cambió el estado (especialmente si entró en mantenimiento)
        if (!estadoAnterior.equals(updateDto.getEstado()) && "MANTENIMIENTO".equals(updateDto.getEstado())) {
            try {
                // Invalidar caché global de recomendaciones de mantenimiento
                // No invalidamos por usuario específico ya que es una recomendación global
            } catch (Exception e) {
                // Log pero no fallar
            }
        }
        
        return mapToResponseDto(updatedItem);
    }
    
    public void deleteInventarioItem(Long id) {
        InventarioItem inventarioItem = inventarioItemRepository.findById(id)
                .orElseThrow(() -> new RuntimeException(ITEM_NO_ENCONTRADO_MSG + id));

        long activas = reservaItemSolicitadoRepository.countActiveByInventarioItemId(id);
        if (activas > 0) {
            throw new IllegalStateException(
                    "No se puede eliminar el item: tiene " + activas
                            + " solicitud(es) PENDIENTE/APROBADA(s) que lo referencian. "
                            + "Libera o rechaza esas solicitudes primero.");
        }

        // Soft delete: marcar como inactivo y eliminado
        inventarioItem.setActivo(false);
        inventarioItem.setDeletedAt(Instant.now());
        inventarioItem.setUpdatedAt(Instant.now());

        inventarioItemRepository.save(inventarioItem);
    }
    
    @Transactional(readOnly = true)
    public List<InventarioItemResponseDto> getInventarioByEspacio(Long espacioId) {
        return inventarioItemRepository.findByEspacioIdAndActivoTrue(espacioId).stream()
                .map(this::mapToResponseDto)
                .toList();
    }
    
    @Transactional(readOnly = true)
    public List<InventarioItemResponseDto> getInventarioByTipoElemento(Long tipoElementoId) {
        return inventarioItemRepository.findByTipoElementoIdAndActivoTrue(tipoElementoId).stream()
                .map(this::mapToResponseDto)
                .toList();
    }
    
    @Transactional(readOnly = true)
    public List<InventarioItemResponseDto> getInventarioByEstado(String estado) {
        return inventarioItemRepository.findByEstadoAndActivoTrue(estado).stream()
                .map(this::mapToResponseDto)
                .toList();
    }
    
    @Transactional(readOnly = true)
    public Long getTotalInventarioItems() {
        return inventarioItemRepository.countTotalItems();
    }
    
    @Transactional(readOnly = true)
    public Map<String, Object> getInventarioStatistics() {
        // Una sola consulta agregada. Antes se traia todo el inventario y se
        // recorria la lista cinco veces para devolver cinco numeros.
        List<Object[]> filas = inventarioItemRepository.resumenInventario();
        Object[] fila = filas.isEmpty() ? new Object[6] : filas.get(0);

        Map<String, Object> stats = new HashMap<>();
        stats.put("totalItems", conteo(fila[0]));
        stats.put("disponibles", conteo(fila[1]));
        stats.put("mantenimiento", conteo(fila[2]));
        stats.put("danados", conteo(fila[3]));
        stats.put("sinAsignar", conteo(fila[4]));
        stats.put("tiposUnicos", conteo(fila[5]));
        return stats;
    }

    /** SUM sobre cero filas devuelve null; COUNT devuelve Long. */
    private long conteo(Object valor) {
        return valor instanceof Number n ? n.longValue() : 0L;
    }
    
    @Transactional(readOnly = true)
    public List<InventarioItemResponseDto> filterInventario(String search, Long espacioId,
                                                           Long tipoElementoId, String estado,
                                                           Boolean sinAsignar, String sortBy, String sortDir) {
        List<InventarioItem> items = inventarioItemRepository.findAll();
        items = aplicarFiltroSearch(items, search);
        items = aplicarFiltroEspacio(items, espacioId);
        items = aplicarFiltroTipoElemento(items, tipoElementoId);
        items = aplicarFiltroEstado(items, estado);
        items = aplicarFiltroSinAsignar(items, sinAsignar);

        List<InventarioItemResponseDto> result = items.stream()
                .map(this::mapToResponseDto)
                .toList();

        if (sortBy != null && !sortBy.isEmpty()) {
            result = sortList(result, sortBy, sortDir);
        }

        return result;
    }

    private List<InventarioItem> aplicarFiltroSearch(List<InventarioItem> items, String search) {
        if (search == null || search.trim().isEmpty()) {
            return items;
        }
        String searchLower = search.toLowerCase();
        return items.stream()
                .filter(item -> coincideBusqueda(item, searchLower))
                .toList();
    }

    private boolean coincideBusqueda(InventarioItem item, String searchLower) {
        if (item.getTipoElemento().getNombre().toLowerCase().contains(searchLower)) {
            return true;
        }
        if (item.getEspacio() != null && item.getEspacio().getNombre().toLowerCase().contains(searchLower)) {
            return true;
        }
        return item.getEstado() != null && item.getEstado().toLowerCase().contains(searchLower);
    }

    private List<InventarioItem> aplicarFiltroEspacio(List<InventarioItem> items, Long espacioId) {
        if (espacioId == null) {
            return items;
        }
        return items.stream()
                .filter(item -> item.getEspacio() != null && item.getEspacio().getId().equals(espacioId))
                .toList();
    }

    private List<InventarioItem> aplicarFiltroTipoElemento(List<InventarioItem> items, Long tipoElementoId) {
        if (tipoElementoId == null) {
            return items;
        }
        return items.stream()
                .filter(item -> item.getTipoElemento().getId().equals(tipoElementoId))
                .toList();
    }

    private List<InventarioItem> aplicarFiltroEstado(List<InventarioItem> items, String estado) {
        if (estado == null) {
            return items;
        }
        return items.stream()
                .filter(item -> item.getEstado().equals(estado))
                .toList();
    }

    private List<InventarioItem> aplicarFiltroSinAsignar(List<InventarioItem> items, Boolean sinAsignar) {
        if (!Boolean.TRUE.equals(sinAsignar)) {
            return items;
        }
        return items.stream()
                .filter(item -> item.getEspacio() == null)
                .toList();
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
                        case "nombre", "tipo", "tipoelementonombre":
                            // Para tipoElemento.nombre o espacio.nombre
                            comparison = a.getTipoElementoNombre().compareToIgnoreCase(b.getTipoElementoNombre());
                            break;
                        case "cantidad":
                            comparison = Integer.compare(a.getCantidad(), b.getCantidad());
                            break;
                        case "estado":
                            comparison = a.getEstado().compareToIgnoreCase(b.getEstado());
                            break;
                        case FIELD_ESPACIO:
                            comparison = a.getEspacioNombre().compareToIgnoreCase(b.getEspacioNombre());
                            break;
                        default:
                            return 0;
                    }
                    
                    return ascending ? comparison : -comparison;
                })
                .toList();
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
