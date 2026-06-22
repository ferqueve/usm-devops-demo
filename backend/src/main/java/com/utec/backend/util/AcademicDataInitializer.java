package com.utec.backend.util;

import com.utec.backend.model.Carrera;
import com.utec.backend.model.Espacio;
import com.utec.backend.model.Evento;
import com.utec.backend.model.EventoInscripcion;
import com.utec.backend.model.InscripcionMateria;
import com.utec.backend.model.Materia;
import com.utec.backend.model.RecursoAcademico;
import com.utec.backend.model.Tutoria;
import com.utec.backend.model.TutoriaReserva;
import com.utec.backend.model.Usuario;
import com.utec.backend.repository.CarreraRepository;
import com.utec.backend.repository.EspacioRepository;
import com.utec.backend.repository.EventoInscripcionRepository;
import com.utec.backend.repository.EventoRepository;
import com.utec.backend.repository.InscripcionMateriaRepository;
import com.utec.backend.repository.MateriaRepository;
import com.utec.backend.repository.RecursoAcademicoRepository;
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
import java.util.List;

/**
 * Siembra datos de la capa académica (materias, inscripciones, recursos,
 * tutorías, eventos) en perfil 'dev'. Corre después de {@link DevDataInitializer}
 * (que crea usuarios, carreras y espacios). Idempotente.
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
    private final EventoRepository eventoRepository;
    private final EventoInscripcionRepository eventoInscripcionRepository;
    private final UsuarioRepository usuarioRepository;
    private final CarreraRepository carreraRepository;
    private final EspacioRepository espacioRepository;

    @Override
    @Transactional
    public void run(String... args) {
        if (materiaRepository.count() > 0) {
            log.info("Ya existen materias. Saltando seed académico.");
            return;
        }
        Usuario docente = usuarioRepository.findByEmail("docente@utec.edu.uy").orElse(null);
        Usuario estudiante = usuarioRepository.findByEmail("estudiante@utec.edu.uy").orElse(null);
        Usuario externo = usuarioRepository.findByEmail("externo@utec.edu.uy").orElse(null);
        Usuario admin = usuarioRepository.findByEmail("admin@utec.edu.uy").orElse(null);
        if (docente == null || estudiante == null) {
            log.warn("Usuarios base no encontrados. Saltando seed académico.");
            return;
        }
        log.info("Sembrando datos académicos (materias, recursos, tutorías, eventos)...");

        List<Espacio> espacios = espacioRepository.findAll();
        Espacio espacio = espacios.isEmpty() ? null : espacios.get(0);

        // ---- Materias ----
        Materia prog1 = crearMateria("Programación I", "PROG1", "Fundamentos de programación imperativa.", "TINF", docente, 1, 12);
        Materia bd = crearMateria("Bases de Datos", "BD1", "Modelo relacional, SQL y diseño de esquemas.", "TADS", docente, 3, 10);
        Materia calc = crearMateria("Cálculo I", "CALC1", "Límites, derivadas e integrales.", "IMEC", docente, 1, 12);
        Materia ml = crearMateria("Introducción al Machine Learning", "ML1", "Aprendizaje supervisado y no supervisado.", "LIDIA", docente, 5, 10);
        Materia eda = crearMateria("Estructuras de Datos", "EDA1", "Listas, árboles, grafos y complejidad.", "LTI", docente, 2, 10);
        Materia ctrl = crearMateria("Sistemas de Control", "CTRL1", "Sistemas dinámicos y realimentación.", "ICAU", docente, 4, 10);

        // ---- Inscripciones del estudiante ----
        inscribir(prog1, estudiante);
        inscribir(bd, estudiante);
        inscribir(ml, estudiante);
        inscribir(eda, estudiante);

        // ---- Recursos (mezcla ENLACE + ARCHIVO con métricas para sostenibilidad) ----
        crearEnlace(prog1, docente, "Guía oficial de Python", "Documentación introductoria.", "https://docs.python.org/3/tutorial/");
        crearArchivo(prog1, docente, "Apunte - Variables y tipos", "PDF de la unidad 1.", 1_800_000L, 36);
        crearArchivo(prog1, docente, "Práctico 1 resuelto", "Soluciones del práctico.", 900_000L, 18);
        crearArchivo(bd, docente, "Apunte - Modelo relacional", "Teoría de la unidad 2.", 2_400_000L, 48);
        crearEnlace(bd, docente, "PostgreSQL Tutorial", "Tutorial interactivo de SQL.", "https://www.postgresqltutorial.com/");
        crearArchivo(calc, docente, "Tabla de derivadas e integrales", "Formulario completo.", 600_000L, 12);
        crearArchivo(ml, docente, "Slides - Regresión lineal", "Presentación de la clase 3.", 3_200_000L, 64);
        crearArchivo(eda, docente, "Apunte - Árboles balanceados", "AVL y rojo-negro.", 1_500_000L, 30);

        // ---- Tutorías ----
        Tutoria t1 = crearTutoria(prog1, docente, espacio, 2, 5);
        crearTutoria(bd, docente, espacio, 4, 4);
        crearTutoria(ml, docente, null, 6, 3);
        // El estudiante agenda una franja
        agendar(t1, estudiante);

        // ---- Eventos / oferta abierta ----
        Usuario organizador = admin != null ? admin : docente;
        Evento ev1 = crearEvento("Charla: El futuro de la IA", "Charla abierta sobre tendencias en inteligencia artificial.", "EVENTO", 7, 100, espacio, organizador);
        Evento ev2 = crearEvento("Curso de Sostenibilidad Ambiental", "Curso introductorio de extensión, 4 encuentros.", "CURSO", 14, 40, null, organizador);
        crearEvento("Open Day UTEC", "Jornada de puertas abiertas para futuros estudiantes.", "EVENTO", 21, null, espacio, organizador);
        // Inscripciones a eventos
        if (externo != null) {
            inscribirEvento(ev1, externo);
            inscribirEvento(ev2, externo);
        }
        inscribirEvento(ev1, estudiante);

        log.info("Seed académico completado.");
    }

    private Materia crearMateria(String nombre, String codigo, String desc, String codigoCarrera,
                                 Usuario docente, int semestre, int creditos) {
        Carrera carrera = carreraRepository.findByCodigo(codigoCarrera).orElse(null);
        if (carrera == null) {
            // Fallback: cualquier carrera activa
            List<Carrera> activas = carreraRepository.findByActivoTrue();
            carrera = activas.isEmpty() ? null : activas.get(0);
        }
        Materia m = new Materia();
        m.setNombre(nombre);
        m.setCodigo(codigo);
        m.setDescripcion(desc);
        m.setCarrera(carrera);
        m.setDocente(docente);
        m.setSemestre(semestre);
        m.setCreditos(creditos);
        return materiaRepository.save(m);
    }

    private void inscribir(Materia materia, Usuario estudiante) {
        InscripcionMateria i = new InscripcionMateria();
        i.setMateria(materia);
        i.setEstudiante(estudiante);
        i.setEstado("ACTIVA");
        inscripcionMateriaRepository.save(i);
    }

    private void crearEnlace(Materia materia, Usuario docente, String titulo, String desc, String url) {
        RecursoAcademico r = new RecursoAcademico();
        r.setMateria(materia);
        r.setSubidoPor(docente);
        r.setTitulo(titulo);
        r.setDescripcion(desc);
        r.setTipo("ENLACE");
        r.setUrlOObjectName(url);
        recursoAcademicoRepository.save(r);
    }

    private void crearArchivo(Materia materia, Usuario docente, String titulo, String desc, long bytes, int paginas) {
        RecursoAcademico r = new RecursoAcademico();
        r.setMateria(materia);
        r.setSubidoPor(docente);
        r.setTitulo(titulo);
        r.setDescripcion(desc);
        r.setTipo("ARCHIVO");
        r.setUrlOObjectName("materias/" + (materia.getId() != null ? materia.getId() : 0)
                + "/" + titulo.toLowerCase().replaceAll("[^a-z0-9]+", "-") + ".pdf");
        r.setMimeType("application/pdf");
        r.setTamanoBytes(bytes);
        r.setPaginasEstimadas(paginas);
        recursoAcademicoRepository.save(r);
    }

    private Tutoria crearTutoria(Materia materia, Usuario docente, Espacio espacio, int diasAdelante, int cupo) {
        Tutoria t = new Tutoria();
        t.setMateria(materia);
        t.setDocente(docente);
        t.setEspacio(espacio);
        Instant inicio = Instant.now().plus(diasAdelante, ChronoUnit.DAYS).truncatedTo(ChronoUnit.HOURS);
        t.setInicio(inicio);
        t.setFin(inicio.plus(1, ChronoUnit.HOURS));
        t.setCupo(cupo);
        t.setEstado("ABIERTA");
        return tutoriaRepository.save(t);
    }

    private void agendar(Tutoria tutoria, Usuario estudiante) {
        TutoriaReserva tr = new TutoriaReserva();
        tr.setTutoria(tutoria);
        tr.setEstudiante(estudiante);
        tr.setEstado("AGENDADA");
        tutoriaReservaRepository.save(tr);
    }

    private Evento crearEvento(String titulo, String desc, String tipo, int diasAdelante, Integer cupo,
                               Espacio espacio, Usuario organizador) {
        Evento e = new Evento();
        e.setTitulo(titulo);
        e.setDescripcion(desc);
        e.setTipo(tipo);
        Instant inicio = Instant.now().plus(diasAdelante, ChronoUnit.DAYS).truncatedTo(ChronoUnit.HOURS);
        e.setInicio(inicio);
        e.setFin(inicio.plus(2, ChronoUnit.HOURS));
        e.setCupo(cupo);
        e.setEsPublico(true);
        e.setEspacio(espacio);
        e.setOrganizador(organizador);
        e.setEstado("PUBLICADO");
        return eventoRepository.save(e);
    }

    private void inscribirEvento(Evento evento, Usuario usuario) {
        EventoInscripcion ei = new EventoInscripcion();
        ei.setEvento(evento);
        ei.setUsuario(usuario);
        ei.setEstado("INSCRITO");
        eventoInscripcionRepository.save(ei);
    }
}
