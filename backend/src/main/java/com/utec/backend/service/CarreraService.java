package com.utec.backend.service;

import com.utec.backend.dto.carrera.CarreraCreateDto;
import com.utec.backend.dto.carrera.CarreraResponseDto;
import com.utec.backend.dto.carrera.CarreraUpdateDto;
import com.utec.backend.model.Carrera;
import com.utec.backend.repository.CarreraRepository;
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
public class CarreraService {
    
    private final CarreraRepository carreraRepository;
    
    public CarreraResponseDto createCarrera(CarreraCreateDto createDto) {
        // Verificar si ya existe una carrera con el mismo código (si se proporciona)
        if (createDto.getCodigo() != null && !createDto.getCodigo().trim().isEmpty()) {
            if (carreraRepository.existsByCodigo(createDto.getCodigo())) {
                throw new RuntimeException("Ya existe una carrera con el código: " + createDto.getCodigo());
            }
        }
        
        Carrera carrera = new Carrera();
        carrera.setNombre(createDto.getNombre());
        carrera.setCodigo(createDto.getCodigo() != null && !createDto.getCodigo().trim().isEmpty() 
                ? createDto.getCodigo() : null);
        carrera.setDeletedAt(null); // Nueva carrera activa
        
        Carrera savedCarrera = carreraRepository.save(carrera);
        return mapToResponseDto(savedCarrera);
    }
    
    @Transactional(readOnly = true)
    public List<CarreraResponseDto> getAllCarreras() {
        return carreraRepository.findByActivoTrue().stream()
                .map(this::mapToResponseDto)
                .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public Page<CarreraResponseDto> getAllCarrerasPaged(Pageable pageable) {
        return carreraRepository.findAll(pageable)
                .map(this::mapToResponseDto);
    }
    
    @Transactional(readOnly = true)
    public CarreraResponseDto getCarreraById(Long id) {
        Carrera carrera = carreraRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Carrera no encontrada con ID: " + id));
        return mapToResponseDto(carrera);
    }
    
    public CarreraResponseDto updateCarrera(Long id, CarreraUpdateDto updateDto) {
        Carrera carrera = carreraRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Carrera no encontrada con ID: " + id));
        
        // Verificar si ya existe otra carrera con el mismo código (si se proporciona)
        if (updateDto.getCodigo() != null && !updateDto.getCodigo().trim().isEmpty()) {
            if (carreraRepository.existsByCodigoAndIdNot(updateDto.getCodigo(), id)) {
                throw new RuntimeException("Ya existe otra carrera con el código: " + updateDto.getCodigo());
            }
        }
        
        if (updateDto.getNombre() != null) {
            carrera.setNombre(updateDto.getNombre());
        }
        
        if (updateDto.getCodigo() != null) {
            carrera.setCodigo(updateDto.getCodigo().trim().isEmpty() ? null : updateDto.getCodigo());
        }
        
        carrera.setUpdatedAt(LocalDateTime.now());
        
        Carrera updatedCarrera = carreraRepository.save(carrera);
        return mapToResponseDto(updatedCarrera);
    }
    
    public void deleteCarrera(Long id) {
        Carrera carrera = carreraRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Carrera no encontrada con ID: " + id));
        
        // Soft delete: marcar como eliminada
        carrera.setDeletedAt(LocalDateTime.now());
        carrera.setUpdatedAt(LocalDateTime.now());
        
        carreraRepository.save(carrera);
    }
    
    @Transactional(readOnly = true)
    public List<CarreraResponseDto> searchCarrerasByNombre(String nombre) {
        return carreraRepository.findByNombreContainingIgnoreCase(nombre).stream()
                .map(this::mapToResponseDto)
                .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public Long getTotalCarreras() {
        return carreraRepository.countByActivoTrue();
    }
    
    private CarreraResponseDto mapToResponseDto(Carrera carrera) {
        CarreraResponseDto dto = new CarreraResponseDto();
        dto.setId(carrera.getId());
        dto.setNombre(carrera.getNombre());
        dto.setCodigo(carrera.getCodigo());
        dto.setCreatedAt(carrera.getCreatedAt());
        dto.setUpdatedAt(carrera.getUpdatedAt());
        dto.setDeletedAt(carrera.getDeletedAt());
        return dto;
    }
}

