package com.utec.backend.service;

import com.utec.backend.dto.reserva.ReservaResponseDto;
import com.utec.backend.model.Reserva;
import com.utec.backend.model.Usuario;
import com.utec.backend.repository.ReservaRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;
import org.springframework.scheduling.support.CronExpression;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.Duration;
import java.time.Instant;
import java.time.LocalTime;
import java.time.ZoneOffset;
import java.time.ZonedDateTime;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("Tests para ReservaReminderService")
class ReservaReminderServiceTest {

    @Mock
    private ReservaRepository reservaRepository;

    @Mock
    private EmailService emailService;

    @Mock
    private ReservaService reservaService;

    @Mock
    private StringRedisTemplate redisTemplate;

    @Mock
    private ValueOperations<String, String> valueOperations;

    @InjectMocks
    private ReservaReminderService reminderService;

    private Reserva reservaTest;
    private Usuario usuarioTest;
    private ReservaResponseDto reservaDto;
    private final Long reservaId = 1L;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(reminderService, "horasAntesRecordatorio", 24);
        ReflectionTestUtils.setField(reminderService, "recordatoriosHabilitados", true);

        usuarioTest = new Usuario();
        usuarioTest.setId(1L);
        usuarioTest.setEmail("test@utec.edu.uy");
        usuarioTest.setNombre("Test User");

        reservaTest = new Reserva();
        reservaTest.setId(reservaId);
        reservaTest.setEstado(Reserva.EstadoReserva.APROBADO);
        reservaTest.setUsuario(usuarioTest);
        reservaTest.setInicio(Instant.now().plusSeconds(86400)); // 24 horas desde ahora

        reservaDto = new ReservaResponseDto();
        reservaDto.setId(reservaId);
        reservaDto.setUsuarioEmail(usuarioTest.getEmail());

