package com.utec.backend.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;
import org.springframework.util.StreamUtils;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;

/**
 * Servicio para cargar y procesar templates de email HTML
 */
@Service
@Slf4j
public class EmailTemplateService {

    private static final String TEMPLATES_DIR = "templates/email/";

    /**
     * Carga un template HTML desde resources y reemplaza los placeholders
     *
     * @param templateName Nombre del archivo template (ej: "verificacion.html")
     * @param variables Map con las variables a reemplazar (ej: {"nombre": "Juan", "url": "http://..."})
     * @return HTML procesado con las variables reemplazadas
     */
    public String loadTemplate(String templateName, Map<String, String> variables) {
        try {
            ClassPathResource resource = new ClassPathResource(TEMPLATES_DIR + templateName);
            
            if (!resource.exists()) {
                log.error("Template no encontrado: {}", templateName);
                throw new RuntimeException("Template de email no encontrado: " + templateName);
            }

            String template = StreamUtils.copyToString(
                resource.getInputStream(),
                StandardCharsets.UTF_8
            );

            // Reemplazar variables en el template
            String processedTemplate = template;
            if (variables != null) {
                for (Map.Entry<String, String> entry : variables.entrySet()) {
                    String placeholder = "{{" + entry.getKey() + "}}";
                    String value = entry.getValue() != null ? entry.getValue() : "";
                    processedTemplate = processedTemplate.replace(placeholder, value);
                }
            }

            return processedTemplate;

        } catch (IOException e) {
            log.error("Error al cargar template {}: {}", templateName, e.getMessage());
            throw new RuntimeException("Error al cargar template de email: " + templateName, e);
        }
    }

    /**
     * Carga una imagen y la convierte a base64 para embeber en el email
     *
     * @param imagePath Ruta de la imagen en resources (ej: "static/logo-utec.png")
     * @return Data URI con la imagen en base64, o null si hay error
     */
    private String loadImageAsBase64(String imagePath) {
        try {
            ClassPathResource resource = new ClassPathResource(imagePath);
            if (!resource.exists()) {
                log.warn("Imagen no encontrada: {}", imagePath);
                return null;
            }

            byte[] imageBytes = StreamUtils.copyToByteArray(resource.getInputStream());
            String base64Image = Base64.getEncoder().encodeToString(imageBytes);
            
            // Determinar el tipo MIME basado en la extensión
            String mimeType = "image/png"; // Por defecto PNG
            if (imagePath.toLowerCase().endsWith(".jpg") || imagePath.toLowerCase().endsWith(".jpeg")) {
                mimeType = "image/jpeg";
            } else if (imagePath.toLowerCase().endsWith(".gif")) {
                mimeType = "image/gif";
            } else if (imagePath.toLowerCase().endsWith(".svg")) {
                mimeType = "image/svg+xml";
            }
            
            return "data:" + mimeType + ";base64," + base64Image;
        } catch (IOException e) {
            log.error("Error al cargar imagen {}: {}", imagePath, e.getMessage());
            return null;
        }
    }

    /**
     * Carga el template base (wrapper común para todos los emails)
     *
     * @param content Contenido HTML del email
     * @param subject Asunto del email (para el título)
     * @param backendUrl URL del backend (no se usa para imágenes, pero se mantiene por compatibilidad)
     * @return HTML completo con el wrapper
     */
    public String wrapInBaseTemplate(String content, String subject, String backendUrl) {
        // Cargar el logo y convertirlo a base64
        String logoBase64 = loadImageAsBase64("static/logo-utec.png");
        
        Map<String, String> variables = new HashMap<>();
        variables.put("content", content);
        variables.put("subject", subject != null ? subject : "UTEC Space Manager");
        variables.put("logoBase64", logoBase64 != null ? logoBase64 : "");
        
        return loadTemplate("base.html", variables);
    }
}

