package com.utec.backend.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.JoinTable;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.ToString;

import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "materia")
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
public class Materia extends BaseAuditableEntity {

    @Column(name = "nombre", nullable = false, length = 150)
    private String nombre;

    @Column(name = "codigo", length = 20)
    private String codigo;

    @Column(name = "descripcion", columnDefinition = "TEXT")
    private String descripcion;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "carrera_id", nullable = false)
    private Carrera carrera;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "docente_id")
    private Usuario docente;

    @Column(name = "semestre")
    private Integer semestre;

    @Column(name = "creditos")
    private Integer creditos;

    /** Correlativas: materias que hay que aprobar antes de cursar esta. */
    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
            name = "materia_prerrequisito",
            joinColumns = @JoinColumn(name = "materia_id"),
            inverseJoinColumns = @JoinColumn(name = "prerrequisito_id"))
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private Set<Materia> prerrequisitos = new HashSet<>();
}
