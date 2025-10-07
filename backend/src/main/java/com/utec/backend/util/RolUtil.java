package com.utec.backend.util;

import com.utec.backend.model.entity.Usuario;
import lombok.extern.slf4j.Slf4j;

/**
 * Utilidad para determinar el rol de un usuario basado en su email
 */
@Slf4j
public class RolUtil {

    // Dominios de UTEC que otorgan rol de ESTUDIANTE
    private static final String DOMINIO_ESTUDIANTES = "@estudiantes.utec.edu.uy";
    private static final String DOMINIO_UTEC = "@utec.edu.uy";

    /**
     * Determina el rol de un usuario basado en el dominio de su email
     * 
     * @param email El email del usuario
     * @return RolApp.ESTUDIANTE si el email termina en @estudiantes.utec.edu.uy o @utec.edu.uy,
     *         RolApp.EXTERNO en caso contrario
     */
    public static Usuario.RolApp determinarRolPorEmail(String email) {
        if (email == null || email.trim().isEmpty()) {
            log.warn("Email nulo o vacío, asignando rol EXTERNO por defecto");
            return Usuario.RolApp.EXTERNO;
        }

        String emailLower = email.toLowerCase().trim();
        
        // Verificar si es email de estudiantes de UTEC
        if (emailLower.endsWith(DOMINIO_ESTUDIANTES) || emailLower.endsWith(DOMINIO_UTEC)) {
            log.info("Email {} identificado como estudiante UTEC, asignando rol ESTUDIANTE", email);
            return Usuario.RolApp.ESTUDIANTE;
        }
        
        log.info("Email {} no es de dominio UTEC, asignando rol EXTERNO", email);
        return Usuario.RolApp.EXTERNO;
    }

    /**
     * Verifica si un email pertenece a un estudiante de UTEC
     * 
     * @param email El email a verificar
     * @return true si es email de estudiante UTEC, false en caso contrario
     */
    public static boolean esEstudianteUtec(String email) {
        if (email == null || email.trim().isEmpty()) {
            return false;
        }
        
        String emailLower = email.toLowerCase().trim();
        return emailLower.endsWith(DOMINIO_ESTUDIANTES) || emailLower.endsWith(DOMINIO_UTEC);
    }

    /**
     * Verifica si un email pertenece a un usuario externo
     * 
     * @param email El email a verificar
     * @return true si es email externo, false si es de UTEC
     */
    public static boolean esUsuarioExterno(String email) {
        return !esEstudianteUtec(email);
    }
}
