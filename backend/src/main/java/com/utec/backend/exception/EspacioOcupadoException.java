package com.utec.backend.exception;

/**
 * El espacio ya está ocupado en el rango horario pedido, sea por una reserva,
 * una tutoría o un evento. Se mapea a 409 CONFLICT.
 */
public class EspacioOcupadoException extends RuntimeException {
    public EspacioOcupadoException(String message) {
        super(message);
    }
}
