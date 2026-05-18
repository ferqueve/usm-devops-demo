package com.utec.backend.config;

import com.utec.backend.security.interceptor.ActivityTrackingInterceptor;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * Configuración de interceptores de Spring MVC
 */
@Configuration
@RequiredArgsConstructor
public class WebMvcConfig implements WebMvcConfigurer {

    private final ActivityTrackingInterceptor activityTrackingInterceptor;
    private final CacheControlInterceptor cacheControlInterceptor;

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        // Agregar interceptor de tracking de actividad
        // Excluir endpoints públicos y de auth
        registry.addInterceptor(activityTrackingInterceptor)
                .addPathPatterns("/api/v1/**")
                .excludePathPatterns(
                        "/api/v1/auth/**",
                        "/api/v1/oauth2/**",
                        "/actuator/**"
                );

        // Cache de catálogos: permite que el navegador reutilice respuestas
        // sin re-pedirlas en cada navegación. Solo aplica a paths catalogados.
        registry.addInterceptor(cacheControlInterceptor)
                .addPathPatterns("/api/v1/**");
    }
}
