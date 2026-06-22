package com.utec.backend.service;

import com.utec.backend.dto.sostenibilidad.SostenibilidadStatsDto;
import com.utec.backend.model.RecursoAcademico;
import com.utec.backend.repository.InscripcionMateriaRepository;
import com.utec.backend.repository.RecursoAcademicoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.YearMonth;
import java.time.ZoneId;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;

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

    private static final ZoneId ZONA = ZoneId.systemDefault();

    private final RecursoAcademicoRepository recursoAcademicoRepository;
    private final InscripcionMateriaRepository inscripcionMateriaRepository;

    public SostenibilidadStatsDto getStats() {
        List<RecursoAcademico> recursos = recursoAcademicoRepository.findAllByDeletedAtIsNull();

        long hojasEvitadas = 0L;
        long recursosArchivo = 0L;
        long recursosEnlace = 0L;

        // Acumulador ordenado de hojas evitadas por mes (YYYY-MM).
        Map<String, Long> hojasPorMes = new TreeMap<>();

        for (RecursoAcademico recurso : recursos) {
            if (TIPO_ENLACE.equals(recurso.getTipo())) {
                recursosEnlace++;
                continue;
            }
            if (!TIPO_ARCHIVO.equals(recurso.getTipo())) {
                continue;
            }

            recursosArchivo++;

            long hojas = calcularHojas(recurso);
            long copiasEvitadas = calcularCopiasEvitadas(recurso);
            long hojasRecurso = hojas * copiasEvitadas;

            hojasEvitadas += hojasRecurso;
            hojasPorMes.merge(mesDe(recurso), hojasRecurso, Long::sum);
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
                .recursosDigitalesTotales((long) recursos.size())
                .recursosArchivo(recursosArchivo)
                .recursosEnlace(recursosEnlace)
                .arbolesSalvados(arbolesSalvados)
                .kmAutoEquivalente(kmAutoEquivalente)
                .ahorroPorMes(construirAhorroPorMes(hojasPorMes))
                .build();
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

    private long calcularCopiasEvitadas(RecursoAcademico recurso) {
        if (recurso.getMateria() == null || recurso.getMateria().getId() == null) {
            return 1L;
        }
        long inscriptos = inscripcionMateriaRepository
                .countByMateriaIdAndDeletedAtIsNull(recurso.getMateria().getId());
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
