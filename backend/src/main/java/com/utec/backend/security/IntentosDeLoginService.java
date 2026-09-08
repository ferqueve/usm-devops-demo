package com.utec.backend.security;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;

/**
 * Frena los intentos de login por fuerza bruta.
 *
 * Cuenta los fallos por email en Redis y, pasado el límite, deja de aceptar
 * intentos por un rato. Sin esto se podían probar contraseñas sin ningún tope.
 *
 * Si Redis no responde, deja pasar: preferimos un login sin freno a una app en
 * la que nadie puede entrar porque se cayó el contador.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class IntentosDeLoginService {

    /** Fallos seguidos antes de cerrar la puerta. */
    private static final int LIMITE = 8;
    /** Cuánto dura el bloqueo, y cuánto se recuerda cada fallo. */
    private static final Duration VENTANA = Duration.ofMinutes(15);
    private static final String PREFIJO = "login:fallos:";

    private final StringRedisTemplate redisTemplate;

    /** true si a este email ya no se le aceptan más intentos por ahora. */
    public boolean bloqueado(String email) {
        try {
            String valor = redisTemplate.opsForValue().get(clave(email));
            return valor != null && Integer.parseInt(valor) >= LIMITE;
        } catch (Exception e) {
            log.warn("No se pudo consultar los intentos de login: {}", e.getMessage());
            return false;
        }
    }

    /** Suma un fallo y reinicia la ventana, para que los intentos seguidos no la agoten. */
    public void registrarFallo(String email) {
        try {
            String clave = clave(email);
            Long fallos = redisTemplate.opsForValue().increment(clave);
            redisTemplate.expire(clave, VENTANA);
            if (fallos != null && fallos >= LIMITE) {
                log.warn("Login bloqueado por {} intentos fallidos: {}", fallos, email);
            }
        } catch (Exception e) {
            log.warn("No se pudo registrar el intento fallido: {}", e.getMessage());
        }
    }

    /** Un login bueno borra la cuenta de fallos. */
    public void registrarExito(String email) {
        try {
            redisTemplate.delete(clave(email));
        } catch (Exception e) {
            log.warn("No se pudo limpiar los intentos de login: {}", e.getMessage());
        }
    }

    /** Minutos que faltan para poder reintentar. Al menos 1, para no decir "0 minutos". */
    public long minutosRestantes(String email) {
        try {
            Long segundos = redisTemplate.getExpire(clave(email));
            if (segundos == null || segundos <= 0) {
                return VENTANA.toMinutes();
            }
            return Math.max(1, segundos / 60);
        } catch (Exception e) {
            return VENTANA.toMinutes();
        }
    }

    private String clave(String email) {
        return PREFIJO + (email == null ? "" : email.toLowerCase().trim());
    }
}
