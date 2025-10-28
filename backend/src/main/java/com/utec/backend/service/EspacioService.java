package com.utec.backend.service;

import com.utec.backend.dto.espacio.EspacioCreateDto;
import com.utec.backend.dto.espacio.EspacioResponseDto;
import com.utec.backend.dto.espacio.EspacioUpdateDto;
import com.utec.backend.model.Espacio;
import com.utec.backend.repository.EspacioRepository;
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
public class EspacioService {
    
    private final EspacioRepository espacioRepository;
    
    public EspacioResponseDto createEspacio(EspacioCreateDto createDto) {
        Espacio espacio = new Espacio();
        espacio.setNombre(createDto.getNombre());
        espacio.setCapacidad(createDto.getCapacidad());
        espacio.setImagenUrl(createDto.getImagenUrl());
        espacio.setTipoEspacioId(createDto.getTipoEspacioId());
        espacio.setEstado(createDto.getEstado() != null ? createDto.getEstado() : "DISPONIBLE");
        
        Espacio savedEspacio = espacioRepository.save(espacio);
        return mapToResponseDto(savedEspacio);
    }
    
    @Transactional(readOnly = true)
    public List<EspacioResponseDto> getAllEspacios() {
        return espacioRepository.findAll().stream()
                .map(this::mapToResponseDto)
                .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public Page<EspacioResponseDto> getAllEspaciosPaged(Pageable pageable) {
        return espacioRepository.findAll(pageable)
                .map(this::mapToResponseDto);
    }
    
    @Transactional(readOnly = true)
    public EspacioResponseDto getEspacioById(Long id) {
        Espacio espacio = espacioRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Espacio no encontrado con ID: " + id));
        return mapToResponseDto(espacio);
    }
    
    public EspacioResponseDto updateEspacio(Long id, EspacioUpdateDto updateDto) {
        Espacio espacio = espacioRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Espacio no encontrado con ID: " + id));
        
        espacio.setNombre(updateDto.getNombre());
        espacio.setCapacidad(updateDto.getCapacidad());
        espacio.setImagenUrl(updateDto.getImagenUrl());
        espacio.setTipoEspacioId(updateDto.getTipoEspacioId());
        if (updateDto.getEstado() != null) {
            espacio.setEstado(updateDto.getEstado());
        }
        espacio.setUpdatedAt(LocalDateTime.now());
        
        Espacio updatedEspacio = espacioRepository.save(espacio);
        return mapToResponseDto(updatedEspacio);
    }
    
    public void deleteEspacio(Long id) {
        if (!espacioRepository.existsById(id)) {
            throw new RuntimeException("Espacio no encontrado con ID: " + id);
        }
        espacioRepository.deleteById(id);
    }
    
    @Transactional(readOnly = true)
    public List<EspacioResponseDto> searchEspaciosByNombre(String nombre) {
        return espacioRepository.findByNombreContainingIgnoreCase(nombre).stream()
                .map(this::mapToResponseDto)
                .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public List<EspacioResponseDto> getEspaciosByCapacidadMinima(Integer capacidadMinima) {
        return espacioRepository.findByCapacidadGreaterThanEqual(capacidadMinima).stream()
                .map(this::mapToResponseDto)
                .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public List<EspacioResponseDto> getEspaciosByCapacidadMaxima(Integer capacidadMaxima) {
        return espacioRepository.findByCapacidadLessThanEqual(capacidadMaxima).stream()
                .map(this::mapToResponseDto)
                .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public List<EspacioResponseDto> getEspaciosByCapacidadRango(Integer capacidadMinima, Integer capacidadMaxima) {
        return espacioRepository.findByCapacidadBetween(capacidadMinima, capacidadMaxima).stream()
                .map(this::mapToResponseDto)
                .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public List<EspacioResponseDto> getEspaciosByTipoEspacio(Long tipoEspacioId) {
        return espacioRepository.findByTipoEspacioId(tipoEspacioId).stream()
                .map(this::mapToResponseDto)
                .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public List<EspacioResponseDto> getEspaciosByNombre(String nombre) {
        return espacioRepository.findByNombreContainingIgnoreCase(nombre).stream()
                .map(this::mapToResponseDto)
                .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public List<EspacioResponseDto> filterEspacios(String search, Long tipoEspacioId, Integer capacidadMin, Integer capacidadMax, 
                                                   String estado, List<Long> tipoElementoIds, List<Integer> cantidadMins, List<Integer> cantidadMaxs) {
        List<Espacio> espacios = espacioRepository.findAll();
        
        // Aplicar filtros básicos
        if (search != null && !search.trim().isEmpty()) {
            espacios = espacios.stream()
                    .filter(e -> e.getNombre().toLowerCase().contains(search.toLowerCase()))
                    .collect(Collectors.toList());
        }
        
        if (tipoEspacioId != null) {
            espacios = espacios.stream()
                    .filter(e -> e.getTipoEspacioId().equals(tipoEspacioId))
                    .collect(Collectors.toList());
        }
        
        if (capacidadMin != null) {
            espacios = espacios.stream()
                    .filter(e -> e.getCapacidad() >= capacidadMin)
                    .collect(Collectors.toList());
        }
        
        if (capacidadMax != null) {
            espacios = espacios.stream()
                    .filter(e -> e.getCapacidad() <= capacidadMax)
                    .collect(Collectors.toList());
        }
        
        if (estado != null && !estado.trim().isEmpty()) {
            espacios = espacios.stream()
                    .filter(e -> e.getEstado() != null && e.getEstado().equals(estado))
                    .collect(Collectors.toList());
        }
        
        // Aplicar filtros de inventario múltiples
        if (tipoElementoIds != null && !tipoElementoIds.isEmpty()) {
            for (int i = 0; i < tipoElementoIds.size(); i++) {
                Long tipoElementoId = tipoElementoIds.get(i);
                Integer cantidadMin = (cantidadMins != null && i < cantidadMins.size()) ? cantidadMins.get(i) : null;
                Integer cantidadMax = (cantidadMaxs != null && i < cantidadMaxs.size()) ? cantidadMaxs.get(i) : null;
                
                espacios = espacios.stream()
                        .filter(e -> {
                            // Verificar si el espacio tiene inventario con este tipo de elemento
                            return e.getInventarioItems().stream()
                                    .anyMatch(item -> {
                                        if (!item.getTipoElemento().getId().equals(tipoElementoId)) {
                                            return false;
                                        }
                                        
                                        // Aplicar filtros de cantidad
                                        if (cantidadMin != null && item.getCantidad() < cantidadMin) {
                                            return false;
                                        }
                                        if (cantidadMax != null && item.getCantidad() > cantidadMax) {
                                            return false;
                                        }
                                        
                                        return true;
                                    });
                        })
                        .collect(Collectors.toList());
            }
        }
        
        return espacios.stream()
                .map(this::mapToResponseDto)
                .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public List<EspacioResponseDto> getEspaciosDisponibles(LocalDateTime inicio, LocalDateTime fin) {
        return espacioRepository.findEspaciosDisponibles(inicio, fin).stream()
                .map(this::mapToResponseDto)
                .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public Long getTotalEspacios() {
        return espacioRepository.countTotalEspacios();
    }
    
    @Transactional(readOnly = true)
    public Double getCapacidadPromedio() {
        return espacioRepository.getCapacidadPromedio();
    }
    
    @Transactional(readOnly = true)
    public Integer getCapacidadMaxima() {
        return espacioRepository.getCapacidadMaxima();
    }
    
    @Transactional(readOnly = true)
    public Integer getCapacidadMinima() {
        return espacioRepository.getCapacidadMinima();
    }
    
    private EspacioResponseDto mapToResponseDto(Espacio espacio) {
        EspacioResponseDto dto = new EspacioResponseDto();
        dto.setId(espacio.getId());
        dto.setNombre(espacio.getNombre());
        dto.setCapacidad(espacio.getCapacidad());
        dto.setImagenUrl(espacio.getImagenUrl());
        dto.setTipoEspacioId(espacio.getTipoEspacioId());
        dto.setTipoEspacioNombre(espacio.getTipoEspacio() != null ? espacio.getTipoEspacio().getNombre() : null);
        dto.setTipoEspacioColor(espacio.getTipoEspacio() != null ? espacio.getTipoEspacio().getColor() : null);
        dto.setEstado(espacio.getEstado());
        dto.setCreatedAt(espacio.getCreatedAt());
        dto.setUpdatedAt(espacio.getUpdatedAt());
        return dto;
    }
}
