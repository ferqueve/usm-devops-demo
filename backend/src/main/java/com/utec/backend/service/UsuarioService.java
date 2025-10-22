package com.utec.backend.service;

import com.utec.backend.exception.AuthenticationException;
import com.utec.backend.exception.UsuarioNotFoundException;
import com.utec.backend.dto.usuario.CambioRolDto;
import com.utec.backend.dto.usuario.PagedUsuarioResponseDto;
import com.utec.backend.dto.usuario.UsuarioResponseDto;
import com.utec.backend.dto.usuario.UsuarioUpdateDto;
import com.utec.backend.dto.usuario.UsuarioStatsDto;
import com.utec.backend.dto.usuario.UsuarioAdminUpdateDto;
import com.utec.backend.model.Usuario;
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
import org.springframework.cache.annotation.Cacheable;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Random;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class UsuarioService {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthService authService;
    private final EmailService emailService;

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
            Boolean activo,
            LocalDate fechaDesde,
            LocalDate fechaHasta
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
        
        // Filtro por fecha desde
        if (fechaDesde != null) {
            Specification<Usuario> fechaDesdeSpec = (root, query, cb) -> 
                cb.greaterThanOrEqualTo(root.get("createdAt"), fechaDesde.atStartOfDay());
            spec = spec == null ? fechaDesdeSpec : spec.and(fechaDesdeSpec);
        }
        
        // Filtro por fecha hasta
        if (fechaHasta != null) {
            Specification<Usuario> fechaHastaSpec = (root, query, cb) -> 
                cb.lessThanOrEqualTo(root.get("createdAt"), fechaHasta.atTime(23, 59, 59));
            spec = spec == null ? fechaHastaSpec : spec.and(fechaHastaSpec);
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

    @Cacheable(value = "usuarioStats", key = "'stats'")
    public UsuarioStatsDto obtenerEstadisticas() {
        log.info("Generando estadísticas de usuarios");
        
        // Total usuarios
        Long totalUsuarios = usuarioRepository.count();
        
        // Usuarios activos e inactivos
        Specification<Usuario> activoSpec = (root, query, cb) -> cb.isNull(root.get("deletedAt"));
        Specification<Usuario> inactivoSpec = (root, query, cb) -> cb.isNotNull(root.get("deletedAt"));
        
        Long totalActivos = usuarioRepository.count(activoSpec);
        Long totalInactivos = usuarioRepository.count(inactivoSpec);
        
        // Usuarios verificados y no verificados
        Specification<Usuario> verificadoSpec = (root, query, cb) -> cb.equal(root.get("verificado"), true);
        Specification<Usuario> noVerificadoSpec = (root, query, cb) -> cb.equal(root.get("verificado"), false);
        
        Long totalVerificados = usuarioRepository.count(verificadoSpec);
        Long totalNoVerificados = usuarioRepository.count(noVerificadoSpec);
        
        // Usuarios por rol
        Map<String, Long> usuariosPorRol = new HashMap<>();
        for (Usuario.RolApp rol : Usuario.RolApp.values()) {
            Specification<Usuario> rolSpec = (root, query, cb) -> cb.equal(root.get("rolApp"), rol);
            Long count = usuarioRepository.count(rolSpec);
            usuariosPorRol.put(rol.name(), count);
        }
        
        // Usuarios por proveedor
        Map<String, Long> usuariosPorProveedor = new HashMap<>();
        
        // Local (password no nulo)
        Specification<Usuario> localSpec = (root, query, cb) -> cb.isNotNull(root.get("password"));
        Long localCount = usuarioRepository.count(localSpec);
        usuariosPorProveedor.put("LOCAL", localCount);
        
        // Google OAuth
        Specification<Usuario> googleSpec = (root, query, cb) -> cb.equal(root.get("oauthProv"), "GOOGLE");
        Long googleCount = usuarioRepository.count(googleSpec);
        usuariosPorProveedor.put("GOOGLE", googleCount);
        
        return new UsuarioStatsDto(
                totalUsuarios,
                totalActivos,
                totalInactivos,
                totalVerificados,
                totalNoVerificados,
                usuariosPorRol,
                usuariosPorProveedor
        );
    }
    
    public UsuarioResponseDto actualizarUsuarioPorAdmin(Long id, UsuarioAdminUpdateDto dto) {
        Usuario usuario = usuarioRepository.findById(id)
                .orElseThrow(() -> new UsuarioNotFoundException(id));
        
        boolean cambioEmail = false;
        boolean cambioNombre = false;
        
        // Validar email si se está cambiando
        if (dto.getEmail() != null && !dto.getEmail().trim().isEmpty()) {
            if (!usuario.getEmail().equals(dto.getEmail())) {
                // Verificar que el nuevo email no esté en uso
                if (usuarioRepository.existsByEmail(dto.getEmail())) {
                    throw new AuthenticationException("El email ya está registrado por otro usuario");
                }
                usuario.setEmail(dto.getEmail());
                cambioEmail = true;
            }
        }
        
        // Actualizar nombre si se proporciona
        if (dto.getNombre() != null && !dto.getNombre().trim().isEmpty()) {
            if (!usuario.getNombre().equals(dto.getNombre())) {
                usuario.setNombre(dto.getNombre());
                cambioNombre = true;
            }
        }
        
        Usuario usuarioActualizado = usuarioRepository.save(usuario);
        
        // Log de cambios
        if (cambioEmail && cambioNombre) {
            log.info("Admin actualizó usuario ID {} (email y nombre)", id);
        } else if (cambioEmail) {
            log.info("Admin actualizó email del usuario ID {}", id);
        } else if (cambioNombre) {
            log.info("Admin actualizó nombre del usuario ID {}", id);
        }
        
        return convertirADto(usuarioActualizado);
    }
    
    public boolean reenviarVerificacionPorAdmin(Long id) {
        Usuario usuario = usuarioRepository.findById(id)
                .orElseThrow(() -> new UsuarioNotFoundException(id));
        
        // Solo reenviar si el usuario no está verificado
        if (usuario.getVerificado()) {
            log.warn("Intento de reenviar verificación a usuario ya verificado ID {}", id);
            return false;
        }
        
        try {
            boolean enviado = authService.resendVerificationEmail(usuario.getEmail());
            if (enviado) {
                log.info("Admin reenvió email de verificación al usuario ID {} ({})", id, usuario.getEmail());
            }
            return enviado;
        } catch (Exception e) {
            log.error("Error al reenviar verificación por admin para usuario ID {}: {}", id, e.getMessage());
            return false;
        }
    }
    
    public List<UsuarioResponseDto> obtenerUsuariosParaExport(
            String search, 
            String rol,
            Boolean verificado,
            Boolean activo,
            LocalDate fechaDesde,
            LocalDate fechaHasta
    ) {
        // Usar mismo método de filtrado pero sin paginación
        Specification<Usuario> spec = null;
        
        // Aplicar mismos filtros que en listarUsuariosPaginados
        if (search != null && !search.trim().isEmpty()) {
            String searchLower = search.toLowerCase();
            Specification<Usuario> searchSpec = (root, query, cb) ->
                cb.or(
                    cb.like(cb.lower(root.get("email")), "%" + searchLower + "%"),
                    cb.like(cb.lower(root.get("nombre")), "%" + searchLower + "%")
                );
            spec = searchSpec;
        }
        
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
        
        if (verificado != null) {
            Specification<Usuario> verificadoSpec = (root, query, cb) -> 
                cb.equal(root.get("verificado"), verificado);
            spec = spec == null ? verificadoSpec : spec.and(verificadoSpec);
        }
        
        if (activo != null) {
            Specification<Usuario> activoSpec = (root, query, cb) -> 
                activo ? cb.isNull(root.get("deletedAt")) : cb.isNotNull(root.get("deletedAt"));
            spec = spec == null ? activoSpec : spec.and(activoSpec);
        }
        
        if (fechaDesde != null) {
            Specification<Usuario> fechaDesdeSpec = (root, query, cb) -> 
                cb.greaterThanOrEqualTo(root.get("createdAt"), fechaDesde.atStartOfDay());
            spec = spec == null ? fechaDesdeSpec : spec.and(fechaDesdeSpec);
        }
        
        if (fechaHasta != null) {
            Specification<Usuario> fechaHastaSpec = (root, query, cb) -> 
                cb.lessThanOrEqualTo(root.get("createdAt"), fechaHasta.atTime(23, 59, 59));
            spec = spec == null ? fechaHastaSpec : spec.and(fechaHastaSpec);
        }
        
        List<Usuario> usuarios = spec != null ? usuarioRepository.findAll(spec) : usuarioRepository.findAll();
        
        // Limitar a 10,000 registros para evitar problemas de memoria
        if (usuarios.size() > 10000) {
            usuarios = usuarios.subList(0, 10000);
            log.warn("Export limitado a 10,000 registros de {} totales", usuarios.size());
        }
        
        return usuarios.stream()
                .map(this::convertirADto)
                .collect(Collectors.toList());
    }

    public boolean restablecerPasswordPorAdmin(Long id) {
        Usuario usuario = usuarioRepository.findById(id)
                .orElseThrow(() -> new UsuarioNotFoundException(id));
        
        // Generar contraseña temporal aleatoria (8 caracteres alfanuméricos)
        String nuevaPassword = generarPasswordTemporal();
        
        // Encriptar y guardar la nueva contraseña
        usuario.setPassword(passwordEncoder.encode(nuevaPassword));
        usuarioRepository.save(usuario);
        
        // Enviar email con la nueva contraseña
        boolean emailEnviado = emailService.enviarEmailRestablecimientoPassword(
            usuario.getEmail(), 
            nuevaPassword
        );
        
        if (emailEnviado) {
            log.info("Admin restableció contraseña del usuario ID {} ({})", id, usuario.getEmail());
        }
        
        return emailEnviado;
    }

    private String generarPasswordTemporal() {
        String caracteres = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        StringBuilder password = new StringBuilder();
        Random random = new Random();
        
        for (int i = 0; i < 8; i++) {
            password.append(caracteres.charAt(random.nextInt(caracteres.length())));
        }
        
        return password.toString();
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
                usuario.getCreatedAt(),
                usuario.getUpdatedAt()
        );
    }
}
