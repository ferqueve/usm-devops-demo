package com.utec.backend.service;

import com.utec.backend.dto.recomendacion.RecomendacionAnalistaDto;
import com.utec.backend.model.Reserva;
import com.utec.backend.model.TipoRecomendacion;
import com.utec.backend.model.Usuario;
import com.utec.backend.repository.ReservaRepository;
import com.utec.backend.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.Instant;
import java.util.*;

/**
 * Servicio para recomendaciones de analistas y reservas prioritarias
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class RecomendacionAnalistaService {
    
    private final UsuarioRepository usuarioRepository;
    private final ReservaRepository reservaRepository;
    
    /**
     * Obtener analista recomendado para un docente
     */
    @Transactional(readOnly = true)
    public List<RecomendacionAnalistaDto> obtenerAnalistaRecomendado(Long docenteId) {
        log.debug("Obteniendo analista recomendado para docente {}", docenteId);

        // Obtener todos los analistas
        List<Usuario> analistas = usuarioRepository.findByRolAppAndDeletedAtIsNull(Usuario.RolApp.ANALISTA);

        // Obtener reservas del docente
        List<Reserva> reservasDocente = reservaRepository.findByUsuarioId(docenteId);

        // Antes este método hacía reservaRepository.findAll() DENTRO del loop por
        // analista (N × tabla completa). Ahora una sola lectura y filtramos en
        // memoria con maps indexados por analistaId.
        List<Reserva> todasReservas = reservaRepository.findAll();
        Map<Long, Long> pendientesPorAnalista = new HashMap<>();
        Map<Long, Long> aprobadasPorAnalista = new HashMap<>();
        Map<Long, Long> completadasPorAnalista = new HashMap<>();
        for (Reserva r : todasReservas) {
            if (r.getAnalistaAsignado() == null) continue;
            Long aid = r.getAnalistaAsignado().getId();
            if (r.getEstado() == Reserva.EstadoReserva.PENDIENTE) {
                pendientesPorAnalista.merge(aid, 1L, Long::sum);
            } else {
                completadasPorAnalista.merge(aid, 1L, Long::sum);
                if (r.getEstado() == Reserva.EstadoReserva.APROBADO) {
                    aprobadasPorAnalista.merge(aid, 1L, Long::sum);
                }
            }
        }

        // Calcular puntajes para cada analista
        List<RecomendacionAnalistaDto> recomendaciones = new ArrayList<>();

        for (Usuario analista : analistas) {
            // Reservas asignadas a este analista
            long reservasAsignadas = reservasDocente.stream()
                .filter(r -> r.getAnalistaAsignado() != null)
                .filter(r -> r.getAnalistaAsignado().getId().equals(analista.getId()))
                .count();

            long reservasPendientes = pendientesPorAnalista.getOrDefault(analista.getId(), 0L);
            long reservasCompletadas = completadasPorAnalista.getOrDefault(analista.getId(), 0L);
            long reservasAprobadas = aprobadasPorAnalista.getOrDefault(analista.getId(), 0L);
            double tasaAprobacion = reservasCompletadas > 0 
                ? (double) reservasAprobadas / reservasCompletadas 
                : 0.5;
            
            // Calcular puntaje
            double puntaje = 0.0;
            if (reservasAsignadas > 0) {
                puntaje += 0.4; // Ya trabajó con este docente
            }
            double cargaNormalizada = 1.0 - Math.min(reservasPendientes / 10.0, 1.0);
            puntaje += (cargaNormalizada * 0.3); // Menos carga = mejor
            puntaje += (tasaAprobacion * 0.3); // Mayor tasa de aprobación = mejor
            
            RecomendacionAnalistaDto dto = new RecomendacionAnalistaDto();
            dto.setTipoRecomendacion(TipoRecomendacion.ASIGNACION_ANALISTA);
            dto.setPuntaje(BigDecimal.valueOf(puntaje).setScale(2, RoundingMode.HALF_UP));
            dto.setRazon(generarRazonAnalista(reservasAsignadas, reservasPendientes, tasaAprobacion));
            dto.setAnalistaId(analista.getId());
            dto.setAnalistaNombre(analista.getNombre());
            dto.setAnalistaEmail(analista.getEmail());
            dto.setCargaTrabajoActual((int) reservasPendientes);
            dto.setReservasPendientes((int) reservasPendientes);
            dto.setReservasCompletadas((int) reservasCompletadas);
            dto.setTasaAprobacion(tasaAprobacion);
            recomendaciones.add(dto);
        }
        
        return recomendaciones.stream()
            .sorted((a, b) -> b.getPuntaje().compareTo(a.getPuntaje()))
            .limit(5)
            .toList();
    }
    
    /**
     * Obtener reservas prioritarias para un analista
     */
    @Transactional(readOnly = true)
    public List<RecomendacionAnalistaDto> obtenerReservasPrioritarias(Long analistaId) {
        log.debug("Obteniendo reservas prioritarias para analista {}", analistaId);

        // Antes esto hacía findAll() (descarga miles de filas y filtra en memoria),
        // costando ~5s. Reemplazado por una query JPA que filtra en SQL y trae los
        // joins necesarios de una vez.
        List<Reserva> reservasPendientes = reservaRepository.findByAnalistaAsignadoAndEstado(
            analistaId, Reserva.EstadoReserva.PENDIENTE);
        
        Instant ahora = Instant.now();
        
        List<RecomendacionAnalistaDto> recomendaciones = new ArrayList<>();
        
        for (Reserva reserva : reservasPendientes) {
            // Calcular urgencia
            long diasPendiente = Duration.between(reserva.getCreatedAt(), ahora).toDays();
            long diasHastaInicio = Duration.between(ahora, reserva.getInicio()).toDays();
            
            int urgencia = calcularUrgencia(diasPendiente, diasHastaInicio);
            double puntaje = urgencia / 10.0;
            
            RecomendacionAnalistaDto dto = new RecomendacionAnalistaDto();
            dto.setTipoRecomendacion(TipoRecomendacion.RESERVA_PRIORITARIA);
            dto.setPuntaje(BigDecimal.valueOf(puntaje).setScale(2, RoundingMode.HALF_UP));
            dto.setRazon(generarRazonPrioridad(diasPendiente, diasHastaInicio));
            dto.setReservaId(reserva.getId());
            dto.setDocenteId(reserva.getUsuario().getId());
            dto.setDocenteNombre(reserva.getUsuario().getNombre());
            dto.setDocenteEmail(reserva.getUsuario().getEmail());
            dto.setEspacioId(reserva.getEspacio().getId());
            dto.setEspacioNombre(reserva.getEspacio().getNombre());
            dto.setInicio(reserva.getInicio());
            dto.setFin(reserva.getFin());
            dto.setDiasPendiente((int) diasPendiente);
            dto.setUrgencia(urgencia);
            recomendaciones.add(dto);
        }
        
        return recomendaciones.stream()
            .sorted((a, b) -> b.getPuntaje().compareTo(a.getPuntaje()))
            .limit(10)
            .toList();
    }
    
    private int calcularUrgencia(long diasPendiente, long diasHastaInicio) {
        int urgencia = 1;
        
        // Más urgente si está pendiente hace mucho
        if (diasPendiente > 7) urgencia += 3;
        else if (diasPendiente > 3) urgencia += 2;
        else if (diasPendiente > 1) urgencia += 1;
        
        // Más urgente si la reserva es pronto
        if (diasHastaInicio < 2) urgencia += 4;
        else if (diasHastaInicio < 7) urgencia += 2;
        else if (diasHastaInicio < 14) urgencia += 1;
        
        return Math.min(urgencia, 10);
    }
    
    private String generarRazonAnalista(long reservasAsignadas, long reservasPendientes, double tasaAprobacion) {
        StringBuilder razon = new StringBuilder();
        if (reservasAsignadas > 0) {
            razon.append(String.format("Ya trabajó con este docente (%d reservas anteriores). ", reservasAsignadas));
        }
        razon.append(String.format("Carga actual: %d pendientes. ", reservasPendientes));
        razon.append(String.format("Tasa de aprobación: %.1f%%.", tasaAprobacion * 100));
        return razon.toString();
    }
    
    private String generarRazonPrioridad(long diasPendiente, long diasHastaInicio) {
        if (diasPendiente > 7 && diasHastaInicio < 2) {
            return "Muy urgente: pendiente hace más de 7 días y la reserva es en menos de 2 días";
        } else if (diasPendiente > 3) {
            return String.format("Pendiente hace %d días", diasPendiente);
        } else if (diasHastaInicio < 2) {
            return "La reserva es muy pronto";
        } else {
            return "Requiere atención";
        }
    }
}

