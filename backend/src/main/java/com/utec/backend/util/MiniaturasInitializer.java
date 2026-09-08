package com.utec.backend.util;

import com.utec.backend.repository.EspacioRepository;
import com.utec.backend.service.FileStorageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

/**
 * Genera al arrancar las miniaturas que falten.
 *
 * Las fotos subidas antes de que existieran las miniaturas seguirian
 * sirviendose enteras -- 1,9 MB cada una para dibujar una tarjeta de 279 px --
 * y no hay forma de saber cuales faltan sin mirar el bucket. Se hace una vez
 * por arranque y es idempotente: si la miniatura ya esta, no la vuelve a
 * generar.
 */
@Slf4j
@Component
@Order(100)
@RequiredArgsConstructor
public class MiniaturasInitializer implements ApplicationRunner {

    private final EspacioRepository espacioRepository;
    private final FileStorageService fileStorageService;

    @Override
    public void run(ApplicationArguments args) {
        // En hilo aparte: bajar y reescalar fotos de 4K tarda, y el arranque no
        // puede esperar -- Railway corta el despliegue si el healthcheck no
        // responde a tiempo.
        Thread hilo = new Thread(this::generarFaltantes, "miniaturas-init");
        hilo.setDaemon(true);
        hilo.start();
    }

    private void generarFaltantes() {
        int generadas = 0;
        int yaEstaban = 0;

        for (var espacio : espacioRepository.findAll()) {
            String imagen = espacio.getImagenUrl();
            if (imagen == null || imagen.isBlank() || fileStorageService.getMiniaturaObjectName(imagen) == null) {
                continue;
            }
            if (fileStorageService.existeMiniatura(imagen)) {
                yaEstaban++;
            } else if (fileStorageService.generarMiniatura(imagen)) {
                generadas++;
            }
        }

        if (generadas > 0 || yaEstaban > 0) {
            log.info("Miniaturas de espacios: {} generadas, {} ya existian", generadas, yaEstaban);
        }
    }
}
