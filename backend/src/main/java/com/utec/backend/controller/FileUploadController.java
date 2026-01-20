package com.utec.backend.controller;

import com.utec.backend.common.ApiResponse;
import com.utec.backend.service.EspacioService;
import com.utec.backend.service.FileStorageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

/**
 * Controlador para gestionar la subida y eliminación de imágenes de espacios
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/espacios")
@RequiredArgsConstructor
public class FileUploadController {

    private final FileStorageService fileStorageService;
    private final EspacioService espacioService;

    /**
     * Sube una imagen para un espacio
     *
     * @param espacioId ID del espacio
     * @param file      Archivo de imagen
     * @return URL de la imagen subida
     */
    @PostMapping("/{id}/imagen")
    @PreAuthorize("hasPermission(null, 'archivo:subir')")
    public ResponseEntity<ApiResponse<Map<String, String>>> uploadImage(
            @PathVariable("id") Long espacioId,
            @RequestParam("file") MultipartFile file) {
        try {
            // Verificar que el espacio existe
            espacioService.getEspacioById(espacioId);

            // Subir imagen
            String objectName = fileStorageService.uploadImage(file, espacioId);

            // Actualizar el espacio con la nueva imagen
            espacioService.updateEspacioImagen(espacioId, objectName);

            // Obtener URL pública
            String imageUrl = fileStorageService.getImageUrl(objectName);

            Map<String, String> response = new HashMap<>();
            response.put("objectName", objectName);
            response.put("imageUrl", imageUrl);

            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ApiResponse.success(response, "Imagen subida exitosamente"));
        } catch (IllegalArgumentException e) {
            log.warn("Error de validación al subir imagen: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error("Error de validación: " + e.getMessage()));
        } catch (IOException e) {
            log.error("Error al subir imagen para espacio {}", espacioId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Error al subir la imagen: " + e.getMessage()));
        } catch (RuntimeException e) {
            log.error("Error al procesar solicitud de subida de imagen", e);
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error(e.getMessage()));
        }
    }

    /**
     * Elimina la imagen de un espacio
     *
     * @param espacioId ID del espacio
     * @return Respuesta de éxito
     */
    @DeleteMapping("/{id}/imagen")
    @PreAuthorize("hasPermission(null, 'archivo:subir')")
    public ResponseEntity<ApiResponse<Void>> deleteImage(@PathVariable("id") Long espacioId) {
        try {
            // Obtener el espacio para acceder a la imagen actual
            var espacio = espacioService.getEspacioById(espacioId);
            String currentImageUrl = espacio.getImagenUrl();

            // Eliminar imagen de MinIO si existe
            if (currentImageUrl != null && !currentImageUrl.trim().isEmpty()) {
                fileStorageService.deleteImage(currentImageUrl);
            }

            // Actualizar el espacio para remover la referencia a la imagen
            espacioService.updateEspacioImagen(espacioId, null);

            return ResponseEntity.ok(ApiResponse.success(null, "Imagen eliminada exitosamente"));
        } catch (IOException e) {
            log.error("Error al eliminar imagen para espacio {}", espacioId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Error al eliminar la imagen: " + e.getMessage()));
        } catch (RuntimeException e) {
            log.error("Error al procesar solicitud de eliminación de imagen", e);
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error(e.getMessage()));
        }
    }

    /**
     * Obtiene la URL de la imagen de un espacio
     *
     * @param espacioId ID del espacio
     * @return URL de la imagen
     */
    @GetMapping("/{id}/imagen")
    @PreAuthorize("hasPermission(null, 'archivo:ver')")
    public ResponseEntity<ApiResponse<Map<String, String>>> getImageUrl(@PathVariable("id") Long espacioId) {
        try {
            var espacio = espacioService.getEspacioById(espacioId);
            String imageUrl = espacio.getImagenUrl();

            Map<String, String> response = new HashMap<>();
            if (imageUrl != null && !imageUrl.trim().isEmpty()) {
                // Si es una ruta de MinIO, convertir a URL pública
                String publicUrl = fileStorageService.getImageUrl(imageUrl);
                response.put("imageUrl", publicUrl);
                response.put("objectName", imageUrl);
            } else {
                response.put("imageUrl", null);
                response.put("objectName", null);
            }

            return ResponseEntity.ok(ApiResponse.success(response, "URL de imagen obtenida exitosamente"));
        } catch (RuntimeException e) {
            log.error("Error al obtener URL de imagen", e);
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error(e.getMessage()));
        }
    }
}
