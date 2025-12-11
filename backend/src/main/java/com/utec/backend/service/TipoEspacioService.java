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

import java.time.Instant;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class TipoEspacioService {
    
    private final TipoEspacioRepository tipoEspacioRepository;
    
    public TipoEspacioResponseDto createTipoEspacio(TipoEspacioCreateDto createDto) {
        // Buscar si existe un tipo con el mismo nombre (incluyendo desactivados)
        java.util.Optional<TipoEspacio> tipoExistente = tipoEspacioRepository.findByNombreIgnoreCase(createDto.getNombre());
        
        if (tipoExistente.isPresent()) {
            TipoEspacio tipo = tipoExistente.get();
            // Si está activo, lanzar error
            if (tipo.getActivo()) {
                throw new RuntimeException("Ya existe un tipo de espacio activo con el nombre: " + createDto.getNombre());
            }
            // Si está desactivado, reactivarlo
            tipo.setActivo(true);
            tipo.setDescripcion(createDto.getDescripcion());
            tipo.setColor(createDto.getColor() != null ? createDto.getColor() : generarColor(createDto.getNombre()));
            tipo.setDeletedAt(null);
            tipo.setUpdatedAt(Instant.now());
            TipoEspacio savedTipoEspacio = tipoEspacioRepository.save(tipo);
            return mapToResponseDto(savedTipoEspacio);
        }
        
        // Si no existe, crear uno nuevo
        TipoEspacio tipoEspacio = new TipoEspacio();
        tipoEspacio.setNombre(createDto.getNombre());
        tipoEspacio.setDescripcion(createDto.getDescripcion());
        tipoEspacio.setActivo(true);
        
        // Generar color automáticamente si no se proporciona
        tipoEspacio.setColor(createDto.getColor() != null ? createDto.getColor() : generarColor(createDto.getNombre()));
        
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
        
        // Actualizar color si se proporciona
        if (updateDto.getColor() != null) {
            tipoEspacio.setColor(updateDto.getColor());
        }
        
        tipoEspacio.setUpdatedAt(Instant.now());
        
        TipoEspacio updatedTipoEspacio = tipoEspacioRepository.save(tipoEspacio);
        return mapToResponseDto(updatedTipoEspacio);
    }
    
    public void deleteTipoEspacio(Long id) {
        TipoEspacio tipoEspacio = tipoEspacioRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Tipo de espacio no encontrado con ID: " + id));
        
        // Soft delete: marcar como inactivo
        tipoEspacio.setActivo(false);
        tipoEspacio.setDeletedAt(Instant.now());
        tipoEspacio.setUpdatedAt(Instant.now());
        
        tipoEspacioRepository.save(tipoEspacio);
    }
    
    public TipoEspacioResponseDto toggleActivo(Long id) {
        TipoEspacio tipoEspacio = tipoEspacioRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Tipo de espacio no encontrado con ID: " + id));
        
        tipoEspacio.setActivo(!tipoEspacio.getActivo());
        tipoEspacio.setUpdatedAt(Instant.now());
        
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
    
    // Generar color consistente basado en el nombre
    private String generarColor(String nombre) {
        if (nombre == null || nombre.isEmpty()) {
            nombre = "default";
        }
        
        // Generar color basado en hash del nombre
        int hash = nombre.hashCode();
        hash = hash < 0 ? -hash : hash;
        
        // Usar solo colores pastel/brillantes evitando muy claros
        int r = 100 + (hash % 100);
        int g = 100 + ((hash / 100) % 100);
        int b = 100 + ((hash / 10000) % 100);
        
        // Normalizar para asegurar que los valores sean válidos
        r = Math.min(255, Math.max(100, r));
        g = Math.min(255, Math.max(100, g));
        b = Math.min(255, Math.max(100, b));
        
        return String.format("#%02X%02X%02X", r, g, b);
    }
    
    private TipoEspacioResponseDto mapToResponseDto(TipoEspacio tipoEspacio) {
        TipoEspacioResponseDto dto = new TipoEspacioResponseDto();
        dto.setId(tipoEspacio.getId());
        dto.setNombre(tipoEspacio.getNombre());
        dto.setDescripcion(tipoEspacio.getDescripcion());
        dto.setColor(tipoEspacio.getColor() != null ? tipoEspacio.getColor() : generarColor(tipoEspacio.getNombre()));
        dto.setActivo(tipoEspacio.getActivo());
        dto.setCreatedAt(tipoEspacio.getCreatedAt());
        dto.setUpdatedAt(tipoEspacio.getUpdatedAt());
        dto.setDeletedAt(tipoEspacio.getDeletedAt());
        return dto;
    }
}
