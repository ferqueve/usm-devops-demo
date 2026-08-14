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

/**
 * Valoración de un usuario sobre un evento al que asistió.
 * Un usuario deja a lo sumo un feedback por evento (índice único parcial).
 */
@Entity
@Table(name = "evento_feedback")
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
public class EventoFeedback extends BaseAuditableEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "evento_id", nullable = false)
    private Evento evento;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;

    /** 1 a 5 estrellas. */
    @Column(name = "rating", nullable = false)
    private Integer rating;

    @Column(name = "comentario", columnDefinition = "TEXT")
    private String comentario;
}
