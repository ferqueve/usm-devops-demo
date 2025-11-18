package com.utec.backend.security;

import org.springframework.security.access.PermissionEvaluator;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.stereotype.Component;

import java.io.Serializable;

/**
 * Evaluador de permisos personalizado para Spring Security.
 * Verifica si el usuario autenticado tiene el permiso solicitado.
 */
@Component
public class CustomPermissionEvaluator implements PermissionEvaluator {

    private static final String PERMISSION_PREFIX = "PERMISSION_";

    @Override
    public boolean hasPermission(Authentication auth, Object targetDomainObject, Object permission) {
        if (auth == null || permission == null) {
            return false;
        }

        String permissionString = permission.toString();
        return hasAuthority(auth, permissionString);
    }

    @Override
    public boolean hasPermission(Authentication auth, Serializable targetId, String targetType, Object permission) {
        if (auth == null || permission == null) {
            return false;
        }

        String permissionString = permission.toString();
        return hasAuthority(auth, permissionString);
    }

    /**
     * Verifica si el usuario tiene la autoridad (permiso) especificada
     */
    private boolean hasAuthority(Authentication auth, String permission) {
        String permissionAuthority = PERMISSION_PREFIX + permission;

        for (GrantedAuthority authority : auth.getAuthorities()) {
            String authorityName = authority.getAuthority();
            
            // Verificar si coincide exactamente con el permiso
            if (authorityName.equals(permissionAuthority)) {
                return true;
            }
            
            // ADMIN tiene todos los permisos, verificar si es ADMIN
            if (authorityName.equals("ROLE_ADMIN")) {
                return true;
            }
        }

        return false;
    }
}

