package com.utec.backend.audit;

import com.utec.backend.service.AuditService;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationContext;
import org.springframework.stereotype.Component;

/**
 * Holder bean encargado de exponer el {@link ApplicationContext} hacia clases
 * que no son gestionadas por Spring (por ejemplo, listeners JPA instanciados
 * por Hibernate).
 *
 * <p>Se mantiene la única instancia del bean (singleton de Spring) en un
 * campo estático poblado en {@link #init()}. De esta manera, los métodos de
 * acceso son estáticos (necesario para el listener) sin que un setter de
 * instancia escriba directamente en estado estático.</p>
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class AuditBeanHolder {

    private static AuditBeanHolder instance;

    private final ApplicationContext context;

    @PostConstruct
    void init() {
        register(this);
    }

    private static synchronized void register(AuditBeanHolder holder) {
        instance = holder;
    }

    public static AuditService getAuditService() {
        if (instance == null || instance.context == null) {
            return null;
        }
        try {
            return instance.context.getBean(AuditService.class);
        } catch (Exception e) {
            log.warn("No se pudo obtener AuditService: {}", e.getMessage());
            return null;
        }
    }
}
