package com.utec.backend.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "inventario_item")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class InventarioItem {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "salon_id", nullable = false)
    private Salon salon;
    
    @Column(name = "tipo", nullable = false, length = 50)
    private String tipo;
    
    @Column(name = "cantidad", nullable = false)
    private Integer cantidad;
    
    @Column(name = "activo", nullable = false)
    private Boolean activo = true;
}
