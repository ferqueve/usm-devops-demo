package com.utec.backend.service;

import com.utec.backend.dto.materia.MapaCarreraDto;
import com.utec.backend.dto.materia.MateriaCreateDto;
import com.utec.backend.dto.materia.MateriaResponseDto;
import com.utec.backend.dto.materia.MateriaUpdateDto;
import com.utec.backend.exception.RecursoNoEncontradoException;
import com.utec.backend.exception.AccesoDenegadoException;
import com.utec.backend.model.Carrera;
import com.utec.backend.model.InscripcionMateria;
import com.utec.backend.model.Materia;
import com.utec.backend.model.Usuario;
import com.utec.backend.repository.CarreraRepository;
import com.utec.backend.repository.InscripcionMateriaRepository;
import com.utec.backend.repository.MateriaRepository;
import com.utec.backend.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import static com.utec.backend.security.Constants.ROLE_DOCENTE;
import static com.utec.backend.security.Constants.ROLE_ESTUDIANTE;

@Service
@RequiredArgsConstructor
@Transactional
public class MateriaService {

    private static final String MATERIA_NO_ENCONTRADA_MSG = "Materia no encontrada con ID: ";
    private static final String CARRERA_NO_ENCONTRADA_MSG = "Carrera no encontrada con ID: ";
    private static final String DOCENTE_NO_ENCONTRADO_MSG = "Docente no encontrado con ID: ";
    private static final String USUARIO_NO_ENCONTRADO_MSG = "Usuario no encontrado con email: ";
    private static final String ESTADO_APROBADA = "APROBADA";

    private final MateriaRepository materiaRepository;
    private final CarreraRepository carreraRepository;
    private final UsuarioRepository usuarioRepository;
    private final InscripcionMateriaRepository inscripcionMateriaRepository;

    public MateriaResponseDto createMateria(MateriaCreateDto createDto) {
        Carrera carrera = carreraRepository.findById(createDto.getCarreraId())
                .orElseThrow(() -> new RecursoNoEncontradoException(CARRERA_NO_ENCONTRADA_MSG + createDto.getCarreraId()));

        Materia materia = new Materia();
        materia.setNombre(createDto.getNombre());
        materia.setCodigo(createDto.getCodigo() != null && !createDto.getCodigo().trim().isEmpty()
                ? createDto.getCodigo() : null);
        materia.setDescripcion(createDto.getDescripcion());
        materia.setCarrera(carrera);
        materia.setSemestre(createDto.getSemestre());
        materia.setCreditos(createDto.getCreditos());
        materia.setDeletedAt(null);

        if (createDto.getDocenteId() != null) {
            Usuario docente = usuarioRepository.findById(createDto.getDocenteId())
                    .orElseThrow(() -> new RecursoNoEncontradoException(DOCENTE_NO_ENCONTRADO_MSG + createDto.getDocenteId()));
            materia.setDocente(docente);
        }

        if (createDto.getPrerrequisitoIds() != null && !createDto.getPrerrequisitoIds().isEmpty()) {
            // En una materia nueva no puede haber ciclos (nada la referencia todavía).
            materia.setPrerrequisitos(resolverPrerrequisitos(materia, createDto.getPrerrequisitoIds()));
        }

        Materia savedMateria = materiaRepository.save(materia);
        MateriaResponseDto dto = mapToResponseDto(savedMateria);
        dto.setPrerrequisitoIds(prereqIds(savedMateria));
        return dto;
    }

    /**
     * Mapea una lista de materias con los inscriptos contados de una sola vez.
     *
     * Mapeadas de a una, cada materia disparaba su propio COUNT: listar el
     * catalogo entero eran 252 consultas de mas.
     */
    private List<MateriaResponseDto> mapearLista(List<Materia> materias) {
        Map<Long, Long> conteos = conteoDeInscriptos();
        return materias.stream()
                .map(materia -> mapToResponseDto(materia, conteos.getOrDefault(materia.getId(), 0L)))
                .toList();
    }

    private Map<Long, Long> conteoDeInscriptos() {
        return inscripcionMateriaRepository.contarInscriptosPorMateria().stream()
                .collect(Collectors.toMap(
                        InscripcionMateriaRepository.MateriaConteo::getMateriaId,
                        InscripcionMateriaRepository.MateriaConteo::getTotal));
    }

