package com.utec.backend.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "reserva_item_solicitado")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ReservaItemSolicitado {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reserva_id", nullable = false)
    private Reserva reserva;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tipo_elemento_id", nullable = false)
    private TipoElemento tipoElemento;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "inventario_item_id", nullable = true)
    private InventarioItem inventarioItem;
    
    @Column(name = "cantidad_solicitada", nullable = false)
    private Integer cantidadSolicitada = 1;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "estado", nullable = false, length = 20)
    private EstadoSolicitud estado = EstadoSolicitud.PENDIENTE;
    
    @Column(name = "observaciones", columnDefinition = "TEXT")
    private String observaciones;
    
    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
    
    @Column(name = "deleted_at", nullable = true)
    private LocalDateTime deletedAt;
    
    // Enumeración para estados
    public enum EstadoSolicitud {
        PENDIENTE, APROBADO, RECHAZADO, ENTREGADO
    }
}

