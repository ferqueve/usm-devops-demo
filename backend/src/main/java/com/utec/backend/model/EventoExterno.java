package com.utec.backend.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "evento_externo")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class EventoExterno {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reserva_id", nullable = false, unique = true)
    private Reserva reserva;
    
    @Column(name = "organizador", length = 100)
    private String organizador;
    
    @Column(name = "descripcion", columnDefinition = "TEXT")
    private String descripcion;
}
