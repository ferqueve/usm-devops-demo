package com.utec.backend.security.interceptor;

import com.utec.backend.service.UserActivityTrackingService;
import com.utec.backend.security.jwt.JwtService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

/**
 * Interceptor para trackear actividad de usuarios autenticados
 * Captura cada request con JWT válido y registra la actividad
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class ActivityTrackingInterceptor implements HandlerInterceptor {

    private final UserActivityTrackingService activityTrackingService;
    private final JwtService jwtService;

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        try {
            // Extraer token del header Authorization
            String authHeader = request.getHeader("Authorization");
            
            if (authHeader != null && authHeader.startsWith("Bearer ")) {
                String token = authHeader.substring(7);
                
                // Extraer email del token
                String email = jwtService.extractUsername(token);
                
                if (email != null && !email.isEmpty()) {
                    // Trackear actividad del usuario
                    activityTrackingService.trackUserActivity(email, request);
                }
            }
        } catch (Exception e) {
            // No interrumpir el flujo normal si hay error en tracking
            log.debug("Error al trackear actividad: {}", e.getMessage());
        }
        
        // Siempre continuar con la request
        return true;
    }
}

