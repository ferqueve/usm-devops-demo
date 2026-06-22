package com.utec.backend.service;

import com.utec.backend.dto.evento.EventoCreateDto;
import com.utec.backend.dto.evento.EventoResponseDto;
import com.utec.backend.dto.evento.EventoUpdateDto;
import com.utec.backend.model.Espacio;
import com.utec.backend.model.Evento;
import com.utec.backend.model.EventoInscripcion;
import com.utec.backend.model.Usuario;
import com.utec.backend.repository.EspacioRepository;
import com.utec.backend.repository.EventoInscripcionRepository;
import com.utec.backend.repository.EventoRepository;
import com.utec.backend.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

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
    private static final String ESTADO_INSCRITO = "INSCRITO";

    private final EventoRepository eventoRepository;
    private final EventoInscripcionRepository inscripcionRepository;
    private final EspacioRepository espacioRepository;
    private final UsuarioRepository usuarioRepository;

    public EventoResponseDto createEvento(EventoCreateDto createDto, String organizadorEmail) {
        Evento evento = new Evento();
        evento.setTitulo(createDto.getTitulo());
        evento.setDescripcion(createDto.getDescripcion());
        evento.setTipo(createDto.getTipo() != null ? createDto.getTipo() : "EVENTO");
        evento.setInicio(createDto.getInicio());
        evento.setFin(createDto.getFin());
        evento.setCupo(createDto.getCupo());
        evento.setEsPublico(createDto.getEsPublico() != null ? createDto.getEsPublico() : Boolean.TRUE);
        evento.setEstado(ESTADO_PUBLICADO);

        if (createDto.getEspacioId() != null) {
            evento.setEspacio(resolveEspacio(createDto.getEspacioId()));
        }

        if (organizadorEmail != null) {
            usuarioRepository.findByEmail(organizadorEmail).ifPresent(evento::setOrganizador);
        }

        Evento saved = eventoRepository.save(evento);
        return mapToResponseDto(saved, null);
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

        return eventos.stream()
                .map(e -> mapToResponseDto(e, usuarioId))
                .toList();
    }

    @Transactional(readOnly = true)
    public EventoResponseDto getEventoById(Long id, String email) {
        Evento evento = findActivo(id);
        return mapToResponseDto(evento, resolveUsuarioId(email));
    }

    public EventoResponseDto updateEvento(Long id, EventoUpdateDto updateDto) {
        Evento evento = findActivo(id);

        if (updateDto.getTitulo() != null) {
            evento.setTitulo(updateDto.getTitulo());
        }
        if (updateDto.getDescripcion() != null) {
            evento.setDescripcion(updateDto.getDescripcion());
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
        if (updateDto.getEspacioId() != null) {
            evento.setEspacio(resolveEspacio(updateDto.getEspacioId()));
        }

        evento.setUpdatedAt(Instant.now());
        Evento updated = eventoRepository.save(evento);
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
                .orElseThrow(() -> new IllegalArgumentException(USUARIO_NO_ENCONTRADO_MSG + email));

        if (inscripcionRepository.existsByEventoIdAndUsuarioIdAndDeletedAtIsNull(eventoId, usuario.getId())) {
            throw new IllegalStateException("Ya estás inscrito en este evento");
        }

        if (evento.getCupo() != null) {
            long inscriptos = inscripcionRepository.countByEventoIdAndDeletedAtIsNull(eventoId);
            if (inscriptos >= evento.getCupo()) {
                throw new IllegalStateException("No hay plazas disponibles para este evento");
            }
        }

        EventoInscripcion inscripcion = new EventoInscripcion();
        inscripcion.setEvento(evento);
        inscripcion.setUsuario(usuario);
        inscripcion.setEstado(ESTADO_INSCRITO);
        inscripcionRepository.save(inscripcion);

        return mapToResponseDto(evento, usuario.getId());
    }

    @Transactional(readOnly = true)
    public List<EventoResponseDto> misInscripciones(String email) {
        Usuario usuario = usuarioRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException(USUARIO_NO_ENCONTRADO_MSG + email));

        return inscripcionRepository.findByUsuarioIdAndDeletedAtIsNull(usuario.getId()).stream()
                .map(EventoInscripcion::getEvento)
                .filter(e -> e != null && e.getDeletedAt() == null)
                .map(e -> mapToResponseDto(e, usuario.getId()))
                .toList();
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
                .orElseThrow(() -> new IllegalArgumentException(EVENTO_NO_ENCONTRADO_MSG + id));
        if (evento.getDeletedAt() != null) {
            throw new IllegalArgumentException(EVENTO_NO_ENCONTRADO_MSG + id);
        }
        return evento;
    }

    private Espacio resolveEspacio(Long espacioId) {
        return espacioRepository.findById(espacioId)
                .orElseThrow(() -> new IllegalArgumentException(ESPACIO_NO_ENCONTRADO_MSG + espacioId));
    }

    private Long resolveUsuarioId(String email) {
        if (email == null) {
            return null;
        }
        return usuarioRepository.findByEmail(email)
                .map(Usuario::getId)
                .orElse(null);
    }

    private EventoResponseDto mapToResponseDto(Evento evento, Long usuarioId) {
        EventoResponseDto dto = new EventoResponseDto();
        dto.setId(evento.getId());
        dto.setTitulo(evento.getTitulo());
        dto.setDescripcion(evento.getDescripcion());
        dto.setTipo(evento.getTipo());
        dto.setInicio(evento.getInicio());
        dto.setFin(evento.getFin());
        dto.setCupo(evento.getCupo());
        dto.setEsPublico(evento.getEsPublico());
        dto.setEstado(evento.getEstado());
        dto.setCreatedAt(evento.getCreatedAt());

        if (evento.getEspacio() != null) {
            dto.setEspacioId(evento.getEspacio().getId());
            dto.setEspacioNombre(evento.getEspacio().getNombre());
        }
        if (evento.getOrganizador() != null) {
            dto.setOrganizadorNombre(evento.getOrganizador().getNombre());
        }

        long inscriptos = inscripcionRepository.countByEventoIdAndDeletedAtIsNull(evento.getId());
        dto.setInscriptosCount(inscriptos);

        if (evento.getCupo() != null) {
            int disponibles = (int) Math.max(0, evento.getCupo() - inscriptos);
            dto.setPlazasDisponibles(disponibles);
        }

        if (usuarioId != null) {
            dto.setYaInscrito(
                    inscripcionRepository.existsByEventoIdAndUsuarioIdAndDeletedAtIsNull(evento.getId(), usuarioId));
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
