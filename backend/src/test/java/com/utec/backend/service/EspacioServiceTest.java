package com.utec.backend.service;

import com.utec.backend.dto.espacio.EspacioCreateDto;
import com.utec.backend.dto.espacio.EspacioResponseDto;
import com.utec.backend.dto.espacio.EspacioUpdateDto;
import com.utec.backend.model.Espacio;
import com.utec.backend.repository.EspacioRepository;
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
import org.springframework.data.domain.Pageable;

import java.time.Instant;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("Tests para EspacioService")
class EspacioServiceTest {

    @Mock
    private EspacioRepository espacioRepository;

    @Mock
    private FileStorageService fileStorageService;

    @InjectMocks
    private EspacioService espacioService;

    private Espacio espacioTest;
    private final Long espacioId = 1L;
    private final String nombreEspacio = "Aula 101";

    @BeforeEach
    void setUp() {
        espacioTest = new Espacio();
        espacioTest.setId(espacioId);
        espacioTest.setNombre(nombreEspacio);
        espacioTest.setCapacidad(30);
        espacioTest.setImagenUrl("imagen.jpg");
        espacioTest.setTipoEspacioId(1L);
        espacioTest.setEstado("DISPONIBLE");
        espacioTest.setCreatedAt(Instant.now());
        espacioTest.setUpdatedAt(Instant.now());
        espacioTest.setInventarioItems(Collections.emptyList());

        // Mock FileStorageService - lenient para evitar UnnecessaryStubbingException
        lenient().when(fileStorageService.getImageUrl(anyString())).thenAnswer(invocation -> invocation.getArgument(0));
    }

    @Test
    @DisplayName("Debe crear un espacio exitosamente")
    void debeCrearEspacioExitosamente() {
        // Given
        EspacioCreateDto createDto = new EspacioCreateDto();
        createDto.setNombre("Aula Nueva");
        createDto.setCapacidad(50);
        createDto.setImagenUrl("nueva.jpg");
        createDto.setTipoEspacioId(1L);
        createDto.setEstado("DISPONIBLE");

        Espacio nuevoEspacio = new Espacio();
        nuevoEspacio.setId(2L);
        nuevoEspacio.setNombre("Aula Nueva");
        nuevoEspacio.setCapacidad(50);

        when(espacioRepository.save(any(Espacio.class))).thenReturn(nuevoEspacio);

        // When
        EspacioResponseDto resultado = espacioService.createEspacio(createDto);

        // Then
        assertNotNull(resultado);
        assertEquals("Aula Nueva", resultado.getNombre());
        verify(espacioRepository).save(any(Espacio.class));
    }

    @Test
    @DisplayName("Debe obtener todos los espacios")
    void debeObtenerTodosLosEspacios() {
        // Given
        Espacio espacio2 = new Espacio();
        espacio2.setId(2L);
        espacio2.setNombre("Aula 102");
        espacio2.setCapacidad(40);

        when(espacioRepository.findAll()).thenReturn(Arrays.asList(espacioTest, espacio2));

        // When
        List<EspacioResponseDto> resultado = espacioService.getAllEspacios();

        // Then
        assertNotNull(resultado);
        assertEquals(2, resultado.size());
        verify(espacioRepository).findAll();
    }

    @Test
    @DisplayName("Debe obtener espacios paginados")
    void debeObtenerEspaciosPaginados() {
        // Given
        Pageable pageable = PageRequest.of(0, 10);
        Page<Espacio> page = new PageImpl<>(Arrays.asList(espacioTest), pageable, 1);

        when(espacioRepository.findAll(pageable)).thenReturn(page);

        // When
        Page<EspacioResponseDto> resultado = espacioService.getAllEspaciosPaged(pageable);

        // Then
        assertNotNull(resultado);
        assertEquals(1, resultado.getTotalElements());
        verify(espacioRepository).findAll(pageable);
    }

    @Test
    @DisplayName("Debe obtener espacio por ID exitosamente")
    void debeObtenerEspacioPorId() {
        // Given
        when(espacioRepository.findById(espacioId)).thenReturn(Optional.of(espacioTest));

        // When
        EspacioResponseDto resultado = espacioService.getEspacioById(espacioId);

        // Then
        assertNotNull(resultado);
        assertEquals(espacioId, resultado.getId());
        assertEquals(nombreEspacio, resultado.getNombre());
        verify(espacioRepository).findById(espacioId);
    }

