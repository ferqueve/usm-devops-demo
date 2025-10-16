package com.utec.backend.service;

import com.utec.backend.exception.AuthenticationException;
import com.utec.backend.exception.UsuarioNotFoundException;
import com.utec.backend.dto.usuario.CambioRolDto;
import com.utec.backend.dto.usuario.UsuarioResponseDto;
import com.utec.backend.dto.usuario.UsuarioUpdateDto;
import com.utec.backend.model.Usuario;
import com.utec.backend.repository.UsuarioRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("Tests para UsuarioService")
class UsuarioServiceTest {

    @Mock
    private UsuarioRepository usuarioRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private UsuarioService usuarioService;

    private Usuario usuarioTest;
    private final String testEmail = "test@utec.edu.uy";
    private final String testNombre = "Juan Pérez";

    @BeforeEach
    void setUp() {
        usuarioTest = new Usuario();
        usuarioTest.setId(1L);
        usuarioTest.setEmail(testEmail);
        usuarioTest.setNombre(testNombre);
        usuarioTest.setPassword("encodedPassword");
        usuarioTest.setRolApp(Usuario.RolApp.EXTERNO);
        usuarioTest.setVerificado(true);
    }

    @Test
    @DisplayName("Debe registrar un nuevo usuario exitosamente")
    void debeRegistrarUsuarioExitosamente() {
        // Given
        Usuario nuevoUsuario = new Usuario();
        nuevoUsuario.setEmail("nuevo@utec.edu.uy");
        nuevoUsuario.setPassword("password123");
        nuevoUsuario.setNombre("Nuevo Usuario");
        nuevoUsuario.setRolApp(Usuario.RolApp.EXTERNO);

        when(usuarioRepository.existsByEmail(anyString())).thenReturn(false);
        when(passwordEncoder.encode(anyString())).thenReturn("encodedPassword");
        when(usuarioRepository.save(any(Usuario.class))).thenReturn(nuevoUsuario);

        // When
        UsuarioResponseDto resultado = usuarioService.registrarUsuario(nuevoUsuario);

        // Then
        assertNotNull(resultado);
        assertEquals("nuevo@utec.edu.uy", resultado.getEmail());
        verify(usuarioRepository).existsByEmail("nuevo@utec.edu.uy");
        verify(passwordEncoder).encode("password123");
        verify(usuarioRepository).save(any(Usuario.class));
    }

    @Test
    @DisplayName("Debe lanzar excepción al registrar usuario con email duplicado")
    void debeLanzarExcepcionEmailDuplicado() {
        // Given
        when(usuarioRepository.existsByEmail(testEmail)).thenReturn(true);

        Usuario nuevoUsuario = new Usuario();
        nuevoUsuario.setEmail(testEmail);

        // When & Then
        assertThrows(AuthenticationException.class, () -> {
            usuarioService.registrarUsuario(nuevoUsuario);
        });

        verify(usuarioRepository).existsByEmail(testEmail);
        verify(usuarioRepository, never()).save(any(Usuario.class));
    }

    @Test
    @DisplayName("Debe obtener el perfil del usuario por email")
    void debeObtenerPerfilPropio() {
        // Given
        when(usuarioRepository.findByEmail(testEmail)).thenReturn(Optional.of(usuarioTest));

        // When
        UsuarioResponseDto resultado = usuarioService.obtenerPerfilPropio(testEmail);

        // Then
        assertNotNull(resultado);
        assertEquals(testEmail, resultado.getEmail());
        assertEquals(testNombre, resultado.getNombre());
        assertEquals(Usuario.RolApp.EXTERNO, resultado.getRolApp());
        verify(usuarioRepository).findByEmail(testEmail);
    }

    @Test
    @DisplayName("Debe lanzar excepción cuando el usuario no existe al obtener perfil")
    void debeLanzarExcepcionUsuarioNoExisteAlObtenerPerfil() {
        // Given
        when(usuarioRepository.findByEmail(testEmail)).thenReturn(Optional.empty());

        // When & Then
        assertThrows(UsuarioNotFoundException.class, () -> {
            usuarioService.obtenerPerfilPropio(testEmail);
        });

        verify(usuarioRepository).findByEmail(testEmail);
    }

    @Test
    @DisplayName("Debe actualizar el perfil del usuario correctamente")
    void debeActualizarPerfilCorrectamente() {
        // Given
        UsuarioUpdateDto updateDto = new UsuarioUpdateDto();
        updateDto.setNombre("Juan Carlos Pérez");
        updateDto.setPassword("newPassword123");

        when(usuarioRepository.findByEmail(testEmail)).thenReturn(Optional.of(usuarioTest));
        when(passwordEncoder.encode("newPassword123")).thenReturn("newEncodedPassword");
        when(usuarioRepository.save(any(Usuario.class))).thenReturn(usuarioTest);

        // When
        UsuarioResponseDto resultado = usuarioService.actualizarPerfil(testEmail, updateDto);

        // Then
        assertNotNull(resultado);
        verify(usuarioRepository).findByEmail(testEmail);
        verify(passwordEncoder).encode("newPassword123");
        verify(usuarioRepository).save(usuarioTest);
    }

