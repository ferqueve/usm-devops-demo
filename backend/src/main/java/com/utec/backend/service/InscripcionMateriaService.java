package com.utec.backend.service;

import com.utec.backend.dto.inscripcion.InscripcionResponseDto;
import com.utec.backend.exception.RecursoNoEncontradoException;
import com.utec.backend.exception.AccesoDenegadoException;
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
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import static com.utec.backend.security.Constants.ROLE_ADMIN;
import static com.utec.backend.security.Constants.ROLE_ANALISTA;

@Service
@RequiredArgsConstructor
@Transactional
public class InscripcionMateriaService {

    private static final String MATERIA_NO_ENCONTRADA_MSG = "Materia no encontrada con ID: ";
    private static final String INSCRIPCION_NO_ENCONTRADA_MSG = "Inscripción no encontrada con ID: ";
    private static final String USUARIO_NO_ENCONTRADO_MSG = "Usuario no encontrado con email: ";
    private static final String ESTADO_ACTIVA = "ACTIVA";
    private static final String ESTADO_APROBADA = "APROBADA";

    private final InscripcionMateriaRepository inscripcionMateriaRepository;
    private final MateriaRepository materiaRepository;
    private final UsuarioRepository usuarioRepository;
    private final EmailService emailService;

    /**
     * Inscribe a un estudiante específico (acción de admin/analista).
     */
    public InscripcionResponseDto inscribirEstudiante(Long materiaId, Long estudianteId) {
        Materia materia = materiaRepository.findById(materiaId)
                .orElseThrow(() -> new RecursoNoEncontradoException(MATERIA_NO_ENCONTRADA_MSG + materiaId));
        if (materia.getDeletedAt() != null) {
            throw new IllegalStateException("La materia no está disponible");
        }
        Usuario estudiante = usuarioRepository.findById(estudianteId)
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado con ID: " + estudianteId));
        if (inscripcionMateriaRepository.existsByMateriaIdAndEstudianteIdAndDeletedAtIsNull(materiaId, estudiante.getId())) {
            throw new IllegalStateException("El estudiante ya está inscripto en esta materia");
        }
        InscripcionMateria inscripcion = new InscripcionMateria();
        inscripcion.setMateria(materia);
        inscripcion.setEstudiante(estudiante);
        inscripcion.setEstado("ACTIVA");
        inscripcion.setDeletedAt(null);
        return mapToResponseDto(inscripcionMateriaRepository.save(inscripcion));
    }

    /**
     * Elimina (soft delete) cualquier inscripción, sin chequeo de propiedad.
     * Pensado para administradores.
     */
    public void eliminarInscripcion(Long inscripcionId) {
        InscripcionMateria inscripcion = inscripcionMateriaRepository.findById(inscripcionId)
                .orElseThrow(() -> new RecursoNoEncontradoException(INSCRIPCION_NO_ENCONTRADA_MSG + inscripcionId));
        inscripcion.setEstado("CANCELADA");
        inscripcion.setDeletedAt(Instant.now());
        inscripcion.setUpdatedAt(Instant.now());
        inscripcionMateriaRepository.save(inscripcion);
    }

    /**
     * Envía una notificación por email a todos los inscriptos activos de la materia.
     * Devuelve {total, enviados}. Si Gmail no está disponible, enviados=0.
     */
    @Transactional(readOnly = true)
    public Map<String, Object> notificarInscriptos(Long materiaId, String asunto, String mensaje) {
        Materia materia = materiaRepository.findById(materiaId)
                .orElseThrow(() -> new RecursoNoEncontradoException(MATERIA_NO_ENCONTRADA_MSG + materiaId));
        List<InscripcionMateria> inscripciones = inscripcionMateriaRepository.findByMateriaIdAndDeletedAtIsNull(materiaId);
        String asuntoFinal = (asunto == null || asunto.isBlank()) ? ("Aviso · " + materia.getNombre()) : asunto;
        int enviados = 0;
        for (InscripcionMateria i : inscripciones) {
            Usuario e = i.getEstudiante();
            if (e == null || e.getEmail() == null) {
                continue;
            }
            if (emailService.enviarNotificacionSimple(e.getEmail(), asuntoFinal, mensaje)) {
                enviados++;
            }
        }
        Map<String, Object> resultado = new LinkedHashMap<>();
        resultado.put("total", inscripciones.size());
        resultado.put("enviados", enviados);
        return resultado;
    }

