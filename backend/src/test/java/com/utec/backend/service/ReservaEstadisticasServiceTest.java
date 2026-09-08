package com.utec.backend.service;

import com.utec.backend.dto.reserva.ReservaStatsDto;
import com.utec.backend.repository.ReservaEstadisticasRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.math.BigDecimal;
import java.math.BigInteger;
import java.sql.Timestamp;
import java.time.Instant;
import java.time.YearMonth;
import java.time.ZoneOffset;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("ReservaEstadisticasService")
class ReservaEstadisticasServiceTest {

    @Mock
    private ReservaEstadisticasRepository repository;

    @InjectMocks
    private ReservaEstadisticasService service;

    private static final Long USUARIO = 7L;

    /**
     * Fila de resumen como la devuelve Postgres: los COUNT vienen BigInteger y
     * las divisiones BigDecimal.
     */
    private Object[] resumen(long total, Instant primera, Instant ultima, Instant proxima) {
        return new Object[]{
                BigInteger.valueOf(total),      // total
                BigInteger.valueOf(6),          // aprobadas
                BigInteger.valueOf(3),          // pendientes
                BigInteger.valueOf(1),          // canceladas
                BigInteger.valueOf(4),          // futuras
                BigInteger.valueOf(5),          // pasadas
                BigInteger.valueOf(2),          // activas
                new BigDecimal("20.5"),         // horas total
                new BigDecimal("2.05"),         // horas promedio
                new BigDecimal("4.0"),          // mas larga
                new BigDecimal("0.5"),          // mas corta
                new BigDecimal("6.0"),          // horas este mes
                primera == null ? null : Timestamp.from(primera),
                ultima == null ? null : Timestamp.from(ultima),
                proxima == null ? null : Timestamp.from(proxima),
        };
    }

    @Test
    @DisplayName("sin reservas devuelve todo en cero y sin fechas")
    void sinReservas() {
        when(repository.resumen(any(), any(), anyString()))
                .thenReturn(List.<Object[]>of(resumen(0, null, null, null)));

        ReservaStatsDto stats = service.calcular(USUARIO);

        assertEquals(0L, stats.getTotalReservas());
        assertEquals(0.0, stats.getDuracionTotalHoras());
        assertNull(stats.getFechaUltimaReserva());
        assertNull(stats.getEspacioMasUsado());
    }

    @Test
    @DisplayName("mapea totales, duraciones y fechas del resumen")
    void mapeaResumen() {
        Instant ahora = Instant.now();
        Instant primera = ahora.minus(java.time.Duration.ofDays(28));
        Instant ultima = ahora.minus(java.time.Duration.ofDays(3));
        // Con dos dias justos, el now del servicio -- microsegundos posterior --
        // deja 1 dia y 23:59:59, y toDays() trunca a 1. La hora de margen evita
        // que el test dependa de eso.
        Instant proxima = ahora.plus(java.time.Duration.ofDays(2)).plus(java.time.Duration.ofHours(1));
        when(repository.resumen(any(), any(), anyString())).thenReturn(List.<Object[]>of(resumen(10, primera, ultima, proxima)));

        ReservaStatsDto stats = service.calcular(USUARIO);

        assertEquals(10L, stats.getTotalReservas());
        assertEquals(6L, stats.getTotalAprobadas());
        assertEquals(3L, stats.getTotalPendientes());
        assertEquals(20.5, stats.getDuracionTotalHoras());
        assertEquals(4.0, stats.getReservaMasLargaHoras());
        assertEquals(3L, stats.getDiasDesdeUltimaReserva());
        assertEquals(2L, stats.getDiasHastaProximaReserva());
        // Cuatro semanas de historia con diez reservas: dos y media por semana.
        assertEquals(2.5, stats.getPromedioReservasPorSemana());
    }

    @Test
    @DisplayName("la serie mensual trae doce meses y rellena con cero los vacios")
    void serieMensual() {
        YearMonth mesActual = YearMonth.from(Instant.now().atZone(ZoneOffset.UTC));
        when(repository.resumen(any(), any(), anyString())).thenReturn(List.<Object[]>of(resumen(4, Instant.now(), null, null)));
        when(repository.conteoPorMes(USUARIO)).thenReturn(List.<Object[]>of(
                new Object[]{mesActual.toString(), BigInteger.valueOf(3)},
                new Object[]{mesActual.minusMonths(1).toString(), BigInteger.valueOf(1)}
        ));

        ReservaStatsDto stats = service.calcular(USUARIO);

        assertEquals(12, stats.getReservasPorMes().size());
        assertEquals(3L, stats.getReservasPorMes().get(mesActual.toString()));
        assertEquals(0L, stats.getReservasPorMes().get(mesActual.minusMonths(5).toString()));
        assertEquals(mesActual.toString(), stats.getMesConMasReservas());
        // Mes actual contra el anterior: tres contra una.
        assertEquals(3L, stats.getReservasMesActual());
        assertEquals(1L, stats.getReservasMesAnterior());
        assertEquals(2L, stats.getDiferenciaMesAnterior());
        assertEquals(200.0, stats.getPorcentajeCambioMesAnterior());
    }

    @Test
    @DisplayName("completa los siete dias de la semana y todos los estados")
    void diasYEstados() {
        when(repository.resumen(any(), any(), anyString())).thenReturn(List.<Object[]>of(resumen(2, Instant.now(), null, null)));
        when(repository.conteoPorDiaSemana(USUARIO)).thenReturn(
                List.<Object[]>of(new Object[]{BigDecimal.ONE, BigInteger.valueOf(2)})); // lunes
        when(repository.conteoPorEstado(USUARIO)).thenReturn(
                List.<Object[]>of(new Object[]{"APROBADO", BigInteger.valueOf(2)}));

        ReservaStatsDto stats = service.calcular(USUARIO);

        assertEquals(7, stats.getReservasPorDiaSemana().size());
        assertEquals(2L, stats.getReservasPorDiaSemana().get("MONDAY"));
        assertEquals(0L, stats.getReservasPorDiaSemana().get("SUNDAY"));
        assertEquals(2L, stats.getReservasPorEstado().get("APROBADO"));
        assertEquals(0L, stats.getReservasPorEstado().get("CANCELADO"));
    }

    @Test
    @DisplayName("el espacio mas usado es el primero que devuelve la consulta ordenada")
    void espacios() {
        when(repository.resumen(any(), any(), anyString())).thenReturn(List.<Object[]>of(resumen(9, Instant.now(), null, null)));
        when(repository.conteoPorEspacio(USUARIO)).thenReturn(List.<Object[]>of(
                new Object[]{5L, "Aula 3", BigInteger.valueOf(6)},
                new Object[]{2L, "Laboratorio", BigInteger.valueOf(3)}
        ));

        ReservaStatsDto stats = service.calcular(USUARIO);

        assertEquals(2L, stats.getTotalEspaciosUsados());
        assertEquals(5L, stats.getEspacioMasUsado());
        assertEquals("Aula 3", stats.getNombreEspacioMasUsado());
        assertEquals(6L, stats.getReservasPorEspacio().get(5L));
        assertEquals(3L, stats.getDistribucionPorEspacio().get("Laboratorio"));
        assertTrue(stats.getReservasPorEspacio().containsKey(2L));
    }
}
