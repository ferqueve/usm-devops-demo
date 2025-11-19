package com.utec.backend.audit;

import com.utec.backend.model.Usuario;
import com.utec.backend.service.AuditService;
import jakarta.persistence.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationContext;
import org.springframework.stereotype.Component;

import java.lang.reflect.Field;

/**
 * Listener JPA para registrar automáticamente cambios en entidades.
 * 
 * IMPORTANTE: Este listener NO hace consultas a BD. El usuario se obtiene
 * del AuditContext (ThreadLocal) que es establecido por AuditAspect
 * antes de ejecutar repository.save().
 * 
 * Esto evita problemas de flush de Hibernate cuando se hacen consultas
 * dentro de listeners JPA.
 */
@Slf4j
@Component
public class AuditEntityListener {
    
    private static ApplicationContext applicationContext;
    
    @Autowired
    public void setApplicationContext(ApplicationContext applicationContext) {
        AuditEntityListener.applicationContext = applicationContext;
    }
    
    private static AuditService getAuditService() {
        if (applicationContext == null) {
            return null;
        }
        try {
            return applicationContext.getBean(AuditService.class);
        } catch (Exception e) {
            log.warn("No se pudo obtener AuditService: {}", e.getMessage());
            return null;
        }
    }
    
    private static Long getIdFromEntity(Object entity) {
        try {
            Field idField = entity.getClass().getDeclaredField("id");
            idField.setAccessible(true);
            Object id = idField.get(entity);
            if (id instanceof Long) {
                return (Long) id;
            } else if (id instanceof Integer) {
                return ((Integer) id).longValue();
            }
        } catch (Exception e) {
            log.warn("No se pudo obtener ID de la entidad: {}", e.getMessage());
        }
        return null;
    }
    
    private static String getEntityName(Object entity) {
        String className = entity.getClass().getSimpleName();
        // Convertir CamelCase a nombre más legible
        return className;
    }
    
    /**
     * Obtener usuario del AuditContext (ThreadLocal)
     * NO hace consultas a BD - el usuario ya fue establecido por AuditAspect
     */
    private static Usuario getCurrentUser() {
        Usuario usuario = AuditContext.getCurrentUser();
        if (usuario == null) {
            log.debug("No hay usuario en AuditContext (ThreadLocal)");
        } else {
            log.debug("Usuario obtenido de AuditContext: {} (ID: {})", usuario.getEmail(), usuario.getId());
        }
        return usuario;
    }
    
    @PostPersist
    public void postPersist(Object entity) {
        AuditService auditService = getAuditService();
        if (auditService == null) {
            log.debug("AuditService no disponible, saltando auditoría");
            return;
        }
        
        try {
            // En @PostPersist el ID ya está disponible
            Long id = getIdFromEntity(entity);
            if (id == null) {
                log.warn("No se pudo obtener ID de entidad {} en postPersist, saltando auditoría", 
                        entity != null ? entity.getClass().getSimpleName() : "null");
                return;
            }
            
            String entidad = getEntityName(entity);
            // Obtener usuario del ThreadLocal (establecido por AuditAspect)
            // NO hacer consultas a BD aquí
            Usuario usuario = getCurrentUser();
            
            auditService.logCreate(entidad, id, usuario, entity);
        } catch (Exception e) {
            // Fail-safe: nunca lanzar excepciones que afecten la transacción principal
            log.error("Error en postPersist audit para {}: {}", 
                    entity != null ? entity.getClass().getSimpleName() : "null", e.getMessage(), e);
        }
    }
    
    @PreUpdate
    public void preUpdate(Object entity) {
        // Guardar estado anterior antes de actualizar
        // Esto se manejará mejor con un interceptor que capture el estado anterior
        // Por ahora no implementamos esto para evitar complejidad
    }
    
    @PostUpdate
    public void postUpdate(Object entity) {
        AuditService auditService = getAuditService();
        if (auditService == null) {
            log.debug("AuditService no disponible, saltando auditoría");
            return;
        }
        
        try {
            Long id = getIdFromEntity(entity);
            if (id == null) {
                log.warn("No se pudo obtener ID de entidad {} en postUpdate, saltando auditoría",
                        entity != null ? entity.getClass().getSimpleName() : "null");
                return;
            }
            
            String entidad = getEntityName(entity);
            // Obtener usuario del ThreadLocal (establecido por AuditAspect)
            // NO hacer consultas a BD aquí
            Usuario usuario = getCurrentUser();
            
            // Para UPDATE, no tenemos el estado anterior fácilmente aquí
            // Se registrará solo el estado nuevo
            auditService.logUpdate(entidad, id, usuario, null, entity);
        } catch (Exception e) {
            // Fail-safe: nunca lanzar excepciones que afecten la transacción principal
            log.error("Error en postUpdate audit para {}: {}", 
                    entity != null ? entity.getClass().getSimpleName() : "null", e.getMessage(), e);
        }
    }
    
    @PreRemove
    public void preRemove(Object entity) {
        AuditService auditService = getAuditService();
        if (auditService == null) {
            log.debug("AuditService no disponible, saltando auditoría");
            return;
        }
        
        try {
            Long id = getIdFromEntity(entity);
            if (id == null) {
                log.warn("No se pudo obtener ID de entidad {} en preRemove, saltando auditoría",
                        entity != null ? entity.getClass().getSimpleName() : "null");
                return;
            }
            
            String entidad = getEntityName(entity);
            // Obtener usuario del ThreadLocal (establecido por AuditAspect)
            // NO hacer consultas a BD aquí
            Usuario usuario = getCurrentUser();
            
            auditService.logDelete(entidad, id, usuario, entity);
        } catch (Exception e) {
            // Fail-safe: nunca lanzar excepciones que afecten la transacción principal
            log.error("Error en preRemove audit para {}: {}", 
                    entity != null ? entity.getClass().getSimpleName() : "null", e.getMessage(), e);
        }
    }
}

