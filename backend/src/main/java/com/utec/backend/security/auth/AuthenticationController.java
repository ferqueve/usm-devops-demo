package com.utec.backend.security.auth;

import com.utec.backend.common.api.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthenticationController {

    private final AuthenticationService authenticationService;

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthenticationResponse>> login(@Valid @RequestBody AuthenticationRequest request) {
        AuthenticationResponse response = authenticationService.authenticate(request);
        return ResponseEntity.ok(ApiResponse.success(response, "Login exitoso"));
    }

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<RegisterResponse>> register(@Valid @RequestBody RegisterRequest request) {
        RegisterResponse response = authenticationService.register(request);
        return ResponseEntity.ok(ApiResponse.success(response, "Usuario registrado exitosamente"));
    }

    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<String>> logout(@RequestHeader("Authorization") String authHeader) {
        authenticationService.logout(authHeader);
        return ResponseEntity.ok(ApiResponse.success("Logout exitoso"));
    }

    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse<AuthenticationResponse>> refreshToken(@RequestHeader("Refresh-Token") String refreshToken) {
        AuthenticationResponse response = authenticationService.refreshToken(refreshToken);
        return ResponseEntity.ok(ApiResponse.success(response, "Token refrescado exitosamente"));
    }

    @GetMapping("/verify")
    public ResponseEntity<ApiResponse<Boolean>> verifyToken(@RequestHeader("Authorization") String authHeader) {
        boolean isValid = authenticationService.verifyToken(authHeader);
        return ResponseEntity.ok(ApiResponse.success(isValid));
    }

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
