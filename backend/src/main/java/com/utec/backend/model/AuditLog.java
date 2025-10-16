package com.utec.backend.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

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
    private Integer entidadId;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "accion", nullable = false, length = 20)
    private AccionAudit accion;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id")
    private Usuario usuario;
    
    @CreationTimestamp
    @Column(name = "timestamp", nullable = false, updatable = false)
    private LocalDateTime timestamp;
    
    @Column(name = "datos_previos", columnDefinition = "JSONB")
    private String datosPrevios;
    
    @Column(name = "datos_nuevos", columnDefinition = "JSONB")
    private String datosNuevos;
    
    // Enumeración para acciones
    public enum AccionAudit {
        CREATE, UPDATE, DELETE
    }
}
