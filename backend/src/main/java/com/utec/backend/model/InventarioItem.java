package com.utec.backend.model;

import com.utec.backend.audit.AuditEntityListener;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "inventario_item")
@EntityListeners(AuditEntityListener.class)
@Data
@NoArgsConstructor
@AllArgsConstructor
public class InventarioItem {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "espacio_id", nullable = true)
    private Espacio espacio;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tipo_elemento_id", nullable = false)
    private TipoElemento tipoElemento;
    
    @Column(name = "cantidad", nullable = false)
    private Integer cantidad = 1;
    
    @Column(name = "estado", nullable = false, length = 20)
    private String estado = "DISPONIBLE"; // DISPONIBLE, MANTENIMIENTO, DANADO
    
    @Column(name = "observaciones", columnDefinition = "TEXT")
    private String observaciones;
    
    @Column(name = "activo", nullable = false)
    private Boolean activo = true;
    
    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
    
    @Column(name = "deleted_at", nullable = true)
    private LocalDateTime deletedAt;
}
