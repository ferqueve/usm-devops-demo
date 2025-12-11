package com.utec.backend.controller;

import com.utec.backend.dto.espacio.EspacioResponseDto;
import com.utec.backend.service.EspacioService;
import com.utec.backend.service.FileStorageService;
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
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.web.multipart.MultipartFile;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@DisplayName("Tests de integración para FileUploadController")
class FileUploadControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private FileStorageService fileStorageService;

    @MockitoBean
    private EspacioService espacioService;

    private EspacioResponseDto espacioResponseDto;
    private final Long espacioId = 1L;
    private final String objectName = "espacios/1/test.jpg";
    private final String imageUrl = "http://localhost:9000/test-bucket/espacios/1/test.jpg";

    @BeforeEach
    void setUp() {
        espacioResponseDto = new EspacioResponseDto();
        espacioResponseDto.setId(espacioId);
        espacioResponseDto.setNombre("Aula 101");
        espacioResponseDto.setImagenUrl(objectName);
    }

    @Test
    @DisplayName("POST /api/v1/espacios/{id}/imagen - Debe subir imagen")
    @WithMockUser(roles = {"ADMIN"})
    void debeSubirImagen() throws Exception {
        // Given
        when(espacioService.getEspacioById(espacioId)).thenReturn(espacioResponseDto);
        when(fileStorageService.uploadImage(any(MultipartFile.class), eq(espacioId))).thenReturn(objectName);
        when(fileStorageService.getImageUrl(objectName)).thenReturn(imageUrl);
        doNothing().when(espacioService).updateEspacioImagen(eq(espacioId), anyString());

        // When & Then
        mockMvc.perform(multipart("/api/v1/espacios/{id}/imagen", espacioId)
                        .file("file", "test image content".getBytes())
                        .contentType(MediaType.MULTIPART_FORM_DATA))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true));

        verify(fileStorageService).uploadImage(any(MultipartFile.class), eq(espacioId));
        verify(espacioService).updateEspacioImagen(eq(espacioId), eq(objectName));
    }

    @Test
    @DisplayName("DELETE /api/v1/espacios/{id}/imagen - Debe eliminar imagen")
    @WithMockUser(roles = {"ANALISTA"})
    void debeEliminarImagen() throws Exception {
        // Given
        when(espacioService.getEspacioById(espacioId)).thenReturn(espacioResponseDto);
        doNothing().when(fileStorageService).deleteImage(anyString());
        doNothing().when(espacioService).updateEspacioImagen(eq(espacioId), isNull());

        // When & Then
        mockMvc.perform(delete("/api/v1/espacios/{id}/imagen", espacioId)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        verify(fileStorageService).deleteImage(anyString());
        verify(espacioService).updateEspacioImagen(eq(espacioId), isNull());
    }

    @Test
    @DisplayName("GET /api/v1/espacios/{id}/imagen - Debe obtener URL de imagen")
    @WithMockUser
    void debeObtenerUrlImagen() throws Exception {
        // Given
        when(espacioService.getEspacioById(espacioId)).thenReturn(espacioResponseDto);
        when(fileStorageService.getImageUrl(objectName)).thenReturn(imageUrl);

        // When & Then
        mockMvc.perform(get("/api/v1/espacios/{id}/imagen", espacioId)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.imageUrl").value(imageUrl));

        verify(espacioService).getEspacioById(espacioId);
        verify(fileStorageService).getImageUrl(objectName);
    }

    @Test
    @DisplayName("POST /api/v1/espacios/{id}/imagen - Debe retornar error cuando espacio no existe")
    @WithMockUser(roles = {"ADMIN"})
    void debeRetornarErrorCuandoEspacioNoExiste() throws Exception {
        // Given
        when(espacioService.getEspacioById(espacioId))
                .thenThrow(new RuntimeException("Espacio no encontrado"));

        // When & Then
        mockMvc.perform(multipart("/api/v1/espacios/{id}/imagen", espacioId)
                        .file("file", "test image content".getBytes())
                        .contentType(MediaType.MULTIPART_FORM_DATA))
                .andExpect(status().isNotFound());

        verify(fileStorageService, never()).uploadImage(any(), any());
    }

    @Test
    @DisplayName("POST /api/v1/espacios/{id}/imagen - Debe retornar error cuando archivo es inválido")
    @WithMockUser(roles = {"ADMIN"})
    void debeRetornarErrorCuandoArchivoEsInvalido() throws Exception {
        // Given
        when(espacioService.getEspacioById(espacioId)).thenReturn(espacioResponseDto);
        when(fileStorageService.uploadImage(any(MultipartFile.class), eq(espacioId)))
                .thenThrow(new IllegalArgumentException("Archivo inválido"));

        // When & Then
        mockMvc.perform(multipart("/api/v1/espacios/{id}/imagen", espacioId)
                        .file("file", "test image content".getBytes())
                        .contentType(MediaType.MULTIPART_FORM_DATA))
                .andExpect(status().isBadRequest());

        verify(fileStorageService).uploadImage(any(MultipartFile.class), eq(espacioId));
    }
}

