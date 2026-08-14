package com.utec.backend.util;

import com.utec.backend.model.Carrera;
import com.utec.backend.model.Espacio;
import com.utec.backend.model.Evento;
import com.utec.backend.model.EventoFeedback;
import com.utec.backend.model.EventoInscripcion;
import com.utec.backend.model.InscripcionMateria;
import com.utec.backend.model.Materia;
import com.utec.backend.model.RecursoAcademico;
import com.utec.backend.model.Tutoria;
import com.utec.backend.model.TutoriaFeedback;
import com.utec.backend.model.TutoriaReserva;
import com.utec.backend.model.Usuario;
import com.utec.backend.repository.CarreraRepository;
import com.utec.backend.repository.EspacioRepository;
import com.utec.backend.service.OcupacionEspacioService;
import com.utec.backend.repository.EventoFeedbackRepository;
import com.utec.backend.repository.EventoInscripcionRepository;
import com.utec.backend.repository.EventoRepository;
import com.utec.backend.repository.InscripcionMateriaRepository;
import com.utec.backend.repository.MateriaRepository;
import com.utec.backend.repository.RecursoAcademicoRepository;
import com.utec.backend.repository.TutoriaFeedbackRepository;
import com.utec.backend.repository.TutoriaRepository;
import com.utec.backend.repository.TutoriaReservaRepository;
import com.utec.backend.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Random;

/**
 * Siembra ABUNDANTE de la capa académica (materias con correlativas, recursos,
 * inscripciones, tutorías con reservas y feedback, eventos con inscripciones y
 * valoraciones) en perfil 'dev'. Corre después de {@link DevDataInitializer}
 * (que crea usuarios, carreras y espacios) para poder engancharse con ellos.
 *
 * Genera un plan de materias por CADA carrera activa, de modo que todos los
 * módulos (mapa de correlativas, sostenibilidad, tutorías, eventos) se vean
 * poblados. Idempotente: no hace nada si ya existen materias.
 */
@Component
@Profile("dev")
@RequiredArgsConstructor
@Slf4j
@Order(2)
public class AcademicDataInitializer implements CommandLineRunner {

    private final MateriaRepository materiaRepository;
    private final InscripcionMateriaRepository inscripcionMateriaRepository;
    private final RecursoAcademicoRepository recursoAcademicoRepository;
    private final TutoriaRepository tutoriaRepository;
    private final TutoriaReservaRepository tutoriaReservaRepository;
    private final TutoriaFeedbackRepository tutoriaFeedbackRepository;
    private final EventoRepository eventoRepository;
    private final EventoInscripcionRepository eventoInscripcionRepository;
    private final EventoFeedbackRepository eventoFeedbackRepository;
    private final UsuarioRepository usuarioRepository;
    private final CarreraRepository carreraRepository;
    private final EspacioRepository espacioRepository;
    private final OcupacionEspacioService ocupacionEspacioService;

    private final Random rnd = new Random(42);

    /** Cuántos espacios probar al azar antes de rendirse y dejar la actividad sin espacio. */
    private static final int INTENTOS_ESPACIO = 8;

    /** Plantilla de materias (nombre, código-sufijo, semestre, créditos) aplicada a cada carrera. */
    private record Slot(String nombre, String suf, int sem, int cred) {}

    private static final List<Slot> PLANTILLA = List.of(
            new Slot("Introducción a la Disciplina", "INTRO", 1, 8),
            new Slot("Matemática I", "MAT1", 1, 10),
            new Slot("Comunicación y Expresión", "COM", 1, 6),
            new Slot("Matemática II", "MAT2", 2, 10),
            new Slot("Fundamentos I", "FUN1", 2, 8),
            new Slot("Física Aplicada", "FIS", 2, 8),
            new Slot("Fundamentos II", "FUN2", 3, 10),
            new Slot("Estadística", "EST", 3, 8),
            new Slot("Metodología de la Investigación", "MET", 3, 6),
            new Slot("Sistemas y Procesos", "SIS", 4, 10),
            new Slot("Gestión de Proyectos", "GES", 4, 8),
            new Slot("Optativa I", "OPT1", 5, 8),
            new Slot("Taller Integrador", "TAL", 5, 10),
            new Slot("Proyecto Final", "PROY", 6, 14));

    /** Correlativas de la plantilla: la materia (sufijo) requiere el prerrequisito (sufijo). */
    private static final String[][] CORRELATIVAS = {
            {"MAT2", "MAT1"}, {"FUN1", "INTRO"}, {"FUN2", "FUN1"}, {"EST", "MAT2"},
            {"SIS", "FUN2"}, {"GES", "EST"}, {"OPT1", "SIS"}, {"TAL", "GES"},
            {"PROY", "OPT1"}, {"PROY", "TAL"}
    };

