package com.utec.backend.service;

import com.utec.backend.dto.tipo_espacio.TipoEspacioCreateDto;
import com.utec.backend.dto.tipo_espacio.TipoEspacioResponseDto;
import com.utec.backend.dto.tipo_espacio.TipoEspacioUpdateDto;
import com.utec.backend.model.TipoEspacio;
import com.utec.backend.repository.TipoEspacioRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("Tests para TipoEspacioService")
class TipoEspacioServiceTest {

    @Mock
    private TipoEspacioRepository tipoEspacioRepository;

    @InjectMocks
    private TipoEspacioService tipoEspacioService;

    private TipoEspacio tipoEspacioTest;
    private final Long tipoEspacioId = 1L;
    private final String nombreTipoEspacio = "Aula";

    @BeforeEach
    void setUp() {
        tipoEspacioTest = new TipoEspacio();
        tipoEspacioTest.setId(tipoEspacioId);
        tipoEspacioTest.setNombre(nombreTipoEspacio);
        tipoEspacioTest.setDescripcion("Espacio para clases");
        tipoEspacioTest.setColor("#FF5733");
        tipoEspacioTest.setActivo(true);
        tipoEspacioTest.setCreatedAt(LocalDateTime.now());
        tipoEspacioTest.setUpdatedAt(LocalDateTime.now());
        tipoEspacioTest.setEspacios(Arrays.asList());
    }

    @Test
    @DisplayName("Debe crear tipo de espacio exitosamente")
    void debeCrearTipoEspacioExitosamente() {
        // Given
        TipoEspacioCreateDto createDto = new TipoEspacioCreateDto();
        createDto.setNombre("Laboratorio");
        createDto.setDescripcion("Espacio para prácticas");
        createDto.setColor("#33FF57");

        when(tipoEspacioRepository.existsByNombreIgnoreCase(anyString())).thenReturn(false);
        when(tipoEspacioRepository.save(any(TipoEspacio.class))).thenReturn(tipoEspacioTest);

        // When
        TipoEspacioResponseDto resultado = tipoEspacioService.createTipoEspacio(createDto);

        // Then
        assertNotNull(resultado);
        verify(tipoEspacioRepository).existsByNombreIgnoreCase(anyString());
        verify(tipoEspacioRepository).save(any(TipoEspacio.class));
    }

    @Test
    @DisplayName("Debe lanzar excepción cuando el nombre ya existe")
    void debeLanzarExcepcionNombreDuplicado() {
        // Given
        TipoEspacioCreateDto createDto = new TipoEspacioCreateDto();
        createDto.setNombre(nombreTipoEspacio);

        when(tipoEspacioRepository.existsByNombreIgnoreCase(nombreTipoEspacio)).thenReturn(true);

        // When & Then
        RuntimeException exception = assertThrows(RuntimeException.class, () -> {
            tipoEspacioService.createTipoEspacio(createDto);
        });

        assertTrue(exception.getMessage().contains("Ya existe un tipo de espacio"));
        verify(tipoEspacioRepository, never()).save(any(TipoEspacio.class));
    }

    @Test
    @DisplayName("Debe obtener todos los tipos de espacio activos")
    void debeObtenerTodosLosTiposEspacio() {
        // Given
        when(tipoEspacioRepository.findByActivoTrue()).thenReturn(Arrays.asList(tipoEspacioTest));

        // When
        List<TipoEspacioResponseDto> resultado = tipoEspacioService.getAllTiposEspacio();

        // Then
        assertNotNull(resultado);
        assertEquals(1, resultado.size());
        verify(tipoEspacioRepository).findByActivoTrue();
    }

    @Test
    @DisplayName("Debe obtener tipos de espacio paginados")
    void debeObtenerTiposEspacioPaginados() {
        // Given
        Page<TipoEspacio> page = new PageImpl<>(Arrays.asList(tipoEspacioTest), PageRequest.of(0, 10), 1);

        when(tipoEspacioRepository.findAll(any(org.springframework.data.domain.Pageable.class))).thenReturn(page);

        // When
        Page<TipoEspacioResponseDto> resultado = tipoEspacioService.getAllTiposEspacioPaged(PageRequest.of(0, 10));

        // Then
        assertNotNull(resultado);
        assertEquals(1, resultado.getTotalElements());
    }

    @Test
    @DisplayName("Debe obtener tipo de espacio por ID")
    void debeObtenerTipoEspacioPorId() {
        // Given
        when(tipoEspacioRepository.findById(tipoEspacioId)).thenReturn(Optional.of(tipoEspacioTest));

        // When
        TipoEspacioResponseDto resultado = tipoEspacioService.getTipoEspacioById(tipoEspacioId);

        // Then
        assertNotNull(resultado);
        assertEquals(tipoEspacioId, resultado.getId());
        verify(tipoEspacioRepository).findById(tipoEspacioId);
    }

    @Test
    @DisplayName("Debe lanzar excepción cuando el tipo no existe")
    void debeLanzarExcepcionTipoNoExiste() {
        // Given
        Long idInexistente = 999L;
        when(tipoEspacioRepository.findById(idInexistente)).thenReturn(Optional.empty());

        // When & Then
        assertThrows(RuntimeException.class, () -> {
            tipoEspacioService.getTipoEspacioById(idInexistente);
        });
    }

