package com.utec.backend.security;

import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;

import static com.utec.backend.security.Constants.*;

/**
 * Mapeo centralizado de roles a permisos.
 * Este es el ÚNICO lugar donde se define qué permisos tiene cada rol.
 *
 * Para agregar un nuevo rol o modificar permisos, solo edita este archivo.
 */
public final class RolePermissions {

    // ===== Permisos: reservas =====
    public static final String RESERVA_CREAR = "reserva:crear";
    public static final String RESERVA_VER_PROPIAS = "reserva:ver_propias";
    public static final String RESERVA_VER_TODAS = "reserva:ver_todas";
    public static final String RESERVA_CANCELAR = "reserva:cancelar";
    public static final String RESERVA_APROBAR = "reserva:aprobar";

    // ===== Permisos: espacios =====
    public static final String ESPACIO_VER = "espacio:ver";
    public static final String ESPACIO_CREAR = "espacio:crear";
    public static final String ESPACIO_EDITAR = "espacio:editar";
    public static final String ESPACIO_ELIMINAR = "espacio:eliminar";

    // ===== Permisos: inventario =====
    public static final String INVENTARIO_VER = "inventario:ver";
    public static final String INVENTARIO_CREAR = "inventario:crear";
    public static final String INVENTARIO_EDITAR = "inventario:editar";
    public static final String INVENTARIO_ELIMINAR = "inventario:eliminar";
    public static final String INVENTARIO_ASIGNAR = "inventario:asignar";

    // ===== Permisos: tipos =====
    public static final String TIPO_VER = "tipo:ver";
    public static final String TIPO_CREAR = "tipo:crear";
    public static final String TIPO_EDITAR = "tipo:editar";
    public static final String TIPO_ELIMINAR = "tipo:eliminar";

    // ===== Permisos: carreras =====
    public static final String CARRERA_VER = "carrera:ver";
    public static final String CARRERA_CREAR = "carrera:crear";
    public static final String CARRERA_EDITAR = "carrera:editar";
    public static final String CARRERA_ELIMINAR = "carrera:eliminar";

    // ===== Permisos: solicitudes de inventario =====
    public static final String SOLICITUD_INVENTARIO_VER = "solicitud_inventario:ver";
    public static final String SOLICITUD_INVENTARIO_APROBAR = "solicitud_inventario:aprobar";

    // ===== Permisos: estadísticas =====
    public static final String ESTADISTICAS_VER = "estadisticas:ver";
    public static final String ESTADISTICAS_VER_RESERVAS = "estadisticas:ver_reservas";
    public static final String ESTADISTICAS_VER_INVENTARIO = "estadisticas:ver_inventario";
    public static final String ESTADISTICAS_VER_ESPACIOS = "estadisticas:ver_espacios";

    // ===== Permisos: recomendaciones =====
    public static final String RECOMENDACION_VER = "recomendacion:ver";
    public static final String RECOMENDACION_SOLICITAR = "recomendacion:solicitar";
    public static final String RECOMENDACION_VER_ESTADISTICAS = "recomendacion:ver_estadisticas";
    public static final String RECOMENDACION_GESTIONAR_ESTADO = "recomendacion:gestionar_estado";
    public static final String RECOMENDACION_GESTIONAR_ASIGNACIONES = "recomendacion:gestionar_asignaciones";
    public static final String RECOMENDACION_VER_COMPRAS = "recomendacion:ver_compras";

    // ===== Permisos: usuarios =====
    public static final String USUARIO_VER_ANALISTAS = "usuario:ver_analistas";

    // ===== Permisos: archivos =====
    public static final String ARCHIVO_SUBIR = "archivo:subir";
    public static final String ARCHIVO_VER = "archivo:ver";

    // ===== Permisos: auditoría =====
    public static final String AUDITORIA_VER = "auditoria:ver";

    // ===== Wildcard ADMIN =====
    public static final String WILDCARD = "*";

    private static final Map<String, Set<String>> ROLE_PERMISSION_MAP;

