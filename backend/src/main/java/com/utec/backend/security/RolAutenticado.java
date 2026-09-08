package com.utec.backend.security;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;

/**
 * Rol del usuario autenticado, sin el prefijo de Spring.
 *
 * Hay que filtrar por el prefijo: las autoridades incluyen el rol y todos los
 * permisos, y Spring las guarda ordenadas alfabeticamente, asi que quedarse con
 * la primera devuelve un permiso ("PERM_auditoria:ver") y no el rol.
 */
public final class RolAutenticado {

    private static final String PREFIJO = "ROLE_";

    private RolAutenticado() {
    }

    /** Devuelve el rol ("ADMIN", "DOCENTE", ...) o cadena vacia si no hay. */
    public static String de(Authentication authentication) {
        if (authentication == null) {
            return "";
        }
        return authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .filter(a -> a.startsWith(PREFIJO))
                .findFirst()
                .map(a -> a.substring(PREFIJO.length()))
                .orElse("");
    }
}
