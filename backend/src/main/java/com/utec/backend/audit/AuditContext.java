package com.utec.backend.audit;

import com.utec.backend.model.Usuario;
import com.utec.backend.repository.UsuarioRepository;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.HashMap;
import java.util.Map;

/**
 * Contexto ThreadLocal para almacenar el usuario actual durante operaciones de auditoría.
 * Evita hacer consultas a BD dentro de listeners JPA que pueden causar problemas de flush.
 */
@Slf4j
public class AuditContext {

    private static final ThreadLocal<Usuario> currentUser = new ThreadLocal<>();
    private static final ThreadLocal<Map<Object, Object>> previousStates = new ThreadLocal<>();
    private static final ThreadLocal<RequestInfo> requestInfo = new ThreadLocal<>();

    /**
     * Información de la request HTTP para auditoría
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RequestInfo {
        private String ipAddress;
        private String httpMethod;
        private String endpoint;
        private String userAgent;
    }
    
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
        previousStates.remove();
        requestInfo.remove();
    }

    /**
     * Guardar el estado anterior de una entidad antes de actualizar
     */
    public static void setPreviousState(Object entity, Object state) {
        Map<Object, Object> states = previousStates.get();
        if (states == null) {
            states = new HashMap<>();
            previousStates.set(states);
        }
        states.put(entity, state);
        log.debug("Estado anterior guardado para entidad: {}", entity.getClass().getSimpleName());
    }

    /**
     * Obtener el estado anterior de una entidad
     */
    public static Object getPreviousState(Object entity) {
        Map<Object, Object> states = previousStates.get();
        if (states == null) {
            return null;
        }
        return states.get(entity);
    }

    /**
     * Limpiar el estado anterior de una entidad
     */
    public static void clearPreviousState(Object entity) {
        Map<Object, Object> states = previousStates.get();
        if (states != null) {
            states.remove(entity);
        }
    }

    /**
     * Establecer información de la request HTTP
     */
    public static void setRequestInfo(String ipAddress, String httpMethod, String endpoint, String userAgent) {
        RequestInfo info = new RequestInfo(ipAddress, httpMethod, endpoint, userAgent);
        requestInfo.set(info);
        log.debug("Request info establecida: {} {} desde {}", httpMethod, endpoint, ipAddress);
    }

    /**
     * Obtener información de la request HTTP
     */
    public static RequestInfo getRequestInfo() {
        return requestInfo.get();
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

