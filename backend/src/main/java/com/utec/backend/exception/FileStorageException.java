package com.utec.backend.exception;

/**
 * Excepción lanzada cuando ocurre un error en operaciones de almacenamiento
 * de archivos (MinIO, sistema de archivos local, etc.).
 */
public class FileStorageException extends RuntimeException {

    public FileStorageException(String message) {
        super(message);
    }

    public FileStorageException(String message, Throwable cause) {
        super(message, cause);
    }
}
