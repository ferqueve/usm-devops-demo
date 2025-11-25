package com.utec.backend.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.utec.backend.dto.stats.ActiveUserDTO;
import com.utec.backend.dto.stats.ActiveUsersStatsDTO;
import com.utec.backend.model.Usuario;
import com.utec.backend.repository.UsuarioRepository;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Servicio para trackear actividad de usuarios en tiempo real usando Redis
 * Redis maneja automáticamente la expiración de usuarios inactivos mediante TTL
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class UserActivityTrackingService {

    private final UsuarioRepository usuarioRepository;
    private final StringRedisTemplate redisTemplate;
    
    // ObjectMapper local para serialización/deserialización JSON
    private static final ObjectMapper objectMapper = new ObjectMapper().registerModule(new JavaTimeModule());
    
    private static final String ACTIVITY_KEY_PREFIX = "user:activity:";
    private static final String ACTIVITY_SET_KEY = "users:active";
    // Timeout de inactividad en minutos
    private static final int INACTIVITY_TIMEOUT_MINUTES = 5;
    private static final Duration INACTIVITY_TIMEOUT = Duration.ofMinutes(INACTIVITY_TIMEOUT_MINUTES);

    /**
     * Registra actividad de un usuario en Redis
     * El registro expira automáticamente después de INACTIVITY_TIMEOUT_MINUTES
     */
    public void trackUserActivity(String email, HttpServletRequest request) {
        if (email == null || email.isEmpty()) {
            return;
        }

        try {
            // Buscar información del usuario en la base de datos
            Usuario usuario = usuarioRepository.findByEmail(email).orElse(null);
            
            if (usuario == null) {
                log.warn("Usuario no encontrado para tracking: {}", email);
                return;
            }

            // Extraer información del request
            String ipAddress = getClientIp(request);
            String userAgent = request.getHeader("User-Agent");
            
            // Crear o actualizar registro de actividad
            // Separar nombre en nombre y apellido si contiene espacio
            String nombreCompleto = usuario.getNombre();
            String nombre = nombreCompleto;
            String apellido = "";
            
            int spaceIndex = nombreCompleto.indexOf(' ');
            if (spaceIndex > 0) {
                nombre = nombreCompleto.substring(0, spaceIndex);
                apellido = nombreCompleto.substring(spaceIndex + 1);
            }
            
            ActiveUserDTO activeUser = ActiveUserDTO.builder()
                    .email(email)
                    .nombre(nombre)
                    .apellido(apellido)
                    .rol(usuario.getRolApp().name())
                    .lastActivity(LocalDateTime.now())
                    .ipAddress(ipAddress)
                    .userAgent(userAgent != null ? userAgent : "Unknown")
                    .build();
            
            // Guardar en Redis con TTL automático
            String key = ACTIVITY_KEY_PREFIX + email;
            String jsonValue = objectMapper.writeValueAsString(activeUser);
            redisTemplate.opsForValue().set(key, jsonValue, INACTIVITY_TIMEOUT);
            
            // Agregar email al set de usuarios activos (también con TTL)
            redisTemplate.opsForSet().add(ACTIVITY_SET_KEY, email);
            redisTemplate.expire(ACTIVITY_SET_KEY, INACTIVITY_TIMEOUT);
            
        } catch (JsonProcessingException e) {
            log.error("Error al serializar actividad del usuario {}: {}", email, e.getMessage());
        } catch (Exception e) {
            log.error("Error al trackear actividad del usuario {}: {}", email, e.getMessage());
        }
    }

    /**
     * Obtiene estadísticas de usuarios activos desde Redis
     * Redis maneja automáticamente la eliminación de usuarios expirados mediante TTL
     */
    public ActiveUsersStatsDTO getActiveUsers() {
        try {
            // Obtener todos los emails de usuarios activos del set
            Set<String> activeUserEmails = redisTemplate.opsForSet().members(ACTIVITY_SET_KEY);
            
            if (activeUserEmails == null || activeUserEmails.isEmpty()) {
                return ActiveUsersStatsDTO.builder()
                        .totalActiveUsers(0)
                        .activeUsers(List.of())
                        .build();
            }
            
            // Obtener datos de cada usuario activo
            List<ActiveUserDTO> activeUsers = activeUserEmails.stream()
                    .map(email -> {
                        String key = ACTIVITY_KEY_PREFIX + email;
                        String jsonValue = redisTemplate.opsForValue().get(key);
                        if (jsonValue != null) {
                            try {
                                return objectMapper.readValue(jsonValue, ActiveUserDTO.class);
                            } catch (JsonProcessingException e) {
                                log.warn("Error al deserializar actividad del usuario {}: {}", email, e.getMessage());
                                return null;
                            }
                        }
                        return null;
                    })
                    .filter(user -> user != null)
                    .sorted((a, b) -> b.getLastActivity().compareTo(a.getLastActivity()))
                    .collect(Collectors.toList());
            
            return ActiveUsersStatsDTO.builder()
                    .totalActiveUsers(activeUsers.size())
                    .activeUsers(activeUsers)
                    .build();
                    
        } catch (Exception e) {
            log.error("Error al obtener usuarios activos: {}", e.getMessage(), e);
            return ActiveUsersStatsDTO.builder()
                    .totalActiveUsers(0)
                    .activeUsers(List.of())
                    .build();
        }
    }

    /**
     * Obtiene la IP real del cliente, considerando proxies
     */
    private String getClientIp(HttpServletRequest request) {
        String[] headerNames = {
            "X-Forwarded-For",
            "X-Real-IP",
            "Proxy-Client-IP",
            "WL-Proxy-Client-IP",
            "HTTP_X_FORWARDED_FOR",
            "HTTP_X_FORWARDED",
            "HTTP_X_CLUSTER_CLIENT_IP",
            "HTTP_CLIENT_IP",
            "HTTP_FORWARDED_FOR",
            "HTTP_FORWARDED",
            "HTTP_VIA",
            "REMOTE_ADDR"
        };

        for (String header : headerNames) {
            String ip = request.getHeader(header);
            if (ip != null && !ip.isEmpty() && !"unknown".equalsIgnoreCase(ip)) {
                // Si hay múltiples IPs, tomar la primera
                if (ip.contains(",")) {
                    ip = ip.split(",")[0].trim();
                }
                return ip;
            }
        }

        return request.getRemoteAddr();
    }
}

