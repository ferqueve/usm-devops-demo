package com.utec.backend.service;

import io.minio.*;
import io.minio.errors.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.lang.Nullable;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.ImageIO;
import java.awt.Graphics2D;
import java.awt.RenderingHints;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.security.InvalidKeyException;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.time.format.DateTimeFormatter;
import java.util.Arrays;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Servicio para gestionar el almacenamiento de archivos en MinIO
 */
@Slf4j
@Service
public class FileStorageService {

    private static final String HTTP_PREFIX = "http://";
    private static final String HTTPS_PREFIX = "https://";

    /**
     * Ancho de la miniatura. Las fotos de los espacios se suben tal cual salen
     * de la camara -- medido en produccion, 4096x2304 y 1,9 MB -- y las tarjetas
     * del listado las muestran a 279 px de ancho. Con doce por pagina eso son
     * unos 15 MB para dibujar doce miniaturas.
     */
    private static final int ANCHO_MINIATURA = 800;
    private static final String SUFIJO_MINIATURA = "-thumb.jpg";

    /**
     * Imagenes con miniatura confirmada. Sin esto, armar el DTO de cada espacio
     * consultaba MinIO una vez por espacio en cada listado. Una miniatura no
     * desaparece, asi que alcanza con preguntar una vez por arranque.
     */
    private final Set<String> miniaturasConocidas = ConcurrentHashMap.newKeySet();

    @Nullable
    private final MinioClient minioClient;

    public FileStorageService(@Autowired(required = false) @Nullable MinioClient minioClient) {
        this.minioClient = minioClient;
    }

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

    @Value("${minio.allowed-doc-mime-types:application/pdf,image/,application/msword,application/vnd.openxmlformats-officedocument.,application/vnd.ms-excel,application/vnd.ms-powerpoint,text/plain}")
    private String allowedDocMimeTypes;

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
            
            // Construir la ruta del objeto siguiendo el patron espacios por id y nombre de archivo
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

            // La miniatura es lo que consume el listado; si falla, se sigue
            // mostrando la original.
            generarMiniatura(objectName);

