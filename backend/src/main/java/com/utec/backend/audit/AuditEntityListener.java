package com.utec.backend.audit;

import com.utec.backend.model.Usuario;
import com.utec.backend.service.AuditService;
import jakarta.persistence.PostPersist;
import jakarta.persistence.PostUpdate;
import jakarta.persistence.PreRemove;
import jakarta.persistence.PreUpdate;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.BeanWrapperImpl;

import java.util.function.BiConsumer;

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

    private static String safeEntityName(Object entity) {
        return entity != null ? entity.getClass().getSimpleName() : "null";
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

    /**
     * Estructura común a los handlers {@code postPersist}, {@code postUpdate} y
     * {@code preRemove}: validar que el {@link AuditService} esté disponible,
     * resolver el ID de la entidad, capturar el nombre de la entidad y el
     * usuario, e invocar la operación de auditoría correspondiente. Si algo
     * falla, se loguea el error pero no se propaga la excepción para no
     * romper el flujo principal de persistencia.
     *
     * @param entity        entidad sobre la que se disparó el evento JPA
     * @param eventName     nombre del evento (usado solo en logs de error)
     * @param auditAction   acción de auditoría a ejecutar contra el {@link AuditService},
     *                      recibe el nombre de la entidad y su ID resuelto
     */
    private static void dispatchAuditEvent(Object entity, String eventName,
                                           BiConsumer<String, Long> auditAction) {
        AuditService auditService = getAuditService();
        if (auditService == null) {
            log.debug(MSG_AUDIT_SERVICE_NO_DISPONIBLE);
            return;
        }

        try {
            Long id = getIdFromEntity(entity);
            if (id == null) {
                log.warn("No se pudo obtener ID de entidad {} en {}, saltando auditoría",
                        safeEntityName(entity), eventName);
                return;
            }

            String entidad = getEntityName(entity);
            auditAction.accept(entidad, id);
        } catch (Exception e) {
            log.error("Error en {} audit para {}: {}", eventName, safeEntityName(entity), e.getMessage(), e);
        }
    }

    @PostPersist
    public void postPersist(Object entity) {
        dispatchAuditEvent(entity, "postPersist", (entidad, id) -> {
            Usuario usuario = getCurrentUser();
            getAuditService().logCreate(entidad, id, usuario, entity);
        });
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
        dispatchAuditEvent(entity, "postUpdate", (entidad, id) -> {
            Usuario usuario = getCurrentUser();
            Object previousState = AuditContext.getPreviousState(entity);
            getAuditService().logUpdate(entidad, id, usuario, previousState, entity);
            AuditContext.clearPreviousState(entity);
        });
    }

    @PreRemove
    public void preRemove(Object entity) {
        dispatchAuditEvent(entity, "preRemove", (entidad, id) -> {
            Usuario usuario = getCurrentUser();
            getAuditService().logDelete(entidad, id, usuario, entity);
        });
    }
}
