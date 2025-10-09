package com.utec.backend.controller;

import com.utec.backend.dto.usuarios.CambioRolDto;
import com.utec.backend.dto.usuarios.PagedUsuarioResponseDto;
import com.utec.backend.dto.usuarios.UsuarioResponseDto;
import com.utec.backend.dto.usuarios.UsuarioUpdateDto;
import com.utec.backend.service.UsuarioService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;

@RestController
@RequestMapping("/api/v1/usuarios")
@RequiredArgsConstructor
public class UsuarioController {

    private final UsuarioService usuarioService;


    @GetMapping("/me")
    public ResponseEntity<UsuarioResponseDto> obtenerPerfilPropio(Principal principal) {
        UsuarioResponseDto perfil = usuarioService.obtenerPerfilPropio(principal.getName());
        return ResponseEntity.ok(perfil);
    }

    @PutMapping("/me")
    public ResponseEntity<UsuarioResponseDto> actualizarPerfil(@Valid @RequestBody UsuarioUpdateDto updateDto,
                                                               Principal principal) {
        UsuarioResponseDto perfilActualizado = usuarioService.actualizarPerfil(principal.getName(), updateDto);
        return ResponseEntity.ok(perfilActualizado);
    }

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

    @GetMapping("/{id}")
    public ResponseEntity<UsuarioResponseDto> obtenerUsuarioPorId(@PathVariable Long id) {
        UsuarioResponseDto usuario = usuarioService.obtenerUsuarioPorId(id);
        return ResponseEntity.ok(usuario);
    }

    @PutMapping("/{id}/rol")
    public ResponseEntity<Void> cambiarRolUsuario(@PathVariable Long id, @RequestBody CambioRolDto cambioRolDto) {
        usuarioService.cambiarRolUsuario(id, cambioRolDto);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{id}/toggle-activo")
    public ResponseEntity<UsuarioResponseDto> toggleUsuarioActivo(@PathVariable Long id) {
        UsuarioResponseDto usuario = usuarioService.toggleUsuarioActivo(id);
        return ResponseEntity.ok(usuario);
    }
}
