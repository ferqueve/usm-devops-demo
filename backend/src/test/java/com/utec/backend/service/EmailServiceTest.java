package com.utec.backend.service;

import com.utec.backend.dto.reserva.ReservaResponseDto;
import com.utec.backend.model.Usuario;
import com.utec.backend.repository.UsuarioRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.mockito.Mockito.lenient;

@ExtendWith(MockitoExtension.class)
@DisplayName("Tests para EmailService")
class EmailServiceTest {

    @Mock
    private GmailApiService gmailApiService;

    @Mock
    private UsuarioRepository usuarioRepository;

    @Mock
    private UsuarioConfiguracionService configuracionService;

    @Mock
    private EmailTemplateService emailTemplateService;

    @InjectMocks
    private EmailService emailService;

    private Usuario usuarioTest;
    private final String userEmail = "test@utec.edu.uy";

    @BeforeEach
    void setUp() {
        usuarioTest = new Usuario();
        usuarioTest.setId(1L);
        usuarioTest.setEmail(userEmail);
        usuarioTest.setNombre("Test User");
        usuarioTest.setVerificado(false);

        // Configurar propiedades para los tests
        org.springframework.test.util.ReflectionTestUtils.setField(emailService, "appTimezone", "America/Montevideo");
        org.springframework.test.util.ReflectionTestUtils.setField(emailService, "frontendUrl",
                "http://localhost:5173");
        org.springframework.test.util.ReflectionTestUtils.setField(emailService, "backendUrl",
                "http://localhost:8080");

        // Configurar mocks lenient para EmailTemplateService
        lenient().when(emailTemplateService.loadTemplate(anyString(), anyMap())).thenReturn("<html>Test</html>");
        lenient().when(emailTemplateService.wrapInBaseTemplate(anyString(), anyString(), anyString()))
                .thenReturn("<html>Wrapped Test</html>");
    }

    @Test
    @DisplayName("Debe verificar configuración de email")
    void debeVerificarConfiguracionEmail() {
        // Given
        when(gmailApiService.verificarConfiguracionGmailApi(userEmail)).thenReturn(true);

        // When
        boolean resultado = emailService.verificarConfiguracionEmail(userEmail);

        // Then
        assertTrue(resultado);
        verify(gmailApiService).verificarConfiguracionGmailApi(userEmail);
    }

    @Test
    @DisplayName("Debe verificar email de usuario")
    void debeVerificarEmailUsuario() {
        // Given
        when(usuarioRepository.findByEmail(userEmail)).thenReturn(Optional.of(usuarioTest));
        when(usuarioRepository.save(any(Usuario.class))).thenReturn(usuarioTest);

        // When
        boolean resultado = emailService.verificarEmailUsuario(userEmail);

        // Then
        assertTrue(resultado);
        verify(usuarioRepository).findByEmail(userEmail);
        verify(usuarioRepository).save(usuarioTest);
    }

    @Test
    @DisplayName("Debe retornar false cuando usuario no existe al verificar email")
    void debeRetornarFalseCuandoUsuarioNoExiste() {
        // Given
        when(usuarioRepository.findByEmail(userEmail)).thenReturn(Optional.empty());

        // When
        boolean resultado = emailService.verificarEmailUsuario(userEmail);

        // Then
        assertFalse(resultado);
        verify(usuarioRepository).findByEmail(userEmail);
        verify(usuarioRepository, never()).save(any(Usuario.class));
    }

    @Test
    @DisplayName("Debe enviar email de verificación")
    void debeEnviarEmailVerificacion() {
        // Given
        String token = "test-token";
        when(configuracionService.debeEnviarEmail(userEmail, "verificacion")).thenReturn(true);
        when(gmailApiService.sendHtmlEmail(anyString(), anyString(), anyString())).thenReturn(true);

        // When
        boolean resultado = emailService.enviarEmailVerificacion(userEmail, token);

        // Then
        assertTrue(resultado);
        verify(configuracionService).debeEnviarEmail(userEmail, "verificacion");
        verify(gmailApiService).sendHtmlEmail(anyString(), anyString(), anyString());
    }

