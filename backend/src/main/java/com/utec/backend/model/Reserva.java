package com.utec.backend.model;

import com.utec.backend.audit.AuditEntityListener;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.util.List;

@Entity
@Table(name = "reserva")
@EntityListeners(AuditEntityListener.class)
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Reserva {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "espacio_id", nullable = false)
    private Espacio espacio;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "carrera_id", nullable = true)
    private Carrera carrera;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "analista_id", nullable = true)
    private Usuario analistaAsignado;
    
    @Column(name = "inicio", nullable = false)
    private Instant inicio;
    
    @Column(name = "fin", nullable = false)
    private Instant fin;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "estado", nullable = false, length = 20)
    private EstadoReserva estado;
    
    @Column(name = "es_publica", nullable = false)
    private Boolean esPublica = false;
    
    @Column(name = "titulo", nullable = false, length = 200)
    private String titulo;
    
    @Column(name = "motivo_solicitud", columnDefinition = "TEXT")
    private String motivoSolicitud;
    
    @Column(name = "mensaje_analista", columnDefinition = "TEXT")
    private String mensajeAnalista;
    
    // Se fija en alCrear() y no con @CreationTimestamp: Hibernate aplica ese
    // generador después de los callbacks, y una reserva que nace aprobada
    // necesita resuelta_en exactamente igual a created_at.
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;
    
    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    /**
     * Cuándo dejó de estar pendiente (aprobada o cancelada). Mide el tiempo de
     * respuesta; no se pisa una vez fijado. Si se creó ya aprobada es igual a
     * created_at, y las estadísticas la excluyen: no fue la respuesta de nadie.
     */
    @Column(name = "resuelta_en")
    private Instant resueltaEn;
    
    // Campos de auditoría que se pueden setear manualmente si es necesario
    // Estos ya están mapeados por las anotaciones @CreationTimestamp y @UpdateTimestamp
    
    // Relaciones
    @OneToOne(mappedBy = "reserva", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private EventoExterno eventoExterno;
    
    @OneToMany(mappedBy = "reserva", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<ReservaItemSolicitado> itemsSolicitados;
    
    @PrePersist
    void alCrear() {
        if (createdAt == null) {
            createdAt = Instant.now();
        }
        if (estado == EstadoReserva.APROBADO && resueltaEn == null) {
            resueltaEn = createdAt;
        }
    }

    /**
     * Pasa de PENDIENTE a {@code nuevoEstado} registrando cuándo se resolvió.
     * Si no estaba pendiente sólo cambia el estado: cancelar una aprobada no
     * es responder una solicitud.
     */
    public void resolver(EstadoReserva nuevoEstado, Instant cuando) {
        if (estado == EstadoReserva.PENDIENTE && nuevoEstado != EstadoReserva.PENDIENTE && resueltaEn == null) {
            resueltaEn = cuando;
        }
        estado = nuevoEstado;
    }

    // Enumeración para estados
    public enum EstadoReserva {
        PENDIENTE, APROBADO, CANCELADO
    }
}
