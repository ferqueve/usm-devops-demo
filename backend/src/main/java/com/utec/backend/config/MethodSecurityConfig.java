package com.utec.backend.config;

import com.utec.backend.security.CustomPermissionEvaluator;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.access.PermissionEvaluator;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;

/**
 * Configuración de seguridad a nivel de métodos.
 * Habilita el uso de @PreAuthorize y @PostAuthorize con hasPermission()
 */
@Configuration
@EnableMethodSecurity(prePostEnabled = true)
public class MethodSecurityConfig {

    @Bean
    public PermissionEvaluator permissionEvaluator() {
        return new CustomPermissionEvaluator();
    }
}

