package com.utec.backend.service;

import com.utec.backend.dto.tutoria.TutoriaCreateDto;
import com.utec.backend.dto.tutoria.TutoriaResponseDto;
import com.utec.backend.dto.tutoria.TutoriaUpdateDto;
import com.utec.backend.model.Espacio;
import com.utec.backend.model.Materia;
import com.utec.backend.model.Tutoria;
import com.utec.backend.model.TutoriaReserva;
import com.utec.backend.model.Usuario;
import com.utec.backend.repository.EspacioRepository;
import com.utec.backend.repository.MateriaRepository;
import com.utec.backend.repository.TutoriaRepository;
import com.utec.backend.repository.TutoriaReservaRepository;
import com.utec.backend.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class TutoriaService {

    private static final String TUTORIA_NO_ENCONTRADA_MSG = "Tutoría no encontrada con ID: ";
    private static final String RESERVA_NO_ENCONTRADA_MSG = "Reserva de tutoría no encontrada con ID: ";
    private static final String MATERIA_NO_ENCONTRADA_MSG = "Materia no encontrada con ID: ";
    private static final String ESPACIO_NO_ENCONTRADO_MSG = "Espacio no encontrado con ID: ";
    private static final String USUARIO_NO_ENCONTRADO_MSG = "Usuario no encontrado con email: ";
    private static final String ESTADO_AGENDADA = "AGENDADA";
    private static final String ESTADO_CANCELADA = "CANCELADA";

    private final TutoriaRepository tutoriaRepository;
    private final TutoriaReservaRepository tutoriaReservaRepository;
    private final MateriaRepository materiaRepository;
    private final EspacioRepository espacioRepository;
    private final UsuarioRepository usuarioRepository;

    public TutoriaResponseDto crear(TutoriaCreateDto dto, String emailDocente) {
        Usuario docente = usuarioRepository.findByEmail(emailDocente)
                .orElseThrow(() -> new IllegalArgumentException(USUARIO_NO_ENCONTRADO_MSG + emailDocente));

        Materia materia = materiaRepository.findById(dto.getMateriaId())
                .orElseThrow(() -> new IllegalArgumentException(MATERIA_NO_ENCONTRADA_MSG + dto.getMateriaId()));

        if (dto.getFin().isBefore(dto.getInicio()) || dto.getFin().equals(dto.getInicio())) {
            throw new IllegalArgumentException("La fecha/hora de fin debe ser posterior a la de inicio");
        }

        Tutoria tutoria = new Tutoria();
        tutoria.setMateria(materia);
        tutoria.setDocente(docente);
        tutoria.setEspacio(resolveEspacio(dto.getEspacioId()));
        tutoria.setInicio(dto.getInicio());
        tutoria.setFin(dto.getFin());
        tutoria.setCupo(dto.getCupo());
        tutoria.setEstado("ABIERTA");

        Tutoria saved = tutoriaRepository.save(tutoria);
        return mapToResponseDto(saved);
    }

    @Transactional(readOnly = true)
    public List<TutoriaResponseDto> listar(Long materiaId) {
        List<Tutoria> tutorias = (materiaId != null)
                ? tutoriaRepository.findByMateriaIdAndDeletedAtIsNull(materiaId)
                : tutoriaRepository.findByDeletedAtIsNull();
        return tutorias.stream().map(this::mapToResponseDto).toList();
    }

    @Transactional(readOnly = true)
    public List<TutoriaResponseDto> misTutorias(String email) {
        Usuario usuario = usuarioRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException(USUARIO_NO_ENCONTRADO_MSG + email));

        if (usuario.getRolApp() == Usuario.RolApp.DOCENTE) {
            // DOCENTE -> sus franjas de tutoría
            return tutoriaRepository.findByDocenteIdAndDeletedAtIsNull(usuario.getId()).stream()
                    .map(this::mapToResponseDto)
                    .toList();
        }

        // ESTUDIANTE (u otro rol) -> las tutorías que agendó (reservas activas)
        List<TutoriaResponseDto> result = new ArrayList<>();
        for (TutoriaReserva reserva : tutoriaReservaRepository.findByEstudianteIdAndDeletedAtIsNull(usuario.getId())) {
            if (!ESTADO_CANCELADA.equals(reserva.getEstado()) && reserva.getTutoria().getDeletedAt() == null) {
                TutoriaResponseDto dto = mapToResponseDto(reserva.getTutoria());
                dto.setReservaId(reserva.getId());
                result.add(dto);
            }
        }
        return result;
    }

    public TutoriaResponseDto editar(Long id, TutoriaUpdateDto dto, String email) {
        Tutoria tutoria = tutoriaRepository.findById(id)
                .filter(t -> t.getDeletedAt() == null)
                .orElseThrow(() -> new IllegalArgumentException(TUTORIA_NO_ENCONTRADA_MSG + id));

        Usuario usuario = usuarioRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException(USUARIO_NO_ENCONTRADO_MSG + email));

        // Ownership: solo el docente dueño puede editar
        if (tutoria.getDocente() == null || !tutoria.getDocente().getId().equals(usuario.getId())) {
            throw new IllegalStateException("No tienes permiso para editar esta tutoría");
        }

        if (dto.getMateriaId() != null) {
            Materia materia = materiaRepository.findById(dto.getMateriaId())
                    .orElseThrow(() -> new IllegalArgumentException(MATERIA_NO_ENCONTRADA_MSG + dto.getMateriaId()));
            tutoria.setMateria(materia);
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

        if (tutoria.getFin().isBefore(tutoria.getInicio()) || tutoria.getFin().equals(tutoria.getInicio())) {
            throw new IllegalArgumentException("La fecha/hora de fin debe ser posterior a la de inicio");
        }

        Tutoria updated = tutoriaRepository.save(tutoria);
        return mapToResponseDto(updated);
    }

    public TutoriaResponseDto agendar(Long tutoriaId, String emailEstudiante) {
        Tutoria tutoria = tutoriaRepository.findById(tutoriaId)
                .filter(t -> t.getDeletedAt() == null)
                .orElseThrow(() -> new IllegalArgumentException(TUTORIA_NO_ENCONTRADA_MSG + tutoriaId));

        Usuario estudiante = usuarioRepository.findByEmail(emailEstudiante)
                .orElseThrow(() -> new IllegalArgumentException(USUARIO_NO_ENCONTRADO_MSG + emailEstudiante));

        if (!"ABIERTA".equals(tutoria.getEstado())) {
            throw new IllegalStateException("La tutoría no está abierta para agendar");
        }

        if (tutoriaReservaRepository.existsByTutoriaIdAndEstudianteIdAndDeletedAtIsNull(tutoriaId, estudiante.getId())) {
            throw new IllegalStateException("Ya estás agendado en esta tutoría");
        }

        long agendadas = tutoriaReservaRepository.countByTutoriaIdAndEstadoAndDeletedAtIsNull(tutoriaId, ESTADO_AGENDADA);
        if (agendadas >= tutoria.getCupo()) {
            throw new IllegalStateException("No hay plazas disponibles en esta tutoría");
        }

        TutoriaReserva reserva = new TutoriaReserva();
        reserva.setTutoria(tutoria);
        reserva.setEstudiante(estudiante);
        reserva.setEstado(ESTADO_AGENDADA);
        tutoriaReservaRepository.save(reserva);

        return mapToResponseDto(tutoria);
    }

    public void cancelarReserva(Long reservaId, String email) {
        TutoriaReserva reserva = tutoriaReservaRepository.findById(reservaId)
                .filter(r -> r.getDeletedAt() == null)
                .orElseThrow(() -> new IllegalArgumentException(RESERVA_NO_ENCONTRADA_MSG + reservaId));

        Usuario usuario = usuarioRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException(USUARIO_NO_ENCONTRADO_MSG + email));

        boolean esEstudianteDueno = reserva.getEstudiante() != null
                && reserva.getEstudiante().getId().equals(usuario.getId());
        boolean esDocenteDeTutoria = reserva.getTutoria().getDocente() != null
                && reserva.getTutoria().getDocente().getId().equals(usuario.getId());

        if (!esEstudianteDueno && !esDocenteDeTutoria) {
            throw new IllegalStateException("No tienes permiso para cancelar esta reserva");
        }

        reserva.setEstado(ESTADO_CANCELADA);
        reserva.setDeletedAt(Instant.now());
        tutoriaReservaRepository.save(reserva);
    }

    private Espacio resolveEspacio(Long espacioId) {
        if (espacioId == null) {
            return null;
        }
        return espacioRepository.findById(espacioId)
                .orElseThrow(() -> new IllegalArgumentException(ESPACIO_NO_ENCONTRADO_MSG + espacioId));
    }

    private TutoriaResponseDto mapToResponseDto(Tutoria tutoria) {
        long agendadas = tutoriaReservaRepository.countByTutoriaIdAndEstadoAndDeletedAtIsNull(
                tutoria.getId(), ESTADO_AGENDADA);
        int plazasDisponibles = Math.max(0, tutoria.getCupo() - (int) agendadas);

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
        dto.setCreatedAt(tutoria.getCreatedAt());
        return dto;
    }
}
