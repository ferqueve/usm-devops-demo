package com.utec.backend.service;

import com.utec.backend.dto.espacio.EspacioCreateDto;
import com.utec.backend.dto.espacio.EspacioResponseDto;
import com.utec.backend.dto.espacio.EspacioUpdateDto;
import com.utec.backend.model.Espacio;
import com.utec.backend.repository.EspacioRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@Transactional
public class EspacioService {

    private final EspacioRepository espacioRepository;

    @Autowired(required = false)
    private FileStorageService fileStorageService;

    public EspacioService(EspacioRepository espacioRepository) {
        this.espacioRepository = espacioRepository;
    }
    
    @org.springframework.cache.annotation.CacheEvict(value = "espacios", allEntries = true)
    public EspacioResponseDto createEspacio(EspacioCreateDto createDto) {
        // Buscar si existe un espacio con el mismo nombre (incluyendo eliminados)
        java.util.Optional<Espacio> espacioExistente = espacioRepository.findByNombreIgnoreCase(createDto.getNombre());
        
        if (espacioExistente.isPresent()) {
            Espacio espacio = espacioExistente.get();
            // Si no está eliminado, lanzar error
            if (espacio.getDeletedAt() == null) {
                throw new RuntimeException("Ya existe un espacio activo con el nombre: " + createDto.getNombre());
            }
            // Si está eliminado, reactivarlo
            espacio.setCapacidad(createDto.getCapacidad());
            espacio.setImagenUrl(createDto.getImagenUrl());
            espacio.setTipoEspacioId(createDto.getTipoEspacioId());
            espacio.setEstado(createDto.getEstado() != null ? createDto.getEstado() : "DISPONIBLE");
            espacio.setEdificioId(createDto.getEdificioId());
            espacio.setDeletedAt(null);
            espacio.setUpdatedAt(Instant.now());
            Espacio savedEspacio = espacioRepository.save(espacio);
            return mapToResponseDto(savedEspacio);
        }
        
        // Si no existe, crear uno nuevo
        Espacio espacio = new Espacio();
        espacio.setNombre(createDto.getNombre());
        espacio.setCapacidad(createDto.getCapacidad());
        espacio.setImagenUrl(createDto.getImagenUrl());
        espacio.setTipoEspacioId(createDto.getTipoEspacioId());
        espacio.setEstado(createDto.getEstado() != null ? createDto.getEstado() : "DISPONIBLE");
        espacio.setEdificioId(createDto.getEdificioId());
        
        Espacio savedEspacio = espacioRepository.save(espacio);
        return mapToResponseDto(savedEspacio);
    }
    
    @Transactional(readOnly = true)
    @org.springframework.cache.annotation.Cacheable(value = "espacios", key = "'all'")
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
    @org.springframework.cache.annotation.Cacheable(value = "espacios", key = "#id")
    public EspacioResponseDto getEspacioById(Long id) {
        Espacio espacio = espacioRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Espacio no encontrado con ID: " + id));
        return mapToResponseDto(espacio);
    }
    
    @org.springframework.cache.annotation.CacheEvict(value = "espacios", allEntries = true)
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
        espacio.setEdificioId(updateDto.getEdificioId());
        espacio.setUpdatedAt(Instant.now());
        
        Espacio updatedEspacio = espacioRepository.save(espacio);
        return mapToResponseDto(updatedEspacio);
    }
    
    @org.springframework.cache.annotation.CacheEvict(value = "espacios", allEntries = true)
    public void deleteEspacio(Long id) {
        Espacio espacio = espacioRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Espacio no encontrado con ID: " + id));
        
        // Soft delete: marcar como eliminado
        espacio.setDeletedAt(Instant.now());
        espacio.setUpdatedAt(Instant.now());
        
        espacioRepository.save(espacio);
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
    public List<EspacioResponseDto> filterEspacios(String search, Long tipoEspacioId, Long edificioId, Integer capacidadMin, Integer capacidadMax, 
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
        
        if (edificioId != null) {
            espacios = espacios.stream()
                    .filter(e -> e.getEdificioId() != null && e.getEdificioId().equals(edificioId))
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
    public List<EspacioResponseDto> getEspaciosDisponibles(Instant inicio, Instant fin) {
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
    
    /**
     * Actualiza solo la imagen de un espacio
     *
     * @param espacioId ID del espacio
     * @param objectName Nombre del objeto en MinIO (o null para eliminar)
     */
    @org.springframework.cache.annotation.CacheEvict(value = "espacios", allEntries = true)
    public void updateEspacioImagen(Long espacioId, String objectName) {
        Espacio espacio = espacioRepository.findById(espacioId)
                .orElseThrow(() -> new RuntimeException("Espacio no encontrado con ID: " + espacioId));
        
        // Si hay una imagen anterior y es diferente, eliminarla
        String oldImageUrl = espacio.getImagenUrl();
        if (oldImageUrl != null && !oldImageUrl.trim().isEmpty() && !oldImageUrl.equals(objectName)) {
            try {
                fileStorageService.deleteImage(oldImageUrl);
            } catch (Exception e) {
                log.warn("Error al eliminar imagen anterior del espacio {}: {}", espacioId, e.getMessage());
            }
        }
        
        espacio.setImagenUrl(objectName);
        espacio.setUpdatedAt(Instant.now());
        espacioRepository.save(espacio);
    }
    
    private EspacioResponseDto mapToResponseDto(Espacio espacio) {
        EspacioResponseDto dto = new EspacioResponseDto();
        dto.setId(espacio.getId());
        dto.setNombre(espacio.getNombre());
        dto.setCapacidad(espacio.getCapacidad());
        
        // Convertir ruta de MinIO a URL pública si es necesario
        String imagenUrl = espacio.getImagenUrl();
        if (imagenUrl != null && !imagenUrl.trim().isEmpty()) {
            dto.setImagenUrl(fileStorageService.getImageUrl(imagenUrl));
        } else {
            dto.setImagenUrl(null);
        }
        
        dto.setTipoEspacioId(espacio.getTipoEspacioId());
        dto.setTipoEspacioNombre(espacio.getTipoEspacio() != null ? espacio.getTipoEspacio().getNombre() : null);
        dto.setTipoEspacioColor(espacio.getTipoEspacio() != null ? espacio.getTipoEspacio().getColor() : null);
        dto.setEstado(espacio.getEstado());
        dto.setEdificioId(espacio.getEdificioId());
        dto.setEdificioNombre(espacio.getEdificio() != null ? espacio.getEdificio().getNombre() : null);
        dto.setEdificioCodigo(espacio.getEdificio() != null ? espacio.getEdificio().getCodigo() : null);
        dto.setCreatedAt(espacio.getCreatedAt());
        dto.setUpdatedAt(espacio.getUpdatedAt());
        return dto;
    }
}
