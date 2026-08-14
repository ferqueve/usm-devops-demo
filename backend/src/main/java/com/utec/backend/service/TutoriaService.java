package com.utec.backend.service;

import com.utec.backend.dto.NotificacionResultadoDto;
import com.utec.backend.dto.tutoria.RachaDto;
import com.utec.backend.dto.tutoria.TutorRankingDto;
import com.utec.backend.dto.tutoria.TutoriaAgendadoDto;
import com.utec.backend.dto.tutoria.TutoriaCreateDto;
import com.utec.backend.dto.tutoria.TutoriaFeedbackCreateDto;
import com.utec.backend.dto.tutoria.TutoriaFeedbackResumenDto;
import com.utec.backend.dto.tutoria.TutoriaRecursoDto;
import com.utec.backend.dto.tutoria.TutoriaResponseDto;
import com.utec.backend.dto.tutoria.TutoriaUpdateDto;
import com.utec.backend.exception.RecursoNoEncontradoException;
import com.utec.backend.exception.AccesoDenegadoException;
import com.utec.backend.model.Espacio;
import com.utec.backend.model.Materia;
import com.utec.backend.model.Tutoria;
import com.utec.backend.model.TutoriaFeedback;
import com.utec.backend.model.TutoriaRecurso;
import com.utec.backend.model.TutoriaReserva;
import com.utec.backend.model.Usuario;
import com.utec.backend.repository.EspacioRepository;
import com.utec.backend.repository.MateriaRepository;
import com.utec.backend.repository.TutoriaFeedbackRepository;
import com.utec.backend.repository.TutoriaRecursoRepository;
import com.utec.backend.repository.TutoriaRepository;
import com.utec.backend.repository.TutoriaReservaRepository;
import com.utec.backend.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class TutoriaService {

    private static final String TUTORIA_NO_ENCONTRADA_MSG = "Tutoría no encontrada con ID: ";
    private static final String RESERVA_NO_ENCONTRADA_MSG = "Reserva de tutoría no encontrada con ID: ";
    private static final String MATERIA_NO_ENCONTRADA_MSG = "Materia no encontrada con ID: ";
    private static final String ESPACIO_NO_ENCONTRADO_MSG = "Espacio no encontrado con ID: ";
    private static final String USUARIO_NO_ENCONTRADO_MSG = "Usuario no encontrado con email: ";
    private static final String ESTADO_ABIERTA = "ABIERTA";
    private static final String ESTADO_CERRADA = "CERRADA";
    private static final String ESTADO_AGENDADA = "AGENDADA";
    private static final String ESTADO_ESPERA = "ESPERA";
    private static final String ESTADO_CANCELADA = "CANCELADA";
    private static final String ESTADO_ASISTIO = "ASISTIO";
    private static final int MAX_REPETICIONES = 52;
    private static final ZoneId ZONA = ZoneId.of("America/Montevideo");

    private final OcupacionEspacioService ocupacionEspacioService;
    private final TutoriaRepository tutoriaRepository;
    private final TutoriaReservaRepository tutoriaReservaRepository;
    private final TutoriaFeedbackRepository feedbackRepository;
    private final TutoriaRecursoRepository recursoRepository;
    private final MateriaRepository materiaRepository;
    private final EspacioRepository espacioRepository;
    private final UsuarioRepository usuarioRepository;
    private final EmailService emailService;

    private boolean esAdminOAnalista(Usuario u) {
        return u.getRolApp() == Usuario.RolApp.ADMIN || u.getRolApp() == Usuario.RolApp.ANALISTA;
    }

    /**
     * Exige que el usuario sea el docente dueño de la tutoría, o admin/analista.
     *
     * @param accion qué se estaba intentando hacer, para el mensaje de error
     * @throws AccesoDenegadoException si no lo es
     */
    private void exigirDuenoOGestor(Tutoria tutoria, Usuario usuario, String accion) {
        boolean esDueno = tutoria.getDocente() != null
                && tutoria.getDocente().getId().equals(usuario.getId());
        if (!esAdminOAnalista(usuario) && !esDueno) {
            throw new AccesoDenegadoException("No tienes permiso para " + accion);
        }
    }

    @Transactional(readOnly = true)
    public TutoriaResponseDto getById(Long id) {
        return mapToResponseDto(findActiva(id));
    }

    /** Lista los estudiantes agendados (activos) de una tutoría, con su temario. */
    @Transactional(readOnly = true)
    public List<TutoriaAgendadoDto> getAgendados(Long tutoriaId) {
        return tutoriaReservaRepository.findByTutoriaIdAndDeletedAtIsNull(tutoriaId).stream()
                .filter(r -> !ESTADO_CANCELADA.equals(r.getEstado()))
                .map(r -> {
                    Usuario e = r.getEstudiante();
                    return new TutoriaAgendadoDto(
                            r.getId(),
                            e != null ? e.getId() : null,
                            e != null ? e.getNombre() : null,
                            e != null ? e.getEmail() : null,
                            r.getEstado(),
                            r.getTemario(),
                            r.getConfirmada(),
                            r.getCreatedAt());
                })
                .toList();
    }

    public void eliminar(Long id, String email) {
        Tutoria t = findActiva(id);
        Usuario u = resolveUsuario(email);
        exigirDuenoOGestor(t, u, "eliminar esta tutoría");
        t.setEstado(ESTADO_CANCELADA);
        t.setDeletedAt(Instant.now());
        tutoriaRepository.save(t);
    }

    @Transactional(readOnly = true)
    public NotificacionResultadoDto notificarAgendados(Long tutoriaId, String asunto, String mensaje) {
        Tutoria t = findActiva(tutoriaId);
        String materiaNombre = t.getMateria() != null ? t.getMateria().getNombre() : "";
        String asuntoFinal = (asunto == null || asunto.isBlank()) ? ("Tutoría · " + materiaNombre) : asunto;
        int total = 0;
        int enviados = 0;
        for (TutoriaReserva r : tutoriaReservaRepository.findByTutoriaIdAndDeletedAtIsNull(tutoriaId)) {
            if (ESTADO_CANCELADA.equals(r.getEstado()) || ESTADO_ESPERA.equals(r.getEstado())) {
                continue;
            }
            Usuario e = r.getEstudiante();
            if (e == null || e.getEmail() == null) {
                continue;
            }
            total++;
            if (emailService.enviarNotificacionSimple(e.getEmail(), asuntoFinal, mensaje)) {
                enviados++;
            }
        }
        return new NotificacionResultadoDto(total, enviados);
    }

    public TutoriaResponseDto crear(TutoriaCreateDto dto, String emailDocente) {
        Usuario docente = resolveUsuario(emailDocente);
        Materia materia = materiaRepository.findById(dto.getMateriaId())
                .orElseThrow(() -> new RecursoNoEncontradoException(MATERIA_NO_ENCONTRADA_MSG + dto.getMateriaId()));
        Espacio espacio = resolveEspacio(dto.getEspacioId());

        if (dto.getFin().isBefore(dto.getInicio()) || dto.getFin().equals(dto.getInicio())) {
            throw new IllegalArgumentException("La fecha/hora de fin debe ser posterior a la de inicio");
        }

        int ocurrencias = calcularOcurrencias(dto.getRecurrencia(), dto.getRepeticiones());
        Long espacioId = espacio != null ? espacio.getId() : null;

        // Se validan todas las ocurrencias antes de guardar ninguna: si la tercera semana
        // choca, no queremos dejar creadas las dos primeras.
        for (int i = 0; i < ocurrencias; i++) {
            ocupacionEspacioService.validarLibre(
                    espacioId,
                    desplazar(dto.getInicio(), dto.getRecurrencia(), i),
                    desplazar(dto.getFin(), dto.getRecurrencia(), i),
                    OcupacionEspacioService.TipoActividad.TUTORIA, null);
        }

        Tutoria primera = null;
        for (int i = 0; i < ocurrencias; i++) {
            Tutoria tutoria = new Tutoria();
            tutoria.setMateria(materia);
            tutoria.setDocente(docente);
            tutoria.setEspacio(espacio);
            tutoria.setInicio(desplazar(dto.getInicio(), dto.getRecurrencia(), i));
            tutoria.setFin(desplazar(dto.getFin(), dto.getRecurrencia(), i));
            tutoria.setCupo(dto.getCupo());
            tutoria.setEstado(ESTADO_ABIERTA);
            tutoria.setModalidad(dto.getModalidad() != null ? dto.getModalidad() : "PRESENCIAL");
            tutoria.setEnlace(dto.getEnlace());
            tutoria.setTipo(dto.getTipo() != null ? dto.getTipo() : "GRUPAL");
            tutoria.setTags(normalizarTags(dto.getTags()));
            Tutoria saved = tutoriaRepository.save(tutoria);
            if (primera == null) {
                primera = saved;
            }
        }
        return mapToResponseDto(primera);
    }

    @Transactional(readOnly = true)
    public List<TutoriaResponseDto> listar(Long materiaId) {
        List<Tutoria> tutorias = (materiaId != null)
                ? tutoriaRepository.findByMateriaIdAndDeletedAtIsNull(materiaId)
                : tutoriaRepository.findByDeletedAtIsNull();
        return mapToResponseDtos(tutorias);
    }

    /** Franjas de tutoría que dicta el usuario. Vacío si no dicta ninguna. */
    @Transactional(readOnly = true)
    public List<TutoriaResponseDto> tutoriasQueDicta(String email) {
        Usuario usuario = resolveUsuario(email);
        return mapToResponseDtos(tutoriaRepository.findByDocenteIdAndDeletedAtIsNull(usuario.getId()));
    }

    /**
     * Tutorías que el usuario tiene agendadas como estudiante, con los datos de su
     * propia reserva (id, estado, si confirmó, temario) pegados al dto.
     */
    @Transactional(readOnly = true)
    public List<TutoriaResponseDto> tutoriasAgendadas(String email) {
        Usuario usuario = resolveUsuario(email);

        List<TutoriaReserva> reservas = tutoriaReservaRepository.findByEstudianteIdAndDeletedAtIsNull(usuario.getId()).stream()
                .filter(r -> !ESTADO_CANCELADA.equals(r.getEstado())
                        && r.getTutoria() != null && r.getTutoria().getDeletedAt() == null)
                .toList();
        List<Tutoria> tutorias = reservas.stream().map(TutoriaReserva::getTutoria).toList();
        Map<Long, TutoriaResponseDto> porId = mapToResponseDtos(tutorias).stream()
                .collect(Collectors.toMap(TutoriaResponseDto::getId, Function.identity(), (a, b) -> a, LinkedHashMap::new));

        List<TutoriaResponseDto> result = new ArrayList<>();
        for (TutoriaReserva reserva : reservas) {
            // 1 reserva activa por (estudiante, tutoría), así que cada dto se usa una sola vez.
            TutoriaResponseDto dto = porId.get(reserva.getTutoria().getId());
            if (dto == null) {
                continue;
            }
            dto.setReservaId(reserva.getId());
            dto.setReservaEstado(reserva.getEstado());
            dto.setReservaConfirmada(reserva.getConfirmada());
            dto.setReservaTemario(reserva.getTemario());
            result.add(dto);
        }
        return result;
    }

    public TutoriaResponseDto editar(Long id, TutoriaUpdateDto dto, String email) {
        Tutoria tutoria = findActiva(id);
        Usuario usuario = resolveUsuario(email);
        exigirDuenoOGestor(tutoria, usuario, "editar esta tutoría");

        Integer cupoAnterior = tutoria.getCupo();
        Instant inicioAnterior = tutoria.getInicio();

        if (dto.getMateriaId() != null) {
            tutoria.setMateria(materiaRepository.findById(dto.getMateriaId())
                    .orElseThrow(() -> new RecursoNoEncontradoException(MATERIA_NO_ENCONTRADA_MSG + dto.getMateriaId())));
        }
        if (dto.getEspacioId() != null) {
            tutoria.setEspacio(resolveEspacio(dto.getEspacioId()));
        }
        if (dto.getInicio() != null) {
            tutoria.setInicio(dto.getInicio());
        }
        if (dto.getFin() != null) {
            tutoria.setFin(dto.getFin());
        }
        if (dto.getCupo() != null) {
            tutoria.setCupo(dto.getCupo());
        }
        if (dto.getEstado() != null && !dto.getEstado().isBlank()) {
            tutoria.setEstado(dto.getEstado());
        }
        if (dto.getModalidad() != null) {
            tutoria.setModalidad(dto.getModalidad());
        }
        if (dto.getEnlace() != null) {
            tutoria.setEnlace(dto.getEnlace().isBlank() ? null : dto.getEnlace());
        }
        if (dto.getTipo() != null) {
            tutoria.setTipo(dto.getTipo());
        }
        if (dto.getTags() != null) {
            tutoria.setTags(normalizarTags(dto.getTags()));
        }
        if (dto.getPatron() != null) {
            tutoria.setPatron(dto.getPatron().isBlank() ? null : dto.getPatron());
        }

        if (tutoria.getFin().isBefore(tutoria.getInicio()) || tutoria.getFin().equals(tutoria.getInicio())) {
            throw new IllegalArgumentException("La fecha/hora de fin debe ser posterior a la de inicio");
        }

        // Se valida con los valores ya aplicados y excluyendo la propia tutoría, para que
        // reeditar sin mover el horario no choque consigo misma.
        if (!ESTADO_CANCELADA.equals(tutoria.getEstado())) {
            ocupacionEspacioService.validarLibre(
                    tutoria.getEspacio() != null ? tutoria.getEspacio().getId() : null,
                    tutoria.getInicio(), tutoria.getFin(),
                    OcupacionEspacioService.TipoActividad.TUTORIA, tutoria.getId());
        }

        // Si se reprogramó el inicio, rehabilitar el recordatorio para que vuelva a enviarse.
        if (tutoria.getInicio() != null && !tutoria.getInicio().equals(inicioAnterior)) {
            tutoria.setRecordatorioEnviado(false);
        }

        Tutoria guardada = tutoriaRepository.save(tutoria);

        // Si aumentó el cupo, promover de la lista de espera las plazas liberadas.
        boolean cupoAumento = guardada.getCupo() != null
                && (cupoAnterior == null || guardada.getCupo() > cupoAnterior);
        if (cupoAumento) {
            promoverEsperaHastaCupo(guardada);
        }
        return mapToResponseDto(guardada);
    }

    /** Activa/desactiva el modo "disponible en vivo" (walk-in). */
    public TutoriaResponseDto toggleEnVivo(Long id, String email, boolean activo) {
        Tutoria tutoria = findActiva(id);
        Usuario usuario = resolveUsuario(email);
        exigirDuenoOGestor(tutoria, usuario, "modificar esta tutoría");
        tutoria.setEnVivo(activo);
        return mapToResponseDto(tutoriaRepository.save(tutoria));
    }

    public TutoriaResponseDto agendar(Long tutoriaId, String emailEstudiante, String temario) {
        Tutoria tutoria = findActiva(tutoriaId);
        Usuario estudiante = resolveUsuario(emailEstudiante);

        if (!ESTADO_ABIERTA.equals(tutoria.getEstado())) {
            throw new IllegalStateException("La tutoría no está abierta para agendar");
        }
        if (tutoriaReservaRepository.existsByTutoriaIdAndEstudianteIdAndDeletedAtIsNull(tutoriaId, estudiante.getId())) {
            throw new IllegalStateException("Ya estás agendado en esta tutoría");
        }

        // Cupo lleno -> lista de espera en vez de rechazar.
        long confirmados = tutoriaReservaRepository.countByTutoriaIdAndEstadoNotAndDeletedAtIsNull(tutoriaId, ESTADO_ESPERA);
        String estado = (confirmados >= tutoria.getCupo()) ? ESTADO_ESPERA : ESTADO_AGENDADA;

        TutoriaReserva reserva = new TutoriaReserva();
        reserva.setTutoria(tutoria);
        reserva.setEstudiante(estudiante);
        reserva.setEstado(estado);
        reserva.setTemario(temario != null && !temario.isBlank() ? temario.trim() : null);
        reserva.setConfirmada(false);
        tutoriaReservaRepository.save(reserva);

        return mapToResponseDto(tutoria);
    }

    /** El estudiante confirma asistencia (anti no-show). */
    public void confirmarReserva(Long reservaId, String email) {
        TutoriaReserva reserva = findReservaActiva(reservaId);
        Usuario usuario = resolveUsuario(email);
        if (reserva.getEstudiante() == null || !reserva.getEstudiante().getId().equals(usuario.getId())) {
            throw new IllegalStateException("Solo el estudiante puede confirmar su reserva");
        }
        reserva.setConfirmada(true);
        tutoriaReservaRepository.save(reserva);
    }

    /** Marca la asistencia (check-in) de una reserva. Docente dueño o admin. */
    public void marcarAsistencia(Long reservaId, boolean asistio, String email) {
        TutoriaReserva reserva = findReservaActiva(reservaId);
        Usuario usuario = resolveUsuario(email);
        Tutoria tutoria = reserva.getTutoria();
        exigirDuenoOGestor(tutoria, usuario, "marcar asistencia en esta tutoría");
        reserva.setEstado(asistio ? ESTADO_ASISTIO : ESTADO_AGENDADA);
        tutoriaReservaRepository.save(reserva);
    }

    public void cancelarReserva(Long reservaId, String email) {
        TutoriaReserva reserva = findReservaActiva(reservaId);
        Usuario usuario = resolveUsuario(email);
        boolean esEstudianteDueno = reserva.getEstudiante() != null
                && reserva.getEstudiante().getId().equals(usuario.getId());
        boolean esDocenteDeTutoria = reserva.getTutoria().getDocente() != null
                && reserva.getTutoria().getDocente().getId().equals(usuario.getId());
        if (!esEstudianteDueno && !esDocenteDeTutoria) {
            throw new AccesoDenegadoException("No tienes permiso para cancelar esta reserva");
        }

        boolean eraConfirmada = !ESTADO_ESPERA.equals(reserva.getEstado());
        Tutoria tutoria = reserva.getTutoria();
        reserva.setEstado(ESTADO_CANCELADA);
        reserva.setDeletedAt(Instant.now());
        tutoriaReservaRepository.save(reserva);

        if (eraConfirmada) {
            promoverPrimeroEnEspera(tutoria);
        }
    }

    /**
     * Promueve la reserva en ESPERA más antigua a AGENDADA y le avisa por email.
     * Compartido entre la cancelación manual y las tareas programadas.
     */
    @Transactional
    public void promoverPrimeroEnEspera(Tutoria tutoria) {
        tutoriaReservaRepository.findByTutoriaIdAndDeletedAtIsNull(tutoria.getId()).stream()
                .filter(r -> ESTADO_ESPERA.equals(r.getEstado()))
                .min(Comparator.comparing(TutoriaReserva::getCreatedAt))
                .ifPresent(siguiente -> promover(tutoria, siguiente));
    }

    /** Promueve tantas reservas en espera como plazas libres haya (ej. al aumentar el cupo). */
    private void promoverEsperaHastaCupo(Tutoria tutoria) {
        if (tutoria.getCupo() == null) {
            return;
        }
        long confirmados = tutoriaReservaRepository.countByTutoriaIdAndEstadoNotAndDeletedAtIsNull(tutoria.getId(), ESTADO_ESPERA);
        long libres = tutoria.getCupo() - confirmados;
        if (libres <= 0) {
            return;
        }
        tutoriaReservaRepository.findByTutoriaIdAndDeletedAtIsNull(tutoria.getId()).stream()
                .filter(r -> ESTADO_ESPERA.equals(r.getEstado()))
                .sorted(Comparator.comparing(TutoriaReserva::getCreatedAt))
                .limit(libres)
                .forEach(r -> promover(tutoria, r));
    }

    private void promover(Tutoria tutoria, TutoriaReserva reserva) {
        reserva.setEstado(ESTADO_AGENDADA);
        tutoriaReservaRepository.save(reserva);
        Usuario u = reserva.getEstudiante();
        if (u != null && u.getEmail() != null) {
            String materia = tutoria.getMateria() != null ? tutoria.getMateria().getNombre() : "la tutoría";
            emailService.enviarNotificacionSimple(u.getEmail(),
                    "¡Tenés lugar en la tutoría de " + materia + "!",
                    "Se liberó un cupo y pasaste de la lista de espera a agendado. ¡Te esperamos!");
        }
    }

    // ---------- Feedback / valoración ----------

    public TutoriaFeedbackResumenDto dejarFeedback(Long tutoriaId, String email, TutoriaFeedbackCreateDto dto) {
        Tutoria tutoria = findActiva(tutoriaId);
        Usuario estudiante = resolveUsuario(email);
        if (!puedeValorar(tutoria, estudiante.getId())) {
            throw new IllegalStateException("Solo podés valorar una tutoría a la que asististe y que ya terminó.");
        }
        TutoriaFeedback fb = feedbackRepository
                .findByTutoriaIdAndEstudianteIdAndDeletedAtIsNull(tutoriaId, estudiante.getId())
                .orElseGet(() -> {
                    TutoriaFeedback nuevo = new TutoriaFeedback();
                    nuevo.setTutoria(tutoria);
                    nuevo.setEstudiante(estudiante);
                    return nuevo;
                });
        fb.setRating(dto.getRating());
        fb.setComentario(dto.getComentario() != null && !dto.getComentario().isBlank() ? dto.getComentario().trim() : null);
        feedbackRepository.save(fb);
        return getFeedbackResumen(tutoriaId, email);
    }

    @Transactional(readOnly = true)
    public TutoriaFeedbackResumenDto getFeedbackResumen(Long tutoriaId, String email) {
        Tutoria tutoria = findActiva(tutoriaId);
        Long usuarioId = resolveUsuarioId(email);
        List<TutoriaFeedback> lista = feedbackRepository.findByTutoriaIdAndDeletedAtIsNullOrderByCreatedAtDesc(tutoriaId);
        long total = lista.size();
        double promedio = total == 0 ? 0.0
                : Math.round(lista.stream().mapToInt(TutoriaFeedback::getRating).average().orElse(0) * 10) / 10.0;

        List<Long> distribucion = new ArrayList<>(List.of(0L, 0L, 0L, 0L, 0L));
        for (TutoriaFeedback f : lista) {
            int idx = Math.min(5, Math.max(1, f.getRating())) - 1;
            distribucion.set(idx, distribucion.get(idx) + 1);
        }

        Integer miRating = null;
        if (usuarioId != null) {
            miRating = feedbackRepository.findByTutoriaIdAndEstudianteIdAndDeletedAtIsNull(tutoriaId, usuarioId)
                    .map(TutoriaFeedback::getRating).orElse(null);
        }
        boolean puede = usuarioId != null && puedeValorar(tutoria, usuarioId);

        List<TutoriaFeedbackResumenDto.Item> items = lista.stream()
                .map(f -> new TutoriaFeedbackResumenDto.Item(
                        f.getId(),
                        f.getEstudiante() != null ? f.getEstudiante().getNombre() : null,
                        f.getRating(),
                        f.getComentario(),
                        f.getCreatedAt()))
                .toList();
        return new TutoriaFeedbackResumenDto(promedio, total, distribucion, miRating, puede, items);
    }

    private boolean puedeValorar(Tutoria tutoria, Long estudianteId) {
        boolean termino = ESTADO_CERRADA.equals(tutoria.getEstado())
                || (tutoria.getFin() != null && tutoria.getFin().isBefore(Instant.now()));
        if (!termino) {
            return false;
        }
        return tutoriaReservaRepository.findByTutoriaIdAndDeletedAtIsNull(tutoria.getId()).stream()
                .anyMatch(r -> r.getEstudiante() != null
                        && estudianteId.equals(r.getEstudiante().getId())
                        && !ESTADO_ESPERA.equals(r.getEstado())
                        && !ESTADO_CANCELADA.equals(r.getEstado()));
    }

    // ---------- Ranking de tutores ----------

    @Transactional(readOnly = true)
    public List<TutorRankingDto> rankingTutores() {
        // Nombres y nº de tutorías por docente: una sola query (findByDeletedAtIsNull trae docente vía EntityGraph).
        Map<Long, String> nombres = new LinkedHashMap<>();
        Map<Long, Long> totalTutorias = new LinkedHashMap<>();
        for (Tutoria t : tutoriaRepository.findByDeletedAtIsNull()) {
            Usuario d = t.getDocente();
            if (d == null) {
                continue;
            }
            nombres.putIfAbsent(d.getId(), d.getNombre());
            totalTutorias.merge(d.getId(), 1L, Long::sum);
        }
        // Estudiantes y valoraciones agregados por docente en queries agrupadas (evita el N+1).
        Map<Long, Long> estudiantesPorDocente = tutoriaReservaRepository.contarEstudiantesPorDocente(ESTADO_ESPERA).stream()
                .collect(Collectors.toMap(
                        TutoriaReservaRepository.DocenteConteo::getDocenteId,
                        TutoriaReservaRepository.DocenteConteo::getTotal));
        Map<Long, TutoriaFeedbackRepository.DocenteRatingAgg> ratingPorDocente = feedbackRepository.agregarPorDocente().stream()
                .collect(Collectors.toMap(
                        TutoriaFeedbackRepository.DocenteRatingAgg::getDocenteId,
                        Function.identity()));

        List<TutorRankingDto> ranking = new ArrayList<>();
        for (Long docId : nombres.keySet()) {
            TutoriaFeedbackRepository.DocenteRatingAgg agg = ratingPorDocente.get(docId);
            long totalValoraciones = agg != null ? agg.getTotal() : 0L;
            double promedio = (agg != null && agg.getPromedio() != null) ? redondear1(agg.getPromedio()) : 0.0;
            long totalEstudiantes = estudiantesPorDocente.getOrDefault(docId, 0L);
            ranking.add(new TutorRankingDto(docId, nombres.get(docId), promedio,
                    totalValoraciones, totalTutorias.getOrDefault(docId, 0L), totalEstudiantes, null));
        }
        ranking.sort(Comparator
                .comparingDouble(TutorRankingDto::promedio).reversed()
                .thenComparing(Comparator.comparingLong(TutorRankingDto::totalValoraciones).reversed())
                .thenComparing(Comparator.comparingLong(TutorRankingDto::totalEstudiantes).reversed()));

        List<TutorRankingDto> conBadge = new ArrayList<>();
        for (int i = 0; i < ranking.size(); i++) {
            conBadge.add(withBadge(ranking.get(i), i));
        }
        return conBadge;
    }

    private TutorRankingDto withBadge(TutorRankingDto r, int idx) {
        String badge;
        if (idx == 0 && r.totalValoraciones() > 0) {
            badge = "🏆 Tutor del mes";
        } else if (r.promedio() >= 4.5 && r.totalValoraciones() >= 3) {
            badge = "⭐ Excelente";
        } else if (r.totalEstudiantes() >= 20) {
            badge = "🔥 Muy demandado";
        } else if (r.totalTutorias() >= 5) {
            badge = "💪 Constante";
        } else {
            badge = null;
        }
        return new TutorRankingDto(r.docenteId(), r.docenteNombre(), r.promedio(),
                r.totalValoraciones(), r.totalTutorias(), r.totalEstudiantes(), badge);
    }

    // ---------- Racha / gamificación del estudiante ----------

    @Transactional(readOnly = true)
    public RachaDto racha(String email) {
        Usuario u = resolveUsuario(email);
        List<TutoriaReserva> reservas = tutoriaReservaRepository.findByEstudianteIdAndDeletedAtIsNull(u.getId());

        long asistidas = reservas.stream().filter(r -> ESTADO_ASISTIO.equals(r.getEstado())).count();
        long agendadas = reservas.stream().filter(r -> ESTADO_AGENDADA.equals(r.getEstado())).count();

        // Racha: sesiones pasadas ordenadas por fin desc, cuántas ASISTIO consecutivas desde la última.
        List<TutoriaReserva> pasadas = reservas.stream()
                .filter(r -> r.getTutoria() != null && r.getTutoria().getFin() != null
                        && r.getTutoria().getFin().isBefore(Instant.now()))
                .sorted(Comparator.comparing((TutoriaReserva r) -> r.getTutoria().getFin()).reversed())
                .toList();
        int racha = 0;
        for (TutoriaReserva r : pasadas) {
            if (ESTADO_ASISTIO.equals(r.getEstado())) {
                racha++;
            } else {
                break;
            }
        }

        boolean madrugador = reservas.stream().anyMatch(r -> ESTADO_ASISTIO.equals(r.getEstado())
                && r.getTutoria() != null && r.getTutoria().getInicio() != null
                && r.getTutoria().getInicio().atZone(ZONA).getHour() < 9);
        boolean finales = reservas.stream().anyMatch(r -> ESTADO_ASISTIO.equals(r.getEstado())
                && r.getTutoria() != null && r.getTutoria().getInicio() != null
                && esMesDeFinales(r.getTutoria().getInicio().atZone(ZONA).getMonthValue()));

        List<RachaDto.Badge> badges = List.of(
                new RachaDto.Badge("primera", "Primera tutoría", "🎓", asistidas >= 1),
                new RachaDto.Badge("cinco", "5 tutorías", "🖐️", asistidas >= 5),
                new RachaDto.Badge("diez", "10 tutorías", "🔟", asistidas >= 10),
                new RachaDto.Badge("racha3", "Racha x3", "🔥", racha >= 3),
                new RachaDto.Badge("madrugador", "Madrugador", "🌅", madrugador),
                new RachaDto.Badge("finales", "Salvado en finales", "📚", finales));

        return new RachaDto(asistidas, agendadas, racha, badges);
    }

    private boolean esMesDeFinales(int mes) {
        return mes == 6 || mes == 7 || mes == 11 || mes == 12;
    }

    // ---------- Recursos ----------

    @Transactional(readOnly = true)
    public List<TutoriaRecursoDto> listarRecursos(Long tutoriaId) {
        return recursoRepository.findByTutoriaIdAndDeletedAtIsNullOrderByCreatedAtAsc(tutoriaId).stream()
                .map(r -> new TutoriaRecursoDto(r.getId(), r.getTitulo(), r.getUrl(), r.getCreatedAt()))
                .toList();
    }

    public TutoriaRecursoDto agregarRecurso(Long tutoriaId, String email, TutoriaRecursoDto dto) {
        Tutoria tutoria = findActiva(tutoriaId);
        Usuario usuario = resolveUsuario(email);
        exigirDuenoOGestor(tutoria, usuario, "agregar recursos a esta tutoría");
        TutoriaRecurso recurso = new TutoriaRecurso();
        recurso.setTutoria(tutoria);
        recurso.setTitulo(dto.titulo().trim());
        recurso.setUrl(dto.url().trim());
        TutoriaRecurso saved = recursoRepository.save(recurso);
        return new TutoriaRecursoDto(saved.getId(), saved.getTitulo(), saved.getUrl(), saved.getCreatedAt());
    }

    public void eliminarRecurso(Long recursoId, String email) {
        TutoriaRecurso recurso = recursoRepository.findById(recursoId)
                .filter(r -> r.getDeletedAt() == null)
                .orElseThrow(() -> new IllegalArgumentException("Recurso no encontrado: " + recursoId));
        Usuario usuario = resolveUsuario(email);
        Tutoria tutoria = recurso.getTutoria();
        exigirDuenoOGestor(tutoria, usuario, "eliminar este recurso");
        recurso.setDeletedAt(Instant.now());
        recursoRepository.save(recurso);
    }

    /** Lista los temarios pedidos por los agendados (para resumen IA). */
    @Transactional(readOnly = true)
    public List<String> temariosPedidos(Long tutoriaId) {
        findActiva(tutoriaId);
        return tutoriaReservaRepository.findByTutoriaIdAndDeletedAtIsNull(tutoriaId).stream()
                .filter(r -> !ESTADO_CANCELADA.equals(r.getEstado()))
                .map(TutoriaReserva::getTemario)
                .filter(s -> s != null && !s.isBlank())
                .map(String::trim)
                .toList();
    }

    // ---------- Helpers ----------

    private int calcularOcurrencias(String recurrencia, Integer repeticiones) {
        if (recurrencia == null || recurrencia.isBlank() || "NONE".equalsIgnoreCase(recurrencia)) {
            return 1;
        }
        int n = repeticiones != null ? repeticiones : 1;
        return Math.min(Math.max(1, n), MAX_REPETICIONES);
    }

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

    private String normalizarTags(String tags) {
        if (tags == null || tags.isBlank()) {
            return null;
        }
        List<String> limpios = Arrays.stream(tags.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .distinct()
                .toList();
        return limpios.isEmpty() ? null : String.join(",", limpios);
    }

    private Tutoria findActiva(Long id) {
        return tutoriaRepository.findById(id)
                .filter(t -> t.getDeletedAt() == null)
                .orElseThrow(() -> new RecursoNoEncontradoException(TUTORIA_NO_ENCONTRADA_MSG + id));
    }

    private TutoriaReserva findReservaActiva(Long id) {
        return tutoriaReservaRepository.findById(id)
                .filter(r -> r.getDeletedAt() == null)
                .orElseThrow(() -> new RecursoNoEncontradoException(RESERVA_NO_ENCONTRADA_MSG + id));
    }

    private Usuario resolveUsuario(String email) {
        return usuarioRepository.findByEmail(email)
                .orElseThrow(() -> new RecursoNoEncontradoException(USUARIO_NO_ENCONTRADO_MSG + email));
    }

    private Long resolveUsuarioId(String email) {
        if (email == null) {
            return null;
        }
        return usuarioRepository.findByEmail(email).map(Usuario::getId).orElse(null);
    }

    private Espacio resolveEspacio(Long espacioId) {
        if (espacioId == null) {
            return null;
        }
        return espacioRepository.findById(espacioId)
                .orElseThrow(() -> new RecursoNoEncontradoException(ESPACIO_NO_ENCONTRADO_MSG + espacioId));
    }

    /** Mapea una tutoría individual (agregados con conteos puntuales; usar para 1 elemento). */
    private TutoriaResponseDto mapToResponseDto(Tutoria tutoria) {
        long agendados = tutoriaReservaRepository.countByTutoriaIdAndEstadoNotAndDeletedAtIsNull(tutoria.getId(), ESTADO_ESPERA);
        long enEspera = tutoriaReservaRepository.countByTutoriaIdAndEstadoAndDeletedAtIsNull(tutoria.getId(), ESTADO_ESPERA);
        List<TutoriaFeedback> fb = feedbackRepository.findByTutoriaIdAndDeletedAtIsNullOrderByCreatedAtDesc(tutoria.getId());
        long ratingTotal = fb.size();
        double ratingPromedio = ratingTotal == 0 ? 0.0
                : redondear1(fb.stream().mapToInt(TutoriaFeedback::getRating).average().orElse(0));
        return construir(tutoria, agendados, enEspera, ratingPromedio, ratingTotal);
    }

    /** Mapea una lista de tutorías con agregados batch (2 queries agrupadas en vez de ~3N). */
    private List<TutoriaResponseDto> mapToResponseDtos(List<Tutoria> tutorias) {
        if (tutorias.isEmpty()) {
            return List.of();
        }
        List<Long> ids = tutorias.stream().map(Tutoria::getId).toList();
        Map<Long, TutoriaReservaRepository.TutoriaReservaCounts> counts =
                tutoriaReservaRepository.contarPorTutorias(ids, ESTADO_ESPERA).stream()
                        .collect(Collectors.toMap(TutoriaReservaRepository.TutoriaReservaCounts::getId, Function.identity()));
        Map<Long, TutoriaFeedbackRepository.TutoriaRatingAgg> ratings =
                feedbackRepository.agregarPorTutorias(ids).stream()
                        .collect(Collectors.toMap(TutoriaFeedbackRepository.TutoriaRatingAgg::getId, Function.identity()));

        return tutorias.stream().map(t -> {
            TutoriaReservaRepository.TutoriaReservaCounts c = counts.get(t.getId());
            TutoriaFeedbackRepository.TutoriaRatingAgg r = ratings.get(t.getId());
            long agendados = c != null ? c.getAgendados() : 0L;
            long enEspera = c != null ? c.getEnEspera() : 0L;
            long ratingTotal = r != null ? r.getTotal() : 0L;
            double ratingPromedio = (r != null && r.getPromedio() != null) ? redondear1(r.getPromedio()) : 0.0;
            return construir(t, agendados, enEspera, ratingPromedio, ratingTotal);
        }).toList();
    }

    private TutoriaResponseDto construir(Tutoria tutoria, long agendados, long enEspera,
                                         double ratingPromedio, long ratingTotal) {
        int plazasDisponibles = Math.max(0, tutoria.getCupo() - (int) agendados);

        TutoriaResponseDto dto = new TutoriaResponseDto();
        dto.setId(tutoria.getId());

        Materia materia = tutoria.getMateria();
        if (materia != null) {
            dto.setMateriaId(materia.getId());
            dto.setMateriaNombre(materia.getNombre());
        }
        Usuario docente = tutoria.getDocente();
        if (docente != null) {
            dto.setDocenteNombre(docente.getNombre());
        }
        Espacio espacio = tutoria.getEspacio();
        if (espacio != null) {
            dto.setEspacioId(espacio.getId());
            dto.setEspacioNombre(espacio.getNombre());
        }
        dto.setInicio(tutoria.getInicio());
        dto.setFin(tutoria.getFin());
        dto.setCupo(tutoria.getCupo());
        dto.setPlazasDisponibles(plazasDisponibles);
        dto.setEstado(tutoria.getEstado());
        dto.setModalidad(tutoria.getModalidad());
        dto.setEnlace(tutoria.getEnlace());
        dto.setTipo(tutoria.getTipo());
        dto.setTags(tutoria.getTags());
        dto.setEnVivo(tutoria.getEnVivo());
        dto.setPatron(tutoria.getPatron());
        dto.setCreatedAt(tutoria.getCreatedAt());
        dto.setAgendadosCount(agendados);
        dto.setEnEsperaCount(enEspera);
        dto.setRatingPromedio(ratingPromedio);
        dto.setRatingTotal(ratingTotal);
        return dto;
    }

    private static double redondear1(double v) {
        return Math.round(v * 10) / 10.0;
    }
}
