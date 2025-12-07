package com.utec.backend.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.utec.backend.dto.common.PagedResponseDto;
import com.utec.backend.dto.reserva_item_solicitado.ReservaItemSolicitadoResponseDto;
import com.utec.backend.dto.reserva_item_solicitado.ReservaItemSolicitadoUpdateDto;
import com.utec.backend.model.ReservaItemSolicitado;
import com.utec.backend.service.ReservaItemSolicitadoService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.security.test.context.support.WithMockUser;

import java.time.Instant;
import java.util.Arrays;
import java.util.List;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@DisplayName("Tests de integración para ReservaItemSolicitadoController")
class ReservaItemSolicitadoControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private ReservaItemSolicitadoService reservaItemSolicitadoService;

    private ReservaItemSolicitadoResponseDto itemResponseDto;
    private final Long itemId = 1L;

    @BeforeEach
    void setUp() {
        itemResponseDto = new ReservaItemSolicitadoResponseDto();
        itemResponseDto.setId(itemId);
        itemResponseDto.setReservaId(1L);
        itemResponseDto.setTipoElementoId(1L);
        itemResponseDto.setTipoElementoNombre("Proyector");
        itemResponseDto.setCantidadSolicitada(1);
        itemResponseDto.setEstado(ReservaItemSolicitado.EstadoSolicitud.PENDIENTE);
        itemResponseDto.setCreatedAt(Instant.now());
        itemResponseDto.setUpdatedAt(Instant.now());
    }

    @Test
    @DisplayName("GET /api/v1/reservas/items-solicitados - Debe listar solicitudes")
    @WithMockUser(roles = {"ADMIN"})
    void debeListarSolicitudes() throws Exception {
        // Given
        Page<ReservaItemSolicitadoResponseDto> page = new PageImpl<>(Arrays.asList(itemResponseDto), PageRequest.of(0, 10), 1);
        PagedResponseDto<ReservaItemSolicitadoResponseDto> pagedResponse = PagedResponseDto.of(page);
        
        when(reservaItemSolicitadoService.buscarSolicitudes(any(), any(), any(), any(), any(), any()))
                .thenReturn(pagedResponse);

        // When & Then
        mockMvc.perform(get("/api/v1/reservas/items-solicitados")
                        .param("page", "0")
                        .param("size", "10")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        verify(reservaItemSolicitadoService).buscarSolicitudes(any(), any(), any(), any(), any(), any());
    }

    @Test
    @DisplayName("GET /api/v1/reservas/items-solicitados - Debe listar con filtros")
    @WithMockUser(roles = {"MANTENIMIENTO"})
    void debeListarConFiltros() throws Exception {
        // Given
        Page<ReservaItemSolicitadoResponseDto> page = new PageImpl<>(Arrays.asList(itemResponseDto), PageRequest.of(0, 10), 1);
        PagedResponseDto<ReservaItemSolicitadoResponseDto> pagedResponse = PagedResponseDto.of(page);
        
        when(reservaItemSolicitadoService.buscarSolicitudes(any(), any(), any(), any(), any(), any()))
                .thenReturn(pagedResponse);

        // When & Then
        mockMvc.perform(get("/api/v1/reservas/items-solicitados")
                        .param("estado", "PENDIENTE")
                        .param("espacioId", "1")
                        .param("fechaDesde", Instant.now().minusSeconds(86400).toString())
                        .param("fechaHasta", Instant.now().toString())
                        .param("search", "proyector")
                        .param("page", "0")
                        .param("size", "10")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        verify(reservaItemSolicitadoService).buscarSolicitudes(any(), any(), any(), any(), any(), any());
    }

    @Test
    @DisplayName("PATCH /api/v1/reservas/items-solicitados/{id} - Debe actualizar solicitud")
    @WithMockUser(username = "admin@utec.edu.uy", roles = {"ADMIN"})
    void debeActualizarSolicitud() throws Exception {
        // Given
        ReservaItemSolicitadoUpdateDto updateDto = new ReservaItemSolicitadoUpdateDto();
        updateDto.setEstado(ReservaItemSolicitado.EstadoSolicitud.APROBADO);

        when(reservaItemSolicitadoService.actualizarSolicitud(eq(itemId), any(ReservaItemSolicitadoUpdateDto.class), eq("admin@utec.edu.uy")))
                .thenReturn(itemResponseDto);

        // When & Then
        mockMvc.perform(patch("/api/v1/reservas/items-solicitados/{id}", itemId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateDto)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        verify(reservaItemSolicitadoService).actualizarSolicitud(eq(itemId), any(ReservaItemSolicitadoUpdateDto.class), eq("admin@utec.edu.uy"));
    }
}

