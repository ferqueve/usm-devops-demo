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

@Service
@RequiredArgsConstructor
@Transactional
public class TipoElementoService {

    private static final String TIPO_ELEMENTO_NO_ENCONTRADO_MSG = "Tipo de elemento no encontrado con ID: ";

    private final TipoElementoRepository tipoElementoRepository;
    
    public TipoElementoResponseDto createTipoElemento(TipoElementoCreateDto createDto) {
        // Buscar si existe un tipo con el mismo nombre (incluyendo desactivados)
        java.util.Optional<TipoElemento> tipoExistente = tipoElementoRepository.findByNombreIgnoreCase(createDto.getNombre());
        
        if (tipoExistente.isPresent()) {
            TipoElemento tipo = tipoExistente.get();
            // Si está activo, lanzar error
            if (Boolean.TRUE.equals(tipo.getActivo())) {
                throw new IllegalStateException("Ya existe un tipo de elemento activo con el nombre: " + createDto.getNombre());
            }
            // Si está desactivado, reactivarlo
            tipo.setActivo(true);
            tipo.setDescripcion(createDto.getDescripcion());
            tipo.setDeletedAt(null);
            tipo.setUpdatedAt(Instant.now());
            TipoElemento savedTipoElemento = tipoElementoRepository.save(tipo);
            return mapToResponseDto(savedTipoElemento);
        }
        
        // Si no existe, crear uno nuevo
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
                .toList();
    }
    
    @Transactional(readOnly = true)
    public Page<TipoElementoResponseDto> getAllTiposElementoPaged(Pageable pageable) {
        return tipoElementoRepository.findAll(pageable)
                .map(this::mapToResponseDto);
    }
    
    @Transactional(readOnly = true)
    public TipoElementoResponseDto getTipoElementoById(Long id) {
        TipoElemento tipoElemento = tipoElementoRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException(TIPO_ELEMENTO_NO_ENCONTRADO_MSG + id));
        return mapToResponseDto(tipoElemento);
    }

    public TipoElementoResponseDto updateTipoElemento(Long id, TipoElementoUpdateDto updateDto) {
        TipoElemento tipoElemento = tipoElementoRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException(TIPO_ELEMENTO_NO_ENCONTRADO_MSG + id));

        // Verificar si ya existe otro tipo con el mismo nombre
        if (tipoElementoRepository.existsByNombreIgnoreCaseAndIdNot(updateDto.getNombre(), id)) {
            throw new IllegalStateException("Ya existe otro tipo de elemento con el nombre: " + updateDto.getNombre());
        }
        
        tipoElemento.setNombre(updateDto.getNombre());
        tipoElemento.setDescripcion(updateDto.getDescripcion());
        tipoElemento.setUpdatedAt(Instant.now());
        
        TipoElemento updatedTipoElemento = tipoElementoRepository.save(tipoElemento);
        return mapToResponseDto(updatedTipoElemento);
    }
    
    public void deleteTipoElemento(Long id) {
        TipoElemento tipoElemento = tipoElementoRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException(TIPO_ELEMENTO_NO_ENCONTRADO_MSG + id));
        
        // Soft delete: marcar como inactivo
        tipoElemento.setActivo(false);
        tipoElemento.setDeletedAt(Instant.now());
        tipoElemento.setUpdatedAt(Instant.now());
        
        tipoElementoRepository.save(tipoElemento);
    }
    
    public TipoElementoResponseDto toggleActivo(Long id) {
        TipoElemento tipoElemento = tipoElementoRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException(TIPO_ELEMENTO_NO_ENCONTRADO_MSG + id));
        
        tipoElemento.setActivo(!tipoElemento.getActivo());
        tipoElemento.setUpdatedAt(Instant.now());
        
        TipoElemento updatedTipoElemento = tipoElementoRepository.save(tipoElemento);
        return mapToResponseDto(updatedTipoElemento);
    }
    
    @Transactional(readOnly = true)
    public List<TipoElementoResponseDto> searchTiposElementoByNombre(String nombre) {
        return tipoElementoRepository.findByNombreContainingIgnoreCaseAndActivoTrue(nombre).stream()
                .map(this::mapToResponseDto)
                .toList();
    }
    
    @Transactional(readOnly = true)
    public List<TipoElementoResponseDto> getTiposMasUtilizados() {
        return tipoElementoRepository.findTiposMasUtilizados().stream()
                .map(this::mapToResponseDto)
                .toList();
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
