package com.utec.backend.model;

import com.utec.backend.audit.AuditEntityListener;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.util.List;

@Entity
@Table(name = "espacio")
@EntityListeners(AuditEntityListener.class)
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Espacio {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "nombre", nullable = false, length = 100)
    private String nombre;
    
    @Column(name = "capacidad", nullable = false)
    private Integer capacidad;
    
    @Column(name = "imagen_url", columnDefinition = "TEXT")
    private String imagenUrl;
    
    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;
    
    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
    
    @Column(name = "deleted_at", nullable = true)
    private Instant deletedAt;
    
    @Column(name = "tipo_espacio_id", nullable = false)
    private Long tipoEspacioId;
    
    @Column(name = "estado", nullable = false, length = 20)
    private String estado = "DISPONIBLE";
    
    @Column(name = "edificio_id", nullable = true)
    private Long edificioId;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tipo_espacio_id", nullable = false, insertable = false, updatable = false)
    private TipoEspacio tipoEspacio;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "edificio_id", nullable = true, insertable = false, updatable = false)
    private Edificio edificio;
    
    // Relaciones
    @OneToMany(mappedBy = "espacio", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<InventarioItem> inventarioItems;
    
    @OneToMany(mappedBy = "espacio", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<Reserva> reservas;
    
    @OneToMany(mappedBy = "espacio", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<Recomendacion> recomendaciones;
}
