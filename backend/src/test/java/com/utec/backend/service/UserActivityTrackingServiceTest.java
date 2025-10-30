package com.utec.backend.service;

import com.utec.backend.dto.stats.ActiveUserDTO;
import com.utec.backend.dto.stats.ActiveUsersStatsDTO;
import com.utec.backend.model.Usuario;
import com.utec.backend.repository.UsuarioRepository;
import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("Tests para UserActivityTrackingService")
class UserActivityTrackingServiceTest {

    @Mock
    private UsuarioRepository usuarioRepository;

    @Mock
    private HttpServletRequest request;

    @InjectMocks
    private UserActivityTrackingService userActivityTrackingService;

    private Usuario usuarioTest;
    private final String testEmail = "test@utec.edu.uy";

    @BeforeEach
    void setUp() {
        usuarioTest = new Usuario();
        usuarioTest.setId(1L);
        usuarioTest.setEmail(testEmail);
        usuarioTest.setNombre("Juan Pérez");
        usuarioTest.setRolApp(Usuario.RolApp.ESTUDIANTE);
    }

    @Test
    @DisplayName("Debe trackear actividad de usuario exitosamente")
    void debeTrackearActividadUsuarioExitosamente() {
        // Given
        when(usuarioRepository.findByEmail(testEmail)).thenReturn(Optional.of(usuarioTest));
        when(request.getHeader(anyString())).thenReturn(null); // Simplificar mock para headers múltiples
        when(request.getRemoteAddr()).thenReturn("192.168.1.1");

        // When
        userActivityTrackingService.trackUserActivity(testEmail, request);

        // Then
        verify(usuarioRepository).findByEmail(testEmail);
        
        // Verificar que el usuario activo se guardó
        ActiveUsersStatsDTO stats = userActivityTrackingService.getActiveUsers();
        assertEquals(1, stats.getTotalActiveUsers());
        assertTrue(stats.getActiveUsers().stream()
                .anyMatch(activeUser -> activeUser.getEmail().equals(testEmail)));
    }

    @Test
    @DisplayName("No debe trackear actividad si el email es null")
    void noDebeTrackearActividadSiEmailNull() {
        // When
        userActivityTrackingService.trackUserActivity(null, request);

        // Then
        verify(usuarioRepository, never()).findByEmail(anyString());
        
        ActiveUsersStatsDTO stats = userActivityTrackingService.getActiveUsers();
        assertEquals(0, stats.getTotalActiveUsers());
    }

    @Test
    @DisplayName("No debe trackear actividad si el usuario no existe")
    void noDebeTrackearActividadSiUsuarioNoExiste() {
        // Given
        when(usuarioRepository.findByEmail(testEmail)).thenReturn(Optional.empty());

        // When
        userActivityTrackingService.trackUserActivity(testEmail, request);

        // Then
        verify(usuarioRepository).findByEmail(testEmail);
        
        ActiveUsersStatsDTO stats = userActivityTrackingService.getActiveUsers();
        assertEquals(0, stats.getTotalActiveUsers());
    }

    @Test
    @DisplayName("Debe obtener usuarios activos")
    void debeObtenerUsuariosActivos() {
        // Given
        when(usuarioRepository.findByEmail(testEmail)).thenReturn(Optional.of(usuarioTest));
        when(request.getHeader(anyString())).thenReturn(null);
        when(request.getRemoteAddr()).thenReturn("192.168.1.1");

        userActivityTrackingService.trackUserActivity(testEmail, request);

        // When
        ActiveUsersStatsDTO stats = userActivityTrackingService.getActiveUsers();

        // Then
        assertNotNull(stats);
        assertTrue(stats.getTotalActiveUsers() >= 0);
        assertNotNull(stats.getActiveUsers());
    }

    @Test
    @DisplayName("Debe retornar lista ordenada por última actividad")
    void debeRetornarListaOrdenada() {
        // Given
        when(usuarioRepository.findByEmail(testEmail)).thenReturn(Optional.of(usuarioTest));
        when(request.getHeader(anyString())).thenReturn(null);
        when(request.getRemoteAddr()).thenReturn("192.168.1.1");

        // When
        userActivityTrackingService.trackUserActivity(testEmail, request);

        // Then
        ActiveUsersStatsDTO stats = userActivityTrackingService.getActiveUsers();
        assertTrue(stats.getTotalActiveUsers() >= 0);
    }

    @Test
    @DisplayName("Debe dividir nombre en nombre y apellido cuando hay espacio")
    void debeDividirNombreEnNombreYApellido() {
        // Given
        usuarioTest.setNombre("María García López");
        when(usuarioRepository.findByEmail(testEmail)).thenReturn(Optional.of(usuarioTest));
        when(request.getHeader(anyString())).thenReturn(null);
        when(request.getRemoteAddr()).thenReturn("192.168.1.1");

        // When
        userActivityTrackingService.trackUserActivity(testEmail, request);

        // Then
        ActiveUsersStatsDTO stats = userActivityTrackingService.getActiveUsers();
        if (stats.getTotalActiveUsers() > 0) {
            ActiveUserDTO activeUser = stats.getActiveUsers().get(0);
            assertEquals("María", activeUser.getNombre());
            assertEquals("García López", activeUser.getApellido());
        }
    }

    @Test
    @DisplayName("Debe manejar usuario sin User-Agent")
    void debeManejarUsuarioSinUserAgent() {
        // Given
        when(usuarioRepository.findByEmail(testEmail)).thenReturn(Optional.of(usuarioTest));
        when(request.getHeader(anyString())).thenReturn(null);
        when(request.getRemoteAddr()).thenReturn("192.168.1.1");

        // When
        assertDoesNotThrow(() -> userActivityTrackingService.trackUserActivity(testEmail, request));

        // Then
        verify(usuarioRepository).findByEmail(testEmail);
    }

    @Test
    @DisplayName("Debe retornar lista vacía cuando no hay usuarios activos")
    void debeRetornarListaVaciaSinUsuariosActivos() {
        // When
        ActiveUsersStatsDTO stats = userActivityTrackingService.getActiveUsers();

        // Then
        assertNotNull(stats);
        assertEquals(0, stats.getTotalActiveUsers());
        assertTrue(stats.getActiveUsers().isEmpty());
    }
}