    @Transactional(readOnly = true)
    public List<MateriaResponseDto> getAllMaterias() {
        return mapearLista(materiaRepository.findActivasConCarreraYDocente());
    }

    @Transactional(readOnly = true)
    public MateriaResponseDto getMateriaById(Long id) {
        Materia materia = materiaRepository.findById(id)
                .orElseThrow(() -> new RecursoNoEncontradoException(MATERIA_NO_ENCONTRADA_MSG + id));
        MateriaResponseDto dto = mapToResponseDto(materia);
        dto.setPrerrequisitoIds(prereqIds(materia));
        return dto;
    }

    @Transactional(readOnly = true)
    public List<MateriaResponseDto> getMateriasByCarrera(Long carreraId) {
        return mapearLista(materiaRepository.findByCarreraId(carreraId));
    }

    /**
     * Materias que dicta el usuario. Vacío si no dicta ninguna.
     */
    @Transactional(readOnly = true)
    public List<MateriaResponseDto> getMateriasQueDicta(String email) {
        Usuario usuario = resolveUsuario(email);
        return mapearLista(materiaRepository.findByDocenteId(usuario.getId()));
    }

    /**
     * Materias en las que el usuario está inscripto. Vacío si no cursa ninguna.
     */
    @Transactional(readOnly = true)
    public List<MateriaResponseDto> getMateriasQueCursa(String email) {
        Usuario usuario = resolveUsuario(email);
        return mapearLista(inscripcionMateriaRepository.findByEstudianteIdAndDeletedAtIsNull(usuario.getId()).stream()
                .map(InscripcionMateria::getMateria)
                .toList());
    }

    private Usuario resolveUsuario(String email) {
        return usuarioRepository.findByEmail(email)
                .orElseThrow(() -> new RecursoNoEncontradoException(USUARIO_NO_ENCONTRADO_MSG + email));
    }

    /**
     * Actualiza una materia. Si el usuario autenticado es DOCENTE, solo puede
     * editar materias cuyo docente sea él mismo.
     */
    public MateriaResponseDto updateMateria(Long id, MateriaUpdateDto updateDto, String email) {
        Materia materia = materiaRepository.findById(id)
                .orElseThrow(() -> new RecursoNoEncontradoException(MATERIA_NO_ENCONTRADA_MSG + id));

        Usuario usuario = usuarioRepository.findByEmail(email)
                .orElseThrow(() -> new RecursoNoEncontradoException(USUARIO_NO_ENCONTRADO_MSG + email));

        String rol = usuario.getRolApp() != null ? usuario.getRolApp().name() : "";

        // Ownership: un DOCENTE solo puede editar las materias que dicta
        if (ROLE_DOCENTE.equals(rol)
                && (materia.getDocente() == null || !materia.getDocente().getId().equals(usuario.getId()))) {
            throw new AccesoDenegadoException("No tienes permiso para editar esta materia");
        }

        if (updateDto.getNombre() != null) {
            materia.setNombre(updateDto.getNombre());
        }

        if (updateDto.getCodigo() != null) {
            materia.setCodigo(updateDto.getCodigo().trim().isEmpty() ? null : updateDto.getCodigo());
        }

        if (updateDto.getDescripcion() != null) {
            materia.setDescripcion(updateDto.getDescripcion());
        }

        if (updateDto.getCarreraId() != null) {
            Carrera carrera = carreraRepository.findById(updateDto.getCarreraId())
                    .orElseThrow(() -> new RecursoNoEncontradoException(CARRERA_NO_ENCONTRADA_MSG + updateDto.getCarreraId()));
            materia.setCarrera(carrera);
        }

        if (updateDto.getDocenteId() != null) {
            Usuario docente = usuarioRepository.findById(updateDto.getDocenteId())
                    .orElseThrow(() -> new RecursoNoEncontradoException(DOCENTE_NO_ENCONTRADO_MSG + updateDto.getDocenteId()));
            materia.setDocente(docente);
        }

        if (updateDto.getSemestre() != null) {
            materia.setSemestre(updateDto.getSemestre());
        }

        if (updateDto.getCreditos() != null) {
            materia.setCreditos(updateDto.getCreditos());
        }

        // Correlativas: si viene la lista (aunque sea vacía), reemplaza el set completo.
        if (updateDto.getPrerrequisitoIds() != null) {
            Set<Materia> nuevos = resolverPrerrequisitos(materia, updateDto.getPrerrequisitoIds());
            validarSinCiclos(materia, nuevos);
            materia.getPrerrequisitos().clear();
            materia.getPrerrequisitos().addAll(nuevos);
        }

        materia.setUpdatedAt(Instant.now());

        Materia updatedMateria = materiaRepository.save(materia);
        MateriaResponseDto dto = mapToResponseDto(updatedMateria);
        dto.setPrerrequisitoIds(prereqIds(updatedMateria));
        return dto;
    }

