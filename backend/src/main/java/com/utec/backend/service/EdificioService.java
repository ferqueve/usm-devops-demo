package com.utec.backend.service;

import com.utec.backend.dto.edificio.EdificioResponseDto;
import com.utec.backend.model.Edificio;
import com.utec.backend.repository.EdificioRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class EdificioService {
    
    private final EdificioRepository edificioRepository;
    
    @Transactional(readOnly = true)
    public List<EdificioResponseDto> getAllEdificios() {
        return edificioRepository.findByActivoTrue().stream()
                .map(this::mapToResponseDto)
                .toList();
    }
    
    @Transactional(readOnly = true)
    public EdificioResponseDto getEdificioById(Long id) {
        Edificio edificio = edificioRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Edificio no encontrado con ID: " + id));
        return mapToResponseDto(edificio);
    }
    
    private EdificioResponseDto mapToResponseDto(Edificio edificio) {
        EdificioResponseDto dto = new EdificioResponseDto();
        dto.setId(edificio.getId());
        dto.setNombre(edificio.getNombre());
        dto.setCodigo(edificio.getCodigo());
        dto.setDescripcion(edificio.getDescripcion());
        dto.setActivo(edificio.getActivo());
        dto.setCreatedAt(edificio.getCreatedAt());
        dto.setUpdatedAt(edificio.getUpdatedAt());
        dto.setDeletedAt(edificio.getDeletedAt());
        return dto;
    }
}

