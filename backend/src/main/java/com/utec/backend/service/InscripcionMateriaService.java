package com.utec.backend.service;

import com.utec.backend.dto.inscripcion.InscripcionResponseDto;
import com.utec.backend.model.InscripcionMateria;
import com.utec.backend.model.Materia;
import com.utec.backend.model.Usuario;
import com.utec.backend.repository.InscripcionMateriaRepository;
import com.utec.backend.repository.MateriaRepository;
import com.utec.backend.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class InscripcionMateriaService {

    private static final String MATERIA_NO_ENCONTRADA_MSG = "Materia no encontrada con ID: ";
    private static final String INSCRIPCION_NO_ENCONTRADA_MSG = "Inscripción no encontrada con ID: ";
    private static final String USUARIO_NO_ENCONTRADO_MSG = "Usuario no encontrado con email: ";

    private final InscripcionMateriaRepository inscripcionMateriaRepository;
    private final MateriaRepository materiaRepository;
    private final UsuarioRepository usuarioRepository;

    /**
     * Inscribe al usuario autenticado (estudiante) en una materia.
     */
    public InscripcionResponseDto inscribir(Long materiaId, String email) {
        Materia materia = materiaRepository.findById(materiaId)
                .orElseThrow(() -> new IllegalArgumentException(MATERIA_NO_ENCONTRADA_MSG + materiaId));

        if (materia.getDeletedAt() != null) {
            throw new IllegalStateException("La materia no está disponible");
        }

        Usuario estudiante = usuarioRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException(USUARIO_NO_ENCONTRADO_MSG + email));

        if (inscripcionMateriaRepository.existsByMateriaIdAndEstudianteIdAndDeletedAtIsNull(materiaId, estudiante.getId())) {
            throw new IllegalStateException("Ya estás inscripto en esta materia");
        }

        InscripcionMateria inscripcion = new InscripcionMateria();
        inscripcion.setMateria(materia);
        inscripcion.setEstudiante(estudiante);
        inscripcion.setEstado("ACTIVA");
        inscripcion.setDeletedAt(null);

        InscripcionMateria saved = inscripcionMateriaRepository.save(inscripcion);
        return mapToResponseDto(saved);
    }

    /**
     * Inscriptos activos de una materia.
     */
    @Transactional(readOnly = true)
    public List<InscripcionResponseDto> getInscriptosByMateria(Long materiaId) {
        return inscripcionMateriaRepository.findByMateriaIdAndDeletedAtIsNull(materiaId).stream()
                .map(this::mapToResponseDto)
                .toList();
    }

    /**
     * Inscripciones activas del usuario autenticado.
     */
    @Transactional(readOnly = true)
    public List<InscripcionResponseDto> getMisInscripciones(String email) {
        Usuario estudiante = usuarioRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException(USUARIO_NO_ENCONTRADO_MSG + email));

        return inscripcionMateriaRepository.findByEstudianteIdAndDeletedAtIsNull(estudiante.getId()).stream()
                .map(this::mapToResponseDto)
                .toList();
    }

    /**
     * Cancela (soft delete) una inscripción. El estudiante solo puede cancelar
     * sus propias inscripciones.
     */
    public void cancelarInscripcion(Long inscripcionId, String email) {
        InscripcionMateria inscripcion = inscripcionMateriaRepository.findById(inscripcionId)
                .orElseThrow(() -> new IllegalArgumentException(INSCRIPCION_NO_ENCONTRADA_MSG + inscripcionId));

        Usuario usuario = usuarioRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException(USUARIO_NO_ENCONTRADO_MSG + email));

        if (inscripcion.getEstudiante() == null || !inscripcion.getEstudiante().getId().equals(usuario.getId())) {
            throw new IllegalStateException("No tienes permiso para cancelar esta inscripción");
        }

        inscripcion.setEstado("CANCELADA");
        inscripcion.setDeletedAt(Instant.now());
        inscripcion.setUpdatedAt(Instant.now());

        inscripcionMateriaRepository.save(inscripcion);
    }

    private InscripcionResponseDto mapToResponseDto(InscripcionMateria inscripcion) {
        InscripcionResponseDto dto = new InscripcionResponseDto();
        dto.setId(inscripcion.getId());
        if (inscripcion.getMateria() != null) {
            dto.setMateriaId(inscripcion.getMateria().getId());
            dto.setMateriaNombre(inscripcion.getMateria().getNombre());
        }
        if (inscripcion.getEstudiante() != null) {
            dto.setEstudianteId(inscripcion.getEstudiante().getId());
            dto.setEstudianteNombre(inscripcion.getEstudiante().getNombre());
        }
        dto.setEstado(inscripcion.getEstado());
        dto.setCreatedAt(inscripcion.getCreatedAt());
        return dto;
    }
}
