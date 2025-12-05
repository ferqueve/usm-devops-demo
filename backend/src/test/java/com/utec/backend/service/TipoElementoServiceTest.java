package com.utec.backend.service;

import com.utec.backend.dto.tipo_elemento.TipoElementoCreateDto;
import com.utec.backend.dto.tipo_elemento.TipoElementoResponseDto;
import com.utec.backend.dto.tipo_elemento.TipoElementoUpdateDto;
import com.utec.backend.model.InventarioItem;
import com.utec.backend.model.TipoElemento;
import com.utec.backend.repository.TipoElementoRepository;
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

import java.time.Instant;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("Tests para TipoElementoService")
class TipoElementoServiceTest {

    @Mock
    private TipoElementoRepository tipoElementoRepository;

    @InjectMocks
    private TipoElementoService tipoElementoService;

    private TipoElemento tipoElementoTest;
    private final Long tipoElementoId = 1L;
    private final String nombreTipoElemento = "Proyector";

    @BeforeEach
    void setUp() {
        tipoElementoTest = new TipoElemento();
        tipoElementoTest.setId(tipoElementoId);
        tipoElementoTest.setNombre(nombreTipoElemento);
        tipoElementoTest.setDescripcion("Equipo de proyección");
        tipoElementoTest.setActivo(true);
        tipoElementoTest.setCreatedAt(Instant.now());
        tipoElementoTest.setUpdatedAt(Instant.now());
        tipoElementoTest.setInventarioItems(Collections.emptyList());
    }

    @Test
    @DisplayName("Debe crear tipo de elemento exitosamente")
    void debeCrearTipoElementoExitosamente() {
        // Given
        TipoElementoCreateDto createDto = new TipoElementoCreateDto();
        createDto.setNombre("Pizarra");
        createDto.setDescripcion("Pizarra blanca");

        when(tipoElementoRepository.existsByNombreIgnoreCase(anyString())).thenReturn(false);
        when(tipoElementoRepository.save(any(TipoElemento.class))).thenReturn(tipoElementoTest);

        // When
        TipoElementoResponseDto resultado = tipoElementoService.createTipoElemento(createDto);

        // Then
        assertNotNull(resultado);
        verify(tipoElementoRepository).existsByNombreIgnoreCase(anyString());
        verify(tipoElementoRepository).save(any(TipoElemento.class));
    }

    @Test
    @DisplayName("Debe lanzar excepción cuando el nombre ya existe")
    void debeLanzarExcepcionNombreDuplicado() {
        // Given
        TipoElementoCreateDto createDto = new TipoElementoCreateDto();
        createDto.setNombre(nombreTipoElemento);

        when(tipoElementoRepository.existsByNombreIgnoreCase(nombreTipoElemento)).thenReturn(true);

        // When & Then
        RuntimeException exception = assertThrows(RuntimeException.class, () -> {
            tipoElementoService.createTipoElemento(createDto);
        });

        assertTrue(exception.getMessage().contains("Ya existe un tipo de elemento"));
        verify(tipoElementoRepository, never()).save(any(TipoElemento.class));
    }

    @Test
    @DisplayName("Debe obtener todos los tipos de elemento")
    void debeObtenerTodosLosTiposElemento() {
        // Given
        when(tipoElementoRepository.findByActivoTrue()).thenReturn(Arrays.asList(tipoElementoTest));

        // When
        List<TipoElementoResponseDto> resultado = tipoElementoService.getAllTiposElemento();

        // Then
        assertNotNull(resultado);
        assertEquals(1, resultado.size());
        verify(tipoElementoRepository).findByActivoTrue();
    }

    @Test
    @DisplayName("Debe obtener tipos de elemento paginados")
    void debeObtenerTiposElementoPaginados() {
        // Given
        Page<TipoElemento> page = new PageImpl<>(Arrays.asList(tipoElementoTest), PageRequest.of(0, 10), 1);

        when(tipoElementoRepository.findAll(any(org.springframework.data.domain.Pageable.class))).thenReturn(page);

        // When
        Page<TipoElementoResponseDto> resultado = tipoElementoService.getAllTiposElementoPaged(PageRequest.of(0, 10));

        // Then
        assertNotNull(resultado);
        assertEquals(1, resultado.getTotalElements());
    }

    @Test
    @DisplayName("Debe obtener tipo de elemento por ID")
    void debeObtenerTipoElementoPorId() {
        // Given
        when(tipoElementoRepository.findById(tipoElementoId)).thenReturn(Optional.of(tipoElementoTest));

        // When
        TipoElementoResponseDto resultado = tipoElementoService.getTipoElementoById(tipoElementoId);

        // Then
        assertNotNull(resultado);
        assertEquals(tipoElementoId, resultado.getId());
        verify(tipoElementoRepository).findById(tipoElementoId);
    }

