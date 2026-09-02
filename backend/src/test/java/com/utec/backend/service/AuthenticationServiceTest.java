package com.utec.backend.service;

import com.utec.backend.exception.AuthenticationException;
import com.utec.backend.model.Usuario;
import com.utec.backend.repository.UsuarioRepository;
import com.utec.backend.dto.auth.AuthenticationRequest;
import com.utec.backend.dto.auth.AuthenticationResponse;
import com.utec.backend.dto.auth.RegisterRequest;
import com.utec.backend.dto.auth.RegisterResponse;
import com.utec.backend.security.jwt.JwtService;
import com.utec.backend.security.jwt.TokenBlacklistService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.ArrayList;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("Tests para AuthenticationService")
class AuthenticationServiceTest {

    @Mock
    private AuthenticationManager authenticationManager;

    @Mock
    private JwtService jwtService;

    @Mock
    private TokenBlacklistService tokenBlacklistService;

    @Mock
    private UsuarioRepository usuarioRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private CustomUserDetailsService userDetailsService;

    @Mock
    private EmailService emailService;

    @Mock
    private AuditService auditService;

    @InjectMocks
    private AuthService authenticationService;

    private Usuario usuarioTest;
    private UserDetails userDetails;
    private final String testEmail = "test@utec.edu.uy";
    private final String testPassword = "password123";

    @BeforeEach
    void setUp() {
        usuarioTest = new Usuario();
        usuarioTest.setId(1L);
        usuarioTest.setEmail(testEmail);
        usuarioTest.setNombre("Juan Pérez");
        usuarioTest.setPassword("encodedPassword");
        usuarioTest.setRolApp(Usuario.RolApp.EXTERNO);
        usuarioTest.setVerificado(true);

        userDetails = User.builder()
                .username(testEmail)
                .password("encodedPassword")
                .authorities(new ArrayList<>())
                .build();
    }

    @Test
    @DisplayName("Debe autenticar usuario exitosamente")
    void debeAutenticarUsuarioExitosamente() {
        // Given
        AuthenticationRequest request = new AuthenticationRequest(testEmail, testPassword);

        when(usuarioRepository.findByEmail(testEmail)).thenReturn(Optional.of(usuarioTest));
        when(userDetailsService.loadUserByUsername(testEmail)).thenReturn(userDetails);
        when(jwtService.generateToken(userDetails)).thenReturn("accessToken");
        when(jwtService.generateRefreshToken(userDetails)).thenReturn("refreshToken");
        when(jwtService.getExpirationTime()).thenReturn(3600000L);

        // When
        AuthenticationResponse response = authenticationService.authenticate(request);

        // Then
        assertNotNull(response);
        assertEquals("accessToken", response.getToken());
        assertEquals("refreshToken", response.getRefreshToken());
        assertEquals(testEmail, response.getEmail());
        assertEquals("Juan Pérez", response.getNombre());

        verify(authenticationManager).authenticate(any(UsernamePasswordAuthenticationToken.class));
        verify(usuarioRepository).findByEmail(testEmail);
        verify(jwtService).generateToken(userDetails);
        verify(jwtService).generateRefreshToken(userDetails);
    }

    @Test
    @DisplayName("Debe lanzar excepción cuando el usuario no está verificado")
    void debeLanzarExcepcionUsuarioNoVerificado() {
        // Given
        usuarioTest.setVerificado(false);
        AuthenticationRequest request = new AuthenticationRequest(testEmail, testPassword);

        when(usuarioRepository.findByEmail(testEmail)).thenReturn(Optional.of(usuarioTest));

        // When & Then
        assertThrows(AuthenticationException.class, () -> {
            authenticationService.authenticate(request);
        });

        verify(authenticationManager).authenticate(any(UsernamePasswordAuthenticationToken.class));
        verify(usuarioRepository).findByEmail(testEmail);
        verify(jwtService, never()).generateToken(any());
    }

    @Test
    @DisplayName("Debe lanzar excepción con credenciales inválidas")
    void debeLanzarExcepcionCredencialesInvalidas() {
        // Given
        AuthenticationRequest request = new AuthenticationRequest(testEmail, "wrongPassword");

        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenThrow(new BadCredentialsException("Credenciales inválidas"));

        // When & Then
        assertThrows(AuthenticationException.class, () -> {
            authenticationService.authenticate(request);
        });

        verify(authenticationManager).authenticate(any(UsernamePasswordAuthenticationToken.class));
        verify(usuarioRepository).findByEmail(testEmail);
    }

