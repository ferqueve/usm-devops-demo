package com.utec.backend.service;

import com.utec.backend.dto.recomendacion.HorarioRecomendadoDto;
import com.utec.backend.dto.recomendacion.RecomendacionEspacioDto;
import com.utec.backend.model.Espacio;
import com.utec.backend.repository.EspacioRepository;
import com.utec.backend.repository.ReservaRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("Tests para RecomendacionReservaService")
class RecomendacionReservaServiceTest {

    @Mock
    private ReservaRepository reservaRepository;

    @Mock
    private EspacioRepository espacioRepository;

    @InjectMocks
    private RecomendacionReservaService recomendacionReservaService;

    private final Long usuarioId = 1L;
    private final Long espacioId = 1L;

    @BeforeEach
    void setUp() {
        // Setup básico
    }

    @Test
    @DisplayName("Debe obtener recomendaciones de espacios")
    void debeObtenerRecomendacionesEspacios() {
        // Given
        Instant inicio = Instant.now().plusSeconds(86400);
        Instant fin = inicio.plusSeconds(3600);
        
        when(reservaRepository.findByUsuarioId(usuarioId)).thenReturn(Collections.emptyList());
        when(espacioRepository.findEspaciosDisponibles(inicio, fin)).thenReturn(Collections.emptyList());

        // When
        List<RecomendacionEspacioDto> resultado = recomendacionReservaService.obtenerRecomendacionesEspacios(
                usuarioId, inicio, fin, null);

        // Then
        assertNotNull(resultado);
        verify(reservaRepository).findByUsuarioId(usuarioId);
        verify(espacioRepository).findEspaciosDisponibles(inicio, fin);
    }

    @Test
    @DisplayName("Debe obtener horarios óptimos")
    void debeObtenerHorariosOptimos() {
        // Given
        Instant fecha = Instant.now().plusSeconds(86400);
        
        when(reservaRepository.findByUsuarioId(usuarioId)).thenReturn(Collections.emptyList());
        lenient().when(espacioRepository.findEspaciosDisponibles(any(Instant.class), any(Instant.class)))
                .thenReturn(Collections.emptyList());

        // When
        List<HorarioRecomendadoDto> resultado = recomendacionReservaService.obtenerHorariosOptimos(
                usuarioId, espacioId, fecha);

        // Then
        assertNotNull(resultado);
        verify(reservaRepository).findByUsuarioId(usuarioId);
    }

    @Test
    @DisplayName("Debe obtener espacios similares")
    void debeObtenerEspaciosSimilares() {
        // Given
        Espacio espacioTest = new Espacio();
        espacioTest.setId(espacioId);
        espacioTest.setNombre("Aula 101");
        espacioTest.setCapacidad(30);
        
        when(espacioRepository.findById(espacioId)).thenReturn(java.util.Optional.of(espacioTest));
        when(espacioRepository.findAll()).thenReturn(Collections.emptyList());
        lenient().when(reservaRepository.findByUsuarioId(usuarioId)).thenReturn(Collections.emptyList());

        // When
        List<RecomendacionEspacioDto> resultado = recomendacionReservaService.obtenerEspaciosSimilares(
                espacioId, usuarioId);

        // Then
        assertNotNull(resultado);
        verify(espacioRepository).findById(espacioId);
        verify(espacioRepository).findAll();
    }
}

