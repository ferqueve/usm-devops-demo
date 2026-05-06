package com.utec.backend.service;

import com.utec.backend.dto.common.PagedResponseDto;
import com.utec.backend.dto.reserva_item_solicitado.ReservaItemSolicitadoCreateDto;
import com.utec.backend.dto.reserva_item_solicitado.ReservaItemSolicitadoResponseDto;
import com.utec.backend.dto.reserva_item_solicitado.ReservaItemSolicitadoUpdateDto;
import com.utec.backend.model.InventarioItem;
import com.utec.backend.model.Reserva;
import com.utec.backend.model.ReservaItemSolicitado;
import com.utec.backend.model.TipoElemento;
import com.utec.backend.model.Espacio;
import com.utec.backend.model.Usuario;
import com.utec.backend.repository.InventarioItemRepository;
import com.utec.backend.repository.ReservaItemSolicitadoRepository;
import com.utec.backend.repository.ReservaRepository;
import com.utec.backend.repository.TipoElementoRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class ReservaItemSolicitadoService {

    private static final String FIELD_RESERVA = "reserva";

    private final ReservaItemSolicitadoRepository reservaItemSolicitadoRepository;
    private final ReservaRepository reservaRepository;
    private final TipoElementoRepository tipoElementoRepository;
    private final InventarioItemRepository inventarioItemRepository;
    private final EmailService emailService;
    
    /**
     * Crear múltiples solicitudes de items para una reserva
     */
    public List<ReservaItemSolicitadoResponseDto> crearSolicitudes(Long reservaId, List<ReservaItemSolicitadoCreateDto> createDtos) {
        // Validar que la reserva existe
        Reserva reserva = reservaRepository.findById(reservaId)
                .orElseThrow(() -> new IllegalArgumentException("Reserva no encontrada con ID: " + reservaId));
        
        List<ReservaItemSolicitado> itemsSolicitados = createDtos.stream()
                .map(dto -> crearItemSolicitado(reserva, dto))
                .toList();
        
        List<ReservaItemSolicitado> savedItems = reservaItemSolicitadoRepository.saveAll(itemsSolicitados);
        log.info("Se crearon {} items solicitados para la reserva {}", savedItems.size(), reservaId);
        
        return savedItems.stream()
                .map(this::mapToResponseDto)
                .toList();
    }
    
    /**
     * Crear una solicitud individual
     */
    private ReservaItemSolicitado crearItemSolicitado(Reserva reserva, ReservaItemSolicitadoCreateDto dto) {
        // Validar que el tipo de elemento existe y está activo
        TipoElemento tipoElemento = tipoElementoRepository.findById(dto.getTipoElementoId())
                .orElseThrow(() -> new IllegalArgumentException("Tipo de elemento no encontrado con ID: " + dto.getTipoElementoId()));

        if (!Boolean.TRUE.equals(tipoElemento.getActivo())) {
            throw new IllegalStateException("El tipo de elemento con ID " + dto.getTipoElementoId() + " no está activo");
        }

        InventarioItem inventarioItem = null;
        if (dto.getInventarioItemId() != null) {
            // Validar que el inventario item existe y está disponible
            inventarioItem = inventarioItemRepository.findById(dto.getInventarioItemId())
                    .orElseThrow(() -> new IllegalArgumentException("Item de inventario no encontrado con ID: " + dto.getInventarioItemId()));

            if (!Boolean.TRUE.equals(inventarioItem.getActivo())) {
                throw new IllegalStateException("El item de inventario con ID " + dto.getInventarioItemId() + " no está activo");
            }

            if (!"DISPONIBLE".equals(inventarioItem.getEstado())) {
                throw new IllegalStateException("El item de inventario con ID " + dto.getInventarioItemId() + " no está disponible (estado: " + inventarioItem.getEstado() + ")");
            }

            // Validar que el inventario item pertenece al tipo de elemento especificado
            if (!inventarioItem.getTipoElemento().getId().equals(tipoElemento.getId())) {
                throw new IllegalArgumentException("El item de inventario especificado no pertenece al tipo de elemento seleccionado");
            }
        }
        
        ReservaItemSolicitado itemSolicitado = new ReservaItemSolicitado();
        itemSolicitado.setReserva(reserva);
        itemSolicitado.setTipoElemento(tipoElemento);
        itemSolicitado.setInventarioItem(inventarioItem);
        itemSolicitado.setCantidadSolicitada(dto.getCantidadSolicitada());
        itemSolicitado.setObservaciones(dto.getObservaciones());
        itemSolicitado.setEstado(ReservaItemSolicitado.EstadoSolicitud.PENDIENTE);
        
        return itemSolicitado;
    }
    
    /**
     * Obtener todos los items solicitados de una reserva
     */
    @Transactional(readOnly = true)
    public List<ReservaItemSolicitadoResponseDto> obtenerPorReserva(Long reservaId) {
        List<ReservaItemSolicitado> items = reservaItemSolicitadoRepository.findByReservaIdWithRelations(reservaId);
        return items.stream()
                .map(this::mapToResponseDto)
                .toList();
    }
    
    /**
     * Obtener items solicitados por estado
     */
    @Transactional(readOnly = true)
    public List<ReservaItemSolicitadoResponseDto> obtenerPorEstado(ReservaItemSolicitado.EstadoSolicitud estado) {
        List<ReservaItemSolicitado> items = reservaItemSolicitadoRepository.findByEstado(estado);
        return items.stream()
                .map(this::mapToResponseDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public PagedResponseDto<ReservaItemSolicitadoResponseDto> buscarSolicitudes(
            List<ReservaItemSolicitado.EstadoSolicitud> estados,
            Long espacioId,
            Instant fechaDesde,
            Instant fechaHasta,
            String search,
            Pageable pageable
    ) {
        Specification<ReservaItemSolicitado> spec = (root, query, cb) -> {
            query.distinct(true);
            return cb.isNull(root.get("deletedAt"));
        };

        // SOLO mostrar solicitudes de reservas APROBADAS
        // Las solicitudes de reservas pendientes o canceladas no deben aparecer
        Specification<ReservaItemSolicitado> reservaAprobadaSpec = (root, query, cb) -> {
            Join<ReservaItemSolicitado, Reserva> reservaJoin = root.join(FIELD_RESERVA, JoinType.INNER);
            return cb.equal(reservaJoin.get("estado"), Reserva.EstadoReserva.APROBADO);
        };
        spec = spec.and(reservaAprobadaSpec);

        if (estados != null && !estados.isEmpty()) {
            Specification<ReservaItemSolicitado> estadoSpec = (root, query, cb) -> root.get("estado").in(estados);
            spec = spec.and(estadoSpec);
        }

        if (espacioId != null) {
            Specification<ReservaItemSolicitado> espacioSpec = (root, query, cb) -> {
                Join<ReservaItemSolicitado, Reserva> reservaJoin = root.join(FIELD_RESERVA, JoinType.INNER);
                Join<Reserva, Espacio> espacioJoin = reservaJoin.join("espacio", JoinType.INNER);
                return cb.equal(espacioJoin.get("id"), espacioId);
            };
            spec = spec.and(espacioSpec);
        }

        if (fechaDesde != null) {
            Specification<ReservaItemSolicitado> desdeSpec = (root, query, cb) -> {
                Join<ReservaItemSolicitado, Reserva> reservaJoin = root.join(FIELD_RESERVA, JoinType.INNER);
                return cb.greaterThanOrEqualTo(reservaJoin.get("inicio"), fechaDesde);
            };
            spec = spec.and(desdeSpec);
        }

        if (fechaHasta != null) {
            Specification<ReservaItemSolicitado> hastaSpec = (root, query, cb) -> {
                Join<ReservaItemSolicitado, Reserva> reservaJoin = root.join(FIELD_RESERVA, JoinType.INNER);
                return cb.lessThanOrEqualTo(reservaJoin.get("inicio"), fechaHasta);
            };
            spec = spec.and(hastaSpec);
        }

        if (search != null && !search.trim().isEmpty()) {
            String trimmed = search.trim();
            String term = "%" + trimmed.toLowerCase(Locale.ROOT) + "%";
            Long numero = parseLong(trimmed);

            Specification<ReservaItemSolicitado> searchSpec = (root, query, cb) -> {
                Join<ReservaItemSolicitado, Reserva> reservaJoin = root.join(FIELD_RESERVA, JoinType.LEFT);
                Join<Reserva, Usuario> usuarioJoin = reservaJoin.join("usuario", JoinType.LEFT);
                Join<ReservaItemSolicitado, TipoElemento> tipoJoin = root.join("tipoElemento", JoinType.LEFT);

                List<Predicate> predicates = new ArrayList<>();
                predicates.add(cb.like(cb.lower(usuarioJoin.get("nombre")), term));
                predicates.add(cb.like(cb.lower(usuarioJoin.get("email")), term));
                predicates.add(cb.like(cb.lower(tipoJoin.get("nombre")), term));

                if (numero != null) {
                    predicates.add(cb.equal(root.get("id"), numero));
                    predicates.add(cb.equal(reservaJoin.get("id"), numero));
                }

                return cb.or(predicates.toArray(new Predicate[0]));
            };
            spec = spec.and(searchSpec);
        }

        Page<ReservaItemSolicitado> page = reservaItemSolicitadoRepository.findAll(spec, pageable);

        List<ReservaItemSolicitadoResponseDto> content = page.getContent()
                .stream()
                .map(this::mapToResponseDto)
                .toList();

        return new PagedResponseDto<>(
                content,
                page.getNumber(),
                page.getSize(),
                page.getTotalElements(),
                page.getTotalPages(),
                page.isFirst(),
                page.isLast(),
                page.hasNext(),
                page.hasPrevious(),
                page.getNumberOfElements()
        );
    }

    public ReservaItemSolicitadoResponseDto actualizarSolicitud(
            Long id,
            ReservaItemSolicitadoUpdateDto updateDto,
            String actualizadoPor
    ) {
        if (updateDto == null) {
            throw new IllegalArgumentException("Los datos de actualización son requeridos");
        }

        ReservaItemSolicitado item = reservaItemSolicitadoRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Solicitud de inventario no encontrada con ID: " + id));

        if (item.getDeletedAt() != null) {
            throw new IllegalStateException("La solicitud de inventario fue eliminada y no puede modificarse");
        }

        ReservaItemSolicitado.EstadoSolicitud estadoAnterior = item.getEstado();
        boolean cambios = aplicarCambioEstado(item, updateDto)
                | aplicarCambioInventario(item, updateDto)
                | aplicarCambioObservaciones(item, updateDto);

        validarEntregadoTieneInventario(item);

        if (!cambios) {
            return mapToResponseDto(item);
        }

        ReservaItemSolicitado guardado = reservaItemSolicitadoRepository.save(item);
        log.info("Solicitud de inventario {} actualizada por {}", guardado.getId(),
                actualizadoPor != null ? actualizadoPor : "sistema");

        ReservaItemSolicitadoResponseDto dto = mapToResponseDto(guardado);
        notificarCambioEstadoSolicitud(dto, updateDto, estadoAnterior);
        return dto;
    }

    private boolean aplicarCambioEstado(ReservaItemSolicitado item, ReservaItemSolicitadoUpdateDto updateDto) {
        if (updateDto.getEstado() == null || updateDto.getEstado() == item.getEstado()) {
            return false;
        }
        validarTransicionEstado(item.getEstado(), updateDto.getEstado());
        item.setEstado(updateDto.getEstado());
        return true;
    }

    private boolean aplicarCambioInventario(ReservaItemSolicitado item, ReservaItemSolicitadoUpdateDto updateDto) {
        Long nuevoInventarioId = updateDto.getInventarioItemId();
        if (nuevoInventarioId == null) {
            return false;
        }
        if (nuevoInventarioId <= 0) {
            return desasignarInventario(item);
        }
        return asignarNuevoInventario(item, nuevoInventarioId);
    }

    private boolean desasignarInventario(ReservaItemSolicitado item) {
        if (item.getInventarioItem() == null) {
            return false;
        }
        item.setInventarioItem(null);
        return true;
    }

    private boolean asignarNuevoInventario(ReservaItemSolicitado item, Long nuevoInventarioId) {
        InventarioItem inventarioItem = inventarioItemRepository.findById(nuevoInventarioId)
                .orElseThrow(() -> new IllegalArgumentException(
                        "Item de inventario no encontrado con ID: " + nuevoInventarioId));
        validarInventarioAsignable(inventarioItem, item);
        boolean igual = item.getInventarioItem() != null
                && Objects.equals(item.getInventarioItem().getId(), inventarioItem.getId());
        if (igual) {
            return false;
        }
        item.setInventarioItem(inventarioItem);
        return true;
    }

    private void validarInventarioAsignable(InventarioItem inventarioItem, ReservaItemSolicitado item) {
        if (!Boolean.TRUE.equals(inventarioItem.getActivo())) {
            throw new IllegalArgumentException("El item de inventario seleccionado no está activo");
        }
        if (!"DISPONIBLE".equalsIgnoreCase(inventarioItem.getEstado())) {
            throw new IllegalArgumentException(
                    "El item de inventario seleccionado no está disponible (estado actual: "
                            + inventarioItem.getEstado() + ")");
        }
        if (!inventarioItem.getTipoElemento().getId().equals(item.getTipoElemento().getId())) {
            throw new IllegalArgumentException("El item de inventario seleccionado no corresponde al tipo solicitado");
        }
    }

    private boolean aplicarCambioObservaciones(ReservaItemSolicitado item, ReservaItemSolicitadoUpdateDto updateDto) {
        if (updateDto.getObservaciones() == null) {
            return false;
        }
        String nuevasObs = updateDto.getObservaciones().trim();
        if (nuevasObs.isEmpty()) {
            nuevasObs = null;
        }
        if (Objects.equals(nuevasObs, item.getObservaciones())) {
            return false;
        }
        item.setObservaciones(nuevasObs);
        return true;
    }

    private void validarEntregadoTieneInventario(ReservaItemSolicitado item) {
        if (item.getEstado() == ReservaItemSolicitado.EstadoSolicitud.ENTREGADO
                && item.getInventarioItem() == null) {
            throw new IllegalArgumentException(
                    "Para marcar como ENTREGADO es necesario asociar un item de inventario disponible");
        }
    }

    private void notificarCambioEstadoSolicitud(ReservaItemSolicitadoResponseDto dto,
                                                ReservaItemSolicitadoUpdateDto updateDto,
                                                ReservaItemSolicitado.EstadoSolicitud estadoAnterior) {
        if (updateDto.getEstado() == null || updateDto.getEstado() == estadoAnterior
                || dto.getSolicitanteEmail() == null) {
            return;
        }
        try {
            boolean emailEnviado = emailService.enviarEmailNotificacionEstadoSolicitudInventario(
                    dto.getSolicitanteEmail(),
                    dto,
                    estadoAnterior != null ? estadoAnterior.toString() : "N/A",
                    updateDto.getEstado().toString()
            );
            if (emailEnviado) {
                log.info("Email de notificación de cambio de estado de solicitud de inventario enviado al usuario: {}",
                        dto.getSolicitanteEmail());
            } else {
                log.warn("No se pudo enviar email de notificación al usuario: {}", dto.getSolicitanteEmail());
            }
        } catch (Exception e) {
            log.error("Error al enviar email de notificación de cambio de estado de solicitud de inventario: {}",
                    e.getMessage());
        }
    }

    private void validarTransicionEstado(ReservaItemSolicitado.EstadoSolicitud actual,
                                         ReservaItemSolicitado.EstadoSolicitud nuevo) {
        if (actual == nuevo) {
            return;
        }

        validarSiguienteEstado(actual, nuevo);
    }

    private void validarSiguienteEstado(ReservaItemSolicitado.EstadoSolicitud actual,
                                        ReservaItemSolicitado.EstadoSolicitud nuevo) {
        Set<ReservaItemSolicitado.EstadoSolicitud> permitidos = switch (actual) {
            case PENDIENTE -> Set.of(
                    ReservaItemSolicitado.EstadoSolicitud.APROBADO,
                    ReservaItemSolicitado.EstadoSolicitud.RECHAZADO);
            case APROBADO -> Set.of(
                    ReservaItemSolicitado.EstadoSolicitud.ENTREGADO,
                    ReservaItemSolicitado.EstadoSolicitud.RECHAZADO);
            case RECHAZADO, ENTREGADO -> Set.of();
        };
        if (permitidos.isEmpty()) {
            throw new IllegalArgumentException("No es posible cambiar el estado una vez marcado como " + actual);
        }
        if (!permitidos.contains(nuevo)) {
            throw new IllegalArgumentException("Transición inválida desde " + actual + " hacia " + nuevo);
        }
    }

    private Long parseLong(String value) {
        try {
            return Long.parseLong(value);
        } catch (NumberFormatException ex) {
            return null;
        }
    }
    
    /**
     * Mapear entidad a DTO de respuesta
     */
    private ReservaItemSolicitadoResponseDto mapToResponseDto(ReservaItemSolicitado item) {
        ReservaItemSolicitadoResponseDto dto = new ReservaItemSolicitadoResponseDto();
        dto.setId(item.getId());
        dto.setReservaId(item.getReserva().getId());

        Reserva reserva = item.getReserva();
        Espacio espacio = reserva != null ? reserva.getEspacio() : null;
        Usuario usuario = reserva != null ? reserva.getUsuario() : null;

        dto.setEspacioId(espacio != null ? espacio.getId() : null);
        dto.setEspacioNombre(espacio != null ? espacio.getNombre() : null);

        dto.setUsuarioId(usuario != null ? usuario.getId() : null);
        dto.setSolicitanteNombre(usuario != null ? usuario.getNombre() : null);
        dto.setSolicitanteEmail(usuario != null ? usuario.getEmail() : null);
        dto.setTipoElementoId(item.getTipoElemento().getId());
        dto.setTipoElementoNombre(item.getTipoElemento().getNombre());
        dto.setInventarioItemId(item.getInventarioItem() != null ? item.getInventarioItem().getId() : null);
        dto.setCantidadSolicitada(item.getCantidadSolicitada());
        dto.setEstado(item.getEstado());
        dto.setObservaciones(item.getObservaciones());
        dto.setReservaInicio(reserva != null ? reserva.getInicio() : null);
        dto.setReservaFin(reserva != null ? reserva.getFin() : null);
        dto.setCreatedAt(item.getCreatedAt());
        dto.setUpdatedAt(item.getUpdatedAt());
        return dto;
    }
}

