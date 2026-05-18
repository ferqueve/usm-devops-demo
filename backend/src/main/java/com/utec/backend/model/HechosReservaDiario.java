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
@Table(name = "hechos_reserva_diario")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class HechosReservaDiario {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "fecha", nullable = false)
    private LocalDate fecha;

    @Column(name = "espacio_id", nullable = false)
    private Long espacioId;

    @Column(name = "carrera_id")
    private Long carreraId;

    @Column(name = "edificio_id")
    private Long edificioId;

    @Column(name = "estado", nullable = false, length = 20)
    private String estado;

    @Column(name = "cant_reservas", nullable = false)
    private Integer cantReservas;

    @Column(name = "horas_totales", nullable = false, precision = 10, scale = 2)
    private BigDecimal horasTotales;

    @Column(name = "cant_canceladas_late", nullable = false)
    private Integer cantCanceladasLate;

    @Column(name = "lead_time_promedio_dias", precision = 6, scale = 2)
    private BigDecimal leadTimePromedioDias;

    @Column(name = "computed_at", nullable = false)
    private Instant computedAt;
}
