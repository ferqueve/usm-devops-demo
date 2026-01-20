package com.utec.backend.security;

import org.springframework.security.access.PermissionEvaluator;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.stereotype.Component;

import java.io.Serializable;

/**
 * Evaluador de permisos personalizado para Spring Security.
 * Verifica si el usuario autenticado tiene el permiso solicitado
 * basándose en el mapeo centralizado de RolePermissions.
 *
 * Uso en controllers:
 *   @PreAuthorize("hasPermission(null, 'reserva:crear')")
 */
@Component
public class CustomPermissionEvaluator implements PermissionEvaluator {

    private static final String ROLE_PREFIX = "ROLE_";

    @Override
    public boolean hasPermission(Authentication auth, Object targetDomainObject, Object permission) {
        if (auth == null || permission == null) {
            return false;
        }
        return checkPermission(auth, permission.toString());
    }

    @Override
    public boolean hasPermission(Authentication auth, Serializable targetId, String targetType, Object permission) {
        if (auth == null || permission == null) {
            return false;
        }
        return checkPermission(auth, permission.toString());
    }

    /**
     * Verifica si el usuario tiene el permiso solicitado.
     * Busca el rol del usuario y consulta RolePermissions para verificar.
     */
    private boolean checkPermission(Authentication auth, String permission) {
        for (GrantedAuthority authority : auth.getAuthorities()) {
            String authorityName = authority.getAuthority();

            // Extraer el nombre del rol (sin el prefijo ROLE_)
            if (authorityName.startsWith(ROLE_PREFIX)) {
                String role = authorityName.substring(ROLE_PREFIX.length());

                // Consultar el mapeo centralizado
                if (RolePermissions.hasPermission(role, permission)) {
                    return true;
                }
            }
        }
        return false;
    }
}
