package com.utec.backend.controller;

import com.utec.backend.common.ApiResponse;
import com.utec.backend.dto.usuario.CambioRolDto;
import com.utec.backend.dto.usuario.PagedUsuarioResponseDto;
import com.utec.backend.dto.usuario.UsuarioResponseDto;
import com.utec.backend.dto.usuario.UsuarioUpdateDto;
import com.utec.backend.dto.usuario.UsuarioFilters;
import com.utec.backend.dto.usuario.UsuarioStatsDto;
import com.utec.backend.dto.usuario.UsuarioAdminUpdateDto;
import com.utec.backend.service.UsuarioService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import com.utec.backend.util.CsvExportUtil;

import java.security.Principal;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Tag(name = "Usuarios", description = "Endpoints para gestión de usuarios")
@RestController
@RequestMapping("/api/v1/usuarios")
@RequiredArgsConstructor
public class UsuarioController {

    // El servidor corre en UTC: sin zona explícita, "hoy" cambia tres horas
    // antes que en Uruguay.
    private static final ZoneId ZONA = ZoneId.of("America/Montevideo");

    private final UsuarioService usuarioService;
    private final CsvExportUtil csvExportUtil;


    @Operation(summary = "Obtener mi perfil", description = "Obtener información del usuario autenticado actual")
    @GetMapping("/me")
    public ResponseEntity<UsuarioResponseDto> obtenerPerfilPropio(Principal principal) {
        UsuarioResponseDto perfil = usuarioService.obtenerPerfilPropio(principal.getName());
        return ResponseEntity.ok(perfil);
    }

    @Operation(summary = "Actualizar mi perfil", description = "Modificar información del usuario autenticado actual")
    @PutMapping("/me")
    public ResponseEntity<UsuarioResponseDto> actualizarPerfil(@Valid @RequestBody UsuarioUpdateDto updateDto,
                                                               Principal principal) {
        UsuarioResponseDto perfilActualizado = usuarioService.actualizarPerfil(principal.getName(), updateDto);
        return ResponseEntity.ok(perfilActualizado);
    }

    @Operation(summary = "Listar usuarios", description = "Obtener lista paginada de todos los usuarios con filtros opcionales")
    @GetMapping
    @PreAuthorize("hasPermission(null, 'usuario:gestionar')")
    public ResponseEntity<PagedUsuarioResponseDto> listarTodosLosUsuarios(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String rol,
            @RequestParam(required = false) Boolean verificado,
            @RequestParam(required = false) Boolean activo,
            @RequestParam(required = false) LocalDate fechaDesde,
            @RequestParam(required = false) LocalDate fechaHasta
    ) {
        UsuarioFilters filters = new UsuarioFilters(search, rol, verificado, activo, fechaDesde, fechaHasta);
        PagedUsuarioResponseDto usuarios = usuarioService.listarUsuariosPaginados(page, size, filters);
        return ResponseEntity.ok(usuarios);
    }

    @Operation(summary = "Obtener usuario por ID", description = "Obtener información detallada de un usuario específico")
    @GetMapping("/{id}")
    @PreAuthorize("hasPermission(null, 'usuario:gestionar')")
    public ResponseEntity<UsuarioResponseDto> obtenerUsuarioPorId(@PathVariable Long id) {
        UsuarioResponseDto usuario = usuarioService.obtenerUsuarioPorId(id);
        return ResponseEntity.ok(usuario);
    }

    @Operation(summary = "Cambiar rol de usuario", description = "Modificar el rol asignado a un usuario")
    @PutMapping("/{id}/rol")
    @PreAuthorize("hasPermission(null, 'usuario:gestionar')")
    public ResponseEntity<Void> cambiarRolUsuario(@PathVariable Long id, @RequestBody CambioRolDto cambioRolDto) {
        usuarioService.cambiarRolUsuario(id, cambioRolDto);
        return ResponseEntity.noContent().build();
    }

    @Operation(summary = "Activar/desactivar usuario", description = "Cambiar el estado activo/inactivo de un usuario")
    @PutMapping("/{id}/toggle-activo")
    @PreAuthorize("hasPermission(null, 'usuario:gestionar')")
    public ResponseEntity<UsuarioResponseDto> toggleUsuarioActivo(@PathVariable Long id) {
        UsuarioResponseDto usuario = usuarioService.toggleUsuarioActivo(id);
        return ResponseEntity.ok(usuario);
    }

