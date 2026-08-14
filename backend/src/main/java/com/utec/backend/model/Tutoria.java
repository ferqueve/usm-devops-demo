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

import java.time.Instant;

@Entity
@Table(name = "tutoria")
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
public class Tutoria extends BaseAuditableEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "materia_id", nullable = false)
    private Materia materia;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "docente_id", nullable = false)
    private Usuario docente;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "espacio_id")
    private Espacio espacio;

    @Column(name = "inicio", nullable = false)
    private Instant inicio;

    @Column(name = "fin", nullable = false)
    private Instant fin;

    @Column(name = "cupo", nullable = false)
    private Integer cupo;

    /** ABIERTA | CERRADA | CANCELADA */
    @Column(name = "estado", nullable = false, length = 20)
    private String estado = "ABIERTA";

    /** PRESENCIAL | VIRTUAL */
    @Column(name = "modalidad", nullable = false, length = 20)
    private String modalidad = "PRESENCIAL";

    /** Enlace de videollamada cuando la modalidad es VIRTUAL. */
    @Column(name = "enlace", length = 500)
    private String enlace;

    /** INDIVIDUAL | GRUPAL */
    @Column(name = "tipo", nullable = false, length = 20)
    private String tipo = "GRUPAL";

    /** Temas/tags separados por coma (CSV). Incluye flags lúdicos tipo "mate". */
    @Column(name = "tags", length = 500)
    private String tags;

    /** Walk-in: el docente está disponible para consultas en vivo ahora. */
    @Column(name = "en_vivo", nullable = false)
    private Boolean enVivo = false;

    /** Patrón de fondo del banner (catálogo del front). */
    @Column(name = "patron", length = 30)
    private String patron;

    /** Marca anti-reenvío del recordatorio automático por email. */
    @Column(name = "recordatorio_enviado", nullable = false)
    private Boolean recordatorioEnviado = false;
}
