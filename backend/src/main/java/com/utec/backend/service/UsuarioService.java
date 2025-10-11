package com.utec.backend.service;

import com.utec.backend.common.exception.AuthenticationException;
import com.utec.backend.common.exception.UsuarioNotFoundException;
import com.utec.backend.dto.usuarios.CambioRolDto;
import com.utec.backend.dto.usuarios.PagedUsuarioResponseDto;
import com.utec.backend.dto.usuarios.UsuarioResponseDto;
import com.utec.backend.dto.usuarios.UsuarioUpdateDto;
import com.utec.backend.model.entity.Usuario;
import com.utec.backend.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
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
        
        boolean cambioNombre = false;
        boolean cambioPassword = false;
        
        if (updateDto.getNombre() != null && !updateDto.getNombre().trim().isEmpty()) {
            usuario.setNombre(updateDto.getNombre());
            cambioNombre = true;
        }
        
        if (updateDto.getPassword() != null && !updateDto.getPassword().trim().isEmpty()) {
            usuario.setPassword(passwordEncoder.encode(updateDto.getPassword()));
            cambioPassword = true;
        }
        
        Usuario usuarioActualizado = usuarioRepository.save(usuario);
        
        // Log de cambios
        if (cambioNombre && cambioPassword) {
            log.info("Usuario {} actualizó su perfil (nombre y contraseña)", email);
        } else if (cambioNombre) {
            log.info("Usuario {} actualizó su nombre", email);
        } else if (cambioPassword) {
            log.info("Usuario {} actualizó su contraseña", email);
        }
        
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
        
        Usuario.RolApp rolAnterior = usuario.getRolApp();
        usuario.setRolApp(cambioRolDto.getRolApp());
        usuarioRepository.save(usuario);
        
        log.info("Rol de usuario ID {} ({}) cambiado de {} a {}", 
                id, usuario.getEmail(), rolAnterior, cambioRolDto.getRolApp());
    }

    public PagedUsuarioResponseDto listarUsuariosPaginados(
            int page, 
            int size, 
            String search, 
            String rol,
            Boolean verificado,
            Boolean activo
    ) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        
        Specification<Usuario> spec = null;
        
        // Filtro de búsqueda (email o nombre)
        if (search != null && !search.trim().isEmpty()) {
            String searchLower = search.toLowerCase();
            Specification<Usuario> searchSpec = (root, query, cb) ->
                cb.or(
                    cb.like(cb.lower(root.get("email")), "%" + searchLower + "%"),
                    cb.like(cb.lower(root.get("nombre")), "%" + searchLower + "%")
                );
            spec = spec == null ? searchSpec : spec.and(searchSpec);
        }
        
        // Filtro por rol
        if (rol != null && !rol.trim().isEmpty()) {
            try {
                Usuario.RolApp rolApp = Usuario.RolApp.valueOf(rol.toUpperCase());
                Specification<Usuario> rolSpec = (root, query, cb) -> 
                    cb.equal(root.get("rolApp"), rolApp);
                spec = spec == null ? rolSpec : spec.and(rolSpec);
            } catch (IllegalArgumentException e) {
                // Ignorar si el rol no es válido
            }
        }
        
        // Filtro por verificado
        if (verificado != null) {
            Specification<Usuario> verificadoSpec = (root, query, cb) -> 
                cb.equal(root.get("verificado"), verificado);
            spec = spec == null ? verificadoSpec : spec.and(verificadoSpec);
        }
        
        // Filtro por activo (deletedAt null o no null)
        if (activo != null) {
            Specification<Usuario> activoSpec = (root, query, cb) -> 
                activo ? cb.isNull(root.get("deletedAt")) : cb.isNotNull(root.get("deletedAt"));
            spec = spec == null ? activoSpec : spec.and(activoSpec);
        }
        
        Page<Usuario> pageResult = usuarioRepository.findAll(spec, pageable);
        
        List<UsuarioResponseDto> content = pageResult.getContent()
                .stream()
                .map(this::convertirADto)
                .collect(Collectors.toList());
        
        return new PagedUsuarioResponseDto(
                content,
                pageResult.getNumber(),
                pageResult.getSize(),
                pageResult.getTotalElements(),
                pageResult.getTotalPages(),
                pageResult.isFirst(),
                pageResult.isLast()
        );
    }

    public UsuarioResponseDto toggleUsuarioActivo(Long id) {
        Usuario usuario = usuarioRepository.findById(id)
                .orElseThrow(() -> new UsuarioNotFoundException(id));
        
        if (usuario.getDeletedAt() == null) {
            // Desactivar (soft delete)
            usuario.setDeletedAt(LocalDateTime.now());
            log.info("Usuario ID {} ({}) desactivado", id, usuario.getEmail());
        } else {
            // Activar
            usuario.setDeletedAt(null);
            log.info("Usuario ID {} ({}) activado", id, usuario.getEmail());
        }
        
        Usuario usuarioActualizado = usuarioRepository.save(usuario);
        return convertirADto(usuarioActualizado);
    }

    private UsuarioResponseDto convertirADto(Usuario usuario) {
        return new UsuarioResponseDto(
                usuario.getId(),
                usuario.getEmail(),
                usuario.getNombre(),
                usuario.getRolApp(),
                usuario.getVerificado(),
                usuario.getDeletedAt() == null, // activo si no está eliminado
                usuario.getOauthProv(),
                usuario.getCreatedAt()
        );
    }
}
