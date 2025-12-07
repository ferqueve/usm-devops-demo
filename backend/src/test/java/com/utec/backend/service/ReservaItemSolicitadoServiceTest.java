package com.utec.backend.service;

import com.utec.backend.dto.common.PagedResponseDto;
import com.utec.backend.dto.reserva_item_solicitado.ReservaItemSolicitadoCreateDto;
import com.utec.backend.dto.reserva_item_solicitado.ReservaItemSolicitadoResponseDto;
import com.utec.backend.dto.reserva_item_solicitado.ReservaItemSolicitadoUpdateDto;
import com.utec.backend.model.Espacio;
import com.utec.backend.model.InventarioItem;
import com.utec.backend.model.Reserva;
import com.utec.backend.model.ReservaItemSolicitado;
import com.utec.backend.model.TipoElemento;
import com.utec.backend.model.Usuario;
import com.utec.backend.repository.InventarioItemRepository;
import com.utec.backend.repository.ReservaItemSolicitadoRepository;
import com.utec.backend.repository.ReservaRepository;
import com.utec.backend.repository.TipoElementoRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;

import java.time.Instant;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("Tests para ReservaItemSolicitadoService")
class ReservaItemSolicitadoServiceTest {

    @Mock
    private ReservaItemSolicitadoRepository reservaItemSolicitadoRepository;

    @Mock
    private ReservaRepository reservaRepository;

    @Mock
    private TipoElementoRepository tipoElementoRepository;

    @Mock
    private InventarioItemRepository inventarioItemRepository;

    @Mock
    private EmailService emailService;

    @InjectMocks
    private ReservaItemSolicitadoService reservaItemSolicitadoService;

    private Reserva reservaTest;
    private TipoElemento tipoElementoTest;
    private InventarioItem inventarioItemTest;
    private ReservaItemSolicitado itemSolicitadoTest;
    private final Long reservaId = 1L;
    private final Long tipoElementoId = 1L;
    private final Long inventarioItemId = 1L;
    private final Long itemSolicitadoId = 1L;

    @BeforeEach
    void setUp() {
        // Setup Reserva
        reservaTest = new Reserva();
        reservaTest.setId(reservaId);
        reservaTest.setEstado(Reserva.EstadoReserva.APROBADO);
        
        Usuario usuario = new Usuario();
        usuario.setId(1L);
        usuario.setEmail("test@utec.edu.uy");
        reservaTest.setUsuario(usuario);
        
        Espacio espacio = new Espacio();
        espacio.setId(1L);
        espacio.setNombre("Aula 101");
        reservaTest.setEspacio(espacio);
        reservaTest.setInicio(Instant.now().plusSeconds(86400));
        reservaTest.setFin(Instant.now().plusSeconds(90000));

        // Setup TipoElemento
        tipoElementoTest = new TipoElemento();
        tipoElementoTest.setId(tipoElementoId);
        tipoElementoTest.setNombre("Proyector");
        tipoElementoTest.setActivo(true);

        // Setup InventarioItem
        inventarioItemTest = new InventarioItem();
        inventarioItemTest.setId(inventarioItemId);
        inventarioItemTest.setTipoElemento(tipoElementoTest);
        inventarioItemTest.setActivo(true);
        inventarioItemTest.setEstado("DISPONIBLE");

        // Setup ReservaItemSolicitado
        itemSolicitadoTest = new ReservaItemSolicitado();
        itemSolicitadoTest.setId(itemSolicitadoId);
        itemSolicitadoTest.setReserva(reservaTest);
        itemSolicitadoTest.setTipoElemento(tipoElementoTest);
        itemSolicitadoTest.setInventarioItem(inventarioItemTest);
        itemSolicitadoTest.setCantidadSolicitada(1);
        itemSolicitadoTest.setEstado(ReservaItemSolicitado.EstadoSolicitud.PENDIENTE);
        itemSolicitadoTest.setCreatedAt(Instant.now());
        itemSolicitadoTest.setUpdatedAt(Instant.now());
    }

