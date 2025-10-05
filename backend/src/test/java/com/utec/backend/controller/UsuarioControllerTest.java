package com.utec.backend.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.utec.backend.dto.usuarios.CambioRolDto;
import com.utec.backend.dto.usuarios.UsuarioResponseDto;
import com.utec.backend.dto.usuarios.UsuarioUpdateDto;
import com.utec.backend.model.entity.Usuario;
import com.utec.backend.service.UsuarioService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Arrays;
import java.util.List;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import static org.hamcrest.Matchers.*;
import org.mockito.ArgumentMatchers;

@SpringBootTest
@AutoConfigureMockMvc(addFilters = false)
@ActiveProfiles("test")
@DisplayName("Tests de integración para UsuarioController")
class UsuarioControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private UsuarioService usuarioService;

    private UsuarioResponseDto usuarioResponseDto;
    private final String testEmail = "test@utec.edu.uy";

    @BeforeEach
    void setUp() {
        usuarioResponseDto = new UsuarioResponseDto(
                1L,
                testEmail,
                "Juan Pérez",
                Usuario.RolApp.EXTERNO
        );
    }

    @Test
    @DisplayName("GET /api/v1/usuarios/me - Debe obtener perfil propio")
    void debeObtenerPerfilPropio() throws Exception {
        // Given
        when(usuarioService.obtenerPerfilPropio(testEmail)).thenReturn(usuarioResponseDto);

        // When & Then
        mockMvc.perform(get("/api/v1/usuarios/me")
                        .contentType(MediaType.APPLICATION_JSON)
                        .principal(() -> testEmail))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value(testEmail))
                .andExpect(jsonPath("$.nombre").value("Juan Pérez"))
                .andExpect(jsonPath("$.rolApp").value("EXTERNO"));

        verify(usuarioService).obtenerPerfilPropio(testEmail);
    }

    @Test
    @DisplayName("PUT /api/v1/usuarios/me - Debe actualizar perfil propio")
    void debeActualizarPerfilPropio() throws Exception {
        // Given
        UsuarioUpdateDto updateDto = new UsuarioUpdateDto();
        updateDto.setNombre("Juan Carlos Pérez");

        UsuarioResponseDto usuarioActualizado = new UsuarioResponseDto(
                1L,
                testEmail,
                "Juan Carlos Pérez",
                Usuario.RolApp.EXTERNO
        );

        when(usuarioService.actualizarPerfil(eq(testEmail), ArgumentMatchers.any(UsuarioUpdateDto.class)))
                .thenReturn(usuarioActualizado);

        // When & Then
        mockMvc.perform(put("/api/v1/usuarios/me")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateDto))
                        .principal(() -> testEmail))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.nombre").value("Juan Carlos Pérez"))
                .andExpect(jsonPath("$.email").value(testEmail));

        verify(usuarioService).actualizarPerfil(eq(testEmail), ArgumentMatchers.any(UsuarioUpdateDto.class));
    }

    @Test
    @DisplayName("GET /api/v1/usuarios - Debe listar todos los usuarios")
    void debeListarTodosLosUsuarios() throws Exception {
        // Given
        UsuarioResponseDto usuario2 = new UsuarioResponseDto(
                2L,
                "otro@utec.edu.uy",
                "Otro Usuario",
                Usuario.RolApp.DOCENTE
        );

        List<UsuarioResponseDto> usuarios = Arrays.asList(usuarioResponseDto, usuario2);
        when(usuarioService.listarTodosLosUsuarios()).thenReturn(usuarios);

        // When & Then
        mockMvc.perform(get("/api/v1/usuarios")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[0].email").value(testEmail))
                .andExpect(jsonPath("$[1].email").value("otro@utec.edu.uy"));

        verify(usuarioService).listarTodosLosUsuarios();
    }

    @Test
    @DisplayName("GET /api/v1/usuarios/{id} - Debe obtener usuario por ID")
    void debeObtenerUsuarioPorId() throws Exception {
        // Given
        Long usuarioId = 1L;
        when(usuarioService.obtenerUsuarioPorId(usuarioId)).thenReturn(usuarioResponseDto);

        // When & Then
        mockMvc.perform(get("/api/v1/usuarios/{id}", usuarioId)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(usuarioId))
                .andExpect(jsonPath("$.email").value(testEmail))
                .andExpect(jsonPath("$.nombre").value("Juan Pérez"));

        verify(usuarioService).obtenerUsuarioPorId(usuarioId);
    }

    @Test
    @DisplayName("PUT /api/v1/usuarios/{id}/rol - Debe cambiar rol de usuario")
    void debeCambiarRolUsuario() throws Exception {
        // Given
        Long usuarioId = 1L;
        CambioRolDto cambioRolDto = new CambioRolDto();
        cambioRolDto.setRolApp(Usuario.RolApp.DOCENTE);

        doNothing().when(usuarioService).cambiarRolUsuario(eq(usuarioId), ArgumentMatchers.any(CambioRolDto.class));

        // When & Then
        mockMvc.perform(put("/api/v1/usuarios/{id}/rol", usuarioId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(cambioRolDto)))
                .andExpect(status().isNoContent());

        verify(usuarioService).cambiarRolUsuario(eq(usuarioId), ArgumentMatchers.any(CambioRolDto.class));
    }

    @Test
    @DisplayName("GET /api/v1/usuarios/me - Debe obtener datos con principal mock")
    void debeObtenerDatosConPrincipalMock() throws Exception {
        // Given
        when(usuarioService.obtenerPerfilPropio(testEmail)).thenReturn(usuarioResponseDto);

        // When & Then
        mockMvc.perform(get("/api/v1/usuarios/me")
                        .contentType(MediaType.APPLICATION_JSON)
                        .principal(() -> testEmail))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value(testEmail));
        
        verify(usuarioService).obtenerPerfilPropio(testEmail);
    }

    @Test
    @DisplayName("PUT /api/v1/usuarios/me - Debe validar datos de entrada")
    void debeValidarDatosEntrada() throws Exception {
        // Given - nombre muy corto (menos de 2 caracteres)
        UsuarioUpdateDto updateDto = new UsuarioUpdateDto();
        updateDto.setNombre("J");

        // When & Then
        mockMvc.perform(put("/api/v1/usuarios/me")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateDto)))
                .andExpect(status().isBadRequest());

        verify(usuarioService, never()).actualizarPerfil(anyString(), ArgumentMatchers.any(UsuarioUpdateDto.class));
    }
}

