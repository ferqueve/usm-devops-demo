package com.utec.backend.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.utec.backend.dto.recomendacion.*;
import com.utec.backend.model.Espacio;
import com.utec.backend.model.Recomendacion;
import com.utec.backend.model.TipoRecomendacion;
import com.utec.backend.model.Usuario;
import com.utec.backend.repository.EspacioRepository;
import com.utec.backend.repository.RecomendacionRepository;
import com.utec.backend.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Servicio principal para gestionar recomendaciones inteligentes
 * Coordina los diferentes tipos de recomendaciones y maneja caché
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class RecomendacionService {
    
    private final RecomendacionRepository recomendacionRepository;
    private final UsuarioRepository usuarioRepository;
    private final EspacioRepository espacioRepository;
    private final RedisTemplate<String, Object> redisTemplate;
    private final ObjectMapper objectMapper;
    
    // Servicios auxiliares
    private final RecomendacionReservaService recomendacionReservaService;
    private final RecomendacionInventarioService recomendacionInventarioService;
    private final RecomendacionItemService recomendacionItemService;
    private final RecomendacionAnalistaService recomendacionAnalistaService;
    
    // Claves de caché
    private static final String CACHE_RECOMENDACIONES = "recomendaciones:usuario:";
    
    
    /**
     * Invalidar caché de recomendaciones para un usuario
     */
    @CacheEvict(value = "recomendaciones", key = "#usuarioId")
    public void invalidarCacheRecomendaciones(Long usuarioId) {
        String cacheKey = CACHE_RECOMENDACIONES + usuarioId;
        redisTemplate.delete(cacheKey);
        log.debug("Caché de recomendaciones invalidado para usuario: {}", usuarioId);
    }
    
    /**
     * Guardar top 20 recomendaciones en BD
     */
    @Transactional
    public void guardarTop20EnBD(Long usuarioId, List<RecomendacionEspacioDto> recomendaciones) {
        try {
            // Eliminar recomendaciones antiguas de este usuario
            recomendacionRepository.deleteByUsuarioId(usuarioId);
            
            // Guardar nuevas (solo top 20)
            Usuario usuario = usuarioRepository.getReferenceById(usuarioId);
            List<Recomendacion> paraGuardar = recomendaciones.stream()
                .limit(20)
                .map(dto -> {
                    Recomendacion rec = new Recomendacion();
                    rec.setUsuario(usuario);
                    Espacio espacio = espacioRepository.getReferenceById(dto.getEspacioId());
                    rec.setEspacio(espacio);
                    rec.setTipoRecomendacion(dto.getTipoRecomendacion());
                    rec.setPuntaje(dto.getPuntaje());
                    rec.setRazon(dto.getRazon());
                    try {
                        Map<String, Object> metadata = new HashMap<>();
                        metadata.put("capacidad", dto.getCapacidad());
                        metadata.put("tipoEspacioId", dto.getTipoEspacioId());
                        rec.setMetadata(objectMapper.writeValueAsString(metadata));
                    } catch (JsonProcessingException e) {
                        log.warn("Error serializando metadata: {}", e.getMessage());
                    }
                    return rec;
                })
                .toList();
            
            recomendacionRepository.saveAll(paraGuardar);
            log.debug("Guardadas {} recomendaciones top en BD para usuario {}", 
                     paraGuardar.size(), usuarioId);
        } catch (Exception e) {
            log.error("Error guardando recomendaciones en BD para usuario {}: {}", usuarioId, e.getMessage());
        }
    }
    
    // Métodos delegados a servicios auxiliares
    
    public List<RecomendacionEspacioDto> obtenerRecomendacionesEspacios(
            Long usuarioId, Instant inicio, Instant fin, Integer capacidad) {
        return recomendacionReservaService.obtenerRecomendacionesEspacios(usuarioId, inicio, fin, capacidad);
    }
    
    public List<HorarioRecomendadoDto> obtenerHorariosOptimos(
            Long usuarioId, Long espacioId, Instant fecha) {
        return recomendacionReservaService.obtenerHorariosOptimos(usuarioId, espacioId, fecha);
    }
    
    public List<RecomendacionEspacioDto> obtenerEspaciosSimilares(Long espacioId, Long usuarioId) {
        return recomendacionReservaService.obtenerEspaciosSimilares(espacioId, usuarioId);
    }
    
    public List<RecomendacionInventarioDto> obtenerItemsMantenimientoUrgente() {
        return recomendacionInventarioService.obtenerItemsMantenimientoUrgente();
    }
    
    public List<RecomendacionInventarioDto> obtenerEspaciosAtencion() {
        return recomendacionInventarioService.obtenerEspaciosAtencion();
    }
    
    public List<RecomendacionInventarioDto> obtenerReasignacionesRecomendadas() {
        return recomendacionInventarioService.obtenerReasignacionesRecomendadas();
    }
    
    public List<RecomendacionInventarioDto> obtenerComprasNecesarias() {
        return recomendacionInventarioService.obtenerComprasNecesarias();
    }
    
    public List<RecomendacionItemDto> obtenerItemsRecomendadosParaReserva(Long espacioId, Long usuarioId) {
        return recomendacionItemService.obtenerItemsRecomendadosParaReserva(espacioId, usuarioId);
    }
    
    public List<RecomendacionItemDto> obtenerCombinacionesItems(Long espacioId) {
        return recomendacionItemService.obtenerCombinacionesItems(espacioId);
    }
    
    public List<RecomendacionAnalistaDto> obtenerAnalistaRecomendado(Long docenteId) {
        return recomendacionAnalistaService.obtenerAnalistaRecomendado(docenteId);
    }
    
    public List<RecomendacionAnalistaDto> obtenerReservasPrioritarias(Long analistaId) {
        return recomendacionAnalistaService.obtenerReservasPrioritarias(analistaId);
    }
    
    /**
     * Obtener recomendaciones del dashboard personalizadas por rol
     */
    @Transactional(readOnly = true)
    public DashboardRecomendacionesDto obtenerRecomendacionesDashboard(Long usuarioId, Usuario.RolApp rol) {
        DashboardRecomendacionesDto dto = new DashboardRecomendacionesDto();
        
        switch (rol) {
            case DOCENTE:
                // Para docentes: espacios recomendados e items
                Instant ahora = Instant.now();
                Instant finSemana = ahora.plusSeconds(7L * 24 * 3600);
                dto.setEspaciosRecomendados(
                    obtenerRecomendacionesEspacios(usuarioId, ahora, finSemana, null)
                );
                break;
            case ANALISTA:
                // Para analistas: reservas prioritarias
                dto.setReservasPrioritarias(obtenerReservasPrioritarias(usuarioId));
                break;
            case MANTENIMIENTO, ADMIN:
                // Para mantenimiento y admin: items urgentes y espacios que requieren atención
                dto.setMantenimientoUrgente(obtenerItemsMantenimientoUrgente());
                dto.setEspaciosRecomendados(
                    obtenerEspaciosAtencion().stream()
                        .map(inv -> {
                            RecomendacionEspacioDto esp = new RecomendacionEspacioDto();
                            esp.setEspacioId(inv.getEspacioId());
                            esp.setEspacioNombre(inv.getEspacioNombre());
                            esp.setTipoRecomendacion(TipoRecomendacion.ESPACIO_ATENCION);
                            esp.setPuntaje(inv.getPuntaje());
                            esp.setRazon(inv.getRazon());
                            return esp;
                        })
                        .toList()
                );
                break;
            case ESTUDIANTE, EXTERNO:
            default:
                // Para estudiantes y externos: no hay recomendaciones específicas
                break;
        }
        
        int total = (dto.getEspaciosRecomendados() != null ? dto.getEspaciosRecomendados().size() : 0) +
                   (dto.getItemsRecomendados() != null ? dto.getItemsRecomendados().size() : 0) +
                   (dto.getMantenimientoUrgente() != null ? dto.getMantenimientoUrgente().size() : 0) +
                   (dto.getReservasPrioritarias() != null ? dto.getReservasPrioritarias().size() : 0);
        dto.setTotalRecomendaciones(total);
        
        return dto;
    }
}

