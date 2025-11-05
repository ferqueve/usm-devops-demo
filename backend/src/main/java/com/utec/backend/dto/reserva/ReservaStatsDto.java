package com.utec.backend.dto.reserva;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ReservaStatsDto {
    
    // Métricas básicas
    private Long totalReservas;
    private Long totalAprobadas;
    private Long totalPendientes;
    private Long totalCanceladas;
    private Long totalFuturas;
    private Long totalPasadas;
    private Long totalActivas;
    private Map<String, Long> reservasPorEstado;
    
    // Métricas temporales
    private Long reservasEsteMes;
    private Long reservasProximoMes;
    private Long reservasEsteAnio;
    private Map<String, Long> reservasPorMes;
    private Map<String, Long> reservasPorDiaSemana;
    private String mesConMasReservas;
    private Double promedioReservasPorMes;
    
    // Métricas de espacios
    private Long totalEspaciosUsados;
    private Long espacioMasUsado;
    private String nombreEspacioMasUsado;
    private Map<Long, Long> reservasPorEspacio;
    private Map<String, Long> distribucionPorEspacio;
    
    // Métricas de uso y duración
    private Double duracionTotalHoras;
    private Double duracionPromedioHoras;
    private Double reservaMasLargaHoras;
    private Double reservaMasCortaHoras;
    private Double horasReservadasEsteMes;
    
    // Métricas de frecuencia
    private Double promedioReservasPorSemana;
    private Long diasDesdeUltimaReserva;
    private Long diasHastaProximaReserva;
    private LocalDateTime fechaUltimaReserva;
    private LocalDateTime fechaProximaReserva;
    
    // Métricas comparativas
    private Long reservasMesActual;
    private Long reservasMesAnterior;
    private Long diferenciaMesAnterior;
    private Double porcentajeCambioMesAnterior;
}