    @Test
    @DisplayName("Debe crear solicitudes exitosamente")
    void debeCrearSolicitudesExitosamente() {
        // Given
        ReservaItemSolicitadoCreateDto createDto = new ReservaItemSolicitadoCreateDto();
        createDto.setTipoElementoId(tipoElementoId);
        createDto.setCantidadSolicitada(1);

        when(reservaRepository.findById(reservaId)).thenReturn(Optional.of(reservaTest));
        when(tipoElementoRepository.findById(tipoElementoId)).thenReturn(Optional.of(tipoElementoTest));
        when(reservaItemSolicitadoRepository.saveAll(anyList())).thenReturn(Arrays.asList(itemSolicitadoTest));

        // When
        List<ReservaItemSolicitadoResponseDto> resultado = reservaItemSolicitadoService.crearSolicitudes(reservaId, Arrays.asList(createDto));

        // Then
        assertNotNull(resultado);
        assertEquals(1, resultado.size());
        verify(reservaItemSolicitadoRepository).saveAll(anyList());
    }

    @Test
    @DisplayName("Debe lanzar excepción cuando la reserva no existe")
    void debeLanzarExcepcionCuandoReservaNoExiste() {
        // Given
        ReservaItemSolicitadoCreateDto createDto = new ReservaItemSolicitadoCreateDto();
        when(reservaRepository.findById(reservaId)).thenReturn(Optional.empty());

        // When & Then
        RuntimeException exception = assertThrows(RuntimeException.class, () -> {
            reservaItemSolicitadoService.crearSolicitudes(reservaId, Arrays.asList(createDto));
        });

        assertTrue(exception.getMessage().contains("Reserva no encontrada"));
        verify(reservaItemSolicitadoRepository, never()).saveAll(anyList());
    }

    @Test
    @DisplayName("Debe obtener items por reserva")
    void debeObtenerPorReserva() {
        // Given
        when(reservaItemSolicitadoRepository.findByReservaIdWithRelations(reservaId))
                .thenReturn(Arrays.asList(itemSolicitadoTest));

        // When
        List<ReservaItemSolicitadoResponseDto> resultado = reservaItemSolicitadoService.obtenerPorReserva(reservaId);

        // Then
        assertNotNull(resultado);
        assertEquals(1, resultado.size());
        verify(reservaItemSolicitadoRepository).findByReservaIdWithRelations(reservaId);
    }

    @Test
    @DisplayName("Debe obtener items por estado")
    void debeObtenerPorEstado() {
        // Given
        when(reservaItemSolicitadoRepository.findByEstado(ReservaItemSolicitado.EstadoSolicitud.PENDIENTE))
                .thenReturn(Arrays.asList(itemSolicitadoTest));

        // When
        List<ReservaItemSolicitadoResponseDto> resultado = reservaItemSolicitadoService.obtenerPorEstado(ReservaItemSolicitado.EstadoSolicitud.PENDIENTE);

        // Then
        assertNotNull(resultado);
        assertEquals(1, resultado.size());
        verify(reservaItemSolicitadoRepository).findByEstado(ReservaItemSolicitado.EstadoSolicitud.PENDIENTE);
    }

    @Test
    @DisplayName("Debe buscar solicitudes con paginación")
    void debeBuscarSolicitudes() {
        // Given
        Pageable pageable = PageRequest.of(0, 10);
        Page<ReservaItemSolicitado> page = new PageImpl<>(Arrays.asList(itemSolicitadoTest), pageable, 1);

        when(reservaItemSolicitadoRepository.findAll(any(Specification.class), eq(pageable))).thenReturn(page);

        // When
        PagedResponseDto<ReservaItemSolicitadoResponseDto> resultado = reservaItemSolicitadoService.buscarSolicitudes(
                null, null, null, null, null, pageable);

        // Then
        assertNotNull(resultado);
        assertEquals(1, resultado.getContent().size());
        verify(reservaItemSolicitadoRepository).findAll(any(Specification.class), eq(pageable));
    }

