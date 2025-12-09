package com.utec.backend.service;

import com.google.api.client.googleapis.auth.oauth2.GoogleAuthorizationCodeTokenRequest;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.googleapis.auth.oauth2.GoogleTokenResponse;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import com.utec.backend.exception.AuthenticationException;
import com.utec.backend.model.Usuario;
import com.utec.backend.repository.UsuarioRepository;
import com.utec.backend.dto.auth.AuthenticationResponse;
import com.utec.backend.dto.auth.GoogleUserInfo;
import com.utec.backend.security.jwt.JwtService;
import com.utec.backend.util.RolUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.security.GeneralSecurityException;
import java.util.Collections;

import static com.utec.backend.security.Constants.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class OAuth2Service {

    private final UsuarioRepository usuarioRepository;
    private final JwtService jwtService;
    private final CustomUserDetailsService userDetailsService;

    @Value("${spring.security.oauth2.client.registration.google.client-id}")
    private String googleClientId;

    @Value("${spring.security.oauth2.client.registration.google.client-secret}")
    private String googleClientSecret;

    @Value("${app.frontend.url:http://localhost:5173}")
    private String frontendUrl;

    @Value("${app.backend.url:http://localhost:8080}")
    private String backendUrl;

    /**
     * Maneja el callback de Google OAuth intercambiando código por tokens
     */
    public AuthenticationResponse handleGoogleCallback(String authorizationCode) {
        try {
            // Intercambiar código de autorización por tokens
            GoogleTokenResponse tokenResponse = exchangeCodeForTokens(authorizationCode);
            
            // Verificar ID token y extraer información del usuario
            GoogleUserInfo googleUser = verifyIdToken(tokenResponse.getIdToken());
            
            if (googleUser == null) {
                throw new AuthenticationException("ID Token de Google inválido");
            }

            // Buscar o crear usuario
            Usuario usuario = findOrCreateOAuthUser(googleUser);

            // Verificar si el usuario está activo (no eliminado)
            if (usuario.getDeletedAt() != null) {
                log.warn("Intento de login OAuth con usuario inactivo: {}", usuario.getEmail());
                throw new AuthenticationException("Tu cuenta ha sido desactivada. Por favor, contacta al administrador para más información.");
            }

            // Generar tokens JWT
            UserDetails userDetails = userDetailsService.loadUserByUsername(usuario.getEmail());
            
            if (userDetails == null) {
                throw new AuthenticationException("No se pudo cargar los detalles del usuario");
            }
            
            String token = jwtService.generateToken(userDetails);
            String refreshToken = jwtService.generateRefreshToken(userDetails);
            
            if (token == null || token.trim().isEmpty()) {
                throw new AuthenticationException("No se pudo generar el token de acceso");
            }
            
            if (refreshToken == null || refreshToken.trim().isEmpty()) {
                throw new AuthenticationException("No se pudo generar el token de refresh");
            }

            log.info("Usuario autenticado exitosamente con Google OAuth: {}", usuario.getEmail());

            // Validar que todos los valores requeridos no sean null
            String email = usuario.getEmail();
            String nombre = usuario.getNombre();
            String rol = usuario.getRolApp() != null ? usuario.getRolApp().name() : ROLE_EXTERNO;
            Long expiresIn = jwtService.getExpirationTime();
            
            if (email == null || email.trim().isEmpty()) {
                throw new AuthenticationException("Email del usuario es requerido");
            }
            
            if (nombre == null || nombre.trim().isEmpty()) {
                nombre = "Usuario OAuth"; // Valor por defecto
            }
            
            // expiresIn nunca será null ya que getExpirationTime() retorna un long primitivo
            // pero mantenemos la validación por seguridad
            if (expiresIn == null || expiresIn <= 0) {
                expiresIn = 3600000L; // 1 hora por defecto
            }
            
            return new AuthenticationResponse(
                token,
                refreshToken,
                email,
                nombre,
                rol,
                expiresIn
            );

        } catch (Exception e) {
            log.error("Error en callback de Google OAuth: {}", e.getMessage());
            throw new AuthenticationException("Error al procesar autenticación con Google");
        }
    }

    /**
     * Intercambia el código de autorización por tokens de Google
     */
    private GoogleTokenResponse exchangeCodeForTokens(String authorizationCode) throws IOException {
        String redirectUri = backendUrl + "/api/v1/oauth2/google/callback";
        
        GoogleTokenResponse tokenResponse = new GoogleAuthorizationCodeTokenRequest(
            new NetHttpTransport(),
            new GsonFactory(),
            googleClientId,
            googleClientSecret,
            authorizationCode,
            redirectUri
        ).execute();

        log.info("Tokens de Google obtenidos exitosamente");
        return tokenResponse;
    }

    /**
     * Verifica el ID token de Google y extrae información del usuario
     */
    private GoogleUserInfo verifyIdToken(String idTokenString) throws GeneralSecurityException, IOException {
        GoogleIdTokenVerifier verifier = new GoogleIdTokenVerifier.Builder(
            new NetHttpTransport(),
            new GsonFactory()
        )
            .setAudience(Collections.singletonList(googleClientId))
            .build();

        GoogleIdToken idToken = verifier.verify(idTokenString);
        
        if (idToken != null) {
            GoogleIdToken.Payload payload = idToken.getPayload();

            String email = payload.getEmail();
            boolean emailVerified = payload.getEmailVerified();
            String name = (String) payload.get("name");
            String pictureUrl = (String) payload.get("picture");

            if (!emailVerified) {
                log.warn("Email de Google no verificado: {}", email);
                throw new AuthenticationException("El email de Google debe estar verificado");
            }

            return new GoogleUserInfo(email, name, String.valueOf(emailVerified), pictureUrl);
        } else {
            log.warn("ID Token de Google inválido");
            return null;
        }
    }

    /**
     * Busca un usuario existente o crea uno nuevo con OAuth
     */
    private Usuario findOrCreateOAuthUser(GoogleUserInfo googleUser) {
        return usuarioRepository.findByEmail(googleUser.getEmail())
            .map(usuario -> {
                // Usuario existe - actualizar info si es necesario
                if (usuario.getOauthProv() == null) {
                    // Vincular cuenta OAuth a usuario existente
                    log.info("Vinculando cuenta Google a usuario existente: {}", usuario.getEmail());
                    usuario.setOauthProv("GOOGLE");
                    usuario.setVerificado(true); // Google ya verificó el email
                    usuarioRepository.save(usuario);
                }
                return usuario;
            })
            .orElseGet(() -> {
                // Crear nuevo usuario OAuth
                log.info("Creando nuevo usuario con Google OAuth: {}", googleUser.getEmail());
                
                // Validar datos del usuario de Google
                String email = googleUser.getEmail();
                String nombre = googleUser.getNombre();
                
                if (email == null || email.trim().isEmpty()) {
                    throw new AuthenticationException("Email de Google es requerido");
                }
                
                if (nombre == null || nombre.trim().isEmpty()) {
                    nombre = "Usuario OAuth"; // Valor por defecto
                }
                
                Usuario nuevoUsuario = new Usuario();
                nuevoUsuario.setEmail(email);
                nuevoUsuario.setNombre(nombre);
                nuevoUsuario.setPassword(null); // OAuth no usa contraseña
                nuevoUsuario.setOauthProv("GOOGLE");
                // Asignar rol basado en el dominio del email
                nuevoUsuario.setRolApp(RolUtil.determinarRolPorEmail(email));
                nuevoUsuario.setVerificado(true); // Google ya verificó el email
                
                return usuarioRepository.save(nuevoUsuario);
            });
    }
}
