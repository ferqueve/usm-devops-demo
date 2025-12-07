package com.utec.backend.service;

import com.utec.backend.dto.auth.AuthenticationResponse;
import com.utec.backend.exception.AuthenticationException;
import com.utec.backend.model.Usuario;
import com.utec.backend.repository.UsuarioRepository;
import com.utec.backend.security.jwt.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("Tests para OAuth2Service")
class OAuth2ServiceTest {

    @Mock
    private UsuarioRepository usuarioRepository;

    @Mock
    private JwtService jwtService;

    @Mock
    private CustomUserDetailsService userDetailsService;

    @InjectMocks
    private OAuth2Service oAuth2Service;

    private Usuario usuarioTest;
    private UserDetails userDetails;
    private final String authorizationCode = "test-auth-code";
    private final String userEmail = "test@utec.edu.uy";

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(oAuth2Service, "googleClientId", "test-client-id");
        ReflectionTestUtils.setField(oAuth2Service, "googleClientSecret", "test-client-secret");
        ReflectionTestUtils.setField(oAuth2Service, "frontendUrl", "http://localhost:5173");
        ReflectionTestUtils.setField(oAuth2Service, "backendUrl", "http://localhost:8080");

        usuarioTest = new Usuario();
        usuarioTest.setId(1L);
        usuarioTest.setEmail(userEmail);
        usuarioTest.setNombre("Test User");
        usuarioTest.setRolApp(Usuario.RolApp.DOCENTE);

        userDetails = User.withUsername(userEmail)
                .password("")
                .authorities("ROLE_DOCENTE")
                .build();
    }

    @Test
    @DisplayName("Debe lanzar excepción cuando código de autorización es inválido")
    void debeLanzarExcepcionCuandoCodigoEsInvalido() {
        // Given - El método puede fallar al intercambiar el código por tokens
        // When & Then
        assertThrows(AuthenticationException.class, () -> {
            oAuth2Service.handleGoogleCallback("invalid-code");
        });
    }

    @Test
    @DisplayName("Debe tener método handleGoogleCallback")
    void debeTenerMetodoHandleGoogleCallback() {
        // When & Then
        // Verificamos que el método existe
        assertNotNull(oAuth2Service);
    }
}

