package com.utec.backend.dto;

/** Resultado de una notificación masiva por email: cuántos destinatarios y cuántos envíos exitosos. */
public record NotificacionResultadoDto(int total, int enviados) {
}
