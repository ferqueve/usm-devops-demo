package com.utec.backend.service;

import com.utec.backend.dto.materia.MateriaCreateDto;
import com.utec.backend.dto.materia.MateriaResponseDto;
import com.utec.backend.dto.materia.MateriaUpdateDto;
import com.utec.backend.model.Carrera;
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
import java.util.List;

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

    private final MateriaRepository materiaRepository;
    private final CarreraRepository carreraRepository;
    private final UsuarioRepository usuarioRepository;
    private final InscripcionMateriaRepository inscripcionMateriaRepository;

    public MateriaResponseDto createMateria(MateriaCreateDto createDto) {
        Carrera carrera = carreraRepository.findById(createDto.getCarreraId())
                .orElseThrow(() -> new IllegalArgumentException(CARRERA_NO_ENCONTRADA_MSG + createDto.getCarreraId()));

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
                    .orElseThrow(() -> new IllegalArgumentException(DOCENTE_NO_ENCONTRADO_MSG + createDto.getDocenteId()));
            materia.setDocente(docente);
        }

        Materia savedMateria = materiaRepository.save(materia);
        return mapToResponseDto(savedMateria);
    }

    @Transactional(readOnly = true)
    public List<MateriaResponseDto> getAllMaterias() {
        return materiaRepository.findByActivoTrue().stream()
                .map(this::mapToResponseDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public MateriaResponseDto getMateriaById(Long id) {
        Materia materia = materiaRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException(MATERIA_NO_ENCONTRADA_MSG + id));
        return mapToResponseDto(materia);
    }

    @Transactional(readOnly = true)
    public List<MateriaResponseDto> getMateriasByCarrera(Long carreraId) {
        return materiaRepository.findByCarreraId(carreraId).stream()
                .map(this::mapToResponseDto)
                .toList();
    }

    /**
     * Materias relacionadas al usuario autenticado:
     * - DOCENTE: materias que dicta
     * - ESTUDIANTE: materias de sus inscripciones activas
     * - Otros roles: lista vacía
     */
    @Transactional(readOnly = true)
    public List<MateriaResponseDto> getMateriasDelUsuario(String email) {
        Usuario usuario = usuarioRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException(USUARIO_NO_ENCONTRADO_MSG + email));

        String rol = usuario.getRolApp() != null ? usuario.getRolApp().name() : "";

        if (ROLE_DOCENTE.equals(rol)) {
            return materiaRepository.findByDocenteId(usuario.getId()).stream()
                    .map(this::mapToResponseDto)
                    .toList();
        }

        if (ROLE_ESTUDIANTE.equals(rol)) {
            return inscripcionMateriaRepository.findByEstudianteIdAndDeletedAtIsNull(usuario.getId()).stream()
                    .map(inscripcion -> mapToResponseDto(inscripcion.getMateria()))
                    .toList();
        }

        return List.of();
    }

    /**
     * Actualiza una materia. Si el usuario autenticado es DOCENTE, solo puede
     * editar materias cuyo docente sea él mismo.
     */
    public MateriaResponseDto updateMateria(Long id, MateriaUpdateDto updateDto, String email) {
        Materia materia = materiaRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException(MATERIA_NO_ENCONTRADA_MSG + id));

        Usuario usuario = usuarioRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException(USUARIO_NO_ENCONTRADO_MSG + email));

        String rol = usuario.getRolApp() != null ? usuario.getRolApp().name() : "";

        // Ownership: un DOCENTE solo puede editar las materias que dicta
        if (ROLE_DOCENTE.equals(rol)
                && (materia.getDocente() == null || !materia.getDocente().getId().equals(usuario.getId()))) {
            throw new IllegalStateException("No tienes permiso para editar esta materia");
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
                    .orElseThrow(() -> new IllegalArgumentException(CARRERA_NO_ENCONTRADA_MSG + updateDto.getCarreraId()));
            materia.setCarrera(carrera);
        }

        if (updateDto.getDocenteId() != null) {
            Usuario docente = usuarioRepository.findById(updateDto.getDocenteId())
                    .orElseThrow(() -> new IllegalArgumentException(DOCENTE_NO_ENCONTRADO_MSG + updateDto.getDocenteId()));
            materia.setDocente(docente);
        }

        if (updateDto.getSemestre() != null) {
            materia.setSemestre(updateDto.getSemestre());
        }

        if (updateDto.getCreditos() != null) {
            materia.setCreditos(updateDto.getCreditos());
        }

        materia.setUpdatedAt(Instant.now());

        Materia updatedMateria = materiaRepository.save(materia);
        return mapToResponseDto(updatedMateria);
    }

    public void deleteMateria(Long id) {
        Materia materia = materiaRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException(MATERIA_NO_ENCONTRADA_MSG + id));

        // Soft delete: marcar como eliminada
        materia.setDeletedAt(Instant.now());
        materia.setUpdatedAt(Instant.now());

        materiaRepository.save(materia);
    }

    @Transactional(readOnly = true)
    public List<MateriaResponseDto> searchMateriasByNombre(String nombre) {
        return materiaRepository.findByNombreContainingIgnoreCase(nombre).stream()
                .map(this::mapToResponseDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public Long getTotalMaterias() {
        return materiaRepository.countByActivoTrue();
    }

    private MateriaResponseDto mapToResponseDto(Materia materia) {
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
        dto.setTotalInscriptos(inscripcionMateriaRepository.countByMateriaIdAndDeletedAtIsNull(materia.getId()));
        dto.setCreatedAt(materia.getCreatedAt());
        dto.setUpdatedAt(materia.getUpdatedAt());
        dto.setDeletedAt(materia.getDeletedAt());
        return dto;
    }
}
