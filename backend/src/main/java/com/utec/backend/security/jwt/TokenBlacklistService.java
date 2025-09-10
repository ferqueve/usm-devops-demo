package com.utec.backend.security.jwt;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

@Slf4j
@Service
@RequiredArgsConstructor
public class TokenBlacklistService {

    private final JwtService jwtService;
    private final ConcurrentHashMap<String, Long> blacklistedTokens = new ConcurrentHashMap<>();
    private final ScheduledExecutorService scheduler = Executors.newScheduledThreadPool(1);

    @PostConstruct
    public void scheduleCleanup() {
        // Limpiar tokens expirados cada hora
        scheduler.scheduleAtFixedRate(this::cleanExpiredTokens, 1, 1, TimeUnit.HOURS);
    }

    public void blacklistToken(String token) {
        try {
            Long expiration = extractExpirationFromToken(token);
            if (expiration != null) {
                blacklistedTokens.put(token, expiration);
                log.info("Token agregado a blacklist");
            }
        } catch (Exception e) {
            log.error("Error al agregar token a blacklist: {}", e.getMessage());
        }
    }

    public boolean isTokenBlacklisted(String token) {
        return blacklistedTokens.containsKey(token);
    }

    private Long extractExpirationFromToken(String token) {
        try {
            return jwtService.extractClaim(token, claims -> claims.getExpiration().getTime());
        } catch (Exception e) {
            log.error("Error al extraer expiración del token: {}", e.getMessage());
            return null;
        }
    }

    private void cleanExpiredTokens() {
        try {
            long currentTime = System.currentTimeMillis();
            blacklistedTokens.entrySet().removeIf(entry -> entry.getValue() < currentTime);
            log.info("Tokens expirados removidos de blacklist. Tamaño actual: {}", blacklistedTokens.size());
        } catch (Exception e) {
            log.error("Error limpiando tokens expirados: {}", e.getMessage());
        }
    }

    public void shutdown() {
        scheduler.shutdown();
    }
}
