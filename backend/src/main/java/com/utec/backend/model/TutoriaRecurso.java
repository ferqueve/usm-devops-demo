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

/** Material/recurso (link) que el docente adjunta a una tutoría. */
@Entity
@Table(name = "tutoria_recurso")
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
public class TutoriaRecurso extends BaseAuditableEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tutoria_id", nullable = false)
    private Tutoria tutoria;

    @Column(name = "titulo", nullable = false, length = 200)
    private String titulo;

    @Column(name = "url", nullable = false, length = 1000)
    private String url;
}
