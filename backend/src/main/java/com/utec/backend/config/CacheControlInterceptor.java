package com.utec.backend.config;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

/**
 * Sobrescribe el Cache-Control para catálogos prácticamente inmutables.
 *
 * Spring Security por defecto agrega "no-cache, no-store, must-revalidate"
 * a todas las respuestas. Para endpoints de lectura de catálogos eso impide
 * que el navegador reutilice la respuesta entre navegaciones, generando
 * tráfico innecesario. Permitimos cache privada de 5 minutos para esos casos.
 */
@Component
public class CacheControlInterceptor implements HandlerInterceptor {

    private static final String CATALOG_CACHE = "private, max-age=300";

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        if (!HttpMethod.GET.matches(request.getMethod())) return true;

        String uri = request.getRequestURI();
        if (isCatalog(uri)) {
            response.setHeader(HttpHeaders.CACHE_CONTROL, CATALOG_CACHE);
            response.setHeader(HttpHeaders.PRAGMA, "");
            response.setHeader(HttpHeaders.EXPIRES, "");
        }
        return true;
    }

    private boolean isCatalog(String uri) {
        return uri.startsWith("/api/v1/tipos-espacio")
                || uri.startsWith("/api/v1/tipos-elemento")
                || uri.startsWith("/api/v1/carreras")
                || uri.startsWith("/api/v1/edificios");
    }
}
