package com.utec.backend.service;

import com.utec.backend.model.entity.Usuario;
import com.utec.backend.repository.UsuarioRepository;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import java.util.Optional;

/**
 * Servicio para el envío de emails
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;
    private final UsuarioRepository usuarioRepository;

    @Value("${spring.mail.username:}")
    private String fromEmail;

    @Value("${app.frontend.url:http://localhost:5173}")
    private String frontendUrl;

    /**
     * Verifica la configuración de email enviando un email de prueba
     *
     * @param to Email del destinatario para la prueba
     * @return true si se envió correctamente, false en caso contrario
     */
    public boolean verificarConfiguracionEmail(String to) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail);
            helper.setTo(to);
            helper.setSubject("Verificación de Configuración - UTEC Space Manager");
            helper.setText("""
                Este es un email de verificación para confirmar que la configuración de Gmail SMTP está funcionando correctamente.
                
                Si recibes este mensaje, significa que:
                - La configuración de Gmail SMTP está correcta
                - Las credenciales son válidas
                - El servicio de email está funcionando
                
                Saludos,
                Equipo UTEC Space Manager
                """, false);

            mailSender.send(message);
            log.info("Email de verificación enviado exitosamente a: {}", to);
            return true;

        } catch (MessagingException e) {
            log.error("Error al enviar email de verificación a {}: {}", to, e.getMessage());
            return false;
        } catch (Exception e) {
            log.error("Error inesperado al verificar configuración de email: {}", e.getMessage());
            return false;
        }
    }

    /**
     * Verifica el email del usuario y marca su cuenta como verificada
     *
     * @param email Email del usuario a verificar
     * @return true si se verificó correctamente, false si no se encontró el usuario
     */
    public boolean verificarEmailUsuario(String email) {
        try {
            Optional<Usuario> usuarioOpt = usuarioRepository.findByEmail(email);
            if (usuarioOpt.isPresent()) {
                Usuario usuario = usuarioOpt.get();
                usuario.setVerificado(true);
                usuarioRepository.save(usuario);
                log.info("Usuario {} verificado exitosamente", email);
                return true;
            } else {
                log.warn("Usuario con email {} no encontrado para verificación", email);
                return false;
            }
        } catch (Exception e) {
            log.error("Error al verificar usuario con email {}: {}", email, e.getMessage());
            return false;
        }
    }

    /**
     * Envía email de verificación con enlace
     *
     * @param to Email del destinatario
     * @param verificationToken Token de verificación
     * @return true si se envió correctamente, false en caso contrario
     */
    public boolean enviarEmailVerificacion(String to, String verificationToken) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail);
            helper.setTo(to);
            helper.setSubject("Verifica tu cuenta - UTEC Space Manager");
            
            String verificationUrl = frontendUrl + "/auth/verify?token=" + verificationToken;
            
            helper.setText("""
                ¡Bienvenido a UTEC Space Manager!
                
                Para completar tu registro, por favor verifica tu email haciendo clic en el siguiente enlace:
                
                {verificationUrl}
                
                Este enlace expirará en 24 horas.
                
                Si no solicitaste este registro, puedes ignorar este email.
                
                Saludos,
                Equipo UTEC Space Manager
                """.replace("{verificationUrl}", verificationUrl), false);

            mailSender.send(message);
            log.info("Email de verificación enviado exitosamente a: {}", to);
            return true;

        } catch (MessagingException e) {
            log.error("Error al enviar email de verificación a {}: {}", to, e.getMessage());
            return false;
        } catch (Exception e) {
            log.error("Error inesperado al enviar email de verificación: {}", e.getMessage());
            return false;
        }
    }
}