            return objectName;
        } catch (MinioException | InvalidKeyException | NoSuchAlgorithmException e) {
            log.error("Error al subir imagen a MinIO para espacio {}", espacioId, e);
            throw new IOException("Error al subir la imagen: " + e.getMessage(), e);
        }
    }

    /**
     * Sube un documento (PDF, imagen, archivo office, etc.) asociado a una materia.
     * A diferencia de {@link #uploadImage}, no restringe a imágenes: valida contra
     * el conjunto configurado en {@code minio.allowed-doc-mime-types} y sube al
     * prefijo {@code materias/{materiaId}/...}.
     *
     * @param file      Archivo a subir
     * @param materiaId ID de la materia
     * @return Ruta del objeto en MinIO (objectName, para almacenar en BD)
     * @throws IOException Si hay error al leer el archivo
     */
    public String uploadDocumento(MultipartFile file, Long materiaId) throws IOException {
        if (!isAvailable()) {
            log.warn("Cannot upload documento: MinIO is not available");
            throw new IOException("MinIO is not available. File storage is disabled.");
        }

        // Validar archivo contra los tipos de documento permitidos
        validateDocumento(file);

        try {
            String originalFilename = file.getOriginalFilename();
            String extension = getFileExtension(originalFilename);
            String timestamp = Instant.now().atZone(java.time.ZoneOffset.UTC).format(DATE_FORMATTER);
            String uniqueFilename = String.format("%s-%s%s", timestamp, UUID.randomUUID().toString().substring(0, 8), extension);

            // Prefijo de la materia
            String objectName = String.format("materias/%d/%s", materiaId, uniqueFilename);

            minioClient.putObject(
                    PutObjectArgs.builder()
                            .bucket(bucketName)
                            .object(objectName)
                            .stream(file.getInputStream(), file.getSize(), -1)
                            .contentType(file.getContentType())
                            .build()
            );

            log.info("Documento subido exitosamente: {} para materia {}", objectName, materiaId);
            return objectName;
        } catch (MinioException | InvalidKeyException | NoSuchAlgorithmException e) {
            log.error("Error al subir documento a MinIO para materia {}", materiaId, e);
            throw new IOException("Error al subir el documento: " + e.getMessage(), e);
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
        if (objectName.startsWith(HTTP_PREFIX) || objectName.startsWith(HTTPS_PREFIX)) {
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
        if (objectName.startsWith(HTTP_PREFIX) || objectName.startsWith(HTTPS_PREFIX)) {
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
     * Valida que el documento cumpla con los requisitos (tamaño y tipo MIME de documento).
     * Reutiliza el mismo límite de tamaño que las imágenes, pero valida contra el
     * conjunto de tipos de documento permitidos.
     *
     * @param file Archivo a validar
     * @throws IllegalArgumentException Si el archivo no es válido
     */
    private void validateDocumento(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("El archivo no puede estar vacío");
        }

        if (file.getSize() > maxFileSize) {
            throw new IllegalArgumentException(
                    String.format("El archivo excede el tamaño máximo permitido de %d bytes (%.2f MB)",
                            maxFileSize, maxFileSize / (1024.0 * 1024.0))
            );
        }

        String contentType = file.getContentType();
        if (contentType == null) {
            throw new IllegalArgumentException("No se pudo determinar el tipo de archivo");
        }

        List<String> allowedTypes = Arrays.asList(allowedDocMimeTypes.split(","));
        boolean isAllowed = allowedTypes.stream()
                .anyMatch(type -> contentType.toLowerCase().startsWith(type.trim().toLowerCase()));

        if (!isAllowed) {
            throw new IllegalArgumentException(
                    String.format("Tipo de archivo no permitido: %s. Tipos permitidos: %s",
                            contentType, allowedDocMimeTypes)
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
        if (objectName.startsWith(HTTP_PREFIX) || objectName.startsWith(HTTPS_PREFIX)) {
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

    /**
     * Nombre del objeto de la miniatura correspondiente a una imagen.
     * Devuelve null si la imagen es una URL externa o esta vacia.
     */
    public String getMiniaturaObjectName(String valorGuardado) {
        String objectName = resolverObjectName(valorGuardado);
        if (objectName == null) {
            return null;
        }
        int punto = objectName.lastIndexOf('.');
        String base = punto > 0 ? objectName.substring(0, punto) : objectName;
        return base + SUFIJO_MINIATURA;
    }

    /**
     * Nombre del objeto en el bucket a partir de lo guardado en la base, que
     * segun el origen es la clave del objeto o la URL publica entera. Devuelve
     * null si la imagen vive fuera de nuestro bucket.
     */
    public String resolverObjectName(String valorGuardado) {
        if (valorGuardado == null || valorGuardado.trim().isEmpty()) {
            return null;
        }
        String valor = valorGuardado.trim();
        if (!valor.startsWith(HTTP_PREFIX) && !valor.startsWith(HTTPS_PREFIX)) {
            return valor;
        }
        // .../<bucket>/<clave del objeto>
        String marca = "/" + bucketName + "/";
        int corte = valor.indexOf(marca);
        if (corte < 0) {
            return null;
        }
        String clave = valor.substring(corte + marca.length());
        int query = clave.indexOf('?');
        return query >= 0 ? clave.substring(0, query) : clave;
    }

    /** True si la miniatura ya existe en el bucket. */
    public boolean existeMiniatura(String valorGuardado) {
        String miniatura = getMiniaturaObjectName(valorGuardado);
        if (miniatura == null || !isAvailable()) {
            return false;
        }
        if (miniaturasConocidas.contains(valorGuardado)) {
            return true;
        }
        try {
            minioClient.statObject(StatObjectArgs.builder().bucket(bucketName).object(miniatura).build());
            miniaturasConocidas.add(valorGuardado);
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    /**
     * Genera y guarda la miniatura de una imagen ya subida. Es best-effort: si
     * algo falla, la aplicacion sigue mostrando la original.
     *
     * @return true si la miniatura quedo guardada.
     */
    public boolean generarMiniatura(String valorGuardado) {
        String miniatura = getMiniaturaObjectName(valorGuardado);
        String objectName = resolverObjectName(valorGuardado);
        if (miniatura == null || objectName == null || !isAvailable()) {
            return false;
        }

        try (InputStream origen = minioClient.getObject(
                GetObjectArgs.builder().bucket(bucketName).object(objectName).build())) {

            BufferedImage original = ImageIO.read(origen);
            if (original == null) {
                log.warn("No se pudo leer la imagen {} para generar su miniatura", objectName);
                return false;
            }

            byte[] bytes = escalarAJpeg(original);
            if (bytes.length == 0) {
                return false;
            }

            minioClient.putObject(
                    PutObjectArgs.builder()
                            .bucket(bucketName)
                            .object(miniatura)
                            .stream(new ByteArrayInputStream(bytes), bytes.length, -1)
                            .contentType("image/jpeg")
                            .build()
            );
            miniaturasConocidas.add(valorGuardado);
            log.info("Miniatura generada: {} ({} KB)", miniatura, bytes.length / 1024);
            return true;
        } catch (Exception e) {
            log.warn("No se pudo generar la miniatura de {}: {}", valorGuardado, e.getMessage());
            return false;
        }
    }

    /** Escala manteniendo la relacion de aspecto y codifica en JPEG. */
    private byte[] escalarAJpeg(BufferedImage original) throws IOException {
        int ancho = Math.min(ANCHO_MINIATURA, original.getWidth());
        int alto = Math.max(1, (int) Math.round(original.getHeight() * (ancho / (double) original.getWidth())));

        BufferedImage destino = new BufferedImage(ancho, alto, BufferedImage.TYPE_INT_RGB);
        Graphics2D g = destino.createGraphics();
        try {
            g.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BILINEAR);
            g.setRenderingHint(RenderingHints.KEY_RENDERING, RenderingHints.VALUE_RENDER_QUALITY);
            g.drawImage(original, 0, 0, ancho, alto, null);
        } finally {
            g.dispose();
        }

        ByteArrayOutputStream salida = new ByteArrayOutputStream();
        ImageIO.write(destino, "jpg", salida);
        return salida.toByteArray();
    }
}

