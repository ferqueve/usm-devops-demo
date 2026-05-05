package com.utec.backend.service;

import com.utec.backend.dto.recomendacion.RecomendacionItemDto;
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
import java.util.*;
import java.util.stream.Collectors;

/**
 * Servicio para recomendaciones de items en reservas
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class RecomendacionItemService {
    
    private final ReservaItemSolicitadoRepository reservaItemSolicitadoRepository;
    private final InventarioItemRepository inventarioItemRepository;
    
    /**
     * Obtener items recomendados para una reserva en un espacio
     */
    @Transactional(readOnly = true)
    public List<RecomendacionItemDto> obtenerItemsRecomendadosParaReserva(Long espacioId, Long usuarioId) {
        log.debug("Obteniendo items recomendados para reserva en espacio {} para usuario {}", espacioId, usuarioId);
        
        // 1. Obtener items más solicitados para este espacio
        List<ReservaItemSolicitado> itemsSolicitados = reservaItemSolicitadoRepository.findAll();
        Map<Long, Long> frecuenciaPorTipo = itemsSolicitados.stream()
            .filter(ris -> ris.getReserva() != null && ris.getReserva().getEspacio() != null)
            .filter(ris -> ris.getReserva().getEspacio().getId().equals(espacioId))
            .filter(ris -> ris.getTipoElemento() != null)
            .collect(Collectors.groupingBy(
                ris -> ris.getTipoElemento().getId(),
                Collectors.counting()
            ));
        
        // 2. Obtener items disponibles en el espacio
        List<InventarioItem> itemsDisponibles = inventarioItemRepository.findByEspacioIdAndActivoTrue(espacioId);
        itemsDisponibles = itemsDisponibles.stream()
            .filter(item -> "DISPONIBLE".equals(item.getEstado()))
            .toList();
        
        // 3. Calcular recomendaciones
        List<RecomendacionItemDto> recomendaciones = new ArrayList<>();
        
        for (Map.Entry<Long, Long> entry : frecuenciaPorTipo.entrySet()) {
            Long tipoId = entry.getKey();
            Long frecuencia = entry.getValue();
            
            // Verificar disponibilidad
            Optional<InventarioItem> itemDisponible = itemsDisponibles.stream()
                .filter(item -> item.getTipoElemento().getId().equals(tipoId))
                .findFirst();
            
            double puntaje = Math.min(frecuencia / 10.0, 1.0); // Normalizar
            
            RecomendacionItemDto dto = new RecomendacionItemDto();
            dto.setTipoRecomendacion(TipoRecomendacion.ITEM_RECOMENDADO_RESERVA);
            dto.setPuntaje(BigDecimal.valueOf(puntaje).setScale(2, RoundingMode.HALF_UP));
            dto.setRazon(String.format("Solicitado en %d%% de las reservas de este espacio", 
                (frecuencia * 100) / Math.max(frecuenciaPorTipo.values().stream().mapToLong(Long::longValue).sum(), 1)));
            dto.setTipoElementoId(tipoId);
            if (itemDisponible.isPresent()) {
                dto.setTipoElementoNombre(itemDisponible.get().getTipoElemento().getNombre());
                dto.setTipoElementoDescripcion(itemDisponible.get().getTipoElemento().getDescripcion());
                dto.setDisponible(true);
                dto.setCantidadDisponible(itemDisponible.get().getCantidad());
            } else {
                dto.setDisponible(false);
                dto.setCantidadDisponible(0);
            }
            dto.setCantidadRecomendada(1);
            dto.setEspacioId(espacioId);
            recomendaciones.add(dto);
        }
        
        return recomendaciones.stream()
            .sorted((a, b) -> b.getPuntaje().compareTo(a.getPuntaje()))
            .limit(10)
            .toList();
    }
    
    /**
     * Obtener combinaciones de items frecuentes
     */
    @Transactional(readOnly = true)
    public List<RecomendacionItemDto> obtenerCombinacionesItems(Long espacioId) {
        log.debug("Obteniendo combinaciones de items para espacio {}", espacioId);
        
        // Obtener todas las reservas del espacio con items solicitados
        List<ReservaItemSolicitado> itemsSolicitados = reservaItemSolicitadoRepository.findAll();
        List<ReservaItemSolicitado> itemsDelEspacio = itemsSolicitados.stream()
            .filter(ris -> ris.getReserva() != null && ris.getReserva().getEspacio() != null)
            .filter(ris -> ris.getReserva().getEspacio().getId().equals(espacioId))
            .filter(ris -> ris.getTipoElemento() != null)
            .toList();
        
        // Agrupar por reserva para encontrar combinaciones
        Map<Long, List<Long>> itemsPorReserva = new HashMap<>();
        for (ReservaItemSolicitado ris : itemsDelEspacio) {
            itemsPorReserva.computeIfAbsent(ris.getReserva().getId(), k -> new ArrayList<>())
                .add(ris.getTipoElemento().getId());
        }
        
        // Encontrar pares de items que aparecen juntos frecuentemente
        Map<String, Long> combinaciones = new HashMap<>();
        for (List<Long> items : itemsPorReserva.values()) {
            for (int i = 0; i < items.size(); i++) {
                for (int j = i + 1; j < items.size(); j++) {
                    String combinacion = items.get(i) + "-" + items.get(j);
                    combinaciones.put(combinacion, combinaciones.getOrDefault(combinacion, 0L) + 1);
                }
            }
        }
        
        // Crear recomendaciones para las combinaciones más frecuentes
        List<RecomendacionItemDto> recomendaciones = new ArrayList<>();
        for (Map.Entry<String, Long> entry : combinaciones.entrySet()) {
            if (entry.getValue() >= 3) { // Al menos 3 veces juntos
                String[] tipos = entry.getKey().split("-");
                Long tipoId1 = Long.parseLong(tipos[0]);
                
                RecomendacionItemDto dto = new RecomendacionItemDto();
                dto.setTipoRecomendacion(TipoRecomendacion.COMBINACION_ITEMS);
                double puntaje = Math.min(entry.getValue() / 10.0, 1.0);
                dto.setPuntaje(BigDecimal.valueOf(puntaje).setScale(2, RoundingMode.HALF_UP));
                dto.setRazon(String.format("Estos items se solicitan juntos frecuentemente (%d veces)", entry.getValue()));
                dto.setTipoElementoId(tipoId1);
                dto.setEspacioId(espacioId);
                recomendaciones.add(dto);
            }
        }
        
        return recomendaciones.stream()
            .sorted((a, b) -> b.getPuntaje().compareTo(a.getPuntaje()))
            .limit(5)
            .toList();
    }
}