    @Test
    @DisplayName("Debe actualizar solicitud exitosamente")
    void debeActualizarSolicitudExitosamente() {
        // Given
        ReservaItemSolicitadoUpdateDto updateDto = new ReservaItemSolicitadoUpdateDto();
        updateDto.setEstado(ReservaItemSolicitado.EstadoSolicitud.APROBADO);

        when(reservaItemSolicitadoRepository.findById(itemSolicitadoId)).thenReturn(Optional.of(itemSolicitadoTest));
        when(reservaItemSolicitadoRepository.save(any(ReservaItemSolicitado.class))).thenReturn(itemSolicitadoTest);
        lenient().when(emailService.enviarEmailNotificacionEstadoSolicitudInventario(anyString(), any(), anyString(), anyString()))
                .thenReturn(true);

        // When
        ReservaItemSolicitadoResponseDto resultado = reservaItemSolicitadoService.actualizarSolicitud(
                itemSolicitadoId, updateDto, "admin@utec.edu.uy");

        // Then
        assertNotNull(resultado);
        verify(reservaItemSolicitadoRepository).save(any(ReservaItemSolicitado.class));
    }

    @Test
    @DisplayName("Debe lanzar excepción cuando la solicitud no existe")
    void debeLanzarExcepcionCuandoSolicitudNoExiste() {
        // Given
        Long idInexistente = 999L;
        ReservaItemSolicitadoUpdateDto updateDto = new ReservaItemSolicitadoUpdateDto();
        when(reservaItemSolicitadoRepository.findById(idInexistente)).thenReturn(Optional.empty());

        // When & Then
        RuntimeException exception = assertThrows(RuntimeException.class, () -> {
            reservaItemSolicitadoService.actualizarSolicitud(idInexistente, updateDto, "admin@utec.edu.uy");
        });

        assertTrue(exception.getMessage().contains("no encontrada"));
        verify(reservaItemSolicitadoRepository, never()).save(any(ReservaItemSolicitado.class));
    }

    @Test
    @DisplayName("Debe validar transición de estado desde PENDIENTE a APROBADO")
    void debeValidarTransicionEstadoPendienteAAprobado() {
        // Given
        itemSolicitadoTest.setEstado(ReservaItemSolicitado.EstadoSolicitud.PENDIENTE);
        ReservaItemSolicitadoUpdateDto updateDto = new ReservaItemSolicitadoUpdateDto();
        updateDto.setEstado(ReservaItemSolicitado.EstadoSolicitud.APROBADO);

        when(reservaItemSolicitadoRepository.findById(itemSolicitadoId)).thenReturn(Optional.of(itemSolicitadoTest));
        when(reservaItemSolicitadoRepository.save(any(ReservaItemSolicitado.class))).thenReturn(itemSolicitadoTest);

        // When
        assertDoesNotThrow(() -> {
            reservaItemSolicitadoService.actualizarSolicitud(itemSolicitadoId, updateDto, "admin@utec.edu.uy");
        });

        // Then
        verify(reservaItemSolicitadoRepository).save(any(ReservaItemSolicitado.class));
    }

    @Test
    @DisplayName("Debe lanzar excepción con transición de estado inválida")
    void debeLanzarExcepcionConTransicionEstadoInvalida() {
        // Given
        itemSolicitadoTest.setEstado(ReservaItemSolicitado.EstadoSolicitud.PENDIENTE);
        ReservaItemSolicitadoUpdateDto updateDto = new ReservaItemSolicitadoUpdateDto();
        updateDto.setEstado(ReservaItemSolicitado.EstadoSolicitud.ENTREGADO); // Transición inválida

        when(reservaItemSolicitadoRepository.findById(itemSolicitadoId)).thenReturn(Optional.of(itemSolicitadoTest));

        // When & Then
        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, () -> {
            reservaItemSolicitadoService.actualizarSolicitud(itemSolicitadoId, updateDto, "admin@utec.edu.uy");
        });

        assertTrue(exception.getMessage().contains("Transición inválida"));
        verify(reservaItemSolicitadoRepository, never()).save(any(ReservaItemSolicitado.class));
    }
}

