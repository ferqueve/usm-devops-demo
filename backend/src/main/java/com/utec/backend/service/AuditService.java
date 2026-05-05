package com.utec.backend.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.utec.backend.audit.AuditContext;
import com.utec.backend.dto.audit.AuditLogResponseDto;
import com.utec.backend.dto.common.PagedResponseDto;
import com.utec.backend.model.AuditLog;
import com.utec.backend.model.Usuario;
import com.utec.backend.repository.AuditLogRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import jakarta.persistence.criteria.Predicate;
import java.lang.reflect.Field;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@Slf4j
public class AuditService {

    // Constantes de campos y valores reutilizados en logs y serialización
    private static final String SYSTEM_USER = "system";
    private static final String SISTEMA_USER = "sistema";
    private static final String UNKNOWN_VALUE = "UNKNOWN";
    private static final String FIELD_TIMESTAMP = "timestamp";
    private static final String FIELD_USUARIO = "usuario";

    private final AuditLogRepository auditLogRepository;
    private final ObjectMapper objectMapper;

    // Constructor para inicializar ObjectMapper con soporte para Instant
    public AuditService(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
        this.objectMapper = new ObjectMapper();
        this.objectMapper.registerModule(new JavaTimeModule());
        this.objectMapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
        // Configurar para ignorar propiedades desconocidas y evitar problemas con relaciones lazy
        this.objectMapper.configure(com.fasterxml.jackson.databind.DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
    }
    
    /**
     * Registrar creación de entidad
     * Usa una transacción separada (REQUIRES_NEW) para no afectar la transacción principal
     * El usuario viene del AuditContext (ThreadLocal) establecido por AuditAspect
     */
    @Transactional(propagation = org.springframework.transaction.annotation.Propagation.REQUIRES_NEW)
    public void logCreate(String entidad, Long entidadId, Usuario usuario, Object datosNuevos) {
        try {
            AuditLog auditLog = new AuditLog();
            auditLog.setEntidad(entidad);
            auditLog.setEntidadId(entidadId);
            auditLog.setAccion(AuditLog.AccionAudit.CREATE);
            auditLog.setUsuario(usuario);
            auditLog.setDatosNuevos(convertToJson(datosNuevos));

            // Agregar información de request HTTP si está disponible (obligatorio ip_address en BD)
            AuditContext.RequestInfo requestInfo = AuditContext.getRequestInfo();
            if (requestInfo != null) {
                auditLog.setIpAddress(requestInfo.getIpAddress());
                auditLog.setHttpMethod(requestInfo.getHttpMethod());
                auditLog.setEndpoint(requestInfo.getEndpoint());
                auditLog.setUserAgent(requestInfo.getUserAgent());
            } else {
                auditLog.setIpAddress(SYSTEM_USER);
            }

            auditLogRepository.save(auditLog);
            log.info("Audit log creado: {} {} por usuario {} desde {}",
                    entidad, entidadId, usuario != null ? usuario.getEmail() : SISTEMA_USER,
                    requestInfo != null ? requestInfo.getIpAddress() : UNKNOWN_VALUE);
        } catch (Exception e) {
            log.error("Error al crear audit log para {} {}: {}", entidad, entidadId, e.getMessage(), e);
            // No lanzar excepción para no interrumpir el flujo principal
        }
    }
    
    /**
     * Registrar actualización de entidad
     * Usa una transacción separada (REQUIRES_NEW) para no afectar la transacción principal
     */
    @Transactional(propagation = org.springframework.transaction.annotation.Propagation.REQUIRES_NEW)
    public void logUpdate(String entidad, Long entidadId, Usuario usuario, Object datosPrevios, Object datosNuevos) {
        try {
            AuditLog auditLog = new AuditLog();
            auditLog.setEntidad(entidad);
            auditLog.setEntidadId(entidadId);
            auditLog.setAccion(AuditLog.AccionAudit.UPDATE);
            auditLog.setUsuario(usuario);
            auditLog.setDatosPrevios(convertToJson(datosPrevios));
            auditLog.setDatosNuevos(convertToJson(datosNuevos));

            // Agregar información de request HTTP si está disponible (obligatorio ip_address en BD)
            AuditContext.RequestInfo requestInfo = AuditContext.getRequestInfo();
            if (requestInfo != null) {
                auditLog.setIpAddress(requestInfo.getIpAddress());
                auditLog.setHttpMethod(requestInfo.getHttpMethod());
                auditLog.setEndpoint(requestInfo.getEndpoint());
                auditLog.setUserAgent(requestInfo.getUserAgent());
            } else {
                auditLog.setIpAddress(SYSTEM_USER);
            }

            auditLogRepository.save(auditLog);
            log.info("Audit log actualizado: {} {} por usuario {} desde {}",
                    entidad, entidadId, usuario != null ? usuario.getEmail() : SISTEMA_USER,
                    requestInfo != null ? requestInfo.getIpAddress() : UNKNOWN_VALUE);
        } catch (Exception e) {
            log.error("Error al crear audit log de actualización para {} {}: {}", entidad, entidadId, e.getMessage(), e);
            // No lanzar excepción para no interrumpir el flujo principal
        }
    }
    
    /**
     * Registrar eliminación de entidad
     * Usa una transacción separada (REQUIRES_NEW) para no afectar la transacción principal
     */
    @Transactional(propagation = org.springframework.transaction.annotation.Propagation.REQUIRES_NEW)
    public void logDelete(String entidad, Long entidadId, Usuario usuario, Object datosPrevios) {
        try {
            AuditLog auditLog = new AuditLog();
            auditLog.setEntidad(entidad);
            auditLog.setEntidadId(entidadId);
            auditLog.setAccion(AuditLog.AccionAudit.DELETE);
            auditLog.setUsuario(usuario);
            auditLog.setDatosPrevios(convertToJson(datosPrevios));

            // Agregar información de request HTTP si está disponible (obligatorio ip_address en BD)
            AuditContext.RequestInfo requestInfo = AuditContext.getRequestInfo();
            if (requestInfo != null) {
                auditLog.setIpAddress(requestInfo.getIpAddress());
                auditLog.setHttpMethod(requestInfo.getHttpMethod());
                auditLog.setEndpoint(requestInfo.getEndpoint());
                auditLog.setUserAgent(requestInfo.getUserAgent());
            } else {
                auditLog.setIpAddress(SYSTEM_USER);
            }

            auditLogRepository.save(auditLog);
            log.info("Audit log eliminado: {} {} por usuario {} desde {}",
                    entidad, entidadId, usuario != null ? usuario.getEmail() : SISTEMA_USER,
                    requestInfo != null ? requestInfo.getIpAddress() : UNKNOWN_VALUE);
        } catch (Exception e) {
            log.error("Error al crear audit log de eliminación para {} {}: {}", entidad, entidadId, e.getMessage(), e);
            // No lanzar excepción para no interrumpir el flujo principal
        }
    }

    /**
     * Registrar evento de autenticación (login, logout, registro, etc.)
     * Este método es para eventos que no están asociados a una entidad específica con ID
     *
     * @param eventoTipo Tipo de evento (ej: "LOGIN", "LOGOUT", "REGISTRO", "PASSWORD_RESET")
     * @param usuarioEmail Email del usuario involucrado
     * @param exitoso Si el evento fue exitoso o no
     * @param detalles Detalles adicionales del evento (opcional)
     */
    @Transactional(propagation = org.springframework.transaction.annotation.Propagation.REQUIRES_NEW)
    public void logAuthenticationEvent(String eventoTipo, String usuarioEmail, boolean exitoso, Map<String, Object> detalles) {
        try {
            AuditLog auditLog = new AuditLog();
            auditLog.setEntidad("Autenticacion");
            auditLog.setEntidadId(0L); // 0 para eventos no asociados a una entidad específica

            // Usar CREATE para eventos exitosos, DELETE para fallos (convención)
            auditLog.setAccion(exitoso ? AuditLog.AccionAudit.CREATE : AuditLog.AccionAudit.DELETE);

            // No establecer usuario aquí porque puede que aún no esté autenticado
            auditLog.setUsuario(null);

            // Crear datos del evento
            Map<String, Object> eventData = new HashMap<>();
            eventData.put("eventoTipo", eventoTipo);
            eventData.put("usuarioEmail", usuarioEmail);
            eventData.put("exitoso", exitoso);
            eventData.put(FIELD_TIMESTAMP, Instant.now().toString());
            if (detalles != null && !detalles.isEmpty()) {
                eventData.put("detalles", detalles);
            }

            auditLog.setDatosNuevos(objectMapper.writeValueAsString(eventData));

            // Agregar información de request HTTP si está disponible (obligatorio ip_address en BD)
            com.utec.backend.audit.AuditContext.RequestInfo requestInfo =
                com.utec.backend.audit.AuditContext.getRequestInfo();
            if (requestInfo != null) {
                auditLog.setIpAddress(requestInfo.getIpAddress());
                auditLog.setHttpMethod(requestInfo.getHttpMethod());
                auditLog.setEndpoint(requestInfo.getEndpoint());
                auditLog.setUserAgent(requestInfo.getUserAgent());
            } else {
                auditLog.setIpAddress(SYSTEM_USER);
            }

            auditLogRepository.save(auditLog);
            log.info("Audit log de autenticación: {} para {} - {} desde {}",
                    eventoTipo, usuarioEmail, exitoso ? "EXITOSO" : "FALLIDO",
                    requestInfo != null ? requestInfo.getIpAddress() : UNKNOWN_VALUE);
        } catch (Exception e) {
            log.error("Error al crear audit log de autenticación para {}: {}", eventoTipo, e.getMessage(), e);
            // No lanzar excepción para no interrumpir el flujo principal
        }
    }

    /**
     * Buscar logs con filtros y paginación
     */
    @Transactional(readOnly = true)
    public PagedResponseDto<AuditLogResponseDto> buscarLogs(
            String entidad,
            Long usuarioId,
            AuditLog.AccionAudit accion,
            Instant fechaDesde,
            Instant fechaHasta,
            String search,
            Pageable pageable
    ) {
        Specification<AuditLog> spec = buildSpecification(entidad, usuarioId, accion, fechaDesde, fechaHasta, search);
        
        Page<AuditLog> page = auditLogRepository.findAll(spec, pageable);
        
        List<AuditLogResponseDto> content = page.getContent().stream()
                .map(this::mapToResponseDto)
                .toList();
        
        return new PagedResponseDto<>(
                content,
                page.getNumber(),
                page.getSize(),
                page.getTotalElements(),
                page.getTotalPages(),
                page.isFirst(),
                page.isLast(),
                page.hasNext(),
                page.hasPrevious(),
                page.getNumberOfElements()
        );
    }
    
    /**
     * Obtener un log por ID
     */
    @Transactional(readOnly = true)
    public AuditLogResponseDto obtenerLogPorId(Long id) {
        AuditLog log = auditLogRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Log de auditoría no encontrado con ID: " + id));
        return mapToResponseDto(log);
    }
    
    /**
     * Construir Specification para filtros
     */
    private Specification<AuditLog> buildSpecification(
            String entidad,
            Long usuarioId,
            AuditLog.AccionAudit accion,
            Instant fechaDesde,
            Instant fechaHasta,
            String search
    ) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            
            if (entidad != null && !entidad.trim().isEmpty()) {
                predicates.add(cb.equal(root.get("entidad"), entidad));
            }
            
            if (usuarioId != null) {
                predicates.add(cb.equal(root.get(FIELD_USUARIO).get("id"), usuarioId));
            }
            
            if (accion != null) {
                predicates.add(cb.equal(root.get("accion"), accion));
            }
            
            if (fechaDesde != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get(FIELD_TIMESTAMP), fechaDesde));
            }
            
            if (fechaHasta != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get(FIELD_TIMESTAMP), fechaHasta));
            }
            
            if (search != null && !search.trim().isEmpty()) {
                String searchTerm = "%" + search.trim().toLowerCase() + "%";
                Predicate entidadPred = cb.like(cb.lower(root.get("entidad")), searchTerm);
                Predicate usuarioPred = cb.like(cb.lower(root.get(FIELD_USUARIO).get("nombre")), searchTerm);
                Predicate emailPred = cb.like(cb.lower(root.get(FIELD_USUARIO).get("email")), searchTerm);
                predicates.add(cb.or(entidadPred, usuarioPred, emailPred));
            }
            
            query.orderBy(cb.desc(root.get(FIELD_TIMESTAMP)));
            
            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
    
    /**
     * Mapear entidad a DTO
     */
    private AuditLogResponseDto mapToResponseDto(AuditLog log) {
        AuditLogResponseDto dto = new AuditLogResponseDto();
        dto.setId(log.getId());
        dto.setEntidad(log.getEntidad());
        dto.setEntidadId(log.getEntidadId());
        dto.setAccion(log.getAccion());
        dto.setTimestamp(log.getTimestamp());
        dto.setDatosPrevios(log.getDatosPrevios());
        dto.setDatosNuevos(log.getDatosNuevos());
        
        if (log.getUsuario() != null) {
            dto.setUsuarioId(log.getUsuario().getId());
            dto.setUsuarioNombre(log.getUsuario().getNombre());
            dto.setUsuarioEmail(log.getUsuario().getEmail());
        }
        
        return dto;
    }
    
    /**
     * Convertir objeto a JSON string
     * Evita serializar relaciones lazy de JPA que pueden causar problemas de recursión infinita
     */
    private String convertToJson(Object obj) {
        if (obj == null) {
            return null;
        }
        try {
            // Crear un mapa con solo los campos básicos, evitando relaciones bidireccionales
            Map<String, Object> simpleData = extractSimpleFields(obj);
            return objectMapper.writeValueAsString(simpleData);
        } catch (Exception e) {
            log.warn("Error al convertir objeto a JSON para audit log ({}): {}. Usando toString()", 
                    obj.getClass().getSimpleName(), e.getMessage());
            // Si falla la serialización, usar toString como fallback
            return obj.toString();
        }
    }
    
    /**
     * Extraer solo campos simples de una entidad, evitando relaciones JPA
     */
    private Map<String, Object> extractSimpleFields(Object obj) {
        Map<String, Object> data = new HashMap<>();
        if (obj == null) {
            return data;
        }
        
        Class<?> clazz = obj.getClass();
        Field[] fields = clazz.getDeclaredFields();
        
        for (Field field : fields) {
            // Ignorar campos que son relaciones JPA o colecciones
            if (field.isAnnotationPresent(jakarta.persistence.ManyToOne.class) ||
                field.isAnnotationPresent(jakarta.persistence.OneToOne.class) ||
                field.isAnnotationPresent(jakarta.persistence.OneToMany.class) ||
                field.isAnnotationPresent(jakarta.persistence.ManyToMany.class)) {
                // Para relaciones, solo guardar el ID si existe
                try {
                    field.setAccessible(true);
                    Object relationValue = field.get(obj);
                    if (relationValue != null) {
                        // Intentar obtener el ID de la relación
                        Field idField = relationValue.getClass().getDeclaredField("id");
                        idField.setAccessible(true);
                        Object idValue = idField.get(relationValue);
                        if (idValue != null) {
                            data.put(field.getName() + "Id", idValue);
                        }
                    }
                } catch (Exception e) {
                    // Ignorar si no se puede obtener el ID
                }
                continue;
            }
            
            // Ignorar campos de auditoría y metadatos de Hibernate
            String fieldName = field.getName();
            if (fieldName.equals("hibernateLazyInitializer") ||
                fieldName.equals("createdAt") ||
                fieldName.equals("updatedAt") ||
                fieldName.equals("deletedAt")) {
                continue;
            }
            
            try {
                field.setAccessible(true);
                Object value = field.get(obj);
                // Solo incluir valores no nulos y tipos simples
                if (value != null && isSimpleType(value.getClass())) {
                    data.put(fieldName, value);
                }
            } catch (Exception e) {
                // Ignorar campos que no se pueden acceder
            }
        }
        
        return data;
    }
    
    /**
     * Verificar si un tipo es simple (no es una colección o relación)
     */
    private boolean isSimpleType(Class<?> clazz) {
        return clazz.isPrimitive() ||
               clazz.equals(String.class) ||
               clazz.equals(Integer.class) ||
               clazz.equals(Long.class) ||
               clazz.equals(Double.class) ||
               clazz.equals(Float.class) ||
               clazz.equals(Boolean.class) ||
               clazz.equals(java.time.Instant.class) ||
               clazz.equals(java.time.LocalDate.class) ||
               clazz.isEnum() ||
               Number.class.isAssignableFrom(clazz);
    }
}

