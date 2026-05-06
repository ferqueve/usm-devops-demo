package com.utec.backend.service;

import com.utec.backend.exception.AuthenticationException;
import com.utec.backend.exception.UsuarioNotFoundException;
import com.utec.backend.dto.usuario.CambioRolDto;
import com.utec.backend.dto.usuario.PagedUsuarioResponseDto;
import com.utec.backend.dto.usuario.UsuarioResponseDto;
import com.utec.backend.dto.usuario.UsuarioUpdateDto;
import com.utec.backend.dto.usuario.UsuarioFilters;
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
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.security.SecureRandom;

@Service
@RequiredArgsConstructor
@Slf4j
public class UsuarioService {

    private static final String FIELD_CREATED_AT = "createdAt";
    private static final String FIELD_ROL_APP = "rolApp";
    private static final String FIELD_VERIFICADO = "verificado";
    private static final String FIELD_DELETED_AT = "deletedAt";

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

        boolean cambioNombre = aplicarCambioNombre(usuario, updateDto.getNombre());
        boolean cambioPassword = aplicarCambioPassword(usuario, updateDto);

        Usuario usuarioActualizado = usuarioRepository.save(usuario);

        logCambiosPerfil(email, cambioNombre, cambioPassword);

        return convertirADto(usuarioActualizado);
    }

    private boolean aplicarCambioNombre(Usuario usuario, String nuevoNombre) {
        if (nuevoNombre == null || nuevoNombre.trim().isEmpty()) {
            return false;
        }
        usuario.setNombre(nuevoNombre);
        return true;
    }

    private boolean aplicarCambioPassword(Usuario usuario, UsuarioUpdateDto updateDto) {
        String nuevaPassword = updateDto.getPassword();
        if (nuevaPassword == null || nuevaPassword.trim().isEmpty()) {
            return false;
        }
        validarPasswordActualSiCorresponde(usuario, updateDto.getCurrentPassword());
        usuario.setPassword(passwordEncoder.encode(nuevaPassword));
        return true;
    }

    private void validarPasswordActualSiCorresponde(Usuario usuario, String currentPassword) {
        if (usuario.getPassword() == null || usuario.getPassword().isEmpty()) {
            return; // OAuth: sin password previo
        }
        if (currentPassword == null || currentPassword.trim().isEmpty()) {
            throw new AuthenticationException("Debes ingresar tu contraseña actual para cambiarla");
        }
        if (!passwordEncoder.matches(currentPassword, usuario.getPassword())) {
            throw new AuthenticationException("La contraseña actual es incorrecta");
        }
    }

    private void logCambiosPerfil(String email, boolean cambioNombre, boolean cambioPassword) {
        if (cambioNombre && cambioPassword) {
            log.info("Usuario {} actualizó su perfil (nombre y contraseña)", email);
        } else if (cambioNombre) {
            log.info("Usuario {} actualizó su nombre", email);
        } else if (cambioPassword) {
            log.info("Usuario {} actualizó su contraseña", email);
        }
    }

    public List<UsuarioResponseDto> listarTodosLosUsuarios() {
        List<Usuario> usuarios = usuarioRepository.findAll();
        return usuarios.stream()
                .map(this::convertirADto)
                .toList();
    }

    /**
     * Listar todos los analistas activos disponibles
     */
    public List<UsuarioResponseDto> listarAnalistas() {
        List<Usuario> analistas = usuarioRepository.findByRolAppAndDeletedAtIsNull(Usuario.RolApp.ANALISTA);
        log.info("Encontrados {} analistas activos", analistas.size());
        if (analistas.isEmpty()) {
            log.warn("No se encontraron analistas activos en la base de datos");
        }
        return analistas.stream()
                .map(this::convertirADto)
                .sorted((a, b) -> a.getNombre().compareToIgnoreCase(b.getNombre()))
                .toList();
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
        
        // Enviar notificación al usuario sobre el cambio de rol
        try {
            boolean emailEnviado = emailService.enviarEmailNotificacionCambioRol(
                usuario.getEmail(),
                usuario.getNombre(),
                rolAnterior != null ? rolAnterior.toString() : "N/A",
                cambioRolDto.getRolApp() != null ? cambioRolDto.getRolApp().toString() : "N/A"
            );
            if (emailEnviado) {
                log.info("Email de notificación de cambio de rol enviado al usuario: {}", usuario.getEmail());
            } else {
                log.warn("No se pudo enviar email de notificación de cambio de rol al usuario: {}", usuario.getEmail());
            }
        } catch (Exception e) {
            log.error("Error al enviar email de notificación de cambio de rol: {}", e.getMessage());
            // No lanzar excepción para no interrumpir el flujo
        }
    }

    public PagedUsuarioResponseDto listarUsuariosPaginados(int page, int size, UsuarioFilters filters) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(FIELD_CREATED_AT).descending());

        Specification<Usuario> spec = construirUsuarioSpec(filters);

        Page<Usuario> pageResult = usuarioRepository.findAll(spec, pageable);

        List<UsuarioResponseDto> content = pageResult.getContent()
                .stream()
                .map(this::convertirADto)
                .toList();

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

    /**
     * Construye una Specification compuesta a partir de los filtros opcionales
     * de búsqueda, rol, verificación, actividad y rango de fechas. Devuelve
     * {@code null} si no se aplica ningún filtro.
     */
    private Specification<Usuario> construirUsuarioSpec(UsuarioFilters filters) {
        Specification<Usuario> spec = null;
        spec = combinarSpec(spec, buildSearchSpec(filters.search()));
        spec = combinarSpec(spec, buildRolSpec(filters.rol()));
        spec = combinarSpec(spec, buildVerificadoSpec(filters.verificado()));
        spec = combinarSpec(spec, buildActivoSpec(filters.activo()));
        spec = combinarSpec(spec, buildFechaDesdeSpec(filters.fechaDesde()));
        spec = combinarSpec(spec, buildFechaHastaSpec(filters.fechaHasta()));
        return spec;
    }

    private Specification<Usuario> combinarSpec(Specification<Usuario> base, Specification<Usuario> extra) {
        if (extra == null) {
            return base;
        }
        return base == null ? extra : base.and(extra);
    }

    private Specification<Usuario> buildSearchSpec(String search) {
        if (search == null || search.trim().isEmpty()) {
            return null;
        }
        String searchLower = search.toLowerCase();
        return (root, query, cb) ->
                cb.or(
                        cb.like(cb.lower(root.get("email")), "%" + searchLower + "%"),
                        cb.like(cb.lower(root.get("nombre")), "%" + searchLower + "%")
                );
    }

    private Specification<Usuario> buildRolSpec(String rol) {
        if (rol == null || rol.trim().isEmpty()) {
            return null;
        }
        try {
            Usuario.RolApp rolApp = Usuario.RolApp.valueOf(rol.toUpperCase());
            return (root, query, cb) -> cb.equal(root.get(FIELD_ROL_APP), rolApp);
        } catch (IllegalArgumentException e) {
            return null; // Rol inválido: no aplicar filtro
        }
    }

    private Specification<Usuario> buildVerificadoSpec(Boolean verificado) {
        if (verificado == null) {
            return null;
        }
        return (root, query, cb) -> cb.equal(root.get(FIELD_VERIFICADO), verificado);
    }

    private Specification<Usuario> buildActivoSpec(Boolean activo) {
        if (activo == null) {
            return null;
        }
        return (root, query, cb) ->
                Boolean.TRUE.equals(activo) ? cb.isNull(root.get(FIELD_DELETED_AT))
                                            : cb.isNotNull(root.get(FIELD_DELETED_AT));
    }

    private Specification<Usuario> buildFechaDesdeSpec(LocalDate fechaDesde) {
        if (fechaDesde == null) {
            return null;
        }
        Instant fechaDesdeInstant = fechaDesde.atStartOfDay(ZoneOffset.UTC).toInstant();
        return (root, query, cb) -> cb.greaterThanOrEqualTo(root.get(FIELD_CREATED_AT), fechaDesdeInstant);
    }

    private Specification<Usuario> buildFechaHastaSpec(LocalDate fechaHasta) {
        if (fechaHasta == null) {
            return null;
        }
        Instant fechaHastaInstant = fechaHasta.atTime(23, 59, 59).atZone(ZoneOffset.UTC).toInstant();
        return (root, query, cb) -> cb.lessThanOrEqualTo(root.get(FIELD_CREATED_AT), fechaHastaInstant);
    }

    public UsuarioResponseDto toggleUsuarioActivo(Long id) {
        Usuario usuario = usuarioRepository.findById(id)
                .orElseThrow(() -> new UsuarioNotFoundException(id));
        
        boolean estabaActivo = usuario.getDeletedAt() == null;
        boolean activado;
        
        if (estabaActivo) {
            // Desactivar (soft delete)
            usuario.setDeletedAt(Instant.now());
            activado = false;
            log.info("Usuario ID {} ({}) desactivado", id, usuario.getEmail());
        } else {
            // Activar
            usuario.setDeletedAt(null);
            activado = true;
            log.info("Usuario ID {} ({}) activado", id, usuario.getEmail());
        }
        
        Usuario usuarioActualizado = usuarioRepository.save(usuario);
        
        // Enviar notificación al usuario sobre el cambio de estado
        try {
            boolean emailEnviado = emailService.enviarEmailNotificacionCambioEstado(
                usuario.getEmail(),
                usuario.getNombre(),
                activado
            );
            if (emailEnviado) {
                log.info("Email de notificación de cambio de estado enviado al usuario: {}", usuario.getEmail());
            } else {
                log.warn("No se pudo enviar email de notificación de cambio de estado al usuario: {}", usuario.getEmail());
            }
        } catch (Exception e) {
            log.error("Error al enviar email de notificación de cambio de estado: {}", e.getMessage());
            // No lanzar excepción para no interrumpir el flujo
        }
        
        return convertirADto(usuarioActualizado);
    }

    @Cacheable(value = "usuarioStats", key = "'stats'")
    public UsuarioStatsDto obtenerEstadisticas() {
        log.info("Generando estadísticas de usuarios");

        Long totalUsuarios = usuarioRepository.count();
        Long totalActivos = contarPor((root, query, cb) -> cb.isNull(root.get(FIELD_DELETED_AT)));
        Long totalInactivos = contarPor((root, query, cb) -> cb.isNotNull(root.get(FIELD_DELETED_AT)));
        Long totalVerificados = contarPor((root, query, cb) -> cb.equal(root.get(FIELD_VERIFICADO), true));
        Long totalNoVerificados = contarPor((root, query, cb) -> cb.equal(root.get(FIELD_VERIFICADO), false));

        Map<String, Long> usuariosPorRol = contarUsuariosPorRol();
        Map<String, Long> usuariosPorProveedor = contarUsuariosPorProveedor();

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

    private Long contarPor(Specification<Usuario> spec) {
        return usuarioRepository.count(spec);
    }

    private Map<String, Long> contarUsuariosPorRol() {
        Map<String, Long> usuariosPorRol = new HashMap<>();
        for (Usuario.RolApp rol : Usuario.RolApp.values()) {
            Specification<Usuario> rolSpec = (root, query, cb) -> cb.equal(root.get(FIELD_ROL_APP), rol);
            usuariosPorRol.put(rol.name(), usuarioRepository.count(rolSpec));
        }
        return usuariosPorRol;
    }

    private Map<String, Long> contarUsuariosPorProveedor() {
        Map<String, Long> usuariosPorProveedor = new HashMap<>();
        usuariosPorProveedor.put("LOCAL",
                contarPor((root, query, cb) -> cb.isNotNull(root.get("password"))));
        usuariosPorProveedor.put("GOOGLE",
                contarPor((root, query, cb) -> cb.equal(root.get("oauthProv"), "GOOGLE")));
        return usuariosPorProveedor;
    }
    
    public UsuarioResponseDto actualizarUsuarioPorAdmin(Long id, UsuarioAdminUpdateDto dto) {
        Usuario usuario = usuarioRepository.findById(id)
                .orElseThrow(() -> new UsuarioNotFoundException(id));

        String emailAnterior = usuario.getEmail();

        boolean cambioEmail = aplicarCambioEmailAdmin(usuario, dto.getEmail());
        boolean cambioNombre = aplicarCambioNombreAdmin(usuario, dto.getNombre());

        Usuario usuarioActualizado = usuarioRepository.save(usuario);

        logCambiosAdmin(id, cambioEmail, cambioNombre);

        if (cambioEmail) {
            notificarCambioEmail(emailAnterior, dto.getEmail(), usuarioActualizado.getNombre());
        }

        return convertirADto(usuarioActualizado);
    }

    private boolean aplicarCambioEmailAdmin(Usuario usuario, String nuevoEmail) {
        if (nuevoEmail == null || nuevoEmail.trim().isEmpty() || usuario.getEmail().equals(nuevoEmail)) {
            return false;
        }
        if (usuarioRepository.existsByEmail(nuevoEmail)) {
            throw new AuthenticationException("El email ya está registrado por otro usuario");
        }
        usuario.setEmail(nuevoEmail);
        return true;
    }

    private boolean aplicarCambioNombreAdmin(Usuario usuario, String nuevoNombre) {
        if (nuevoNombre == null || nuevoNombre.trim().isEmpty() || usuario.getNombre().equals(nuevoNombre)) {
            return false;
        }
        usuario.setNombre(nuevoNombre);
        return true;
    }

    private void logCambiosAdmin(Long id, boolean cambioEmail, boolean cambioNombre) {
        if (cambioEmail && cambioNombre) {
            log.info("Admin actualizó usuario ID {} (email y nombre)", id);
        } else if (cambioEmail) {
            log.info("Admin actualizó email del usuario ID {}", id);
        } else if (cambioNombre) {
            log.info("Admin actualizó nombre del usuario ID {}", id);
        }
    }

    private void notificarCambioEmail(String emailAnterior, String emailNuevo, String nombreActualizado) {
        try {
            boolean emailEnviado = emailService.enviarEmailNotificacionCambioEmail(
                    emailAnterior,
                    emailNuevo,
                    nombreActualizado != null ? nombreActualizado : "Usuario"
            );
            if (emailEnviado) {
                log.info("Email de notificación de cambio de email enviado al usuario (viejo y nuevo email)");
            } else {
                log.warn("No se pudo enviar email de notificación de cambio de email");
            }
        } catch (Exception e) {
            log.error("Error al enviar email de notificación de cambio de email: {}", e.getMessage());
        }
    }
    
    public boolean reenviarVerificacionPorAdmin(Long id) {
        Usuario usuario = usuarioRepository.findById(id)
                .orElseThrow(() -> new UsuarioNotFoundException(id));
        
        // Solo reenviar si el usuario no está verificado
        if (Boolean.TRUE.equals(usuario.getVerificado())) {
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
    
    public List<UsuarioResponseDto> obtenerUsuariosParaExport(UsuarioFilters filters) {
        Specification<Usuario> spec = construirUsuarioSpec(filters);

        List<Usuario> usuarios = spec != null ? usuarioRepository.findAll(spec) : usuarioRepository.findAll();

        // Limitar a 10,000 registros para evitar problemas de memoria
        if (usuarios.size() > 10000) {
            usuarios = usuarios.subList(0, 10000);
            log.warn("Export limitado a 10,000 registros de {} totales", usuarios.size());
        }

        return usuarios.stream()
                .map(this::convertirADto)
                .toList();
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

    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    private String generarPasswordTemporal() {
        String caracteres = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        StringBuilder password = new StringBuilder();

        for (int i = 0; i < 8; i++) {
            password.append(caracteres.charAt(SECURE_RANDOM.nextInt(caracteres.length())));
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
                usuario.getPassword() != null && !usuario.getPassword().isEmpty(), // hasPassword
                usuario.getCreatedAt(),
                usuario.getUpdatedAt()
        );
    }
}
