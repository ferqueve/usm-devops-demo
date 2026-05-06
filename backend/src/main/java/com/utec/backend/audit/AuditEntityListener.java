package com.utec.backend.audit;

import com.utec.backend.model.Usuario;
import com.utec.backend.service.AuditService;
import jakarta.persistence.PostPersist;
import jakarta.persistence.PostUpdate;
import jakarta.persistence.PreRemove;
import jakarta.persistence.PreUpdate;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.BeanWrapperImpl;

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
public class AuditEntityListener {

    private static final String MSG_AUDIT_SERVICE_NO_DISPONIBLE = "AuditService no disponible, saltando auditoría";
    private static final String ID_PROPERTY = "id";

    private static AuditService getAuditService() {
        return AuditBeanHolder.getAuditService();
    }

    /**
     * Lee la propiedad {@code id} mediante el {@link BeanWrapperImpl} de Spring,
     * que utiliza los getters publicados por la entidad. Evita el acceso a
     * campos privados por reflexión.
     */
    private static Long getIdFromEntity(Object entity) {
        if (entity == null) {
            return null;
        }
        try {
            BeanWrapperImpl wrapper = new BeanWrapperImpl(entity);
            if (!wrapper.isReadableProperty(ID_PROPERTY)) {
                return null;
            }
            Object id = wrapper.getPropertyValue(ID_PROPERTY);
            if (id instanceof Long longId) {
                return longId;
            } else if (id instanceof Integer integerId) {
                return integerId.longValue();
            }
        } catch (Exception e) {
            log.warn("No se pudo obtener ID de la entidad: {}", e.getMessage());
        }
        return null;
    }

    private static String getEntityName(Object entity) {
        return entity.getClass().getSimpleName();
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
            log.debug(MSG_AUDIT_SERVICE_NO_DISPONIBLE);
            return;
        }

        try {
            Long id = getIdFromEntity(entity);
            if (id == null) {
                log.warn("No se pudo obtener ID de entidad {} en postPersist, saltando auditoría",
                        entity != null ? entity.getClass().getSimpleName() : "null");
                return;
            }

            String entidad = getEntityName(entity);
            Usuario usuario = getCurrentUser();
            auditService.logCreate(entidad, id, usuario, entity);
        } catch (Exception e) {
            log.error("Error en postPersist audit para {}: {}",
                    entity != null ? entity.getClass().getSimpleName() : "null", e.getMessage(), e);
        }
    }

    @PreUpdate
    public void preUpdate(Object entity) {
        try {
            Object previousState = createSnapshot(entity);
            AuditContext.setPreviousState(entity, previousState);
            log.debug("Estado anterior capturado para {}", entity.getClass().getSimpleName());
        } catch (Exception e) {
            log.warn("Error al capturar estado anterior en preUpdate: {}", e.getMessage());
        }
    }

    /**
     * Crear un snapshot (copia) del estado actual de una entidad
     */
    private Object createSnapshot(Object entity) {
        // extractSimpleFields en AuditService ya maneja la extracción de campos
        return entity;
    }

    @PostUpdate
    public void postUpdate(Object entity) {
        AuditService auditService = getAuditService();
        if (auditService == null) {
            log.debug(MSG_AUDIT_SERVICE_NO_DISPONIBLE);
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
            Usuario usuario = getCurrentUser();
            Object previousState = AuditContext.getPreviousState(entity);

            auditService.logUpdate(entidad, id, usuario, previousState, entity);
            AuditContext.clearPreviousState(entity);
        } catch (Exception e) {
            log.error("Error en postUpdate audit para {}: {}",
                    entity != null ? entity.getClass().getSimpleName() : "null", e.getMessage(), e);
        }
    }

    @PreRemove
    public void preRemove(Object entity) {
        AuditService auditService = getAuditService();
        if (auditService == null) {
            log.debug(MSG_AUDIT_SERVICE_NO_DISPONIBLE);
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
            Usuario usuario = getCurrentUser();
            auditService.logDelete(entidad, id, usuario, entity);
        } catch (Exception e) {
            log.error("Error en preRemove audit para {}: {}",
                    entity != null ? entity.getClass().getSimpleName() : "null", e.getMessage(), e);
        }
    }
}