    @Test
    @DisplayName("Debe lanzar excepción cuando el espacio no existe por ID")
    void debeLanzarExcepcionEspacioNoExiste() {
        // Given
        Long idInexistente = 999L;
        when(espacioRepository.findById(idInexistente)).thenReturn(Optional.empty());

        // When & Then
        RuntimeException exception = assertThrows(RuntimeException.class, () -> {
            espacioService.getEspacioById(idInexistente);
        });

        assertTrue(exception.getMessage().contains("Espacio no encontrado"));
        verify(espacioRepository).findById(idInexistente);
    }

    @Test
    @DisplayName("Debe actualizar espacio exitosamente")
    void debeActualizarEspacioExitosamente() {
        // Given
        EspacioUpdateDto updateDto = new EspacioUpdateDto();
        updateDto.setNombre("Aula 101 Actualizada");
        updateDto.setCapacidad(35);

        when(espacioRepository.findById(espacioId)).thenReturn(Optional.of(espacioTest));
        when(espacioRepository.save(any(Espacio.class))).thenReturn(espacioTest);

        // When
        EspacioResponseDto resultado = espacioService.updateEspacio(espacioId, updateDto);

        // Then
        assertNotNull(resultado);
        verify(espacioRepository).findById(espacioId);
        verify(espacioRepository).save(espacioTest);
    }

    @Test
    @DisplayName("Debe lanzar excepción al actualizar espacio inexistente")
    void debeLanzarExcepcionActualizarEspacioInexistente() {
        // Given
        Long idInexistente = 999L;
        EspacioUpdateDto updateDto = new EspacioUpdateDto();

        when(espacioRepository.findById(idInexistente)).thenReturn(Optional.empty());

        // When & Then
        assertThrows(RuntimeException.class, () -> {
            espacioService.updateEspacio(idInexistente, updateDto);
        });

        verify(espacioRepository).findById(idInexistente);
        verify(espacioRepository, never()).save(any(Espacio.class));
    }

    @Test
    @DisplayName("Debe eliminar espacio exitosamente")
    void debeEliminarEspacioExitosamente() throws Exception {
        // Given
        when(espacioRepository.findById(espacioId)).thenReturn(Optional.of(espacioTest));

        // When
        assertDoesNotThrow(() -> espacioService.deleteEspacio(espacioId));

        // Then
        // Then
        verify(espacioRepository).findById(espacioId);
        verify(espacioRepository).save(espacioTest);
        assertNotNull(espacioTest.getDeletedAt());
    }

    @Test
    @DisplayName("Debe lanzar excepción al eliminar espacio inexistente")
    void debeLanzarExcepcionEliminarEspacioInexistente() {
        // Given
        Long idInexistente = 999L;
        when(espacioRepository.findById(idInexistente)).thenReturn(Optional.empty());

        // When & Then
        assertThrows(RuntimeException.class, () -> {
            espacioService.deleteEspacio(idInexistente);
        });

        verify(espacioRepository).findById(idInexistente);
        verify(espacioRepository, never()).deleteById(anyLong());
    }

    @Test
    @DisplayName("Debe buscar espacios por nombre")
    void debeBuscarEspaciosPorNombre() {
        // Given
        String nombre = "Aula";
        when(espacioRepository.findByNombreContainingIgnoreCase(nombre))
                .thenReturn(Arrays.asList(espacioTest));

        // When
        List<EspacioResponseDto> resultado = espacioService.searchEspaciosByNombre(nombre);

        // Then
        assertNotNull(resultado);
        assertEquals(1, resultado.size());
        verify(espacioRepository).findByNombreContainingIgnoreCase(nombre);
    }

    @Test
    @DisplayName("Debe obtener espacios por capacidad mínima")
    void debeObtenerEspaciosPorCapacidadMinima() {
        // Given
        Integer capacidadMinima = 25;
        when(espacioRepository.findByCapacidadGreaterThanEqual(capacidadMinima))
                .thenReturn(Arrays.asList(espacioTest));

        // When
        List<EspacioResponseDto> resultado = espacioService.getEspaciosByCapacidadMinima(capacidadMinima);

        // Then
        assertNotNull(resultado);
        assertEquals(1, resultado.size());
        verify(espacioRepository).findByCapacidadGreaterThanEqual(capacidadMinima);
    }