    private static final String[] COMENTARIOS_TUTORIA = {
            "Muy clara la explicación", "Me ayudó bastante", "Buen ritmo", "Excelente docente", "Recomendable"
    };
    private static final String[] COMENTARIOS_EVENTO = {
            "Muy bueno", "Aprendí mucho", "Bien organizado", "Volvería", "Interesante"
    };

    /** Catálogo de patrones de banner (debe coincidir con EVENTO_PATRONES del front). */
    private static final String[] PATRONES = {
            "formas", "nodos", "aurora", "plasma", "estrellas", "circuito", "matrix", "panal",
            "grilla", "diagonales", "topografia", "olas", "ecualizador", "confeti", "burbujas", "blobs"
    };

    @Override
    @Transactional
    public void run(String... args) {
        if (materiaRepository.count() > 0) {
            log.info("Ya existen materias. Saltando seed académico.");
            return;
        }

        List<Usuario> docentes = usuarioRepository.findByRolAppAndDeletedAtIsNull(Usuario.RolApp.DOCENTE);
        List<Usuario> estudiantes = usuarioRepository.findByRolAppAndDeletedAtIsNull(Usuario.RolApp.ESTUDIANTE);
        List<Usuario> externos = usuarioRepository.findByRolAppAndDeletedAtIsNull(Usuario.RolApp.EXTERNO);
        List<Carrera> carreras = carreraRepository.findByActivoTrue();
        List<Espacio> espacios = espacioRepository.findAll();
        Usuario admin = usuarioRepository.findByEmail("admin@utec.edu.uy")
                .orElse(docentes.isEmpty() ? null : docentes.get(0));

        if (docentes.isEmpty() || estudiantes.isEmpty() || carreras.isEmpty()) {
            log.warn("Faltan usuarios o carreras base. Saltando seed académico.");
            return;
        }

        log.info("Sembrando datos académicos abundantes ({} carreras, {} docentes, {} estudiantes)...",
                carreras.size(), docentes.size(), estudiantes.size());

        List<Materia> todas = sembrarMateriasYCorrelativas(carreras, docentes);
        sembrarRecursos(todas);
        sembrarInscripciones(todas, estudiantes);
        sembrarTutorias(todas, estudiantes, espacios);
        sembrarEventos(espacios, admin, estudiantes, externos);

        log.info("Seed académico completado: {} materias en {} carreras.", todas.size(), carreras.size());
    }

    // ------------------------------------------------------------------ Materias

    private List<Materia> sembrarMateriasYCorrelativas(List<Carrera> carreras, List<Usuario> docentes) {
        List<Materia> todas = new ArrayList<>();
        int docIdx = 0;
        for (Carrera carrera : carreras) {
            if (carrera.getCodigo() == null || carrera.getCodigo().isBlank()) {
                continue;
            }
            Map<String, Materia> porSuf = new LinkedHashMap<>();
            for (Slot s : PLANTILLA) {
                Materia m = new Materia();
                m.setNombre(s.nombre());
                m.setCodigo(carrera.getCodigo() + "-" + s.suf());
                m.setDescripcion(s.nombre() + " — plan " + carrera.getCodigo());
                m.setCarrera(carrera);
                m.setDocente(docentes.get(docIdx++ % docentes.size()));
                m.setSemestre(s.sem());
                m.setCreditos(s.cred());
                Materia saved = materiaRepository.save(m);
                porSuf.put(s.suf(), saved);
                todas.add(saved);
            }
            for (String[] par : CORRELATIVAS) {
                Materia materia = porSuf.get(par[0]);
                Materia prereq = porSuf.get(par[1]);
                if (materia != null && prereq != null) {
                    materia.getPrerrequisitos().add(prereq);
                    materiaRepository.save(materia);
                }
            }
        }
        return todas;
    }

    // ------------------------------------------------------------------ Recursos

    private void sembrarRecursos(List<Materia> materias) {
        List<RecursoAcademico> recursos = new ArrayList<>();
        for (Materia m : materias) {
            // 1 enlace + 2 archivos (los archivos alimentan las métricas de sostenibilidad).
            recursos.add(recurso(m, "ENLACE", "Guía online — " + m.getNombre(),
                    "https://recursos.utec.edu.uy/" + m.getCodigo().toLowerCase(), null, null));
            for (int u = 1; u <= 2; u++) {
                long bytes = 400_000L + rnd.nextInt(3_000_000);
                int paginas = 12 + rnd.nextInt(70);
                recursos.add(recurso(m, "ARCHIVO", "Apunte U" + u + " — " + m.getNombre(),
                        "materias/" + m.getId() + "/u" + u + ".pdf", bytes, paginas));
            }
        }
        recursoAcademicoRepository.saveAll(recursos);
    }

