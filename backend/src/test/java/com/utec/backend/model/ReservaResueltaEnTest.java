package com.utec.backend.model;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.Instant;

import static org.assertj.core.api.Assertions.assertThat;

class ReservaResueltaEnTest {

    private static final Instant T1 = Instant.parse("2026-09-01T12:00:00Z");
    private static final Instant T2 = Instant.parse("2026-09-02T12:00:00Z");

    @Test
    @DisplayName("Una reserva que nace aprobada queda resuelta en su propio created_at")
    void naceAprobada() {
        Reserva r = new Reserva();
        r.setEstado(Reserva.EstadoReserva.APROBADO);
        r.alCrear();
        assertThat(r.getCreatedAt()).isNotNull();
        assertThat(r.getResueltaEn()).isEqualTo(r.getCreatedAt());
    }

    @Test
    @DisplayName("Una pendiente no tiene resuelta_en hasta que se aprueba o cancela, y después no se pisa")
    void pendienteSeResuelveUnaVez() {
        Reserva r = new Reserva();
        r.setEstado(Reserva.EstadoReserva.PENDIENTE);
        r.alCrear();
        assertThat(r.getResueltaEn()).isNull();

        r.resolver(Reserva.EstadoReserva.APROBADO, T1);
        r.resolver(Reserva.EstadoReserva.CANCELADO, T2);

        assertThat(r.getEstado()).isEqualTo(Reserva.EstadoReserva.CANCELADO);
        assertThat(r.getResueltaEn()).isEqualTo(T1);
    }
}
