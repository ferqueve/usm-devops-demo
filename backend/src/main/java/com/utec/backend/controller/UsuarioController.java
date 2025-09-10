package com.utec.backend.controller;

import com.utec.backend.dto.usuarios.CambioRolDto;
import com.utec.backend.dto.usuarios.UsuarioRegistroDto;
import com.utec.backend.dto.usuarios.UsuarioResponseDto;
import com.utec.backend.dto.usuarios.UsuarioUpdateDto;
import com.utec.backend.model.entity.Usuario;
import com.utec.backend.service.UsuarioService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/v1/usuarios")
@RequiredArgsConstructor
public class UsuarioController {

    private final UsuarioService usuarioService;

    @PostMapping("/registro")
    public ResponseEntity<UsuarioResponseDto> registrarUsuario(@Valid @RequestBody UsuarioRegistroDto registroDto) {
        Usuario usuario = new Usuario();
        usuario.setEmail(registroDto.getEmail());
        usuario.setNombre(registroDto.getNombre());
        usuario.setPassword(registroDto.getPassword());
        usuario.setRolApp(registroDto.getRolApp());

        UsuarioResponseDto usuarioRegistrado = usuarioService.registrarUsuario(usuario);
        return ResponseEntity.status(HttpStatus.CREATED).body(usuarioRegistrado);
    }

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
    public ResponseEntity<List<UsuarioResponseDto>> listarTodosLosUsuarios() {
        List<UsuarioResponseDto> usuarios = usuarioService.listarTodosLosUsuarios();
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
}
