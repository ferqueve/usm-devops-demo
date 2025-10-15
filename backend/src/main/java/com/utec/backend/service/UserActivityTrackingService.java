package com.utec.backend.service;

import com.utec.backend.dto.ActiveUserDTO;
import com.utec.backend.dto.ActiveUsersStatsDTO;
import com.utec.backend.model.entity.Usuario;
import com.utec.backend.repository.UsuarioRepository;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

/**
 * Servicio para trackear actividad de usuarios en tiempo real
 * Usa ConcurrentHashMap para almacenar actividad en memoria
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class UserActivityTrackingService {

    private final UsuarioRepository usuarioRepository;
    
    // Almacenamiento en memoria de actividad de usuarios
    private final Map<String, ActiveUserDTO> activeUsersMap = new ConcurrentHashMap<>();
    
    // Timeout de inactividad en minutos
    private static final int INACTIVITY_TIMEOUT_MINUTES = 5;

    /**
     * Registra actividad de un usuario
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
            
            activeUsersMap.put(email, activeUser);
            
        } catch (Exception e) {
            log.error("Error al trackear actividad del usuario {}: {}", email, e.getMessage());
        }
    }

    /**
     * Obtiene estadísticas de usuarios activos
     */
    public ActiveUsersStatsDTO getActiveUsers() {
        // Limpiar usuarios inactivos antes de retornar
        cleanInactiveUsers();
        
        List<ActiveUserDTO> activeUsers = activeUsersMap.values().stream()
                .sorted((a, b) -> b.getLastActivity().compareTo(a.getLastActivity()))
                .collect(Collectors.toList());
        
        return ActiveUsersStatsDTO.builder()
                .totalActiveUsers(activeUsers.size())
                .activeUsers(activeUsers)
                .build();
    }

    /**
     * Limpia usuarios inactivos (más de 5 minutos sin actividad)
     * Se ejecuta automáticamente cada minuto
     */
    @Scheduled(fixedRate = 60000) // Cada 60 segundos
    public void cleanInactiveUsers() {
        LocalDateTime cutoffTime = LocalDateTime.now().minus(INACTIVITY_TIMEOUT_MINUTES, ChronoUnit.MINUTES);
        
        List<String> inactiveUsers = activeUsersMap.entrySet().stream()
                .filter(entry -> entry.getValue().getLastActivity().isBefore(cutoffTime))
                .map(Map.Entry::getKey)
                .collect(Collectors.toList());
        
        inactiveUsers.forEach(email -> {
            activeUsersMap.remove(email);
            log.debug("Usuario inactivo removido del tracking: {}", email);
        });
        
        if (!inactiveUsers.isEmpty()) {
            log.info("Limpieza de usuarios inactivos: {} usuarios removidos", inactiveUsers.size());
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

