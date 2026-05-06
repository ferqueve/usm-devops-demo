package com.utec.backend.controller;

import com.utec.backend.common.ApiResponse;
import com.utec.backend.dto.audit.AuditLogResponseDto;
import com.utec.backend.dto.common.PagedResponseDto;
import com.utec.backend.model.AuditLog;
import com.utec.backend.service.AuditService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;

@RestController
@RequestMapping("/api/v1/audit")
@RequiredArgsConstructor
public class AuditController {

    private final AuditService auditService;

    @GetMapping
    @PreAuthorize("hasPermission(null, 'auditoria:ver')")
    public ResponseEntity<ApiResponse<PagedResponseDto<AuditLogResponseDto>>> listarLogs(
            @RequestParam(required = false) String entidad,
            @RequestParam(required = false) Long usuarioId,
            @RequestParam(required = false) String accion,
            @RequestParam(required = false) Instant fechaDesde,
            @RequestParam(required = false) Instant fechaHasta,
            @RequestParam(required = false) String search,
            @PageableDefault(size = 20, sort = "timestamp", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        try {
            AuditLog.AccionAudit accionEnum = parseAccion(accion);

            PagedResponseDto<AuditLogResponseDto> resultado = auditService.buscarLogs(
                    entidad, usuarioId, accionEnum, fechaDesde, fechaHasta, search, pageable
            );

            return ResponseEntity.ok(ApiResponse.success(resultado, "Logs de auditoría obtenidos exitosamente"));
        } catch (ResponseStatusException e) {
            throw e;
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Error al obtener logs de auditoría: " + e.getMessage()));
        }
    }

    private AuditLog.AccionAudit parseAccion(String accion) {
        if (accion == null || accion.trim().isEmpty()) {
            return null;
        }
        try {
            return AuditLog.AccionAudit.valueOf(accion.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Acción inválida: " + accion);
        }
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasPermission(null, 'auditoria:ver')")
    public ResponseEntity<ApiResponse<AuditLogResponseDto>> obtenerLog(@PathVariable Long id) {
        try {
            AuditLogResponseDto log = auditService.obtenerLogPorId(id);
            return ResponseEntity.ok(ApiResponse.success(log, "Log de auditoría obtenido exitosamente"));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Error al obtener log de auditoría: " + e.getMessage()));
        }
    }
}
