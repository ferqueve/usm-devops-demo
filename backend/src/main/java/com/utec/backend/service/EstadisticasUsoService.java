package com.utec.backend.service;

import com.utec.backend.dto.stats.EquiposReservasDto;
import com.utec.backend.dto.stats.FiltroInventario;
import com.utec.backend.dto.stats.FiltroReservas;
import com.utec.backend.dto.stats.Periodo;
import com.utec.backend.dto.stats.UsoEspaciosDto;
import com.utec.backend.repository.EstadisticasUsoConsultas;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDate;
import java.util.List;

import static com.utec.backend.service.CalculosEstadisticos.*;

/** Uso físico de lo que se reserva: espacios, su aforo y la demanda de inventario. */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class EstadisticasUsoService {

    static final int MAXIMO_CAPACIDAD = 100;

    private final EstadisticasUsoConsultas consultas;
    private final Clock clock;

    /**
     * La ocupación de cada espacio usa el mismo criterio que
     * /reservas/ocupacion: sólo lo transcurrido hasta hoy, arriba y abajo.
     */
    public UsoEspaciosDto espacios(LocalDate desde, LocalDate hasta, FiltroReservas filtro) {
        Periodo periodo = new Periodo(desde, hasta);
        Periodo transcurrido = periodo.hastaHoy(hoy(clock)).orElse(null);
        double horasDisponibles = transcurrido == null ? 0 : transcurrido.dias() * (double) HORAS_DISPONIBLES_POR_DIA;

        List<UsoEspaciosDto.Espacio> espacios = consultas.usoPorEspacio(periodo, transcurrido, filtro).stream()
                .map(f -> new UsoEspaciosDto.Espacio(f.espacioId(), f.nombre(), f.edificioNombre(), f.tipoEspacio(),
                        f.capacidad(), redondear(f.horas()), f.reservas(),
                        horasDisponibles == 0 ? 0.0 : redondear(f.horas() * 100.0 / horasDisponibles),
                        redondear(f.cupoPromedio()),
                        f.inscriptosPromedio() == null || f.capacidad() == null ? null
                                : porcentaje(f.inscriptosPromedio(), f.capacidad())))
                .toList();

        List<UsoEspaciosDto.Saturacion> saturacion = consultas.saturacion(periodo, filtro).stream()
                .map(s -> new UsoEspaciosDto.Saturacion(s.tipoEspacio(), s.espacios(), s.hora(),
                        redondear(s.ocupacionPct()), s.horasLlenas()))
                .toList();

        List<UsoEspaciosDto.Capacidad> capacidad = consultas.capacidad(periodo, filtro, MAXIMO_CAPACIDAD).stream()
                .map(c -> new UsoEspaciosDto.Capacidad(c.tipo(), c.id(), c.titulo(), c.fecha(), c.espacioNombre(),
                        c.capacidad(), c.cupo(), c.inscriptos(),
                        c.capacidad() == null ? null : porcentaje(c.inscriptos(), c.capacidad())))
                .toList();

        return new UsoEspaciosDto(espacios, saturacion, capacidad);
    }

    /**
     * Demanda de inventario del período. Los totales son la suma por tipo:
     * cada solicitud pide un único tipo de elemento.
     */
    public EquiposReservasDto demandaInventario(LocalDate desde, LocalDate hasta, FiltroInventario filtro) {
        Periodo periodo = new Periodo(desde, hasta);
        List<EquiposReservasDto.PorTipo> porTipo = consultas.demandaPorTipo(periodo, filtro);
        return new EquiposReservasDto(totales(porTipo), porTipo, consultas.espaciosConProblemas(periodo, filtro));
    }

    static EquiposReservasDto.Totales totales(List<EquiposReservasDto.PorTipo> porTipo) {
        long solicitudes = 0, unidades = 0, pendientes = 0, aprobadas = 0, entregadas = 0, rechazadas = 0;
        for (EquiposReservasDto.PorTipo t : porTipo) {
            solicitudes += t.solicitudes();
            unidades += t.unidades();
            pendientes += t.pendientes();
            aprobadas += t.aprobadas();
            entregadas += t.entregadas();
            rechazadas += t.rechazadas();
        }
        return new EquiposReservasDto.Totales(solicitudes, unidades, pendientes, aprobadas, entregadas, rechazadas);
    }
}
