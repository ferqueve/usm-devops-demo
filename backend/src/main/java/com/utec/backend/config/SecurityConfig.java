package com.utec.backend.config;

import com.utec.backend.security.jwt.JwtAuthenticationFilter;
import lombok.RequiredArgsConstructor;
import static com.utec.backend.security.Constants.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthFilter;

    // Configuraciones de CORS desde application.properties
    @Value("${cors.allowed-origins:*}")
    private String allowedOrigins;

    @Value("${cors.allowed-methods:GET,POST,PUT,DELETE,OPTIONS}")
    private String allowedMethods;

    @Value("${cors.allowed-headers:*}")
    private String allowedHeaders;

    @Value("${cors.allow-credentials:true}")
    private boolean allowCredentials;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(AbstractHttpConfigurer::disable)
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .authorizeHttpRequests(auth -> auth
                // Rutas públicas
                .requestMatchers("/api/v1/auth/**", "/api/v1/oauth2/**", "/error").permitAll()

                // Actuator y Swagger SOLO para ADMIN
                .requestMatchers("/actuator/**").hasRole(ROLE_ADMIN)
                .requestMatchers("/swagger-ui/**", "/swagger-ui.html", "/v3/api-docs/**").hasRole(ROLE_ADMIN)

                // Rutas protegidas por rol
                // Permitir acceso al perfil propio a todos los autenticados
                .requestMatchers(HttpMethod.GET, "/api/v1/usuarios/me").authenticated()
                .requestMatchers(HttpMethod.PUT, "/api/v1/usuarios/me").authenticated()
                // Permitir a DOCENTE, ADMIN y ANALISTA listar analistas
                .requestMatchers(HttpMethod.GET, "/api/v1/usuarios/analistas").hasAnyRole(ROLE_DOCENTE, ROLE_ADMIN, ROLE_ANALISTA)
                // Resto de usuarios: solo ADMIN
                .requestMatchers("/api/v1/usuarios/**").hasRole(ROLE_ADMIN)
                // Permitir estadísticas de inventario a ADMIN, ANALISTA y MANTENIMIENTO
                .requestMatchers("/api/v1/stats/inventario/detailed").hasAnyRole(ROLE_ADMIN, ROLE_MANTENIMIENTO)
                // Resto de estadísticas solo para ADMIN
                .requestMatchers("/api/v1/stats/**").hasRole(ROLE_ADMIN)
                .requestMatchers("/api/v1/audit/**").hasRole(ROLE_ADMIN)
                
                // PERMITIR LECTURA (GET) de espacios, tipos y carreras a todos los autenticados
                // Esto permite que DOCENTE, ESTUDIANTE, EXTERNO puedan ver espacios para reservas/calendario
                // Incluye GET de imágenes de espacios (acceso autenticado)
                .requestMatchers(HttpMethod.GET, "/api/v1/espacios/**").authenticated()
                .requestMatchers(HttpMethod.GET, "/api/v1/tipos-espacio/**").authenticated()
                .requestMatchers(HttpMethod.GET, "/api/v1/tipos-elemento/**").authenticated()
                .requestMatchers(HttpMethod.GET, "/api/v1/carreras/**").authenticated()
                
                // Escritura de espacios, inventario, tipos: ADMIN y MANTENIMIENTO (gestión), ANALISTA (solo visualización se maneja en métodos)
                // NOTA: Los GET ya fueron permitidos arriba, así que esto solo afecta POST, PUT, DELETE
                // Los endpoints POST/DELETE de imágenes están protegidos con @PreAuthorize en FileUploadController
                .requestMatchers("/api/v1/espacios/**", "/api/v1/espacios/*/inventario/**", "/api/v1/tipos-elemento/**", "/api/v1/tipos-espacio/**", "/api/v1/inventario/**").hasAnyRole(ROLE_ADMIN, ROLE_ANALISTA, ROLE_MANTENIMIENTO)
                
                // Escritura de carreras: ADMIN y ANALISTA
                .requestMatchers("/api/v1/carreras/**").hasAnyRole(ROLE_ADMIN, ROLE_ANALISTA)
                
                // Estadísticas: ADMIN, ANALISTA (reservas), MANTENIMIENTO (inventario/espacios)
                .requestMatchers("/api/v1/estadisticas/**").hasAnyRole(ROLE_ADMIN, ROLE_ANALISTA, ROLE_MANTENIMIENTO)
                .requestMatchers("/api/v1/configuracion/**").hasAnyRole(ROLE_ADMIN, ROLE_ANALISTA)
                // Reservas: ADMIN, ANALISTA (CRUD), DOCENTE (solicitar), EXTERNO (solicitar), MANTENIMIENTO (ver para ocupación)
                .requestMatchers("/api/v1/reservas/**").hasAnyRole(ROLE_ADMIN, ROLE_ANALISTA, ROLE_DOCENTE, ROLE_EXTERNO, ROLE_MANTENIMIENTO)
                // Calendario: Todos los roles autenticados
                .requestMatchers("/api/v1/calendario/**").hasAnyRole(ROLE_ADMIN, ROLE_ANALISTA, ROLE_DOCENTE, ROLE_ESTUDIANTE, ROLE_MANTENIMIENTO, ROLE_EXTERNO)

                // Solicitudes de inventario: ADMIN, ANALISTA (crear), MANTENIMIENTO (aceptar/rechazar)
                .requestMatchers("/api/v1/reservas/items-solicitados/**").hasAnyRole(ROLE_ADMIN, ROLE_ANALISTA, ROLE_MANTENIMIENTO)
                
                // Rutas autenticadas generales
                .requestMatchers("/api/v1/recomendaciones/**").authenticated()

                // Cualquier otra ruta requiere autenticación
                .anyRequest().authenticated()
            )
            .sessionManagement(session -> session
                .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            )
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        
        // Usar configuraciones desde application.properties
        configuration.setAllowedOriginPatterns(List.of(allowedOrigins.split(",")));
        configuration.setAllowedMethods(Arrays.asList(allowedMethods.split(",")));
        configuration.setAllowedHeaders(Arrays.asList(allowedHeaders.split(",")));
        configuration.setAllowCredentials(allowCredentials);
        
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }
}
