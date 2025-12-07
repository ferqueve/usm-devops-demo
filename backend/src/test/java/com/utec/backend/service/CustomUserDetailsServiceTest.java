package com.utec.backend.service;

import com.utec.backend.model.Usuario;
import com.utec.backend.repository.UsuarioRepository;
import com.utec.backend.security.Permission;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;

import java.util.Optional;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("Tests para CustomUserDetailsService")
class CustomUserDetailsServiceTest {

    @Mock
    private UsuarioRepository usuarioRepository;

    @Mock
    private PermissionService permissionService;

    @InjectMocks
    private CustomUserDetailsService userDetailsService;

    private Usuario usuarioTest;
    private final String userEmail = "test@utec.edu.uy";

    @BeforeEach
    void setUp() {
        usuarioTest = new Usuario();
        usuarioTest.setId(1L);
        usuarioTest.setEmail(userEmail);
        usuarioTest.setNombre("Test User");
        usuarioTest.setPassword("encoded-password");
        usuarioTest.setRolApp(Usuario.RolApp.DOCENTE);
    }

    @Test
    @DisplayName("Debe cargar usuario por email")
    void debeCargarUsuarioPorEmail() {
        // Given
        Set<Permission> permissions = Set.of(Permission.RESERVA_SOLICITAR, Permission.RESERVA_VER_TODAS);
        when(usuarioRepository.findByEmail(userEmail)).thenReturn(Optional.of(usuarioTest));
        when(permissionService.getPermissionsForRole(Usuario.RolApp.DOCENTE)).thenReturn(permissions);

        // When
        UserDetails userDetails = userDetailsService.loadUserByUsername(userEmail);

        // Then
        assertNotNull(userDetails);
        assertEquals(userEmail, userDetails.getUsername());
        assertTrue(userDetails.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_DOCENTE")));
        verify(usuarioRepository).findByEmail(userEmail);
        verify(permissionService).getPermissionsForRole(Usuario.RolApp.DOCENTE);
    }

    @Test
    @DisplayName("Debe manejar usuario OAuth sin contraseña")
    void debeManejarUsuarioOAuthSinContrasena() {
        // Given
        usuarioTest.setPassword(null);
        Set<Permission> permissions = Set.of(Permission.RESERVA_SOLICITAR);
        when(usuarioRepository.findByEmail(userEmail)).thenReturn(Optional.of(usuarioTest));
        when(permissionService.getPermissionsForRole(Usuario.RolApp.DOCENTE)).thenReturn(permissions);

        // When
        UserDetails userDetails = userDetailsService.loadUserByUsername(userEmail);

        // Then
        assertNotNull(userDetails);
        assertEquals("", userDetails.getPassword()); // OAuth users have empty password
    }

    @Test
    @DisplayName("Debe lanzar excepción cuando usuario no existe")
    void debeLanzarExcepcionCuandoUsuarioNoExiste() {
        // Given
        when(usuarioRepository.findByEmail(userEmail)).thenReturn(Optional.empty());

        // When & Then
        UsernameNotFoundException exception = assertThrows(UsernameNotFoundException.class, () -> {
            userDetailsService.loadUserByUsername(userEmail);
        });

        assertTrue(exception.getMessage().contains("no encontrado"));
        verify(permissionService, never()).getPermissionsForRole(any());
    }

    @Test
    @DisplayName("Debe incluir permisos en las autoridades")
    void debeIncluirPermisosEnLasAutoridades() {
        // Given
        Set<Permission> permissions = Set.of(Permission.RESERVA_SOLICITAR, Permission.RESERVA_VER_TODAS);
        when(usuarioRepository.findByEmail(userEmail)).thenReturn(Optional.of(usuarioTest));
        when(permissionService.getPermissionsForRole(Usuario.RolApp.DOCENTE)).thenReturn(permissions);

        // When
        UserDetails userDetails = userDetailsService.loadUserByUsername(userEmail);

        // Then
        assertNotNull(userDetails);
        assertTrue(userDetails.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().startsWith("PERMISSION_")));
    }
}

