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
import org.springframework.lang.Nullable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Slf4j
@Service
@Transactional
public class EspacioService {

    private static final String ESPACIO_NO_ENCONTRADO_MSG = "Espacio no encontrado con ID: ";

    private final EspacioRepository espacioRepository;

    @Nullable
    private final FileStorageService fileStorageService;

    public EspacioService(
            EspacioRepository espacioRepository,
            @Autowired(required = false) @Nullable FileStorageService fileStorageService) {
        this.espacioRepository = espacioRepository;
        this.fileStorageService = fileStorageService;
    }
    
    @org.springframework.cache.annotation.CacheEvict(value = "espacios", allEntries = true)
    public EspacioResponseDto createEspacio(EspacioCreateDto createDto) {
        // Buscar si existe un espacio con el mismo nombre (incluyendo eliminados)
        java.util.Optional<Espacio> espacioExistente = espacioRepository.findByNombreIgnoreCase(createDto.getNombre());
        
        if (espacioExistente.isPresent()) {
            Espacio espacio = espacioExistente.get();
            // Si no está eliminado, lanzar error
            if (espacio.getDeletedAt() == null) {
                throw new IllegalStateException("Ya existe un espacio activo con el nombre: " + createDto.getNombre());
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
                .toList();
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
                .orElseThrow(() -> new IllegalArgumentException(ESPACIO_NO_ENCONTRADO_MSG + id));
        return mapToResponseDto(espacio);
    }

    @org.springframework.cache.annotation.CacheEvict(value = "espacios", allEntries = true)
    public EspacioResponseDto updateEspacio(Long id, EspacioUpdateDto updateDto) {
        Espacio espacio = espacioRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException(ESPACIO_NO_ENCONTRADO_MSG + id));
        
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
                .orElseThrow(() -> new IllegalArgumentException(ESPACIO_NO_ENCONTRADO_MSG + id));
        
        // Soft delete: marcar como eliminado
        espacio.setDeletedAt(Instant.now());
        espacio.setUpdatedAt(Instant.now());
        
        espacioRepository.save(espacio);
    }
    
    @Transactional(readOnly = true)
    public List<EspacioResponseDto> searchEspaciosByNombre(String nombre) {
        return espacioRepository.findByNombreContainingIgnoreCase(nombre).stream()
                .map(this::mapToResponseDto)
                .toList();
    }
    
    @Transactional(readOnly = true)
    public List<EspacioResponseDto> getEspaciosByCapacidadMinima(Integer capacidadMinima) {
        return espacioRepository.findByCapacidadGreaterThanEqual(capacidadMinima).stream()
                .map(this::mapToResponseDto)
                .toList();
    }
    
    @Transactional(readOnly = true)
    public List<EspacioResponseDto> getEspaciosByCapacidadMaxima(Integer capacidadMaxima) {
        return espacioRepository.findByCapacidadLessThanEqual(capacidadMaxima).stream()
                .map(this::mapToResponseDto)
                .toList();
    }
    
    @Transactional(readOnly = true)
    public List<EspacioResponseDto> getEspaciosByCapacidadRango(Integer capacidadMinima, Integer capacidadMaxima) {
        return espacioRepository.findByCapacidadBetween(capacidadMinima, capacidadMaxima).stream()
                .map(this::mapToResponseDto)
                .toList();
    }
    
    @Transactional(readOnly = true)
    public List<EspacioResponseDto> getEspaciosByTipoEspacio(Long tipoEspacioId) {
        return espacioRepository.findByTipoEspacioId(tipoEspacioId).stream()
                .map(this::mapToResponseDto)
                .toList();
    }
    
    @Transactional(readOnly = true)
    public List<EspacioResponseDto> getEspaciosByNombre(String nombre) {
        return espacioRepository.findByNombreContainingIgnoreCase(nombre).stream()
                .map(this::mapToResponseDto)
                .toList();
    }
    
    /**
     * Conjunto de filtros opcionales para búsqueda de espacios. Sustituye
     * la antigua firma con 9 parámetros posicionales.
     */
    public record EspacioFilters(
            String search,
            Long tipoEspacioId,
            Long edificioId,
            Integer capacidadMin,
            Integer capacidadMax,
            String estado,
            List<Long> tipoElementoIds,
            List<Integer> cantidadMins,
            List<Integer> cantidadMaxs) {}

    @Transactional(readOnly = true)
    public List<EspacioResponseDto> filterEspacios(String search, Long tipoEspacioId, Long edificioId, Integer capacidadMin, Integer capacidadMax,
                                                   String estado, List<Long> tipoElementoIds, List<Integer> cantidadMins, List<Integer> cantidadMaxs) {
        return filterEspacios(new EspacioFilters(search, tipoEspacioId, edificioId, capacidadMin, capacidadMax,
                estado, tipoElementoIds, cantidadMins, cantidadMaxs));
    }

    @Transactional(readOnly = true)
    public List<EspacioResponseDto> filterEspacios(EspacioFilters filters) {
        List<Espacio> espacios = espacioRepository.findAll();
        espacios = aplicarFiltrosBasicos(espacios, filters);
        espacios = aplicarFiltrosInventario(espacios, filters);

        return espacios.stream()
                .map(this::mapToResponseDto)
                .toList();
    }

    private List<Espacio> aplicarFiltrosBasicos(List<Espacio> espacios, EspacioFilters f) {
        List<Espacio> resultado = espacios;
        if (f.search() != null && !f.search().trim().isEmpty()) {
            String searchLower = f.search().toLowerCase();
            resultado = resultado.stream()
                    .filter(e -> e.getNombre().toLowerCase().contains(searchLower))
                    .toList();
        }
        if (f.tipoEspacioId() != null) {
            resultado = resultado.stream()
                    .filter(e -> e.getTipoEspacioId().equals(f.tipoEspacioId()))
                    .toList();
        }
        if (f.edificioId() != null) {
            resultado = resultado.stream()
                    .filter(e -> e.getEdificioId() != null && e.getEdificioId().equals(f.edificioId()))
                    .toList();
        }
        if (f.capacidadMin() != null) {
            resultado = resultado.stream()
                    .filter(e -> e.getCapacidad() >= f.capacidadMin())
                    .toList();
        }
        if (f.capacidadMax() != null) {
            resultado = resultado.stream()
                    .filter(e -> e.getCapacidad() <= f.capacidadMax())
                    .toList();
        }
        if (f.estado() != null && !f.estado().trim().isEmpty()) {
            resultado = resultado.stream()
                    .filter(e -> e.getEstado() != null && e.getEstado().equals(f.estado()))
                    .toList();
        }
        return resultado;
    }

    private List<Espacio> aplicarFiltrosInventario(List<Espacio> espacios, EspacioFilters f) {
        List<Long> tipoElementoIds = f.tipoElementoIds();
        if (tipoElementoIds == null || tipoElementoIds.isEmpty()) {
            return espacios;
        }
        List<Espacio> resultado = espacios;
        for (int i = 0; i < tipoElementoIds.size(); i++) {
            Long tipoElementoId = tipoElementoIds.get(i);
            Integer cantidadMin = obtenerEnIndice(f.cantidadMins(), i);
            Integer cantidadMax = obtenerEnIndice(f.cantidadMaxs(), i);

            resultado = resultado.stream()
                    .filter(e -> tieneInventarioConCantidad(e, tipoElementoId, cantidadMin, cantidadMax))
                    .toList();
        }
        return resultado;
    }

    private Integer obtenerEnIndice(List<Integer> lista, int i) {
        return (lista != null && i < lista.size()) ? lista.get(i) : null;
    }

    private boolean tieneInventarioConCantidad(Espacio espacio, Long tipoElementoId, Integer cantidadMin, Integer cantidadMax) {
        return espacio.getInventarioItems().stream()
                .anyMatch(item -> coincideItemConCantidad(item, tipoElementoId, cantidadMin, cantidadMax));
    }

    private boolean coincideItemConCantidad(com.utec.backend.model.InventarioItem item, Long tipoElementoId,
                                            Integer cantidadMin, Integer cantidadMax) {
        if (!item.getTipoElemento().getId().equals(tipoElementoId)) {
            return false;
        }
        if (cantidadMin != null && item.getCantidad() < cantidadMin) {
            return false;
        }
        return cantidadMax == null || item.getCantidad() <= cantidadMax;
    }
    
    @Transactional(readOnly = true)
    public List<EspacioResponseDto> getEspaciosDisponibles(Instant inicio, Instant fin) {
        return espacioRepository.findEspaciosDisponibles(inicio, fin).stream()
                .map(this::mapToResponseDto)
                .toList();
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

    @Transactional(readOnly = true)
    public Long countByEstado(String estado) {
        return espacioRepository.findAll().stream()
                .filter(e -> estado.equals(e.getEstado()))
                .count();
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
                .orElseThrow(() -> new IllegalArgumentException(ESPACIO_NO_ENCONTRADO_MSG + espacioId));
        
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
            // Solo se ofrece si existe: para las fotos viejas el listado sigue
            // usando la original hasta que se genere.
            String miniatura = fileStorageService.getMiniaturaObjectName(imagenUrl);
            if (miniatura != null && fileStorageService.existeMiniatura(imagenUrl)) {
                dto.setImagenThumbUrl(fileStorageService.getImageUrl(miniatura));
            }
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
