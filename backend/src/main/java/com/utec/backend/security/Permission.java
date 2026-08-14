package com.utec.backend.security;

/**
 * Enum de permisos del sistema.
 * Permisos organizados por categoría: recurso:accion o recurso:accion:subaccion
 */
public enum Permission {
    // ===== PERMISOS DE RESERVAS =====
    RESERVA_CREAR("reserva:crear"),
    RESERVA_SOLICITAR("reserva:solicitar"),
    RESERVA_VER_TODAS("reserva:ver:todas"),
    RESERVA_VER_PROPIAS("reserva:ver:propias"),
    RESERVA_VER_PUBLICAS("reserva:ver:publicas"),
    RESERVA_ELIMINAR("reserva:eliminar"),
    RESERVA_APROBAR("reserva:aprobar"),
    RESERVA_CANCELAR("reserva:cancelar"),

    // ===== PERMISOS DE ESPACIOS =====
    ESPACIO_CREAR("espacio:crear"),
    ESPACIO_EDITAR("espacio:editar"),
    ESPACIO_ELIMINAR("espacio:eliminar"),
    ESPACIO_VER("espacio:ver"),
    ESPACIO_GESTIONAR("espacio:gestionar"),
    ESPACIO_GESTIONAR_ESTADO("espacio:gestionar_estado"),

    // ===== PERMISOS DE INVENTARIO =====
    INVENTARIO_CREAR("inventario:crear"),
    INVENTARIO_EDITAR("inventario:editar"),
    INVENTARIO_ELIMINAR("inventario:eliminar"),
    INVENTARIO_VER("inventario:ver"),
    INVENTARIO_ASIGNAR("inventario:asignar"),
    INVENTARIO_GESTIONAR_ESTADO("inventario:gestionar_estado"),
    INVENTARIO_IMPORTAR("inventario:importar"),
    INVENTARIO_EXPORTAR("inventario:exportar"),

    // ===== PERMISOS DE TIPOS =====
    TIPO_CREAR("tipo:crear"),
    TIPO_EDITAR("tipo:editar"),
    TIPO_ELIMINAR("tipo:eliminar"),
    TIPO_VER("tipo:ver"),

    // ===== PERMISOS DE USUARIOS =====
    USUARIO_GESTIONAR("usuario:gestionar"),

    // ===== PERMISOS DE ESTADÍSTICAS =====
    ESTADISTICAS_VER("estadisticas:ver"),
    ESTADISTICAS_EXPORTAR("estadisticas:exportar"),
    ESTADISTICAS_VER_RESERVAS("estadisticas:ver:reservas"),
    ESTADISTICAS_VER_INVENTARIO("estadisticas:ver:inventario"),
    ESTADISTICAS_VER_ESPACIOS("estadisticas:ver:espacios"),

    // ===== PERMISOS DE SOLICITUDES =====
    SOLICITUD_INVENTARIO_CREAR("solicitud:inventario:crear"),
    SOLICITUD_INVENTARIO_ACEPTAR("solicitud:inventario:aceptar"),
    SOLICITUD_INVENTARIO_RECHAZAR("solicitud:inventario:rechazar"),

    // ===== PERMISOS DE SISTEMA =====
    SISTEMA_ACCEDER("sistema:acceder"),
    SISTEMA_CONFIGURAR("sistema:configurar"),
    SISTEMA_LOGS("sistema:logs"),

    // ===== PERMISOS DE MATERIAS =====
    MATERIA_VER("materia:ver"),
    MATERIA_CREAR("materia:crear"),
    MATERIA_EDITAR("materia:editar"),
    MATERIA_ELIMINAR("materia:eliminar"),
    MATERIA_VER_INSCRIPTOS("materia:ver_inscriptos"),

    // ===== PERMISOS DE INSCRIPCIONES =====
    INSCRIPCION_CREAR("inscripcion:crear"),
    INSCRIPCION_VER_PROPIAS("inscripcion:ver_propias"),
    INSCRIPCION_CANCELAR("inscripcion:cancelar"),

    // ===== PERMISOS DE RECURSOS ACADÉMICOS =====
    RECURSO_VER("recurso:ver"),
    RECURSO_CREAR("recurso:crear"),
    RECURSO_ELIMINAR("recurso:eliminar"),

    // ===== PERMISOS DE TUTORÍAS =====
    TUTORIA_VER("tutoria:ver"),
    TUTORIA_CREAR("tutoria:crear"),
    TUTORIA_EDITAR("tutoria:editar"),
    TUTORIA_AGENDAR("tutoria:agendar"),
    TUTORIA_CANCELAR_RESERVA("tutoria:cancelar_reserva"),

    // ===== PERMISOS DE EVENTOS =====
    EVENTO_VER("evento:ver"),
    EVENTO_CREAR("evento:crear"),
    EVENTO_EDITAR("evento:editar"),
    EVENTO_ELIMINAR("evento:eliminar"),
    EVENTO_INSCRIBIR("evento:inscribir"),
    EVENTO_VER_INSCRIPTOS("evento:ver_inscriptos"),

    // ===== PERMISOS DE SOSTENIBILIDAD =====
    SOSTENIBILIDAD_VER("sostenibilidad:ver");

    private final String value;

    Permission(String value) {
        this.value = value;
    }

    public String getValue() {
        return value;
    }

    /**
     * Retorna el Permission enum desde su valor string
     */
    public static Permission fromValue(String value) {
        for (Permission permission : Permission.values()) {
            if (permission.value.equals(value)) {
                return permission;
            }
        }
        throw new IllegalArgumentException("Permiso no encontrado: " + value);
    }
}

