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
import java.util.stream.Collectors;

/**
 * Servicio para calcular estadísticas del sistema
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class StatisticsService {
    
    private final InventarioItemRepository inventarioItemRepository;
    private final EspacioRepository espacioRepository;
    private final TipoElementoRepository tipoElementoRepository;
    
    /**
     * Obtiene estadísticas detalladas de inventario con todos los análisis posibles
     * Resultado cacheado en Redis por 5 minutos por defecto
     * 
     * @param espacioId Filtro opcional por espacio
     * @param tipoElementoId Filtro opcional por tipo de elemento
     * @param estado Filtro opcional por estado (DISPONIBLE, MANTENIMIENTO, DANADO)
     * @return Map con todas las estadísticas calculadas
     */
    @org.springframework.cache.annotation.Cacheable(
        value = "inventarioStatistics", 
        key = "#espacioId != null ? #espacioId.toString() : 'all' + '_' + (#tipoElementoId != null ? #tipoElementoId.toString() : 'all') + '_' + (#estado != null ? #estado : 'all')"
    )
    public Map<String, Object> getDetailedInventarioStatistics(Long espacioId, Long tipoElementoId, String estado) {
        log.info("Calculando estadísticas detalladas de inventario - espacioId: {}, tipoElementoId: {}, estado: {}", 
                espacioId, tipoElementoId, estado);
        
        ZonedDateTime ahoraZdt = Instant.now().atZone(ZoneOffset.UTC);
        Instant ahora = ahoraZdt.toInstant();
        ZonedDateTime inicioMes = ahoraZdt.withDayOfMonth(1).withHour(0).withMinute(0).withSecond(0).withNano(0);
        ZonedDateTime inicioAnio = ahoraZdt.withDayOfYear(1).withHour(0).withMinute(0).withSecond(0).withNano(0);
        Instant inicioMesInstant = inicioMes.toInstant();
        Instant inicioAnioInstant = inicioAnio.toInstant();
        Instant hace30Dias = ahora.minusSeconds(30 * 24 * 3600L);
        Instant hace3Meses = ahoraZdt.minusMonths(3).toInstant();
        Instant hace6Meses = ahoraZdt.minusMonths(6).toInstant();
        Instant hace12Meses = ahoraZdt.minusMonths(12).toInstant();
        Instant hace1Anio = ahoraZdt.minusYears(1).toInstant();
        ZonedDateTime mesAnterior = inicioMes.minusMonths(1);
        ZonedDateTime inicioMesAnterior = mesAnterior.withDayOfMonth(1).withHour(0).withMinute(0).withSecond(0).withNano(0);
        Instant inicioMesAnteriorInstant = inicioMesAnterior.toInstant();
        Instant finMesAnterior = inicioMesAnterior.plusMonths(1).minusSeconds(1).toInstant();
        ZonedDateTime inicioAnioAnterior = inicioAnio.minusYears(1);
        Instant inicioAnioAnteriorInstant = inicioAnioAnterior.toInstant();
        Instant finAnioAnterior = inicioAnio.minusSeconds(1).toInstant();
        
        // Obtener todos los items activos y aplicar filtros
        List<InventarioItem> allItems = inventarioItemRepository.findAll().stream()
                .filter(item -> item.getActivo())
                .filter(item -> espacioId == null || (item.getEspacio() != null && item.getEspacio().getId().equals(espacioId)))
                .filter(item -> tipoElementoId == null || item.getTipoElemento().getId().equals(tipoElementoId))
                .filter(item -> estado == null || estado.equals("todos") || item.getEstado().equals(estado))
                .toList();
        
        // Obtener todos los espacios y tipos para cálculos adicionales
        List<Espacio> allEspacios = espacioRepository.findAll();
        List<TipoElemento> allTiposElemento = tipoElementoRepository.findAll();
        
        Map<String, Object> stats = new LinkedHashMap<>();
        
        // === TOTALES Y BÁSICAS ===
        int totalItems = allItems.size();
        int totalCantidad = allItems.stream().mapToInt(InventarioItem::getCantidad).sum();
        int disponibles = (int) allItems.stream().filter(i -> "DISPONIBLE".equals(i.getEstado())).count();
        int mantenimiento = (int) allItems.stream().filter(i -> "MANTENIMIENTO".equals(i.getEstado())).count();
        int danados = (int) allItems.stream().filter(i -> "DANADO".equals(i.getEstado())).count();
        int sinAsignar = (int) allItems.stream().filter(i -> i.getEspacio() == null).count();
        int asignados = totalItems - sinAsignar;
        int itemsInactivos = (int) inventarioItemRepository.findAll().stream().filter(item -> !item.getActivo()).count();
        
        stats.put("totalItems", totalItems);
        stats.put("totalCantidad", totalCantidad);
        stats.put("disponibles", disponibles);
        stats.put("mantenimiento", mantenimiento);
        stats.put("danados", danados);
        stats.put("sinAsignar", sinAsignar);
        stats.put("asignados", asignados);
        stats.put("itemsInactivos", itemsInactivos);
        
        // === PORCENTAJES ===
        double porcentajeDisponibles = totalItems > 0 ? (disponibles * 100.0 / totalItems) : 0;
        double porcentajeMantenimiento = totalItems > 0 ? (mantenimiento * 100.0 / totalItems) : 0;
        double porcentajeDanados = totalItems > 0 ? (danados * 100.0 / totalItems) : 0;
        double porcentajeSinAsignar = totalItems > 0 ? (sinAsignar * 100.0 / totalItems) : 0;
        double porcentajeAsignados = totalItems > 0 ? (asignados * 100.0 / totalItems) : 0;
        int totalTodosItems = (int) inventarioItemRepository.count();
        double porcentajeInactivos = totalTodosItems > 0 ? (itemsInactivos * 100.0 / totalTodosItems) : 0;
        
        stats.put("porcentajeDisponibles", porcentajeDisponibles);
        stats.put("porcentajeMantenimiento", porcentajeMantenimiento);
        stats.put("porcentajeDanados", porcentajeDanados);
        stats.put("porcentajeSinAsignar", porcentajeSinAsignar);
        stats.put("porcentajeAsignados", porcentajeAsignados);
        stats.put("porcentajeInactivos", porcentajeInactivos);
        
        // === POR TIPO DE ELEMENTO ===
        Map<Long, Map<String, Object>> itemsPorTipoMap = new HashMap<>();
        allItems.forEach(item -> {
            Long tipoId = item.getTipoElemento().getId();
            String tipoNombre = item.getTipoElemento().getNombre();
            itemsPorTipoMap.putIfAbsent(tipoId, new HashMap<>());
            Map<String, Object> tipoData = itemsPorTipoMap.get(tipoId);
            tipoData.put("tipoId", tipoId);
            tipoData.put("tipoNombre", tipoNombre);
            tipoData.put("cantidad", ((Integer) tipoData.getOrDefault("cantidad", 0)) + item.getCantidad());
            tipoData.put("items", ((Integer) tipoData.getOrDefault("items", 0)) + 1);
            tipoData.put("disponibles", ((Integer) tipoData.getOrDefault("disponibles", 0)) + ("DISPONIBLE".equals(item.getEstado()) ? 1 : 0));
            tipoData.put("mantenimiento", ((Integer) tipoData.getOrDefault("mantenimiento", 0)) + ("MANTENIMIENTO".equals(item.getEstado()) ? 1 : 0));
            tipoData.put("danados", ((Integer) tipoData.getOrDefault("danados", 0)) + ("DANADO".equals(item.getEstado()) ? 1 : 0));
        });
        
        List<Map<String, Object>> itemsPorTipo = itemsPorTipoMap.values().stream()
                .sorted((a, b) -> ((Integer) b.get("items")).compareTo((Integer) a.get("items")))
                .toList();
        
        stats.put("itemsPorTipo", itemsPorTipo);
        stats.put("tiposUnicos", itemsPorTipo.size());
        
        // === POR ESPACIO ===
        Map<Long, Map<String, Object>> itemsPorEspacioMap = new HashMap<>();
        allItems.stream()
                .filter(item -> item.getEspacio() != null)
                .forEach(item -> {
                    Long espacioIdItem = item.getEspacio().getId();
                    String espacioNombre = item.getEspacio().getNombre();
                    itemsPorEspacioMap.putIfAbsent(espacioIdItem, new HashMap<>());
                    Map<String, Object> espacioData = itemsPorEspacioMap.get(espacioIdItem);
                    espacioData.put("espacioId", espacioIdItem);
                    espacioData.put("espacioNombre", espacioNombre);
                    espacioData.put("cantidad", ((Integer) espacioData.getOrDefault("cantidad", 0)) + item.getCantidad());
                    espacioData.put("items", ((Integer) espacioData.getOrDefault("items", 0)) + 1);
                    espacioData.put("disponibles", ((Integer) espacioData.getOrDefault("disponibles", 0)) + ("DISPONIBLE".equals(item.getEstado()) ? 1 : 0));
                    espacioData.put("mantenimiento", ((Integer) espacioData.getOrDefault("mantenimiento", 0)) + ("MANTENIMIENTO".equals(item.getEstado()) ? 1 : 0));
                    espacioData.put("danados", ((Integer) espacioData.getOrDefault("danados", 0)) + ("DANADO".equals(item.getEstado()) ? 1 : 0));
                });
        
        List<Map<String, Object>> itemsPorEspacio = itemsPorEspacioMap.values().stream()
                .sorted((a, b) -> ((Integer) b.get("items")).compareTo((Integer) a.get("items")))
                .toList();
        
        stats.put("itemsPorEspacio", itemsPorEspacio);
        stats.put("espaciosConInventario", itemsPorEspacio.size());
        
        // === TOP RANKINGS ===
        List<Map<String, Object>> topEspacios = itemsPorEspacio.stream().limit(10).toList();
        List<Map<String, Object>> topTipos = itemsPorTipo.stream().limit(10).toList();
        
        List<Map<String, Object>> espaciosConMasProblemas = itemsPorEspacio.stream()
                .map(espacio -> {
                    int problemas = ((Integer) espacio.getOrDefault("mantenimiento", 0)) + ((Integer) espacio.getOrDefault("danados", 0));
                    int itemsEspacio = (Integer) espacio.get("items");
                    double porcentaje = itemsEspacio > 0 ? (problemas * 100.0 / itemsEspacio) : 0;
                    Map<String, Object> result = new HashMap<>(espacio);
                    result.put("problemas", problemas);
                    result.put("porcentaje", porcentaje);
                    return result;
                })
                .filter(e -> ((Integer) e.get("problemas")) > 0)
                .sorted((a, b) -> ((Integer) b.get("problemas")).compareTo((Integer) a.get("problemas")))
                .limit(10)
                .toList();
        
        List<Map<String, Object>> tiposConMasProblemas = itemsPorTipo.stream()
                .map(tipo -> {
                    int problemas = ((Integer) tipo.getOrDefault("mantenimiento", 0)) + ((Integer) tipo.getOrDefault("danados", 0));
                    int itemsTipo = (Integer) tipo.get("items");
                    double porcentaje = itemsTipo > 0 ? (problemas * 100.0 / itemsTipo) : 0;
                    Map<String, Object> result = new HashMap<>(tipo);
                    result.put("problemas", problemas);
                    result.put("porcentaje", porcentaje);
                    return result;
                })
                .filter(t -> ((Integer) t.get("problemas")) > 0)
                .sorted((a, b) -> ((Integer) b.get("problemas")).compareTo((Integer) a.get("problemas")))
                .limit(10)
                .toList();
        
        stats.put("topEspacios", topEspacios);
        stats.put("topTipos", topTipos);
        stats.put("espaciosConMasProblemas", espaciosConMasProblemas);
        stats.put("tiposConMasProblemas", tiposConMasProblemas);
        
        // === PROMEDIOS ===
        double promedioItemsPorEspacio = !itemsPorEspacio.isEmpty() ? (double) totalItems / itemsPorEspacio.size() : 0;
        double promedioCantidadPorItem = totalItems > 0 ? (double) totalCantidad / totalItems : 0;
        double promedioItemsPorTipo = !itemsPorTipo.isEmpty() ? (double) totalItems / itemsPorTipo.size() : 0;
        double promedioCantidadPorEspacio = !itemsPorEspacio.isEmpty() ? (double) totalCantidad / itemsPorEspacio.size() : 0;
        double promedioCantidadPorTipo = !itemsPorTipo.isEmpty() ? (double) totalCantidad / itemsPorTipo.size() : 0;
        
        stats.put("promedioItemsPorEspacio", promedioItemsPorEspacio);
        stats.put("promedioCantidadPorItem", promedioCantidadPorItem);
        stats.put("promedioItemsPorTipo", promedioItemsPorTipo);
        stats.put("promedioCantidadPorEspacio", promedioCantidadPorEspacio);
        stats.put("promedioCantidadPorTipo", promedioCantidadPorTipo);
        
        // === ANÁLISIS TEMPORAL ===
        int itemsCreadosEsteMes = (int) allItems.stream()
                .filter(item -> item.getCreatedAt() != null && item.getCreatedAt().isAfter(inicioMesInstant))
                .count();
        
        int itemsCreadosEsteAnio = (int) allItems.stream()
                .filter(item -> item.getCreatedAt() != null && item.getCreatedAt().isAfter(inicioAnioInstant))
                .count();
        
        int itemsCreadosUltimos6Meses = (int) allItems.stream()
                .filter(item -> item.getCreatedAt() != null && item.getCreatedAt().isAfter(hace6Meses))
                .count();
        
        int itemsCreadosUltimos12Meses = (int) allItems.stream()
                .filter(item -> item.getCreatedAt() != null && item.getCreatedAt().isAfter(hace12Meses))
                .count();
        
        int itemsActualizadosEsteMes = (int) allItems.stream()
                .filter(item -> item.getUpdatedAt() != null && item.getUpdatedAt().isAfter(inicioMesInstant))
                .count();
        
        int itemsActualizadosUltimos7Dias = (int) allItems.stream()
                .filter(item -> item.getUpdatedAt() != null && item.getUpdatedAt().isAfter(ahora.minusSeconds(7 * 24 * 3600L)))
                .count();
        
        stats.put("itemsCreadosEsteMes", itemsCreadosEsteMes);
        stats.put("itemsCreadosEsteAnio", itemsCreadosEsteAnio);
        stats.put("itemsCreadosUltimos6Meses", itemsCreadosUltimos6Meses);
        stats.put("itemsCreadosUltimos12Meses", itemsCreadosUltimos12Meses);
        stats.put("itemsActualizadosEsteMes", itemsActualizadosEsteMes);
        stats.put("itemsActualizadosUltimos7Dias", itemsActualizadosUltimos7Dias);
        
        // === ANÁLISIS DE EDAD ===
        int itemsRecientes = (int) allItems.stream()
                .filter(item -> item.getCreatedAt() != null && item.getCreatedAt().isAfter(hace30Dias))
                .count();
        
        int itemsJovenes = (int) allItems.stream()
                .filter(item -> item.getCreatedAt() != null && item.getCreatedAt().isAfter(hace3Meses))
                .count();
        
        int itemsViejos = (int) allItems.stream()
                .filter(item -> item.getCreatedAt() != null && item.getCreatedAt().isBefore(hace1Anio))
                .count();
        
        double promedioAntiguedadDias = allItems.stream()
                .filter(item -> item.getCreatedAt() != null)
                .mapToLong(item -> ChronoUnit.DAYS.between(item.getCreatedAt(), ahora))
                .average()
                .orElse(0);
        
        double promedioTiempoSinActualizarDias = allItems.stream()
                .filter(item -> item.getUpdatedAt() != null)
                .mapToLong(item -> ChronoUnit.DAYS.between(item.getUpdatedAt(), ahora))
                .average()
                .orElse(0);
        
        int itemsSinActualizarMasDe6Meses = (int) allItems.stream()
                .filter(item -> item.getUpdatedAt() != null && item.getUpdatedAt().isBefore(hace6Meses))
                .count();
        
        stats.put("itemsRecientes", itemsRecientes);
        stats.put("itemsJovenes", itemsJovenes);
        stats.put("itemsViejos", itemsViejos);
        stats.put("promedioAntiguedadDias", promedioAntiguedadDias);
        stats.put("promedioTiempoSinActualizarDias", promedioTiempoSinActualizarDias);
        stats.put("itemsSinActualizarMasDe6Meses", itemsSinActualizarMasDe6Meses);
        
        // === SALUD DEL INVENTARIO ===
        double ratioSalud = totalItems > 0 ? (disponibles * 100.0 / totalItems) : 0;
        double ratioProblemas = totalItems > 0 ? ((mantenimiento + danados) * 100.0 / totalItems) : 0;
        double ratioAsignacion = totalItems > 0 ? (asignados * 100.0 / totalItems) : 0;
        long totalEspacios = allEspacios.size();
        double indiceCobertura = totalEspacios > 0 ? (itemsPorEspacio.size() * 100.0 / totalEspacios) : 0;
        
        stats.put("ratioSalud", ratioSalud);
        stats.put("ratioProblemas", ratioProblemas);
        stats.put("ratioAsignacion", ratioAsignacion);
        stats.put("indiceCobertura", indiceCobertura);
        
        // === ITEMS CRÍTICOS ===
        int itemsSinAsignarConProblemas = (int) allItems.stream()
                .filter(item -> item.getEspacio() == null && ("MANTENIMIENTO".equals(item.getEstado()) || "DANADO".equals(item.getEstado())))
                .count();
        
        int itemsCriticos = itemsSinAsignarConProblemas + danados;
        
        long espaciosSinInventario = allEspacios.stream()
                .filter(espacio -> itemsPorEspacioMap.keySet().stream().noneMatch(id -> id.equals(espacio.getId())))
                .count();
        
        long tiposSinItems = allTiposElemento.stream()
                .filter(tipo -> itemsPorTipoMap.keySet().stream().noneMatch(id -> id.equals(tipo.getId())))
                .count();
        
        stats.put("itemsCriticos", itemsCriticos);
        stats.put("itemsSinAsignarConProblemas", itemsSinAsignarConProblemas);
        stats.put("espaciosSinInventario", espaciosSinInventario);
        stats.put("tiposSinItems", tiposSinItems);
        
        // === ANÁLISIS DE DISTRIBUCIÓN ===
        int espaciosConSoloDisponibles = (int) itemsPorEspacio.stream()
                .filter(espacio -> ((Integer) espacio.getOrDefault("disponibles", 0)) > 0 
                        && ((Integer) espacio.getOrDefault("mantenimiento", 0)) == 0 
                        && ((Integer) espacio.getOrDefault("danados", 0)) == 0)
                .count();
        
        int espaciosConSoloMantenimiento = (int) itemsPorEspacio.stream()
                .filter(espacio -> ((Integer) espacio.getOrDefault("mantenimiento", 0)) > 0 
                        && ((Integer) espacio.getOrDefault("disponibles", 0)) == 0 
                        && ((Integer) espacio.getOrDefault("danados", 0)) == 0)
                .count();
        
        int espaciosConSoloDanados = (int) itemsPorEspacio.stream()
                .filter(espacio -> ((Integer) espacio.getOrDefault("danados", 0)) > 0 
                        && ((Integer) espacio.getOrDefault("disponibles", 0)) == 0 
                        && ((Integer) espacio.getOrDefault("mantenimiento", 0)) == 0)
                .count();
        
        int espaciosConMezclaEstados = (int) itemsPorEspacio.stream()
                .filter(espacio -> {
                    int tieneDisponibles = ((Integer) espacio.getOrDefault("disponibles", 0)) > 0 ? 1 : 0;
                    int tieneMantenimiento = ((Integer) espacio.getOrDefault("mantenimiento", 0)) > 0 ? 1 : 0;
                    int tieneDanados = ((Integer) espacio.getOrDefault("danados", 0)) > 0 ? 1 : 0;
                    return tieneDisponibles + tieneMantenimiento + tieneDanados > 1;
                })
                .count();
        
        int tiposConSoloDisponibles = (int) itemsPorTipo.stream()
                .filter(tipo -> ((Integer) tipo.getOrDefault("disponibles", 0)) > 0 
                        && ((Integer) tipo.getOrDefault("mantenimiento", 0)) == 0 
                        && ((Integer) tipo.getOrDefault("danados", 0)) == 0)
                .count();
        
        int tiposConSoloMantenimiento = (int) itemsPorTipo.stream()
                .filter(tipo -> ((Integer) tipo.getOrDefault("mantenimiento", 0)) > 0 
                        && ((Integer) tipo.getOrDefault("disponibles", 0)) == 0 
                        && ((Integer) tipo.getOrDefault("danados", 0)) == 0)
                .count();
        
        int tiposConSoloDanados = (int) itemsPorTipo.stream()
                .filter(tipo -> ((Integer) tipo.getOrDefault("danados", 0)) > 0 
                        && ((Integer) tipo.getOrDefault("disponibles", 0)) == 0 
                        && ((Integer) tipo.getOrDefault("mantenimiento", 0)) == 0)
                .count();
        
        int tiposConMezclaEstados = (int) itemsPorTipo.stream()
                .filter(tipo -> {
                    int tieneDisponibles = ((Integer) tipo.getOrDefault("disponibles", 0)) > 0 ? 1 : 0;
                    int tieneMantenimiento = ((Integer) tipo.getOrDefault("mantenimiento", 0)) > 0 ? 1 : 0;
                    int tieneDanados = ((Integer) tipo.getOrDefault("danados", 0)) > 0 ? 1 : 0;
                    return tieneDisponibles + tieneMantenimiento + tieneDanados > 1;
                })
                .count();
        
        stats.put("espaciosConSoloDisponibles", espaciosConSoloDisponibles);
        stats.put("espaciosConSoloMantenimiento", espaciosConSoloMantenimiento);
        stats.put("espaciosConSoloDanados", espaciosConSoloDanados);
        stats.put("espaciosConMezclaEstados", espaciosConMezclaEstados);
        stats.put("tiposConSoloDisponibles", tiposConSoloDisponibles);
        stats.put("tiposConSoloMantenimiento", tiposConSoloMantenimiento);
        stats.put("tiposConSoloDanados", tiposConSoloDanados);
        stats.put("tiposConMezclaEstados", tiposConMezclaEstados);
        
        // === ANÁLISIS DE CANTIDAD ===
        int itemsConCantidad1 = (int) allItems.stream().filter(item -> item.getCantidad() == 1).count();
        int itemsConCantidadAlta = (int) allItems.stream().filter(item -> item.getCantidad() > 10).count();
        int itemsConCantidadMedia = (int) allItems.stream().filter(item -> item.getCantidad() >= 2 && item.getCantidad() <= 10).count();
        int cantidadMaxima = allItems.stream().mapToInt(InventarioItem::getCantidad).max().orElse(0);
        int cantidadMinima = allItems.stream().mapToInt(InventarioItem::getCantidad).min().orElse(0);
        
        stats.put("itemsConCantidad1", itemsConCantidad1);
        stats.put("itemsConCantidadAlta", itemsConCantidadAlta);
        stats.put("itemsConCantidadMedia", itemsConCantidadMedia);
        stats.put("cantidadMaxima", cantidadMaxima);
        stats.put("cantidadMinima", cantidadMinima);
        stats.put("cantidadTotalPromedio", promedioCantidadPorItem);
        
        // === ESTADÍSTICAS DE OBSERVACIONES ===
        int itemsConObservaciones = (int) allItems.stream()
                .filter(item -> item.getObservaciones() != null && !item.getObservaciones().trim().isEmpty())
                .count();
        int itemsSinObservaciones = totalItems - itemsConObservaciones;
        double porcentajeConObservaciones = totalItems > 0 ? (itemsConObservaciones * 100.0 / totalItems) : 0;
        
        stats.put("itemsConObservaciones", itemsConObservaciones);
        stats.put("itemsSinObservaciones", itemsSinObservaciones);
        stats.put("porcentajeConObservaciones", porcentajeConObservaciones);
        
        // === COMPARATIVAS ===
        int itemsMesAnterior = (int) allItems.stream()
                .filter(item -> item.getCreatedAt() != null 
                        && item.getCreatedAt().isAfter(inicioMesAnteriorInstant) 
                        && item.getCreatedAt().isBefore(finMesAnterior))
                .count();
        
        int diferenciaMesAnterior = itemsCreadosEsteMes - itemsMesAnterior;
        double porcentajeCambioMesAnterior = itemsMesAnterior > 0 ? (diferenciaMesAnterior * 100.0 / itemsMesAnterior) : 0;
        
        int itemsAnioAnterior = (int) allItems.stream()
                .filter(item -> item.getCreatedAt() != null 
                        && item.getCreatedAt().isAfter(inicioAnioAnteriorInstant) 
                        && item.getCreatedAt().isBefore(finAnioAnterior))
                .count();
        
        int diferenciaAnioAnterior = itemsCreadosEsteAnio - itemsAnioAnterior;
        double porcentajeCambioAnioAnterior = itemsAnioAnterior > 0 ? (diferenciaAnioAnterior * 100.0 / itemsAnioAnterior) : 0;
        
        stats.put("diferenciaMesAnterior", diferenciaMesAnterior);
        stats.put("porcentajeCambioMesAnterior", porcentajeCambioMesAnterior);
        stats.put("diferenciaAnioAnterior", diferenciaAnioAnterior);
        stats.put("porcentajeCambioAnioAnterior", porcentajeCambioAnioAnterior);
        
        // === EFICIENCIA ===
        double eficienciaAsignacion = totalEspacios > 0 ? (itemsPorEspacio.size() * 100.0 / totalEspacios) : 0;
        double densidadInventario = promedioItemsPorEspacio;
        int top5EspaciosCantidad = topEspacios.stream()
                .limit(5)
                .mapToInt(espacio -> ((Integer) espacio.get("cantidad")))
                .sum();
        double concentracionInventario = totalCantidad > 0 ? (top5EspaciosCantidad * 100.0 / totalCantidad) : 0;
        
        stats.put("eficienciaAsignacion", eficienciaAsignacion);
        stats.put("densidadInventario", densidadInventario);
        stats.put("concentracionInventario", concentracionInventario);
        
        log.info("Estadísticas calculadas exitosamente - Total items: {}", totalItems);
        return stats;
    }
}