    @Test
    @DisplayName("Debe actualizar solo el nombre si no se proporciona contraseña")
    void debeActualizarSoloNombre() {
        // Given
        UsuarioUpdateDto updateDto = new UsuarioUpdateDto();
        updateDto.setNombre("Juan Carlos Pérez");

        when(usuarioRepository.findByEmail(testEmail)).thenReturn(Optional.of(usuarioTest));
        when(usuarioRepository.save(any(Usuario.class))).thenReturn(usuarioTest);

        // When
        UsuarioResponseDto resultado = usuarioService.actualizarPerfil(testEmail, updateDto);

        // Then
        assertNotNull(resultado);
        verify(usuarioRepository).findByEmail(testEmail);
        verify(passwordEncoder, never()).encode(anyString());
        verify(usuarioRepository).save(usuarioTest);
    }

    @Test
    @DisplayName("Debe listar todos los usuarios")
    void debeListarTodosLosUsuarios() {
        // Given
        Usuario usuario2 = new Usuario();
        usuario2.setId(2L);
        usuario2.setEmail("otro@utec.edu.uy");
        usuario2.setNombre("Otro Usuario");
        usuario2.setRolApp(Usuario.RolApp.DOCENTE);

        when(usuarioRepository.findAll()).thenReturn(Arrays.asList(usuarioTest, usuario2));

        // When
        List<UsuarioResponseDto> resultado = usuarioService.listarTodosLosUsuarios();

        // Then
        assertNotNull(resultado);
        assertEquals(2, resultado.size());
        assertEquals(testEmail, resultado.get(0).getEmail());
        assertEquals("otro@utec.edu.uy", resultado.get(1).getEmail());
        verify(usuarioRepository).findAll();
    }

    @Test
    @DisplayName("Debe obtener usuario por ID")
    void debeObtenerUsuarioPorId() {
        // Given
        Long usuarioId = 1L;
        when(usuarioRepository.findById(usuarioId)).thenReturn(Optional.of(usuarioTest));

        // When
        UsuarioResponseDto resultado = usuarioService.obtenerUsuarioPorId(usuarioId);

        // Then
        assertNotNull(resultado);
        assertEquals(usuarioId, resultado.getId());
        assertEquals(testEmail, resultado.getEmail());
        verify(usuarioRepository).findById(usuarioId);
    }

    @Test
    @DisplayName("Debe lanzar excepción cuando el usuario no existe por ID")
    void debeLanzarExcepcionUsuarioNoExistePorId() {
        // Given
        Long usuarioId = 999L;
        when(usuarioRepository.findById(usuarioId)).thenReturn(Optional.empty());

        // When & Then
        assertThrows(UsuarioNotFoundException.class, () -> {
            usuarioService.obtenerUsuarioPorId(usuarioId);
        });

        verify(usuarioRepository).findById(usuarioId);
    }

    @Test
    @DisplayName("Debe cambiar el rol del usuario correctamente")
    void debeCambiarRolUsuario() {
        // Given
        Long usuarioId = 1L;
        CambioRolDto cambioRolDto = new CambioRolDto();
        cambioRolDto.setRolApp(Usuario.RolApp.ADMIN);

        when(usuarioRepository.findById(usuarioId)).thenReturn(Optional.of(usuarioTest));
        when(usuarioRepository.save(any(Usuario.class))).thenReturn(usuarioTest);

        // When
        usuarioService.cambiarRolUsuario(usuarioId, cambioRolDto);

        // Then
        verify(usuarioRepository).findById(usuarioId);
        verify(usuarioRepository).save(usuarioTest);
        assertEquals(Usuario.RolApp.ADMIN, usuarioTest.getRolApp());
    }

    @Test
    @DisplayName("Debe lanzar excepción al cambiar rol de usuario inexistente")
    void debeLanzarExcepcionAlCambiarRolUsuarioInexistente() {
        // Given
        Long usuarioId = 999L;
        CambioRolDto cambioRolDto = new CambioRolDto();
        cambioRolDto.setRolApp(Usuario.RolApp.ADMIN);

        when(usuarioRepository.findById(usuarioId)).thenReturn(Optional.empty());

        // When & Then
        assertThrows(UsuarioNotFoundException.class, () -> {
            usuarioService.cambiarRolUsuario(usuarioId, cambioRolDto);
        });

        verify(usuarioRepository).findById(usuarioId);
        verify(usuarioRepository, never()).save(any(Usuario.class));
    }
}

