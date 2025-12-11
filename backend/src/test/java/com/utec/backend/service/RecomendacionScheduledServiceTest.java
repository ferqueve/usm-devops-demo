package com.utec.backend.service;

import com.utec.backend.repository.ReservaRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Collections;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("Tests para RecomendacionScheduledService")
class RecomendacionScheduledServiceTest {

    @Mock
    private RecomendacionService recomendacionService;

    @Mock
    private ReservaRepository reservaRepository;

    @InjectMocks
    private RecomendacionScheduledService scheduledService;

    @Test
    @DisplayName("Debe ejecutar actualización batch de recomendaciones")
    void debeEjecutarActualizacionBatch() {
        // Given
        when(reservaRepository.findAll()).thenReturn(Collections.emptyList());

        // When
        assertDoesNotThrow(() -> scheduledService.actualizarRecomendacionesBatch());

        // Then
        verify(reservaRepository).findAll();
    }

    @Test
    @DisplayName("Debe ejecutar precalcular métricas base")
    void debeEjecutarPrecalcularMetricasBase() {
        // When
        assertDoesNotThrow(() -> scheduledService.precalcularMetricasBase());

        // Then - Verificamos que el método existe y se puede ejecutar
        assertNotNull(scheduledService);
    }
}

