package com.utec.backend.service;

import com.utec.backend.dto.carrera.CarreraCreateDto;
import com.utec.backend.dto.carrera.CarreraResponseDto;
import com.utec.backend.dto.carrera.CarreraUpdateDto;
import com.utec.backend.model.Carrera;
import com.utec.backend.repository.CarreraRepository;
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
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("Tests para CarreraService")
class CarreraServiceTest {

    @Mock
    private CarreraRepository carreraRepository;

    @InjectMocks
    private CarreraService carreraService;

    private Carrera carreraTest;
    private final Long carreraId = 1L;
    private final String nombreCarrera = "Ingeniería";

    @BeforeEach
    void setUp() {
        carreraTest = new Carrera();
        carreraTest.setId(carreraId);
        carreraTest.setNombre(nombreCarrera);
        carreraTest.setCodigo("ING");
        carreraTest.setDeletedAt(null);
        carreraTest.setCreatedAt(Instant.now());
        carreraTest.setUpdatedAt(Instant.now());
    }

    @Test
    @DisplayName("Debe crear carrera exitosamente")
    void debeCrearCarreraExitosamente() {
        // Given
        CarreraCreateDto createDto = new CarreraCreateDto();
        createDto.setNombre("Nueva Carrera");
        createDto.setCodigo("NC");

        when(carreraRepository.existsByCodigo("NC")).thenReturn(false);
        when(carreraRepository.save(any(Carrera.class))).thenReturn(carreraTest);

        // When
        CarreraResponseDto resultado = carreraService.createCarrera(createDto);

        // Then
        assertNotNull(resultado);
        verify(carreraRepository).save(any(Carrera.class));
    }

    @Test
    @DisplayName("Debe lanzar excepción cuando el código ya existe")
    void debeLanzarExcepcionCuandoCodigoYaExiste() {
        // Given
        CarreraCreateDto createDto = new CarreraCreateDto();
        createDto.setNombre("Nueva Carrera");
        createDto.setCodigo("ING");

        when(carreraRepository.existsByCodigo("ING")).thenReturn(true);

        // When & Then
        RuntimeException exception = assertThrows(RuntimeException.class, () -> {
            carreraService.createCarrera(createDto);
        });

        assertTrue(exception.getMessage().contains("Ya existe una carrera con el código"));
        verify(carreraRepository, never()).save(any(Carrera.class));
    }

    @Test
    @DisplayName("Debe obtener todas las carreras")
    void debeObtenerTodasLasCarreras() {
        // Given
        Carrera carrera2 = new Carrera();
        carrera2.setId(2L);
        carrera2.setNombre("Arquitectura");
        carrera2.setCodigo("ARQ");
        carrera2.setDeletedAt(null);

        when(carreraRepository.findByActivoTrue()).thenReturn(Arrays.asList(carreraTest, carrera2));

        // When
        List<CarreraResponseDto> resultado = carreraService.getAllCarreras();

        // Then
        assertNotNull(resultado);
        assertEquals(2, resultado.size());
        verify(carreraRepository).findByActivoTrue();
    }

    @Test
    @DisplayName("Debe obtener carreras paginadas")
    void debeObtenerCarrerasPaginadas() {
        // Given
        Pageable pageable = PageRequest.of(0, 10);
        Page<Carrera> page = new PageImpl<>(Arrays.asList(carreraTest), pageable, 1);

        when(carreraRepository.findAll(pageable)).thenReturn(page);

        // When
        Page<CarreraResponseDto> resultado = carreraService.getAllCarrerasPaged(pageable);

        // Then
        assertNotNull(resultado);
        assertEquals(1, resultado.getTotalElements());
        verify(carreraRepository).findAll(pageable);
    }

    @Test
    @DisplayName("Debe obtener carrera por ID")
    void debeObtenerCarreraPorId() {
        // Given
        when(carreraRepository.findById(carreraId)).thenReturn(Optional.of(carreraTest));

        // When
        CarreraResponseDto resultado = carreraService.getCarreraById(carreraId);

        // Then
        assertNotNull(resultado);
        assertEquals(carreraId, resultado.getId());
        verify(carreraRepository).findById(carreraId);
    }

