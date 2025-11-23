package com.utec.backend.controller;

import com.utec.backend.dto.preferencias.PreferenciasCompletasDto;
import com.utec.backend.dto.preferencias.PreferenciasEmailDto;
import com.utec.backend.dto.preferencias.PreferenciasVistaDto;
import com.utec.backend.service.UsuarioConfiguracionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;

@Tag(name = "Preferencias de Usuario", description = "Endpoints para gestión de preferencias de usuario")
@RestController
@RequestMapping("/api/v1/preferencias")
@RequiredArgsConstructor
public class UsuarioConfiguracionController {

    private final UsuarioConfiguracionService configuracionService;

    @Operation(summary = "Obtener todas las preferencias", description = "Obtiene todas las preferencias del usuario autenticado")
    @GetMapping
    public ResponseEntity<PreferenciasCompletasDto> obtenerPreferencias(Principal principal) {
        PreferenciasCompletasDto preferencias = configuracionService.obtenerPreferencias(principal.getName());
        return ResponseEntity.ok(preferencias);
    }

    @Operation(summary = "Obtener preferencias de email", description = "Obtiene las preferencias de email filtradas por rol del usuario")
    @GetMapping("/email")
    public ResponseEntity<PreferenciasEmailDto> obtenerPreferenciasEmail(Principal principal) {
        PreferenciasEmailDto preferencias = configuracionService.obtenerPreferenciasEmail(principal.getName());
        return ResponseEntity.ok(preferencias);
    }

    @Operation(summary = "Obtener preferencias de vista", description = "Obtiene las preferencias de vista del usuario")
    @GetMapping("/vista")
    public ResponseEntity<PreferenciasVistaDto> obtenerPreferenciasVista(Principal principal) {
        PreferenciasVistaDto preferencias = configuracionService.obtenerPreferenciasVista(principal.getName());
        return ResponseEntity.ok(preferencias);
    }

    @Operation(summary = "Actualizar preferencias de email", description = "Actualiza las preferencias de email del usuario autenticado")
    @PutMapping("/email")
    public ResponseEntity<PreferenciasEmailDto> actualizarPreferenciasEmail(
            @Valid @RequestBody PreferenciasEmailDto dto,
            Principal principal) {
        PreferenciasEmailDto preferencias = configuracionService.actualizarPreferenciasEmail(principal.getName(), dto);
        return ResponseEntity.ok(preferencias);
    }

    @Operation(summary = "Actualizar preferencias de vista", description = "Actualiza las preferencias de vista del usuario autenticado")
    @PutMapping("/vista")
    public ResponseEntity<PreferenciasVistaDto> actualizarPreferenciasVista(
            @Valid @RequestBody PreferenciasVistaDto dto,
            Principal principal) {
        PreferenciasVistaDto preferencias = configuracionService.actualizarPreferenciasVista(principal.getName(), dto);
        return ResponseEntity.ok(preferencias);
    }

    @Operation(summary = "Obtener emails obligatorios", description = "Obtiene la lista de tipos de email que no se pueden desactivar")
    @GetMapping("/email/obligatorios")
    public ResponseEntity<java.util.List<String>> obtenerEmailsObligatorios() {
        return ResponseEntity.ok(new java.util.ArrayList<>(configuracionService.getEmailsObligatorios()));
    }
}

