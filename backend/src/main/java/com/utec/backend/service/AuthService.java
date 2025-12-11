package com.utec.backend.service;

import com.utec.backend.exception.AuthenticationException;
import com.utec.backend.exception.UsuarioNotFoundException;
import com.utec.backend.security.jwt.JwtService;
import com.utec.backend.security.jwt.TokenBlacklistService;
import com.utec.backend.model.Usuario;
import com.utec.backend.repository.UsuarioRepository;
import com.utec.backend.dto.auth.AuthenticationRequest;
import com.utec.backend.dto.auth.AuthenticationResponse;
import com.utec.backend.dto.auth.RegisterRequest;
import com.utec.backend.dto.auth.RegisterResponse;
import com.utec.backend.util.RolUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final TokenBlacklistService tokenBlacklistService;
    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;
    private final CustomUserDetailsService userDetailsService;
    private final EmailService emailService;

    public AuthenticationResponse authenticate(AuthenticationRequest request) {
        // PRIMERO: Verificar si el usuario existe y su tipo ANTES de intentar autenticar
        Optional<Usuario> usuarioOpt = usuarioRepository.findByEmail(request.getEmail());
        
        if (usuarioOpt.isPresent()) {
            Usuario usuario = usuarioOpt.get();
            
            // Caso 1: Usuario OAuth sin contraseña
            if (usuario.getOauthProv() != null && usuario.getPassword() == null) {
                log.warn("Intento de login manual para usuario OAuth sin contraseña: {}", request.getEmail());
                throw new AuthenticationException(
                    "Esta cuenta está vinculada con Google. Por favor, inicia sesión con Google o establece una contraseña desde las preferencias de tu perfil después de autenticarte con Google."
                );
            }
        }
        
        // Intentar autenticación
        try {
            authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
            );
        } catch (Exception e) {
            // Si falla la autenticación, verificar si es usuario OAuth con contraseña establecida
            if (usuarioOpt.isPresent() && usuarioOpt.get().getOauthProv() != null) {
                log.warn("Intento de login manual fallido para usuario OAuth con contraseña: {}", request.getEmail());
                throw new AuthenticationException(
                    "Contraseña incorrecta. Esta cuenta está vinculada con Google. Puedes iniciar sesión con Google o verificar tu contraseña."
                );
            }
            // Si falla la autenticación, lanzar excepción con mensaje claro
            log.warn("Intento de login fallido para email: {}", request.getEmail());
            throw new AuthenticationException("Email o contraseña incorrectos. Verifica tus credenciales e intenta nuevamente.");
        }

        // Buscar usuario en la base de datos (ya sabemos que existe por la verificación anterior)
        Usuario usuario = usuarioOpt
            .orElseThrow(() -> new UsuarioNotFoundException("No encontramos una cuenta con ese email"));

        // Verificar si el usuario ha verificado su email
        if (!usuario.getVerificado()) {
            log.warn("Intento de login con email no verificado: {}", request.getEmail());
            throw new AuthenticationException("Por favor verifica tu email antes de iniciar sesión. Revisa tu bandeja de entrada o solicita un nuevo código de verificación.");
        }

        // Verificar si el usuario está activo (no eliminado)
        if (usuario.getDeletedAt() != null) {
            log.warn("Intento de login con usuario inactivo: {}", request.getEmail());
            throw new AuthenticationException("Tu cuenta ha sido desactivada. Por favor, contacta al administrador para más información.");
        }

        // Generar tokens JWT reales
        UserDetails userDetails = userDetailsService.loadUserByUsername(request.getEmail());
        String token = jwtService.generateToken(userDetails);
        String refreshToken = jwtService.generateRefreshToken(userDetails);

        log.info("Login exitoso para usuario: {} (rol: {})", usuario.getEmail(), usuario.getRolApp());

        return new AuthenticationResponse(
            token,
            refreshToken,
            usuario.getEmail(),
            usuario.getNombre(),
            usuario.getRolApp().name(),
            jwtService.getExpirationTime()
        );
    }

    public RegisterResponse register(RegisterRequest request) {
        // Validar que las contraseñas coincidan
        if (!request.getPassword().equals(request.getConfirmPassword())) {
            throw new AuthenticationException("Las contraseñas no coinciden. Verifica que hayas escrito la misma contraseña en ambos campos.");
        }
        
        // Validar aceptación de términos y política
        if (request.getAceptaTerminos() == null || !request.getAceptaTerminos()) {
            throw new AuthenticationException("Debes aceptar los términos y condiciones para registrarte.");
        }
        
        if (request.getAceptaPolitica() == null || !request.getAceptaPolitica()) {
            throw new AuthenticationException("Debes aceptar la política de privacidad para registrarte.");
        }

        // Verificar si el usuario ya existe
        Optional<Usuario> usuarioExistente = usuarioRepository.findByEmail(request.getEmail());
        if (usuarioExistente.isPresent()) {
            Usuario usuario = usuarioExistente.get();
            
            // Caso: Email existe por OAuth
            if (usuario.getOauthProv() != null) {
                log.warn("Intento de registro con email que ya existe por OAuth: {}", request.getEmail());
                throw new AuthenticationException(
                    "Ya existe una cuenta registrada con este email usando Google. Por favor, inicia sesión con Google o establece una contraseña desde las preferencias de tu perfil después de autenticarte con Google."
                );
            }
            
            // Caso: Email existe por registro manual
            throw new AuthenticationException(
                "Ya existe una cuenta registrada con este email. Si ya tienes una cuenta, intenta iniciar sesión o usa el enlace '¿Olvidaste tu contraseña?'"
            );
        }

        // Crear nuevo usuario
        Usuario usuario = new Usuario();
        // Combinar nombre y apellido en un solo campo
        String nombreCompleto = request.getNombre() + " " + request.getApellido();
        usuario.setNombre(nombreCompleto);
        usuario.setEmail(request.getEmail());
        usuario.setPassword(passwordEncoder.encode(request.getPassword()));
        // Asignar rol basado en el dominio del email
        usuario.setRolApp(RolUtil.determinarRolPorEmail(request.getEmail()));
        usuario.setVerificado(false); // Inicialmente no verificado
        usuario.setOauthProv(null); // Registro manual, no OAuth

        // Guardar usuario
        Usuario usuarioGuardado = usuarioRepository.save(usuario);

        // Generar y enviar email de verificación
        try {
            String verificationToken = jwtService.generateVerificationToken(usuarioGuardado.getEmail());
            boolean emailEnviado = emailService.enviarEmailVerificacion(usuarioGuardado.getEmail(), verificationToken);
            if (emailEnviado) {
                log.info("Email de verificación enviado exitosamente al usuario: {}", usuarioGuardado.getEmail());
            } else {
                log.warn("No se pudo enviar el email de verificación al usuario: {}", usuarioGuardado.getEmail());
            }
        } catch (Exception e) {
            log.error("Error al enviar email de verificación al usuario {}: {}", usuarioGuardado.getEmail(), e.getMessage());
            // No lanzamos excepción para no interrumpir el registro, solo logueamos el error
        }

        return new RegisterResponse(
            "Usuario registrado exitosamente",
            usuarioGuardado.getEmail(),
            usuarioGuardado.getNombre()
        );
    }

    public void logout(String authHeader) {
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring("Bearer ".length());
            // Agregar token a blacklist
            tokenBlacklistService.blacklistToken(token);
            
            try {
                String userEmail = jwtService.extractUsername(token);
                log.info("Logout exitoso para usuario: {}", userEmail);
            } catch (Exception e) {
                log.info("Logout exitoso (no se pudo extraer email del token)");
            }
        }
    }

    public boolean verifyToken(String authHeader) {
        try {
            if (authHeader != null && authHeader.startsWith("Bearer ")) {
                String token = authHeader.substring("Bearer ".length());
                
                // Verificar si está en blacklist
                if (tokenBlacklistService.isTokenBlacklisted(token)) {
                    return false;
                }
                
                // Verificar si el token es válido
                return jwtService.isTokenValid(token);
            }
            return false;
        } catch (Exception e) {
            return false;
        }
    }

    public AuthenticationResponse refreshToken(String refreshToken) {
        try {
            // Extraer email del refresh token
            String userEmail = jwtService.extractUsername(refreshToken);
            
            // Verificar si el refresh token es válido
            if (userEmail != null && jwtService.isTokenValid(refreshToken)) {
                UserDetails userDetails = userDetailsService.loadUserByUsername(userEmail);
                
                // Generar nuevo access token
                String newToken = jwtService.generateToken(userDetails);
                String newRefreshToken = jwtService.generateRefreshToken(userDetails);
                
                // Buscar usuario para obtener información adicional
                Usuario usuario = usuarioRepository.findByEmail(userEmail)
                    .orElseThrow(() -> new UsuarioNotFoundException("Usuario no encontrado"));
                
                // Verificar si el usuario está activo (no eliminado)
                if (usuario.getDeletedAt() != null) {
                    log.warn("Intento de refresh token con usuario inactivo: {}", userEmail);
                    throw new AuthenticationException("Tu cuenta ha sido desactivada. Por favor, contacta al administrador para más información.");
                }
                
                log.info("Refresh token renovado exitosamente para usuario: {}", userEmail);
                
                return new AuthenticationResponse(
                    newToken,
                    newRefreshToken,
                    usuario.getEmail(),
                    usuario.getNombre(),
                    usuario.getRolApp().name(),
                    jwtService.getExpirationTime()
                );
            } else {
                log.warn("Intento de refresh con token inválido para usuario: {}", userEmail);
                throw new AuthenticationException("Refresh token inválido o expirado");
            }
        } catch (io.jsonwebtoken.ExpiredJwtException e) {
            log.warn("Intento de refresh con token expirado para usuario: {}", e.getClaims().getSubject());
            throw new AuthenticationException("Tu sesión ha expirado completamente. Por favor, inicia sesión nuevamente.");
        } catch (Exception e) {
            log.error("Error al refrescar token: {}", e.getMessage());
            throw new AuthenticationException("Error al refrescar token: " + e.getMessage());
        }
    }

    public boolean verifyEmail(String token) {
        try {
            String email = jwtService.extractUsernameFromVerificationToken(token);
            if (email != null) {
                Usuario usuario = usuarioRepository.findByEmail(email)
                    .orElseThrow(() -> new UsuarioNotFoundException("Usuario no encontrado"));
                
                usuario.setVerificado(true);
                usuarioRepository.save(usuario);
                log.info("Usuario {} verificado exitosamente", email);
                return true;
            }
            return false;
        } catch (Exception e) {
            log.error("Error al verificar email con token: {}", e.getMessage());
            return false;
        }
    }

    public boolean resendVerificationEmail(String email) {
        try {
            Usuario usuario = usuarioRepository.findByEmail(email)
                .orElseThrow(() -> new UsuarioNotFoundException("Usuario no encontrado"));
            
            if (usuario.getVerificado()) {
                log.warn("Usuario {} ya está verificado", email);
                return false;
            }
            
            String verificationToken = jwtService.generateVerificationToken(email);
            boolean emailEnviado = emailService.enviarEmailVerificacion(email, verificationToken);
            
            if (emailEnviado) {
                log.info("Email de verificación reenviado exitosamente al usuario: {}", email);
                return true;
            } else {
                log.warn("No se pudo reenviar el email de verificación al usuario: {}", email);
                return false;
            }
        } catch (Exception e) {
            log.error("Error al reenviar email de verificación al usuario {}: {}", email, e.getMessage());
            return false;
        }
    }

    public boolean forgotPassword(String email) {
        try {
            Optional<Usuario> usuarioOpt = usuarioRepository.findByEmail(email);
            
            if (usuarioOpt.isEmpty()) {
                // Por seguridad, no revelamos si el email existe o no
                log.info("Solicitud de recuperación de contraseña para email no encontrado: {}", email);
                return true; // Retornamos true para no revelar información
            }
            
            Usuario usuario = usuarioOpt.get();
            
            // Validar que el usuario no sea OAuth sin contraseña
            if (usuario.getOauthProv() != null && (usuario.getPassword() == null || usuario.getPassword().isEmpty())) {
                log.warn("Intento de recuperación de contraseña para usuario OAuth sin contraseña: {}", email);
                throw new AuthenticationException(
                    "Esta cuenta está vinculada con Google y no tiene contraseña establecida. Por favor, inicia sesión con Google o establece una contraseña desde las preferencias de tu perfil después de autenticarte con Google."
                );
            }
            
            // Validar que el usuario tenga email verificado
            if (!usuario.getVerificado()) {
                log.warn("Intento de recuperación de contraseña para usuario no verificado: {}", email);
                throw new AuthenticationException(
                    "Debes verificar tu email antes de poder recuperar tu contraseña. Por favor, verifica tu email primero."
                );
            }
            
            // Generar token de recuperación
            String resetToken = jwtService.generatePasswordResetToken(email);
            boolean emailEnviado = emailService.enviarEmailRecuperacionPassword(email, resetToken);
            
            if (emailEnviado) {
                log.info("Email de recuperación de contraseña enviado exitosamente al usuario: {}", email);
                return true;
            } else {
                log.warn("No se pudo enviar el email de recuperación de contraseña al usuario: {}", email);
                return false;
            }
        } catch (AuthenticationException e) {
            throw e; // Re-lanzar excepciones de autenticación
        } catch (Exception e) {
            log.error("Error al procesar solicitud de recuperación de contraseña para {}: {}", email, e.getMessage());
            return false;
        }
    }

    public boolean resetPassword(String token, String newPassword) {
        try {
            // Validar token
            if (!jwtService.isPasswordResetTokenValid(token)) {
                log.warn("Intento de reset de contraseña con token inválido o expirado");
                throw new AuthenticationException("El token de recuperación es inválido o ha expirado. Por favor, solicita un nuevo enlace de recuperación.");
            }
            
            // Extraer email del token
            String email = jwtService.extractUsernameFromPasswordResetToken(token);
            if (email == null) {
                log.warn("No se pudo extraer el email del token de recuperación");
                throw new AuthenticationException("El token de recuperación es inválido.");
            }
            
            // Buscar usuario
            Usuario usuario = usuarioRepository.findByEmail(email)
                .orElseThrow(() -> new UsuarioNotFoundException("Usuario no encontrado"));
            
            // Validar que el usuario no sea OAuth sin contraseña (aunque esto no debería pasar si forgotPassword validó correctamente)
            if (usuario.getOauthProv() != null && (usuario.getPassword() == null || usuario.getPassword().isEmpty())) {
                log.warn("Intento de reset de contraseña para usuario OAuth sin contraseña: {}", email);
                throw new AuthenticationException(
                    "Esta cuenta está vinculada con Google y no tiene contraseña establecida. Por favor, inicia sesión con Google o establece una contraseña desde las preferencias de tu perfil."
                );
            }
            
            // Validar nueva contraseña
            if (newPassword == null || newPassword.length() < 6) {
                throw new AuthenticationException("La contraseña debe tener al menos 6 caracteres.");
            }
            
            // Actualizar contraseña
            usuario.setPassword(passwordEncoder.encode(newPassword));
            usuarioRepository.save(usuario);
            
            log.info("Contraseña restablecida exitosamente para el usuario: {}", email);
            return true;
        } catch (AuthenticationException | UsuarioNotFoundException e) {
            throw e; // Re-lanzar excepciones conocidas
        } catch (Exception e) {
            log.error("Error al restablecer contraseña: {}", e.getMessage());
            throw new AuthenticationException("Error al restablecer la contraseña. Por favor, intenta nuevamente.");
        }
    }

}
