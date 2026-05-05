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

import java.time.Instant;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class CarreraService {
    
    private final CarreraRepository carreraRepository;
    
    public CarreraResponseDto createCarrera(CarreraCreateDto createDto) {
        // Si se proporciona código, buscar si existe una carrera con el mismo código (incluyendo eliminadas)
        if (createDto.getCodigo() != null && !createDto.getCodigo().trim().isEmpty()) {
            java.util.Optional<Carrera> carreraExistente = carreraRepository.findByCodigoIncludingDeleted(createDto.getCodigo());
            
            if (carreraExistente.isPresent()) {
                Carrera carrera = carreraExistente.get();
                // Si no está eliminada, lanzar error
                if (carrera.getDeletedAt() == null) {
                    throw new IllegalStateException("Ya existe una carrera activa con el código: " + createDto.getCodigo());
                }
                // Si está eliminada, reactivarla
                carrera.setNombre(createDto.getNombre());
                carrera.setDeletedAt(null);
                carrera.setUpdatedAt(Instant.now());
                Carrera savedCarrera = carreraRepository.save(carrera);
                return mapToResponseDto(savedCarrera);
            }
        }
        
        // Si no existe, crear una nueva
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
                .toList();
    }
    
    @Transactional(readOnly = true)
    public Page<CarreraResponseDto> getAllCarrerasPaged(Pageable pageable) {
        return carreraRepository.findAll(pageable)
                .map(this::mapToResponseDto);
    }
    
    @Transactional(readOnly = true)
    public CarreraResponseDto getCarreraById(Long id) {
        Carrera carrera = carreraRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Carrera no encontrada con ID: " + id));
        return mapToResponseDto(carrera);
    }

    public CarreraResponseDto updateCarrera(Long id, CarreraUpdateDto updateDto) {
        Carrera carrera = carreraRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Carrera no encontrada con ID: " + id));

        // Verificar si ya existe otra carrera con el mismo código (si se proporciona)
        if (updateDto.getCodigo() != null && !updateDto.getCodigo().trim().isEmpty()) {
            if (carreraRepository.existsByCodigoAndIdNot(updateDto.getCodigo(), id)) {
                throw new IllegalStateException("Ya existe otra carrera con el código: " + updateDto.getCodigo());
            }
        }
        
        if (updateDto.getNombre() != null) {
            carrera.setNombre(updateDto.getNombre());
        }
        
        if (updateDto.getCodigo() != null) {
            carrera.setCodigo(updateDto.getCodigo().trim().isEmpty() ? null : updateDto.getCodigo());
        }
        
        carrera.setUpdatedAt(Instant.now());
        
        Carrera updatedCarrera = carreraRepository.save(carrera);
        return mapToResponseDto(updatedCarrera);
    }
    
    public void deleteCarrera(Long id) {
        Carrera carrera = carreraRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Carrera no encontrada con ID: " + id));
        
        // Soft delete: marcar como eliminada
        carrera.setDeletedAt(Instant.now());
        carrera.setUpdatedAt(Instant.now());
        
        carreraRepository.save(carrera);
    }
    
    @Transactional(readOnly = true)
    public List<CarreraResponseDto> searchCarrerasByNombre(String nombre) {
        return carreraRepository.findByNombreContainingIgnoreCase(nombre).stream()
                .map(this::mapToResponseDto)
                .toList();
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