    public void deleteMateria(Long id) {
        Materia materia = materiaRepository.findById(id)
                .orElseThrow(() -> new RecursoNoEncontradoException(MATERIA_NO_ENCONTRADA_MSG + id));

        // Soft delete: marcar como eliminada
        materia.setDeletedAt(Instant.now());
        materia.setUpdatedAt(Instant.now());

        materiaRepository.save(materia);
    }

    @Transactional(readOnly = true)
    public List<MateriaResponseDto> searchMateriasByNombre(String nombre) {
        return mapearLista(materiaRepository.findByNombreContainingIgnoreCase(nombre));
    }

    @Transactional(readOnly = true)
    public Long getTotalMaterias() {
        return materiaRepository.countByActivoTrue();
    }

    /**
     * Mapa de correlativas de una carrera con el avance del estudiante autenticado.
     * Para no-estudiantes devuelve la estructura sin estados de progreso.
     */
    @Transactional(readOnly = true)
    public MapaCarreraDto getMapaCarrera(Long carreraId, String email) {
        Carrera carrera = carreraRepository.findById(carreraId)
                .orElseThrow(() -> new RecursoNoEncontradoException(CARRERA_NO_ENCONTRADA_MSG + carreraId));

        List<Materia> materias = materiaRepository.findByCarreraIdConPrerrequisitos(carreraId);
        Set<Long> idsActivas = materias.stream().map(Materia::getId).collect(Collectors.toSet());

        Map<Long, Long> inscriptos = conteoDeInscriptos();

        Usuario usuario = email != null ? usuarioRepository.findByEmail(email).orElse(null) : null;
        String rol = (usuario != null && usuario.getRolApp() != null) ? usuario.getRolApp().name() : "";
        boolean esEstudiante = ROLE_ESTUDIANTE.equals(rol);

        Map<Long, String> estadoInscripcion = esEstudiante
                ? estadoDeInscripciones(usuario.getId(), idsActivas)
                : Map.of();
        Set<Long> aprobadas = estadoInscripcion.entrySet().stream()
                .filter(e -> ESTADO_APROBADA.equals(e.getValue()))
                .map(Map.Entry::getKey)
                .collect(Collectors.toSet());

        List<MapaCarreraDto.Nodo> nodos = new ArrayList<>();
        int materiasAprobadas = 0;
        int totalCreditos = 0;
        int creditosAprobados = 0;
        for (Materia m : materias) {
            List<Long> prereqIds = m.getPrerrequisitos().stream()
                    .map(Materia::getId)
                    .filter(idsActivas::contains)
                    .sorted()
                    .toList();

            String estado = esEstudiante
                    ? estadoDeMateria(estadoInscripcion.get(m.getId()), prereqIds, aprobadas)
                    : null;

            int cred = m.getCreditos() != null ? m.getCreditos() : 0;
            totalCreditos += cred;
            if (ESTADO_APROBADA.equals(estado)) {
                materiasAprobadas++;
                creditosAprobados += cred;
            }

            nodos.add(new MapaCarreraDto.Nodo(
                    m.getId(), m.getNombre(), m.getCodigo(), m.getSemestre(), m.getCreditos(),
                    m.getDocente() != null ? m.getDocente().getId() : null,
                    m.getDocente() != null ? m.getDocente().getNombre() : null,
                    inscriptos.getOrDefault(m.getId(), 0L),
                    prereqIds, estado));
        }

        return new MapaCarreraDto(carrera.getId(), carrera.getNombre(), nodos,
                materias.size(), materiasAprobadas, totalCreditos, creditosAprobados, esEstudiante);
    }

    /** Estado de cada inscripción del estudiante, limitado a las materias activas. */
    private Map<Long, String> estadoDeInscripciones(Long estudianteId, Set<Long> idsActivas) {
        Map<Long, String> estados = new HashMap<>();
        for (InscripcionMateria i : inscripcionMateriaRepository.findByEstudianteIdAndDeletedAtIsNull(estudianteId)) {
            if (i.getMateria() != null && idsActivas.contains(i.getMateria().getId())) {
                estados.put(i.getMateria().getId(), i.getEstado());
            }
        }
        return estados;
    }

