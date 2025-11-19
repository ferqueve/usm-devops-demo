package com.utec.backend.controller;

import com.utec.backend.dto.usuario.CambioRolDto;
import com.utec.backend.dto.usuario.PagedUsuarioResponseDto;
import com.utec.backend.dto.usuario.UsuarioResponseDto;
import com.utec.backend.dto.usuario.UsuarioUpdateDto;
import com.utec.backend.dto.usuario.UsuarioStatsDto;
import com.utec.backend.dto.usuario.UsuarioAdminUpdateDto;
import com.utec.backend.service.UsuarioService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import com.utec.backend.util.CsvExportUtil;

import java.security.Principal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;

import static com.utec.backend.security.Constants.*;

@Tag(name = "Usuarios", description = "Endpoints para gestión de usuarios")
@RestController
@RequestMapping("/api/v1/usuarios")
@RequiredArgsConstructor
public class UsuarioController {

    private final UsuarioService usuarioService;


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
    @PreAuthorize("hasRole('" + ROLE_ADMIN + "')")
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
        PagedUsuarioResponseDto usuarios = usuarioService.listarUsuariosPaginados(
                page, size, search, rol, verificado, activo, fechaDesde, fechaHasta
        );
        return ResponseEntity.ok(usuarios);
    }

    @Operation(summary = "Obtener usuario por ID", description = "Obtener información detallada de un usuario específico")
    @GetMapping("/{id}")
    @PreAuthorize("hasRole('" + ROLE_ADMIN + "')")
    public ResponseEntity<UsuarioResponseDto> obtenerUsuarioPorId(@PathVariable Long id) {
        UsuarioResponseDto usuario = usuarioService.obtenerUsuarioPorId(id);
        return ResponseEntity.ok(usuario);
    }

    @Operation(summary = "Cambiar rol de usuario", description = "Modificar el rol asignado a un usuario")
    @PutMapping("/{id}/rol")
    @PreAuthorize("hasRole('" + ROLE_ADMIN + "')")
    public ResponseEntity<Void> cambiarRolUsuario(@PathVariable Long id, @RequestBody CambioRolDto cambioRolDto) {
        usuarioService.cambiarRolUsuario(id, cambioRolDto);
        return ResponseEntity.noContent().build();
    }

    @Operation(summary = "Activar/desactivar usuario", description = "Cambiar el estado activo/inactivo de un usuario")
    @PutMapping("/{id}/toggle-activo")
    @PreAuthorize("hasRole('" + ROLE_ADMIN + "')")
    public ResponseEntity<UsuarioResponseDto> toggleUsuarioActivo(@PathVariable Long id) {
        UsuarioResponseDto usuario = usuarioService.toggleUsuarioActivo(id);
        return ResponseEntity.ok(usuario);
    }

    @Operation(summary = "Obtener estadísticas de usuarios", description = "Obtener métricas y estadísticas de usuarios del sistema")
    @GetMapping("/stats")
    @PreAuthorize("hasRole('" + ROLE_ADMIN + "')")
    public ResponseEntity<UsuarioStatsDto> obtenerEstadisticas() {
        UsuarioStatsDto stats = usuarioService.obtenerEstadisticas();
        return ResponseEntity.ok(stats);
    }

    @Operation(summary = "Exportar usuarios a CSV", description = "Exportar lista de usuarios filtrada a formato CSV")
    @GetMapping(value = "/export", produces = "text/csv")
    @PreAuthorize("hasRole('" + ROLE_ADMIN + "')")
    public ResponseEntity<String> exportarUsuarios(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String rol,
            @RequestParam(required = false) Boolean verificado,
            @RequestParam(required = false) Boolean activo,
            @RequestParam(required = false) LocalDate fechaDesde,
            @RequestParam(required = false) LocalDate fechaHasta
    ) {
        List<UsuarioResponseDto> usuarios = usuarioService.obtenerUsuariosParaExport(
                search, rol, verificado, activo, fechaDesde, fechaHasta
        );
        
        String csvContent = CsvExportUtil.generateUsersCsv(usuarios);
        String fileName = "usuarios_" + LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd")) + ".csv";
        
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType("text/csv"));
        headers.setContentDispositionFormData("attachment", fileName);
        
        return ResponseEntity.ok()
                .headers(headers)
                .body(csvContent);
    }

    @Operation(summary = "Actualizar usuario por admin", description = "Permitir a un admin actualizar información de cualquier usuario")
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('" + ROLE_ADMIN + "')")
    public ResponseEntity<UsuarioResponseDto> actualizarUsuarioPorAdmin(
            @PathVariable Long id, 
            @Valid @RequestBody UsuarioAdminUpdateDto updateDto
    ) {
        UsuarioResponseDto usuarioActualizado = usuarioService.actualizarUsuarioPorAdmin(id, updateDto);
        return ResponseEntity.ok(usuarioActualizado);
    }

    @Operation(summary = "Reenviar verificación por admin", description = "Permitir a un admin reenviar email de verificación a un usuario")
    @PostMapping("/{id}/resend-verification")
    @PreAuthorize("hasRole('" + ROLE_ADMIN + "')")
    public ResponseEntity<Void> reenviarVerificacionPorAdmin(@PathVariable Long id) {
        boolean enviado = usuarioService.reenviarVerificacionPorAdmin(id);
        return enviado ? ResponseEntity.ok().build() : ResponseEntity.badRequest().build();
    }

    @Operation(summary = "Restablecer contraseña por admin", description = "Permitir a un admin restablecer la contraseña de un usuario y enviarle la nueva por email")
    @PostMapping("/{id}/reset-password")
    @PreAuthorize("hasRole('" + ROLE_ADMIN + "')")
    public ResponseEntity<Void> restablecerPasswordPorAdmin(@PathVariable Long id) {
        boolean enviado = usuarioService.restablecerPasswordPorAdmin(id);
        return enviado ? ResponseEntity.ok().build() : ResponseEntity.badRequest().build();
    }
}
