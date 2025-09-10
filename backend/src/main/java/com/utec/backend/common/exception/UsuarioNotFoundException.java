package com.utec.backend.common.exception;

public class UsuarioNotFoundException extends RuntimeException {
    public UsuarioNotFoundException(String message) {
        super(message);
    }
    
    public UsuarioNotFoundException(Long id) {
        super("Usuario con ID " + id + " no encontrado");
    }
}
