package com.utec.backend.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Locale;
import java.util.function.Consumer;
import java.util.function.Function;

/**
 * Motor común de recordatorios por email para agendables (tutorías y eventos).
 *
 * <p>Los dos flujos tenían el mismo esqueleto escrito dos veces: recorrer los
 * pendientes, descartar los que caen fuera de la ventana, mandar un mail por
 * destinatario y marcar la entidad como ya avisada. Lo que de verdad cambia es la
 * cadencia, el ancho de la ventana y el texto — eso lo pone cada llamador.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class RecordatorioAgendaService {

    /** Formato de fecha usado en los mails: "jueves 21 de agosto a las 14:00". */
    public static final DateTimeFormatter FMT = DateTimeFormatter
            .ofPattern("EEEE d 'de' MMMM 'a las' HH:mm", new Locale("es", "UY"))
            .withZone(ZoneId.of("America/Montevideo"));

    private final EmailService emailService;

    /** Qué mandar y a quién, para una entidad concreta. */
    public record Aviso(String asunto, String mensaje, List<String> destinatarios) {}

    /**
     * Recorre los candidatos, avisa a los que arrancan dentro de la ventana y los marca.
     *
     * @param candidatos  entidades con el recordatorio todavía sin enviar
     * @param inicioDe    cómo obtener el inicio de cada una
     * @param ventana     hasta cuándo mirar hacia adelante desde ahora
     * @param avisoDe     qué mail mandar para cada una
     * @param marcarYGuardar cómo dejar registrado que ya se avisó
     * @param etiqueta    nombre para el log
     * @return cantidad de entidades notificadas
     */
    public <T> int notificarProximos(List<T> candidatos,
                                     Function<T, Instant> inicioDe,
                                     java.time.Duration ventana,
                                     Function<T, Aviso> avisoDe,
                                     Consumer<T> marcarYGuardar,
                                     String etiqueta) {
        Instant ahora = Instant.now();
        Instant limite = ahora.plus(ventana);
        int notificadas = 0;
        int emails = 0;

        for (T entidad : candidatos) {
            Instant inicio = inicioDe.apply(entidad);
            if (inicio == null || inicio.isBefore(ahora) || inicio.isAfter(limite)) {
                continue;
            }
            Aviso aviso = avisoDe.apply(entidad);
            for (String email : aviso.destinatarios()) {
                if (emailService.enviarNotificacionSimple(email, aviso.asunto(), aviso.mensaje())) {
                    emails++;
                }
            }
            marcarYGuardar.accept(entidad);
            notificadas++;
        }

        if (notificadas > 0) {
            log.info("Recordatorios de {}: {} notificadas, {} emails", etiqueta, notificadas, emails);
        }
        return notificadas;
    }
}
