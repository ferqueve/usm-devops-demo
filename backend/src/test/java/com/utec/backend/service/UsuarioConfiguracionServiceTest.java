package com.utec.backend.service;

import com.utec.backend.dto.preferencias.PreferenciasCompletasDto;
import com.utec.backend.dto.preferencias.PreferenciasEmailDto;
import com.utec.backend.dto.preferencias.PreferenciasVistaDto;
import com.utec.backend.model.Usuario;
import com.utec.backend.model.UsuarioConfiguracion;
import com.utec.backend.repository.UsuarioConfiguracionRepository;
import com.utec.backend.repository.UsuarioRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("Tests para UsuarioConfiguracionService")
class UsuarioConfiguracionServiceTest {

    @Mock
    private UsuarioConfiguracionRepository configuracionRepository;

    @Mock
    private UsuarioRepository usuarioRepository;

    @InjectMocks
    private UsuarioConfiguracionService configuracionService;

    private Usuario usuarioTest;
    private UsuarioConfiguracion configuracionTest;
    private final String userEmail = "test@utec.edu.uy";

    @BeforeEach
    void setUp() {
        usuarioTest = new Usuario();
        usuarioTest.setId(1L);
        usuarioTest.setEmail(userEmail);
        usuarioTest.setNombre("Test User");
        usuarioTest.setRolApp(Usuario.RolApp.DOCENTE);

        Map<String, Object> preferencias = new HashMap<>();
        Map<String, Boolean> emailPrefs = new HashMap<>();
        emailPrefs.put("reservaAprobada", true);
        emailPrefs.put("reservaRechazada", false);
        preferencias.put("email", emailPrefs);

        Map<String, Object> vistaPrefs = new HashMap<>();
        vistaPrefs.put("reservasViewMode", "calendar");
        vistaPrefs.put("reservasPageSize", 10);
        preferencias.put("vista", vistaPrefs);

        configuracionTest = new UsuarioConfiguracion();
        configuracionTest.setId(1L);
        configuracionTest.setUsuario(usuarioTest);
        configuracionTest.setPreferencias(preferencias);
    }

    @Test
    @DisplayName("Debe obtener preferencias completas")
    void debeObtenerPreferencias() {
        // Given
        when(usuarioRepository.findByEmail(userEmail)).thenReturn(Optional.of(usuarioTest));
        when(configuracionRepository.findByUsuarioId(usuarioTest.getId())).thenReturn(Optional.of(configuracionTest));

        // When
        PreferenciasCompletasDto resultado = configuracionService.obtenerPreferencias(userEmail);

        // Then
        assertNotNull(resultado);
        verify(usuarioRepository).findByEmail(userEmail);
    }

    @Test
    @DisplayName("Debe crear configuración por defecto si no existe")
    void debeCrearConfiguracionPorDefecto() {
        // Given
        when(usuarioRepository.findByEmail(userEmail)).thenReturn(Optional.of(usuarioTest));
        when(configuracionRepository.findByUsuarioId(usuarioTest.getId())).thenReturn(Optional.empty());
        when(configuracionRepository.save(any(UsuarioConfiguracion.class))).thenReturn(configuracionTest);

        // When
        PreferenciasCompletasDto resultado = configuracionService.obtenerPreferencias(userEmail);

        // Then
        assertNotNull(resultado);
        verify(configuracionRepository).save(any(UsuarioConfiguracion.class));
    }

    @Test
    @DisplayName("Debe obtener preferencias de email")
    void debeObtenerPreferenciasEmail() {
        // Given
        when(usuarioRepository.findByEmail(userEmail)).thenReturn(Optional.of(usuarioTest));
        when(configuracionRepository.findByUsuarioId(usuarioTest.getId())).thenReturn(Optional.of(configuracionTest));

        // When
        PreferenciasEmailDto resultado = configuracionService.obtenerPreferenciasEmail(userEmail);

        // Then
        assertNotNull(resultado);
        assertNotNull(resultado.getEmail());
    }

    @Test
    @DisplayName("Debe obtener preferencias de vista")
    void debeObtenerPreferenciasVista() {
        // Given
        when(usuarioRepository.findByEmail(userEmail)).thenReturn(Optional.of(usuarioTest));
        when(configuracionRepository.findByUsuarioId(usuarioTest.getId())).thenReturn(Optional.of(configuracionTest));

        // When
        PreferenciasVistaDto resultado = configuracionService.obtenerPreferenciasVista(userEmail);

        // Then
        assertNotNull(resultado);
        assertNotNull(resultado.getVista());
    }