    /**
     * Estado de una materia en el mapa: la aprobó, la está cursando, o —si no la
     * cursó— si tiene las correlativas aprobadas para poder anotarse.
     */
    private static String estadoDeMateria(String inscripcion, List<Long> prerrequisitos, Set<Long> aprobadas) {
        if (ESTADO_APROBADA.equals(inscripcion)) {
            return ESTADO_APROBADA;
        }
        if (inscripcion != null) {
            return "CURSANDO";
        }
        return prerrequisitos.stream().allMatch(aprobadas::contains) ? "DISPONIBLE" : "BLOQUEADA";
    }

    /** Resuelve IDs a materias correlativas válidas (activas, misma carrera, no la propia). */
    private Set<Materia> resolverPrerrequisitos(Materia materia, List<Long> ids) {
        Set<Materia> result = new LinkedHashSet<>();
        Long carreraId = materia.getCarrera() != null ? materia.getCarrera().getId() : null;
        for (Long pid : ids.stream().distinct().toList()) {
            if (pid == null) {
                continue;
            }
            if (materia.getId() != null && pid.equals(materia.getId())) {
                throw new IllegalArgumentException("Una materia no puede ser correlativa de sí misma");
            }
            Materia pre = materiaRepository.findById(pid)
                    .filter(m -> m.getDeletedAt() == null)
                    .orElseThrow(() -> new IllegalArgumentException("Materia correlativa no encontrada: " + pid));
            if (carreraId != null && pre.getCarrera() != null && !carreraId.equals(pre.getCarrera().getId())) {
                throw new IllegalArgumentException("Las correlativas deben ser de la misma carrera");
            }
            result.add(pre);
        }
        return result;
    }

    /** Evita ciclos: agregar materia→p es inválido si materia ya es alcanzable desde p. */
    private void validarSinCiclos(Materia materia, Set<Materia> nuevosPrereqs) {
        for (Materia p : nuevosPrereqs) {
            if (alcanza(p, materia.getId(), new HashSet<>())) {
                throw new IllegalArgumentException("Esa correlativa generaría un ciclo (dependencia circular)");
            }
        }
    }

    private boolean alcanza(Materia desde, Long objetivoId, Set<Long> visitados) {
        if (desde.getId() != null && desde.getId().equals(objetivoId)) {
            return true;
        }
        if (desde.getId() != null && !visitados.add(desde.getId())) {
            return false;
        }
        for (Materia pre : desde.getPrerrequisitos()) {
            if (alcanza(pre, objetivoId, visitados)) {
                return true;
            }
        }
        return false;
    }

    private List<Long> prereqIds(Materia materia) {
        if (materia.getPrerrequisitos() == null) {
            return List.of();
        }
        return materia.getPrerrequisitos().stream().map(Materia::getId).sorted().toList();
    }

    private MateriaResponseDto mapToResponseDto(Materia materia) {
        return mapToResponseDto(materia, inscripcionMateriaRepository.countByMateriaIdAndDeletedAtIsNull(materia.getId()));
    }

    private MateriaResponseDto mapToResponseDto(Materia materia, long totalInscriptos) {
        MateriaResponseDto dto = new MateriaResponseDto();
        dto.setId(materia.getId());
        dto.setNombre(materia.getNombre());
        dto.setCodigo(materia.getCodigo());
        dto.setDescripcion(materia.getDescripcion());
        if (materia.getCarrera() != null) {
            dto.setCarreraId(materia.getCarrera().getId());
            dto.setCarreraNombre(materia.getCarrera().getNombre());
        }
        if (materia.getDocente() != null) {
            dto.setDocenteId(materia.getDocente().getId());
            dto.setDocenteNombre(materia.getDocente().getNombre());
        }
        dto.setSemestre(materia.getSemestre());
        dto.setCreditos(materia.getCreditos());
        dto.setTotalInscriptos(totalInscriptos);
        dto.setCreatedAt(materia.getCreatedAt());
        dto.setUpdatedAt(materia.getUpdatedAt());
        dto.setDeletedAt(materia.getDeletedAt());
        return dto;
    }
}
