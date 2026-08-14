package com.utec.backend.service;

import com.utec.backend.dto.NotificacionResultadoDto;
import com.utec.backend.dto.evento.EventoCreateDto;
import com.utec.backend.dto.evento.EventoFeedbackCreateDto;
import com.utec.backend.dto.evento.EventoFeedbackResumenDto;
import com.utec.backend.dto.evento.EventoResponseDto;
import com.utec.backend.dto.evento.EventoUpdateDto;
import com.utec.backend.exception.RecursoNoEncontradoException;
import com.utec.backend.model.Espacio;
import com.utec.backend.model.Evento;
import com.utec.backend.model.EventoFeedback;
import com.utec.backend.model.EventoInscripcion;
import com.utec.backend.model.Usuario;
import com.utec.backend.repository.EspacioRepository;
import com.utec.backend.repository.EventoFeedbackRepository;
import com.utec.backend.repository.EventoInscripcionRepository;
import com.utec.backend.repository.EventoRepository;
import com.utec.backend.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import static com.utec.backend.security.Constants.ROLE_EXTERNO;

@Service
@RequiredArgsConstructor
@Transactional
public class EventoService {

    private static final String EVENTO_NO_ENCONTRADO_MSG = "Evento no encontrado con ID: ";
    private static final String USUARIO_NO_ENCONTRADO_MSG = "Usuario no encontrado: ";
    private static final String ESPACIO_NO_ENCONTRADO_MSG = "Espacio no encontrado con ID: ";
    private static final String ESTADO_BORRADOR = "BORRADOR";
    private static final String ESTADO_PUBLICADO = "PUBLICADO";
    private static final String ESTADO_FINALIZADO = "FINALIZADO";
    private static final String ESTADO_CANCELADO = "CANCELADO";
    private static final String ESTADO_INSCRITO = "INSCRITO";
    private static final String ESTADO_ESPERA = "ESPERA";
    private static final String ESTADO_ASISTIO = "ASISTIO";
    private static final int MAX_REPETICIONES = 52;
    private static final ZoneId ZONA = ZoneId.of("America/Montevideo");

    private final OcupacionEspacioService ocupacionEspacioService;
    private final EventoRepository eventoRepository;
    private final EventoInscripcionRepository inscripcionRepository;
    private final EventoFeedbackRepository feedbackRepository;
    private final EspacioRepository espacioRepository;
    private final UsuarioRepository usuarioRepository;
    private final EmailService emailService;

    /** Notifica por email a los inscriptos de un evento. Devuelve {total, enviados}. */
    @Transactional(readOnly = true)
    public NotificacionResultadoDto notificarInscriptos(Long eventoId, String asunto, String mensaje) {
        Evento evento = findActivo(eventoId);
        String asuntoFinal = (asunto == null || asunto.isBlank()) ? ("Evento · " + evento.getTitulo()) : asunto;
        int total = 0;
        int enviados = 0;
        for (EventoInscripcion i : inscripcionRepository.findByEventoIdAndDeletedAtIsNull(eventoId)) {
            Usuario u = i.getUsuario();
            if (u == null || u.getEmail() == null) {
                continue;
            }
            total++;
            if (emailService.enviarNotificacionSimple(u.getEmail(), asuntoFinal, mensaje)) {
                enviados++;
            }
        }
        return new NotificacionResultadoDto(total, enviados);
    }

