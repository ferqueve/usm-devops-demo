package com.utec.backend.dto.audit;

import com.utec.backend.model.AuditLog;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AuditLogResponseDto {
    private Long id;
    private String entidad;
    private Integer entidadId;
    private AuditLog.AccionAudit accion;
    private Long usuarioId;
    private String usuarioNombre;
    private String usuarioEmail;
    private LocalDateTime timestamp;
    private String datosPrevios;
    private String datosNuevos;
}

