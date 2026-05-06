package com.utec.backend.security.jwt;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import com.utec.backend.service.CustomUserDetailsService;
import com.utec.backend.repository.UsuarioRepository;
import io.jsonwebtoken.ExpiredJwtException;

import java.io.IOException;

@Component
@RequiredArgsConstructor
@Slf4j
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private static final String CONTENT_TYPE_JSON = "application/json";

    private final JwtService jwtService;
    private final CustomUserDetailsService userDetailsService;
    private final TokenBlacklistService tokenBlacklistService;
    private final UsuarioRepository usuarioRepository;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                  HttpServletResponse response,
                                  FilterChain filterChain) throws ServletException, IOException {

        if (request.getRequestURI().contains("/auth/refresh")) {
            filterChain.doFilter(request, response);
            return;
        }

        String jwt = extractBearerToken(request);
        if (jwt == null) {
            filterChain.doFilter(request, response);
            return;
        }

        if (tokenBlacklistService.isTokenBlacklisted(jwt)) {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            return;
        }

        try {
            authenticateWithJwt(jwt, request);
            filterChain.doFilter(request, response);
        } catch (ExpiredJwtException e) {
            log.warn("Token JWT expirado detectado para usuario: {}", e.getClaims().getSubject());
            writeUnauthorized(response, "Token JWT expirado", "Tu token ha expirado");
        } catch (IllegalStateException e) {
            if ("Usuario inactivo".equals(e.getMessage())) {
                log.warn("Intento de acceso con token JWT para usuario inactivo");
                writeUnauthorized(response, "Usuario inactivo",
                        "Tu cuenta ha sido desactivada. Por favor, contacta al administrador.");
                return;
            }
            throw e;
        } catch (Exception e) {
            log.warn("Token JWT inválido detectado: {}", e.getMessage());
            writeUnauthorized(response, "Token JWT inválido", "Token inválido");
        }
    }

    private String extractBearerToken(HttpServletRequest request) {
        String authHeader = request.getHeader("Authorization");
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return null;
        }
        return authHeader.substring("Bearer ".length());
    }

    private void authenticateWithJwt(String jwt, HttpServletRequest request) {
        String userEmail = jwtService.extractUsername(jwt);
        if (userEmail == null || SecurityContextHolder.getContext().getAuthentication() != null) {
            return;
        }
        ensureUsuarioActivo(userEmail);

        UserDetails userDetails = this.userDetailsService.loadUserByUsername(userEmail);
        if (!jwtService.isTokenValid(jwt, userDetails)) {
            return;
        }
        UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                userDetails, null, userDetails.getAuthorities());
        authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
        SecurityContextHolder.getContext().setAuthentication(authToken);
    }

    private void ensureUsuarioActivo(String userEmail) {
        var usuarioOpt = usuarioRepository.findByEmail(userEmail);
        if (usuarioOpt.isPresent() && usuarioOpt.get().getDeletedAt() != null) {
            log.warn("Intento de acceso con token JWT para usuario inactivo: {}", userEmail);
            throw new IllegalStateException("Usuario inactivo");
        }
    }

    private void writeUnauthorized(HttpServletResponse response, String error, String message) throws IOException {
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        response.setContentType(CONTENT_TYPE_JSON);
        response.getWriter().write("{\"error\":\"" + error + "\",\"message\":\"" + message + "\"}");
    }
}
