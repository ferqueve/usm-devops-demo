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

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

@Entity
@Table(name = "prediccion_reserva")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class PrediccionReserva {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "modelo_id", nullable = false)
    private Long modeloId;

    @Column(name = "fecha_objetivo", nullable = false)
    private LocalDate fechaObjetivo;

    @Column(name = "espacio_id")
    private Long espacioId;

    @Column(name = "prediccion", nullable = false, precision = 10, scale = 2)
    private BigDecimal prediccion;

    @Column(name = "banda_inferior", precision = 10, scale = 2)
    private BigDecimal bandaInferior;

    @Column(name = "banda_superior", precision = 10, scale = 2)
    private BigDecimal bandaSuperior;

    @Column(name = "generated_at", nullable = false)
    private Instant generatedAt;
}