    @Test
    @DisplayName("Debe lanzar excepción cuando el tipo no existe")
    void debeLanzarExcepcionTipoNoExiste() {
        // Given
        Long idInexistente = 999L;
        when(tipoElementoRepository.findById(idInexistente)).thenReturn(Optional.empty());

        // When & Then
        assertThrows(RuntimeException.class, () -> {
            tipoElementoService.getTipoElementoById(idInexistente);
        });
    }

    @Test
    @DisplayName("Debe actualizar tipo de elemento exitosamente")
    void debeActualizarTipoElementoExitosamente() {
        // Given
        TipoElementoUpdateDto updateDto = new TipoElementoUpdateDto();
        updateDto.setNombre("Proyector Actualizado");
        updateDto.setDescripcion("Nueva descripción");

        when(tipoElementoRepository.findById(tipoElementoId)).thenReturn(Optional.of(tipoElementoTest));
        when(tipoElementoRepository.existsByNombreIgnoreCaseAndIdNot(anyString(), anyLong())).thenReturn(false);
        when(tipoElementoRepository.save(any(TipoElemento.class))).thenReturn(tipoElementoTest);

        // When
        TipoElementoResponseDto resultado = tipoElementoService.updateTipoElemento(tipoElementoId, updateDto);

        // Then
        assertNotNull(resultado);
        verify(tipoElementoRepository).findById(tipoElementoId);
        verify(tipoElementoRepository).save(tipoElementoTest);
    }

    @Test
    @DisplayName("Debe eliminar tipo de elemento exitosamente")
    void debeEliminarTipoElementoExitosamente() {
        // Given - Sin items asociados
        tipoElementoTest.setInventarioItems(Collections.emptyList());
        when(tipoElementoRepository.findById(tipoElementoId)).thenReturn(Optional.of(tipoElementoTest));
        doNothing().when(tipoElementoRepository).deleteById(tipoElementoId);

        // When
        assertDoesNotThrow(() -> tipoElementoService.deleteTipoElemento(tipoElementoId));

        // Then
        verify(tipoElementoRepository).findById(tipoElementoId);
        verify(tipoElementoRepository).deleteById(tipoElementoId);
    }

    @Test
    @DisplayName("Debe lanzar excepción al eliminar tipo con items asociados")
    void debeLanzarExcepcionAlEliminarConItemsAsociados() {
        // Given - Con items asociados
        InventarioItem item = new InventarioItem();
        tipoElementoTest.setInventarioItems(Arrays.asList(item));

        when(tipoElementoRepository.findById(tipoElementoId)).thenReturn(Optional.of(tipoElementoTest));

        // When & Then
        RuntimeException exception = assertThrows(RuntimeException.class, () -> {
            tipoElementoService.deleteTipoElemento(tipoElementoId);
        });

        assertTrue(exception.getMessage().contains("tiene items de inventario asociados"));
        verify(tipoElementoRepository, never()).deleteById(anyLong());
    }

    @Test
    @DisplayName("Debe toggle activo del tipo de elemento")
    void debeToggleActivo() {
        // Given
        tipoElementoTest.setActivo(false);
        when(tipoElementoRepository.findById(tipoElementoId)).thenReturn(Optional.of(tipoElementoTest));
        when(tipoElementoRepository.save(any(TipoElemento.class))).thenReturn(tipoElementoTest);

        // When
        TipoElementoResponseDto resultado = tipoElementoService.toggleActivo(tipoElementoId);

        // Then
        assertNotNull(resultado);
        verify(tipoElementoRepository).save(tipoElementoTest);
    }

    @Test
    @DisplayName("Debe buscar tipos de elemento por nombre")
    void debeBuscarTiposElementoPorNombre() {
        // Given
        String nombre = "Proyector";
        when(tipoElementoRepository.findByNombreContainingIgnoreCaseAndActivoTrue(nombre))
                .thenReturn(Arrays.asList(tipoElementoTest));

        // When
        List<TipoElementoResponseDto> resultado = tipoElementoService.searchTiposElementoByNombre(nombre);

        // Then
        assertNotNull(resultado);
        assertEquals(1, resultado.size());
        verify(tipoElementoRepository).findByNombreContainingIgnoreCaseAndActivoTrue(nombre);
    }

    @Test
    @DisplayName("Debe obtener tipos más utilizados")
    void debeObtenerTiposMasUtilizados() {
        // Given
        when(tipoElementoRepository.findTiposMasUtilizados()).thenReturn(Arrays.asList(tipoElementoTest));

        // When
        List<TipoElementoResponseDto> resultado = tipoElementoService.getTiposMasUtilizados();

        // Then
        assertNotNull(resultado);
        assertEquals(1, resultado.size());
        verify(tipoElementoRepository).findTiposMasUtilizados();
    }

    @Test
    @DisplayName("Debe obtener total de tipos de elemento")
    void debeObtenerTotalTiposElemento() {
        // Given
        when(tipoElementoRepository.countByActivoTrue()).thenReturn(10L);

        // When
        Long total = tipoElementoService.getTotalTiposElemento();

        // Then
        assertEquals(10L, total);
        verify(tipoElementoRepository).countByActivoTrue();
    }
}
