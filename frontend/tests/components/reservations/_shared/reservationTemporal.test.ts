import { describe, it, expect } from 'vitest';
import { getReservaTemporal } from '@/components/reservations/_shared/reservationTemporal';

describe('getReservaTemporal', () => {
  it('fecha futura -> esFutura true', () => {
    const future = new Date(Date.now() + 60_000).toISOString();
    expect(getReservaTemporal(future)).toEqual({ esFutura: true, esPasada: false });
  });

  it('fecha pasada -> esPasada true', () => {
    const past = new Date(Date.now() - 60_000).toISOString();
    expect(getReservaTemporal(past)).toEqual({ esFutura: false, esPasada: true });
  });
});
