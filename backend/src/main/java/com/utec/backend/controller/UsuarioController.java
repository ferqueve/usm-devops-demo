package com.utec.backend.controller;

import com.utec.backend.dto.usuarios.CambioRolDto;
import com.utec.backend.dto.usuarios.PagedUsuarioResponseDto;
import com.utec.backend.dto.usuarios.UsuarioResponseDto;
import com.utec.backend.dto.usuarios.UsuarioUpdateDto;
import com.utec.backend.service.UsuarioService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;

@Tag(name = "Usuarios", description = "Endpoints para gestión de usuarios")
@RestController
@RequestMapping("/api/v1/usuarios")
@RequiredArgsConstructor
public class UsuarioController {

    private final UsuarioService usuarioService;


    @Operation(summary = "Obtener mi perfil", description = "Obtener información del usuario autenticado actual")
    @GetMapping("/me")
    public ResponseEntity<UsuarioResponseDto> obtenerPerfilPropio(Principal principal) {
        UsuarioResponseDto perfil = usuarioService.obtenerPerfilPropio(principal.getName());
        return ResponseEntity.ok(perfil);
    }

    @Operation(summary = "Actualizar mi perfil", description = "Modificar información del usuario autenticado actual")
    @PutMapping("/me")
    public ResponseEntity<UsuarioResponseDto> actualizarPerfil(@Valid @RequestBody UsuarioUpdateDto updateDto,
                                                               Principal principal) {
        UsuarioResponseDto perfilActualizado = usuarioService.actualizarPerfil(principal.getName(), updateDto);
        return ResponseEntity.ok(perfilActualizado);
    }

    @Operation(summary = "Listar usuarios", description = "Obtener lista paginada de todos los usuarios con filtros opcionales")
    @GetMapping
    public ResponseEntity<PagedUsuarioResponseDto> listarTodosLosUsuarios(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String rol,
            @RequestParam(required = false) Boolean verificado,
            @RequestParam(required = false) Boolean activo
    ) {
        PagedUsuarioResponseDto usuarios = usuarioService.listarUsuariosPaginados(
                page, size, search, rol, verificado, activo
        );
        return ResponseEntity.ok(usuarios);
    }

    @Operation(summary = "Obtener usuario por ID", description = "Obtener información detallada de un usuario específico")
    @GetMapping("/{id}")
    public ResponseEntity<UsuarioResponseDto> obtenerUsuarioPorId(@PathVariable Long id) {
        UsuarioResponseDto usuario = usuarioService.obtenerUsuarioPorId(id);
        return ResponseEntity.ok(usuario);
    }

    @Operation(summary = "Cambiar rol de usuario", description = "Modificar el rol asignado a un usuario")
    @PutMapping("/{id}/rol")
    public ResponseEntity<Void> cambiarRolUsuario(@PathVariable Long id, @RequestBody CambioRolDto cambioRolDto) {
        usuarioService.cambiarRolUsuario(id, cambioRolDto);
        return ResponseEntity.noContent().build();
    }

    @Operation(summary = "Activar/desactivar usuario", description = "Cambiar el estado activo/inactivo de un usuario")
    @PutMapping("/{id}/toggle-activo")
    public ResponseEntity<UsuarioResponseDto> toggleUsuarioActivo(@PathVariable Long id) {
        UsuarioResponseDto usuario = usuarioService.toggleUsuarioActivo(id);
        return ResponseEntity.ok(usuario);
    }
}
