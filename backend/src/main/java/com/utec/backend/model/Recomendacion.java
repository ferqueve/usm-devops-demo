package com.utec.backend.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "recomendacion", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"usuario_id", "espacio_id", "tipo_recomendacion"})
})
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Recomendacion {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "espacio_id", nullable = false)
    private Espacio espacio;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "tipo_recomendacion", nullable = false, length = 50)
    private TipoRecomendacion tipoRecomendacion;
    
    @Column(name = "puntaje", nullable = false, precision = 5, scale = 2)
    private BigDecimal puntaje = BigDecimal.ZERO;
    
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "metadata", columnDefinition = "JSONB")
    private String metadata;
    
    @Column(name = "razon", columnDefinition = "TEXT")
    private String razon;
    
    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}
