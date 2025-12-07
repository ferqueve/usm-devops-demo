package com.utec.backend.service;

import com.utec.backend.dto.recomendacion.RecomendacionInventarioDto;
import com.utec.backend.model.InventarioItem;
import com.utec.backend.repository.InventarioItemRepository;
import com.utec.backend.repository.ReservaItemSolicitadoRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("Tests para RecomendacionInventarioService")
class RecomendacionInventarioServiceTest {

    @Mock
    private InventarioItemRepository inventarioItemRepository;

    @Mock
    private ReservaItemSolicitadoRepository reservaItemSolicitadoRepository;

    @InjectMocks
    private RecomendacionInventarioService recomendacionInventarioService;

    @Test
    @DisplayName("Debe obtener items de mantenimiento urgente")
    void debeObtenerItemsMantenimientoUrgente() {
        // Given
        when(inventarioItemRepository.findByEstadoAndActivoTrue("MANTENIMIENTO"))
                .thenReturn(Collections.emptyList());

        // When
        List<RecomendacionInventarioDto> resultado = recomendacionInventarioService.obtenerItemsMantenimientoUrgente();

        // Then
        assertNotNull(resultado);
        verify(inventarioItemRepository).findByEstadoAndActivoTrue("MANTENIMIENTO");
    }

    @Test
    @DisplayName("Debe obtener espacios que requieren atención")
    void debeObtenerEspaciosAtencion() {
        // Given
        when(inventarioItemRepository.findAll()).thenReturn(Collections.emptyList());

        // When
        List<RecomendacionInventarioDto> resultado = recomendacionInventarioService.obtenerEspaciosAtencion();

        // Then
        assertNotNull(resultado);
        verify(inventarioItemRepository).findAll();
    }

    @Test
    @DisplayName("Debe obtener reasignaciones recomendadas")
    void debeObtenerReasignacionesRecomendadas() {
        // Given
        when(inventarioItemRepository.findAll()).thenReturn(Collections.emptyList());

        // When
        List<RecomendacionInventarioDto> resultado = recomendacionInventarioService.obtenerReasignacionesRecomendadas();

        // Then
        assertNotNull(resultado);
        verify(inventarioItemRepository).findAll();
    }

    @Test
    @DisplayName("Debe obtener compras necesarias")
    void debeObtenerComprasNecesarias() {
        // Given
        when(reservaItemSolicitadoRepository.findAll()).thenReturn(Collections.emptyList());
        when(inventarioItemRepository.findAll()).thenReturn(Collections.emptyList());

        // When
        List<RecomendacionInventarioDto> resultado = recomendacionInventarioService.obtenerComprasNecesarias();

        // Then
        assertNotNull(resultado);
        verify(reservaItemSolicitadoRepository).findAll();
    }
}

