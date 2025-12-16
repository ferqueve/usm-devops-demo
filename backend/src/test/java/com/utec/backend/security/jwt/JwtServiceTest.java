package com.utec.backend.security.jwt;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

@DisplayName("Tests para JwtService")
class JwtServiceTest {

    private JwtService jwtService;

    private UserDetails userDetails;
    private final String testEmail = "test@utec.edu.uy";
    private final String secretKey = "404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970";
    private final long jwtExpiration = 3600000;
    private final long refreshExpiration = 86400000;

    @BeforeEach
    void setUp() {
        jwtService = new JwtService();
        // Inyectar propiedades manualmente usando ReflectionTestUtils (parte de
        // spring-test) o reflexión pura.
        // Como spring-test está en el classpath, usamos ReflectionTestUtils.
        org.springframework.test.util.ReflectionTestUtils.setField(jwtService, "secretKey", secretKey);
        org.springframework.test.util.ReflectionTestUtils.setField(jwtService, "jwtExpiration", jwtExpiration);
        org.springframework.test.util.ReflectionTestUtils.setField(jwtService, "refreshExpiration", refreshExpiration);

        userDetails = User.builder()
                .username(testEmail)
                .password("password")
                .authorities(new ArrayList<>())
                .build();
    }

    @Test
    @DisplayName("Debe generar un token válido")
    void debeGenerarTokenValido() {
        // When
        String token = jwtService.generateToken(userDetails);

        // Then
        assertNotNull(token);
        assertFalse(token.isEmpty());
        assertTrue(token.split("\\.").length == 3); // JWT tiene 3 partes
    }

    @Test
    @DisplayName("Debe extraer el username del token correctamente")
    void debeExtraerUsernameDelToken() {
        // Given
        String token = jwtService.generateToken(userDetails);

        // When
        String username = jwtService.extractUsername(token);

        // Then
        assertEquals(testEmail, username);
    }

    @Test
    @DisplayName("Debe validar correctamente un token válido")
    void debeValidarTokenValido() {
        // Given
        String token = jwtService.generateToken(userDetails);

        // When
        boolean isValid = jwtService.isTokenValid(token, userDetails);

        // Then
        assertTrue(isValid);
    }

    @Test
    @DisplayName("Debe rechazar un token inválido")
    void debeRechazarTokenInvalido() {
        // Given
        String tokenInvalido = "token.invalido.aqui";

        // When
        boolean isValid = jwtService.isTokenValid(tokenInvalido);

        // Then
        assertFalse(isValid);
    }

    @Test
    @DisplayName("Debe generar un refresh token")
    void debeGenerarRefreshToken() {
        // When
        String refreshToken = jwtService.generateRefreshToken(userDetails);

        // Then
        assertNotNull(refreshToken);
        assertFalse(refreshToken.isEmpty());
        String username = jwtService.extractUsername(refreshToken);
        assertEquals(testEmail, username);
    }

    @Test
    @DisplayName("Debe generar un token de verificación de email")
    void debeGenerarTokenVerificacion() {
        // When
        String verificationToken = jwtService.generateVerificationToken(testEmail);

        // Then
        assertNotNull(verificationToken);
        assertFalse(verificationToken.isEmpty());
    }

    @Test
    @DisplayName("Debe extraer email del token de verificación")
    void debeExtraerEmailDelTokenVerificacion() {
        // Given
        String verificationToken = jwtService.generateVerificationToken(testEmail);

        // When
        String email = jwtService.extractUsernameFromVerificationToken(verificationToken);

        // Then
        assertEquals(testEmail, email);
    }

    @Test
    @DisplayName("Debe validar un token de verificación válido")
    void debeValidarTokenVerificacionValido() {
        // Given
        String verificationToken = jwtService.generateVerificationToken(testEmail);

        // When
        boolean isValid = jwtService.isVerificationTokenValid(verificationToken);

        // Then
        assertTrue(isValid);
    }

    @Test
    @DisplayName("Debe rechazar un token de verificación inválido")
    void debeRechazarTokenVerificacionInvalido() {
        // Given
        String tokenInvalido = "token.invalido.aqui";

        // When
        boolean isValid = jwtService.isVerificationTokenValid(tokenInvalido);

        // Then
        assertFalse(isValid);
    }

    @Test
    @DisplayName("Debe retornar el tiempo de expiración del token")
    void debeRetornarTiempoExpiracion() {
        // When
        long expirationTime = jwtService.getExpirationTime();

        // Then
        assertTrue(expirationTime > 0);
        assertEquals(3600000L, expirationTime); // 1 hora en milisegundos
    }

    @Test
    @DisplayName("Debe retornar el tiempo de expiración del refresh token")
    void debeRetornarTiempoExpiracionRefreshToken() {
        // When
        long refreshExpirationTime = jwtService.getRefreshExpirationTime();

        // Then
        assertTrue(refreshExpirationTime > 0);
        assertEquals(86400000L, refreshExpirationTime); // 24 horas en milisegundos
    }

    @Test
    @DisplayName("Debe generar tokens diferentes para el mismo usuario")
    void debeGenerarTokensDiferentes() throws InterruptedException {
        // When
        String token1 = jwtService.generateToken(userDetails);
        Thread.sleep(1000); // Esperar 1 segundo para que cambie el timestamp
        String token2 = jwtService.generateToken(userDetails);

        // Then
        assertNotEquals(token1, token2); // Los tokens deben ser diferentes por timestamp
    }

    @Test
    @DisplayName("Debe incluir claims adicionales en el token")
    void debeIncluirClaimsAdicionales() {
        // Given
        Map<String, Object> extraClaims = new HashMap<>();
        extraClaims.put("rol", "ADMIN");
        extraClaims.put("departamento", "TI");

        // When
        String token = jwtService.generateToken(extraClaims, userDetails);

        // Then
        assertNotNull(token);
        String username = jwtService.extractUsername(token);
        assertEquals(testEmail, username);
    }
}