    @Operation(summary = "Obtener estadísticas de usuarios", description = "Obtener métricas y estadísticas de usuarios del sistema")
    @GetMapping("/stats")
    @PreAuthorize("hasPermission(null, 'usuario:gestionar')")
    public ResponseEntity<UsuarioStatsDto> obtenerEstadisticas() {
        UsuarioStatsDto stats = usuarioService.obtenerEstadisticas();
        return ResponseEntity.ok(stats);
    }

    @Operation(summary = "Exportar usuarios a CSV", description = "Exportar lista de usuarios filtrada a formato CSV")
    @GetMapping(value = "/export", produces = "text/csv")
    @PreAuthorize("hasPermission(null, 'usuario:gestionar')")
    public ResponseEntity<String> exportarUsuarios(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String rol,
            @RequestParam(required = false) Boolean verificado,
            @RequestParam(required = false) Boolean activo,
            @RequestParam(required = false) LocalDate fechaDesde,
            @RequestParam(required = false) LocalDate fechaHasta
    ) {
        UsuarioFilters filters = new UsuarioFilters(search, rol, verificado, activo, fechaDesde, fechaHasta);
        List<UsuarioResponseDto> usuarios = usuarioService.obtenerUsuariosParaExport(filters);

        String csvContent = csvExportUtil.generateUsersCsv(usuarios);
        String fileName = "usuarios_" + LocalDate.now(ZONA).format(DateTimeFormatter.ofPattern("yyyyMMdd")) + ".csv";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType("text/csv"));
        headers.setContentDispositionFormData("attachment", fileName);

        return ResponseEntity.ok()
                .headers(headers)
                .body(csvContent);
    }

    @Operation(summary = "Actualizar usuario por admin", description = "Permitir a un admin actualizar información de cualquier usuario")
    @PutMapping("/{id}")
    @PreAuthorize("hasPermission(null, 'usuario:gestionar')")
    public ResponseEntity<UsuarioResponseDto> actualizarUsuarioPorAdmin(
            @PathVariable Long id,
            @Valid @RequestBody UsuarioAdminUpdateDto updateDto
    ) {
        UsuarioResponseDto usuarioActualizado = usuarioService.actualizarUsuarioPorAdmin(id, updateDto);
        return ResponseEntity.ok(usuarioActualizado);
    }

    @Operation(summary = "Reenviar verificación por admin", description = "Permitir a un admin reenviar email de verificación a un usuario")
    @PostMapping("/{id}/resend-verification")
    @PreAuthorize("hasPermission(null, 'usuario:gestionar')")
    public ResponseEntity<Void> reenviarVerificacionPorAdmin(@PathVariable Long id) {
        boolean enviado = usuarioService.reenviarVerificacionPorAdmin(id);
        return enviado ? ResponseEntity.ok().build() : ResponseEntity.badRequest().build();
    }

    @Operation(summary = "Restablecer contraseña por admin", description = "Permitir a un admin restablecer la contraseña de un usuario y enviarle la nueva por email")
    @PostMapping("/{id}/reset-password")
    @PreAuthorize("hasPermission(null, 'usuario:gestionar')")
    public ResponseEntity<Void> restablecerPasswordPorAdmin(@PathVariable Long id) {
        boolean enviado = usuarioService.restablecerPasswordPorAdmin(id);
        return enviado ? ResponseEntity.ok().build() : ResponseEntity.badRequest().build();
    }

    @Operation(summary = "Listar analistas disponibles", description = "Obtener lista de todos los analistas activos disponibles para asignar a solicitudes")
    @GetMapping("/analistas")
    @PreAuthorize("hasPermission(null, 'usuario:ver_analistas')")
    public ResponseEntity<ApiResponse<List<UsuarioResponseDto>>> listarAnalistas() {
        try {
            List<UsuarioResponseDto> analistas = usuarioService.listarAnalistas();
            return ResponseEntity.ok(ApiResponse.success(analistas, "Analistas obtenidos exitosamente"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Error al obtener analistas: " + e.getMessage()));
        }
    }
}
