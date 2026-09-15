package com.utec.backend.dto.stats;

import java.time.Instant;
import java.util.List;

/** ¿Cuántos van a ir a cada tutoría? Asistencia esperada según la probabilidad de cada inscripto. */
public record PrediccionAcademicoDto(Modelo modelo, Resumen resumen, List<Proxima> proximas) {

    /** Sin modelo activo sólo {@code entrenado=false}; escalares null y listas vacías. */
    public record Modelo(boolean entrenado, String algoritmo, Instant entrenadoEn, Integer muestras, Double tasaBase,
                         Double auc, Double brier, Double brierBase, Double logLoss, Double exactitud,
                         Validacion validacion, List<Calibracion> calibracion, List<Factor> factores,
                         List<Semana> historicoSemanal) {
    }

    public record Validacion(String desde, String hasta, Integer n) {
    }

    /** Un tramo de probabilidad predicha: cuánto se predijo en promedio y cuánto se dio. */
    public record Calibracion(Double desde, Double hasta, Double predicho, Double real, Integer n) {
    }

    /** @param efecto sube, baja o neutro según el odds ratio por un desvío estándar */
    public record Factor(String clave, String nombre, Double oddsRatio, String efecto) {
    }

    public record Semana(String semana, Integer inscriptos, Integer asistieron, Double esperados) {
    }

    /**
     * @param proximas     tutorías futuras listadas, con o sin predicción
     * @param inscriptos   inscripciones vigentes de todas las tutorías listadas
     * @param esperados    asistentes esperados, sólo de las tutorías con predicción
     * @param tasaEsperada esperados sobre inscriptos de las tutorías con predicción
     */
    public record Resumen(int proximas, int inscriptos, double esperados, Double tasaEsperada, int enRiesgoVacias,
                          int desbordadas) {
    }

    /**
     * Sin predicción (tutoría creada o con inscriptos después de entrenar),
     * {@code esperados}, bandas y tasa vienen null y el riesgo es sin_prediccion.
     *
     * @param riesgo vacia, baja, normal, alta o sin_prediccion
     */
    public record Proxima(Long tutoriaId, String materia, String carrera, String docente, Instant inicio,
                          String modalidad, String tipo, String espacio, Integer capacidadEspacio, int cupo,
                          int inscriptos, Double esperados, Integer bandaInferior, Integer bandaSuperior,
                          Double tasaEsperada, String riesgo, List<Inscripcion> inscripciones) {
    }

    /** {@code probabilidad} null si el modelo no predijo esa inscripción. */
    public record Inscripcion(String estudiante, Double probabilidad, int asistenciasPrevias,
                              int inscripcionesPrevias) {
    }
}
