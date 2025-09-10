package com.utec.backend.security.config;

import lombok.AccessLevel;
import lombok.NoArgsConstructor;

/**
 * Constantes centralizadas para la configuración de seguridad
 * Aquí se definen todos los roles y permisos del sistema
 * 
 * NOTA: Las configuraciones sensibles (JWT_SECRET, JWT_EXPIRATION) 
 * se leen desde application.properties usando @Value
 */
@NoArgsConstructor(access = AccessLevel.PRIVATE)
public final class Constants {

    // ===== ROLES DEL SISTEMA =====
    public static final String ROLE_ADMIN = "ADMIN";
    public static final String ROLE_ANALISTA = "ANALISTA";
    public static final String ROLE_DOCENTE = "DOCENTE";
    public static final String ROLE_ESTUDIANTE = "ESTUDIANTE";
    public static final String ROLE_EXTERNO = "EXTERNO";

    // ===== PATRONES DE RUTAS =====
    public static final String API_BASE_PATH = "/api/v1";
    
    // Rutas públicas
    public static final String[] PUBLIC_PATHS = {
        API_BASE_PATH + "/auth/**",
        "/actuator/**",
        "/error"
    };
    
    // Rutas solo para ADMIN
    public static final String[] ADMIN_ONLY_PATHS = {
        API_BASE_PATH + "/usuarios/**"
    };
    
    // Rutas para ADMIN + ANALISTA
    public static final String[] ADMIN_ANALISTA_PATHS = {
        API_BASE_PATH + "/salones/**",
        API_BASE_PATH + "/salones/*/inventario/**",
        API_BASE_PATH + "/estadisticas/**",
        API_BASE_PATH + "/configuracion/**"
    };
    
    // Rutas para ADMIN + ANALISTA + DOCENTE
    public static final String[] ADMIN_ANALISTA_DOCENTE_PATHS = {
        API_BASE_PATH + "/reservas/**"
    };
    
    // Rutas para ADMIN + ANALISTA + DOCENTE + ESTUDIANTE
    public static final String[] ADMIN_ANALISTA_DOCENTE_ESTUDIANTE_PATHS = {
        API_BASE_PATH + "/calendario/**"
    };
    
    // Rutas para todos los usuarios autenticados
    public static final String[] AUTHENTICATED_PATHS = {
        API_BASE_PATH + "/recomendaciones/**"
    };
    
    // Rutas para eventos externos (incluye EXTERNO)
    public static final String[] EVENTOS_EXTERNOS_PATHS = {
        API_BASE_PATH + "/eventos-externos/**"
    };

    // ===== RUTAS DE AUTENTICACIÓN =====
    public static final String AUTH_BASE_PATH = API_BASE_PATH + "/auth";
    public static final String LOGIN_PATH = "/login";
    public static final String REGISTER_PATH = "/register";
    public static final String LOGOUT_PATH = "/logout";
    public static final String VERIFY_PATH = "/verify";

    // ===== HEADERS AUTENTICACIÓN =====
    public static final String AUTHORIZATION_HEADER = "Authorization";
    public static final String BEARER_PREFIX = "Bearer ";
    public static final String REFRESH_TOKEN_HEADER = "Refresh-Token";

}
