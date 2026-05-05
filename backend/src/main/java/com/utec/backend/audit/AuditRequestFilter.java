package com.utec.backend.audit;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * Filtro HTTP para capturar información de la request y almacenarla en AuditContext.
 * Se ejecuta para todas las requests y guarda:
 * - IP address del cliente
 * - HTTP method (GET, POST, PUT, DELETE, etc.)
 * - Endpoint/URI solicitado
 * - User-Agent del cliente
 */
@Slf4j
@Component
@Order(1) // Ejecutar temprano en la cadena de filtros
public class AuditRequestFilter extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        try {
            // Capturar información de la request
            String ipAddress = getClientIpAddress(request);
            String httpMethod = request.getMethod();
            String endpoint = request.getRequestURI();
            String userAgent = request.getHeader("User-Agent");

            // Guardar en AuditContext ThreadLocal
            AuditContext.setRequestInfo(ipAddress, httpMethod, endpoint, userAgent);

            // Continuar con la cadena de filtros
            filterChain.doFilter(request, response);
        } finally {
            // El contexto se limpia desde AuditAspect después de persistir el log.
        }
    }

    /**
     * Obtener la dirección IP real del cliente, considerando proxies y balanceadores
     */
    private String getClientIpAddress(HttpServletRequest request) {
        // Intentar obtener IP de headers comunes usados por proxies/balanceadores
        String[] headerNames = {
            "X-Forwarded-For",
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

        for (String headerName : headerNames) {
            String ip = request.getHeader(headerName);
            if (ip != null && !ip.isEmpty() && !"unknown".equalsIgnoreCase(ip)) {
                // X-Forwarded-For puede contener múltiples IPs separadas por coma
                // La primera es la IP del cliente original
                if (ip.contains(",")) {
                    ip = ip.split(",")[0].trim();
                }
                return ip;
            }
        }

        // Si no hay headers de proxy, usar la IP remota directa
        String remoteAddr = request.getRemoteAddr();
        return remoteAddr != null ? remoteAddr : "UNKNOWN";
    }

    /**
     * No aplicar el filtro a endpoints estáticos o de actuator
     */
    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        // No filtrar recursos estáticos, actuator, o health checks
        return path.startsWith("/actuator") ||
               path.startsWith("/static") ||
               path.startsWith("/public") ||
               path.endsWith(".css") ||
               path.endsWith(".js") ||
               path.endsWith(".png") ||
               path.endsWith(".jpg") ||
               path.endsWith(".ico");
    }
}
