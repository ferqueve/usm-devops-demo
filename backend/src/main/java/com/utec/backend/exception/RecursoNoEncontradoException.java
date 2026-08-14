package com.utec.backend.exception;

/**
 * No existe la entidad pedida, o está borrada lógicamente. Se mapea a 404 NOT FOUND.
 *
 * <p>Existe para distinguir "no está" de "lo que mandaste está mal": antes ambos casos
 * viajaban como {@link IllegalArgumentException} y cada controller elegía a mano si
 * devolver 400 o 404.
 */
public class RecursoNoEncontradoException extends RuntimeException {
    public RecursoNoEncontradoException(String message) {
        super(message);
    }
}
