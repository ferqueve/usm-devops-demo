package com.utec.backend.service;

import com.utec.backend.dto.recomendacion.RecomendacionItemDto;
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
@DisplayName("Tests para RecomendacionItemService")
class RecomendacionItemServiceTest {

    @Mock
    private ReservaItemSolicitadoRepository reservaItemSolicitadoRepository;

    @Mock
    private InventarioItemRepository inventarioItemRepository;

    @InjectMocks
    private RecomendacionItemService recomendacionItemService;

    private final Long espacioId = 1L;
    private final Long usuarioId = 1L;

    @Test
    @DisplayName("Debe obtener items recomendados para reserva")
    void debeObtenerItemsRecomendadosParaReserva() {
        // Given
        when(reservaItemSolicitadoRepository.findAll()).thenReturn(Collections.emptyList());
        when(inventarioItemRepository.findByEspacioIdAndActivoTrue(espacioId))
                .thenReturn(Collections.emptyList());

        // When
        List<RecomendacionItemDto> resultado = recomendacionItemService.obtenerItemsRecomendadosParaReserva(
                espacioId, usuarioId);

        // Then
        assertNotNull(resultado);
        verify(reservaItemSolicitadoRepository).findAll();
        verify(inventarioItemRepository).findByEspacioIdAndActivoTrue(espacioId);
    }

    @Test
    @DisplayName("Debe obtener combinaciones de items")
    void debeObtenerCombinacionesItems() {
        // Given
        when(reservaItemSolicitadoRepository.findAll()).thenReturn(Collections.emptyList());
        lenient().when(inventarioItemRepository.findByEspacioIdAndActivoTrue(espacioId))
                .thenReturn(Collections.emptyList());

        // When
        List<RecomendacionItemDto> resultado = recomendacionItemService.obtenerCombinacionesItems(espacioId);

        // Then
        assertNotNull(resultado);
        verify(reservaItemSolicitadoRepository).findAll();
    }
}

