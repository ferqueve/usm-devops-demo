package com.utec.backend.service;

import com.utec.backend.exception.EspacioOcupadoException;
import com.utec.backend.model.Evento;
import com.utec.backend.model.Reserva;
import com.utec.backend.model.Tutoria;
import com.utec.backend.repository.EventoRepository;
import com.utec.backend.repository.ReservaRepository;
import com.utec.backend.repository.TutoriaRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

/**
 * Punto único de verdad sobre si un espacio físico está libre en un rango horario.
 *
 * <p>Sobre un mismo espacio conviven tres calendarios: las reservas ({@link Reserva}),
 * las tutorías ({@link Tutoria}) y los eventos ({@link Evento}). Antes de este servicio
 * cada uno agendaba sin consultar a los otros, así que un aula podía quedar tomada por
 * los tres a la vez.
 *
 * <p>Las actividades sin espacio asignado (por ejemplo una tutoría virtual) no ocupan
 * nada y nunca dan conflicto.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class OcupacionEspacioService {

    private static final DateTimeFormatter HORA =
            DateTimeFormatter.ofPattern("dd/MM HH:mm").withZone(ZoneId.of("America/Montevideo"));

    private final ReservaRepository reservaRepository;
    private final TutoriaRepository tutoriaRepository;
    private final EventoRepository eventoRepository;

    /**
     * Verifica que el espacio esté libre en el rango, o lanza.
     *
     * @param espacioId   espacio a ocupar; si es null no se valida nada
     * @param inicio      inicio del rango
     * @param fin         fin del rango
     * @param excluirTipo tipo de la actividad que se está guardando, para no chocar consigo misma
     * @param excluirId   id de esa actividad (null al crear)
     * @throws EspacioOcupadoException si algo ya ocupa el espacio en ese rango
     */
    @Transactional(readOnly = true)
    public void validarLibre(Long espacioId, Instant inicio, Instant fin,
                             TipoActividad excluirTipo, Long excluirId) {
        List<String> conflictos = buscarConflictos(espacioId, inicio, fin, excluirTipo, excluirId);
        if (conflictos.isEmpty()) {
            return;
        }
        log.warn("Espacio {} ocupado entre {} y {}: {}", espacioId, inicio, fin, conflictos);
        throw new EspacioOcupadoException(
                "El espacio ya está ocupado en ese horario por: " + String.join("; ", conflictos));
    }

    /**
     * Devuelve una descripción de cada cosa que ocupa el espacio en el rango.
     * Lista vacía significa que está libre.
     */
    @Transactional(readOnly = true)
    public List<String> buscarConflictos(Long espacioId, Instant inicio, Instant fin,
                                         TipoActividad excluirTipo, Long excluirId) {
        List<String> conflictos = new ArrayList<>();
        if (espacioId == null || inicio == null || fin == null) {
            return conflictos;
        }

        Long excluirReserva = excluirTipo == TipoActividad.RESERVA ? excluirId : null;
        Long excluirTutoria = excluirTipo == TipoActividad.TUTORIA ? excluirId : null;
        Long excluirEvento = excluirTipo == TipoActividad.EVENTO ? excluirId : null;

        for (Reserva r : reservaRepository.findConflictingReservas(
                espacioId, inicio, fin, Reserva.EstadoReserva.APROBADO)) {
            if (!r.getId().equals(excluirReserva)) {
                conflictos.add(describir("Reserva", r.getTitulo(), r.getInicio(), r.getFin()));
            }
        }

        for (Tutoria t : tutoriaRepository.findSolapadasEnEspacio(espacioId, inicio, fin, excluirTutoria)) {
            String nombre = t.getMateria() != null ? t.getMateria().getNombre() : null;
            conflictos.add(describir("Tutoría", nombre, t.getInicio(), t.getFin()));
        }

        for (Evento e : eventoRepository.findSolapadosEnEspacio(espacioId, inicio, fin, excluirEvento)) {
            conflictos.add(describir("Evento", e.getTitulo(), e.getInicio(), e.getFin()));
        }

        return conflictos;
    }

    private String describir(String tipo, String nombre, Instant desde, Instant hasta) {
        String etiqueta = (nombre != null && !nombre.isBlank()) ? tipo + " \"" + nombre + "\"" : tipo;
        return etiqueta + " (" + HORA.format(desde) + " - " + HORA.format(hasta) + ")";
    }

    /** Qué tipo de actividad se está guardando, para excluirla de su propio chequeo. */
    public enum TipoActividad {
        RESERVA, TUTORIA, EVENTO
    }
}
