package com.utec.backend.controller;

import com.utec.backend.common.ApiResponse;
import com.utec.backend.dto.edificio.EdificioResponseDto;
import com.utec.backend.service.EdificioService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/edificios")
@RequiredArgsConstructor
public class EdificioController {

    private final EdificioService edificioService;

    @GetMapping
    @PreAuthorize("hasPermission(null, 'espacio:ver')")
    public ResponseEntity<ApiResponse<List<EdificioResponseDto>>> getAllEdificios() {
        try {
            List<EdificioResponseDto> edificios = edificioService.getAllEdificios();
            return ResponseEntity.ok(ApiResponse.success(edificios, "Edificios obtenidos exitosamente"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Error al obtener edificios: " + e.getMessage()));
        }
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasPermission(null, 'espacio:ver')")
    public ResponseEntity<ApiResponse<EdificioResponseDto>> getEdificioById(@PathVariable Long id) {
        try {
            EdificioResponseDto edificio = edificioService.getEdificioById(id);
            return ResponseEntity.ok(ApiResponse.success(edificio, "Edificio obtenido exitosamente"));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Error al obtener edificio: " + e.getMessage()));
        }
    }
}