    static {
        Map<String, Set<String>> map = new HashMap<>();

        // ===== ADMIN - Todos los permisos =====
        // ADMIN tiene acceso total (wildcard)
        // Incluye explícitamente auditoria:ver para documentación
        map.put(ROLE_ADMIN, Set.of(WILDCARD, AUDITORIA_VER));

        // ===== ANALISTA =====
        // Autoridad completa sobre reservas, visualización de espacios e inventario
        map.put(ROLE_ANALISTA, Set.of(
            // Reservas - CRUD completo
            RESERVA_CREAR,
            RESERVA_VER_PROPIAS,
            RESERVA_VER_TODAS,
            RESERVA_CANCELAR,
            RESERVA_APROBAR,

            // Espacios - Solo lectura
            ESPACIO_VER,

            // Inventario - Solo lectura
            INVENTARIO_VER,

            // Tipos - Solo lectura
            TIPO_VER,

            // Carreras - CRUD
            CARRERA_VER,
            CARRERA_CREAR,
            CARRERA_EDITAR,
            CARRERA_ELIMINAR,

            // Estadísticas
            ESTADISTICAS_VER,
            ESTADISTICAS_VER_RESERVAS,

            // Recomendaciones
            RECOMENDACION_VER,
            RECOMENDACION_SOLICITAR,
            RECOMENDACION_VER_ESTADISTICAS,

            // Usuarios
            USUARIO_VER_ANALISTAS,

            // Archivos
            ARCHIVO_SUBIR,
            ARCHIVO_VER
        ));

        // ===== MANTENIMIENTO =====
        // Autoridad completa sobre espacios e inventario
        map.put(ROLE_MANTENIMIENTO, Set.of(
            // Reservas - Solo lectura (para ver ocupación)
            RESERVA_VER_TODAS,

            // Espacios - CRUD completo
            ESPACIO_VER,
            ESPACIO_CREAR,
            ESPACIO_EDITAR,
            ESPACIO_ELIMINAR,

            // Inventario - CRUD completo
            INVENTARIO_VER,
            INVENTARIO_CREAR,
            INVENTARIO_EDITAR,
            INVENTARIO_ELIMINAR,
            INVENTARIO_ASIGNAR,

            // Tipos - CRUD completo
            TIPO_VER,
            TIPO_CREAR,
            TIPO_EDITAR,
            TIPO_ELIMINAR,

            // Solicitudes de inventario
            SOLICITUD_INVENTARIO_VER,
            SOLICITUD_INVENTARIO_APROBAR,

            // Estadísticas de inventario y espacios
            ESTADISTICAS_VER,
            ESTADISTICAS_VER_INVENTARIO,
            ESTADISTICAS_VER_ESPACIOS,

            // Recomendaciones - gestionar estado y asignaciones
            RECOMENDACION_GESTIONAR_ESTADO,
            RECOMENDACION_GESTIONAR_ASIGNACIONES,
            RECOMENDACION_VER_COMPRAS,

            // Archivos
            ARCHIVO_SUBIR,
            ARCHIVO_VER
        ));

        // ===== DOCENTE =====
        // Puede solicitar reservas y ver información
        map.put(ROLE_DOCENTE, Set.of(
            // Reservas - crear solicitudes y ver
            RESERVA_CREAR,
            RESERVA_VER_PROPIAS,
            RESERVA_VER_TODAS,
            RESERVA_CANCELAR,

            // Espacios - Solo lectura
            ESPACIO_VER,

            // Tipos - Solo lectura
            TIPO_VER,

            // Carreras - Solo lectura
            CARRERA_VER,

            // Recomendaciones
            RECOMENDACION_VER,
            RECOMENDACION_SOLICITAR,

            // Usuarios
            USUARIO_VER_ANALISTAS,

            // Archivos - Solo lectura
            ARCHIVO_VER
        ));

        // ===== ESTUDIANTE =====
        // Acceso de solo lectura
        map.put(ROLE_ESTUDIANTE, Set.of(
            // Reservas - Solo ver
            RESERVA_VER_TODAS,

            // Espacios - Solo lectura
            ESPACIO_VER,

            // Tipos - Solo lectura
            TIPO_VER,

            // Carreras - Solo lectura
            CARRERA_VER,

            // Estadísticas básicas
            ESTADISTICAS_VER,

            // Archivos - Solo lectura
            ARCHIVO_VER
        ));

        // ===== EXTERNO =====
        // Puede solicitar reservas públicas y ver información básica
        map.put(ROLE_EXTERNO, Set.of(
            // Reservas - crear solicitudes y ver propias
            RESERVA_CREAR,
            RESERVA_VER_PROPIAS,
            RESERVA_VER_TODAS,
            RESERVA_CANCELAR,

            // Espacios - Solo lectura
            ESPACIO_VER,

            // Tipos - Solo lectura
            TIPO_VER,

            // Carreras - Solo lectura
            CARRERA_VER,

            // Archivos - Solo lectura
            ARCHIVO_VER
        ));

        ROLE_PERMISSION_MAP = Collections.unmodifiableMap(map);
    }

    private RolePermissions() {
        // Utility class
    }

    /**
     * Obtiene los permisos de un rol
     */
    public static Set<String> getPermissions(String role) {
        return ROLE_PERMISSION_MAP.getOrDefault(role, Collections.emptySet());
    }

    /**
     * Verifica si un rol tiene un permiso específico
     */
    public static boolean hasPermission(String role, String permission) {
        Set<String> permissions = ROLE_PERMISSION_MAP.get(role);
        if (permissions == null) {
            return false;
        }
        // ADMIN tiene todos los permisos
        if (permissions.contains(WILDCARD)) {
            return true;
        }
        return permissions.contains(permission);
    }

    /**
     * Obtiene todos los roles que tienen un permiso específico
     */
    public static Set<String> getRolesWithPermission(String permission) {
        Set<String> roles = new HashSet<>();
        for (Map.Entry<String, Set<String>> entry : ROLE_PERMISSION_MAP.entrySet()) {
            if (entry.getValue().contains(WILDCARD) || entry.getValue().contains(permission)) {
                roles.add(entry.getKey());
            }
        }
        return roles;
    }
}
