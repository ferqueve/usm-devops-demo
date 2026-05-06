package com.utec.backend.service;

import com.utec.backend.model.Usuario;
import com.utec.backend.security.Permission;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.*;

/**
 * Servicio que mapea roles a permisos según documentation/ROLES_AND_PERMISSIONS.md
 */
@Service
@RequiredArgsConstructor
public class PermissionService {

    private static final Map<Usuario.RolApp, Set<Permission>> ROLE_PERMISSIONS = new EnumMap<>(Usuario.RolApp.class);

    static {
        // ADMIN: Todos los permisos
        ROLE_PERMISSIONS.put(Usuario.RolApp.ADMIN, EnumSet.allOf(Permission.class));

        // ANALISTA: Permisos de reservas, ver espacios/inventario, estadísticas de reservas
        ROLE_PERMISSIONS.put(Usuario.RolApp.ANALISTA, EnumSet.of(
            // Reservas - CRUD completo
            Permission.RESERVA_CREAR,
            Permission.RESERVA_SOLICITAR,
            Permission.RESERVA_VER_TODAS,
            Permission.RESERVA_VER_PUBLICAS,
            Permission.RESERVA_EDITAR,
            Permission.RESERVA_ELIMINAR,
            Permission.RESERVA_APROBAR,
            Permission.RESERVA_CANCELAR,
            
            // Espacios - Solo visualización
            Permission.ESPACIO_VER,
            
            // Inventario - Solo visualización
            Permission.INVENTARIO_VER,
            
            // Tipos - Ver tipos
            Permission.TIPO_VER,
            
            // Solicitudes de inventario - Crear para reservas
            Permission.SOLICITUD_INVENTARIO_CREAR,
            
            // Estadísticas - Solo de reservas
            Permission.ESTADISTICAS_VER_RESERVAS,
            Permission.ESTADISTICAS_EXPORTAR
        ));

        // MANTENIMIENTO: Permisos de espacios, inventario, tipos, estadísticas de inventario/espacios
        ROLE_PERMISSIONS.put(Usuario.RolApp.MANTENIMIENTO, EnumSet.of(
            // Espacios - Gestión completa (excepto eliminar)
            Permission.ESPACIO_CREAR,
            Permission.ESPACIO_EDITAR,
            Permission.ESPACIO_VER,
            Permission.ESPACIO_GESTIONAR,
            Permission.ESPACIO_GESTIONAR_ESTADO,
            
            // Inventario - Gestión completa (excepto eliminar)
            Permission.INVENTARIO_CREAR,
            Permission.INVENTARIO_EDITAR,
            Permission.INVENTARIO_VER,
            Permission.INVENTARIO_ASIGNAR,
            Permission.INVENTARIO_GESTIONAR_ESTADO,
            Permission.INVENTARIO_IMPORTAR,
            Permission.INVENTARIO_EXPORTAR,
            
            // Tipos - Gestión completa (excepto eliminar)
            Permission.TIPO_CREAR,
            Permission.TIPO_EDITAR,
            Permission.TIPO_VER,
            
            // Solicitudes de inventario - Aceptar/rechazar
            Permission.SOLICITUD_INVENTARIO_ACEPTAR,
            Permission.SOLICITUD_INVENTARIO_RECHAZAR,
            
            // Estadísticas - Solo de inventario y espacios
            Permission.ESTADISTICAS_VER_INVENTARIO,
            Permission.ESTADISTICAS_VER_ESPACIOS,
            Permission.ESTADISTICAS_EXPORTAR,
            
            // Reservas - Solo ver para conocer ocupación
            Permission.RESERVA_VER_PUBLICAS
        ));

        // DOCENTE: Solicitar reservas, ver reservas públicas
        ROLE_PERMISSIONS.put(Usuario.RolApp.DOCENTE, EnumSet.of(
            // Reservas - Solicitar y ver
            Permission.RESERVA_SOLICITAR,
            Permission.RESERVA_VER_TODAS,
            Permission.RESERVA_VER_PUBLICAS,
            Permission.RESERVA_VER_PROPIAS,
            Permission.RESERVA_CANCELAR, // Solo sus propias reservas
            
            // Espacios - Ver espacios
            Permission.ESPACIO_VER
        ));

        // ESTUDIANTE: Ver reservas públicas
        ROLE_PERMISSIONS.put(Usuario.RolApp.ESTUDIANTE, EnumSet.of(
            // Reservas - Solo ver todas (públicas)
            Permission.RESERVA_VER_TODAS,
            Permission.RESERVA_VER_PUBLICAS,
            
            // Espacios - Ver espacios
            Permission.ESPACIO_VER
        ));

        // EXTERNO: Solicitar reservas y ver reservas públicas
        ROLE_PERMISSIONS.put(Usuario.RolApp.EXTERNO, EnumSet.of(
            // Reservas - Solicitar y ver públicas
            Permission.RESERVA_SOLICITAR,
            Permission.RESERVA_VER_PUBLICAS,
            Permission.RESERVA_VER_PROPIAS, // Para ver sus propias solicitudes
            
            // Espacios - Ver espacios públicos
            Permission.ESPACIO_VER
        ));
    }

    /**
     * Obtiene todos los permisos asociados a un rol
     */
    public Set<Permission> getPermissionsForRole(Usuario.RolApp role) {
        return ROLE_PERMISSIONS.getOrDefault(role, Collections.emptySet());
    }

    /**
     * Verifica si un rol tiene un permiso específico
     */
    public boolean hasPermission(Usuario.RolApp role, Permission permission) {
        Set<Permission> permissions = getPermissionsForRole(role);
        return permissions.contains(permission);
    }

    /**
     * Obtiene todos los permisos del sistema
     */
    public Set<Permission> getAllPermissions() {
        return EnumSet.allOf(Permission.class);
    }
}

