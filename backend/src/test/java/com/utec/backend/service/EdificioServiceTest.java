package com.utec.backend.service;

import com.utec.backend.dto.edificio.EdificioResponseDto;
import com.utec.backend.model.Edificio;
import com.utec.backend.repository.EdificioRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("Tests para EdificioService")
class EdificioServiceTest {

    @Mock
    private EdificioRepository edificioRepository;

    @InjectMocks
    private EdificioService edificioService;

    private Edificio edificioTest;
    private final Long edificioId = 1L;
    private final String nombreEdificio = "Edificio Central";

    @BeforeEach
    void setUp() {
        edificioTest = new Edificio();
        edificioTest.setId(edificioId);
        edificioTest.setNombre(nombreEdificio);
        edificioTest.setCodigo("EC");
        edificioTest.setDescripcion("Edificio principal del campus");
        edificioTest.setActivo(true);
        edificioTest.setCreatedAt(Instant.now());
        edificioTest.setUpdatedAt(Instant.now());
        edificioTest.setDeletedAt(null);
    }

    @Test
    @DisplayName("Debe obtener todos los edificios")
    void debeObtenerTodosLosEdificios() {
        // Given
        Edificio edificio2 = new Edificio();
        edificio2.setId(2L);
        edificio2.setNombre("Edificio Norte");
        edificio2.setCodigo("EN");
        edificio2.setActivo(true);

        when(edificioRepository.findByActivoTrue()).thenReturn(Arrays.asList(edificioTest, edificio2));

        // When
        List<EdificioResponseDto> resultado = edificioService.getAllEdificios();

        // Then
        assertNotNull(resultado);
        assertEquals(2, resultado.size());
        verify(edificioRepository).findByActivoTrue();
    }

    @Test
    @DisplayName("Debe obtener edificio por ID")
    void debeObtenerEdificioPorId() {
        // Given
        when(edificioRepository.findById(edificioId)).thenReturn(Optional.of(edificioTest));

        // When
        EdificioResponseDto resultado = edificioService.getEdificioById(edificioId);

        // Then
        assertNotNull(resultado);
        assertEquals(edificioId, resultado.getId());
        assertEquals(nombreEdificio, resultado.getNombre());
        verify(edificioRepository).findById(edificioId);
    }

    @Test
    @DisplayName("Debe lanzar excepción cuando el edificio no existe")
    void debeLanzarExcepcionCuandoEdificioNoExiste() {
        // Given
        Long idInexistente = 999L;
        when(edificioRepository.findById(idInexistente)).thenReturn(Optional.empty());

        // When & Then
        RuntimeException exception = assertThrows(RuntimeException.class, () -> {
            edificioService.getEdificioById(idInexistente);
        });

        assertTrue(exception.getMessage().contains("Edificio no encontrado"));
        verify(edificioRepository).findById(idInexistente);
    }
}