    @Test
    @DisplayName("Debe registrar usuario exitosamente")
    void debeRegistrarUsuarioExitosamente() {
        // Given
        RegisterRequest request = new RegisterRequest();
        request.setNombre("Juan");
        request.setApellido("Pérez");
        request.setEmail("nuevo@utec.edu.uy");
        request.setPassword(testPassword);
        request.setConfirmPassword(testPassword);
        request.setAceptaTerminos(true);
        request.setAceptaPolitica(true);

        Usuario nuevoUsuario = new Usuario();
        nuevoUsuario.setId(2L);
        nuevoUsuario.setEmail("nuevo@utec.edu.uy");
        nuevoUsuario.setNombre("Juan Pérez");
        // El registro audita el rol del usuario guardado: sin esto el stub devuelve null.
        nuevoUsuario.setRolApp(Usuario.RolApp.ESTUDIANTE);

        when(usuarioRepository.findByEmail("nuevo@utec.edu.uy")).thenReturn(Optional.empty());
        when(passwordEncoder.encode(testPassword)).thenReturn("encodedPassword");
        when(usuarioRepository.save(any(Usuario.class))).thenReturn(nuevoUsuario);
        when(jwtService.generateVerificationToken(anyString())).thenReturn("verificationToken");
        when(emailService.enviarEmailVerificacion(anyString(), anyString())).thenReturn(true);

        // When
        RegisterResponse response = authenticationService.register(request);

        // Then
        assertNotNull(response);
        assertEquals("nuevo@utec.edu.uy", response.getEmail());
        assertEquals("Juan Pérez", response.getNombre());

        verify(usuarioRepository).findByEmail("nuevo@utec.edu.uy");
        verify(passwordEncoder).encode(testPassword);
        verify(usuarioRepository).save(any(Usuario.class));
        verify(emailService).enviarEmailVerificacion(eq("nuevo@utec.edu.uy"), anyString());
    }

    @Test
    @DisplayName("Debe lanzar excepción cuando las contraseñas no coinciden")
    void debeLanzarExcepcionContraseniasNoCoinciden() {
        // Given
        RegisterRequest request = new RegisterRequest();
        request.setNombre("Juan");
        request.setApellido("Pérez");
        request.setEmail("nuevo@utec.edu.uy");
        request.setPassword("password123");
        request.setConfirmPassword("password456");

        // When & Then
        assertThrows(AuthenticationException.class, () -> {
            authenticationService.register(request);
        });

        verify(usuarioRepository, never()).save(any(Usuario.class));
    }

    @Test
    @DisplayName("Debe lanzar excepción cuando el email ya existe")
    void debeLanzarExcepcionEmailYaExiste() {
        // Given
        RegisterRequest request = new RegisterRequest();
        request.setNombre("Juan");
        request.setApellido("Pérez");
        request.setEmail(testEmail);
        request.setPassword(testPassword);
        request.setConfirmPassword(testPassword);
        request.setAceptaTerminos(true);
        request.setAceptaPolitica(true);

        when(usuarioRepository.findByEmail(testEmail)).thenReturn(Optional.of(usuarioTest));

        // When & Then
        assertThrows(AuthenticationException.class, () -> {
            authenticationService.register(request);
        });

        verify(usuarioRepository).findByEmail(testEmail);
        verify(usuarioRepository, never()).save(any(Usuario.class));
    }

    @Test
    @DisplayName("Debe hacer logout correctamente agregando token a blacklist")
    void debeHacerLogoutCorrectamente() {
        // Given
        String authHeader = "Bearer token123";

        // When
        authenticationService.logout(authHeader);

        // Then
        verify(tokenBlacklistService).blacklistToken("token123");
    }

    @Test
    @DisplayName("Debe verificar token válido correctamente")
    void debeVerificarTokenValido() {
        // Given
        String authHeader = "Bearer validToken";

        when(tokenBlacklistService.isTokenBlacklisted("validToken")).thenReturn(false);
        when(jwtService.isTokenValid("validToken")).thenReturn(true);

        // When
        boolean isValid = authenticationService.verifyToken(authHeader);

        // Then
        assertTrue(isValid);
        verify(tokenBlacklistService).isTokenBlacklisted("validToken");
        verify(jwtService).isTokenValid("validToken");
    }