    public EventoResponseDto createEvento(EventoCreateDto createDto, String organizadorEmail) {
        Espacio espacio = createDto.getEspacioId() != null ? resolveEspacio(createDto.getEspacioId()) : null;
        Usuario organizador = organizadorEmail != null
                ? usuarioRepository.findByEmail(organizadorEmail).orElse(null)
                : null;

        // Cantidad de ocurrencias: si hay recurrencia, se generan N eventos
        // desplazando inicio/fin. Sin recurrencia, una sola ocurrencia.
        int ocurrencias = calcularOcurrencias(createDto.getRecurrencia(), createDto.getRepeticiones());

        // Se validan todas las ocurrencias antes de guardar ninguna: si la tercera semana
        // choca, no queremos dejar creadas las dos primeras.
        Long espacioId = espacio != null ? espacio.getId() : null;
        for (int i = 0; i < ocurrencias; i++) {
            ocupacionEspacioService.validarLibre(
                    espacioId,
                    desplazar(createDto.getInicio(), createDto.getRecurrencia(), i),
                    desplazar(createDto.getFin(), createDto.getRecurrencia(), i),
                    OcupacionEspacioService.TipoActividad.EVENTO, null);
        }

        Evento primero = null;
        for (int i = 0; i < ocurrencias; i++) {
            Evento evento = new Evento();
            evento.setTitulo(createDto.getTitulo());
            evento.setDescripcion(createDto.getDescripcion());
            evento.setTags(normalizarTags(createDto.getTags()));
            evento.setTipo(createDto.getTipo() != null ? createDto.getTipo() : "EVENTO");
            evento.setInicio(desplazar(createDto.getInicio(), createDto.getRecurrencia(), i));
            evento.setFin(desplazar(createDto.getFin(), createDto.getRecurrencia(), i));
            evento.setCupo(createDto.getCupo());
            evento.setEsPublico(createDto.getEsPublico() != null ? createDto.getEsPublico() : Boolean.TRUE);
            evento.setEstado(ESTADO_PUBLICADO);
            evento.setEspacio(espacio);
            evento.setOrganizador(organizador);

            Evento saved = eventoRepository.save(evento);
            if (primero == null) {
                primero = saved;
            }
        }
        return mapToResponseDto(primero, null);
    }

    private int calcularOcurrencias(String recurrencia, Integer repeticiones) {
        if (recurrencia == null || recurrencia.isBlank() || "NONE".equalsIgnoreCase(recurrencia)) {
            return 1;
        }
        int n = repeticiones != null ? repeticiones : 1;
        return Math.min(Math.max(1, n), MAX_REPETICIONES);
    }

    /** Desplaza una fecha según la recurrencia y el índice de ocurrencia (0 = la original). */
    private Instant desplazar(Instant base, String recurrencia, int i) {
        if (base == null || i == 0 || recurrencia == null) {
            return base;
        }
        return switch (recurrencia.toUpperCase()) {
            case "DIARIA" -> base.plus(Duration.ofDays(i));
            case "SEMANAL" -> base.plus(Duration.ofDays(7L * i));
            // Mensual respeta la hora local de Montevideo (evita desvíos por DST).
            case "MENSUAL" -> base.atZone(ZONA).plusMonths(i).toInstant();
            default -> base;
        };
    }