    @Test
    @DisplayName("Debe no enviar email si el usuario no lo permite")
    void debeNoEnviarEmailSiUsuarioNoLoPermite() {
        // Given
        String token = "test-token";
        when(configuracionService.debeEnviarEmail(userEmail, "verificacion")).thenReturn(false);

        // When
        boolean resultado = emailService.enviarEmailVerificacion(userEmail, token);

        // Then
        assertFalse(resultado);
        verify(gmailApiService, never()).sendHtmlEmail(anyString(), anyString(), anyString());
    }

    @Test
    @DisplayName("Debe enviar email de restablecimiento de contraseña")
    void debeEnviarEmailRestablecimientoPassword() {
        // Given
        String nuevaPassword = "temp-password";
        when(configuracionService.debeEnviarEmail(userEmail, "restablecimientoPassword")).thenReturn(true);
        when(gmailApiService.sendHtmlEmail(anyString(), anyString(), anyString())).thenReturn(true);

        // When
        boolean resultado = emailService.enviarEmailRestablecimientoPassword(userEmail, nuevaPassword);

        // Then
        assertTrue(resultado);
        verify(gmailApiService).sendHtmlEmail(anyString(), anyString(), anyString());
    }

    @Test
    @DisplayName("Debe enviar email de notificación de nueva solicitud")
    void debeEnviarEmailNotificacionNuevaSolicitud() {
        // Given
        ReservaResponseDto reserva = new ReservaResponseDto();
        reserva.setId(1L);
        reserva.setEspacioNombre("Aula 101");
        reserva.setInicio(Instant.now());
        reserva.setFin(Instant.now().plus(2, ChronoUnit.HOURS));
        reserva.setUsuarioNombre("Test User");

        when(configuracionService.debeEnviarEmail(userEmail, "nuevaSolicitudReserva")).thenReturn(true);
        when(gmailApiService.sendHtmlEmail(anyString(), anyString(), anyString())).thenReturn(true);

        // When
        boolean resultado = emailService.enviarEmailNotificacionNuevaSolicitud(userEmail, reserva);

        // Then
        assertTrue(resultado);
        verify(gmailApiService).sendHtmlEmail(anyString(), anyString(), anyString());
    }

    @Test
    @DisplayName("Debe enviar email de notificación de reserva aprobada")
    void debeEnviarEmailNotificacionReservaAprobada() {
        // Given
        ReservaResponseDto reserva = new ReservaResponseDto();
        reserva.setId(1L);
        reserva.setEspacioNombre("Aula 101");
        reserva.setInicio(Instant.now());
        reserva.setFin(Instant.now().plus(2, ChronoUnit.HOURS));
        reserva.setUsuarioNombre("Test User");

        when(configuracionService.debeEnviarEmail(userEmail, "reservaAprobada")).thenReturn(true);
        when(gmailApiService.sendHtmlEmail(anyString(), anyString(), anyString())).thenReturn(true);

        // When
        boolean resultado = emailService.enviarEmailNotificacionReservaAprobada(userEmail, reserva);

        // Then
        assertTrue(resultado);
        verify(gmailApiService).sendHtmlEmail(anyString(), anyString(), anyString());
    }

    @Test
    @DisplayName("Debe enviar email de recordatorio de reserva")
    void debeEnviarEmailRecordatorioReserva() {
        // Given
        ReservaResponseDto reserva = new ReservaResponseDto();
        reserva.setId(1L);
        reserva.setEspacioNombre("Aula 101");
        reserva.setInicio(Instant.now().plus(2, ChronoUnit.HOURS));
        reserva.setFin(Instant.now().plus(4, ChronoUnit.HOURS));
        reserva.setUsuarioNombre("Test User");

        when(configuracionService.debeEnviarEmail(userEmail, "recordatorioReserva")).thenReturn(true);
        when(gmailApiService.sendHtmlEmail(anyString(), anyString(), anyString())).thenReturn(true);

        // When
        boolean resultado = emailService.enviarEmailRecordatorioReserva(userEmail, reserva, 2);

        // Then
        assertTrue(resultado);
        verify(gmailApiService).sendHtmlEmail(anyString(), anyString(), anyString());
    }
}
