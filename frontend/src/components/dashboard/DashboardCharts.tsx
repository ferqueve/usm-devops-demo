import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarDays, Clock, MapPin, TrendingUp } from 'lucide-react';
import type { Espacio, Reserva, ReservaStats } from '@/lib/types/spaces';

interface DashboardChartsProps {
  reservas: Reserva[];
  /**
   * Agregaciones pre-calculadas por el backend. Si están disponibles los
   * usamos directo; si no, caemos al cálculo sobre {@link reservas}.
   */
  stats?: ReservaStats | null;
  /** Para mapear IDs de espacio a nombres cuando vienen como id. */
  espacios?: Espacio[];
  loading?: boolean;
}

const DIAS_SEMANA_LABEL: Record<string, string> = {
  MONDAY: 'Lunes',
  TUESDAY: 'Martes',
  WEDNESDAY: 'Miércoles',
  THURSDAY: 'Jueves',
  FRIDAY: 'Viernes',
  SATURDAY: 'Sábado',
  SUNDAY: 'Domingo',
};

function pickMaxEntry<T extends string | number>(record: Record<T, number> | undefined): { key: T; value: number } | null {
  if (!record) return null;
  let best: { key: T; value: number } | null = null;
  for (const [k, v] of Object.entries(record) as Array<[T, number]>) {
    if (best === null || v > best.value) best = { key: k, value: v };
  }
  return best && best.value > 0 ? best : null;
}

export default function DashboardCharts({ reservas, stats, espacios = [], loading = false }: Readonly<DashboardChartsProps>) {
  const espaciosById = useMemo(() => {
    const map = new Map<string, string>();
    for (const esp of espacios) map.set(String(esp.id), esp.nombre);
    return map;
  }, [espacios]);

  // Tasa de aprobación: aprobadas / (aprobadas + pendientes + canceladas)
  const tasaAprobacion = useMemo(() => {
    const conteos = stats?.reservasPorEstado ?? reservas.reduce((acc, r) => {
      acc[r.estado] = (acc[r.estado] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const aprobadas = conteos.APROBADO || 0;
    const total = (conteos.APROBADO || 0) + (conteos.PENDIENTE || 0) + (conteos.CANCELADO || 0);
    return total > 0 ? Math.round((aprobadas / total) * 100) : 0;
  }, [stats, reservas]);

  // Día pico de la semana
  const diaPico = useMemo(() => {
    if (stats?.reservasPorDiaSemana) {
      const max = pickMaxEntry(stats.reservasPorDiaSemana);
      if (!max) return null;
      return { label: DIAS_SEMANA_LABEL[max.key] ?? max.key, value: max.value };
    }
    const conteos: Record<string, number> = {};
    for (const r of reservas) {
      const d = new Date(r.inicio).getDay();
      const idx = d === 0 ? 6 : d - 1;
      const key = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'][idx];
      conteos[key] = (conteos[key] || 0) + 1;
    }
    const max = pickMaxEntry(conteos);
    return max ? { label: DIAS_SEMANA_LABEL[max.key] ?? max.key, value: max.value } : null;
  }, [stats, reservas]);

  // Espacio más usado
  const espacioTop = useMemo(() => {
    if (stats?.nombreEspacioMasUsado) {
      // Si stats trae el conteo del top en reservasPorEspacio lo usamos
      const conteo = stats.reservasPorEspacio
        ? Math.max(...Object.values(stats.reservasPorEspacio))
        : 0;
      return { label: stats.nombreEspacioMasUsado, value: conteo };
    }
    if (stats?.reservasPorEspacio) {
      const max = pickMaxEntry(stats.reservasPorEspacio);
      return max ? { label: espaciosById.get(max.key) ?? max.key, value: max.value } : null;
    }
    const conteos = reservas.reduce((acc, r) => {
      if (r.estado === 'APROBADO') acc[r.espacioNombre] = (acc[r.espacioNombre] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const max = pickMaxEntry(conteos);
    return max ? { label: max.key, value: max.value } : null;
  }, [stats, reservas, espaciosById]);

  // Duración total (horas)
  const horasTotales = useMemo(() => {
    if (typeof stats?.duracionTotalHoras === 'number') return Math.round(stats.duracionTotalHoras);
    let acc = 0;
    for (const r of reservas) {
      const ms = new Date(r.fin).getTime() - new Date(r.inicio).getTime();
      if (Number.isFinite(ms) && ms > 0) acc += ms;
    }
    return Math.round(acc / 3_600_000);
  }, [stats, reservas]);

  const cards = [
    {
      label: 'Tasa de Aprobación',
      value: `${tasaAprobacion}%`,
      change: tasaAprobacion >= 80 ? 'Excelente' : tasaAprobacion >= 50 ? 'Estable' : 'A revisar',
      icon: TrendingUp,
      color: 'text-success-texto',
    },
    {
      label: 'Día Pico',
      value: diaPico?.label ?? '—',
      change: diaPico ? `${diaPico.value} reservas` : 'Sin datos',
      icon: CalendarDays,
      color: 'text-info-texto',
    },
    {
      label: 'Espacio Más Usado',
      value: espacioTop?.label ?? '—',
      change: espacioTop ? `${espacioTop.value} reservas` : 'Sin datos',
      icon: MapPin,
      color: 'text-acento-texto',
    },
    {
      label: 'Horas Reservadas',
      value: horasTotales > 0 ? `${horasTotales}h` : '—',
      change: 'Acumulado total',
      icon: Clock,
      color: 'text-warning-texto',
    },
  ];

  if (loading) {
    return (
      <div className="grid gap-4 lg:gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 w-24 bg-secondary rounded animate-pulse" />
              <div className="h-4 w-4 bg-secondary rounded animate-pulse" />
            </CardHeader>
            <CardContent>
              <div className="h-8 w-16 bg-secondary rounded animate-pulse mb-2" />
              <div className="h-3 w-32 bg-secondary rounded animate-pulse" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 lg:gap-6 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((c) => {
        const Icon = c.icon;
        return (
          <Card key={c.label} className="transition-all hover:shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{c.label}</CardTitle>
              <Icon className={`h-4 w-4 ${c.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold truncate" title={String(c.value)}>{c.value}</div>
              <p className="text-xs text-muted-foreground mt-1">{c.change}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
