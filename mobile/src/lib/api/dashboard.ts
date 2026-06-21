/**
 * Agregador de datos del dashboard, espejando la lógica por rol de
 * `frontend/src/lib/api/dashboard.ts` pero acotado a lo que la app mobile muestra.
 * Cada llamada está protegida: si el rol no tiene acceso a un endpoint, esa
 * métrica simplemente se omite (no rompe el dashboard).
 */
import type { Reserva, UserRole } from '../types';
import { obtenerEstadisticasEspacios } from './spaces';
import { obtenerMisReservas, obtenerTodasReservasPaged } from './reservations';

export type Tone = 'green' | 'yellow' | 'orange' | 'red' | 'blue' | 'cyan' | 'dark';

export type DashboardMetric = {
  key: string;
  label: string;
  value: string;
  sub?: string;
  tone: Tone;
};

export type DashboardData = {
  metrics: DashboardMetric[];
  /** Lista "Cola" (pendientes por resolver, o las propias). */
  cola: Reserva[];
  colaLabel: string;
  /** Lista "Hoy / Próximas". */
  hoy: Reserva[];
  hoyLabel: string;
};

function esHoy(iso: string): boolean {
  const d = new Date(iso);
  const n = new Date();
  return (
    d.getFullYear() === n.getFullYear() &&
    d.getMonth() === n.getMonth() &&
    d.getDate() === n.getDate()
  );
}

const GESTORES: UserRole[] = ['ADMIN', 'ANALISTA', 'MANTENIMIENTO'];

async function safe<T>(p: Promise<T>): Promise<T | null> {
  try {
    return await p;
  } catch {
    return null;
  }
}

export async function obtenerDashboard(rol: UserRole): Promise<DashboardData> {
  if (GESTORES.includes(rol)) {
    const [espStats, pend, aprob] = await Promise.all([
      safe(obtenerEstadisticasEspacios()),
      safe(obtenerTodasReservasPaged({ estado: 'PENDIENTE', size: 20 })),
      safe(obtenerTodasReservasPaged({ estado: 'APROBADO', size: 50 })),
    ]);

    const aprobContent = aprob?.content ?? [];
    const hoy = aprobContent.filter((r) => esHoy(r.inicio));

    const metrics: DashboardMetric[] = [];
    if (pend) {
      metrics.push({
        key: 'pendientes',
        label: 'A aprobar',
        value: String(pend.totalElements),
        sub: 'pendientes en cola',
        tone: 'yellow',
      });
    }
    metrics.push({
      key: 'hoy',
      label: 'Hoy',
      value: String(hoy.length),
      sub: 'reservas programadas',
      tone: 'blue',
    });
    if (espStats) {
      metrics.push({
        key: 'espacios',
        label: 'Espacios',
        value: `${espStats.disponibles}/${espStats.totalEspacios}`,
        sub: 'disponibles',
        tone: 'green',
      });
      metrics.push({
        key: 'mantenimiento',
        label: 'Mantenimiento',
        value: String(espStats.enMantenimiento),
        sub: 'espacios fuera de servicio',
        tone: 'orange',
      });
    }
    if (aprob) {
      metrics.push({
        key: 'aprobadas',
        label: 'Aprobadas',
        value: String(aprob.totalElements),
        sub: 'reservas confirmadas',
        tone: 'cyan',
      });
    }

    return {
      metrics,
      cola: pend?.content ?? [],
      colaLabel: 'Cola de aprobación',
      hoy,
      hoyLabel: 'Hoy',
    };
  }

  // Roles "consumidores": docente, estudiante, externo.
  const mis = (await safe(obtenerMisReservas())) ?? [];
  const ahora = Date.now();
  const pendientes = mis.filter((r) => r.estado === 'PENDIENTE');
  const aprobadas = mis.filter((r) => r.estado === 'APROBADO');
  const proximas = aprobadas
    .filter((r) => new Date(r.inicio).getTime() >= ahora)
    .sort((a, b) => new Date(a.inicio).getTime() - new Date(b.inicio).getTime());
  const hoy = aprobadas.filter((r) => esHoy(r.inicio));

  const metrics: DashboardMetric[] = [
    { key: 'mis', label: 'Mis reservas', value: String(mis.length), sub: 'en total', tone: 'blue' },
    { key: 'hoy', label: 'Hoy', value: String(hoy.length), sub: 'reservas de hoy', tone: 'green' },
    {
      key: 'pendientes',
      label: 'Pendientes',
      value: String(pendientes.length),
      sub: 'esperando aprobación',
      tone: 'yellow',
    },
    {
      key: 'aprobadas',
      label: 'Aprobadas',
      value: String(aprobadas.length),
      sub: 'confirmadas',
      tone: 'cyan',
    },
  ];

  return {
    metrics,
    cola: pendientes,
    colaLabel: 'Pendientes de aprobación',
    hoy: proximas,
    hoyLabel: 'Próximas',
  };
}
