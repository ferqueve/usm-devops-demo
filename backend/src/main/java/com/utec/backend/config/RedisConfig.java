package com.utec.backend.config;

import com.fasterxml.jackson.annotation.JsonAutoDetect;
import com.fasterxml.jackson.annotation.PropertyAccessor;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.jsontype.impl.LaissezFaireSubTypeValidator;
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
import org.springframework.data.redis.serializer.RedisSerializationContext;
import org.springframework.data.redis.serializer.StringRedisSerializer;

import java.time.Duration;
import java.util.HashMap;
import java.util.Map;

/**
 * Configuración de Redis para cache y almacenamiento distribuido
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
    private long recomendacionesTtl; // 30 minutos

    @Value("${cache.recomendaciones.metricas.ttl:86400000}")
    private long recomendacionesMetricasTtl; // 24 horas

    /**
     * Configuración de ObjectMapper específico para Redis
     * Este mapper solo se usa para serialización de Redis, no afecta Spring MVC
     * Debe incluir información de tipo para deserialización correcta de DTOs
     */
    private ObjectMapper redisObjectMapper() {
        ObjectMapper mapper = new ObjectMapper();
        mapper.setVisibility(PropertyAccessor.ALL, JsonAutoDetect.Visibility.ANY);
        mapper.registerModule(new JavaTimeModule());
        // Activar información de tipo para deserialización correcta
        // Esto permite que Redis deserialice LinkedHashMap de vuelta al tipo correcto (UsuarioStatsDto, etc.)
        mapper.activateDefaultTyping(
            LaissezFaireSubTypeValidator.instance,
            ObjectMapper.DefaultTyping.NON_FINAL,
            com.fasterxml.jackson.annotation.JsonTypeInfo.As.PROPERTY
        );
        return mapper;
    }

    /**
     * StringRedisTemplate para operaciones simples con strings
     */
    @Bean
    public StringRedisTemplate stringRedisTemplate(RedisConnectionFactory connectionFactory) {
        return new StringRedisTemplate(connectionFactory);
    }

    /**
     * RedisTemplate para operaciones con objetos complejos
     */
    @Bean
    public RedisTemplate<String, Object> redisTemplate(RedisConnectionFactory connectionFactory) {
        RedisTemplate<String, Object> template = new RedisTemplate<>();
        template.setConnectionFactory(connectionFactory);

        // Serializador para claves (Strings)
        template.setKeySerializer(new StringRedisSerializer());
        template.setHashKeySerializer(new StringRedisSerializer());

        // Serializador para valores (JSON)
        GenericJackson2JsonRedisSerializer jsonSerializer = new GenericJackson2JsonRedisSerializer(redisObjectMapper());
        template.setValueSerializer(jsonSerializer);
        template.setHashValueSerializer(jsonSerializer);

        template.afterPropertiesSet();
        return template;
    }

    /**
     * Configuración de CacheManager con TTLs específicos por cache
     */
    @Bean
    public CacheManager cacheManager(RedisConnectionFactory redisConnectionFactory) {
        Map<String, RedisCacheConfiguration> cacheConfigurations = new HashMap<>();

        // Configuración por defecto
        RedisCacheConfiguration defaultConfig = RedisCacheConfiguration.defaultCacheConfig()
                .entryTtl(Duration.ofMillis(600000)) // 10 minutos por defecto
                .serializeKeysWith(RedisSerializationContext.SerializationPair.fromSerializer(new StringRedisSerializer()))
                .serializeValuesWith(RedisSerializationContext.SerializationPair.fromSerializer(new GenericJackson2JsonRedisSerializer(redisObjectMapper())))
                .disableCachingNullValues();

        // Configuraciones específicas por cache
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

