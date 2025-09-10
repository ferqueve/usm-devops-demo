package com.utec.backend.service;

import com.utec.backend.common.exception.AuthenticationException;
import com.utec.backend.common.exception.UsuarioNotFoundException;
import com.utec.backend.dto.usuarios.CambioRolDto;
import com.utec.backend.dto.usuarios.UsuarioResponseDto;
import com.utec.backend.dto.usuarios.UsuarioUpdateDto;
import com.utec.backend.model.entity.Usuario;
import com.utec.backend.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UsuarioService {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;

    public UsuarioResponseDto registrarUsuario(Usuario usuario) {
        if (usuarioRepository.existsByEmail(usuario.getEmail())) {
            throw new AuthenticationException("El email ya está registrado");
        }
        
        usuario.setPassword(passwordEncoder.encode(usuario.getPassword()));
        Usuario usuarioGuardado = usuarioRepository.save(usuario);
        return convertirADto(usuarioGuardado);
    }

    public UsuarioResponseDto obtenerPerfilPropio(String email) {
        Usuario usuario = usuarioRepository.findByEmail(email)
                .orElseThrow(() -> new UsuarioNotFoundException("Usuario con email " + email + " no encontrado"));
        
        return convertirADto(usuario);
    }

    public UsuarioResponseDto actualizarPerfil(String email, UsuarioUpdateDto updateDto) {
        Usuario usuario = usuarioRepository.findByEmail(email)
                .orElseThrow(() -> new UsuarioNotFoundException("Usuario con email " + email + " no encontrado"));
        
        if (updateDto.getNombre() != null && !updateDto.getNombre().trim().isEmpty()) {
            usuario.setNombre(updateDto.getNombre());
        }
        
        if (updateDto.getPassword() != null && !updateDto.getPassword().trim().isEmpty()) {
            usuario.setPassword(passwordEncoder.encode(updateDto.getPassword()));
        }
        
        Usuario usuarioActualizado = usuarioRepository.save(usuario);
        return convertirADto(usuarioActualizado);
    }

    public List<UsuarioResponseDto> listarTodosLosUsuarios() {
        List<Usuario> usuarios = usuarioRepository.findAll();
        return usuarios.stream()
                .map(this::convertirADto)
                .collect(Collectors.toList());
    }

    public UsuarioResponseDto obtenerUsuarioPorId(Long id) {
        Usuario usuario = usuarioRepository.findById(id)
                .orElseThrow(() -> new UsuarioNotFoundException(id));
        
        return convertirADto(usuario);
    }

    public void cambiarRolUsuario(Long id, CambioRolDto cambioRolDto) {
        Usuario usuario = usuarioRepository.findById(id)
                .orElseThrow(() -> new UsuarioNotFoundException(id));
        
        usuario.setRolApp(cambioRolDto.getRolApp());
        usuarioRepository.save(usuario);
    }

    private UsuarioResponseDto convertirADto(Usuario usuario) {
        return new UsuarioResponseDto(
                usuario.getId(),
                usuario.getEmail(),
                usuario.getNombre(),
                usuario.getRolApp()
        );
    }
}