    @Test
    @DisplayName("Debe actualizar preferencias de email")
    void debeActualizarPreferenciasEmail() {
        // Given
        PreferenciasEmailDto dto = new PreferenciasEmailDto();
        Map<String, Boolean> emailPrefs = new HashMap<>();
        emailPrefs.put("reservaAprobada", false);
        dto.setEmail(emailPrefs);

        when(usuarioRepository.findByEmail(userEmail)).thenReturn(Optional.of(usuarioTest));
        when(configuracionRepository.findByUsuarioId(usuarioTest.getId())).thenReturn(Optional.of(configuracionTest));
        when(configuracionRepository.save(any(UsuarioConfiguracion.class))).thenReturn(configuracionTest);

        // When
        PreferenciasEmailDto resultado = configuracionService.actualizarPreferenciasEmail(userEmail, dto);

        // Then
        assertNotNull(resultado);
        verify(configuracionRepository).save(any(UsuarioConfiguracion.class));
    }

    @Test
    @DisplayName("Debe actualizar preferencias de vista")
    void debeActualizarPreferenciasVista() {
        // Given
        PreferenciasVistaDto dto = new PreferenciasVistaDto();
        Map<String, Object> vistaPrefs = new HashMap<>();
        vistaPrefs.put("reservasViewMode", "list");
        dto.setVista(vistaPrefs);

        when(usuarioRepository.findByEmail(userEmail)).thenReturn(Optional.of(usuarioTest));
        when(configuracionRepository.findByUsuarioId(usuarioTest.getId())).thenReturn(Optional.of(configuracionTest));
        when(configuracionRepository.save(any(UsuarioConfiguracion.class))).thenReturn(configuracionTest);

        // When
        PreferenciasVistaDto resultado = configuracionService.actualizarPreferenciasVista(userEmail, dto);

        // Then
        assertNotNull(resultado);
        verify(configuracionRepository).save(any(UsuarioConfiguracion.class));
    }

    @Test
    @DisplayName("Debe retornar true para emails obligatorios")
    void debeRetornarTrueParaEmailsObligatorios() {
        // Given
        Set<String> emailsObligatorios = configuracionService.getEmailsObligatorios();

        // When
        boolean resultado = configuracionService.debeEnviarEmail(userEmail, "verificacion");

        // Then
        assertTrue(resultado);
        assertTrue(emailsObligatorios.contains("verificacion"));
    }

    @Test
    @DisplayName("Debe verificar preferencia de email del usuario")
    void debeVerificarPreferenciaEmailUsuario() {
        // Given
        when(usuarioRepository.findByEmail(userEmail)).thenReturn(Optional.of(usuarioTest));
        when(configuracionRepository.findByUsuarioId(usuarioTest.getId())).thenReturn(Optional.of(configuracionTest));

        // When
        boolean resultado = configuracionService.debeEnviarEmail(userEmail, "reservaAprobada");

        // Then
        assertTrue(resultado);
    }

    @Test
    @DisplayName("Debe retornar true por defecto si no hay configuración")
    void debeRetornarTruePorDefectoSiNoHayConfiguracion() {
        // Given
        when(usuarioRepository.findByEmail(userEmail)).thenReturn(Optional.of(usuarioTest));
        when(configuracionRepository.findByUsuarioId(usuarioTest.getId())).thenReturn(Optional.empty());

        // When
        boolean resultado = configuracionService.debeEnviarEmail(userEmail, "reservaAprobada");

        // Then
        assertTrue(resultado);
    }

    @Test
    @DisplayName("Debe obtener emails obligatorios")
    void debeObtenerEmailsObligatorios() {
        // When
        Set<String> resultado = configuracionService.getEmailsObligatorios();

        // Then
        assertNotNull(resultado);
        assertTrue(resultado.contains("verificacion"));
        assertTrue(resultado.contains("restablecimientoPassword"));
    }

    @Test
    @DisplayName("Debe lanzar excepción cuando usuario no existe")
    void debeLanzarExcepcionCuandoUsuarioNoExiste() {
        // Given
        when(usuarioRepository.findByEmail(userEmail)).thenReturn(Optional.empty());

        // When & Then
        RuntimeException exception = assertThrows(RuntimeException.class, () -> {
            configuracionService.obtenerPreferencias(userEmail);
        });

        assertTrue(exception.getMessage().contains("no encontrado"));
    }
}

