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

@Entity
@Table(name = "modelo_forecast")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ModeloForecast {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "scope", nullable = false, length = 50)
    private String scope;

    @Column(name = "espacio_id")
    private Long espacioId;

    /** Sólo en los modelos de reservas por tipo de espacio (scope tipo_espacio). */
    @Column(name = "tipo_espacio_id")
    private Long tipoEspacioId;

    @Column(name = "algoritmo", nullable = false, length = 50)
    private String algoritmo;

    @Column(name = "trained_at", nullable = false)
    private Instant trainedAt;

    @Column(name = "sample_size", nullable = false)
    private Integer sampleSize;

    @Column(name = "holdout_size", nullable = false)
    private Integer holdoutSize;

    @Column(name = "mape", precision = 6, scale = 2)
    private BigDecimal mape;

    @Column(name = "mae", precision = 10, scale = 2)
    private BigDecimal mae;

    @Column(name = "params_json", columnDefinition = "TEXT")
    private String paramsJson;

    @Column(name = "notas", columnDefinition = "TEXT")
    private String notas;

    @Column(name = "activo", nullable = false)
    private Boolean activo;
}