    @Test
    @DisplayName("Debe obtener espacios por capacidad máxima")
    void debeObtenerEspaciosPorCapacidadMaxima() {
        // Given
        Integer capacidadMaxima = 50;
        when(espacioRepository.findByCapacidadLessThanEqual(capacidadMaxima))
                .thenReturn(Arrays.asList(espacioTest));

        // When
        List<EspacioResponseDto> resultado = espacioService.getEspaciosByCapacidadMaxima(capacidadMaxima);

        // Then
        assertNotNull(resultado);
        assertEquals(1, resultado.size());
        verify(espacioRepository).findByCapacidadLessThanEqual(capacidadMaxima);
    }

    @Test
    @DisplayName("Debe obtener espacios por rango de capacidad")
    void debeObtenerEspaciosPorRangoCapacidad() {
        // Given
        Integer capacidadMin = 25;
        Integer capacidadMax = 50;
        when(espacioRepository.findByCapacidadBetween(capacidadMin, capacidadMax))
                .thenReturn(Arrays.asList(espacioTest));

        // When
        List<EspacioResponseDto> resultado = espacioService.getEspaciosByCapacidadRango(capacidadMin, capacidadMax);

        // Then
        assertNotNull(resultado);
        assertEquals(1, resultado.size());
        verify(espacioRepository).findByCapacidadBetween(capacidadMin, capacidadMax);
    }

    @Test
    @DisplayName("Debe obtener espacios por tipo")
    void debeObtenerEspaciosPorTipo() {
        // Given
        Long tipoEspacioId = 1L;
        when(espacioRepository.findByTipoEspacioId(tipoEspacioId))
                .thenReturn(Arrays.asList(espacioTest));

        // When
        List<EspacioResponseDto> resultado = espacioService.getEspaciosByTipoEspacio(tipoEspacioId);

        // Then
        assertNotNull(resultado);
        assertEquals(1, resultado.size());
        verify(espacioRepository).findByTipoEspacioId(tipoEspacioId);
    }

    @Test
    @DisplayName("Debe filtrar espacios correctamente")
    void debeFiltrarEspaciosCorrectamente() {
        // Given
        String search = "Aula";
        Long tipoEspacioId = 1L;

        when(espacioRepository.findAll()).thenReturn(Arrays.asList(espacioTest));

        // When
        List<EspacioResponseDto> resultado = espacioService.filterEspacios(
                search, tipoEspacioId, null, null, null, null, null, null, null);

        // Then
        assertNotNull(resultado);
        assertEquals(1, resultado.size());
        verify(espacioRepository).findAll();
    }

    @Test
    @DisplayName("Debe obtener total de espacios")
    void debeObtenerTotalEspacios() {
        // Given
        when(espacioRepository.countTotalEspacios()).thenReturn(10L);

        // When
        Long total = espacioService.getTotalEspacios();

        // Then
        assertEquals(10L, total);
        verify(espacioRepository).countTotalEspacios();
    }

    @Test
    @DisplayName("Debe obtener capacidad promedio de espacios")
    void debeObtenerCapacidadPromedio() {
        // Given
        when(espacioRepository.getCapacidadPromedio()).thenReturn(35.5);

        // When
        Double promedio = espacioService.getCapacidadPromedio();

        // Then
        assertEquals(35.5, promedio);
        verify(espacioRepository).getCapacidadPromedio();
    }

    @Test
    @DisplayName("Debe obtener capacidad máxima")
    void debeObtenerCapacidadMaxima() {
        // Given
        when(espacioRepository.getCapacidadMaxima()).thenReturn(100);

        // When
        Integer maxima = espacioService.getCapacidadMaxima();

        // Then
        assertEquals(100, maxima);
        verify(espacioRepository).getCapacidadMaxima();
    }

    @Test
    @DisplayName("Debe obtener capacidad mínima")
    void debeObtenerCapacidadMinima() {
        // Given
        when(espacioRepository.getCapacidadMinima()).thenReturn(10);

        // When
        Integer minima = espacioService.getCapacidadMinima();

        // Then
        assertEquals(10, minima);
        verify(espacioRepository).getCapacidadMinima();
    }
}