    @Test
    @DisplayName("Debe rechazar token en blacklist")
    void debeRechazarTokenEnBlacklist() {
        // Given
        String authHeader = "Bearer blacklistedToken";

        when(tokenBlacklistService.isTokenBlacklisted("blacklistedToken")).thenReturn(true);

        // When
        boolean isValid = authenticationService.verifyToken(authHeader);

        // Then
        assertFalse(isValid);
        verify(tokenBlacklistService).isTokenBlacklisted("blacklistedToken");
        verify(jwtService, never()).isTokenValid(anyString());
    }

    @Test
    @DisplayName("Debe refrescar token exitosamente")
    void debeRefrescarTokenExitosamente() {
        // Given
        String refreshToken = "validRefreshToken";

        when(jwtService.extractUsername(refreshToken)).thenReturn(testEmail);
        when(jwtService.isTokenValid(refreshToken)).thenReturn(true);
        when(userDetailsService.loadUserByUsername(testEmail)).thenReturn(userDetails);
        when(usuarioRepository.findByEmail(testEmail)).thenReturn(Optional.of(usuarioTest));
        when(jwtService.generateToken(userDetails)).thenReturn("newAccessToken");
        when(jwtService.generateRefreshToken(userDetails)).thenReturn("newRefreshToken");
        when(jwtService.getExpirationTime()).thenReturn(3600000L);

        // When
        AuthenticationResponse response = authenticationService.refreshToken(refreshToken);

        // Then
        assertNotNull(response);
        assertEquals("newAccessToken", response.getToken());
        assertEquals("newRefreshToken", response.getRefreshToken());
        assertEquals(testEmail, response.getEmail());

        verify(jwtService).extractUsername(refreshToken);
        verify(jwtService).isTokenValid(refreshToken);
        verify(jwtService).generateToken(userDetails);
    }

    @Test
    @DisplayName("Debe verificar email exitosamente")
    void debeVerificarEmailExitosamente() {
        // Given
        String verificationToken = "validVerificationToken";
        usuarioTest.setVerificado(false);

        when(jwtService.extractUsernameFromVerificationToken(verificationToken)).thenReturn(testEmail);
        when(usuarioRepository.findByEmail(testEmail)).thenReturn(Optional.of(usuarioTest));
        when(usuarioRepository.save(any(Usuario.class))).thenReturn(usuarioTest);

        // When
        boolean resultado = authenticationService.verifyEmail(verificationToken);

        // Then
        assertTrue(resultado);
        verify(jwtService).extractUsernameFromVerificationToken(verificationToken);
        verify(usuarioRepository).findByEmail(testEmail);
        verify(usuarioRepository).save(usuarioTest);
        assertTrue(usuarioTest.getVerificado());
    }

    @Test
    @DisplayName("Debe reenviar email de verificación exitosamente")
    void debeReenviarEmailVerificacionExitosamente() {
        // Given
        usuarioTest.setVerificado(false);

        when(usuarioRepository.findByEmail(testEmail)).thenReturn(Optional.of(usuarioTest));
        when(jwtService.generateVerificationToken(testEmail)).thenReturn("newVerificationToken");
        when(emailService.enviarEmailVerificacion(testEmail, "newVerificationToken")).thenReturn(true);

        // When
        boolean resultado = authenticationService.resendVerificationEmail(testEmail);

        // Then
        assertTrue(resultado);
        verify(usuarioRepository).findByEmail(testEmail);
        verify(jwtService).generateVerificationToken(testEmail);
        verify(emailService).enviarEmailVerificacion(testEmail, "newVerificationToken");
    }

    @Test
    @DisplayName("No debe reenviar email si el usuario ya está verificado")
    void noDebeReenviarEmailSiYaVerificado() {
        // Given
        usuarioTest.setVerificado(true);

        when(usuarioRepository.findByEmail(testEmail)).thenReturn(Optional.of(usuarioTest));

        // When
        boolean resultado = authenticationService.resendVerificationEmail(testEmail);

        // Then
        assertFalse(resultado);
        verify(usuarioRepository).findByEmail(testEmail);
        verify(emailService, never()).enviarEmailVerificacion(anyString(), anyString());
    }
}
