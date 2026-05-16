package com.utec.backend.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.utec.backend.audit.AuditContext;
import com.utec.backend.dto.audit.AuditLogResponseDto;
import com.utec.backend.dto.common.PagedResponseDto;
import com.utec.backend.model.AuditLog;
import com.utec.backend.model.Usuario;
import com.utec.backend.repository.AuditLogRepository;
import com.utec.backend.repository.UsuarioRepository;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OneToOne;
import jakarta.persistence.criteria.Predicate;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.BeanWrapperImpl;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.beans.PropertyDescriptor;
import java.lang.reflect.Field;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.function.Consumer;

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
    private final UsuarioRepository usuarioRepository;
    private final ObjectMapper objectMapper;

    // Constructor para inicializar ObjectMapper con soporte para Instant
    public AuditService(AuditLogRepository auditLogRepository, UsuarioRepository usuarioRepository) {
        this.auditLogRepository = auditLogRepository;
        this.usuarioRepository = usuarioRepository;
        this.objectMapper = new ObjectMapper();
        this.objectMapper.registerModule(new JavaTimeModule());
        this.objectMapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
        // Configurar para ignorar propiedades desconocidas y evitar problemas con relaciones lazy
        this.objectMapper.configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
    }

    /**
     * Construye un {@link AuditLog} con los campos comunes (entidad, acción, usuario)
     * y la información de la request HTTP cuando está disponible.
     *
     * @param accion           tipo de acción a registrar
     * @param entidad          nombre de la entidad afectada
     * @param entidadId        identificador de la entidad afectada
     * @param usuario          usuario que originó la operación (puede ser null)
     * @param payloadCustomizer aplica los campos específicos de cada operación
     *                          (datos previos, datos nuevos, etc.)
     */
    private AuditLog buildAuditLog(AuditLog.AccionAudit accion, String entidad, Long entidadId,
                                   Usuario usuario, Consumer<AuditLog> payloadCustomizer) {
        AuditLog auditLog = new AuditLog();
        auditLog.setEntidad(entidad);
        auditLog.setEntidadId(entidadId);
        auditLog.setAccion(accion);
        auditLog.setUsuario(usuario);
        payloadCustomizer.accept(auditLog);
        applyRequestInfo(auditLog);
        return auditLog;
    }

    /**
     * Aplica al {@link AuditLog} la información HTTP del request actual cuando existe;
     * en su defecto marca el log como originado por el sistema.
     */
    private void applyRequestInfo(AuditLog auditLog) {
        AuditContext.RequestInfo requestInfo = AuditContext.getRequestInfo();
        if (requestInfo != null) {
            auditLog.setIpAddress(requestInfo.getIpAddress());
            auditLog.setHttpMethod(requestInfo.getHttpMethod());
            auditLog.setEndpoint(requestInfo.getEndpoint());
            auditLog.setUserAgent(requestInfo.getUserAgent());
        } else {
            auditLog.setIpAddress(SYSTEM_USER);
        }
    }

    /**
     * Persiste el {@link AuditLog} y emite la línea de log informativa estándar.
     */
    private void persistAndLog(AuditLog auditLog, String accionDescriptiva, Usuario usuario) {
        auditLogRepository.save(auditLog);
        AuditContext.RequestInfo requestInfo = AuditContext.getRequestInfo();
        log.info("Audit log {}: {} {} por usuario {} desde {}",
                accionDescriptiva,
                auditLog.getEntidad(), auditLog.getEntidadId(),
                usuario != null ? usuario.getEmail() : SISTEMA_USER,
                requestInfo != null ? requestInfo.getIpAddress() : UNKNOWN_VALUE);
    }

    /**
     * Registrar creación de entidad
     * Usa una transacción separada (REQUIRES_NEW) para no afectar la transacción principal
     * El usuario viene del AuditContext (ThreadLocal) establecido por AuditAspect
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void logCreate(String entidad, Long entidadId, Usuario usuario, Object datosNuevos) {
        try {
            AuditLog auditLog = buildAuditLog(AuditLog.AccionAudit.CREATE, entidad, entidadId, usuario,
                    al -> al.setDatosNuevos(convertToJson(datosNuevos)));
            persistAndLog(auditLog, "creado", usuario);
        } catch (Exception e) {
            log.error("Error al crear audit log para {} {}: {}", entidad, entidadId, e.getMessage(), e);
            // No lanzar excepción para no interrumpir el flujo principal
        }
    }

    /**
     * Registrar actualización de entidad
     * Usa una transacción separada (REQUIRES_NEW) para no afectar la transacción principal
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void logUpdate(String entidad, Long entidadId, Usuario usuario, Object datosPrevios, Object datosNuevos) {
        try {
            AuditLog auditLog = buildAuditLog(AuditLog.AccionAudit.UPDATE, entidad, entidadId, usuario,
                    al -> {
                        al.setDatosPrevios(convertToJson(datosPrevios));
                        al.setDatosNuevos(convertToJson(datosNuevos));
                    });
            persistAndLog(auditLog, "actualizado", usuario);
        } catch (Exception e) {
            log.error("Error al crear audit log de actualización para {} {}: {}", entidad, entidadId, e.getMessage(), e);
        }
    }

    /**
     * Registrar eliminación de entidad
     * Usa una transacción separada (REQUIRES_NEW) para no afectar la transacción principal
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void logDelete(String entidad, Long entidadId, Usuario usuario, Object datosPrevios) {
        try {
            AuditLog auditLog = buildAuditLog(AuditLog.AccionAudit.DELETE, entidad, entidadId, usuario,
                    al -> al.setDatosPrevios(convertToJson(datosPrevios)));
            persistAndLog(auditLog, "eliminado", usuario);
        } catch (Exception e) {
            log.error("Error al crear audit log de eliminación para {} {}: {}", entidad, entidadId, e.getMessage(), e);
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
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void logAuthenticationEvent(String eventoTipo, String usuarioEmail, boolean exitoso, Map<String, Object> detalles) {
        try {
            // Usar CREATE para eventos exitosos, DELETE para fallos (convención)
            AuditLog.AccionAudit accion = exitoso ? AuditLog.AccionAudit.CREATE : AuditLog.AccionAudit.DELETE;

            Usuario usuarioAuth = usuarioEmail != null
                    ? usuarioRepository.findByEmail(usuarioEmail).orElse(null)
                    : null;
            AuditLog auditLog = buildAuditLog(accion, "Autenticacion", 0L, usuarioAuth,
                    al -> {
                        Map<String, Object> eventData = new HashMap<>();
                        eventData.put("eventoTipo", eventoTipo);
                        eventData.put("usuarioEmail", usuarioEmail);
                        eventData.put("exitoso", exitoso);
                        eventData.put(FIELD_TIMESTAMP, Instant.now().toString());
                        if (detalles != null && !detalles.isEmpty()) {
                            eventData.put("detalles", detalles);
                        }
                        try {
                            al.setDatosNuevos(objectMapper.writeValueAsString(eventData));
                        } catch (JsonProcessingException jpe) {
                            log.warn("No se pudo serializar evento de autenticación {}: {}",
                                    eventoTipo, jpe.getMessage());
                            al.setDatosNuevos(eventData.toString());
                        }
                    });

            auditLogRepository.save(auditLog);
            AuditContext.RequestInfo requestInfo = AuditContext.getRequestInfo();
            log.info("Audit log de autenticación: {} para {} - {} desde {}",
                    eventoTipo, usuarioEmail, exitoso ? "EXITOSO" : "FALLIDO",
                    requestInfo != null ? requestInfo.getIpAddress() : UNKNOWN_VALUE);
        } catch (Exception e) {
            log.error("Error al crear audit log de autenticación para {}: {}", eventoTipo, e.getMessage(), e);
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
        AuditLog auditLog = auditLogRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Log de auditoría no encontrado con ID: " + id));
        return mapToResponseDto(auditLog);
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
    private AuditLogResponseDto mapToResponseDto(AuditLog auditLog) {
        AuditLogResponseDto dto = new AuditLogResponseDto();
        dto.setId(auditLog.getId());
        dto.setEntidad(auditLog.getEntidad());
        dto.setEntidadId(auditLog.getEntidadId());
        dto.setAccion(auditLog.getAccion());
        dto.setTimestamp(auditLog.getTimestamp());
        dto.setDatosPrevios(auditLog.getDatosPrevios());
        dto.setDatosNuevos(auditLog.getDatosNuevos());

        if (auditLog.getUsuario() != null) {
            dto.setUsuarioId(auditLog.getUsuario().getId());
            dto.setUsuarioNombre(auditLog.getUsuario().getNombre());
            dto.setUsuarioEmail(auditLog.getUsuario().getEmail());
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

    private static final Set<String> IGNORED_FIELDS = Set.of(
            "hibernateLazyInitializer",
            "createdAt",
            "updatedAt",
            "deletedAt"
    );

    /**
     * Extraer solo campos simples de una entidad, evitando relaciones JPA.
     *
     * Se utiliza {@link BeanWrapperImpl} (acceso vía getters) en lugar de
     * acceder a campos privados con reflexión.
     */
    private Map<String, Object> extractSimpleFields(Object obj) {
        Map<String, Object> data = new HashMap<>();
        if (obj == null) {
            return data;
        }

        BeanWrapperImpl wrapper = new BeanWrapperImpl(obj);
        for (Field field : obj.getClass().getDeclaredFields()) {
            extractFieldInto(field, wrapper, data);
        }
        return data;
    }

    private void extractFieldInto(Field field, BeanWrapperImpl wrapper, Map<String, Object> data) {
        String fieldName = field.getName();
        if (IGNORED_FIELDS.contains(fieldName)) {
            return;
        }
        if (isJpaRelation(field)) {
            extractRelationId(wrapper, fieldName)
                    .ifPresent(idValue -> data.put(fieldName + "Id", idValue));
            return;
        }
        extractSimpleValue(wrapper, fieldName)
                .ifPresent(value -> data.put(fieldName, value));
    }

    private boolean isJpaRelation(Field field) {
        return field.isAnnotationPresent(ManyToOne.class) ||
               field.isAnnotationPresent(OneToOne.class) ||
               field.isAnnotationPresent(OneToMany.class) ||
               field.isAnnotationPresent(ManyToMany.class);
    }

    private Optional<Object> extractRelationId(BeanWrapperImpl wrapper, String fieldName) {
        try {
            if (!wrapper.isReadableProperty(fieldName)) {
                return Optional.empty();
            }
            Object relationValue = wrapper.getPropertyValue(fieldName);
            if (relationValue == null) {
                return Optional.empty();
            }
            BeanWrapperImpl relationWrapper = new BeanWrapperImpl(relationValue);
            if (!relationWrapper.isReadableProperty("id")) {
                return Optional.empty();
            }
            return Optional.ofNullable(relationWrapper.getPropertyValue("id"));
        } catch (Exception e) {
            return Optional.empty();
        }
    }

    private Optional<Object> extractSimpleValue(BeanWrapperImpl wrapper, String fieldName) {
        try {
            if (!wrapper.isReadableProperty(fieldName)) {
                return Optional.empty();
            }
            PropertyDescriptor descriptor = wrapper.getPropertyDescriptor(fieldName);
            if (descriptor == null) {
                return Optional.empty();
            }
            Object value = wrapper.getPropertyValue(fieldName);
            if (value != null && isSimpleType(value.getClass())) {
                return Optional.of(value);
            }
        } catch (Exception e) {
            // Ignorar campos que no se pueden leer
        }
        return Optional.empty();
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
               clazz.equals(Instant.class) ||
               clazz.equals(LocalDate.class) ||
               clazz.isEnum() ||
               Number.class.isAssignableFrom(clazz);
    }
}
