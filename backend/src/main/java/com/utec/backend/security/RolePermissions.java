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
    /** Listado de gestion: la tabla completa, sin el filtro de reservas publicas. */
    public static final String RESERVA_VER_GESTION = "reserva:ver_gestion";
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

    // ===== Permisos: materias =====
    public static final String MATERIA_VER = "materia:ver";
    public static final String MATERIA_CREAR = "materia:crear";
    public static final String MATERIA_EDITAR = "materia:editar";
    public static final String MATERIA_ELIMINAR = "materia:eliminar";
    public static final String MATERIA_VER_INSCRIPTOS = "materia:ver_inscriptos";

    // ===== Permisos: inscripciones a materias =====
    public static final String INSCRIPCION_CREAR = "inscripcion:crear";
    public static final String INSCRIPCION_VER_PROPIAS = "inscripcion:ver_propias";
    public static final String INSCRIPCION_CANCELAR = "inscripcion:cancelar";

    // ===== Permisos: recursos académicos =====
    public static final String RECURSO_VER = "recurso:ver";
    public static final String RECURSO_CREAR = "recurso:crear";
    public static final String RECURSO_ELIMINAR = "recurso:eliminar";

    // ===== Permisos: tutorías =====
    public static final String TUTORIA_VER = "tutoria:ver";
    public static final String TUTORIA_CREAR = "tutoria:crear";
    public static final String TUTORIA_EDITAR = "tutoria:editar";
    public static final String TUTORIA_AGENDAR = "tutoria:agendar";
    public static final String TUTORIA_CANCELAR_RESERVA = "tutoria:cancelar_reserva";
    public static final String TUTORIA_VER_AGENDADOS = "tutoria:ver_agendados";

    // ===== Permisos: eventos / oferta abierta =====
    public static final String EVENTO_VER = "evento:ver";
    public static final String EVENTO_CREAR = "evento:crear";
    public static final String EVENTO_EDITAR = "evento:editar";
    public static final String EVENTO_ELIMINAR = "evento:eliminar";
    public static final String EVENTO_INSCRIBIR = "evento:inscribir";
    public static final String EVENTO_VER_INSCRIPTOS = "evento:ver_inscriptos";

    // ===== Permisos: sostenibilidad =====
    public static final String SOSTENIBILIDAD_VER = "sostenibilidad:ver";

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
            RESERVA_VER_GESTION,
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

            // Estadísticas: tambien las de inventario, que consulta pero no administra
            ESTADISTICAS_VER,
            ESTADISTICAS_VER_RESERVAS,
            ESTADISTICAS_VER_INVENTARIO,

            // Recomendaciones
            RECOMENDACION_VER,
            RECOMENDACION_SOLICITAR,
            RECOMENDACION_VER_ESTADISTICAS,

            // Usuarios
            USUARIO_VER_ANALISTAS,

            // Archivos
            ARCHIVO_SUBIR,
            ARCHIVO_VER,

            // Capa académica - gestión global de materias y eventos
            MATERIA_VER, MATERIA_CREAR, MATERIA_EDITAR, MATERIA_ELIMINAR, MATERIA_VER_INSCRIPTOS,
            INSCRIPCION_CREAR, INSCRIPCION_CANCELAR,
            RECURSO_VER,
            TUTORIA_VER, TUTORIA_VER_AGENDADOS,
            EVENTO_VER, EVENTO_CREAR, EVENTO_EDITAR, EVENTO_ELIMINAR, EVENTO_INSCRIBIR, EVENTO_VER_INSCRIPTOS
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

            // Carreras - Solo lectura: el calendario filtra por carrera
            CARRERA_VER,

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
            ARCHIVO_VER,

            // Sostenibilidad (infraestructura)
            SOSTENIBILIDAD_VER
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
            ARCHIVO_VER,

            // Capa académica - dicta materias, recursos, tutorías
            MATERIA_VER, MATERIA_EDITAR, MATERIA_VER_INSCRIPTOS,
            RECURSO_VER, RECURSO_CREAR, RECURSO_ELIMINAR,
            TUTORIA_VER, TUTORIA_CREAR, TUTORIA_EDITAR, TUTORIA_VER_AGENDADOS,
            EVENTO_VER, EVENTO_INSCRIBIR
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
            ARCHIVO_VER,

            // Capa académica - se inscribe a materias, consume recursos, agenda tutorías
            MATERIA_VER,
            INSCRIPCION_CREAR, INSCRIPCION_VER_PROPIAS, INSCRIPCION_CANCELAR,
            RECURSO_VER,
            TUTORIA_VER, TUTORIA_AGENDAR, TUTORIA_CANCELAR_RESERVA,
            EVENTO_VER, EVENTO_INSCRIBIR
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
            ARCHIVO_VER,

            // Oferta abierta - ve e inscribe a eventos públicos
            EVENTO_VER, EVENTO_INSCRIBIR
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