    private RecursoAcademico recurso(Materia m, String tipo, String titulo, String url, Long bytes, Integer paginas) {
        RecursoAcademico r = new RecursoAcademico();
        r.setMateria(m);
        r.setSubidoPor(m.getDocente());
        r.setTitulo(titulo);
        r.setDescripcion("Material del curso.");
        r.setTipo(tipo);
        r.setUrlOObjectName(url);
        if ("ARCHIVO".equals(tipo)) {
            r.setMimeType("application/pdf");
            r.setTamanoBytes(bytes);
            r.setPaginasEstimadas(paginas);
        }
        return r;
    }

    // ------------------------------------------------------------------ Inscripciones

    private void sembrarInscripciones(List<Materia> materias, List<Usuario> estudiantes) {
        List<InscripcionMateria> inscripciones = new ArrayList<>();
        for (Materia m : materias) {
            int n = Math.min(estudiantes.size(), 7 + rnd.nextInt(22));
            for (Usuario est : muestra(estudiantes, n)) {
                InscripcionMateria i = new InscripcionMateria();
                i.setMateria(m);
                i.setEstudiante(est);
                i.setEstado(estadoInscripcion(m.getSemestre()));
                inscripciones.add(i);
            }
        }
        inscripcionMateriaRepository.saveAll(inscripciones);
    }

    private String estadoInscripcion(Integer semestre) {
        int sem = semestre != null ? semestre : 1;
        if (sem <= 2) {
            return "APROBADA";
        }
        if (sem == 3) {
            return rnd.nextBoolean() ? "APROBADA" : "ACTIVA";
        }
        return "ACTIVA";
    }

    // ------------------------------------------------------------------ Tutorías


    /**
     * Elige un espacio que esté libre en el rango, probando al azar unos cuantos.
     *
     * <p>Antes el seeder tomaba un espacio cualquiera sin mirar la agenda, y generaba
     * datos que la propia app rechaza: 114 tutorías y eventos pisando reservas aprobadas.
     * Si no encuentra hueco devuelve null, y la actividad queda sin espacio (virtual).
     */
    private Espacio espacioLibre(List<Espacio> espacios, Instant inicio, Instant fin,
                                 OcupacionEspacioService.TipoActividad tipo) {
        if (espacios.isEmpty()) {
            return null;
        }
        for (int i = 0; i < INTENTOS_ESPACIO; i++) {
            Espacio candidato = espacios.get(rnd.nextInt(espacios.size()));
            if (ocupacionEspacioService.buscarConflictos(candidato.getId(), inicio, fin, tipo, null).isEmpty()) {
                return candidato;
            }
        }
        return null;
    }

    private void sembrarTutorias(List<Materia> materias, List<Usuario> estudiantes, List<Espacio> espacios) {
        List<TutoriaReserva> reservas = new ArrayList<>();
        List<TutoriaFeedback> feedbacks = new ArrayList<>();
        for (Materia m : materias) {
            Integer sem = m.getSemestre();
            if (m.getDocente() == null || sem == null || sem < 2 || sem > 4) {
                continue;
            }
            boolean pasada = rnd.nextBoolean();
            Instant inicio = Instant.now()
                    .plus(pasada ? -(2 + rnd.nextInt(18)) : (2 + rnd.nextInt(18)), ChronoUnit.DAYS)
                    .truncatedTo(ChronoUnit.HOURS);

            Instant fin = inicio.plus(1, ChronoUnit.HOURS);

            Tutoria t = new Tutoria();
            t.setMateria(m);
            t.setDocente(m.getDocente());
            t.setEspacio(espacioLibre(espacios, inicio, fin, OcupacionEspacioService.TipoActividad.TUTORIA));
            t.setInicio(inicio);
            t.setFin(fin);
            t.setCupo(4 + rnd.nextInt(6));
            t.setEstado(pasada ? "CERRADA" : "ABIERTA");
            t.setModalidad(rnd.nextInt(3) == 0 ? "VIRTUAL" : "PRESENCIAL");
            t.setTipo(rnd.nextBoolean() ? "GRUPAL" : "INDIVIDUAL");
            t.setTags(rnd.nextInt(4) == 0 ? "mate,repaso" : "consulta");
            t.setEnVivo(false);
            t.setRecordatorioEnviado(false);
            Tutoria saved = tutoriaRepository.save(t);

            int n = Math.min(estudiantes.size(), 2 + rnd.nextInt(5));
            for (Usuario est : muestra(estudiantes, n)) {
                TutoriaReserva r = new TutoriaReserva();
                r.setTutoria(saved);
                r.setEstudiante(est);
                r.setEstado(pasada ? "ASISTIO" : "AGENDADA");
                r.setConfirmada(pasada);
                reservas.add(r);
                if (pasada) {
                    TutoriaFeedback f = new TutoriaFeedback();
                    f.setTutoria(saved);
                    f.setEstudiante(est);
                    f.setRating(3 + rnd.nextInt(3));
                    f.setComentario(COMENTARIOS_TUTORIA[rnd.nextInt(COMENTARIOS_TUTORIA.length)]);
                    feedbacks.add(f);
                }
            }
        }
        tutoriaReservaRepository.saveAll(reservas);
        tutoriaFeedbackRepository.saveAll(feedbacks);
    }

