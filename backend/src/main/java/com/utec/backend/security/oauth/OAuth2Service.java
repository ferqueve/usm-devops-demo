package com.utec.backend.security.oauth;

import com.google.api.client.googleapis.auth.oauth2.GoogleAuthorizationCodeTokenRequest;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.googleapis.auth.oauth2.GoogleTokenResponse;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import com.utec.backend.common.exception.AuthenticationException;
import com.utec.backend.model.entity.Usuario;
import com.utec.backend.repository.UsuarioRepository;
import com.utec.backend.security.auth.AuthenticationResponse;
import com.utec.backend.security.auth.GoogleUserInfo;
import com.utec.backend.security.jwt.JwtService;
import com.utec.backend.security.service.CustomUserDetailsService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.security.GeneralSecurityException;
import java.util.Collections;

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

    @Value("${frontend.url}")
    private String frontendUrl;

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

            // Generar tokens JWT
            UserDetails userDetails = userDetailsService.loadUserByUsername(usuario.getEmail());
            String token = jwtService.generateToken(userDetails);
            String refreshToken = jwtService.generateRefreshToken(userDetails);

            log.info("Usuario autenticado exitosamente con Google OAuth: {}", usuario.getEmail());

            return new AuthenticationResponse(
                token,
                refreshToken,
                usuario.getEmail(),
                usuario.getNombre(),
                usuario.getRolApp().name(),
                jwtService.getExpirationTime()
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
        String redirectUri = frontendUrl + "/auth/callback/google";
        
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
                Usuario nuevoUsuario = new Usuario();
                nuevoUsuario.setEmail(googleUser.getEmail());
                nuevoUsuario.setNombre(googleUser.getNombre());
                nuevoUsuario.setPassword(null); // OAuth no usa contraseña
                nuevoUsuario.setOauthProv("GOOGLE");
                nuevoUsuario.setRolApp(Usuario.RolApp.EXTERNO); // Rol por defecto
                nuevoUsuario.setVerificado(true); // Google ya verificó el email
                
                return usuarioRepository.save(nuevoUsuario);
            });
    }
}

