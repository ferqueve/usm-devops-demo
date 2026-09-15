package com.utec.backend.service;

import com.utec.backend.dto.stats.PrediccionAcademicoDto;
import com.utec.backend.dto.stats.PrediccionAcademicoDto.Calibracion;
import com.utec.backend.dto.stats.PrediccionAcademicoDto.Factor;
import com.utec.backend.dto.stats.PrediccionAcademicoDto.Inscripcion;
import com.utec.backend.dto.stats.PrediccionAcademicoDto.Modelo;
import com.utec.backend.dto.stats.PrediccionAcademicoDto.Proxima;
import com.utec.backend.dto.stats.PrediccionAcademicoDto.Resumen;
import com.utec.backend.dto.stats.PrediccionAcademicoDto.Semana;
import com.utec.backend.dto.stats.PrediccionAcademicoDto.Validacion;
import com.utec.backend.model.ModeloForecast;
import com.utec.backend.repository.ModeloForecastRepository;
import com.utec.backend.repository.PrediccionesConsultas;
import com.utec.backend.repository.PrediccionesConsultas.FilaInscripcionFutura;
import com.utec.backend.repository.PrediccionesConsultas.FilaTutoriaFutura;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

import static com.utec.backend.service.CalculosEstadisticos.redondear;

/**
 * Asistencia esperada a las tutorías que vienen, sumando la probabilidad que
 * la regresión logística de ml-svc le dio a cada inscripción.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PrediccionAcademicoService {

    static final String SCOPE = "academico";

    static final String RIESGO_VACIA = "vacia";
    static final String RIESGO_BAJA = "baja";
    static final String RIESGO_NORMAL = "normal";
    static final String RIESGO_ALTA = "alta";
    static final String RIESGO_SIN_PREDICCION = "sin_prediccion";

    /** Cuantil 0,9 de la normal estándar: banda central del 80%. */
    static final double Z_80 = 1.2815515655446004;

    private final ModeloForecastRepository modeloRepository;
    private final PrediccionesConsultas consultas;
    private final Clock clock;

    public PrediccionAcademicoDto academico() {
        Optional<ModeloForecast> modeloOpt = modeloRepository.findFirstByScopeAndActivoTrueOrderByTrainedAtDesc(SCOPE);
        if (modeloOpt.isEmpty()) {
            return new PrediccionAcademicoDto(
                    new Modelo(false, null, null, null, null, null, null, null, null, null, null,
                            List.of(), List.of(), List.of()),
                    new Resumen(0, 0, 0.0, null, 0, 0), List.of());
        }
        ModeloForecast modelo = modeloOpt.get();
        ParamsModelo params = ParamsModelo.de(modelo);
        Instant ahora = clock.instant();

        Map<Long, List<FilaInscripcionFutura>> inscripcionesPorTutoria = consultas
                .inscripcionesFuturas(ahora, modelo.getId()).stream()
                .collect(Collectors.groupingBy(FilaInscripcionFutura::tutoriaId));
        Double tasaBase = params.decimal("tasa_base");

        List<Proxima> proximas = consultas.tutoriasFuturas(ahora).stream()
                .map(t -> proxima(t, inscripcionesPorTutoria.getOrDefault(t.tutoriaId(), List.of()), tasaBase))
                .toList();

        return new PrediccionAcademicoDto(modelo(modelo, params), resumen(proximas), proximas);
    }

    private static Modelo modelo(ModeloForecast modelo, ParamsModelo p) {
        ParamsModelo validacion = p.objeto("validacion");
        List<Calibracion> calibracion = p.objetos("calibracion").stream()
                .map(c -> new Calibracion(c.decimal("desde"), c.decimal("hasta"), c.decimal("predicho"),
                        c.decimal("real"), c.entero("n")))
                .toList();
        List<Factor> factores = p.objetos("factores").stream()
                .map(f -> new Factor(f.texto("clave"), f.texto("nombre"), f.decimal("odds_ratio"),
                        efecto(f.decimal("odds_ratio"))))
                .toList();
        List<Semana> historico = p.objetos("historico_semanal").stream()
                .map(s -> new Semana(s.texto("semana"), s.entero("inscriptos"), s.entero("asistieron"),
                        s.decimal("esperados")))
                .toList();
        Integer muestras = p.entero("muestras");
        return new Modelo(true, modelo.getAlgoritmo(), modelo.getTrainedAt(),
                muestras != null ? muestras : modelo.getSampleSize(),
                p.decimal("tasa_base"), p.decimal("auc"), p.decimal("brier"), p.decimal("brier_base"),
                p.decimal("log_loss"), p.decimal("exactitud"),
                validacion.vacio() ? null
                        : new Validacion(validacion.texto("desde"), validacion.texto("hasta"), validacion.entero("n")),
                calibracion, factores, historico);
    }

    /** Un odds ratio entre 0,91 y 1,1 mueve menos de un 10% las chances: no vale la pena destacarlo. */
    static String efecto(Double oddsRatio) {
        if (oddsRatio == null) {
            return "neutro";
        }
        if (oddsRatio >= 1.1) {
            return "sube";
        }
        if (oddsRatio <= 0.91) {
            return "baja";
        }
        return "neutro";
    }

    static Proxima proxima(FilaTutoriaFutura t, List<FilaInscripcionFutura> filas, Double tasaBase) {
        List<Inscripcion> inscripciones = filas.stream()
                .map(f -> new Inscripcion(f.estudiante(), f.probabilidad(), f.asistenciasPrevias(),
                        f.inscripcionesPrevias()))
                .toList();
        int inscriptos = filas.size();
        List<Double> conPrediccion = filas.stream()
                .map(FilaInscripcionFutura::probabilidad)
                .filter(p -> p != null)
                .toList();

        if (inscriptos > 0 && conPrediccion.isEmpty()) {
            return new Proxima(t.tutoriaId(), t.materia(), t.carrera(), t.docente(), t.inicio(), t.modalidad(),
                    t.tipo(), t.espacio(), t.capacidadEspacio(), t.cupo(), inscriptos, null, null, null, null,
                    RIESGO_SIN_PREDICCION, inscripciones);
        }

        // Si alguien se anotó después de entrenar, su probabilidad no existe:
        // se completa con la tasa base del modelo (o el promedio de los demás)
        // para no subestimar la tutoría por una inscripción tardía.
        double relleno = tasaBase != null ? tasaBase
                : conPrediccion.stream().mapToDouble(Double::doubleValue).average().orElse(0.0);
        List<Double> probabilidades = filas.stream()
                .map(f -> f.probabilidad() != null ? f.probabilidad() : relleno)
                .toList();

        double esperados = probabilidades.stream().mapToDouble(Double::doubleValue).sum();
        int[] banda = bandas(probabilidades, inscriptos);
        Double tasa = inscriptos == 0 ? null : Math.round(esperados / inscriptos * 1000.0) / 1000.0;
        return new Proxima(t.tutoriaId(), t.materia(), t.carrera(), t.docente(), t.inicio(), t.modalidad(),
                t.tipo(), t.espacio(), t.capacidadEspacio(), t.cupo(), inscriptos, redondear(esperados),
                banda[0], banda[1], tasa, riesgo(esperados, tasa, t.cupo(), inscriptos), inscripciones);
    }

    /**
     * Banda del 80% de cuántos van. La cantidad de asistentes es una suma de
     * Bernoulli con probabilidades distintas (Poisson-binomial); con la
     * aproximación normal alcanza para una pantalla y no hace falta la
     * distribución exacta. Recortada a lo posible: ni menos de 0 ni más que
     * los inscriptos.
     */
    static int[] bandas(List<Double> probabilidades, int inscriptos) {
        double media = 0;
        double varianza = 0;
        for (double p : probabilidades) {
            media += p;
            varianza += p * (1 - p);
        }
        double desvio = Math.sqrt(varianza);
        long inferior = Math.round(Math.max(0.0, media - Z_80 * desvio));
        long superior = Math.round(Math.min(inscriptos, media + Z_80 * desvio));
        return new int[]{(int) Math.min(inferior, superior), (int) superior};
    }

    /**
     * El umbral absoluto de 1,5 asistentes sólo se aplica si el cupo deja
     * lugar para más de dos: una tutoría de cupo 1 o 2 nunca llega a 1,5
     * esperados aunque vayan todos, y quedaría marcada como vacía siempre.
     * Ahí decide sólo la tasa.
     */
    static String riesgo(double esperados, Double tasaEsperada, int cupo, int inscriptos) {
        if (inscriptos == 0) {
            return RIESGO_VACIA;
        }
        boolean pocosEsperados = cupo >= 3 && esperados < 1.5;
        if (pocosEsperados || (tasaEsperada != null && tasaEsperada < 0.35)) {
            return RIESGO_VACIA;
        }
        if (tasaEsperada != null && tasaEsperada < 0.5) {
            return RIESGO_BAJA;
        }
        if (cupo > 0 && esperados >= 0.9 * cupo) {
            return RIESGO_ALTA;
        }
        return RIESGO_NORMAL;
    }

    static Resumen resumen(List<Proxima> proximas) {
        int inscriptos = 0;
        int inscriptosConPrediccion = 0;
        double esperados = 0;
        int vacias = 0;
        int desbordadas = 0;
        for (Proxima p : proximas) {
            inscriptos += p.inscriptos();
            if (p.esperados() != null) {
                esperados += p.esperados();
                inscriptosConPrediccion += p.inscriptos();
            }
            if (RIESGO_VACIA.equals(p.riesgo())) {
                vacias++;
            } else if (RIESGO_ALTA.equals(p.riesgo())) {
                desbordadas++;
            }
        }
        Double tasa = inscriptosConPrediccion == 0 ? null
                : Math.round(esperados / inscriptosConPrediccion * 1000.0) / 1000.0;
        return new Resumen(proximas.size(), inscriptos, redondear(esperados), tasa, vacias, desbordadas);
    }
}