    // ------------------------------------------------------------------ Eventos

    private record EventoSpec(String titulo, String descr, String tipo, int dias, int cupo, String tags) {}

    private static final List<EventoSpec> EVENTOS = List.of(
            new EventoSpec("Hackathon UTEC", "48 horas de código y creatividad.", "EVENTO", 12, 120, "tech,concurso"),
            new EventoSpec("Charla: Ética en IA", "Panel abierto con referentes.", "EVENTO", 5, 90, "ia,charla"),
            new EventoSpec("Curso de Robótica", "Introducción práctica, 4 clases.", "CURSO", 20, 30, "robotica,curso"),
            new EventoSpec("Feria de Sostenibilidad", "Proyectos verdes de estudiantes.", "EVENTO", 9, 200, "sostenibilidad"),
            new EventoSpec("Taller de Datos", "Pandas y visualización.", "TALLER", 3, 25, "datos,taller"),
            new EventoSpec("Jornada de Egresados", "Historias y networking.", "EVENTO", -10, 150, "networking"),
            new EventoSpec("Seminario de Energías", "Renovables y futuro.", "CURSO", -20, 40, "energia"),
            new EventoSpec("Concierto de Jazz", "Ensamble de la LJMC.", "EVENTO", -5, 180, "musica"),
            new EventoSpec("Workshop de Impresión 3D", "Diseño y prototipado.", "TALLER", 15, 20, "maker"),
            new EventoSpec("Congreso de Biomédica", "Avances y ponencias.", "EVENTO", -30, 220, "biomedica"));

    private void sembrarEventos(List<Espacio> espacios, Usuario organizador,
                                List<Usuario> estudiantes, List<Usuario> externos) {
        List<Usuario> publico = new ArrayList<>(estudiantes);
        publico.addAll(externos);
        List<EventoInscripcion> inscripciones = new ArrayList<>();
        List<EventoFeedback> feedbacks = new ArrayList<>();

        for (EventoSpec spec : EVENTOS) {
            boolean pasado = spec.dias() < 0;
            Instant inicio = Instant.now().plus(spec.dias(), ChronoUnit.DAYS).truncatedTo(ChronoUnit.HOURS);
            Instant fin = inicio.plus(2, ChronoUnit.HOURS);

            Evento e = new Evento();
            e.setTitulo(spec.titulo());
            e.setDescripcion(spec.descr());
            e.setTipo(spec.tipo());
            e.setInicio(inicio);
            e.setFin(fin);
            e.setCupo(spec.cupo());
            e.setEsPublico(true);
            e.setEspacio(espacioLibre(espacios, inicio, fin, OcupacionEspacioService.TipoActividad.EVENTO));
            e.setOrganizador(organizador);
            e.setEstado(pasado ? "FINALIZADO" : "PUBLICADO");
            e.setTags(spec.tags());
            e.setPatron(PATRONES[rnd.nextInt(PATRONES.length)]);
            e.setRecordatorioEnviado(false);
            Evento saved = eventoRepository.save(e);

            int n = Math.min(publico.size(), 10 + rnd.nextInt(25));
            for (Usuario u : muestra(publico, n)) {
                EventoInscripcion i = new EventoInscripcion();
                i.setEvento(saved);
                i.setUsuario(u);
                i.setEstado(pasado && rnd.nextInt(3) == 0 ? "ASISTIO" : "INSCRITO");
                inscripciones.add(i);
                if (pasado) {
                    EventoFeedback f = new EventoFeedback();
                    f.setEvento(saved);
                    f.setUsuario(u);
                    f.setRating(3 + rnd.nextInt(3));
                    f.setComentario(COMENTARIOS_EVENTO[rnd.nextInt(COMENTARIOS_EVENTO.length)]);
                    feedbacks.add(f);
                }
            }
        }
        eventoInscripcionRepository.saveAll(inscripciones);
        eventoFeedbackRepository.saveAll(feedbacks);
    }

    // ------------------------------------------------------------------ Helpers

    /** Devuelve una muestra aleatoria de n elementos distintos (sin repetir). */
    private <T> List<T> muestra(List<T> lista, int n) {
        if (n >= lista.size()) {
            return lista;
        }
        List<T> copia = new ArrayList<>(lista);
        Collections.shuffle(copia, rnd);
        return copia.subList(0, n);
    }
}
