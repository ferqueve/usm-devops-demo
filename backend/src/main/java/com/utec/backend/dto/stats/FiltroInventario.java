package com.utec.backend.dto.stats;

/**
 * Filtros de las estadísticas de inventario, con los mismos nombres que
 * /stats/inventario/estado. Cada campo en null es "sin filtrar".
 */
public record FiltroInventario(Long edificioId, Long espacioId, Long tipoElementoId) {

    public static final FiltroInventario NINGUNO = new FiltroInventario(null, null, null);
}
