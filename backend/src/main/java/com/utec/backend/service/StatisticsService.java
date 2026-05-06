package com.utec.backend.service;

import com.utec.backend.model.Espacio;
import com.utec.backend.model.InventarioItem;
import com.utec.backend.model.TipoElemento;
import com.utec.backend.repository.EspacioRepository;
import com.utec.backend.repository.InventarioItemRepository;
import com.utec.backend.repository.TipoElementoRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.ZoneOffset;
import java.time.ZonedDateTime;
import java.time.temporal.ChronoUnit;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.function.Predicate;

/**
 * Servicio para calcular estadísticas del sistema
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class StatisticsService {

    private static final String ESTADO_DISPONIBLE = "DISPONIBLE";
    private static final String ESTADO_MANTENIMIENTO = "MANTENIMIENTO";
    private static final String ESTADO_DANADO = "DANADO";

    private static final String KEY_DISPONIBLES = "disponibles";
    private static final String KEY_MANTENIMIENTO = "mantenimiento";
    private static final String KEY_DANADOS = "danados";
    private static final String KEY_CANTIDAD = "cantidad";
    private static final String KEY_ITEMS = "items";
    private static final String KEY_PROBLEMAS = "problemas";

    private final InventarioItemRepository inventarioItemRepository;
    private final EspacioRepository espacioRepository;
    private final TipoElementoRepository tipoElementoRepository;

    /**
     * Ventana temporal calculada al inicio del cómputo. Encapsula los cortes
     * más usados (mes, año, comparativas) para no recalcularlos en cada bloque.
     */
    private record VentanaTemporal(
            Instant ahora,
            Instant inicioMes,
            Instant inicioAnio,
            Instant hace30Dias,
            Instant hace3Meses,
            Instant hace6Meses,
            Instant hace12Meses,
            Instant hace1Anio,
            Instant inicioMesAnterior,
            Instant finMesAnterior,
            Instant inicioAnioAnterior,
            Instant finAnioAnterior) {

        static VentanaTemporal snapshot() {
            ZonedDateTime ahoraZdt = Instant.now().atZone(ZoneOffset.UTC);
            Instant ahora = ahoraZdt.toInstant();
            ZonedDateTime inicioMesZdt = ahoraZdt.withDayOfMonth(1).withHour(0).withMinute(0).withSecond(0).withNano(0);
            ZonedDateTime inicioAnioZdt = ahoraZdt.withDayOfYear(1).withHour(0).withMinute(0).withSecond(0).withNano(0);
            ZonedDateTime inicioMesAnteriorZdt = inicioMesZdt.minusMonths(1)
                    .withDayOfMonth(1).withHour(0).withMinute(0).withSecond(0).withNano(0);
            ZonedDateTime inicioAnioAnteriorZdt = inicioAnioZdt.minusYears(1);

            return new VentanaTemporal(
                    ahora,
                    inicioMesZdt.toInstant(),
                    inicioAnioZdt.toInstant(),
                    ahora.minusSeconds(30 * 24 * 3600L),
                    ahoraZdt.minusMonths(3).toInstant(),
                    ahoraZdt.minusMonths(6).toInstant(),
                    ahoraZdt.minusMonths(12).toInstant(),
                    ahoraZdt.minusYears(1).toInstant(),
                    inicioMesAnteriorZdt.toInstant(),
                    inicioMesAnteriorZdt.plusMonths(1).minusSeconds(1).toInstant(),
                    inicioAnioAnteriorZdt.toInstant(),
                    inicioAnioZdt.minusSeconds(1).toInstant());
        }
    }

    /**
     * Obtiene estadísticas detalladas de inventario con todos los análisis posibles.
     * Resultado cacheado en Redis por 5 minutos por defecto.
     */
    @org.springframework.cache.annotation.Cacheable(
        value = "inventarioStatistics",
        key = "#espacioId != null ? #espacioId.toString() : 'all' + '_' + (#tipoElementoId != null ? #tipoElementoId.toString() : 'all') + '_' + (#estado != null ? #estado : 'all')"
    )
    public Map<String, Object> getDetailedInventarioStatistics(Long espacioId, Long tipoElementoId, String estado) {
        log.info("Calculando estadísticas detalladas de inventario - espacioId: {}, tipoElementoId: {}, estado: {}",
                espacioId, tipoElementoId, estado);

        VentanaTemporal ventana = VentanaTemporal.snapshot();
        List<InventarioItem> allItems = filtrarItems(espacioId, tipoElementoId, estado);
        List<Espacio> allEspacios = espacioRepository.findAll();
        List<TipoElemento> allTiposElemento = tipoElementoRepository.findAll();

        Map<String, Object> stats = new LinkedHashMap<>();

        agregarTotalesYBasicas(stats, allItems);
        agregarPorcentajes(stats, allItems);

        Map<Long, Map<String, Object>> itemsPorTipoMap = construirAgrupacionPorTipo(allItems);
        List<Map<String, Object>> itemsPorTipo = ordenarPorItemsDesc(itemsPorTipoMap.values());
        stats.put("itemsPorTipo", itemsPorTipo);
        stats.put("tiposUnicos", itemsPorTipo.size());

        Map<Long, Map<String, Object>> itemsPorEspacioMap = construirAgrupacionPorEspacio(allItems);
        List<Map<String, Object>> itemsPorEspacio = ordenarPorItemsDesc(itemsPorEspacioMap.values());
        stats.put("itemsPorEspacio", itemsPorEspacio);
        stats.put("espaciosConInventario", itemsPorEspacio.size());

        agregarTopRankings(stats, itemsPorEspacio, itemsPorTipo);
        agregarPromedios(stats, itemsPorEspacio.size(), itemsPorTipo.size());
        agregarAnalisisTemporal(stats, allItems, ventana);
        agregarAnalisisEdad(stats, allItems, ventana);
        agregarSaludInventario(stats, allEspacios.size(), itemsPorEspacio.size());
        agregarItemsCriticos(stats, allItems, allEspacios, allTiposElemento, itemsPorEspacioMap, itemsPorTipoMap);
        agregarAnalisisDistribucion(stats, itemsPorEspacio, itemsPorTipo);
        agregarAnalisisCantidad(stats, allItems);
        agregarObservaciones(stats, allItems);
        agregarComparativas(stats, allItems, ventana);
        agregarEficiencia(stats, allEspacios.size(), itemsPorEspacio);

        log.info("Estadísticas calculadas exitosamente - Total items: {}", stats.get("totalItems"));
        return stats;
    }

    private List<InventarioItem> filtrarItems(Long espacioId, Long tipoElementoId, String estado) {
        return inventarioItemRepository.findAll().stream()
                .filter(InventarioItem::getActivo)
                .filter(item -> espacioId == null
                        || (item.getEspacio() != null && item.getEspacio().getId().equals(espacioId)))
                .filter(item -> tipoElementoId == null || item.getTipoElemento().getId().equals(tipoElementoId))
                .filter(item -> estado == null || "todos".equals(estado) || estado.equals(item.getEstado()))
                .toList();
    }

    private void agregarTotalesYBasicas(Map<String, Object> stats, List<InventarioItem> allItems) {
        int totalItems = allItems.size();
        int totalCantidad = allItems.stream().mapToInt(InventarioItem::getCantidad).sum();
        int disponibles = (int) contarConEstado(allItems, ESTADO_DISPONIBLE);
        int mantenimiento = (int) contarConEstado(allItems, ESTADO_MANTENIMIENTO);
        int danados = (int) contarConEstado(allItems, ESTADO_DANADO);
        int sinAsignar = (int) allItems.stream().filter(i -> i.getEspacio() == null).count();
        int asignados = totalItems - sinAsignar;
        int itemsInactivos = (int) inventarioItemRepository.findAll().stream()
                .filter(item -> !item.getActivo()).count();

        stats.put("totalItems", totalItems);
        stats.put("totalCantidad", totalCantidad);
        stats.put(KEY_DISPONIBLES, disponibles);
        stats.put(KEY_MANTENIMIENTO, mantenimiento);
        stats.put(KEY_DANADOS, danados);
        stats.put("sinAsignar", sinAsignar);
        stats.put("asignados", asignados);
        stats.put("itemsInactivos", itemsInactivos);
    }

    private long contarConEstado(List<InventarioItem> items, String estado) {
        return items.stream().filter(i -> estado.equals(i.getEstado())).count();
    }

    private void agregarPorcentajes(Map<String, Object> stats, List<InventarioItem> allItems) {
        int totalItems = (int) stats.get("totalItems");
        int disponibles = (int) stats.get(KEY_DISPONIBLES);
        int mantenimiento = (int) stats.get(KEY_MANTENIMIENTO);
        int danados = (int) stats.get(KEY_DANADOS);
        int sinAsignar = (int) stats.get("sinAsignar");
        int asignados = (int) stats.get("asignados");
        int itemsInactivos = (int) stats.get("itemsInactivos");
        int totalTodosItems = (int) inventarioItemRepository.count();

        stats.put("porcentajeDisponibles", porcentaje(disponibles, totalItems));
        stats.put("porcentajeMantenimiento", porcentaje(mantenimiento, totalItems));
        stats.put("porcentajeDanados", porcentaje(danados, totalItems));
        stats.put("porcentajeSinAsignar", porcentaje(sinAsignar, totalItems));
        stats.put("porcentajeAsignados", porcentaje(asignados, totalItems));
        stats.put("porcentajeInactivos", porcentaje(itemsInactivos, totalTodosItems));
    }

    private double porcentaje(int parte, int total) {
        return total > 0 ? (parte * 100.0 / total) : 0;
    }

    private Map<Long, Map<String, Object>> construirAgrupacionPorTipo(List<InventarioItem> allItems) {
        Map<Long, Map<String, Object>> map = new HashMap<>();
        allItems.forEach(item -> {
            Long tipoId = item.getTipoElemento().getId();
            Map<String, Object> data = map.computeIfAbsent(tipoId, k -> new HashMap<>());
            data.put("tipoId", tipoId);
            data.put("tipoNombre", item.getTipoElemento().getNombre());
            acumularContadoresEstado(data, item);
        });
        return map;
    }

    private Map<Long, Map<String, Object>> construirAgrupacionPorEspacio(List<InventarioItem> allItems) {
        Map<Long, Map<String, Object>> map = new HashMap<>();
        allItems.stream()
                .filter(item -> item.getEspacio() != null)
                .forEach(item -> {
                    Long espacioIdItem = item.getEspacio().getId();
                    Map<String, Object> data = map.computeIfAbsent(espacioIdItem, k -> new HashMap<>());
                    data.put("espacioId", espacioIdItem);
                    data.put("espacioNombre", item.getEspacio().getNombre());
                    acumularContadoresEstado(data, item);
                });
        return map;
    }

    private void acumularContadoresEstado(Map<String, Object> data, InventarioItem item) {
        data.put(KEY_CANTIDAD, ((Integer) data.getOrDefault(KEY_CANTIDAD, 0)) + item.getCantidad());
        data.put(KEY_ITEMS, ((Integer) data.getOrDefault(KEY_ITEMS, 0)) + 1);
        data.put(KEY_DISPONIBLES, ((Integer) data.getOrDefault(KEY_DISPONIBLES, 0))
                + (ESTADO_DISPONIBLE.equals(item.getEstado()) ? 1 : 0));
        data.put(KEY_MANTENIMIENTO, ((Integer) data.getOrDefault(KEY_MANTENIMIENTO, 0))
                + (ESTADO_MANTENIMIENTO.equals(item.getEstado()) ? 1 : 0));
        data.put(KEY_DANADOS, ((Integer) data.getOrDefault(KEY_DANADOS, 0))
                + (ESTADO_DANADO.equals(item.getEstado()) ? 1 : 0));
    }

    private List<Map<String, Object>> ordenarPorItemsDesc(java.util.Collection<Map<String, Object>> values) {
        return values.stream()
                .sorted((a, b) -> ((Integer) b.get(KEY_ITEMS)).compareTo((Integer) a.get(KEY_ITEMS)))
                .toList();
    }

    private void agregarTopRankings(Map<String, Object> stats, List<Map<String, Object>> itemsPorEspacio,
                                    List<Map<String, Object>> itemsPorTipo) {
        stats.put("topEspacios", itemsPorEspacio.stream().limit(10).toList());
        stats.put("topTipos", itemsPorTipo.stream().limit(10).toList());
        stats.put("espaciosConMasProblemas", calcularProblemas(itemsPorEspacio));
        stats.put("tiposConMasProblemas", calcularProblemas(itemsPorTipo));
    }

    private List<Map<String, Object>> calcularProblemas(List<Map<String, Object>> grupos) {
        return grupos.stream()
                .map(this::enriquecerConProblemas)
                .filter(e -> ((Integer) e.get(KEY_PROBLEMAS)) > 0)
                .sorted((a, b) -> ((Integer) b.get(KEY_PROBLEMAS)).compareTo((Integer) a.get(KEY_PROBLEMAS)))
                .limit(10)
                .toList();
    }

    private Map<String, Object> enriquecerConProblemas(Map<String, Object> grupo) {
        int problemas = ((Integer) grupo.getOrDefault(KEY_MANTENIMIENTO, 0))
                + ((Integer) grupo.getOrDefault(KEY_DANADOS, 0));
        int items = (Integer) grupo.get(KEY_ITEMS);
        Map<String, Object> result = new HashMap<>(grupo);
        result.put(KEY_PROBLEMAS, problemas);
        result.put("porcentaje", porcentaje(problemas, items));
        return result;
    }

    private void agregarPromedios(Map<String, Object> stats, int cantEspacios, int cantTipos) {
        int totalItems = (int) stats.get("totalItems");
        int totalCantidad = (int) stats.get("totalCantidad");
        double promedioItemsPorEspacio = cantEspacios > 0 ? (double) totalItems / cantEspacios : 0;
        double promedioCantidadPorItem = totalItems > 0 ? (double) totalCantidad / totalItems : 0;
        double promedioItemsPorTipo = cantTipos > 0 ? (double) totalItems / cantTipos : 0;
        double promedioCantidadPorEspacio = cantEspacios > 0 ? (double) totalCantidad / cantEspacios : 0;
        double promedioCantidadPorTipo = cantTipos > 0 ? (double) totalCantidad / cantTipos : 0;

        stats.put("promedioItemsPorEspacio", promedioItemsPorEspacio);
        stats.put("promedioCantidadPorItem", promedioCantidadPorItem);
        stats.put("promedioItemsPorTipo", promedioItemsPorTipo);
        stats.put("promedioCantidadPorEspacio", promedioCantidadPorEspacio);
        stats.put("promedioCantidadPorTipo", promedioCantidadPorTipo);
    }

    private void agregarAnalisisTemporal(Map<String, Object> stats, List<InventarioItem> allItems,
                                         VentanaTemporal v) {
        stats.put("itemsCreadosEsteMes", contarSi(allItems, item -> creadoDespues(item, v.inicioMes())));
        stats.put("itemsCreadosEsteAnio", contarSi(allItems, item -> creadoDespues(item, v.inicioAnio())));
        stats.put("itemsCreadosUltimos6Meses", contarSi(allItems, item -> creadoDespues(item, v.hace6Meses())));
        stats.put("itemsCreadosUltimos12Meses", contarSi(allItems, item -> creadoDespues(item, v.hace12Meses())));
        stats.put("itemsActualizadosEsteMes", contarSi(allItems, item -> actualizadoDespues(item, v.inicioMes())));
        Instant hace7Dias = v.ahora().minusSeconds(7 * 24 * 3600L);
        stats.put("itemsActualizadosUltimos7Dias", contarSi(allItems, item -> actualizadoDespues(item, hace7Dias)));
    }

    private void agregarAnalisisEdad(Map<String, Object> stats, List<InventarioItem> allItems, VentanaTemporal v) {
        stats.put("itemsRecientes", contarSi(allItems, item -> creadoDespues(item, v.hace30Dias())));
        stats.put("itemsJovenes", contarSi(allItems, item -> creadoDespues(item, v.hace3Meses())));
        stats.put("itemsViejos", contarSi(allItems,
                item -> item.getCreatedAt() != null && item.getCreatedAt().isBefore(v.hace1Anio())));

        double promedioAntiguedadDias = promedioDias(allItems, InventarioItem::getCreatedAt, v.ahora());
        double promedioTiempoSinActualizarDias = promedioDias(allItems, InventarioItem::getUpdatedAt, v.ahora());

        stats.put("promedioAntiguedadDias", promedioAntiguedadDias);
        stats.put("promedioTiempoSinActualizarDias", promedioTiempoSinActualizarDias);
        stats.put("itemsSinActualizarMasDe6Meses", contarSi(allItems,
                item -> item.getUpdatedAt() != null && item.getUpdatedAt().isBefore(v.hace6Meses())));
    }

    private double promedioDias(List<InventarioItem> items, Function<InventarioItem, Instant> extractor, Instant ahora) {
        return items.stream()
                .filter(item -> extractor.apply(item) != null)
                .mapToLong(item -> ChronoUnit.DAYS.between(extractor.apply(item), ahora))
                .average()
                .orElse(0);
    }

    private boolean creadoDespues(InventarioItem item, Instant corte) {
        return item.getCreatedAt() != null && item.getCreatedAt().isAfter(corte);
    }

    private boolean actualizadoDespues(InventarioItem item, Instant corte) {
        return item.getUpdatedAt() != null && item.getUpdatedAt().isAfter(corte);
    }

    private int contarSi(List<InventarioItem> items, Predicate<InventarioItem> pred) {
        return (int) items.stream().filter(pred).count();
    }

    private void agregarSaludInventario(Map<String, Object> stats,
                                        long totalEspacios, int espaciosConInventario) {
        int totalItems = (int) stats.get("totalItems");
        int disponibles = (int) stats.get(KEY_DISPONIBLES);
        int mantenimiento = (int) stats.get(KEY_MANTENIMIENTO);
        int danados = (int) stats.get(KEY_DANADOS);
        int asignados = (int) stats.get("asignados");

        stats.put("ratioSalud", porcentaje(disponibles, totalItems));
        stats.put("ratioProblemas", porcentaje(mantenimiento + danados, totalItems));
        stats.put("ratioAsignacion", porcentaje(asignados, totalItems));
        stats.put("indiceCobertura", totalEspacios > 0 ? (espaciosConInventario * 100.0 / totalEspacios) : 0);
    }

    private void agregarItemsCriticos(Map<String, Object> stats, List<InventarioItem> allItems,
                                      List<Espacio> allEspacios, List<TipoElemento> allTiposElemento,
                                      Map<Long, Map<String, Object>> itemsPorEspacioMap,
                                      Map<Long, Map<String, Object>> itemsPorTipoMap) {
        int danados = (int) stats.get(KEY_DANADOS);
        int itemsSinAsignarConProblemas = contarSi(allItems,
                item -> item.getEspacio() == null
                        && (ESTADO_MANTENIMIENTO.equals(item.getEstado()) || ESTADO_DANADO.equals(item.getEstado())));

        long espaciosSinInventario = allEspacios.stream()
                .filter(espacio -> !itemsPorEspacioMap.containsKey(espacio.getId()))
                .count();
        long tiposSinItems = allTiposElemento.stream()
                .filter(tipo -> !itemsPorTipoMap.containsKey(tipo.getId()))
                .count();

        stats.put("itemsCriticos", itemsSinAsignarConProblemas + danados);
        stats.put("itemsSinAsignarConProblemas", itemsSinAsignarConProblemas);
        stats.put("espaciosSinInventario", espaciosSinInventario);
        stats.put("tiposSinItems", tiposSinItems);
    }

    private void agregarAnalisisDistribucion(Map<String, Object> stats,
                                             List<Map<String, Object>> itemsPorEspacio,
                                             List<Map<String, Object>> itemsPorTipo) {
        stats.put("espaciosConSoloDisponibles", contarSoloEstado(itemsPorEspacio, KEY_DISPONIBLES));
        stats.put("espaciosConSoloMantenimiento", contarSoloEstado(itemsPorEspacio, KEY_MANTENIMIENTO));
        stats.put("espaciosConSoloDanados", contarSoloEstado(itemsPorEspacio, KEY_DANADOS));
        stats.put("espaciosConMezclaEstados", contarMezcla(itemsPorEspacio));

        stats.put("tiposConSoloDisponibles", contarSoloEstado(itemsPorTipo, KEY_DISPONIBLES));
        stats.put("tiposConSoloMantenimiento", contarSoloEstado(itemsPorTipo, KEY_MANTENIMIENTO));
        stats.put("tiposConSoloDanados", contarSoloEstado(itemsPorTipo, KEY_DANADOS));
        stats.put("tiposConMezclaEstados", contarMezcla(itemsPorTipo));
    }

    private int contarSoloEstado(List<Map<String, Object>> grupos, String estadoExclusivo) {
        return (int) grupos.stream().filter(g -> tieneSoloEsteEstado(g, estadoExclusivo)).count();
    }

    private boolean tieneSoloEsteEstado(Map<String, Object> grupo, String estadoExclusivo) {
        boolean tieneEsteEstado = ((Integer) grupo.getOrDefault(estadoExclusivo, 0)) > 0;
        if (!tieneEsteEstado) {
            return false;
        }
        for (String otro : List.of(KEY_DISPONIBLES, KEY_MANTENIMIENTO, KEY_DANADOS)) {
            if (!otro.equals(estadoExclusivo) && ((Integer) grupo.getOrDefault(otro, 0)) > 0) {
                return false;
            }
        }
        return true;
    }

    private int contarMezcla(List<Map<String, Object>> grupos) {
        return (int) grupos.stream().filter(this::tieneMezcla).count();
    }

    private boolean tieneMezcla(Map<String, Object> grupo) {
        int n = 0;
        for (String estado : List.of(KEY_DISPONIBLES, KEY_MANTENIMIENTO, KEY_DANADOS)) {
            if (((Integer) grupo.getOrDefault(estado, 0)) > 0) {
                n++;
            }
        }
        return n > 1;
    }

    private void agregarAnalisisCantidad(Map<String, Object> stats, List<InventarioItem> allItems) {
        stats.put("itemsConCantidad1", contarSi(allItems, item -> item.getCantidad() == 1));
        stats.put("itemsConCantidadAlta", contarSi(allItems, item -> item.getCantidad() > 10));
        stats.put("itemsConCantidadMedia", contarSi(allItems, item -> item.getCantidad() >= 2 && item.getCantidad() <= 10));
        stats.put("cantidadMaxima", allItems.stream().mapToInt(InventarioItem::getCantidad).max().orElse(0));
        stats.put("cantidadMinima", allItems.stream().mapToInt(InventarioItem::getCantidad).min().orElse(0));
        stats.put("cantidadTotalPromedio", stats.get("promedioCantidadPorItem"));
    }

    private void agregarObservaciones(Map<String, Object> stats, List<InventarioItem> allItems) {
        int totalItems = (int) stats.get("totalItems");
        int itemsConObservaciones = contarSi(allItems,
                item -> item.getObservaciones() != null && !item.getObservaciones().trim().isEmpty());
        stats.put("itemsConObservaciones", itemsConObservaciones);
        stats.put("itemsSinObservaciones", totalItems - itemsConObservaciones);
        stats.put("porcentajeConObservaciones", porcentaje(itemsConObservaciones, totalItems));
    }

    private void agregarComparativas(Map<String, Object> stats, List<InventarioItem> allItems,
                                     VentanaTemporal v) {
        int itemsCreadosEsteMes = (int) stats.get("itemsCreadosEsteMes");
        int itemsCreadosEsteAnio = (int) stats.get("itemsCreadosEsteAnio");

        int itemsMesAnterior = contarSi(allItems, item -> item.getCreatedAt() != null
                && item.getCreatedAt().isAfter(v.inicioMesAnterior())
                && item.getCreatedAt().isBefore(v.finMesAnterior()));
        int diferenciaMesAnterior = itemsCreadosEsteMes - itemsMesAnterior;
        double porcentajeCambioMesAnterior = itemsMesAnterior > 0
                ? (diferenciaMesAnterior * 100.0 / itemsMesAnterior) : 0;

        int itemsAnioAnterior = contarSi(allItems, item -> item.getCreatedAt() != null
                && item.getCreatedAt().isAfter(v.inicioAnioAnterior())
                && item.getCreatedAt().isBefore(v.finAnioAnterior()));
        int diferenciaAnioAnterior = itemsCreadosEsteAnio - itemsAnioAnterior;
        double porcentajeCambioAnioAnterior = itemsAnioAnterior > 0
                ? (diferenciaAnioAnterior * 100.0 / itemsAnioAnterior) : 0;

        stats.put("diferenciaMesAnterior", diferenciaMesAnterior);
        stats.put("porcentajeCambioMesAnterior", porcentajeCambioMesAnterior);
        stats.put("diferenciaAnioAnterior", diferenciaAnioAnterior);
        stats.put("porcentajeCambioAnioAnterior", porcentajeCambioAnioAnterior);
    }

    private void agregarEficiencia(Map<String, Object> stats,
                                   long totalEspacios, List<Map<String, Object>> itemsPorEspacio) {
        int totalCantidad = (int) stats.get("totalCantidad");
        double eficienciaAsignacion = totalEspacios > 0
                ? (itemsPorEspacio.size() * 100.0 / totalEspacios) : 0;
        double densidadInventario = (double) stats.get("promedioItemsPorEspacio");
        int top5EspaciosCantidad = itemsPorEspacio.stream()
                .limit(5)
                .mapToInt(espacio -> ((Integer) espacio.get(KEY_CANTIDAD)))
                .sum();
        double concentracionInventario = totalCantidad > 0
                ? (top5EspaciosCantidad * 100.0 / totalCantidad) : 0;

        stats.put("eficienciaAsignacion", eficienciaAsignacion);
        stats.put("densidadInventario", densidadInventario);
        stats.put("concentracionInventario", concentracionInventario);
    }
}
