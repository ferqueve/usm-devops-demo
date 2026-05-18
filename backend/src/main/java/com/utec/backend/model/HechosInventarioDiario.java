package com.utec.backend.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.time.LocalDate;

@Entity
@Table(name = "hechos_inventario_diario")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class HechosInventarioDiario {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "fecha", nullable = false)
    private LocalDate fecha;

    @Column(name = "espacio_id")
    private Long espacioId;

    @Column(name = "tipo_elemento_id", nullable = false)
    private Long tipoElementoId;

    @Column(name = "estado", nullable = false, length = 30)
    private String estado;

    @Column(name = "count_items", nullable = false)
    private Integer countItems;

    @Column(name = "suma_cantidad", nullable = false)
    private Integer sumaCantidad;

    @Column(name = "computed_at", nullable = false)
    private Instant computedAt;
}
