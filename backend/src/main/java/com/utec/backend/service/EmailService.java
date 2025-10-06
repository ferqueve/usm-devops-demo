package com.utec.backend.service;

import com.utec.backend.model.entity.Usuario;
import com.utec.backend.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import java.util.Optional;

/**
 * Servicio para el envío de emails usando Gmail API
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final GmailApiService gmailApiService;
    private final UsuarioRepository usuarioRepository;

    @Value("${gmail.api.from-email:usm.utec.uy@gmail.com}")
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
        return gmailApiService.verificarConfiguracionGmailApi(to);
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
     * Envía email de verificación con enlace usando Gmail API
     *
     * @param to Email del destinatario
     * @param verificationToken Token de verificación
     * @return true si se envió correctamente, false en caso contrario
     */
    public boolean enviarEmailVerificacion(String to, String verificationToken) {
        String subject = "Verifica tu cuenta - UTEC Space Manager";
        String verificationUrl = frontendUrl + "/auth/verify?token=" + verificationToken;
        
        String bodyText = """
            ¡Bienvenido a UTEC Space Manager!
            
            Para completar tu registro, por favor verifica tu email haciendo clic en el siguiente enlace:
            
            {verificationUrl}
            
            Este enlace expirará en 24 horas.
            
            Si no solicitaste este registro, puedes ignorar este email.
            
            Saludos,
            Equipo UTEC Space Manager
            """.replace("{verificationUrl}", verificationUrl);

        return gmailApiService.sendEmail(to, subject, bodyText);
    }
}
