package com.utec.backend.exception;

/**
 * Excepción lanzada cuando ocurre un error relacionado con la carga de
 * templates de email o el envío de correos electrónicos.
 */
public class EmailDeliveryException extends RuntimeException {

    public EmailDeliveryException(String message) {
        super(message);
    }

    public EmailDeliveryException(String message, Throwable cause) {
        super(message, cause);
    }
}
