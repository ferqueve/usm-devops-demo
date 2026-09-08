package com.utec.backend.security;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.data.redis.RedisConnectionFailureException;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;

import java.time.Duration;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("IntentosDeLoginService")
class IntentosDeLoginServiceTest {

    @Mock private StringRedisTemplate redisTemplate;
    @Mock private ValueOperations<String, String> valueOps;

    @InjectMocks private IntentosDeLoginService service;

    private static final String EMAIL = "admin@utec.edu.uy";
    private static final String CLAVE = "login:fallos:admin@utec.edu.uy";

    @BeforeEach
    void setUp() {
        when(redisTemplate.opsForValue()).thenReturn(valueOps);
    }

    @Test
    @DisplayName("con pocos fallos deja intentar")
    void pocosFallos() {
        when(valueOps.get(CLAVE)).thenReturn("3");

        assertFalse(service.bloqueado(EMAIL));
    }

    @Test
    @DisplayName("al llegar al limite deja de aceptar intentos")
    void alcanzaElLimite() {
        when(valueOps.get(CLAVE)).thenReturn("8");

        assertTrue(service.bloqueado(EMAIL));
    }

    @Test
    @DisplayName("cada fallo renueva la ventana, para que los intentos seguidos no la agoten")
    void falloRenuevaLaVentana() {
        when(valueOps.increment(CLAVE)).thenReturn(4L);

        service.registrarFallo(EMAIL);

        verify(valueOps).increment(CLAVE);
        verify(redisTemplate).expire(eq(CLAVE), any(Duration.class));
    }

    @Test
    @DisplayName("un login bueno borra la cuenta de fallos")
    void exitoLimpia() {
        service.registrarExito(EMAIL);

        verify(redisTemplate).delete(CLAVE);
    }

    @Test
    @DisplayName("el email se normaliza: da igual como lo escriban")
    void emailNormalizado() {
        when(valueOps.get(CLAVE)).thenReturn("8");

        assertTrue(service.bloqueado("  ADMIN@utec.edu.uy "));
    }

    // Preferimos un login sin freno a una app en la que nadie puede entrar.
    @Test
    @DisplayName("si Redis no responde, deja pasar")
    void redisCaido() {
        when(valueOps.get(anyString())).thenThrow(new RedisConnectionFailureException("sin redis"));

        assertFalse(service.bloqueado(EMAIL));
    }

    @Test
    @DisplayName("informa cuantos minutos faltan, nunca cero")
    void minutosRestantes() {
        when(redisTemplate.getExpire(CLAVE)).thenReturn(30L);

        assertEquals(1L, service.minutosRestantes(EMAIL));
    }
}
