package com.utec.backend.e2e;

import org.springframework.cache.CacheManager;
import org.springframework.cache.support.NoOpCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.context.annotation.Profile;

/**
 * En el perfil <code>e2e</code> reemplazamos el {@code CacheManager} basado en
 * Redis por un {@link NoOpCacheManager}. Las pruebas extremo a extremo siempre
 * deben leer el estado real de la base, sin que un valor cacheado de un test
 * anterior contamine el resultado del siguiente, y la serialización JSON con
 * tipado polimórfico no agrega valor cuando el cache está vacío.
 *
 * <p>Marcamos el bean como {@link Primary} para que gane sobre el definido en
 * {@code RedisConfig}; las pruebas mantienen la inyección de
 * {@code StringRedisTemplate} para servicios que sí dependen de Redis
 * (recordatorios, actividad de usuarios) sin tocar caché.
 */
@Configuration
@Profile("e2e")
public class E2ECacheConfig {

    @Bean(name = "cacheManager")
    @Primary
    CacheManager noOpCacheManager() {
        return new NoOpCacheManager();
    }
}
