package com.utec.backend.model;

/**
 * Enum que representa los diferentes tipos de recomendaciones
 * que el sistema puede generar para los usuarios.
 */
public enum TipoRecomendacion {
    // Recomendaciones de Reservas
    ESPACIO_PARA_RESERVA,      // Recomendar espacios al crear reserva
    HORARIO_OPTIMO,            // Recomendar mejores horarios
    ESPACIO_SIMILAR,            // Recomendar espacios similares al preferido
    
    // Recomendaciones de Inventario
    ITEM_MANTENIMIENTO_URGENTE, // Items que necesitan revisión urgente
    ESPACIO_ATENCION,           // Espacios que requieren atención
    REASIGNACION_ITEM,          // Items que deberían reasignarse
    COMPRA_NECESARIA,           // Items que deberían comprarse
    
    // Recomendaciones de Items en Reservas
    ITEM_RECOMENDADO_RESERVA,   // Items recomendados para una reserva
    COMBINACION_ITEMS,          // Combinaciones de items frecuentes
    
    // Recomendaciones para Analistas
    ASIGNACION_ANALISTA,        // Qué analista asignar a un docente
    RESERVA_PRIORITARIA,        // Reservas que requieren atención prioritaria
    
    // Recomendaciones de Espacios
    ESPACIO_MEJORA,             // Espacios que necesitan mejoras
    OPTIMIZACION_RECURSOS       // Optimización de uso de recursos
}

