package com.utec.backend.service;

import com.utec.backend.dto.recomendacion.RecomendacionInventarioDto;
import com.utec.backend.model.InventarioItem;
import com.utec.backend.model.ReservaItemSolicitado;
import com.utec.backend.model.TipoRecomendacion;
import com.utec.backend.repository.InventarioItemRepository;
import com.utec.backend.repository.ReservaItemSolicitadoRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.Instant;
import java.util.*;
import java.util.Comparator;
import java.util.stream.Collectors;

/**
 * Servicio para recomendaciones de inventario y mantenimiento
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class RecomendacionInventarioService {
    
    private final InventarioItemRepository inventarioItemRepository;
    private final ReservaItemSolicitadoRepository reservaItemSolicitadoRepository;
    
    /**
     * Obtener items que necesitan mantenimiento urgente
     */
    @Transactional(readOnly = true)
    public List<RecomendacionInventarioDto> obtenerItemsMantenimientoUrgente() {
        log.debug("Obteniendo items que necesitan mantenimiento urgente");
        
        List<InventarioItem> itemsMantenimiento = inventarioItemRepository.findByEstadoAndActivoTrue("MANTENIMIENTO");
        Instant ahora = Instant.now();
        
        return itemsMantenimiento.stream()
            .map(item -> {
                long diasEnMantenimiento = Duration.between(item.getUpdatedAt(), ahora).toDays();
                double urgencia = calcularUrgenciaMantenimiento(diasEnMantenimiento);
                
                RecomendacionInventarioDto dto = new RecomendacionInventarioDto();
                dto.setTipoRecomendacion(TipoRecomendacion.ITEM_MANTENIMIENTO_URGENTE);
                dto.setPuntaje(BigDecimal.valueOf(urgencia).setScale(2, RoundingMode.HALF_UP));
                dto.setRazon(String.format("Item en mantenimiento hace %d días", diasEnMantenimiento));
                dto.setInventarioItemId(item.getId());
                dto.setTipoElementoId(item.getTipoElemento().getId());
                dto.setTipoElementoNombre(item.getTipoElemento().getNombre());
                dto.setCantidad(item.getCantidad());
                dto.setEstado(item.getEstado());
                dto.setFechaUltimoMantenimiento(item.getUpdatedAt());
                dto.setDiasEnMantenimiento(diasEnMantenimiento);
                if (item.getEspacio() != null) {
                    dto.setEspacioId(item.getEspacio().getId());
                    dto.setEspacioNombre(item.getEspacio().getNombre());
                    dto.setEspacioAsignado(true);
                } else {
                    dto.setEspacioAsignado(false);
                }
                return dto;
            })
            .sorted((a, b) -> b.getPuntaje().compareTo(a.getPuntaje()))
            .limit(20)
            .toList();
    }
    
    /**
     * Obtener espacios que requieren atención
     */
    @Transactional(readOnly = true)
    public List<RecomendacionInventarioDto> obtenerEspaciosAtencion() {
        log.debug("Obteniendo espacios que requieren atención");
        
        List<InventarioItem> todosItems = inventarioItemRepository.findAll().stream()
            .filter(InventarioItem::getActivo)
            .toList();
        
        // Agrupar por espacio
        Map<Long, List<InventarioItem>> itemsPorEspacio = todosItems.stream()
            .filter(item -> item.getEspacio() != null)
            .collect(Collectors.groupingBy(item -> item.getEspacio().getId()));
        
        List<RecomendacionInventarioDto> recomendaciones = new ArrayList<>();
        
        for (Map.Entry<Long, List<InventarioItem>> entry : itemsPorEspacio.entrySet()) {
            List<InventarioItem> items = entry.getValue();
            long itemsDanados = items.stream().filter(i -> "DANADO".equals(i.getEstado())).count();
            long itemsMantenimiento = items.stream().filter(i -> "MANTENIMIENTO".equals(i.getEstado())).count();
            long totalProblemas = itemsDanados + itemsMantenimiento;
            
            if (totalProblemas > 0) {
                double porcentajeProblemas = (totalProblemas / (double) items.size()) * 100;
                double urgencia = Math.min(porcentajeProblemas / 50.0, 1.0); // Normalizar
                
                RecomendacionInventarioDto dto = new RecomendacionInventarioDto();
                dto.setTipoRecomendacion(TipoRecomendacion.ESPACIO_ATENCION);
                dto.setPuntaje(BigDecimal.valueOf(urgencia).setScale(2, RoundingMode.HALF_UP));
                dto.setRazon(String.format("Espacio con %d items dañados y %d en mantenimiento (%.1f%% del inventario)", 
                    itemsDanados, itemsMantenimiento, porcentajeProblemas));
                dto.setEspacioId(entry.getKey());
                dto.setEspacioNombre(items.get(0).getEspacio().getNombre());
                dto.setEspacioAsignado(true);
                recomendaciones.add(dto);
            }
        }
        
        return recomendaciones.stream()
            .sorted((a, b) -> b.getPuntaje().compareTo(a.getPuntaje()))
            .limit(10)
            .toList();
    }
    
    /**
     * Obtener recomendaciones de reasignación de items
     */
    @Transactional(readOnly = true)
    public List<RecomendacionInventarioDto> obtenerReasignacionesRecomendadas() {
        log.debug("Obteniendo recomendaciones de reasignación de items");
        
        // Items sin asignar
        List<InventarioItem> itemsSinAsignar = inventarioItemRepository.findAll().stream()
            .filter(InventarioItem::getActivo)
            .filter(item -> item.getEspacio() == null)
            .toList();
        
        // Analizar uso de items por espacio
        List<ReservaItemSolicitado> itemsSolicitados = reservaItemSolicitadoRepository.findAll();
        Map<Long, Map<Long, Long>> usoPorEspacioYTipo = new HashMap<>();
        
        for (ReservaItemSolicitado ris : itemsSolicitados) {
            if (ris.getReserva().getEspacio() != null && ris.getTipoElemento() != null) {
                Long espacioId = ris.getReserva().getEspacio().getId();
                Long tipoId = ris.getTipoElemento().getId();
                usoPorEspacioYTipo.computeIfAbsent(espacioId, k -> new HashMap<>())
                    .put(tipoId, usoPorEspacioYTipo.get(espacioId).getOrDefault(tipoId, 0L) + 1);
            }
        }
        
        List<RecomendacionInventarioDto> recomendaciones = new ArrayList<>();
        
        for (InventarioItem item : itemsSinAsignar) {
            // Buscar espacio que más necesita este tipo de item
            Long tipoId = item.getTipoElemento().getId();
            Optional<Map.Entry<Long, Map<Long, Long>>> mejorEspacio = usoPorEspacioYTipo.entrySet().stream()
                .filter(e -> e.getValue().containsKey(tipoId))
                .max(Comparator.comparing(e -> e.getValue().getOrDefault(tipoId, 0L)));
            
            if (mejorEspacio.isPresent()) {
                Long espacioId = mejorEspacio.get().getKey();
                Long frecuencia = mejorEspacio.get().getValue().get(tipoId);
                RecomendacionInventarioDto dto = new RecomendacionInventarioDto();
                dto.setTipoRecomendacion(TipoRecomendacion.REASIGNACION_ITEM);
                dto.setPuntaje(BigDecimal.valueOf(0.8).setScale(2, RoundingMode.HALF_UP));
                dto.setRazon(String.format("Este item se solicita frecuentemente en este espacio (%d solicitudes)", 
                    frecuencia));
                dto.setInventarioItemId(item.getId());
                dto.setTipoElementoId(item.getTipoElemento().getId());
                dto.setTipoElementoNombre(item.getTipoElemento().getNombre());
                dto.setCantidad(item.getCantidad());
                dto.setEspacioRecomendadoId(espacioId);
                recomendaciones.add(dto);
            }
        }
        
        return recomendaciones.stream()
            .sorted((a, b) -> b.getPuntaje().compareTo(a.getPuntaje()))
            .limit(10)
            .toList();
    }
    
    /**
     * Obtener recomendaciones de compras necesarias
     */
    @Transactional(readOnly = true)
    public List<RecomendacionInventarioDto> obtenerComprasNecesarias() {
        log.debug("Obteniendo recomendaciones de compras necesarias");
        
        // Analizar frecuencia de solicitudes vs stock disponible
        List<ReservaItemSolicitado> itemsSolicitados = reservaItemSolicitadoRepository.findAll();
        Map<Long, Long> frecuenciaPorTipo = itemsSolicitados.stream()
            .filter(ris -> ris.getTipoElemento() != null)
            .collect(Collectors.groupingBy(
                ris -> ris.getTipoElemento().getId(),
                Collectors.counting()
            ));
        
        Map<Long, Integer> stockPorTipo = inventarioItemRepository.findAll().stream()
            .filter(InventarioItem::getActivo)
            .filter(item -> "DISPONIBLE".equals(item.getEstado()))
            .filter(item -> item.getTipoElemento() != null)
            .collect(Collectors.groupingBy(
                item -> item.getTipoElemento().getId(),
                Collectors.summingInt(InventarioItem::getCantidad)
            ));
        
        List<RecomendacionInventarioDto> recomendaciones = new ArrayList<>();
        
        for (Map.Entry<Long, Long> entry : frecuenciaPorTipo.entrySet()) {
            Long tipoId = entry.getKey();
            Long frecuencia = entry.getValue();
            Integer stock = stockPorTipo.getOrDefault(tipoId, 0);
            
            // Si la frecuencia es alta y el stock es bajo
            if (frecuencia > 10 && stock < 5) {
                RecomendacionInventarioDto dto = new RecomendacionInventarioDto();
                dto.setTipoRecomendacion(TipoRecomendacion.COMPRA_NECESARIA);
                double urgencia = Math.min((frecuencia - stock) / 10.0, 1.0);
                dto.setPuntaje(BigDecimal.valueOf(urgencia).setScale(2, RoundingMode.HALF_UP));
                dto.setRazon(String.format("Alta demanda (%d solicitudes) y bajo stock (%d disponibles)", 
                    frecuencia, stock));
                dto.setTipoElementoId(tipoId);
                dto.setCantidadNecesaria((int) (frecuencia / 2)); // Recomendar mitad de la frecuencia
                dto.setStockActual(stock);
                dto.setFrecuenciaUso(frecuencia.intValue());
                recomendaciones.add(dto);
            }
        }
        
        return recomendaciones.stream()
            .sorted((a, b) -> b.getPuntaje().compareTo(a.getPuntaje()))
            .limit(10)
            .toList();
    }
    
    private double calcularUrgenciaMantenimiento(long diasEnMantenimiento) {
        if (diasEnMantenimiento < 7) return 0.3;
        if (diasEnMantenimiento < 15) return 0.6;
        if (diasEnMantenimiento < 30) return 0.8;
        return 1.0; // Muy urgente
    }
}

