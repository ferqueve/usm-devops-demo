package com.utec.backend.security.auth;

import com.utec.backend.common.api.ApiResponse;
import com.utec.backend.security.config.Constants;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthenticationController {

    private final AuthenticationService authenticationService;

    @PostMapping(Constants.LOGIN_PATH)
    public ResponseEntity<ApiResponse<AuthenticationResponse>> login(@Valid @RequestBody AuthenticationRequest request) {
        AuthenticationResponse response = authenticationService.authenticate(request);
        return ResponseEntity.ok(ApiResponse.success(response, "Login exitoso"));
    }

    @PostMapping(Constants.REGISTER_PATH)
    public ResponseEntity<ApiResponse<RegisterResponse>> register(@Valid @RequestBody RegisterRequest request) {
        RegisterResponse response = authenticationService.register(request);
        return ResponseEntity.ok(ApiResponse.success(response, "Usuario registrado exitosamente"));
    }

    @PostMapping(Constants.LOGOUT_PATH)
    public ResponseEntity<ApiResponse<String>> logout(@RequestHeader(Constants.AUTHORIZATION_HEADER) String authHeader) {
        authenticationService.logout(authHeader);
        return ResponseEntity.ok(ApiResponse.success("Logout exitoso"));
    }

    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse<AuthenticationResponse>> refreshToken(@RequestHeader(Constants.REFRESH_TOKEN_HEADER) String refreshToken) {
        AuthenticationResponse response = authenticationService.refreshToken(refreshToken);
        return ResponseEntity.ok(ApiResponse.success(response, "Token refrescado exitosamente"));
    }

    @GetMapping(Constants.VERIFY_PATH)
    public ResponseEntity<ApiResponse<Boolean>> verifyToken(@RequestHeader(Constants.AUTHORIZATION_HEADER) String authHeader) {
        boolean isValid = authenticationService.verifyToken(authHeader);
        return ResponseEntity.ok(ApiResponse.success(isValid));
    }
}
