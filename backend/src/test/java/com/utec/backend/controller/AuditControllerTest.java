package com.utec.backend.controller;

import com.utec.backend.dto.audit.AuditLogResponseDto;
import com.utec.backend.dto.common.PagedResponseDto;
import com.utec.backend.model.AuditLog;
import com.utec.backend.service.AuditService;
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
@DisplayName("Tests de integración para AuditController")
class AuditControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private AuditService auditService;

    private AuditLogResponseDto auditLogResponseDto;
    private final Long auditLogId = 1L;

    @BeforeEach
    void setUp() {
        auditLogResponseDto = new AuditLogResponseDto();
        auditLogResponseDto.setId(auditLogId);
        auditLogResponseDto.setEntidad("Espacio");
        auditLogResponseDto.setEntidadId(1);
        auditLogResponseDto.setAccion(AuditLog.AccionAudit.CREATE);
        auditLogResponseDto.setUsuarioId(1L);
        auditLogResponseDto.setUsuarioNombre("Test User");
        auditLogResponseDto.setUsuarioEmail("test@utec.edu.uy");
        auditLogResponseDto.setTimestamp(Instant.now());
        auditLogResponseDto.setDatosNuevos("{\"nombre\":\"Aula 101\"}");
    }

    @Test
    @DisplayName("GET /api/v1/audit - Debe buscar logs con filtros")
    @WithMockUser(roles = {"ADMIN"})
    void debeBuscarLogs() throws Exception {
        // Given
        Page<AuditLogResponseDto> page = new PageImpl<>(Arrays.asList(auditLogResponseDto), PageRequest.of(0, 10), 1);
        PagedResponseDto<AuditLogResponseDto> pagedResponse = PagedResponseDto.of(page);
        
        when(auditService.buscarLogs(any(), any(), any(), any(), any(), any(), any()))
                .thenReturn(pagedResponse);

        // When & Then
        mockMvc.perform(get("/api/v1/audit")
                        .param("page", "0")
                        .param("size", "10")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        verify(auditService).buscarLogs(any(), any(), any(), any(), any(), any(), any());
    }

    @Test
    @DisplayName("GET /api/v1/audit - Debe buscar logs con todos los filtros")
    @WithMockUser(roles = {"ADMIN"})
    void debeBuscarLogsConTodosLosFiltros() throws Exception {
        // Given
        Page<AuditLogResponseDto> page = new PageImpl<>(Arrays.asList(auditLogResponseDto), PageRequest.of(0, 10), 1);
        PagedResponseDto<AuditLogResponseDto> pagedResponse = PagedResponseDto.of(page);
        
        when(auditService.buscarLogs(any(), any(), any(), any(), any(), any(), any()))
                .thenReturn(pagedResponse);

        // When & Then
        mockMvc.perform(get("/api/v1/audit")
                        .param("entidad", "Espacio")
                        .param("usuarioId", "1")
                        .param("accion", "CREATE")
                        .param("fechaDesde", Instant.now().minusSeconds(86400).toString())
                        .param("fechaHasta", Instant.now().toString())
                        .param("search", "test")
                        .param("page", "0")
                        .param("size", "10")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        verify(auditService).buscarLogs(any(), any(), any(), any(), any(), any(), any());
    }

    @Test
    @DisplayName("GET /api/v1/audit/{id} - Debe obtener log por ID")
    @WithMockUser(roles = {"ADMIN"})
    void debeObtenerLogPorId() throws Exception {
        // Given
        when(auditService.obtenerLogPorId(auditLogId)).thenReturn(auditLogResponseDto);

        // When & Then
        mockMvc.perform(get("/api/v1/audit/{id}", auditLogId)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.id").value(auditLogId));

        verify(auditService).obtenerLogPorId(auditLogId);
    }
}

