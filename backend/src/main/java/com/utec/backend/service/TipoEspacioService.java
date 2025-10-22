package com.utec.backend.service;

import com.utec.backend.dto.tipo_espacio.TipoEspacioCreateDto;
import com.utec.backend.dto.tipo_espacio.TipoEspacioResponseDto;
import com.utec.backend.dto.tipo_espacio.TipoEspacioUpdateDto;
import com.utec.backend.model.TipoEspacio;
import com.utec.backend.repository.TipoEspacioRepository;
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
public class TipoEspacioService {
    
    private final TipoEspacioRepository tipoEspacioRepository;
    
    public TipoEspacioResponseDto createTipoEspacio(TipoEspacioCreateDto createDto) {
        // Verificar si ya existe un tipo con el mismo nombre
        if (tipoEspacioRepository.existsByNombreIgnoreCase(createDto.getNombre())) {
            throw new RuntimeException("Ya existe un tipo de espacio con el nombre: " + createDto.getNombre());
        }
        
        TipoEspacio tipoEspacio = new TipoEspacio();
        tipoEspacio.setNombre(createDto.getNombre());
        tipoEspacio.setDescripcion(createDto.getDescripcion());
        tipoEspacio.setActivo(true);
        
        TipoEspacio savedTipoEspacio = tipoEspacioRepository.save(tipoEspacio);
        return mapToResponseDto(savedTipoEspacio);
    }
    
    @Transactional(readOnly = true)
    public List<TipoEspacioResponseDto> getAllTiposEspacio() {
        return tipoEspacioRepository.findByActivoTrue().stream()
                .map(this::mapToResponseDto)
                .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public Page<TipoEspacioResponseDto> getAllTiposEspacioPaged(Pageable pageable) {
        return tipoEspacioRepository.findAll(pageable)
                .map(this::mapToResponseDto);
    }
    
    @Transactional(readOnly = true)
    public TipoEspacioResponseDto getTipoEspacioById(Long id) {
        TipoEspacio tipoEspacio = tipoEspacioRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Tipo de espacio no encontrado con ID: " + id));
        return mapToResponseDto(tipoEspacio);
    }
    
    public TipoEspacioResponseDto updateTipoEspacio(Long id, TipoEspacioUpdateDto updateDto) {
        TipoEspacio tipoEspacio = tipoEspacioRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Tipo de espacio no encontrado con ID: " + id));
        
        // Verificar si ya existe otro tipo con el mismo nombre
        if (tipoEspacioRepository.existsByNombreIgnoreCaseAndIdNot(updateDto.getNombre(), id)) {
            throw new RuntimeException("Ya existe otro tipo de espacio con el nombre: " + updateDto.getNombre());
        }
        
        tipoEspacio.setNombre(updateDto.getNombre());
        tipoEspacio.setDescripcion(updateDto.getDescripcion());
        tipoEspacio.setUpdatedAt(LocalDateTime.now());
        
        TipoEspacio updatedTipoEspacio = tipoEspacioRepository.save(tipoEspacio);
        return mapToResponseDto(updatedTipoEspacio);
    }
    
    public void deleteTipoEspacio(Long id) {
        TipoEspacio tipoEspacio = tipoEspacioRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Tipo de espacio no encontrado con ID: " + id));
        
        // Verificar si tiene espacios asociados
        if (!tipoEspacio.getEspacios().isEmpty()) {
            throw new RuntimeException("No se puede eliminar el tipo de espacio porque tiene espacios asociados");
        }
        
        tipoEspacioRepository.deleteById(id);
    }
    
    public TipoEspacioResponseDto toggleActivo(Long id) {
        TipoEspacio tipoEspacio = tipoEspacioRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Tipo de espacio no encontrado con ID: " + id));
        
        tipoEspacio.setActivo(!tipoEspacio.getActivo());
        tipoEspacio.setUpdatedAt(LocalDateTime.now());
        
        TipoEspacio updatedTipoEspacio = tipoEspacioRepository.save(tipoEspacio);
        return mapToResponseDto(updatedTipoEspacio);
    }
    
    @Transactional(readOnly = true)
    public List<TipoEspacioResponseDto> searchTiposEspacioByNombre(String nombre) {
        return tipoEspacioRepository.findByNombreContainingIgnoreCaseAndActivoTrue(nombre).stream()
                .map(this::mapToResponseDto)
                .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public List<TipoEspacioResponseDto> getTiposMasUtilizados() {
        return tipoEspacioRepository.findTiposMasUtilizados().stream()
                .map(this::mapToResponseDto)
                .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public Long getTotalTiposEspacio() {
        return tipoEspacioRepository.countByActivoTrue();
    }
    
    private TipoEspacioResponseDto mapToResponseDto(TipoEspacio tipoEspacio) {
        TipoEspacioResponseDto dto = new TipoEspacioResponseDto();
        dto.setId(tipoEspacio.getId());
        dto.setNombre(tipoEspacio.getNombre());
        dto.setDescripcion(tipoEspacio.getDescripcion());
        dto.setActivo(tipoEspacio.getActivo());
        dto.setCreatedAt(tipoEspacio.getCreatedAt());
        dto.setUpdatedAt(tipoEspacio.getUpdatedAt());
        dto.setDeletedAt(tipoEspacio.getDeletedAt());
        return dto;
    }
}
