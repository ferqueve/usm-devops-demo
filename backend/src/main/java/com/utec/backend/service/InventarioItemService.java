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
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class InventarioItemService {
    
    private final InventarioItemRepository inventarioItemRepository;
    private final EspacioRepository espacioRepository;
    private final TipoElementoRepository tipoElementoRepository;
    
    public InventarioItemResponseDto createInventarioItem(InventarioItemCreateDto createDto) {
        // Verificar que el espacio existe
        Espacio espacio = espacioRepository.findById(createDto.getEspacioId())
                .orElseThrow(() -> new RuntimeException("Espacio no encontrado con ID: " + createDto.getEspacioId()));
        
        // Verificar que el tipo de elemento existe
        TipoElemento tipoElemento = tipoElementoRepository.findById(createDto.getTipoElementoId())
                .orElseThrow(() -> new RuntimeException("Tipo de elemento no encontrado con ID: " + createDto.getTipoElementoId()));
        
        InventarioItem inventarioItem = new InventarioItem();
        inventarioItem.setEspacio(espacio);
        inventarioItem.setTipoElemento(tipoElemento);
        inventarioItem.setCantidad(createDto.getCantidad());
        inventarioItem.setMarca(createDto.getMarca());
        inventarioItem.setModelo(createDto.getModelo());
        inventarioItem.setNumeroSerie(createDto.getNumeroSerie());
        inventarioItem.setEstado(createDto.getEstado());
        inventarioItem.setObservaciones(createDto.getObservaciones());
        inventarioItem.setFechaAdquisicion(createDto.getFechaAdquisicion());
        inventarioItem.setValorEstimado(createDto.getValorEstimado());
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
    public InventarioItemResponseDto getInventarioItemById(Long id) {
        InventarioItem inventarioItem = inventarioItemRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Item de inventario no encontrado con ID: " + id));
        return mapToResponseDto(inventarioItem);
    }
    
    public InventarioItemResponseDto updateInventarioItem(Long id, InventarioItemUpdateDto updateDto) {
        InventarioItem inventarioItem = inventarioItemRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Item de inventario no encontrado con ID: " + id));
        
        // Verificar que el espacio existe
        Espacio espacio = espacioRepository.findById(updateDto.getEspacioId())
                .orElseThrow(() -> new RuntimeException("Espacio no encontrado con ID: " + updateDto.getEspacioId()));
        
        // Verificar que el tipo de elemento existe
        TipoElemento tipoElemento = tipoElementoRepository.findById(updateDto.getTipoElementoId())
                .orElseThrow(() -> new RuntimeException("Tipo de elemento no encontrado con ID: " + updateDto.getTipoElementoId()));
        
        inventarioItem.setEspacio(espacio);
        inventarioItem.setTipoElemento(tipoElemento);
        inventarioItem.setCantidad(updateDto.getCantidad());
        inventarioItem.setMarca(updateDto.getMarca());
        inventarioItem.setModelo(updateDto.getModelo());
        inventarioItem.setNumeroSerie(updateDto.getNumeroSerie());
        inventarioItem.setEstado(updateDto.getEstado());
        inventarioItem.setObservaciones(updateDto.getObservaciones());
        inventarioItem.setFechaAdquisicion(updateDto.getFechaAdquisicion());
        inventarioItem.setValorEstimado(updateDto.getValorEstimado());
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
    public List<InventarioItemResponseDto> searchInventarioByMarca(String marca) {
        return inventarioItemRepository.findByMarcaContainingIgnoreCaseAndActivoTrue(marca).stream()
                .map(this::mapToResponseDto)
                .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public List<InventarioItemResponseDto> searchInventarioByModelo(String modelo) {
        return inventarioItemRepository.findByModeloContainingIgnoreCaseAndActivoTrue(modelo).stream()
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
    public java.math.BigDecimal getValorPromedioInventario() {
        return inventarioItemRepository.getValorPromedio();
    }
    
    @Transactional(readOnly = true)
    public java.math.BigDecimal getValorTotalInventario() {
        return inventarioItemRepository.getValorTotal();
    }
    
    private InventarioItemResponseDto mapToResponseDto(InventarioItem inventarioItem) {
        InventarioItemResponseDto dto = new InventarioItemResponseDto();
        dto.setId(inventarioItem.getId());
        dto.setEspacioId(inventarioItem.getEspacio().getId());
        dto.setEspacioNombre(inventarioItem.getEspacio().getNombre());
        dto.setTipoElementoId(inventarioItem.getTipoElemento().getId());
        dto.setTipoElementoNombre(inventarioItem.getTipoElemento().getNombre());
        dto.setCantidad(inventarioItem.getCantidad());
        dto.setMarca(inventarioItem.getMarca());
        dto.setModelo(inventarioItem.getModelo());
        dto.setNumeroSerie(inventarioItem.getNumeroSerie());
        dto.setEstado(inventarioItem.getEstado());
        dto.setObservaciones(inventarioItem.getObservaciones());
        dto.setFechaAdquisicion(inventarioItem.getFechaAdquisicion());
        dto.setValorEstimado(inventarioItem.getValorEstimado());
        dto.setActivo(inventarioItem.getActivo());
        dto.setCreatedAt(inventarioItem.getCreatedAt());
        dto.setUpdatedAt(inventarioItem.getUpdatedAt());
        return dto;
    }
}