        lenient().when(redisTemplate.opsForValue()).thenReturn(valueOperations);
    }

    @Test
    @DisplayName("Debe enviar recordatorios manualmente")
    void debeEnviarRecordatoriosManual() {
        // Given
        int horasAntes = 24;
        List<Reserva> reservas = Arrays.asList(reservaTest);
        
        when(reservaRepository.findReservasAprobadasEnRango(
                eq(Reserva.EstadoReserva.APROBADO), any(Instant.class), any(Instant.class)))
                .thenReturn(reservas);
        when(redisTemplate.hasKey(anyString())).thenReturn(false);
        when(reservaService.mapToResponseDto(reservaTest)).thenReturn(reservaDto);
        when(emailService.enviarEmailRecordatorioReserva(anyString(), any(ReservaResponseDto.class), eq(horasAntes)))
                .thenReturn(true);
        doNothing().when(valueOperations).set(anyString(), anyString(), any(java.time.Duration.class));

        // When
        int resultado = reminderService.enviarRecordatoriosManual(horasAntes);

        // Then
        assertEquals(1, resultado);
        verify(emailService).enviarEmailRecordatorioReserva(anyString(), any(ReservaResponseDto.class), eq(horasAntes));
    }

    @Test
    @DisplayName("Debe no enviar recordatorio si ya fue enviado")
    void debeNoEnviarRecordatorioSiYaFueEnviado() {
        // Given
        int horasAntes = 24;
        List<Reserva> reservas = Arrays.asList(reservaTest);
        
        when(reservaRepository.findReservasAprobadasEnRango(
                eq(Reserva.EstadoReserva.APROBADO), any(Instant.class), any(Instant.class)))
                .thenReturn(reservas);
        when(redisTemplate.hasKey(anyString())).thenReturn(true); // Ya enviado
        lenient().when(redisTemplate.opsForValue()).thenReturn(valueOperations);

        // When
        int resultado = reminderService.enviarRecordatoriosManual(horasAntes);

        // Then
        assertEquals(0, resultado);
        verify(emailService, never()).enviarEmailRecordatorioReserva(anyString(), any(), anyInt());
    }

    @Test
    @DisplayName("Debe no enviar recordatorios si no hay reservas")
    void debeNoEnviarRecordatoriosSiNoHayReservas() {
        // Given
        int horasAntes = 24;
        when(reservaRepository.findReservasAprobadasEnRango(
                eq(Reserva.EstadoReserva.APROBADO), any(Instant.class), any(Instant.class)))
                .thenReturn(Collections.emptyList());
        lenient().when(redisTemplate.opsForValue()).thenReturn(valueOperations);

        // When
        int resultado = reminderService.enviarRecordatoriosManual(horasAntes);

        // Then
        assertEquals(0, resultado);
        verify(emailService, never()).enviarEmailRecordatorioReserva(anyString(), any(), anyInt());
    }

    @Test
    @DisplayName("Debe manejar errores al enviar recordatorios")
    void debeManejarErroresAlEnviarRecordatorios() {
        // Given
        int horasAntes = 24;
        List<Reserva> reservas = Arrays.asList(reservaTest);
        
        when(reservaRepository.findReservasAprobadasEnRango(
                eq(Reserva.EstadoReserva.APROBADO), any(Instant.class), any(Instant.class)))
                .thenReturn(reservas);
        when(redisTemplate.hasKey(anyString())).thenReturn(false);
        when(reservaService.mapToResponseDto(reservaTest)).thenReturn(reservaDto);
        when(emailService.enviarEmailRecordatorioReserva(anyString(), any(ReservaResponseDto.class), eq(horasAntes)))
                .thenThrow(new RuntimeException("Error al enviar email"));
        lenient().when(redisTemplate.opsForValue()).thenReturn(valueOperations);

        // When
        int resultado = reminderService.enviarRecordatoriosManual(horasAntes);

        // Then
        assertEquals(0, resultado);
        verify(emailService).enviarEmailRecordatorioReserva(anyString(), any(ReservaResponseDto.class), eq(horasAntes));
    }

    @Test
    @DisplayName("El cron de enviarRecordatoriosProgramados dispara a las 00:00")
    void cronProgramadoEsMedianoche() {
        CronExpression cron = CronExpression.parse("0 0 0 * * ?");
        ZonedDateTime base = ZonedDateTime.of(2026, 5, 26, 14, 30, 0, 0, ZoneOffset.UTC);
        ZonedDateTime next = cron.next(base);
        assertNotNull(next);
        assertEquals(LocalTime.MIDNIGHT, next.toLocalTime());
    }

    @Test
    @DisplayName("El job programado barre 24h desde (ahora + hours-before)")
    void programadoUsaVentanaDe24Horas() {
        ReflectionTestUtils.setField(reminderService, "horasAntesRecordatorio", 24);
        when(reservaRepository.findReservasAprobadasEnRango(
                eq(Reserva.EstadoReserva.APROBADO), any(Instant.class), any(Instant.class)))
                .thenReturn(Collections.emptyList());
        lenient().when(redisTemplate.opsForValue()).thenReturn(valueOperations);

        Instant antes = Instant.now();
        reminderService.enviarRecordatoriosProgramados();
        Instant despues = Instant.now();

        ArgumentCaptor<Instant> desdeCap = ArgumentCaptor.forClass(Instant.class);
        ArgumentCaptor<Instant> hastaCap = ArgumentCaptor.forClass(Instant.class);
        verify(reservaRepository).findReservasAprobadasEnRango(
                eq(Reserva.EstadoReserva.APROBADO), desdeCap.capture(), hastaCap.capture());

        Instant desde = desdeCap.getValue();
        Instant hasta = hastaCap.getValue();
        Duration toleranciaSuperior = Duration.between(antes, despues).plusSeconds(1);
        assertTrue(!desde.isBefore(antes.plus(Duration.ofHours(24))),
                "desde debería ser >= ahora+24h");
        assertTrue(!desde.isAfter(despues.plus(Duration.ofHours(24)).plus(toleranciaSuperior)),
                "desde no debería superar ahora+24h por mucho");
        assertEquals(Duration.ofHours(24), Duration.between(desde, hasta));
    }

    @Test
    @DisplayName("Debe no enviar recordatorios si están deshabilitados")
    void debeNoEnviarRecordatoriosSiEstanDeshabilitados() {
        // Given
        ReflectionTestUtils.setField(reminderService, "recordatoriosHabilitados", false);
        lenient().when(redisTemplate.opsForValue()).thenReturn(valueOperations);

        // When
        reminderService.enviarRecordatoriosProgramados();

        // Then
        verify(reservaRepository, never()).findReservasAprobadasEnRango(any(), any(), any());
    }
}

