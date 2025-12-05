package com.utec.backend.controller;

import com.utec.backend.common.ApiResponse;
import com.utec.backend.dto.common.PagedResponseDto;
import com.utec.backend.dto.reserva_item_solicitado.ReservaItemSolicitadoResponseDto;
import com.utec.backend.dto.reserva_item_solicitado.ReservaItemSolicitadoUpdateDto;
import com.utec.backend.model.ReservaItemSolicitado;
import com.utec.backend.service.ReservaItemSolicitadoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.Arrays;
import java.util.List;
import java.util.Locale;
import java.util.stream.Collectors;

import static com.utec.backend.security.Constants.*;

@RestController
@RequestMapping("/api/v1/reservas/items-solicitados")
@RequiredArgsConstructor
public class ReservaItemSolicitadoController {

    private final ReservaItemSolicitadoService reservaItemSolicitadoService;

    @GetMapping
    @PreAuthorize("hasRole('" + ROLE_ADMIN + "') or hasRole('" + ROLE_MANTENIMIENTO + "')")
    public ResponseEntity<ApiResponse<PagedResponseDto<ReservaItemSolicitadoResponseDto>>> listarSolicitudes(
            @RequestParam(name = "estado", required = false) List<String> estados,
            @RequestParam(name = "espacioId", required = false) Long espacioId,
            @RequestParam(name = "fechaDesde", required = false) Instant fechaDesde,
            @RequestParam(name = "fechaHasta", required = false) Instant fechaHasta,
            @RequestParam(name = "search", required = false) String search,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        try {
            List<ReservaItemSolicitado.EstadoSolicitud> estadosFiltro = parseEstados(estados);
            PagedResponseDto<ReservaItemSolicitadoResponseDto> resultado =
                    reservaItemSolicitadoService.buscarSolicitudes(estadosFiltro, espacioId, fechaDesde, fechaHasta, search, pageable);
            return ResponseEntity.ok(ApiResponse.success(resultado, "Solicitudes obtenidas exitosamente"));
        } catch (IllegalArgumentException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, ex.getMessage(), ex);
        }
    }

    @PatchMapping("/{id}")
    @PreAuthorize("hasRole('" + ROLE_ADMIN + "') or hasRole('" + ROLE_MANTENIMIENTO + "')")
    public ResponseEntity<ApiResponse<ReservaItemSolicitadoResponseDto>> actualizarSolicitud(
            @PathVariable Long id,
            @Valid @RequestBody ReservaItemSolicitadoUpdateDto updateDto,
            Authentication authentication
    ) {
        try {
            ReservaItemSolicitadoResponseDto actualizado = reservaItemSolicitadoService.actualizarSolicitud(
                    id,
                    updateDto,
                    authentication != null ? authentication.getName() : null
            );
            return ResponseEntity.ok(ApiResponse.success(actualizado, "Solicitud actualizada correctamente"));
        } catch (IllegalArgumentException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, ex.getMessage(), ex);
        } catch (RuntimeException ex) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, ex.getMessage(), ex);
        }
    }

    private List<ReservaItemSolicitado.EstadoSolicitud> parseEstados(List<String> valores) {
        if (valores == null || valores.isEmpty()) {
            return List.of();
        }

        try {
            return valores.stream()
                    .flatMap(valor -> Arrays.stream(valor.split(",")))
                    .map(String::trim)
                    .filter(s -> !s.isEmpty())
                    .map(s -> ReservaItemSolicitado.EstadoSolicitud.valueOf(s.toUpperCase(Locale.ROOT)))
                    .collect(Collectors.toList());
        } catch (IllegalArgumentException ex) {
            throw new IllegalArgumentException("Estado de solicitud inválido. Valores permitidos: " +
                    Arrays.toString(ReservaItemSolicitado.EstadoSolicitud.values()));
        }
    }
}

