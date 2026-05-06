package com.utec.backend.service;

import com.google.api.client.auth.oauth2.BearerToken;
import com.google.api.client.auth.oauth2.ClientParametersAuthentication;
import com.google.api.client.auth.oauth2.Credential;
import com.google.api.client.googleapis.javanet.GoogleNetHttpTransport;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.JsonFactory;
import com.google.api.client.json.gson.GsonFactory;
import com.google.api.services.gmail.Gmail;
import com.google.api.services.gmail.model.Message;
import com.utec.backend.exception.EmailDeliveryException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;
import jakarta.mail.MessagingException;
import jakarta.mail.Session;
import jakarta.mail.internet.InternetAddress;
import jakarta.mail.internet.MimeMessage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.Base64;
import java.util.Properties;

/**
 * Servicio para el envío de emails usando Gmail API
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class GmailApiService {

    private static final String APPLICATION_NAME = "UTEC Space Manager";
    private static final String UTF_8 = "UTF-8";
    private static final JsonFactory JSON_FACTORY = GsonFactory.getDefaultInstance();

    @Value("${gmail.api.client-id:}")
    private String clientId;

    @Value("${gmail.api.client-secret:}")
    private String clientSecret;

    @Value("${gmail.api.refresh-token:}")
    private String refreshToken;

    @Value("${gmail.api.from-email:usm.utec.uy@gmail.com}")
    private String fromEmail;

    @Value("${gmail.api.enabled:false}")
    private boolean gmailEnabled;

    private Gmail gmailService;
    private NetHttpTransport httpTransport;
    private boolean initialized = false;

    @PostConstruct
    public void initializeGmailService() {
        if (!gmailEnabled) {
            log.warn("Gmail API is DISABLED. Email functionality will not be available.");
            log.warn("To enable Gmail API, set gmail.api.enabled=true and configure credentials.");
            return;
        }

        try {
            httpTransport = GoogleNetHttpTransport.newTrustedTransport();
            gmailService = new Gmail.Builder(httpTransport, JSON_FACTORY, getCredentials())
                    .setApplicationName(APPLICATION_NAME)
                    .build();
            initialized = true;
            log.info("Gmail API service initialized successfully");
        } catch (Exception e) {
            log.error("Error initializing Gmail API service: {}", e.getMessage());
            log.warn("Gmail API will be DISABLED. Email functionality will not be available.");
            initialized = false;
        }
    }

    /**
     * Verifica si el servicio de Gmail API está disponible
     */
    public boolean isAvailable() {
        return gmailEnabled && initialized && gmailService != null;
    }

    /**
     * Obtiene las credenciales para Gmail API usando refresh token
     */
    private Credential getCredentials() {
        if (clientId == null || clientId.trim().isEmpty() ||
            clientSecret == null || clientSecret.trim().isEmpty() ||
            refreshToken == null || refreshToken.trim().isEmpty()) {
            throw new EmailDeliveryException("Las credenciales de Gmail API no están configuradas correctamente");
        }

        // Crear credencial con refresh token directamente
        Credential credential = new Credential.Builder(
                BearerToken.authorizationHeaderAccessMethod())
                .setTransport(httpTransport)
                .setJsonFactory(JSON_FACTORY)
                .setTokenServerEncodedUrl("https://oauth2.googleapis.com/token")
                .setClientAuthentication(new ClientParametersAuthentication(clientId, clientSecret))
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
        if (!isAvailable()) {
            log.warn("Cannot send email to {}: Gmail API is not available", to);
            return false;
        }

        try {
            // Crear mensaje sin encoding especial
            String emailContent = createSimpleEmailContent(to, subject, bodyText);
            byte[] emailBytes = emailContent.getBytes();
            String encodedEmail = Base64.getUrlEncoder().withoutPadding().encodeToString(emailBytes);
            
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
        if (!isAvailable()) {
            log.warn("Cannot send HTML email to {}: Gmail API is not available", to);
            return false;
        }

        try {
            // Configurar sesión con charset UTF-8 como se sugiere
            Properties props = new Properties();
            props.put("mail.mime.charset", UTF_8);
            Session session = Session.getInstance(props);
            
            // Crear MimeMessage
            MimeMessage email = new MimeMessage(session);
            email.setFrom(new InternetAddress(fromEmail));
            email.addRecipient(jakarta.mail.Message.RecipientType.TO, new InternetAddress(to));
            
            // Usar setSubject y setContent con UTF-8 explícito como se sugiere
            email.setSubject(subject, UTF_8);
            email.setContent(htmlBody, "text/html; charset=UTF-8");
            
            // Codificar y envolver el mensaje MIME en un mensaje de Gmail
            ByteArrayOutputStream buffer = new ByteArrayOutputStream();
            email.writeTo(buffer);
            byte[] rawMessageBytes = buffer.toByteArray();
            
            // Usar Base64 URL-safe encoding
            String encodedEmail = Base64.getUrlEncoder().withoutPadding().encodeToString(rawMessageBytes);
            
            Message message = new Message();
            message.setRaw(encodedEmail);
            
            // Enviar email
            message = gmailService.users().messages().send("me", message).execute();
            
            log.info("HTML email sent successfully to {} with message ID: {}", to, message.getId());
            return true;
            
        } catch (MessagingException | IOException e) {
            log.error("Error sending HTML email to {}: {}", to, e.getMessage(), e);
            return false;
        } catch (Exception e) {
            log.error("Error sending HTML email to {}: {}", to, e.getMessage());
            return false;
        }
    }

    /**
     * Crea el contenido del email en formato simple (para emails de texto plano)
     */
    private String createSimpleEmailContent(String to, String subject, String bodyText) {
        try {
            // Configurar sesión con charset UTF-8 como se sugiere
            Properties props = new Properties();
            props.put("mail.mime.charset", UTF_8);
            Session session = Session.getInstance(props);
            
            MimeMessage email = new MimeMessage(session);
            email.setFrom(new InternetAddress(fromEmail));
            email.addRecipient(jakarta.mail.Message.RecipientType.TO, new InternetAddress(to));
            
            // Usar setSubject y setText con UTF-8 explícito como se sugiere
            email.setSubject(subject, UTF_8);
            email.setText(bodyText, UTF_8);
            
            // Convertir MimeMessage a bytes
            ByteArrayOutputStream buffer = new ByteArrayOutputStream();
            email.writeTo(buffer);
            byte[] rawMessageBytes = buffer.toByteArray();
            
            // Retornar como string para codificar después
            return new String(rawMessageBytes);
            
        } catch (Exception e) {
            log.error("Error creating simple email content: {}", e.getMessage());
            // Fallback a método simple
            StringBuilder email = new StringBuilder();
            email.append("From: ").append(fromEmail).append("\r\n");
            email.append("To: ").append(to).append("\r\n");
            email.append("Subject: ").append(subject).append("\r\n");
            email.append("Content-Type: text/plain; charset=UTF-8\r\n");
            email.append("\r\n");
            email.append(bodyText);
            return email.toString();
        }
    }

    /**
     * Verifica la configuración de Gmail API enviando un email de prueba
     *
     * @param to Email del destinatario para la prueba
     * @return true si se envió correctamente, false en caso contrario
     */
    public boolean verificarConfiguracionGmailApi(String to) {
        if (!isAvailable()) {
            log.warn("Cannot verify Gmail API configuration: Gmail API is not available");
            return false;
        }

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
