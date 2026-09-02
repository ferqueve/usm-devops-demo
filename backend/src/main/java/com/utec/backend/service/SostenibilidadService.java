package com.utec.backend.service;

import com.utec.backend.dto.sostenibilidad.SostenibilidadRankingDto;
import com.utec.backend.dto.sostenibilidad.SostenibilidadStatsDto;
import com.utec.backend.model.Materia;
import com.utec.backend.model.RecursoAcademico;
import com.utec.backend.repository.InscripcionMateriaRepository;
import com.utec.backend.repository.RecursoAcademicoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.YearMonth;
import java.time.ZoneId;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;
import java.util.stream.Collectors;

/**
 * Calcula métricas DERIVADAS de sostenibilidad a partir de los recursos
 * académicos digitales. La idea: cada recurso de tipo ARCHIVO subido a la
 * plataforma evita que cada estudiante inscripto en la materia imprima una
 * copia física. Con eso estimamos hojas, papel, CO2 y agua ahorrados.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class SostenibilidadService {

    private static final String TIPO_ARCHIVO = "ARCHIVO";
    private static final String TIPO_ENLACE = "ENLACE";

    // Factores ambientales por hoja de papel.
    private static final double GRAMOS_PAPEL_POR_HOJA = 4.5;
    private static final double CO2_GR_POR_HOJA = 4.7;
    private static final double AGUA_L_POR_HOJA = 10.0;

    // Equivalencias.
    private static final double KG_PAPEL_POR_ARBOL = 8.3;
    private static final double KG_CO2_POR_KM_AUTO = 0.12;

    // Si no hay paginasEstimadas, aproximamos por tamaño: ~50 KB por hoja.
    private static final double BYTES_POR_HOJA = 50000.0;

    private static final ZoneId ZONA = ZoneId.of("America/Montevideo");

    private final RecursoAcademicoRepository recursoAcademicoRepository;
    private final InscripcionMateriaRepository inscripcionMateriaRepository;

    public SostenibilidadStatsDto getStats() {
        List<RecursoAcademico> recursos = recursoAcademicoRepository.findAllByDeletedAtIsNull();
        Map<Long, Long> inscriptosPorMateria = inscriptosPorMateria();

        long hojasEvitadas = 0L;
        long recursosArchivo = 0L;
        long recursosEnlace = 0L;

        // Acumulador ordenado de hojas evitadas por mes (YYYY-MM).
        Map<String, Long> hojasPorMes = new TreeMap<>();

        for (RecursoAcademico recurso : recursos) {
            if (TIPO_ENLACE.equals(recurso.getTipo())) {
                recursosEnlace++;
            } else if (TIPO_ARCHIVO.equals(recurso.getTipo())) {
                recursosArchivo++;

                long hojas = calcularHojas(recurso);
                long copiasEvitadas = calcularCopiasEvitadas(recurso, inscriptosPorMateria);
                long hojasRecurso = hojas * copiasEvitadas;

                hojasEvitadas += hojasRecurso;
                hojasPorMes.merge(mesDe(recurso), hojasRecurso, Long::sum);
            }
        }

        double papelAhorradoKg = hojasEvitadas * GRAMOS_PAPEL_POR_HOJA / 1000.0;
        double co2EvitadoKg = hojasEvitadas * CO2_GR_POR_HOJA / 1000.0;
        double aguaAhorradaL = hojasEvitadas * AGUA_L_POR_HOJA;

        double arbolesSalvados = papelAhorradoKg / KG_PAPEL_POR_ARBOL;
        double kmAutoEquivalente = co2EvitadoKg / KG_CO2_POR_KM_AUTO;

        return SostenibilidadStatsDto.builder()
                .hojasEvitadas(hojasEvitadas)
                .papelAhorradoKg(papelAhorradoKg)
                .co2EvitadoKg(co2EvitadoKg)
                .aguaAhorradaL(aguaAhorradaL)
                .recursosDigitalesTotales(recursos.size())
                .recursosArchivo(recursosArchivo)
                .recursosEnlace(recursosEnlace)
                .arbolesSalvados(arbolesSalvados)
                .kmAutoEquivalente(kmAutoEquivalente)
                .ahorroPorMes(construirAhorroPorMes(hojasPorMes))
                .build();
    }

    /** Ranking de carreras y docentes por impacto (hojas evitadas) + comparativa mensual. */
    public SostenibilidadRankingDto getRanking() {
        List<RecursoAcademico> recursos = recursoAcademicoRepository.findAllByDeletedAtIsNull();
        Map<Long, Long> inscriptosPorMateria = inscriptosPorMateria();
        // Acumuladores por grupo: [hojasTotal, recursos, hojasMesActual, hojasMesAnterior]
        Map<String, long[]> porCarrera = new HashMap<>();
        Map<String, long[]> porDocente = new HashMap<>();
        Map<String, Long> hojasPorMes = new TreeMap<>();

        String mesActual = YearMonth.now(ZONA).toString();
        String mesAnterior = YearMonth.now(ZONA).minusMonths(1).toString();

        for (RecursoAcademico r : recursos) {
            if (!TIPO_ARCHIVO.equals(r.getTipo())) {
                continue;
            }
            long hojasRecurso = calcularHojas(r) * calcularCopiasEvitadas(r, inscriptosPorMateria);
            String mes = mesDe(r);
            int idxMes = indiceDeMes(mes, mesActual, mesAnterior);
            Materia m = r.getMateria();
            if (m != null) {
                acumular(porCarrera, nombreDeCarrera(m), hojasRecurso, idxMes);
                acumular(porDocente, nombreDeDocente(m), hojasRecurso, idxMes);
            }
            hojasPorMes.merge(mes, hojasRecurso, Long::sum);
        }

        long actual = hojasPorMes.getOrDefault(mesActual, 0L);
        long anterior = hojasPorMes.getOrDefault(mesAnterior, 0L);
        double deltaPct = variacionPorcentual(actual, anterior);

        SostenibilidadRankingDto.Comparativa comparativa =
                new SostenibilidadRankingDto.Comparativa(actual, anterior, redondear1(deltaPct));
        return new SostenibilidadRankingDto(toRankList(porCarrera), toRankList(porDocente), comparativa);
    }

    /**
     * Posición del mes dentro del acumulador de 4 casillas:
     * 2 = mes en curso, 3 = mes anterior, -1 = fuera de la ventana comparada.
     */
    private static int indiceDeMes(String mes, String mesActual, String mesAnterior) {
        if (mesActual.equals(mes)) {
            return 2;
        }
        if (mesAnterior.equals(mes)) {
            return 3;
        }
        return -1;
    }

    /** Variación porcentual entre dos períodos; 100 % si antes no había nada y ahora sí. */
    private static double variacionPorcentual(long actual, long anterior) {
        if (anterior > 0) {
            return (actual - anterior) * 100.0 / anterior;
        }
        return actual > 0 ? 100.0 : 0.0;
    }

    private static String nombreDeCarrera(Materia m) {
        return (m.getCarrera() != null && m.getCarrera().getNombre() != null)
                ? m.getCarrera().getNombre()
                : "Sin carrera";
    }

    private static String nombreDeDocente(Materia m) {
        return (m.getDocente() != null && m.getDocente().getNombre() != null)
                ? m.getDocente().getNombre()
                : "Sin docente";
    }

    /** Suma un recurso al acumulador [hojasTotal, recursos, hojasMesActual, hojasMesAnterior]. */
    private static void acumular(Map<String, long[]> destino, String clave, long hojas, int idxMes) {
        long[] acc = destino.computeIfAbsent(clave, k -> new long[4]);
        acc[0] += hojas;
        acc[1] += 1;
        if (idxMes >= 0) {
            acc[idxMes] += hojas;
        }
    }

    private List<SostenibilidadRankingDto.Item> toRankList(Map<String, long[]> data) {
        return data.entrySet().stream()
                .map(e -> {
                    long[] v = e.getValue();
                    long hojas = v[0];
                    long mesAct = v[2];
                    long mesAnt = v[3];
                    double delta = variacionPorcentual(mesAct, mesAnt);
                    return new SostenibilidadRankingDto.Item(
                            e.getKey(),
                            hojas,
                            v[1],
                            redondear1(hojas * GRAMOS_PAPEL_POR_HOJA / 1000.0),
                            redondear1(hojas * CO2_GR_POR_HOJA / 1000.0),
                            redondear1(delta));
                })
                .sorted((a, b) -> Long.compare(b.hojas(), a.hojas()))
                .limit(10)
                .toList();
    }

    private static double redondear1(double v) {
        return Math.round(v * 10) / 10.0;
    }

    private long calcularHojas(RecursoAcademico recurso) {
        if (recurso.getPaginasEstimadas() != null) {
            return Math.max(0, recurso.getPaginasEstimadas());
        }
        if (recurso.getTamanoBytes() != null && recurso.getTamanoBytes() > 0) {
            return (long) Math.ceil(recurso.getTamanoBytes() / BYTES_POR_HOJA);
        }
        return 1L;
    }

    /** Inscriptos activos por materia, precargados en una sola query (evita el N+1 por recurso). */
    private Map<Long, Long> inscriptosPorMateria() {
        return inscripcionMateriaRepository.contarInscriptosPorMateria().stream()
                .collect(Collectors.toMap(
                        InscripcionMateriaRepository.MateriaConteo::getMateriaId,
                        InscripcionMateriaRepository.MateriaConteo::getTotal));
    }

    private long calcularCopiasEvitadas(RecursoAcademico recurso, Map<Long, Long> inscriptosPorMateria) {
        if (recurso.getMateria() == null || recurso.getMateria().getId() == null) {
            return 1L;
        }
        long inscriptos = inscriptosPorMateria.getOrDefault(recurso.getMateria().getId(), 0L);
        return Math.max(1L, inscriptos);
    }

    private String mesDe(RecursoAcademico recurso) {
        if (recurso.getCreatedAt() == null) {
            return YearMonth.now(ZONA).toString();
        }
        return YearMonth.from(recurso.getCreatedAt().atZone(ZONA)).toString();
    }

    private List<Map<String, Object>> construirAhorroPorMes(Map<String, Long> hojasPorMes) {
        return hojasPorMes.entrySet().stream()
                .map(e -> {
                    Map<String, Object> punto = new LinkedHashMap<>();
                    punto.put("mes", e.getKey());
                    punto.put("hojas", e.getValue());
                    return punto;
                })
                .toList();
    }
}
