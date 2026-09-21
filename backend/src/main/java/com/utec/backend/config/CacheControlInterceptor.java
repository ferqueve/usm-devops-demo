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
 * a todas las respuestas. Para los catálogos basta con "no-cache": el
 * navegador puede guardarlos pero los revalida en cada uso.
 *
 * Antes era "max-age=300" y el navegador servía la lista vieja durante cinco
 * minutos después de editar o borrar: el PUT/DELETE va a /carreras/{id} y no
 * invalida /carreras. El front ya cachea estos catálogos en memoria
 * (hooks/cacheDeLista.ts), así que la caché HTTP no ahorraba nada.
 */
@Component
public class CacheControlInterceptor implements HandlerInterceptor {

    private static final String CATALOG_CACHE = "private, no-cache";

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