    @Test
    @DisplayName("Debe lanzar excepción cuando la carrera no existe")
    void debeLanzarExcepcionCuandoCarreraNoExiste() {
        // Given
        Long idInexistente = 999L;
        when(carreraRepository.findById(idInexistente)).thenReturn(Optional.empty());

        // When & Then
        RuntimeException exception = assertThrows(RuntimeException.class, () -> {
            carreraService.getCarreraById(idInexistente);
        });

        assertTrue(exception.getMessage().contains("Carrera no encontrada"));
        verify(carreraRepository).findById(idInexistente);
    }

    @Test
    @DisplayName("Debe actualizar carrera exitosamente")
    void debeActualizarCarreraExitosamente() {
        // Given
        CarreraUpdateDto updateDto = new CarreraUpdateDto();
        updateDto.setNombre("Ingeniería Actualizada");
        updateDto.setCodigo("ING-UPD");

        when(carreraRepository.findById(carreraId)).thenReturn(Optional.of(carreraTest));
        when(carreraRepository.existsByCodigoAndIdNot("ING-UPD", carreraId)).thenReturn(false);
        when(carreraRepository.save(any(Carrera.class))).thenReturn(carreraTest);

        // When
        CarreraResponseDto resultado = carreraService.updateCarrera(carreraId, updateDto);

        // Then
        assertNotNull(resultado);
        verify(carreraRepository).findById(carreraId);
        verify(carreraRepository).save(carreraTest);
    }

    @Test
    @DisplayName("Debe lanzar excepción al actualizar con código duplicado")
    void debeLanzarExcepcionAlActualizarConCodigoDuplicado() {
        // Given
        CarreraUpdateDto updateDto = new CarreraUpdateDto();
        updateDto.setNombre("Ingeniería Actualizada");
        updateDto.setCodigo("DUPLICADO");

        when(carreraRepository.findById(carreraId)).thenReturn(Optional.of(carreraTest));
        when(carreraRepository.existsByCodigoAndIdNot("DUPLICADO", carreraId)).thenReturn(true);

        // When & Then
        RuntimeException exception = assertThrows(RuntimeException.class, () -> {
            carreraService.updateCarrera(carreraId, updateDto);
        });

        assertTrue(exception.getMessage().contains("Ya existe otra carrera con el código"));
        verify(carreraRepository, never()).save(any(Carrera.class));
    }

    @Test
    @DisplayName("Debe eliminar carrera (soft delete)")
    void debeEliminarCarrera() {
        // Given
        when(carreraRepository.findById(carreraId)).thenReturn(Optional.of(carreraTest));
        when(carreraRepository.save(any(Carrera.class))).thenReturn(carreraTest);

        // When
        assertDoesNotThrow(() -> carreraService.deleteCarrera(carreraId));

        // Then
        verify(carreraRepository).findById(carreraId);
        verify(carreraRepository).save(carreraTest);
    }

    @Test
    @DisplayName("Debe buscar carreras por nombre")
    void debeBuscarCarrerasPorNombre() {
        // Given
        String nombre = "Ingeniería";
        when(carreraRepository.findByNombreContainingIgnoreCase(nombre))
                .thenReturn(Arrays.asList(carreraTest));

        // When
        List<CarreraResponseDto> resultado = carreraService.searchCarrerasByNombre(nombre);

        // Then
        assertNotNull(resultado);
        assertEquals(1, resultado.size());
        verify(carreraRepository).findByNombreContainingIgnoreCase(nombre);
    }

    @Test
    @DisplayName("Debe obtener total de carreras")
    void debeObtenerTotalCarreras() {
        // Given
        when(carreraRepository.countByActivoTrue()).thenReturn(5L);

        // When
        Long total = carreraService.getTotalCarreras();

        // Then
        assertEquals(5L, total);
        verify(carreraRepository).countByActivoTrue();
    }
}

