package com.utec.backend.common.exception;

public class AccesoDenegadoException extends RuntimeException {
    public AccesoDenegadoException(String message) {
        super(message);
    }
    
    public AccesoDenegadoException() {
        super("Acceso denegado. No tienes permisos para realizar esta acción.");
    }
}
