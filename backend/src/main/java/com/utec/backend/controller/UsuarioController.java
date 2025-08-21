package com.utec.backend.controller;

import com.utec.backend.dto.usuarios.CambioRolDto;
import com.utec.backend.dto.usuarios.UsuarioRegistroDto;
import com.utec.backend.dto.usuarios.UsuarioResponseDto;
import com.utec.backend.dto.usuarios.UsuarioUpdateDto;
import com.utec.backend.exception.UsuarioNotFoundException;
import com.utec.backend.model.Usuario;
import com.utec.backend.service.UsuarioService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/usuarios")
@CrossOrigin(origins = "*")
public class UsuarioController {

    @Autowired
    private UsuarioService usuarioService;

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
    public ResponseEntity<UsuarioResponseDto> obtenerPerfilPropio() {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            String email = authentication.getName();
            
            UsuarioResponseDto perfil = usuarioService.obtenerPerfilPropio(email);
            return ResponseEntity.ok(perfil);
        } catch (UsuarioNotFoundException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PutMapping("/me")
    public ResponseEntity<UsuarioResponseDto> actualizarPerfil(@Valid @RequestBody UsuarioUpdateDto updateDto) {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            String email = authentication.getName();
            
            UsuarioResponseDto perfilActualizado = usuarioService.actualizarPerfil(email, updateDto);
            return ResponseEntity.ok(perfilActualizado);
        } catch (UsuarioNotFoundException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<UsuarioResponseDto>> listarTodosLosUsuarios() {
        try {
            List<UsuarioResponseDto> usuarios = usuarioService.listarTodosLosUsuarios();
            return ResponseEntity.ok(usuarios);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UsuarioResponseDto> obtenerUsuarioPorId(@PathVariable Long id) {
        try {
            UsuarioResponseDto usuario = usuarioService.obtenerUsuarioPorId(id);
            return ResponseEntity.ok(usuario);
        } catch (UsuarioNotFoundException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
    }

    @PutMapping("/{id}/rol")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> cambiarRolUsuario(@PathVariable Long id, @RequestBody CambioRolDto cambioRolDto) {
        try {
            usuarioService.cambiarRolUsuario(id, cambioRolDto);
            return ResponseEntity.noContent().build();
        } catch (UsuarioNotFoundException e) {
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
    }
}
