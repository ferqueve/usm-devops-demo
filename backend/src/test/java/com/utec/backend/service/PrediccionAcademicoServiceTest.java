package com.utec.backend.service;

import com.utec.backend.dto.stats.PrediccionAcademicoDto;
import com.utec.backend.dto.stats.PrediccionAcademicoDto.Proxima;
import com.utec.backend.model.ModeloForecast;
import com.utec.backend.repository.ModeloForecastRepository;
import com.utec.backend.repository.PrediccionesConsultas;
import com.utec.backend.repository.PrediccionesConsultas.FilaInscripcionFutura;
import com.utec.backend.repository.PrediccionesConsultas.FilaTutoriaFutura;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PrediccionAcademicoServiceTest {

    @Mock private ModeloForecastRepository modeloRepository;
    @Mock private PrediccionesConsultas consultas;
    private static final Instant AHORA = Instant.parse("2026-09-14T15:00:00Z");
    @Spy private Clock clock = Clock.fixed(AHORA, ZoneOffset.UTC);

    @InjectMocks private PrediccionAcademicoService service;

    private static final String PARAMS = """
            {"muestras": 580, "validacion": {"desde": "2026-08-20", "hasta": "2026-09-02", "n": 145},
             "tasa_base": 0.55, "auc": 0.71, "brier": 0.21, "brier_base": 0.247, "log_loss": 0.6, "exactitud": 0.66,
             "calibracion": [{"desde": 0.0, "hasta": 0.2, "predicho": 0.12, "real": 0.1, "n": 20},
                             {"desde": 0.2, "hasta": 0.4, "predicho": NaN, "real": null, "n": 0}],
             "factores": [{"clave": "tasa_previa_estudiante", "nombre": "Asistencia previa del estudiante",
                           "odds_ratio": 1.9, "coef": 0.64},
                          {"clave": "horas_antelacion", "nombre": "Antelación", "odds_ratio": 0.8, "coef": -0.22},
                          {"clave": "modalidad_virtual", "nombre": "Virtual", "odds_ratio": 1.05, "coef": 0.05}],
             "historico_semanal": [{"semana": "2026-08-24", "inscriptos": 40, "asistieron": 22, "esperados": 23.4}]}
            """;

    private static ModeloForecast modelo() {
        ModeloForecast m = new ModeloForecast();
        m.setId(50L);
        m.setScope("academico");
        m.setAlgoritmo("regresion_logistica");
        m.setTrainedAt(Instant.parse("2026-09-14T03:00:00Z"));
        m.setSampleSize(575);
        m.setParamsJson(PARAMS);
        m.setActivo(true);
        return m;
    }

    private static FilaTutoriaFutura tutoria(long id, int cupo, int horas) {
        return new FilaTutoriaFutura(id, "Cálculo I", "Ing. X", "Docente 2", AHORA.plus(horas, ChronoUnit.HOURS),
                "PRESENCIAL", "GRUPAL", "Aula 9", 30, cupo);
    }

    private static List<FilaInscripcionFutura> inscripciones(long tutoriaId, Double... probabilidades) {
        List<FilaInscripcionFutura> filas = new ArrayList<>();
        for (int i = 0; i < probabilidades.length; i++) {
            filas.add(new FilaInscripcionFutura(tutoriaId, tutoriaId * 100 + i, "Estudiante " + i,
                    probabilidades[i], 5, 6));
        }
        return filas;
    }

    @Test
    @DisplayName("Sin modelo activo: entrenado=false, sin tutorías")
    void sinModelo() {
        when(modeloRepository.findFirstByScopeAndActivoTrueOrderByTrainedAtDesc("academico")).thenReturn(Optional.empty());

        PrediccionAcademicoDto r = service.academico();

        assertThat(r.modelo().entrenado()).isFalse();
        assertThat(r.modelo().factores()).isEmpty();
        assertThat(r.proximas()).isEmpty();
        assertThat(r.resumen().proximas()).isZero();
    }

    @Test
    @DisplayName("Esperados, bandas 80%, riesgo por tutoría y resumen")
    void tutoriasYResumen() {
        when(modeloRepository.findFirstByScopeAndActivoTrueOrderByTrainedAtDesc("academico"))
                .thenReturn(Optional.of(modelo()));
        when(consultas.tutoriasFuturas(AHORA)).thenReturn(List.of(
                tutoria(1, 10, 20), tutoria(2, 4, 30), tutoria(3, 20, 40),
                tutoria(4, 10, 50), tutoria(5, 10, 60), tutoria(6, 10, 70)));
        List<FilaInscripcionFutura> filas = new ArrayList<>();
        filas.addAll(inscripciones(1, 0.9, 0.8, 0.7, 0.6, 0.5, 0.4, 0.4, 0.3));
        filas.addAll(inscripciones(2, 0.95, 0.95, 0.95, 0.95));
        filas.addAll(inscripciones(3, 0.6, 0.5));
        filas.addAll(inscripciones(4, null, null, null));
        // La cuarta se anotó después de entrenar: vale la tasa base (0,55).
        filas.addAll(inscripciones(6, 0.5, 0.4, 0.45, null));
        when(consultas.inscripcionesFuturas(AHORA, 50L)).thenReturn(filas);

        PrediccionAcademicoDto r = service.academico();

        assertThat(r.proximas()).extracting(Proxima::riesgo)
                .containsExactly("normal", "alta", "vacia", "sin_prediccion", "vacia", "baja");

        // Σp = 4,6; Σp(1-p) = 1,64 → 4,6 ± 1,2816·1,2806 → [2,96; 6,24] → [3, 6].
        Proxima t1 = r.proximas().get(0);
        assertThat(t1.inscriptos()).isEqualTo(8);
        assertThat(t1.esperados()).isEqualTo(4.6);
        assertThat(t1.bandaInferior()).isEqualTo(3);
        assertThat(t1.bandaSuperior()).isEqualTo(6);
        assertThat(t1.tasaEsperada()).isEqualTo(0.575);
        assertThat(t1.inscripciones()).hasSize(8);
        assertThat(t1.inscripciones().get(0).probabilidad()).isEqualTo(0.9);
        assertThat(t1.inscripciones().get(0).asistenciasPrevias()).isEqualTo(5);

        // 3,8 esperados con cupo 4: la banda superior no pasa de los inscriptos.
        Proxima t2 = r.proximas().get(1);
        assertThat(t2.esperados()).isEqualTo(3.8);
        assertThat(t2.bandaSuperior()).isEqualTo(4);

        Proxima t4 = r.proximas().get(3);
        assertThat(t4.inscriptos()).isEqualTo(3);
        assertThat(t4.esperados()).isNull();
        assertThat(t4.bandaInferior()).isNull();
        assertThat(t4.tasaEsperada()).isNull();

        Proxima t5 = r.proximas().get(4);
        assertThat(t5.inscriptos()).isZero();
        assertThat(t5.esperados()).isEqualTo(0.0);
        assertThat(t5.tasaEsperada()).isNull();

        Proxima t6 = r.proximas().get(5);
        assertThat(t6.esperados()).isEqualTo(1.9);
        assertThat(t6.inscripciones().get(3).probabilidad()).isNull();

        PrediccionAcademicoDto.Resumen resumen = r.resumen();
        assertThat(resumen.proximas()).isEqualTo(6);
        assertThat(resumen.inscriptos()).isEqualTo(21);
        // La sin predicción cuenta en proximas e inscriptos, no en esperados ni en la tasa.
        assertThat(resumen.esperados()).isEqualTo(11.4);
        assertThat(resumen.tasaEsperada()).isEqualTo(0.633);
        assertThat(resumen.enRiesgoVacias()).isEqualTo(2);
        assertThat(resumen.desbordadas()).isEqualTo(1);

        PrediccionAcademicoDto.Modelo m = r.modelo();
        assertThat(m.entrenado()).isTrue();
        assertThat(m.muestras()).isEqualTo(580);
        assertThat(m.auc()).isEqualTo(0.71);
        assertThat(m.brierBase()).isEqualTo(0.247);
        assertThat(m.validacion().n()).isEqualTo(145);
        assertThat(m.calibracion()).hasSize(2);
        assertThat(m.calibracion().get(1).predicho()).isNull();
        assertThat(m.factores()).extracting(PrediccionAcademicoDto.Factor::efecto)
                .containsExactly("sube", "baja", "neutro");
        assertThat(m.historicoSemanal().get(0).esperados()).isEqualTo(23.4);
    }

    @Test
    @DisplayName("Bandas: sin incertidumbre colapsan; siempre dentro de [0, inscriptos]")
    void bandas() {
        assertThat(PrediccionAcademicoService.bandas(List.of(1.0, 1.0, 1.0), 3)).containsExactly(3, 3);
        assertThat(PrediccionAcademicoService.bandas(List.of(0.0, 0.0), 2)).containsExactly(0, 0);
        assertThat(PrediccionAcademicoService.bandas(List.of(0.1, 0.1), 2)).containsExactly(0, 1);
        assertThat(PrediccionAcademicoService.bandas(List.of(), 0)).containsExactly(0, 0);
    }

    @Test
    @DisplayName("Riesgo: vacía por pocos esperados o tasa < 0,35; baja < 0,5; alta ≥ 90% del cupo")
    void reglasDeRiesgo() {
        assertThat(PrediccionAcademicoService.riesgo(1.4, 0.7, 10, 2)).isEqualTo("vacia");
        assertThat(PrediccionAcademicoService.riesgo(3.0, 0.3, 20, 10)).isEqualTo("vacia");
        assertThat(PrediccionAcademicoService.riesgo(4.5, 0.45, 20, 10)).isEqualTo("baja");
        assertThat(PrediccionAcademicoService.riesgo(9.0, 0.9, 10, 10)).isEqualTo("alta");
        assertThat(PrediccionAcademicoService.riesgo(8.9, 0.89, 10, 10)).isEqualTo("normal");
        assertThat(PrediccionAcademicoService.riesgo(0.0, null, 10, 0)).isEqualTo("vacia");
        // Cupo 1 o 2: nunca llegan a 1,5 esperados; decide la tasa.
        assertThat(PrediccionAcademicoService.riesgo(0.95, 0.95, 1, 1)).isEqualTo("alta");
        assertThat(PrediccionAcademicoService.riesgo(0.9, 0.9, 2, 1)).isEqualTo("normal");
        assertThat(PrediccionAcademicoService.riesgo(0.3, 0.3, 1, 1)).isEqualTo("vacia");
    }

    @Test
    @DisplayName("Efecto de un factor: sube ≥ 1,1; baja ≤ 0,91; si no, neutro")
    void efecto() {
        assertThat(PrediccionAcademicoService.efecto(1.1)).isEqualTo("sube");
        assertThat(PrediccionAcademicoService.efecto(1.09)).isEqualTo("neutro");
        assertThat(PrediccionAcademicoService.efecto(0.92)).isEqualTo("neutro");
        assertThat(PrediccionAcademicoService.efecto(0.91)).isEqualTo("baja");
        assertThat(PrediccionAcademicoService.efecto(null)).isEqualTo("neutro");
    }
}
