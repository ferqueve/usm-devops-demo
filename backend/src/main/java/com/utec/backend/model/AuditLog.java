package com.utec.backend.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;

@Entity
@Table(name = "audit_log")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AuditLog {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "entidad", nullable = false, length = 50)
    private String entidad;

    @Column(name = "entidad_id", nullable = false)
    private Long entidadId;

    @Enumerated(EnumType.STRING)
    @Column(name = "accion", nullable = false, length = 20)
    private AccionAudit accion;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id")
    private Usuario usuario;

    @CreationTimestamp
    @Column(name = "timestamp", nullable = false, updatable = false)
    private Instant timestamp;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "datos_previos")
    private String datosPrevios;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "datos_nuevos")
    private String datosNuevos;

    // Campos adicionales para trazabilidad completa
    @Column(name = "ip_address", length = 45) // IPv6 max length
    private String ipAddress;

    @Column(name = "http_method", length = 10)
    private String httpMethod;

    @Column(name = "endpoint", length = 255)
    private String endpoint;

    @Column(name = "user_agent", length = 500)
    private String userAgent;
    
    // Enumeración para acciones
    public enum AccionAudit {
        CREATE, UPDATE, DELETE
    }
}