    /**
     * Inscribe al usuario autenticado (estudiante) en una materia.
     */
    public InscripcionResponseDto inscribir(Long materiaId, String email) {
        Materia materia = materiaRepository.findById(materiaId)
                .orElseThrow(() -> new RecursoNoEncontradoException(MATERIA_NO_ENCONTRADA_MSG + materiaId));

        if (materia.getDeletedAt() != null) {
            throw new IllegalStateException("La materia no está disponible");
        }

        Usuario estudiante = usuarioRepository.findByEmail(email)
                .orElseThrow(() -> new RecursoNoEncontradoException(USUARIO_NO_ENCONTRADO_MSG + email));

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
                .orElseThrow(() -> new RecursoNoEncontradoException(USUARIO_NO_ENCONTRADO_MSG + email));

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
                .orElseThrow(() -> new RecursoNoEncontradoException(INSCRIPCION_NO_ENCONTRADA_MSG + inscripcionId));

        Usuario usuario = usuarioRepository.findByEmail(email)
                .orElseThrow(() -> new RecursoNoEncontradoException(USUARIO_NO_ENCONTRADO_MSG + email));

        if (inscripcion.getEstudiante() == null || !inscripcion.getEstudiante().getId().equals(usuario.getId())) {
            throw new AccesoDenegadoException("No tienes permiso para cancelar esta inscripción");
        }

        inscripcion.setEstado("CANCELADA");
        inscripcion.setDeletedAt(Instant.now());
        inscripcion.setUpdatedAt(Instant.now());

        inscripcionMateriaRepository.save(inscripcion);
    }

    /**
     * Cambia el estado de una inscripción entre ACTIVA (cursando) y APROBADA (cursada).
     * Permitido a admin/analista o al docente de la materia.
     */
    public InscripcionResponseDto marcarEstado(Long inscripcionId, String estado, String email) {
        String nuevo = estado != null ? estado.trim().toUpperCase() : "";
        if (!ESTADO_ACTIVA.equals(nuevo) && !ESTADO_APROBADA.equals(nuevo)) {
            throw new IllegalArgumentException("Estado inválido: usá ACTIVA o APROBADA");
        }
        InscripcionMateria inscripcion = inscripcionMateriaRepository.findById(inscripcionId)
                .orElseThrow(() -> new RecursoNoEncontradoException(INSCRIPCION_NO_ENCONTRADA_MSG + inscripcionId));
        if (inscripcion.getDeletedAt() != null) {
            throw new IllegalStateException("La inscripción no está activa");
        }
        Usuario usuario = usuarioRepository.findByEmail(email)
                .orElseThrow(() -> new RecursoNoEncontradoException(USUARIO_NO_ENCONTRADO_MSG + email));
        String rol = usuario.getRolApp() != null ? usuario.getRolApp().name() : "";
        boolean esAdminOAnalista = ROLE_ADMIN.equals(rol) || ROLE_ANALISTA.equals(rol);
        Materia materia = inscripcion.getMateria();
        boolean esDocenteDeMateria = materia != null && materia.getDocente() != null
                && materia.getDocente().getId().equals(usuario.getId());
        if (!esAdminOAnalista && !esDocenteDeMateria) {
            throw new AccesoDenegadoException("No tenés permiso para cambiar el estado de esta inscripción");
        }
        inscripcion.setEstado(nuevo);
        inscripcion.setUpdatedAt(Instant.now());
        return mapToResponseDto(inscripcionMateriaRepository.save(inscripcion));
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
