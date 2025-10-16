package com.utec.backend.controller;

import com.utec.backend.common.ApiResponse;
import com.utec.backend.dto.auth.AuthenticationRequest;
import com.utec.backend.dto.auth.AuthenticationResponse;
import com.utec.backend.dto.auth.RegisterRequest;
import com.utec.backend.dto.auth.RegisterResponse;
import com.utec.backend.dto.auth.ResendVerificationRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.Map;

@Tag(name = "Autenticación", description = "Endpoints para autenticación de usuarios")
@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final com.utec.backend.service.AuthService authenticationService;

    @Operation(summary = "Iniciar sesión", description = "Autenticar usuario con email y contraseña")
    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthenticationResponse>> login(@Valid @RequestBody AuthenticationRequest request) {
        AuthenticationResponse response = authenticationService.authenticate(request);
        return ResponseEntity.ok(ApiResponse.success(response, "Login exitoso"));
    }

    @Operation(summary = "Registrar usuario", description = "Crear una nueva cuenta de usuario")
    @PostMapping("/register")
    public ResponseEntity<ApiResponse<RegisterResponse>> register(@Valid @RequestBody RegisterRequest request) {
        RegisterResponse response = authenticationService.register(request);
        return ResponseEntity.ok(ApiResponse.success(response, "Usuario registrado exitosamente"));
    }

    @Operation(summary = "Cerrar sesión", description = "Cerrar la sesión del usuario actual")
    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<String>> logout(@RequestHeader("Authorization") String authHeader) {
        authenticationService.logout(authHeader);
        return ResponseEntity.ok(ApiResponse.success("Logout exitoso"));
    }

    @Operation(summary = "Refrescar token", description = "Obtener un nuevo token de acceso usando el refresh token")
    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse<AuthenticationResponse>> refreshToken(@RequestHeader("Refresh-Token") String refreshToken) {
        AuthenticationResponse response = authenticationService.refreshToken(refreshToken);
        return ResponseEntity.ok(ApiResponse.success(response, "Token refrescado exitosamente"));
    }

    @Operation(summary = "Verificar token", description = "Validar si el token de acceso es válido")
    @GetMapping("/verify")
    public ResponseEntity<ApiResponse<Boolean>> verifyToken(@RequestHeader("Authorization") String authHeader) {
        boolean isValid = authenticationService.verifyToken(authHeader);
        return ResponseEntity.ok(ApiResponse.success(isValid));
    }

    @Operation(summary = "Verificar email", description = "Confirmar la dirección de correo electrónico con el código recibido")
    @PostMapping("/verify-email")
    public ResponseEntity<ApiResponse<String>> verifyEmail(@RequestBody Map<String, String> request) {
        String token = request.get("token");
        if (token == null || token.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Código de verificación requerido"));
        }
        
        boolean verified = authenticationService.verifyEmail(token);
        if (verified) {
            return ResponseEntity.ok(ApiResponse.success("¡Email verificado exitosamente! Ya puedes iniciar sesión"));
        } else {
            return ResponseEntity.badRequest().body(ApiResponse.error("El código de verificación ha expirado o es inválido. Solicita uno nuevo."));
        }
    }

    @Operation(summary = "Reenviar código de verificación", description = "Enviar un nuevo código de verificación al email del usuario")
    @PostMapping("/resend-verification")
    public ResponseEntity<ApiResponse<String>> resendVerificationEmail(@RequestBody ResendVerificationRequest request) {
        boolean sent = authenticationService.resendVerificationEmail(request.getEmail());
        if (sent) {
            return ResponseEntity.ok(ApiResponse.success("Se ha enviado un nuevo código de verificación a tu email"));
        } else {
            return ResponseEntity.badRequest().body(ApiResponse.error("No se pudo enviar el código de verificación. Inténtalo nuevamente."));
        }
    }
}
