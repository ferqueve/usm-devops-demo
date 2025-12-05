package com.utec.backend.service;

import com.utec.backend.dto.tipo_elemento.TipoElementoCreateDto;
import com.utec.backend.dto.tipo_elemento.TipoElementoResponseDto;
import com.utec.backend.dto.tipo_elemento.TipoElementoUpdateDto;
import com.utec.backend.model.TipoElemento;
import com.utec.backend.repository.TipoElementoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class TipoElementoService {
    
    private final TipoElementoRepository tipoElementoRepository;
    
    public TipoElementoResponseDto createTipoElemento(TipoElementoCreateDto createDto) {
        // Verificar si ya existe un tipo con el mismo nombre
        if (tipoElementoRepository.existsByNombreIgnoreCase(createDto.getNombre())) {
            throw new RuntimeException("Ya existe un tipo de elemento con el nombre: " + createDto.getNombre());
        }
        
        TipoElemento tipoElemento = new TipoElemento();
        tipoElemento.setNombre(createDto.getNombre());
        tipoElemento.setDescripcion(createDto.getDescripcion());
        tipoElemento.setActivo(true);
        
        TipoElemento savedTipoElemento = tipoElementoRepository.save(tipoElemento);
        return mapToResponseDto(savedTipoElemento);
    }
    
    @Transactional(readOnly = true)
    public List<TipoElementoResponseDto> getAllTiposElemento() {
        return tipoElementoRepository.findByActivoTrue().stream()
                .map(this::mapToResponseDto)
                .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public Page<TipoElementoResponseDto> getAllTiposElementoPaged(Pageable pageable) {
        return tipoElementoRepository.findAll(pageable)
                .map(this::mapToResponseDto);
    }
    
    @Transactional(readOnly = true)
    public TipoElementoResponseDto getTipoElementoById(Long id) {
        TipoElemento tipoElemento = tipoElementoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Tipo de elemento no encontrado con ID: " + id));
        return mapToResponseDto(tipoElemento);
    }
    
    public TipoElementoResponseDto updateTipoElemento(Long id, TipoElementoUpdateDto updateDto) {
        TipoElemento tipoElemento = tipoElementoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Tipo de elemento no encontrado con ID: " + id));
        
        // Verificar si ya existe otro tipo con el mismo nombre
        if (tipoElementoRepository.existsByNombreIgnoreCaseAndIdNot(updateDto.getNombre(), id)) {
            throw new RuntimeException("Ya existe otro tipo de elemento con el nombre: " + updateDto.getNombre());
        }
        
        tipoElemento.setNombre(updateDto.getNombre());
        tipoElemento.setDescripcion(updateDto.getDescripcion());
        tipoElemento.setUpdatedAt(Instant.now());
        
        TipoElemento updatedTipoElemento = tipoElementoRepository.save(tipoElemento);
        return mapToResponseDto(updatedTipoElemento);
    }
    
    public void deleteTipoElemento(Long id) {
        TipoElemento tipoElemento = tipoElementoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Tipo de elemento no encontrado con ID: " + id));
        
        // Verificar si tiene items de inventario asociados
        if (!tipoElemento.getInventarioItems().isEmpty()) {
            throw new RuntimeException("No se puede eliminar el tipo de elemento porque tiene items de inventario asociados");
        }
        
        tipoElementoRepository.deleteById(id);
    }
    
    public TipoElementoResponseDto toggleActivo(Long id) {
        TipoElemento tipoElemento = tipoElementoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Tipo de elemento no encontrado con ID: " + id));
        
        tipoElemento.setActivo(!tipoElemento.getActivo());
        tipoElemento.setUpdatedAt(Instant.now());
        
        TipoElemento updatedTipoElemento = tipoElementoRepository.save(tipoElemento);
        return mapToResponseDto(updatedTipoElemento);
    }
    
    @Transactional(readOnly = true)
    public List<TipoElementoResponseDto> searchTiposElementoByNombre(String nombre) {
        return tipoElementoRepository.findByNombreContainingIgnoreCaseAndActivoTrue(nombre).stream()
                .map(this::mapToResponseDto)
                .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public List<TipoElementoResponseDto> getTiposMasUtilizados() {
        return tipoElementoRepository.findTiposMasUtilizados().stream()
                .map(this::mapToResponseDto)
                .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public Long getTotalTiposElemento() {
        return tipoElementoRepository.countByActivoTrue();
    }
    
    private TipoElementoResponseDto mapToResponseDto(TipoElemento tipoElemento) {
        TipoElementoResponseDto dto = new TipoElementoResponseDto();
        dto.setId(tipoElemento.getId());
        dto.setNombre(tipoElemento.getNombre());
        dto.setDescripcion(tipoElemento.getDescripcion());
        dto.setActivo(tipoElemento.getActivo());
        dto.setCreatedAt(tipoElemento.getCreatedAt());
        dto.setUpdatedAt(tipoElemento.getUpdatedAt());
        return dto;
    }
}
