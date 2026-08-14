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
@Table(name = "evento")
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
public class Evento extends BaseAuditableEntity {

    @Column(name = "titulo", nullable = false, length = 200)
    private String titulo;

    @Column(name = "descripcion", columnDefinition = "TEXT")
    private String descripcion;

    /** Categorías libres separadas por coma (CSV). Ej: "IA,Workshop,Gratuito". */
    @Column(name = "tags", length = 500)
    private String tags;

    /** EVENTO | CURSO */
    @Column(name = "tipo", nullable = false, length = 20)
    private String tipo = "EVENTO";

    @Column(name = "inicio", nullable = false)
    private Instant inicio;

    @Column(name = "fin")
    private Instant fin;

    @Column(name = "cupo")
    private Integer cupo;

    @Column(name = "es_publico", nullable = false)
    private Boolean esPublico = true;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "espacio_id")
    private Espacio espacio;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "organizador_id")
    private Usuario organizador;

    /** BORRADOR | PUBLICADO | FINALIZADO | CANCELADO */
    @Column(name = "estado", nullable = false, length = 20)
    private String estado = "PUBLICADO";

    /** Marca anti-reenvío del recordatorio automático por email. */
    @Column(name = "recordatorio_enviado", nullable = false)
    private Boolean recordatorioEnviado = false;

    /** Patrón de fondo del banner (catálogo en el front). null = patrón por defecto. */
    @Column(name = "patron", length = 30)
    private String patron;
}
