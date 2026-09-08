package com.utec.backend.exception;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Una ruta que no existe tiene que dar 404.
 *
 * Daba 500: caía en el catch-all de Exception, así que cualquier bot probando
 * rutas al azar inflaba el contador de errores 5xx de la pantalla de Sistema.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@DisplayName("Rutas inexistentes")
class RutasInexistentesTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    @DisplayName("una ruta inventada bajo un controlador que existe da 404")
    @WithMockUser(username = "admin@utec.edu.uy", roles = {"ADMIN"})
    void subrutaInventada() throws Exception {
        mockMvc.perform(get("/api/v1/recomendaciones/no-existe")).andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("una ruta que no cuelga de ningún controlador da 404")
    @WithMockUser(username = "admin@utec.edu.uy", roles = {"ADMIN"})
    void rutaInventada() throws Exception {
        mockMvc.perform(get("/api/v1/ruta-inventada")).andExpect(status().isNotFound());
    }
}
