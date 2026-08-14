package com.utec.backend.service;

import com.utec.backend.model.Evento;
import com.utec.backend.model.EventoInscripcion;
import com.utec.backend.model.Usuario;
import com.utec.backend.repository.EventoInscripcionRepository;
import com.utec.backend.repository.EventoRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.Locale;

/**
 * Envía un recordatorio por email a los inscriptos de los eventos que arrancan
 * dentro de los próximos {@code DIAS_ANTES} días. Usa el flag
 * {@code recordatorio_enviado} de cada evento para no duplicar el aviso.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class EventoRecordatorioScheduledService {

    private static final String ESTADO_PUBLICADO = "PUBLICADO";
    private static final String ESTADO_ESPERA = "ESPERA";
    private static final int DIAS_ANTES = 2;

    private static final DateTimeFormatter FMT = DateTimeFormatter
            .ofPattern("EEEE d 'de' MMMM 'a las' HH:mm", new Locale("es", "UY"))
            .withZone(ZoneId.of("America/Montevideo"));

    private final EventoRepository eventoRepository;
    private final EventoInscripcionRepository inscripcionRepository;
    private final EmailService emailService;

    /** Se ejecuta todos los días a las 8:00. */
    @Scheduled(cron = "0 0 8 * * ?")
    @Transactional
    public void enviarRecordatorios() {
        Instant ahora = Instant.now();
        Instant limite = ahora.plus(Duration.ofDays(DIAS_ANTES));
        log.info("Recordatorios de eventos: buscando eventos PUBLICADO entre {} y {}", ahora, limite);

        int eventosNotificados = 0;
        int emailsEnviados = 0;

        for (Evento evento : eventoRepository.findByEstadoAndRecordatorioEnviadoFalseAndDeletedAtIsNull(ESTADO_PUBLICADO)) {
            Instant inicio = evento.getInicio();
            if (inicio == null || inicio.isBefore(ahora) || inicio.isAfter(limite)) {
                continue;
            }
            emailsEnviados += notificarEvento(evento);
            evento.setRecordatorioEnviado(true);
            eventoRepository.save(evento);
            eventosNotificados++;
        }

        log.info("Recordatorios de eventos: {} eventos, {} emails enviados", eventosNotificados, emailsEnviados);
    }

    private int notificarEvento(Evento evento) {
        String asunto = "Recordatorio · " + evento.getTitulo();
        String cuando = evento.getInicio() != null ? FMT.format(evento.getInicio()) : "próximamente";
        String lugar = evento.getEspacio() != null ? (" en " + evento.getEspacio().getNombre()) : "";
        String mensaje = "Te recordamos que el evento \"" + evento.getTitulo() + "\" es el "
                + cuando + lugar + ". ¡Te esperamos!";

        int enviados = 0;
        for (EventoInscripcion i : inscripcionRepository.findByEventoIdAndDeletedAtIsNull(evento.getId())) {
            if (ESTADO_ESPERA.equals(i.getEstado())) {
                continue;
            }
            Usuario u = i.getUsuario();
            if (u != null && u.getEmail() != null && emailService.enviarNotificacionSimple(u.getEmail(), asunto, mensaje)) {
                enviados++;
            }
        }
        return enviados;
    }
}
