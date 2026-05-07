import { describe, it, expect } from 'vitest';
import { getEstadoConfig, formatTime, formatShortDate } from '@/components/reservations/reservationUtils';

describe('reservationUtils', () => {
  describe('getEstadoConfig', () => {
    it('devuelve config "Aprobada" para APROBADO', () => {
      const cfg = getEstadoConfig('APROBADO');
      expect(cfg.label).toBe('Aprobada');
      expect(cfg.icon).not.toBeNull();
      expect(cfg.color).toContain('green');
    });

    it('devuelve config "Pendiente" para PENDIENTE', () => {
      const cfg = getEstadoConfig('PENDIENTE');
      expect(cfg.label).toBe('Pendiente');
      expect(cfg.color).toContain('amber');
    });

    it('devuelve config "Cancelada" para CANCELADO', () => {
      const cfg = getEstadoConfig('CANCELADO');
      expect(cfg.label).toBe('Cancelada');
      expect(cfg.color).toContain('red');
    });

    it('devuelve config gris e icono null para estado desconocido', () => {
      const cfg = getEstadoConfig('OTRO' as 'APROBADO');
      expect(cfg.label).toBe('OTRO');
      expect(cfg.icon).toBeNull();
      expect(cfg.color).toContain('gray');
    });
  });

  describe('formatTime', () => {
    it('formatea ISO datetime a HH:MM', () => {
      const result = formatTime('2025-01-15T14:30:00');
      expect(result).toMatch(/\d{2}:\d{2}/);
    });
  });

  describe('formatShortDate', () => {
    it('formatea fecha en formato corto en español', () => {
      const result = formatShortDate('2025-06-15T10:00:00');
      expect(result).toMatch(/2025/);
      expect(result.length).toBeGreaterThan(0);
    });
  });
});
