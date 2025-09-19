package com.utec.backend.security.auth;

import com.utec.backend.common.exception.AuthenticationException;
import com.utec.backend.common.exception.UsuarioNotFoundException;
import com.utec.backend.security.jwt.JwtService;
import com.utec.backend.security.jwt.TokenBlacklistService;
import com.utec.backend.security.service.CustomUserDetailsService;
import com.utec.backend.model.entity.Usuario;
import com.utec.backend.repository.UsuarioRepository;
import com.utec.backend.service.EmailService;
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
        // Autenticar usuario - Spring Security manejará las excepciones automáticamente
        authenticationManager.authenticate(
            new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );

        // Buscar usuario en la base de datos
        Usuario usuario = usuarioRepository.findByEmail(request.getEmail())
            .orElseThrow(() -> new UsuarioNotFoundException("Usuario no encontrado"));

        // Generar tokens JWT reales
        UserDetails userDetails = userDetailsService.loadUserByUsername(request.getEmail());
        String token = jwtService.generateToken(userDetails);
        String refreshToken = jwtService.generateRefreshToken(userDetails);

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
            throw new AuthenticationException("Las contraseñas no coinciden");
        }

        // Verificar si el usuario ya existe
        if (usuarioRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new AuthenticationException("El email ya está registrado");
        }

        // Crear nuevo usuario
        Usuario usuario = new Usuario();
        usuario.setNombre(request.getNombre());
        usuario.setEmail(request.getEmail());
        usuario.setPassword(passwordEncoder.encode(request.getPassword()));
        usuario.setRolApp(Usuario.RolApp.EXTERNO); // Rol por defecto para usuarios registrados
        usuario.setVerificado(false); // Inicialmente no verificado
        usuario.setOauthProv(null); // Registro manual, no OAuth

        // Guardar usuario
        Usuario usuarioGuardado = usuarioRepository.save(usuario);

        // Enviar email de verificación
        try {
            boolean emailEnviado = emailService.verificarConfiguracionEmail(usuarioGuardado.getEmail());
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
        if (authHeader != null && authHeader.startsWith(com.utec.backend.security.config.Constants.BEARER_PREFIX)) {
            String token = authHeader.substring(com.utec.backend.security.config.Constants.BEARER_PREFIX.length());
            // Agregar token a blacklist
            tokenBlacklistService.blacklistToken(token);
        }
    }

    public boolean verifyToken(String authHeader) {
        try {
            if (authHeader != null && authHeader.startsWith(com.utec.backend.security.config.Constants.BEARER_PREFIX)) {
                String token = authHeader.substring(com.utec.backend.security.config.Constants.BEARER_PREFIX.length());
                
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
                
                return new AuthenticationResponse(
                    newToken,
                    newRefreshToken,
                    usuario.getEmail(),
                    usuario.getNombre(),
                    usuario.getRolApp().name(),
                    jwtService.getExpirationTime()
                );
            } else {
                throw new AuthenticationException("Refresh token inválido");
            }
        } catch (Exception e) {
            throw new AuthenticationException("Error al refrescar token: " + e.getMessage());
        }
    }

}