    /** Normaliza la lista de tags: limpia espacios, quita vacíos y duplicados, separados por coma. */
    private String normalizarTags(String tags) {
        if (tags == null || tags.isBlank()) {
            return null;
        }
        List<String> limpios = java.util.Arrays.stream(tags.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .distinct()
                .toList();
        return limpios.isEmpty() ? null : String.join(",", limpios);
    }

    @Transactional(readOnly = true)
    public List<EventoResponseDto> listar(String email, String rol) {
        Long usuarioId = resolveUsuarioId(email);

        List<Evento> eventos;
        if (ROLE_EXTERNO.equals(rol)) {
            eventos = eventoRepository.findByEsPublicoTrueAndDeletedAtIsNull().stream()
                    .filter(e -> ESTADO_PUBLICADO.equals(e.getEstado()))
                    .toList();
        } else {
            // ADMIN / ANALISTA / DOCENTE / ESTUDIANTE: todos los no-borrador
            eventos = eventoRepository.findByDeletedAtIsNull().stream()
                    .filter(e -> !ESTADO_BORRADOR.equals(e.getEstado()))
                    .toList();
        }

        return mapToResponseDtos(eventos, usuarioId);
    }

    @Transactional(readOnly = true)
    public EventoResponseDto getEventoById(Long id, String email) {
        Evento evento = findActivo(id);
        return mapToResponseDto(evento, resolveUsuarioId(email));
    }

    public EventoResponseDto updateEvento(Long id, EventoUpdateDto updateDto) {
        Evento evento = findActivo(id);

        Integer cupoAnterior = evento.getCupo();
        Instant inicioAnterior = evento.getInicio();

        if (updateDto.getTitulo() != null) {
            evento.setTitulo(updateDto.getTitulo());
        }
        if (updateDto.getDescripcion() != null) {
            evento.setDescripcion(updateDto.getDescripcion());
        }
        if (updateDto.getTags() != null) {
            evento.setTags(normalizarTags(updateDto.getTags()));
        }
        if (updateDto.getTipo() != null) {
            evento.setTipo(updateDto.getTipo());
        }
        if (updateDto.getInicio() != null) {
            evento.setInicio(updateDto.getInicio());
        }
        if (updateDto.getFin() != null) {
            evento.setFin(updateDto.getFin());
        }
        if (updateDto.getCupo() != null) {
            evento.setCupo(updateDto.getCupo());
        }
        if (updateDto.getEsPublico() != null) {
            evento.setEsPublico(updateDto.getEsPublico());
        }
        if (updateDto.getEstado() != null) {
            evento.setEstado(updateDto.getEstado());
        }
        if (updateDto.getPatron() != null) {
            evento.setPatron(updateDto.getPatron().isBlank() ? null : updateDto.getPatron());
        }
        if (updateDto.getEspacioId() != null) {
            evento.setEspacio(resolveEspacio(updateDto.getEspacioId()));
        }

        // Se valida con los valores ya aplicados y excluyendo el propio evento, para que
        // reeditar sin mover el horario no choque consigo mismo.
        if (!ESTADO_CANCELADO.equals(evento.getEstado()) && !ESTADO_FINALIZADO.equals(evento.getEstado())) {
            ocupacionEspacioService.validarLibre(
                    evento.getEspacio() != null ? evento.getEspacio().getId() : null,
                    evento.getInicio(), evento.getFin(),
                    OcupacionEspacioService.TipoActividad.EVENTO, evento.getId());
        }

        // Si se reprogramó el inicio, rehabilitar el recordatorio para que vuelva a enviarse.
        if (evento.getInicio() != null && !evento.getInicio().equals(inicioAnterior)) {
            evento.setRecordatorioEnviado(false);
        }

        evento.setUpdatedAt(Instant.now());
        Evento updated = eventoRepository.save(evento);

        // Si aumentó el cupo, promover de la lista de espera las plazas liberadas.
        boolean cupoAumento = updated.getCupo() != null
                && (cupoAnterior == null || updated.getCupo() > cupoAnterior);
        if (cupoAumento) {
            promoverEsperaHastaCupo(updated);
        }
        return mapToResponseDto(updated, null);
    }

    public void deleteEvento(Long id) {
        Evento evento = findActivo(id);
        evento.setDeletedAt(Instant.now());
        evento.setUpdatedAt(Instant.now());
        eventoRepository.save(evento);
    }

    @Transactional
    public EventoResponseDto inscribir(Long eventoId, String email) {
        Evento evento = findActivo(eventoId);
        Usuario usuario = usuarioRepository.findByEmail(email)
                .orElseThrow(() -> new RecursoNoEncontradoException(USUARIO_NO_ENCONTRADO_MSG + email));

        if (inscripcionRepository.existsByEventoIdAndUsuarioIdAndDeletedAtIsNull(eventoId, usuario.getId())) {
            throw new IllegalStateException("Ya estás inscrito en este evento");
        }

        // Si el cupo está lleno, la inscripción entra en LISTA DE ESPERA en vez de rechazarse.
        String estado = ESTADO_INSCRITO;
        if (evento.getCupo() != null) {
            long confirmados = inscripcionRepository.countByEventoIdAndEstadoNotAndDeletedAtIsNull(eventoId, ESTADO_ESPERA);
            if (confirmados >= evento.getCupo()) {
                estado = ESTADO_ESPERA;
            }
        }

        EventoInscripcion inscripcion = new EventoInscripcion();
        inscripcion.setEvento(evento);
        inscripcion.setUsuario(usuario);
        inscripcion.setEstado(estado);
        inscripcionRepository.save(inscripcion);

        return mapToResponseDto(evento, usuario.getId());
    }

    /** Marca (o desmarca) la asistencia de una inscripción. Acción de admin/organizador. */
    @Transactional
    public void marcarAsistencia(Long inscripcionId, boolean asistio) {
        EventoInscripcion i = inscripcionRepository.findById(inscripcionId)
                .filter(x -> x.getDeletedAt() == null)
                .orElseThrow(() -> new IllegalArgumentException("Inscripción no encontrada: " + inscripcionId));
        i.setEstado(asistio ? ESTADO_ASISTIO : ESTADO_INSCRITO);
        inscripcionRepository.save(i);
    }

    /** Cancela la inscripción del usuario y promueve al primero de la lista de espera. */
    @Transactional
    public void cancelarInscripcion(Long eventoId, String email) {
        Evento evento = findActivo(eventoId);
        Usuario usuario = usuarioRepository.findByEmail(email)
                .orElseThrow(() -> new RecursoNoEncontradoException(USUARIO_NO_ENCONTRADO_MSG + email));

        EventoInscripcion inscripcion = inscripcionRepository.findByEventoIdAndDeletedAtIsNull(eventoId).stream()
                .filter(i -> i.getUsuario() != null && usuario.getId().equals(i.getUsuario().getId()))
                .findFirst()
                .orElseThrow(() -> new IllegalStateException("No estás inscrito en este evento"));

        boolean eraConfirmada = !ESTADO_ESPERA.equals(inscripcion.getEstado());
        inscripcion.setDeletedAt(Instant.now());
        inscripcionRepository.save(inscripcion);

        // Si liberó una plaza confirmada, promover al primero de la lista de espera.
        if (eraConfirmada && evento.getCupo() != null) {
            promoverPrimeroEnEspera(evento);
        }
    }

    /** Promueve la inscripción en ESPERA más antigua a INSCRITO y le avisa por email. */
    private void promoverPrimeroEnEspera(Evento evento) {
        inscripcionRepository.findByEventoIdAndDeletedAtIsNull(evento.getId()).stream()
                .filter(i -> ESTADO_ESPERA.equals(i.getEstado()))
                .min(Comparator.comparing(EventoInscripcion::getCreatedAt))
                .ifPresent(siguiente -> promover(evento, siguiente));
    }

    /** Promueve tantas inscripciones en espera como plazas libres haya (ej. al aumentar el cupo). */
    private void promoverEsperaHastaCupo(Evento evento) {
        if (evento.getCupo() == null) {
            return;
        }
        long confirmados = inscripcionRepository.countByEventoIdAndEstadoNotAndDeletedAtIsNull(evento.getId(), ESTADO_ESPERA);
        long libres = evento.getCupo() - confirmados;
        if (libres <= 0) {
            return;
        }
        inscripcionRepository.findByEventoIdAndDeletedAtIsNull(evento.getId()).stream()
                .filter(i -> ESTADO_ESPERA.equals(i.getEstado()))
                .sorted(Comparator.comparing(EventoInscripcion::getCreatedAt))
                .limit(libres)
                .forEach(i -> promover(evento, i));
    }

    private void promover(Evento evento, EventoInscripcion inscripcion) {
        inscripcion.setEstado(ESTADO_INSCRITO);
        inscripcionRepository.save(inscripcion);
        Usuario u = inscripcion.getUsuario();
        if (u != null && u.getEmail() != null) {
            emailService.enviarNotificacionSimple(u.getEmail(),
                    "¡Tenés lugar en " + evento.getTitulo() + "!",
                    "Se liberó un cupo y pasaste de la lista de espera a inscripto. ¡Te esperamos!");
        }
    }

    /** Crea o actualiza la valoración del usuario para un evento y devuelve el resumen. */
    @Transactional
    public EventoFeedbackResumenDto dejarFeedback(Long eventoId, String email, EventoFeedbackCreateDto dto) {
        Evento evento = findActivo(eventoId);
        Usuario usuario = usuarioRepository.findByEmail(email)
                .orElseThrow(() -> new RecursoNoEncontradoException(USUARIO_NO_ENCONTRADO_MSG + email));

        if (!puedeValorar(evento, usuario.getId())) {
            throw new IllegalStateException("Solo podés valorar un evento finalizado al que asististe.");
        }

        EventoFeedback fb = feedbackRepository
                .findByEventoIdAndUsuarioIdAndDeletedAtIsNull(eventoId, usuario.getId())
                .orElseGet(() -> {
                    EventoFeedback nuevo = new EventoFeedback();
                    nuevo.setEvento(evento);
                    nuevo.setUsuario(usuario);
                    return nuevo;
                });
        fb.setRating(dto.getRating());
        fb.setComentario(dto.getComentario() != null && !dto.getComentario().isBlank()
                ? dto.getComentario().trim() : null);
        feedbackRepository.save(fb);

        return getFeedbackResumen(eventoId, email);
    }

    @Transactional(readOnly = true)
    public EventoFeedbackResumenDto getFeedbackResumen(Long eventoId, String email) {
        Evento evento = findActivo(eventoId);
        Long usuarioId = resolveUsuarioId(email);

        List<EventoFeedback> lista = feedbackRepository.findByEventoIdAndDeletedAtIsNullOrderByCreatedAtDesc(eventoId);
        long total = lista.size();
        double promedio = total == 0 ? 0.0
                : Math.round(lista.stream().mapToInt(EventoFeedback::getRating).average().orElse(0) * 10) / 10.0;

        // distribucion[0] = #1★ ... distribucion[4] = #5★
        List<Long> distribucion = new ArrayList<>(List.of(0L, 0L, 0L, 0L, 0L));
        for (EventoFeedback f : lista) {
            int idx = Math.min(5, Math.max(1, f.getRating())) - 1;
            distribucion.set(idx, distribucion.get(idx) + 1);
        }

        Integer miRating = null;
        if (usuarioId != null) {
            miRating = feedbackRepository.findByEventoIdAndUsuarioIdAndDeletedAtIsNull(eventoId, usuarioId)
                    .map(EventoFeedback::getRating).orElse(null);
        }
        boolean puedeValorar = usuarioId != null && puedeValorar(evento, usuarioId);

        List<EventoFeedbackResumenDto.Item> items = lista.stream()
                .map(f -> new EventoFeedbackResumenDto.Item(
                        f.getId(),
                        f.getUsuario() != null ? f.getUsuario().getNombre() : null,
                        f.getRating(),
                        f.getComentario(),
                        f.getCreatedAt()))
                .toList();

        return new EventoFeedbackResumenDto(promedio, total, distribucion, miRating, puedeValorar, items);
    }

    /** Puede valorar si el evento está FINALIZADO y el usuario tuvo una inscripción activa (no en espera). */
    private boolean puedeValorar(Evento evento, Long usuarioId) {
        if (!ESTADO_FINALIZADO.equals(evento.getEstado())) {
            return false;
        }
        return inscripcionRepository.findByEventoIdAndDeletedAtIsNull(evento.getId()).stream()
                .anyMatch(i -> i.getUsuario() != null
                        && usuarioId.equals(i.getUsuario().getId())
                        && !ESTADO_ESPERA.equals(i.getEstado()));
    }

    @Transactional(readOnly = true)
    public List<EventoResponseDto> misInscripciones(String email) {
        Usuario usuario = usuarioRepository.findByEmail(email)
                .orElseThrow(() -> new RecursoNoEncontradoException(USUARIO_NO_ENCONTRADO_MSG + email));

        List<Evento> eventos = inscripcionRepository.findByUsuarioIdAndDeletedAtIsNull(usuario.getId()).stream()
                .map(EventoInscripcion::getEvento)
                .filter(e -> e != null && e.getDeletedAt() == null)
                .toList();
        return mapToResponseDtos(eventos, usuario.getId());
    }

    @Transactional(readOnly = true)
    public List<InscriptoDto> listarInscriptos(Long eventoId) {
        findActivo(eventoId);
        return inscripcionRepository.findByEventoIdAndDeletedAtIsNull(eventoId).stream()
                .map(i -> {
                    Usuario u = i.getUsuario();
                    return new InscriptoDto(
                            i.getId(),
                            u != null ? u.getId() : null,
                            u != null ? u.getNombre() : null,
                            u != null ? u.getEmail() : null,
                            i.getEstado(),
                            i.getCreatedAt());
                })
                .toList();
    }

    private Evento findActivo(Long id) {
        Evento evento = eventoRepository.findById(id)
                .orElseThrow(() -> new RecursoNoEncontradoException(EVENTO_NO_ENCONTRADO_MSG + id));
        if (evento.getDeletedAt() != null) {
            throw new RecursoNoEncontradoException(EVENTO_NO_ENCONTRADO_MSG + id);
        }
        return evento;
    }

    private Espacio resolveEspacio(Long espacioId) {
        return espacioRepository.findById(espacioId)
                .orElseThrow(() -> new RecursoNoEncontradoException(ESPACIO_NO_ENCONTRADO_MSG + espacioId));
    }

    private Long resolveUsuarioId(String email) {
        if (email == null) {
            return null;
        }
        return usuarioRepository.findByEmail(email)
                .map(Usuario::getId)
                .orElse(null);
    }

    /** Mapea un evento individual (conteos puntuales; usar para 1 elemento). */
    private EventoResponseDto mapToResponseDto(Evento evento, Long usuarioId) {
        long inscriptos = inscripcionRepository.countByEventoIdAndEstadoNotAndDeletedAtIsNull(evento.getId(), ESTADO_ESPERA);
        boolean yaInscrito = usuarioId != null
                && inscripcionRepository.existsByEventoIdAndUsuarioIdAndDeletedAtIsNull(evento.getId(), usuarioId);
        return construir(evento, inscriptos, usuarioId != null ? yaInscrito : null);
    }

    /** Mapea una lista de eventos con agregados batch (2 queries en vez de ~2N). */
    private List<EventoResponseDto> mapToResponseDtos(List<Evento> eventos, Long usuarioId) {
        if (eventos.isEmpty()) {
            return List.of();
        }
        List<Long> ids = eventos.stream().map(Evento::getId).toList();
        Map<Long, Long> inscriptosPorEvento = inscripcionRepository
                .contarConfirmadosPorEventos(ids, ESTADO_ESPERA).stream()
                .collect(Collectors.toMap(
                        EventoInscripcionRepository.EventoConteo::getEventoId,
                        EventoInscripcionRepository.EventoConteo::getTotal));
        Set<Long> inscritoEn = usuarioId == null ? Set.of()
                : inscripcionRepository.findByUsuarioIdAndDeletedAtIsNull(usuarioId).stream()
                        .filter(i -> i.getEvento() != null)
                        .map(i -> i.getEvento().getId())
                        .collect(Collectors.toSet());

        return eventos.stream()
                .map(e -> construir(e, inscriptosPorEvento.getOrDefault(e.getId(), 0L),
                        usuarioId != null ? inscritoEn.contains(e.getId()) : null))
                .toList();
    }

    private EventoResponseDto construir(Evento evento, long inscriptos, Boolean yaInscrito) {
        EventoResponseDto dto = new EventoResponseDto();
        dto.setId(evento.getId());
        dto.setTitulo(evento.getTitulo());
        dto.setDescripcion(evento.getDescripcion());
        dto.setTags(evento.getTags());
        dto.setTipo(evento.getTipo());
        dto.setInicio(evento.getInicio());
        dto.setFin(evento.getFin());
        dto.setCupo(evento.getCupo());
        dto.setEsPublico(evento.getEsPublico());
        dto.setEstado(evento.getEstado());
        dto.setPatron(evento.getPatron());
        dto.setCreatedAt(evento.getCreatedAt());

        if (evento.getEspacio() != null) {
            dto.setEspacioId(evento.getEspacio().getId());
            dto.setEspacioNombre(evento.getEspacio().getNombre());
        }
        if (evento.getOrganizador() != null) {
            dto.setOrganizadorNombre(evento.getOrganizador().getNombre());
        }

        dto.setInscriptosCount(inscriptos);
        if (evento.getCupo() != null) {
            dto.setPlazasDisponibles((int) Math.max(0, evento.getCupo() - inscriptos));
        }
        if (yaInscrito != null) {
            dto.setYaInscrito(yaInscrito);
        }
        return dto;
    }

    /** DTO interno para exponer los inscriptos de un evento. */
    public record InscriptoDto(
            Long inscripcionId,
            Long usuarioId,
            String nombre,
            String email,
            String estado,
            Instant createdAt) {
    }
}
