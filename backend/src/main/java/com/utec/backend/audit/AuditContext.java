package com.utec.backend.audit;

import com.utec.backend.model.Usuario;
import com.utec.backend.repository.UsuarioRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

/**
 * Contexto ThreadLocal para almacenar el usuario actual durante operaciones de auditoría.
 * Evita hacer consultas a BD dentro de listeners JPA que pueden causar problemas de flush.
 */
@Slf4j
public class AuditContext {
    
    private static final ThreadLocal<Usuario> currentUser = new ThreadLocal<>();
    
    /**
     * Establecer el usuario actual en el contexto ThreadLocal
     */
    public static void setCurrentUser(Usuario usuario) {
        currentUser.set(usuario);
        if (usuario != null) {
            log.debug("Usuario establecido en AuditContext: {} (ID: {})", usuario.getEmail(), usuario.getId());
        }
    }
    
    /**
     * Obtener el usuario actual del contexto ThreadLocal
     * @return Usuario actual o null si no está establecido
     */
    public static Usuario getCurrentUser() {
        return currentUser.get();
    }
    
    /**
     * Limpiar el contexto ThreadLocal
     * IMPORTANTE: Llamar siempre en finally para evitar memory leaks
     */
    public static void clear() {
        Usuario usuario = currentUser.get();
        if (usuario != null) {
            log.debug("Limpiando AuditContext para usuario: {}", usuario.getEmail());
        }
        currentUser.remove();
    }
    
    /**
     * Obtener el usuario actual del SecurityContext
     * Este método debe usarse SOLO en servicios/aspects, NUNCA en listeners JPA
     * 
     * @param usuarioRepository Repositorio para buscar el usuario por email
     * @return Usuario encontrado o null si no está autenticado o no se encuentra
     */
    public static Usuario getCurrentUserFromSecurityContext(UsuarioRepository usuarioRepository) {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication == null || !authentication.isAuthenticated()) {
                log.debug("No hay Authentication en SecurityContext");
                return null;
            }
            
            String email = authentication.getName();
            if (email == null || email.isEmpty()) {
                log.debug("Email es null o vacío en Authentication");
                return null;
            }
            
            log.debug("Obteniendo usuario del SecurityContext con email: {}", email);
            Usuario usuario = usuarioRepository.findByEmail(email).orElse(null);
            
            if (usuario != null) {
                log.debug("Usuario obtenido del SecurityContext: {} (ID: {})", usuario.getEmail(), usuario.getId());
            } else {
                log.warn("No se encontró usuario con email: {}", email);
            }
            
            return usuario;
        } catch (Exception e) {
            log.warn("Error al obtener usuario del SecurityContext: {}", e.getMessage());
            return null;
        }
    }
}

