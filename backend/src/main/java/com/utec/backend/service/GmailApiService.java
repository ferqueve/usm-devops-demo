package com.utec.backend.service;

import com.google.api.client.auth.oauth2.Credential;
import com.google.api.client.googleapis.javanet.GoogleNetHttpTransport;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.JsonFactory;
import com.google.api.client.json.gson.GsonFactory;
import com.google.api.services.gmail.Gmail;
import com.google.api.services.gmail.model.Message;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;
import java.io.IOException;
import java.security.GeneralSecurityException;
import java.util.Base64;

/**
 * Servicio para el envío de emails usando Gmail API
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class GmailApiService {

    private static final String APPLICATION_NAME = "UTEC Space Manager";
    private static final JsonFactory JSON_FACTORY = GsonFactory.getDefaultInstance();

    @Value("${gmail.api.client-id:}")
    private String clientId;

    @Value("${gmail.api.client-secret:}")
    private String clientSecret;

    @Value("${gmail.api.refresh-token:}")
    private String refreshToken;

    @Value("${gmail.api.from-email:usm.utec.uy@gmail.com}")
    private String fromEmail;

    private Gmail gmailService;
    private NetHttpTransport httpTransport;

    @PostConstruct
    public void initializeGmailService() {
        try {
            httpTransport = GoogleNetHttpTransport.newTrustedTransport();
            gmailService = new Gmail.Builder(httpTransport, JSON_FACTORY, getCredentials())
                    .setApplicationName(APPLICATION_NAME)
                    .build();
            log.info("Gmail API service initialized successfully");
        } catch (GeneralSecurityException | IOException e) {
            log.error("Error initializing Gmail API service: {}", e.getMessage());
            throw new RuntimeException("Failed to initialize Gmail API service", e);
        }
    }

    /**
     * Obtiene las credenciales para Gmail API usando refresh token
     */
    private Credential getCredentials() throws IOException {
        if (clientId == null || clientId.trim().isEmpty() ||
            clientSecret == null || clientSecret.trim().isEmpty() ||
            refreshToken == null || refreshToken.trim().isEmpty()) {
            throw new RuntimeException("Gmail API credentials not configured properly");
        }

        // Crear credencial con refresh token directamente
        Credential credential = new Credential.Builder(
                com.google.api.client.auth.oauth2.BearerToken.authorizationHeaderAccessMethod())
                .setTransport(httpTransport)
                .setJsonFactory(JSON_FACTORY)
                .setTokenServerEncodedUrl("https://oauth2.googleapis.com/token")
                .setClientAuthentication(new com.google.api.client.auth.oauth2.ClientParametersAuthentication(clientId, clientSecret))
                .build();

        // Establecer refresh token
        credential.setRefreshToken(refreshToken);

        return credential;
    }

    /**
     * Envía un email usando Gmail API
     *
     * @param to Email del destinatario
     * @param subject Asunto del email
     * @param bodyText Cuerpo del email en texto plano
     * @return true si se envió correctamente, false en caso contrario
     */
    public boolean sendEmail(String to, String subject, String bodyText) {
        try {
            // Crear mensaje simple sin MIME
            String emailContent = createSimpleEmailContent(to, subject, bodyText);
            String encodedEmail = Base64.getUrlEncoder().withoutPadding().encodeToString(emailContent.getBytes("UTF-8"));
            
            Message message = new Message();
            message.setRaw(encodedEmail);
            
            // Enviar email
            message = gmailService.users().messages().send("me", message).execute();
            
            log.info("Email sent successfully to {} with message ID: {}", to, message.getId());
            return true;
            
        } catch (Exception e) {
            log.error("Error sending email to {}: {}", to, e.getMessage());
            return false;
        }
    }

    /**
     * Envía un email HTML usando Gmail API
     *
     * @param to Email del destinatario
     * @param subject Asunto del email
     * @param htmlBody Cuerpo del email en HTML
     * @return true si se envió correctamente, false en caso contrario
     */
    public boolean sendHtmlEmail(String to, String subject, String htmlBody) {
        try {
            // Crear mensaje HTML simple
            String emailContent = createHtmlEmailContent(to, subject, htmlBody);
            String encodedEmail = Base64.getUrlEncoder().withoutPadding().encodeToString(emailContent.getBytes("UTF-8"));
            
            Message message = new Message();
            message.setRaw(encodedEmail);
            
            // Enviar email
            message = gmailService.users().messages().send("me", message).execute();
            
            log.info("HTML email sent successfully to {} with message ID: {}", to, message.getId());
            return true;
            
        } catch (Exception e) {
            log.error("Error sending HTML email to {}: {}", to, e.getMessage());
            return false;
        }
    }

    /**
     * Crea el contenido del email en formato simple
     */
    private String createSimpleEmailContent(String to, String subject, String bodyText) {
        StringBuilder email = new StringBuilder();
        email.append("From: ").append(fromEmail).append("\r\n");
        email.append("To: ").append(to).append("\r\n");
        email.append("Subject: ").append(subject).append("\r\n");
        email.append("Content-Type: text/plain; charset=UTF-8\r\n");
        email.append("\r\n");
        email.append(bodyText);
        return email.toString();
    }

    /**
     * Crea el contenido del email HTML en formato simple
     */
    private String createHtmlEmailContent(String to, String subject, String htmlBody) {
        StringBuilder email = new StringBuilder();
        email.append("From: ").append(fromEmail).append("\r\n");
        email.append("To: ").append(to).append("\r\n");
        email.append("Subject: ").append(subject).append("\r\n");
        email.append("Content-Type: text/html; charset=UTF-8\r\n");
        email.append("\r\n");
        email.append(htmlBody);
        return email.toString();
    }

    /**
     * Verifica la configuración de Gmail API enviando un email de prueba
     *
     * @param to Email del destinatario para la prueba
     * @return true si se envió correctamente, false en caso contrario
     */
    public boolean verificarConfiguracionGmailApi(String to) {
        String subject = "Verificación de Configuración - UTEC Space Manager (Gmail API)";
        String body = """
            Este es un email de verificación para confirmar que la configuración de Gmail API está funcionando correctamente.
            
            Si recibes este mensaje, significa que:
            - La configuración de Gmail API está correcta
            - Las credenciales son válidas
            - El servicio de email está funcionando
            
            Saludos,
            Equipo UTEC Space Manager
            """;
        
        return sendEmail(to, subject, body);
    }
}
