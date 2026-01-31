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

    private static final Map<String, Set<String>> ROLE_PERMISSION_MAP;

    static {
        Map<String, Set<String>> map = new HashMap<>();

        // ===== ADMIN - Todos los permisos =====
        // ADMIN tiene acceso total (wildcard)
        // Incluye explícitamente auditoria:ver para documentación
        map.put(ROLE_ADMIN, Set.of("*", "auditoria:ver"));

        // Nota: Para ADMIN no es necesario listar permisos individuales
        // porque el wildcard "*" le da acceso a todo
        // El permiso auditoria:ver se lista explícitamente solo para claridad

        // ===== ANALISTA =====
        // Autoridad completa sobre reservas, visualización de espacios e inventario
        map.put(ROLE_ANALISTA, Set.of(
            // Reservas - CRUD completo
            "reserva:crear",
            "reserva:ver_propias",
            "reserva:ver_todas",
            "reserva:editar",
            "reserva:cancelar",
            "reserva:aprobar",

            // Espacios - Solo lectura
            "espacio:ver",

            // Inventario - Solo lectura
            "inventario:ver",

            // Tipos - Solo lectura
            "tipo:ver",

            // Carreras - CRUD
            "carrera:ver",
            "carrera:crear",
            "carrera:editar",
            "carrera:eliminar",

            // Estadísticas
            "estadisticas:ver",
            "estadisticas:ver_reservas",

            // Recomendaciones
            "recomendacion:ver",
            "recomendacion:solicitar",
            "recomendacion:ver_estadisticas",

            // Usuarios
            "usuario:ver_analistas",

            // Archivos
            "archivo:subir",
            "archivo:ver"
        ));

        // ===== MANTENIMIENTO =====
        // Autoridad completa sobre espacios e inventario
        map.put(ROLE_MANTENIMIENTO, Set.of(
            // Reservas - Solo lectura (para ver ocupación)
            "reserva:ver_todas",

            // Espacios - CRUD completo
            "espacio:ver",
            "espacio:crear",
            "espacio:editar",
            "espacio:eliminar",

            // Inventario - CRUD completo
            "inventario:ver",
            "inventario:crear",
            "inventario:editar",
            "inventario:eliminar",
            "inventario:asignar",

            // Tipos - CRUD completo
            "tipo:ver",
            "tipo:crear",
            "tipo:editar",
            "tipo:eliminar",

            // Solicitudes de inventario
            "solicitud_inventario:ver",
            "solicitud_inventario:aprobar",

            // Estadísticas de inventario y espacios
            "estadisticas:ver",
            "estadisticas:ver_inventario",
            "estadisticas:ver_espacios",

            // Recomendaciones - gestionar estado y asignaciones
            "recomendacion:gestionar_estado",
            "recomendacion:gestionar_asignaciones",
            "recomendacion:ver_compras",

            // Archivos
            "archivo:subir",
            "archivo:ver"
        ));

        // ===== DOCENTE =====
        // Puede solicitar reservas y ver información
        map.put(ROLE_DOCENTE, Set.of(
            // Reservas - crear solicitudes y ver
            "reserva:crear",
            "reserva:ver_propias",
            "reserva:ver_todas",
            "reserva:cancelar",

            // Espacios - Solo lectura
            "espacio:ver",

            // Tipos - Solo lectura
            "tipo:ver",

            // Carreras - Solo lectura
            "carrera:ver",

            // Recomendaciones
            "recomendacion:ver",
            "recomendacion:solicitar",

            // Usuarios
            "usuario:ver_analistas",

            // Archivos - Solo lectura
            "archivo:ver"
        ));

        // ===== ESTUDIANTE =====
        // Acceso de solo lectura
        map.put(ROLE_ESTUDIANTE, Set.of(
            // Reservas - Solo ver
            "reserva:ver_todas",

            // Espacios - Solo lectura
            "espacio:ver",

            // Tipos - Solo lectura
            "tipo:ver",

            // Carreras - Solo lectura
            "carrera:ver",

            // Estadísticas básicas
            "estadisticas:ver",

            // Archivos - Solo lectura
            "archivo:ver"
        ));

        // ===== EXTERNO =====
        // Puede solicitar reservas públicas y ver información básica
        map.put(ROLE_EXTERNO, Set.of(
            // Reservas - crear solicitudes y ver propias
            "reserva:crear",
            "reserva:ver_propias",
            "reserva:ver_todas",
            "reserva:cancelar",

            // Espacios - Solo lectura
            "espacio:ver",

            // Tipos - Solo lectura
            "tipo:ver",

            // Carreras - Solo lectura
            "carrera:ver",

            // Archivos - Solo lectura
            "archivo:ver"
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
        if (permissions.contains("*")) {
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
            if (entry.getValue().contains("*") || entry.getValue().contains(permission)) {
                roles.add(entry.getKey());
            }
        }
        return roles;
    }
}
