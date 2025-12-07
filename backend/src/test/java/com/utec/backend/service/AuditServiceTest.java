package com.utec.backend.service;

import com.utec.backend.dto.audit.AuditLogResponseDto;
import com.utec.backend.dto.common.PagedResponseDto;
import com.utec.backend.model.AuditLog;
import com.utec.backend.model.Usuario;
import com.utec.backend.repository.AuditLogRepository;
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
import org.springframework.data.jpa.domain.Specification;

import java.time.Instant;
import java.util.Arrays;
import java.util.Collections;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("Tests para AuditService")
class AuditServiceTest {

    @Mock
    private AuditLogRepository auditLogRepository;

    @InjectMocks
    private AuditService auditService;

    private AuditLog auditLogTest;
    private Usuario usuarioTest;
    private final Long auditLogId = 1L;
    private final Long usuarioId = 1L;

    @BeforeEach
    void setUp() {
        usuarioTest = new Usuario();
        usuarioTest.setId(usuarioId);
        usuarioTest.setEmail("test@utec.edu.uy");
        usuarioTest.setNombre("Test User");

        auditLogTest = new AuditLog();
        auditLogTest.setId(auditLogId);
        auditLogTest.setEntidad("Espacio");
        auditLogTest.setEntidadId(1);
        auditLogTest.setAccion(AuditLog.AccionAudit.CREATE);
        auditLogTest.setUsuario(usuarioTest);
        auditLogTest.setTimestamp(Instant.now());
        auditLogTest.setDatosNuevos("{\"nombre\":\"Aula 101\"}");
    }

    @Test
    @DisplayName("Debe registrar creación de entidad")
    void debeRegistrarCreacion() {
        // Given
        when(auditLogRepository.save(any(AuditLog.class))).thenReturn(auditLogTest);

        // When
        auditService.logCreate("Espacio", 1L, usuarioTest, auditLogTest);

        // Then
        verify(auditLogRepository).save(any(AuditLog.class));
    }

    @Test
    @DisplayName("Debe registrar actualización de entidad")
    void debeRegistrarActualizacion() {
        // Given
        when(auditLogRepository.save(any(AuditLog.class))).thenReturn(auditLogTest);

        // When
        auditService.logUpdate("Espacio", 1L, usuarioTest, "{}", "{\"nombre\":\"Aula 102\"}");

        // Then
        verify(auditLogRepository).save(any(AuditLog.class));
    }

    @Test
    @DisplayName("Debe registrar eliminación de entidad")
    void debeRegistrarEliminacion() {
        // Given
        when(auditLogRepository.save(any(AuditLog.class))).thenReturn(auditLogTest);

        // When
        auditService.logDelete("Espacio", 1L, usuarioTest, "{\"nombre\":\"Aula 101\"}");

        // Then
        verify(auditLogRepository).save(any(AuditLog.class));
    }

    @Test
    @DisplayName("Debe buscar logs con filtros y paginación")
    void debeBuscarLogs() {
        // Given
        Pageable pageable = PageRequest.of(0, 10);
        Page<AuditLog> page = new PageImpl<>(Arrays.asList(auditLogTest), pageable, 1);
        
        when(auditLogRepository.findAll(any(Specification.class), eq(pageable))).thenReturn(page);

        // When
        PagedResponseDto<AuditLogResponseDto> resultado = auditService.buscarLogs(
                "Espacio", null, null, null, null, null, pageable);

        // Then
        assertNotNull(resultado);
        assertEquals(1, resultado.getContent().size());
        verify(auditLogRepository).findAll(any(Specification.class), eq(pageable));
    }

    @Test
    @DisplayName("Debe buscar logs con todos los filtros")
    void debeBuscarLogsConTodosLosFiltros() {
        // Given
        Pageable pageable = PageRequest.of(0, 10);
        Page<AuditLog> page = new PageImpl<>(Arrays.asList(auditLogTest), pageable, 1);
        
        when(auditLogRepository.findAll(any(Specification.class), eq(pageable))).thenReturn(page);

        Instant fechaDesde = Instant.now().minusSeconds(86400);
        Instant fechaHasta = Instant.now();

        // When
        PagedResponseDto<AuditLogResponseDto> resultado = auditService.buscarLogs(
                "Espacio", usuarioId, AuditLog.AccionAudit.CREATE, fechaDesde, fechaHasta, "test", pageable);

        // Then
        assertNotNull(resultado);
        verify(auditLogRepository).findAll(any(Specification.class), eq(pageable));
    }

    @Test
    @DisplayName("Debe obtener log por ID")
    void debeObtenerLogPorId() {
        // Given
        when(auditLogRepository.findById(auditLogId)).thenReturn(Optional.of(auditLogTest));

        // When
        AuditLogResponseDto resultado = auditService.obtenerLogPorId(auditLogId);

        // Then
        assertNotNull(resultado);
        assertEquals(auditLogId, resultado.getId());
        verify(auditLogRepository).findById(auditLogId);
    }

    @Test
    @DisplayName("Debe lanzar excepción cuando el log no existe")
    void debeLanzarExcepcionCuandoLogNoExiste() {
        // Given
        Long idInexistente = 999L;
        when(auditLogRepository.findById(idInexistente)).thenReturn(Optional.empty());

        // When & Then
        RuntimeException exception = assertThrows(RuntimeException.class, () -> {
            auditService.obtenerLogPorId(idInexistente);
        });

        assertTrue(exception.getMessage().contains("no encontrado"));
        verify(auditLogRepository).findById(idInexistente);
    }

    @Test
    @DisplayName("Debe manejar excepciones al registrar sin lanzarlas")
    void debeManejarExcepcionesAlRegistrar() {
        // Given
        when(auditLogRepository.save(any(AuditLog.class))).thenThrow(new RuntimeException("Error de BD"));

        // When & Then - No debe lanzar excepción
        assertDoesNotThrow(() -> {
            auditService.logCreate("Espacio", 1L, usuarioTest, auditLogTest);
        });

        verify(auditLogRepository).save(any(AuditLog.class));
    }

    @Test
    @DisplayName("Debe registrar con usuario null")
    void debeRegistrarConUsuarioNull() {
        // Given
        when(auditLogRepository.save(any(AuditLog.class))).thenReturn(auditLogTest);

        // When
        auditService.logCreate("Espacio", 1L, null, auditLogTest);

        // Then
        verify(auditLogRepository).save(any(AuditLog.class));
    }
}

