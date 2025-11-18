package com.utec.backend.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "usuario")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Usuario {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "email", nullable = false, unique = true, length = 255)
    private String email;
    
    @Column(name = "nombre", nullable = false, length = 100)
    private String nombre;
    
    @Column(name = "password", nullable = true, length = 255)
    private String password;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "rol_app", nullable = false, length = 20)
    private RolApp rolApp;
    
    @Column(name = "verificado", nullable = false)
    private Boolean verificado = false;
    
    @Column(name = "oauth_prov", nullable = true, length = 20)
    private String oauthProv;
    
    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
    
    @Column(name = "deleted_at", nullable = true)
    private LocalDateTime deletedAt;
    
    // Relaciones
    @OneToMany(mappedBy = "usuario", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<Reserva> reservas;
    
    @OneToMany(mappedBy = "usuario", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<Recomendacion> recomendaciones;
    
    @OneToMany(mappedBy = "usuario", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<AuditLog> auditLogs;
    
    // Enumeración para roles
    public enum RolApp {
        ANALISTA, DOCENTE, ESTUDIANTE, EXTERNO, ADMIN, MANTENIMIENTO
    }
}
