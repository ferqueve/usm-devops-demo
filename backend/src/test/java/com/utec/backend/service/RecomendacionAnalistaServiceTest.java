package com.utec.backend.service;

import com.utec.backend.dto.recomendacion.RecomendacionAnalistaDto;
import com.utec.backend.model.Usuario;
import com.utec.backend.repository.ReservaRepository;
import com.utec.backend.repository.UsuarioRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("Tests para RecomendacionAnalistaService")
class RecomendacionAnalistaServiceTest {

    @Mock
    private UsuarioRepository usuarioRepository;

    @Mock
    private ReservaRepository reservaRepository;

    @InjectMocks
    private RecomendacionAnalistaService recomendacionAnalistaService;

    private final Long docenteId = 1L;
    private final Long analistaId = 2L;

    @Test
    @DisplayName("Debe obtener analista recomendado")
    void debeObtenerAnalistaRecomendado() {
        // Given
        when(usuarioRepository.findByRolAppAndDeletedAtIsNull(Usuario.RolApp.ANALISTA))
                .thenReturn(Collections.emptyList());
        when(reservaRepository.findByUsuarioId(docenteId)).thenReturn(Collections.emptyList());

        // When
        List<RecomendacionAnalistaDto> resultado = recomendacionAnalistaService.obtenerAnalistaRecomendado(docenteId);

        // Then
        assertNotNull(resultado);
        verify(usuarioRepository).findByRolAppAndDeletedAtIsNull(Usuario.RolApp.ANALISTA);
        verify(reservaRepository).findByUsuarioId(docenteId);
    }

    @Test
    @DisplayName("Debe obtener reservas prioritarias")
    void debeObtenerReservasPrioritarias() {
        // Given
        when(reservaRepository.findAll()).thenReturn(Collections.emptyList());

        // When
        List<RecomendacionAnalistaDto> resultado = recomendacionAnalistaService.obtenerReservasPrioritarias(analistaId);

        // Then
        assertNotNull(resultado);
        verify(reservaRepository).findAll();
    }
}

