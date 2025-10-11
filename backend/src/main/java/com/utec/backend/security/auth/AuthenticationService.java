package com.utec.backend.security.auth;

import com.utec.backend.common.exception.AuthenticationException;
import com.utec.backend.common.exception.UsuarioNotFoundException;
import com.utec.backend.security.jwt.JwtService;
import com.utec.backend.security.jwt.TokenBlacklistService;
import com.utec.backend.security.service.CustomUserDetailsService;
import com.utec.backend.model.entity.Usuario;
import com.utec.backend.repository.UsuarioRepository;
import com.utec.backend.service.EmailService;
import com.utec.backend.util.RolUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthenticationService {

    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final TokenBlacklistService tokenBlacklistService;
    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;
    private final CustomUserDetailsService userDetailsService;
    private final EmailService emailService;

    public AuthenticationResponse authenticate(AuthenticationRequest request) {
        try {
            // Autenticar usuario - Spring Security manejará las excepciones automáticamente
            authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
            );
        } catch (Exception e) {
            // Si falla la autenticación, lanzar excepción con mensaje claro
            log.warn("Intento de login fallido para email: {}", request.getEmail());
            throw new AuthenticationException("Email o contraseña incorrectos. Verifica tus credenciales e intenta nuevamente.");
        }

        // Buscar usuario en la base de datos
        Usuario usuario = usuarioRepository.findByEmail(request.getEmail())
            .orElseThrow(() -> new UsuarioNotFoundException("No encontramos una cuenta con ese email"));

        // Verificar si el usuario ha verificado su email
        if (!usuario.getVerificado()) {
            log.warn("Intento de login con email no verificado: {}", request.getEmail());
            throw new AuthenticationException("Por favor verifica tu email antes de iniciar sesión. Revisa tu bandeja de entrada o solicita un nuevo código de verificación.");
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

        // Verificar si el usuario ya existe
        if (usuarioRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new AuthenticationException("Ya existe una cuenta registrada con este email. Si ya tienes una cuenta, intenta iniciar sesión o usa el enlace '¿Olvidaste tu contraseña?'");
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

}
