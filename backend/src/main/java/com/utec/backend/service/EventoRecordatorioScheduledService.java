package com.utec.backend.service;

import com.utec.backend.model.Evento;
import com.utec.backend.model.EventoInscripcion;
import com.utec.backend.model.Usuario;
import com.utec.backend.repository.EventoInscripcionRepository;
import com.utec.backend.repository.EventoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.util.List;

/**
 * Recordatorio por email a los inscriptos de los eventos que arrancan dentro de
 * {@code DIAS_ANTES} días. El esqueleto del recorrido lo pone
 * {@link RecordatorioAgendaService}; acá sólo va lo propio del evento: la cadencia,
 * la ventana, a quién se le avisa y qué dice el mail.
 */
@Service
@RequiredArgsConstructor
public class EventoRecordatorioScheduledService {

    private static final String ESTADO_PUBLICADO = "PUBLICADO";
    private static final String ESTADO_ESPERA = "ESPERA";
    private static final int DIAS_ANTES = 2;

    private final EventoRepository eventoRepository;
    private final EventoInscripcionRepository inscripcionRepository;
    private final RecordatorioAgendaService recordatorios;

    /** Se ejecuta todos los días a las 8:00. */
    @Scheduled(cron = "0 0 8 * * ?")
    @Transactional
    public void enviarRecordatorios() {
        recordatorios.notificarProximos(
                eventoRepository.findByEstadoAndRecordatorioEnviadoFalseAndDeletedAtIsNull(ESTADO_PUBLICADO),
                Evento::getInicio,
                Duration.ofDays(DIAS_ANTES),
                this::avisoDe,
                evento -> {
                    evento.setRecordatorioEnviado(true);
                    eventoRepository.save(evento);
                },
                "eventos");
    }

    private RecordatorioAgendaService.Aviso avisoDe(Evento evento) {
        String cuando = evento.getInicio() != null
                ? RecordatorioAgendaService.FMT.format(evento.getInicio())
                : "próximamente";
        String lugar = evento.getEspacio() != null ? (" en " + evento.getEspacio().getNombre()) : "";
        return new RecordatorioAgendaService.Aviso(
                "Recordatorio · " + evento.getTitulo(),
                "Te recordamos que el evento \"" + evento.getTitulo() + "\" es el "
                        + cuando + lugar + ". ¡Te esperamos!",
                destinatarios(evento));
    }

    /** Inscriptos con lugar confirmado: los de lista de espera todavía no van. */
    private List<String> destinatarios(Evento evento) {
        return inscripcionRepository.findByEventoIdAndDeletedAtIsNull(evento.getId()).stream()
                .filter(i -> !ESTADO_ESPERA.equals(i.getEstado()))
                .map(EventoInscripcion::getUsuario)
                .filter(u -> u != null && u.getEmail() != null)
                .map(Usuario::getEmail)
                .toList();
    }
}
