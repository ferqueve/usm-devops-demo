package com.utec.backend.config;

import com.utec.backend.service.CarreraService;
import com.utec.backend.service.RecomendacionService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Cada rol tiene que poder abrir las pantallas que su menu le ofrece.
 *
 * Las recomendaciones de inventario pedian tres permisos distintos entre si, y
 * ninguno de los dos roles con pantalla de inventario los tenia todos: al
 * ANALISTA le fallaban dos de las tres y a MANTENIMIENTO la otra.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@DisplayName("Acceso por rol a las pantallas del menu")
class AccesoPorRolTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private RecomendacionService recomendacionService;

    @MockitoBean
    private CarreraService carreraService;

    private static final String MANTENIMIENTO = "/api/v1/recomendaciones/inventario/mantenimiento";
    private static final String ATENCION = "/api/v1/recomendaciones/inventario/espacios-atencion";
    private static final String REASIGNACIONES = "/api/v1/recomendaciones/inventario/reasignaciones";

    private void sinRecomendaciones() {
        when(recomendacionService.obtenerItemsMantenimientoUrgente()).thenReturn(List.of());
        when(recomendacionService.obtenerEspaciosAtencion()).thenReturn(List.of());
        when(recomendacionService.obtenerReasignacionesRecomendadas()).thenReturn(List.of());
    }

    @Test
    @DisplayName("el ANALISTA abre las tres listas de recomendaciones de inventario")
    @WithMockUser(username = "analista@utec.edu.uy", roles = {"ANALISTA"})
    void analistaVeRecomendaciones() throws Exception {
        sinRecomendaciones();

        mockMvc.perform(get(MANTENIMIENTO)).andExpect(status().isOk());
        mockMvc.perform(get(ATENCION)).andExpect(status().isOk());
        mockMvc.perform(get(REASIGNACIONES)).andExpect(status().isOk());
    }

    @Test
    @DisplayName("MANTENIMIENTO tambien, y ademas lee las carreras que filtran el calendario")
    @WithMockUser(username = "mantenimiento@utec.edu.uy", roles = {"MANTENIMIENTO"})
    void mantenimientoVeRecomendacionesYCarreras() throws Exception {
        sinRecomendaciones();
        when(carreraService.getAllCarreras()).thenReturn(List.of());

        mockMvc.perform(get(MANTENIMIENTO)).andExpect(status().isOk());
        mockMvc.perform(get(ATENCION)).andExpect(status().isOk());
        mockMvc.perform(get(REASIGNACIONES)).andExpect(status().isOk());
        mockMvc.perform(get("/api/v1/carreras")).andExpect(status().isOk());
    }

    @Test
    @DisplayName("un DOCENTE no ve el inventario, tampoco sus recomendaciones")
    @WithMockUser(username = "docente@utec.edu.uy", roles = {"DOCENTE"})
    void docenteNoVeRecomendacionesDeInventario() throws Exception {
        mockMvc.perform(get(MANTENIMIENTO)).andExpect(status().isForbidden());
        mockMvc.perform(get(REASIGNACIONES)).andExpect(status().isForbidden());
    }
}
