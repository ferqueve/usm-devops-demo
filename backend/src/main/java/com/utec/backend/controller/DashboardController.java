package com.utec.backend.controller;

import com.utec.backend.common.ApiResponse;
import com.utec.backend.dto.dashboard.DashboardDto;
import com.utec.backend.security.RolAutenticado;
import com.utec.backend.service.DashboardService;
import io.swagger.v3.oas.annotations.Operation;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * La pantalla de inicio, en un solo endpoint.
 *
 * No recibe el rol por parametro: lo toma de la autenticacion. Un usuario no
 * puede pedir el dashboard de otro rol para ver datos que no le tocan.
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;

    @Operation(summary = "Datos del dashboard",
            description = "Devuelve contadores y listas de la pantalla de inicio segun el rol del usuario autenticado")
    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<DashboardDto>> obtener(Authentication authentication) {
        String email = authentication.getName();
        String rol = RolAutenticado.de(authentication);

        DashboardDto datos = dashboardService.cargar(email, rol);
        return ResponseEntity.ok(ApiResponse.success(datos, "Dashboard obtenido exitosamente"));
    }
}
