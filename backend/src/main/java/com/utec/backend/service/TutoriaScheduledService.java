package com.utec.backend.service;

import com.utec.backend.model.Tutoria;
import com.utec.backend.model.TutoriaReserva;
import com.utec.backend.model.Usuario;
import com.utec.backend.repository.TutoriaRepository;
import com.utec.backend.repository.TutoriaReservaRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.List;

/**
 * Tareas programadas de tutorías:
 *  - Recordatorio por email a los agendados ~24h antes (con pedido de confirmación).
 *  - Liberación de cupos de quienes no confirmaron, ~2h antes, promoviendo la lista de espera.
 *
 * <p>El recorrido del recordatorio lo pone {@link RecordatorioAgendaService}, compartido
 * con eventos. La liberación de cupos es propia de tutorías: los eventos no piden
 * confirmación previa.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class TutoriaScheduledService {

    private static final String ESTADO_ABIERTA = "ABIERTA";
    private static final String ESTADO_AGENDADA = "AGENDADA";
    private static final String ESTADO_ESPERA = "ESPERA";
    private static final String ESTADO_CANCELADA = "CANCELADA";

    private final TutoriaRepository tutoriaRepository;
    private final TutoriaReservaRepository reservaRepository;
    private final EmailService emailService;
    private final TutoriaService tutoriaService;
    private final RecordatorioAgendaService recordatorios;

    /** Cada hora: recordatorio a los agendados de tutorías que arrancan dentro de 24h. */
    @Scheduled(cron = "0 0 * * * ?")
    @Transactional
    public void enviarRecordatorios() {
        recordatorios.notificarProximos(
                tutoriaRepository.findByEstadoAndRecordatorioEnviadoFalseAndDeletedAtIsNull(ESTADO_ABIERTA),
                Tutoria::getInicio,
                Duration.ofDays(1),
                this::avisoDe,
                tutoria -> {
                    tutoria.setRecordatorioEnviado(true);
                    tutoriaRepository.save(tutoria);
                },
                "tutorías");
    }

    private RecordatorioAgendaService.Aviso avisoDe(Tutoria t) {
        String materia = t.getMateria() != null ? t.getMateria().getNombre() : "tu tutoría";
        String cuando = t.getInicio() != null ? RecordatorioAgendaService.FMT.format(t.getInicio()) : "pronto";
        return new RecordatorioAgendaService.Aviso(
                "Recordatorio · Tutoría de " + materia,
                "Te recordamos tu tutoría de " + materia + " el " + cuando
                        + ". Por favor confirmá tu asistencia en la app; si no confirmás, el cupo puede liberarse.",
                destinatarios(t));
    }

    /** Agendados con lugar: los de lista de espera y los cancelados no reciben aviso. */
    private List<String> destinatarios(Tutoria t) {
        return reservaRepository.findByTutoriaIdAndDeletedAtIsNull(t.getId()).stream()
                .filter(r -> !ESTADO_ESPERA.equals(r.getEstado()) && !ESTADO_CANCELADA.equals(r.getEstado()))
                .map(TutoriaReserva::getEstudiante)
                .filter(u -> u != null && u.getEmail() != null)
                .map(Usuario::getEmail)
                .toList();
    }

    /** Cada hora (:30): libera cupos de no-confirmados ~2h antes y promueve la lista de espera. */
    @Scheduled(cron = "0 30 * * * ?")
    @Transactional
    public void liberarNoConfirmados() {
        Instant ahora = Instant.now();
        Instant ventana = ahora.plus(Duration.ofHours(2));
        int liberados = 0;

        for (Tutoria t : tutoriaRepository.findByEstadoAndDeletedAtIsNull(ESTADO_ABIERTA)) {
            Instant inicio = t.getInicio();
            if (inicio == null || inicio.isBefore(ahora) || inicio.isAfter(ventana)) {
                continue;
            }
            for (TutoriaReserva r : reservaRepository.findByTutoriaIdAndDeletedAtIsNull(t.getId())) {
                if (ESTADO_AGENDADA.equals(r.getEstado()) && Boolean.FALSE.equals(r.getConfirmada())) {
                    r.setEstado(ESTADO_CANCELADA);
                    r.setDeletedAt(ahora);
                    reservaRepository.save(r);
                    avisarLiberado(r);
                    tutoriaService.promoverPrimeroEnEspera(t);
                    liberados++;
                }
            }
        }
        if (liberados > 0) {
            log.info("Tutorías: {} reservas liberadas por falta de confirmación", liberados);
        }
    }

    private void avisarLiberado(TutoriaReserva r) {
        Usuario u = r.getEstudiante();
        String materia = r.getTutoria().getMateria() != null ? r.getTutoria().getMateria().getNombre() : "la tutoría";
        if (u != null && u.getEmail() != null) {
            emailService.enviarNotificacionSimple(u.getEmail(),
                    "Tu cupo en la tutoría de " + materia + " se liberó",
                    "Como no confirmaste tu asistencia, liberamos tu lugar para que otro estudiante pueda aprovecharlo.");
        }
    }
}
