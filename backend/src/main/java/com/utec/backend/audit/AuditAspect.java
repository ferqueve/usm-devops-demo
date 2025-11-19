package com.utec.backend.audit;

import com.utec.backend.model.*;
import com.utec.backend.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

/**
 * Aspect para interceptar automáticamente los métodos save() de repositorios
 * y establecer el usuario actual en AuditContext antes de que se ejecute el listener.
 * 
 * Esto evita hacer consultas a BD dentro de listeners JPA que pueden causar
 * problemas de flush de Hibernate.
 */
@Aspect
@Component
@RequiredArgsConstructor
@Slf4j
@Order(1) // Ejecutar antes que otros aspectos
public class AuditAspect {
    
    private final UsuarioRepository usuarioRepository;
    
    /**
     * Interceptar save() de repositorios de entidades auditadas
     * Pointcut: cualquier método save() en repositorios del paquete com.utec.backend.repository
     */
    @Around("execution(* com.utec.backend.repository.*Repository.save(..)) && args(entity)")
    public Object interceptSave(ProceedingJoinPoint joinPoint, Object entity) throws Throwable {
        // Verificar si la entidad es auditada
        if (!isAuditedEntity(entity)) {
            return joinPoint.proceed();
        }
        
        Usuario usuario = null;
        try {
            // Obtener usuario del SecurityContext ANTES de ejecutar save()
            // En este punto el SecurityContext SÍ está disponible
            usuario = AuditContext.getCurrentUserFromSecurityContext(usuarioRepository);
            
            // Establecer usuario en ThreadLocal para que el listener lo use
            AuditContext.setCurrentUser(usuario);
            
            if (usuario != null) {
                log.debug("AuditAspect: Usuario {} establecido para auditoría de {}", 
                        usuario.getEmail(), entity.getClass().getSimpleName());
            } else {
                log.debug("AuditAspect: No hay usuario autenticado para auditoría de {}", 
                        entity.getClass().getSimpleName());
            }
            
            // Ejecutar el método save() original
            // El listener JPA se ejecutará después y leerá el usuario del ThreadLocal
            return joinPoint.proceed();
            
        } catch (Throwable e) {
            // Re-lanzar la excepción para no afectar el flujo normal
            throw e;
        } finally {
            // IMPORTANTE: Limpiar el ThreadLocal siempre, incluso si hay error
            // Esto previene memory leaks
            AuditContext.clear();
        }
    }
    
    /**
     * Verificar si una entidad tiene el listener de auditoría
     */
    private boolean isAuditedEntity(Object entity) {
        if (entity == null) {
            return false;
        }
        
        // Verificar si es una de nuestras entidades auditadas conocidas
        return entity instanceof Reserva ||
               entity instanceof Usuario ||
               entity instanceof Espacio ||
               entity instanceof InventarioItem ||
               entity instanceof Carrera ||
               entity instanceof TipoEspacio ||
               entity instanceof TipoElemento ||
               entity instanceof ReservaItemSolicitado;
    }
}