    @Test
    @DisplayName("Debe actualizar tipo de espacio exitosamente")
    void debeActualizarTipoEspacioExitosamente() {
        // Given
        TipoEspacioUpdateDto updateDto = new TipoEspacioUpdateDto();
        updateDto.setNombre("Aula Actualizada");
        updateDto.setDescripcion("Nueva descripción");
        updateDto.setColor("#FF0000");

        when(tipoEspacioRepository.findById(tipoEspacioId)).thenReturn(Optional.of(tipoEspacioTest));
        when(tipoEspacioRepository.existsByNombreIgnoreCaseAndIdNot(anyString(), anyLong())).thenReturn(false);
        when(tipoEspacioRepository.save(any(TipoEspacio.class))).thenReturn(tipoEspacioTest);

        // When
        TipoEspacioResponseDto resultado = tipoEspacioService.updateTipoEspacio(tipoEspacioId, updateDto);

        // Then
        assertNotNull(resultado);
        verify(tipoEspacioRepository).findById(tipoEspacioId);
        verify(tipoEspacioRepository).save(tipoEspacioTest);
    }

    @Test
    @DisplayName("Debe lanzar excepción al actualizar con nombre duplicado")
    void debeLanzarExcepcionNombreDuplicadoAlActualizar() {
        // Given
        TipoEspacioUpdateDto updateDto = new TipoEspacioUpdateDto();
        updateDto.setNombre("Nombre Duplicado");

        when(tipoEspacioRepository.findById(tipoEspacioId)).thenReturn(Optional.of(tipoEspacioTest));
        when(tipoEspacioRepository.existsByNombreIgnoreCaseAndIdNot("Nombre Duplicado", tipoEspacioId)).thenReturn(true);

        // When & Then
        assertThrows(RuntimeException.class, () -> {
            tipoEspacioService.updateTipoEspacio(tipoEspacioId, updateDto);
        });
    }

    @Test
    @DisplayName("Debe eliminar tipo de espacio (soft delete)")
    void debeEliminarTipoEspacio() {
        // Given
        when(tipoEspacioRepository.findById(tipoEspacioId)).thenReturn(Optional.of(tipoEspacioTest));
        when(tipoEspacioRepository.save(any(TipoEspacio.class))).thenReturn(tipoEspacioTest);

        // When
        assertDoesNotThrow(() -> tipoEspacioService.deleteTipoEspacio(tipoEspacioId));

        // Then
        verify(tipoEspacioRepository).findById(tipoEspacioId);
        verify(tipoEspacioRepository).save(tipoEspacioTest);
        assertFalse(tipoEspacioTest.getActivo());
    }

    @Test
    @DisplayName("Debe toggle activo del tipo de espacio")
    void debeToggleActivo() {
        // Given
        tipoEspacioTest.setActivo(false);
        when(tipoEspacioRepository.findById(tipoEspacioId)).thenReturn(Optional.of(tipoEspacioTest));
        when(tipoEspacioRepository.save(any(TipoEspacio.class))).thenReturn(tipoEspacioTest);

        // When
        TipoEspacioResponseDto resultado = tipoEspacioService.toggleActivo(tipoEspacioId);

        // Then
        assertNotNull(resultado);
        verify(tipoEspacioRepository).save(tipoEspacioTest);
    }

    @Test
    @DisplayName("Debe buscar tipos de espacio por nombre")
    void debeBuscarTiposEspacioPorNombre() {
        // Given
        String nombre = "Aula";
        when(tipoEspacioRepository.findByNombreContainingIgnoreCaseAndActivoTrue(nombre))
                .thenReturn(Arrays.asList(tipoEspacioTest));

        // When
        List<TipoEspacioResponseDto> resultado = tipoEspacioService.searchTiposEspacioByNombre(nombre);

        // Then
        assertNotNull(resultado);
        assertEquals(1, resultado.size());
        verify(tipoEspacioRepository).findByNombreContainingIgnoreCaseAndActivoTrue(nombre);
    }

    @Test
    @DisplayName("Debe obtener tipos más utilizados")
    void debeObtenerTiposMasUtilizados() {
        // Given
        when(tipoEspacioRepository.findTiposMasUtilizados()).thenReturn(Arrays.asList(tipoEspacioTest));

        // When
        List<TipoEspacioResponseDto> resultado = tipoEspacioService.getTiposMasUtilizados();

        // Then
        assertNotNull(resultado);
        assertEquals(1, resultado.size());
        verify(tipoEspacioRepository).findTiposMasUtilizados();
    }

    @Test
    @DisplayName("Debe obtener total de tipos de espacio")
    void debeObtenerTotalTiposEspacio() {
        // Given
        when(tipoEspacioRepository.countByActivoTrue()).thenReturn(5L);

        // When
        Long total = tipoEspacioService.getTotalTiposEspacio();

        // Then
        assertEquals(5L, total);
        verify(tipoEspacioRepository).countByActivoTrue();
    }
}
