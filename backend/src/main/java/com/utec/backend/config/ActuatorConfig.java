package com.utec.backend.config;

import org.springframework.boot.actuate.web.exchanges.HttpExchangeRepository;
import org.springframework.boot.actuate.web.exchanges.InMemoryHttpExchangeRepository;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Configuración para endpoints de Actuator
 */
@Configuration
public class ActuatorConfig {

    /**
     * Bean para habilitar el endpoint httpexchanges
     * Almacena las últimas 100 peticiones HTTP en memoria
     */
    @Bean
    public HttpExchangeRepository httpExchangeRepository() {
        InMemoryHttpExchangeRepository repository = new InMemoryHttpExchangeRepository();
        repository.setCapacity(100); // Almacenar últimas 100 peticiones
        return repository;
    }
}
