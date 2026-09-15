package com.utec.backend.dto.stats;

/**
 * Filtros opcionales que comparten todas las estadísticas de reservas.
 *
 * Llega armado desde los query params: cada campo en null es "sin filtrar".
 * Un rol vacío se trata como ausente, para que {@code ?rol=} no deje la
 * pantalla sin datos.
 */
public record FiltroReservas(
        Long edificioId,
        Long espacioId,
        Long tipoEspacioId,
        /** Rol de quien pidió la reserva, tal como está en usuario.rol_app. */
        String rol,
        Long carreraId
) {

    public static final FiltroReservas NINGUNO = new FiltroReservas(null, null, null, null, null);

    public FiltroReservas {
        rol = rol == null || rol.isBlank() ? null : rol.trim().toUpperCase();
    }
}
