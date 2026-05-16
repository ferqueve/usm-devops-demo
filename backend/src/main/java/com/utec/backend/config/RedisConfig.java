package com.utec.backend.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.cache.RedisCacheConfiguration;
import org.springframework.data.redis.cache.RedisCacheManager;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.JacksonObjectWriter;
import org.springframework.data.redis.serializer.RedisSerializationContext;
import org.springframework.data.redis.serializer.StringRedisSerializer;

import java.time.Duration;
import java.util.HashMap;
import java.util.Map;

/**
 * Configuración de Redis para cache y almacenamiento distribuido.
 *
 * Usamos {@link GenericJackson2JsonRedisSerializer#builder()} — su {@code TypeResolverBuilder}
 * interno emite el campo {@code @class} también en raíces de colecciones, lo que evita
 * el bug "expected VALUE_STRING ... for subtype of Object" al deserializar List<DTO>
 * (que aparece si se activa el typing de Jackson manualmente con As.PROPERTY o WRAPPER_ARRAY).
 */
@Configuration
@EnableCaching
public class RedisConfig {

    @Value("${cache.usuarioStats.ttl:600000}")
    private long usuarioStatsTtl;

    @Value("${cache.inventarioStatistics.ttl:300000}")
    private long inventarioStatisticsTtl;

    @Value("${cache.espacios.ttl:900000}")
    private long espaciosTtl;

    @Value("${cache.reservas.ttl:120000}")
    private long reservasTtl;

    @Value("${cache.recomendaciones.ttl:1800000}")
    private long recomendacionesTtl;

    @Value("${cache.recomendaciones.metricas.ttl:86400000}")
    private long recomendacionesMetricasTtl;

    private GenericJackson2JsonRedisSerializer redisSerializer() {
        ObjectMapper mapper = new ObjectMapper();
        mapper.registerModule(new JavaTimeModule());
        // writer customizado: forzar el tipo estático Object al serializar, de modo que
        // Jackson emita el hint @class en la raíz también para List/Map/colecciones
        // (sin esto, una List<DTO> se guarda como [{...}] sin marcador de tipo en la raíz
        // y al leerla rompe con "expected VALUE_STRING ... for subtype of Object")
        JacksonObjectWriter rootTypedWriter = (om, source) ->
                om.writerFor(Object.class).writeValueAsBytes(source);
        return GenericJackson2JsonRedisSerializer.builder()
                .objectMapper(mapper)
                .defaultTyping(true)
                .typeHintPropertyName("@class")
                .writer(rootTypedWriter)
                .build();
    }

    @Bean
    public StringRedisTemplate stringRedisTemplate(RedisConnectionFactory connectionFactory) {
        return new StringRedisTemplate(connectionFactory);
    }

    @Bean
    public RedisTemplate<String, Object> redisTemplate(RedisConnectionFactory connectionFactory) {
        RedisTemplate<String, Object> template = new RedisTemplate<>();
        template.setConnectionFactory(connectionFactory);

        template.setKeySerializer(new StringRedisSerializer());
        template.setHashKeySerializer(new StringRedisSerializer());

        GenericJackson2JsonRedisSerializer jsonSerializer = redisSerializer();
        template.setValueSerializer(jsonSerializer);
        template.setHashValueSerializer(jsonSerializer);

        template.afterPropertiesSet();
        return template;
    }

    @Bean
    public CacheManager cacheManager(RedisConnectionFactory redisConnectionFactory) {
        Map<String, RedisCacheConfiguration> cacheConfigurations = new HashMap<>();

        RedisCacheConfiguration defaultConfig = RedisCacheConfiguration.defaultCacheConfig()
                .entryTtl(Duration.ofMillis(600000))
                .serializeKeysWith(RedisSerializationContext.SerializationPair.fromSerializer(new StringRedisSerializer()))
                .serializeValuesWith(RedisSerializationContext.SerializationPair.fromSerializer(redisSerializer()))
                .disableCachingNullValues();

        cacheConfigurations.put("usuarioStats", defaultConfig.entryTtl(Duration.ofMillis(usuarioStatsTtl)));
        cacheConfigurations.put("inventarioStatistics", defaultConfig.entryTtl(Duration.ofMillis(inventarioStatisticsTtl)));
        cacheConfigurations.put("espacios", defaultConfig.entryTtl(Duration.ofMillis(espaciosTtl)));
        cacheConfigurations.put("reservas", defaultConfig.entryTtl(Duration.ofMillis(reservasTtl)));
        cacheConfigurations.put("recomendaciones", defaultConfig.entryTtl(Duration.ofMillis(recomendacionesTtl)));
        cacheConfigurations.put("recomendaciones:metricas", defaultConfig.entryTtl(Duration.ofMillis(recomendacionesMetricasTtl)));

        return RedisCacheManager.builder(redisConnectionFactory)
                .cacheDefaults(defaultConfig)
                .withInitialCacheConfigurations(cacheConfigurations)
                .transactionAware()
                .build();
    }
}
