import { describe, it, expect } from 'vitest';
import { getEstadoConfig, formatTime, formatShortDate } from '@/components/reservations/reservationUtils';

describe('reservationUtils', () => {
  describe('getEstadoConfig', () => {
    // Antes estos tests afirmaban 'green', 'amber' y 'gray': los colores
    // crudos de Tailwind, que es justo lo que las reglas prohíben. O sea que
    // fijaban el problema como contrato. Lo que importa es que cada estado se
    // distinga del otro y que nada quede sin color.
    it('cada estado trae etiqueta, color e icono', () => {
      for (const [estado, etiqueta] of [
        ['APROBADO', 'Aprobada'],
        ['PENDIENTE', 'Pendiente'],
        ['CANCELADO', 'Cancelada'],
      ] as const) {
        const cfg = getEstadoConfig(estado);
        expect(cfg.label).toBe(etiqueta);
        expect(cfg.icon).not.toBeNull();
        expect(cfg.color).toBeTruthy();
      }
    });

    it('los tres se ven distinto', () => {
      const colores = (['APROBADO', 'PENDIENTE', 'CANCELADO'] as const).map(
        (e) => getEstadoConfig(e).color
      );
      expect(new Set(colores).size).toBe(3);
    });

    it('no escribe colores a mano: todo sale de la paleta de marca', () => {
      for (const e of ['APROBADO', 'PENDIENTE', 'CANCELADO'] as const) {
        const cfg = getEstadoConfig(e);
        for (const clase of [cfg.color, cfg.stripeColor, cfg.borderColor, cfg.cornerBorderColor]) {
          expect(clase).not.toMatch(/\b(green|amber|red|gray|slate|yellow|blue)-\d{2,3}\b/);
        }
      }
    });

    it('un estado que no conoce no rompe: muestra la clave y sigue con icono', () => {
      const cfg = getEstadoConfig('OTRO' as 'APROBADO');
      expect(cfg.label).toBe('OTRO');
      // Antes devolvía `icon: null` y quien lo renderizaba tenía que
      // acordarse de chequearlo.
      expect(cfg.icon).not.toBeNull();
      expect(cfg.color).toBeTruthy();
    });
  });

  describe('formatTime', () => {
    it('formatea ISO datetime a HH:MM', () => {
      expect(formatTime('2025-01-15T14:30:00')).toMatch(/\d{2}:\d{2}/);
    });
  });

  describe('formatShortDate', () => {
    it('formatea en corto, con el año', () => {
      expect(formatShortDate('2025-06-15T10:00:00')).toMatch(/2025/);
    });
  });
});
