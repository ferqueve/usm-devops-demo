package com.utec.backend.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "tutoria_reserva")
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
public class TutoriaReserva extends BaseAuditableEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tutoria_id", nullable = false)
    private Tutoria tutoria;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "estudiante_id", nullable = false)
    private Usuario estudiante;

    /** AGENDADA | ESPERA | CANCELADA | ASISTIO */
    @Column(name = "estado", nullable = false, length = 20)
    private String estado = "AGENDADA";

    /** Qué quiere repasar el estudiante en esta tutoría. */
    @Column(name = "temario", columnDefinition = "TEXT")
    private String temario;

    /** El estudiante confirmó que va a asistir (anti no-show). */
    @Column(name = "confirmada", nullable = false)
    private Boolean confirmada = false;
}
