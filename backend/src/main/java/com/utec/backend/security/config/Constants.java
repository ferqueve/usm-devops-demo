package com.utec.backend.security.config;

import lombok.AccessLevel;
import lombok.NoArgsConstructor;

/**
 * Constantes centralizadas para los roles del sistema
 */
@NoArgsConstructor(access = AccessLevel.PRIVATE)
public final class Constants {

    // ===== ROLES DEL SISTEMA =====
    public static final String ROLE_ADMIN = "ADMIN";
    public static final String ROLE_ANALISTA = "ANALISTA";
    public static final String ROLE_DOCENTE = "DOCENTE";
    public static final String ROLE_ESTUDIANTE = "ESTUDIANTE";
    public static final String ROLE_EXTERNO = "EXTERNO";

}
