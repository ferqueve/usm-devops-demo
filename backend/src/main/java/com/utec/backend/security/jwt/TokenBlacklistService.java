package com.utec.backend.security.jwt;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;

/**
 * Servicio para gestionar tokens en blacklist usando Redis
 * Redis maneja automáticamente la expiración de tokens mediante TTL
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class TokenBlacklistService {

    private final JwtService jwtService;
    private final StringRedisTemplate redisTemplate;
    
    private static final String BLACKLIST_KEY_PREFIX = "token:blacklist:";

    /**
     * Agrega un token a la blacklist en Redis con TTL automático
     * El TTL se calcula basándose en el tiempo restante hasta la expiración del token
     */
    public void blacklistToken(String token) {
        try {
            Long expiration = extractExpirationFromToken(token);
            if (expiration != null) {
                long currentTime = System.currentTimeMillis();
                long ttlMillis = expiration - currentTime;
                
                // Solo agregar si el token aún no ha expirado
                if (ttlMillis > 0) {
                    String key = BLACKLIST_KEY_PREFIX + token;
                    // Usar SET con EX (expiration en segundos)
                    redisTemplate.opsForValue().set(key, "1", Duration.ofMillis(ttlMillis));
                    log.debug("Token agregado a blacklist en Redis con TTL de {} ms", ttlMillis);
                } else {
                    log.debug("Token ya expirado, no se agrega a blacklist");
                }
            }
        } catch (Exception e) {
            log.error("Error al agregar token a blacklist: {}", e.getMessage(), e);
        }
    }

    /**
     * Verifica si un token está en la blacklist
     */
    public boolean isTokenBlacklisted(String token) {
        try {
            String key = BLACKLIST_KEY_PREFIX + token;
            Boolean exists = redisTemplate.hasKey(key);
            return Boolean.TRUE.equals(exists);
        } catch (Exception e) {
            log.error("Error al verificar token en blacklist: {}", e.getMessage(), e);
            // En caso de error, retornar false para no bloquear requests
            return false;
        }
    }

    /**
     * Extrae la fecha de expiración del token JWT
     */
    private Long extractExpirationFromToken(String token) {
        try {
            return jwtService.extractClaim(token, claims -> claims.getExpiration().getTime());
        } catch (Exception e) {
            log.error("Error al extraer expiración del token: {}", e.getMessage());
            return null;
        }
    }
}
