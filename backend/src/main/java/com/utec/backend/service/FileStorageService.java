package com.utec.backend.service;

import io.minio.*;
import io.minio.errors.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.security.InvalidKeyException;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.time.format.DateTimeFormatter;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

/**
 * Servicio para gestionar el almacenamiento de archivos en MinIO
 */
@Slf4j
@Service
public class FileStorageService {

    @Autowired(required = false)
    private MinioClient minioClient;

    @Value("${minio.bucket-name}")
    private String bucketName;

    @Value("${minio.endpoint}")
    private String endpoint;

    @Value("${minio.public-url:${minio.endpoint}}")
    private String publicUrl;

    @Value("${minio.max-file-size:10485760}")
    private long maxFileSize;

    @Value("${minio.allowed-mime-types:image/jpeg,image/jpg,image/png,image/webp,image/gif}")
    private String allowedMimeTypes;

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyyMMddHHmmss").withZone(java.time.ZoneOffset.UTC);

    /**
     * Verifica si MinIO está disponible
     */
    public boolean isAvailable() {
        return minioClient != null;
    }

    /**
     * Sube una imagen para un espacio
     *
     * @param file      Archivo a subir
     * @param espacioId ID del espacio
     * @return Ruta del objeto en MinIO (para almacenar en BD)
     * @throws IOException Si hay error al leer el archivo
     */
    public String uploadImage(MultipartFile file, Long espacioId) throws IOException {
        if (!isAvailable()) {
            log.warn("Cannot upload image: MinIO is not available");
            throw new IOException("MinIO is not available. File storage is disabled.");
        }

        // Validar archivo
        validateFile(file);

        try {
            // Generar nombre único para el archivo
            String originalFilename = file.getOriginalFilename();
            String extension = getFileExtension(originalFilename);
            String timestamp = Instant.now().atZone(java.time.ZoneOffset.UTC).format(DATE_FORMATTER);
            String uniqueFilename = String.format("%s-%s%s", timestamp, UUID.randomUUID().toString().substring(0, 8), extension);
            
            // Ruta del objeto: espacios/{espacioId}/{filename}
            String objectName = String.format("espacios/%d/%s", espacioId, uniqueFilename);

            // Subir archivo a MinIO
            minioClient.putObject(
                    PutObjectArgs.builder()
                            .bucket(bucketName)
                            .object(objectName)
                            .stream(file.getInputStream(), file.getSize(), -1)
                            .contentType(file.getContentType())
                            .build()
            );

            log.info("Imagen subida exitosamente: {} para espacio {}", objectName, espacioId);
            return objectName;
        } catch (MinioException | InvalidKeyException | NoSuchAlgorithmException e) {
            log.error("Error al subir imagen a MinIO para espacio {}", espacioId, e);
            throw new IOException("Error al subir la imagen: " + e.getMessage(), e);
        }
    }

    /**
     * Elimina una imagen de MinIO
     *
     * @param objectName Nombre del objeto a eliminar
     * @throws IOException Si hay error al eliminar
     */
    public void deleteImage(String objectName) throws IOException {
        if (!isAvailable()) {
            log.warn("Cannot delete image {}: MinIO is not available", objectName);
            return; // No lanzar excepción, solo ignorar
        }

        if (objectName == null || objectName.trim().isEmpty()) {
            log.warn("Intento de eliminar imagen con objectName vacío");
            return;
        }

        // Si es una URL externa (http/https), no intentar eliminar
        if (objectName.startsWith("http://") || objectName.startsWith("https://")) {
            log.info("No se elimina URL externa: {}", objectName);
            return;
        }

        try {
            minioClient.removeObject(
                    RemoveObjectArgs.builder()
                            .bucket(bucketName)
                            .object(objectName)
                            .build()
            );
            log.info("Imagen eliminada exitosamente: {}", objectName);
        } catch (MinioException | InvalidKeyException | NoSuchAlgorithmException e) {
            log.error("Error al eliminar imagen de MinIO: {}", objectName, e);
            throw new IOException("Error al eliminar la imagen: " + e.getMessage(), e);
        }
    }

    /**
     * Obtiene la URL pública de una imagen
     *
     * @param objectName Nombre del objeto
     * @return URL pública de la imagen
     */
    public String getImageUrl(String objectName) {
        if (objectName == null || objectName.trim().isEmpty()) {
            return null;
        }

        // Si ya es una URL externa, retornarla tal cual
        if (objectName.startsWith("http://") || objectName.startsWith("https://")) {
            return objectName;
        }

        if (!isAvailable()) {
            log.warn("Cannot get image URL for {}: MinIO is not available", objectName);
            return null;
        }

        try {
            // Construir URL pública de MinIO (usar publicUrl para acceso desde navegador)
            // Formato: http://localhost:9000/bucket-name/object-name
            String baseUrl = publicUrl;
            // Remover trailing slash si existe
            if (baseUrl.endsWith("/")) {
                baseUrl = baseUrl.substring(0, baseUrl.length() - 1);
            }
            return String.format("%s/%s/%s", baseUrl, bucketName, objectName);
        } catch (Exception e) {
            log.error("Error al obtener URL de imagen: {}", objectName, e);
            return null;
        }
    }

    /**
     * Valida que el archivo cumpla con los requisitos
     *
     * @param file Archivo a validar
     * @throws IllegalArgumentException Si el archivo no es válido
     */
    private void validateFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("El archivo no puede estar vacío");
        }

        // Validar tamaño
        if (file.getSize() > maxFileSize) {
            throw new IllegalArgumentException(
                    String.format("El archivo excede el tamaño máximo permitido de %d bytes (%.2f MB)",
                            maxFileSize, maxFileSize / (1024.0 * 1024.0))
            );
        }

        // Validar tipo MIME
        String contentType = file.getContentType();
        if (contentType == null) {
            throw new IllegalArgumentException("No se pudo determinar el tipo de archivo");
        }

        List<String> allowedTypes = Arrays.asList(allowedMimeTypes.split(","));
        boolean isAllowed = allowedTypes.stream()
                .anyMatch(type -> contentType.toLowerCase().startsWith(type.trim().toLowerCase()));

        if (!isAllowed) {
            throw new IllegalArgumentException(
                    String.format("Tipo de archivo no permitido: %s. Tipos permitidos: %s",
                            contentType, allowedMimeTypes)
            );
        }
    }

    /**
     * Obtiene la extensión del archivo
     *
     * @param filename Nombre del archivo
     * @return Extensión con punto (ej: .jpg)
     */
    private String getFileExtension(String filename) {
        if (filename == null || filename.isEmpty()) {
            return ".jpg"; // Default
        }
        int lastDot = filename.lastIndexOf('.');
        if (lastDot > 0 && lastDot < filename.length() - 1) {
            return filename.substring(lastDot).toLowerCase();
        }
        return ".jpg"; // Default
    }

    /**
     * Verifica si un objeto existe en MinIO
     *
     * @param objectName Nombre del objeto
     * @return true si existe, false en caso contrario
     */
    public boolean objectExists(String objectName) {
        if (!isAvailable()) {
            log.warn("Cannot check if object {} exists: MinIO is not available", objectName);
            return false;
        }

        if (objectName == null || objectName.trim().isEmpty()) {
            return false;
        }

        // Si es una URL externa, asumir que existe
        if (objectName.startsWith("http://") || objectName.startsWith("https://")) {
            return true;
        }

        try {
            minioClient.statObject(
                    StatObjectArgs.builder()
                            .bucket(bucketName)
                            .object(objectName)
                            .build()
            );
            return true;
        } catch (Exception e) {
            return false;
        }
    }
}

