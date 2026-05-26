package com.utec.backend.controller;

import com.utec.backend.common.ApiResponse;
import com.utec.backend.dto.usuario.UsuarioResponseDto;
import com.utec.backend.service.AiService;
import com.utec.backend.service.UsuarioService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.security.Principal;
import java.util.HashMap;
import java.util.Map;

@Tag(name = "IA Generativa", description = "Proxy a ai-svc · capa de IA generativa.")
@RestController
@RequestMapping("/api/v1/ai")
@RequiredArgsConstructor
@Slf4j
public class AiController {

    private final AiService aiService;
    private final UsuarioService usuarioService;

    @Operation(summary = "Resumen automático de estadísticas")
    @PostMapping("/insights/stats-summary")
    @PreAuthorize("hasPermission(null, 'estadisticas:ver_reservas')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> statsSummary(
            @RequestBody Map<String, Object> payload) {
        return ResponseEntity.ok(ApiResponse.success(aiService.resumenStats(payload), "ok"));
    }

    @Operation(summary = "Explicación natural de una recomendación")
    @PostMapping("/insights/explain-recomendacion")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Map<String, Object>>> explainRecomendacion(
            @RequestBody Map<String, Object> payload) {
        return ResponseEntity.ok(ApiResponse.success(aiService.explainRecomendacion(payload), "ok"));
    }

    @Operation(summary = "Análisis natural del forecast Prophet")
    @PostMapping("/insights/analyze-forecast")
    @PreAuthorize("hasPermission(null, 'estadisticas:ver_reservas')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> analyzeForecast(
            @RequestBody Map<String, Object> payload) {
        return ResponseEntity.ok(ApiResponse.success(aiService.analyzeForecast(payload), "ok"));
    }

    @Operation(summary = "Búsqueda semántica de espacios (RAG)")
    @GetMapping("/search/espacios")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Map<String, Object>>> semanticSearch(
            @RequestParam("q") String q,
            @RequestParam(name = "top", defaultValue = "5") int top) {
        return ResponseEntity.ok(ApiResponse.success(aiService.semanticSearch(q, top), "ok"));
    }

    @Operation(summary = "Reindex de embeddings de espacios (admin)")
    @PostMapping("/admin/reindex-embeddings")
    @PreAuthorize("hasPermission(null, 'sistema:administrar')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> reindexEspacios() {
        return ResponseEntity.ok(ApiResponse.success(aiService.reindexEspacios(), "ok"));
    }

    @Operation(summary = "Chatbot con function calling")
    @PostMapping("/chat")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Map<String, Object>>> chat(
            @RequestBody Map<String, Object> payload,
            Principal principal) {
        // Identidad inyectada desde el JWT, nunca del body. Garantiza que el
        // agente no pueda consultar datos de otros usuarios aunque se le pida.
        UsuarioResponseDto me = usuarioService.obtenerPerfilPropio(principal.getName());
        Map<String, Object> safe = new HashMap<>(payload);
        safe.put("usuario_id", me.getId());
        safe.put("rol", me.getRolApp().name());
        return ResponseEntity.ok(ApiResponse.success(aiService.chat(safe), "ok"));
    }
}
