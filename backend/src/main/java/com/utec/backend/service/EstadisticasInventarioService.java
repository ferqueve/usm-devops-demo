package com.utec.backend.service;

import com.utec.backend.repository.HechosInventarioRepository;
import com.utec.backend.repository.InventarioItemRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Servicio analítico de inventario. Lee desde {@code hechos_inventario_diario}
 * (snapshots diarios) para responder métricas de evolución y comparación que
 * el plano transaccional, por definición, no puede dar.
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class EstadisticasInventarioService {

    // Claves del mapa que se serializa al frontend.
    private static final String K_ESPACIO_ID = "espacioId";
    private static final String K_ITEMS_INICIO = "itemsInicio";
    private static final String K_ITEMS_FIN = "itemsFin";
    private static final String K_UNIDADES_INICIO = "unidadesInicio";
    private static final String K_UNIDADES_FIN = "unidadesFin";

    private static final String ESTADO_DISPONIBLE = "DISPONIBLE";
    private static final String ESTADO_MANTENIMIENTO = "MANTENIMIENTO";
    private static final String ESTADO_DANADO = "DANADO";

    private final HechosInventarioRepository hechosInventarioRepository;
    private final InventarioItemRepository inventarioItemRepository;

    /**
     * Para cada fecha del rango, total de items por estado. Pensado para
     * dibujar tres series temporales (DISPONIBLE / MANTENIMIENTO / DANADO).
     */
    public List<Map<String, Object>> evolucionEstado(LocalDate desde, LocalDate hasta) {
        Map<LocalDate, Map<String, Integer>> porFecha = new LinkedHashMap<>();
        for (Object[] row : hechosInventarioRepository.evolucionEstado(desde, hasta)) {
            LocalDate fecha = toLocalDate(row[0]);
            String estado = (String) row[1];
            int total = ((Number) row[2]).intValue();
            porFecha.computeIfAbsent(fecha, k -> new HashMap<>()).put(estado, total);
        }
        List<Map<String, Object>> result = new ArrayList<>(porFecha.size());
        for (Map.Entry<LocalDate, Map<String, Integer>> entry : porFecha.entrySet()) {
            Map<String, Object> punto = new LinkedHashMap<>();
            punto.put("fecha", entry.getKey().toString());
            punto.put("disponibles", entry.getValue().getOrDefault(ESTADO_DISPONIBLE, 0));
            punto.put("mantenimiento", entry.getValue().getOrDefault(ESTADO_MANTENIMIENTO, 0));
            punto.put("danados", entry.getValue().getOrDefault(ESTADO_DANADO, 0));
            result.add(punto);
        }
        return result;
    }

    /**
     * Crecimiento del parque: filas y unidades totales por fecha.
     */
    public List<Map<String, Object>> evolucionParque(LocalDate desde, LocalDate hasta) {
        List<Map<String, Object>> result = new ArrayList<>();
        for (Object[] row : hechosInventarioRepository.evolucionParque(desde, hasta)) {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("fecha", toLocalDate(row[0]).toString());
            m.put("items", ((Number) row[1]).intValue());
            m.put("unidades", ((Number) row[2]).intValue());
            result.add(m);
        }
        return result;
    }

    /**
     * Delta entre dos snapshots: por espacio, cuántos items había en la fecha
     * inicial vs la final, y el cambio absoluto.
     */
    public Map<String, Object> delta(LocalDate fechaInicio, LocalDate fechaFin) {
        Map<Long, Map<String, Object>> porEspacio = new LinkedHashMap<>();
        for (Object[] row : hechosInventarioRepository.snapshotsPorEspacio(fechaInicio, fechaFin)) {
            LocalDate fecha = toLocalDate(row[0]);
            Long espacioId = ((Number) row[1]).longValue();
            String espacioNombre = (String) row[2];
            int items = ((Number) row[3]).intValue();
            int unidades = ((Number) row[4]).intValue();

            Map<String, Object> bucket = porEspacio.computeIfAbsent(espacioId, k -> {
                Map<String, Object> nuevo = new LinkedHashMap<>();
                nuevo.put(K_ESPACIO_ID, espacioId);
                nuevo.put("espacioNombre", espacioNombre == null ? "Sin asignar" : espacioNombre);
                nuevo.put(K_ITEMS_INICIO, 0);
                nuevo.put(K_ITEMS_FIN, 0);
                nuevo.put(K_UNIDADES_INICIO, 0);
                nuevo.put(K_UNIDADES_FIN, 0);
                return nuevo;
            });
            if (fecha.equals(fechaInicio)) {
                bucket.put(K_ITEMS_INICIO, items);
                bucket.put(K_UNIDADES_INICIO, unidades);
            }
            if (fecha.equals(fechaFin)) {
                bucket.put(K_ITEMS_FIN, items);
                bucket.put(K_UNIDADES_FIN, unidades);
            }
        }

        List<Map<String, Object>> filas = new ArrayList<>();
        for (Map<String, Object> bucket : porEspacio.values()) {
            int itemsInicio = (int) bucket.get(K_ITEMS_INICIO);
            int itemsFin = (int) bucket.get(K_ITEMS_FIN);
            bucket.put("deltaItems", itemsFin - itemsInicio);
            bucket.put("deltaUnidades", (int) bucket.get(K_UNIDADES_FIN) - (int) bucket.get(K_UNIDADES_INICIO));
            filas.add(bucket);
        }
        filas.sort(Comparator.comparingInt((Map<String, Object> m) -> Math.abs((int) m.get("deltaItems"))).reversed());

        Map<String, Object> resultado = new LinkedHashMap<>();
        resultado.put("fechaInicio", fechaInicio.toString());
        resultado.put("fechaFin", fechaFin.toString());
        resultado.put("porEspacio", filas);
        return resultado;
    }

    /**
     * Matriz cruzada espacio × tipo de elemento (estado actual de OLTP).
     * Devuelve estructura aplanada lista para renderizar como heatmap.
     */
    public Map<String, Object> matrizEspacioTipo() {
        Map<Long, Map<String, Object>> espacios = new LinkedHashMap<>();
        Map<Long, Map<String, Object>> tipos = new LinkedHashMap<>();
        List<Map<String, Object>> celdas = new ArrayList<>();

        for (Object[] row : inventarioItemRepository.matrizEspacioTipo()) {
            Long espacioId = ((Number) row[0]).longValue();
            String espacioNombre = (String) row[1];
            Long tipoId = ((Number) row[2]).longValue();
            String tipoNombre = (String) row[3];
            int total = ((Number) row[4]).intValue();

            espacios.computeIfAbsent(espacioId, k -> Map.of(
                    K_ESPACIO_ID, espacioId,
                    "espacioNombre", espacioNombre == null ? "Sin asignar" : espacioNombre));
            tipos.computeIfAbsent(tipoId, k -> Map.of(
                    "tipoId", tipoId,
                    "tipoNombre", tipoNombre == null ? "—" : tipoNombre));

            Map<String, Object> celda = new LinkedHashMap<>();
            celda.put(K_ESPACIO_ID, espacioId);
            celda.put("tipoId", tipoId);
            celda.put("total", total);
            celdas.add(celda);
        }

        Map<String, Object> resultado = new LinkedHashMap<>();
        resultado.put("espacios", new ArrayList<>(espacios.values()));
        resultado.put("tipos", new ArrayList<>(tipos.values()));
        resultado.put("celdas", celdas);
        return resultado;
    }

    private LocalDate toLocalDate(Object value) {
        if (value instanceof LocalDate ld) return ld;
        if (value instanceof java.sql.Date d) return d.toLocalDate();
        return LocalDate.parse(value.toString());
    }
}
