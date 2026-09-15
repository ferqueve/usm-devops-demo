package com.utec.backend.service;

import com.utec.backend.dto.stats.EstadoInventarioDto;
import com.utec.backend.repository.EstadoInventarioRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.sql.Timestamp;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class EstadoInventarioServiceTest {

    private static final Instant AHORA = Instant.parse("2026-09-14T15:00:00Z");

    @Mock private EstadoInventarioRepository repository;

    private EstadoInventarioService service;

    // Espacios: 1 Aula A (edificio 10), 2 Aula B (edificio 10), 3 Lab (edificio 20). Tipos: 100 Silla, 200 Proyector, 300 Pizarra.
    @BeforeEach
    void setUp() {
        service = new EstadoInventarioService(repository, Clock.fixed(AHORA, ZoneOffset.UTC));
        when(repository.espaciosActivos()).thenReturn(List.of(
                new Object[]{1L, "Aula A", 10L, "Edificio 1"},
                new Object[]{2L, "Aula B", 10L, "Edificio 1"},
                new Object[]{3L, "Lab", 20L, "Edificio 2"}));
        when(repository.tiposActivos()).thenReturn(List.of(
                new Object[]{100L, "Silla"},
                new Object[]{200L, "Proyector"},
                new Object[]{300L, "Pizarra"}));
        when(repository.itemsActivos()).thenReturn(List.of(
                item(1, 100, 1L, 10L, "DISPONIBLE", 20, 10, 5),
                item(2, 200, 1L, 10L, "MANTENIMIENTO", 1, 400, 200),
                item(3, 100, 3L, 20L, "DANADO", 5, 60, 30),
                // Sin espacio, o asignado a un espacio dado de baja (la consulta lo devuelve con espacio null).
                item(4, 200, null, null, "DANADO", 1, 100, 90)));
    }

    private static Object[] item(long id, long tipoId, Long espacioId, Long edificioId, String estado, int cantidad,
                                 long diasDesdeAlta, long diasSinCambios) {
        String tipo = tipoId == 100 ? "Silla" : tipoId == 200 ? "Proyector" : "Pizarra";
        String espacio = espacioId == null ? null : espacioId == 1 ? "Aula A" : espacioId == 2 ? "Aula B" : "Lab";
        return new Object[]{id, tipoId, tipo, espacioId, espacio, edificioId, estado, cantidad,
                Timestamp.from(AHORA.minus(diasDesdeAlta, ChronoUnit.DAYS)),
                Timestamp.from(AHORA.minus(diasSinCambios, ChronoUnit.DAYS)), null};
    }

    @Test
    @DisplayName("Sin filtros: totales, cobertura sobre espacios activos y tipos sin items incluidos")
    void sinFiltros() {
        EstadoInventarioDto r = service.estado(null, null, null);

        assertThat(r.totales()).isEqualTo(new EstadoInventarioDto.Totales(4, 27, 1, 1, 2, 1));
        assertThat(r.cobertura()).isEqualTo(new EstadoInventarioDto.Cobertura(3, 2));
        assertThat(r.porTipo()).extracting(EstadoInventarioDto.Grupo::nombre).containsExactly("Proyector", "Silla", "Pizarra");
        assertThat(r.porTipo().get(2).items()).isZero();
        assertThat(r.porEspacio()).extracting(EstadoInventarioDto.Grupo::nombre).containsExactly("Aula A", "Lab", "Aula B");
        assertThat(r.porEspacio().get(0).detalle()).isEqualTo("Edificio 1");
    }

    @Test
    @DisplayName("Los filtros se combinan: espacio y tipo juntos no se pisan")
    void filtrosCombinados() {
        EstadoInventarioDto r = service.estado(1L, 200L, null);

        assertThat(r.totales().items()).isEqualTo(1);
        assertThat(r.totales().mantenimiento()).isEqualTo(1);
        assertThat(r.porEspacio()).hasSize(1);
        assertThat(r.porTipo()).extracting(EstadoInventarioDto.Grupo::nombre).containsExactly("Proyector");
        // Filtrando un espacio la cobertura no dice nada.
        assertThat(r.cobertura()).isNull();
    }

    @Test
    @DisplayName("Filtrar por edificio acota items y espacios, y la cobertura es la del edificio")
    void filtroEdificio() {
        EstadoInventarioDto r = service.estado(null, null, 10L);

        assertThat(r.totales().items()).isEqualTo(2);
        assertThat(r.totales().sinEspacio()).isZero();
        assertThat(r.porEspacio()).extracting(EstadoInventarioDto.Grupo::nombre).containsExactly("Aula A", "Aula B");
        assertThat(r.cobertura()).isEqualTo(new EstadoInventarioDto.Cobertura(2, 1));
    }

    @Test
    @DisplayName("Atención: sólo los que no están disponibles, el más estancado primero")
    void atencion() {
        EstadoInventarioDto r = service.estado(null, null, null);

        assertThat(r.atencion()).extracting(EstadoInventarioDto.ItemAtencion::id).containsExactly(2L, 4L, 3L);
        assertThat(r.atencion().get(0).diasSinCambios()).isEqualTo(200);
        assertThat(r.atencion().get(1).espacio()).isNull();
    }

    @Test
    @DisplayName("Antigüedad por fecha de alta y sin cambios hace más de seis meses")
    void antiguedad() {
        EstadoInventarioDto r = service.estado(null, null, null);

        assertThat(r.antiguedad()).isEqualTo(new EstadoInventarioDto.Antiguedad(1, 1, 1, 1, 1));
    }

    @Test
    @DisplayName("La matriz cruza espacio y tipo, sin los items sin espacio")
    void matriz() {
        EstadoInventarioDto r = service.estado(null, null, null);

        assertThat(r.matriz()).containsExactlyInAnyOrder(
                new EstadoInventarioDto.Celda(1, 100, 1, 20),
                new EstadoInventarioDto.Celda(1, 200, 1, 1),
                new EstadoInventarioDto.Celda(3, 100, 1, 5));
    }
}
