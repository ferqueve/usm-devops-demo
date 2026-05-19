import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { toast } from 'sonner';
import {
  Activity,
  Boxes,
  CalendarRange,
  GitCompareArrows,
  Grid3x3,
  TrendingUp,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { TooltipProps } from 'recharts';
import {
  statsApi,
  type DeltaInventario,
  type EvolucionEstadoPunto,
  type EvolucionParquePunto,
  type MatrizEspacioTipo,
} from '@/lib/api/stats';

type RangoPreset = 'ultimos-30' | 'ultimos-90' | 'anio-actual';

interface Rango {
  desde: string;
  hasta: string;
  label: string;
}

const PRESETS: Record<RangoPreset, { label: string; build: () => Rango }> = {
  'ultimos-30': {
    label: 'Últimos 30 días',
    build: () => {
      const hoy = new Date();
      const ini = new Date();
      ini.setDate(hoy.getDate() - 30);
      return { desde: ini.toISOString().slice(0, 10), hasta: hoy.toISOString().slice(0, 10), label: 'Últimos 30 días' };
    },
  },
  'ultimos-90': {
    label: 'Últimos 90 días',
    build: () => {
      const hoy = new Date();
      const ini = new Date();
      ini.setDate(hoy.getDate() - 90);
      return { desde: ini.toISOString().slice(0, 10), hasta: hoy.toISOString().slice(0, 10), label: 'Últimos 90 días' };
    },
  },
  'anio-actual': {
    label: 'Año actual',
    build: () => {
      const hoy = new Date();
      const ini = new Date(hoy.getFullYear(), 0, 1);
      return { desde: ini.toISOString().slice(0, 10), hasta: hoy.toISOString().slice(0, 10), label: 'Año actual' };
    },
  },
};

interface SectionHeaderProps {
  title: string;
  accent: string;
  icon: React.ComponentType<{ className?: string }>;
}

function SectionHeader({ title, accent, icon: Icon }: Readonly<SectionHeaderProps>) {
  return (
    <div className="flex items-center gap-2.5 px-4 py-2.5 bg-utec-dark text-white">
      <span className="w-1 h-4 rounded-sm shrink-0" style={{ backgroundColor: accent }} aria-hidden />
      <Icon className="h-3.5 w-3.5 text-white/70 shrink-0" />
      <h3 className="text-sm font-semibold tracking-tight truncate">{title}</h3>
    </div>
  );
}

interface TooltipPayload { name?: string; value?: number; color?: string; }

const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-utec-dark text-white border border-utec-dark/40 rounded-md shadow-lg px-2.5 py-1.5 text-xs">
      {label && <p className="text-white/60 mb-0.5">{label}</p>}
      {payload.map((entry, i) => {
        const p = entry as TooltipPayload;
        return (
          <p key={`${p.name ?? 'e'}-${i}`} className="tabular-nums">
            <span style={{ color: p.color }}>●</span>{' '}
            <span className="text-white/70">{p.name}:</span>{' '}
            <span className="font-semibold">{p.value}</span>
          </p>
        );
      })}
    </div>
  );
};

export default function EstadisticasAvanzadasInventario() {
  const [preset, setPreset] = useState<RangoPreset>('ultimos-30');
  const rango = useMemo<Rango>(() => PRESETS[preset].build(), [preset]);

  const [evolucionEstado, setEvolucionEstado] = useState<EvolucionEstadoPunto[]>([]);
  const [evolucionParque, setEvolucionParque] = useState<EvolucionParquePunto[]>([]);
  const [delta, setDelta] = useState<DeltaInventario | null>(null);
  const [matriz, setMatriz] = useState<MatrizEspacioTipo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelado = false;
    const cargar = async () => {
      setLoading(true);
      try {
        const [ev, ep, dl, mz] = await Promise.all([
          statsApi.evolucionEstadoInventario(rango),
          statsApi.evolucionParqueInventario(rango),
          statsApi.deltaInventario(rango.desde, rango.hasta),
          statsApi.matrizEspacioTipo(),
        ]);
        if (cancelado) return;
        setEvolucionEstado(ev.data ?? []);
        setEvolucionParque(ep.data ?? []);
        setDelta(dl.data ?? null);
        setMatriz(mz.data ?? null);
      } catch (error) {
        console.error('Error cargando estadísticas avanzadas de inventario', error);
        toast.error('No se pudieron cargar las métricas avanzadas');
      } finally {
        if (!cancelado) setLoading(false);
      }
    };
    cargar();
    return () => { cancelado = true; };
  }, [rango]);

  // Datos derivados para el heatmap (matriz).
  const heatmapData = useMemo(() => {
    if (!matriz) return null;
    const map: Record<string, number> = {};
    let max = 0;
    for (const c of matriz.celdas) {
      map[`${c.espacioId}-${c.tipoId}`] = c.total;
      if (c.total > max) max = c.total;
    }
    return { map, max };
  }, [matriz]);

  const deltaConCambio = useMemo(
    () => delta?.porEspacio.filter((f) => f.deltaItems !== 0 || f.deltaUnidades !== 0) ?? [],
    [delta],
  );

  return (
    <div className="space-y-4">
      {/* Header rango */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card px-4 py-2.5">
        <div className="flex items-center gap-2 text-sm font-semibold text-utec-dark">
          <CalendarRange className="h-4 w-4 text-utec-blue" />
          Métricas analíticas
          <span className="font-normal text-xs text-muted-foreground ml-2">
            {rango.desde} → {rango.hasta}
          </span>
        </div>
        <div className="flex gap-1.5">
          {(Object.keys(PRESETS) as RangoPreset[]).map((key) => (
            <Button
              key={key}
              size="sm"
              variant={preset === key ? 'default' : 'outline'}
              onClick={() => setPreset(key)}
              className="h-7 text-xs px-2.5"
            >
              {PRESETS[key].label}
            </Button>
          ))}
        </div>
      </div>

      {/* Evolución estado + Evolución parque en grilla 2 columnas */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border bg-card overflow-hidden">
          <SectionHeader title="Evolución del estado del parque" accent="#86bb4c" icon={Activity} />
          <div className="p-3">
            {loading ? (
              <div className="h-56 animate-pulse rounded bg-muted" />
            ) : evolucionEstado.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">Sin snapshots en el rango.</p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={evolucionEstado} margin={{ top: 5, right: 8, left: -16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="2 4" stroke="#e5e7eb" vertical={false} />
                  <XAxis
                    dataKey="fecha"
                    tick={{ fontSize: 10, fill: '#6b7280' }}
                    axisLine={{ stroke: '#e5e7eb' }}
                    tickLine={false}
                    interval="preserveStartEnd"
                  />
                  <YAxis tick={{ fontSize: 10, fill: '#6b7280' }} axisLine={false} tickLine={false} width={32} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 10, paddingTop: 4 }} iconSize={8} />
                  <Line type="monotone" dataKey="disponibles" name="Disponibles" stroke="#86bb4c" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="mantenimiento" name="Mantenimiento" stroke="#F6CA21" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="danados" name="Dañados" stroke="#DF2B31" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
          <div className="px-3 py-1.5 border-t bg-muted/40 text-[10px] text-muted-foreground">
            Snapshot diario tomado a las 03:15 AM (UTC)
          </div>
        </div>

        <div className="rounded-xl border bg-card overflow-hidden">
          <SectionHeader title="Crecimiento del parque" accent="#184897" icon={TrendingUp} />
          <div className="p-3">
            {loading ? (
              <div className="h-56 animate-pulse rounded bg-muted" />
            ) : evolucionParque.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">Sin snapshots en el rango.</p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={evolucionParque} margin={{ top: 5, right: 8, left: -16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="2 4" stroke="#e5e7eb" vertical={false} />
                  <XAxis
                    dataKey="fecha"
                    tick={{ fontSize: 10, fill: '#6b7280' }}
                    axisLine={{ stroke: '#e5e7eb' }}
                    tickLine={false}
                    interval="preserveStartEnd"
                  />
                  <YAxis tick={{ fontSize: 10, fill: '#6b7280' }} axisLine={false} tickLine={false} width={32} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(24,72,151,0.08)' }} />
                  <Legend wrapperStyle={{ fontSize: 10, paddingTop: 4 }} iconSize={8} />
                  <Bar dataKey="items" name="Items" fill="#184897" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="unidades" name="Unidades" fill="#00c7ff" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
          <div className="px-3 py-1.5 border-t bg-muted/40 text-[10px] text-muted-foreground">
            Items = filas en la tabla · Unidades = SUM(cantidad)
          </div>
        </div>
      </div>

      {/* Delta + Matriz en grilla 2 cols (delta más angosto) */}
      <div className="grid gap-4 lg:grid-cols-[2fr_3fr]">
        <div className="rounded-xl border bg-card overflow-hidden">
          <SectionHeader title="Cambios entre snapshots" accent="#DE7A27" icon={GitCompareArrows} />
          <div className="p-3">
            {loading ? (
              <div className="h-48 animate-pulse rounded bg-muted" />
            ) : !delta ? (
              <p className="text-sm text-muted-foreground">Sin datos.</p>
            ) : deltaConCambio.length === 0 ? (
              <p className="text-xs text-muted-foreground py-6 text-center">
                Sin cambios entre {delta.fechaInicio} y {delta.fechaFin}.
              </p>
            ) : (
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-[10px] uppercase tracking-wide text-muted-foreground border-b">
                    <th className="text-left py-1.5 font-medium">Espacio</th>
                    <th className="text-right py-1.5 font-medium w-16">Items</th>
                    <th className="text-right py-1.5 font-medium w-20">Δ Items</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {deltaConCambio.slice(0, 15).map((f) => (
                    <tr key={f.espacioId} className="hover:bg-muted/30">
                      <td className="py-1.5 truncate pr-2">{f.espacioNombre}</td>
                      <td className="py-1.5 text-right tabular-nums text-muted-foreground">
                        {f.itemsInicio} → {f.itemsFin}
                      </td>
                      <td className="py-1.5 text-right">
                        <span
                          className={`inline-block min-w-[2.5rem] text-center px-2 py-0.5 rounded font-semibold tabular-nums text-[11px] ${
                            f.deltaItems > 0
                              ? 'bg-utec-green/15 text-utec-green'
                              : f.deltaItems < 0
                                ? 'bg-utec-red text-white'
                                : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          {f.deltaItems > 0 ? '+' : ''}{f.deltaItems}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="rounded-xl border bg-card overflow-hidden">
          <SectionHeader title="Matriz espacio × tipo (estado actual)" accent="#00c7ff" icon={Grid3x3} />
          <div className="p-3">
            {loading ? (
              <div className="h-48 animate-pulse rounded bg-muted" />
            ) : !matriz || matriz.celdas.length === 0 || !heatmapData ? (
              <p className="text-sm text-muted-foreground py-6 text-center">Sin datos.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="text-[10px] border-separate border-spacing-[2px]">
                  <thead>
                    <tr>
                      <th className="text-left text-muted-foreground font-medium pr-2 py-1 sticky left-0 bg-card">Espacio</th>
                      {matriz.tipos.map((t) => (
                        <th
                          key={t.tipoId}
                          className="text-center font-medium text-muted-foreground py-1 px-1 align-bottom"
                          style={{ minWidth: 50, maxWidth: 80 }}
                          title={t.tipoNombre}
                        >
                          <div className="truncate" style={{ maxWidth: 70 }}>{t.tipoNombre}</div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {matriz.espacios.map((e) => (
                      <tr key={e.espacioId}>
                        <td className="text-right pr-2 text-muted-foreground font-medium sticky left-0 bg-card whitespace-nowrap" title={e.espacioNombre}>
                          <span className="block truncate" style={{ maxWidth: 110 }}>{e.espacioNombre}</span>
                        </td>
                        {matriz.tipos.map((t) => {
                          const valor = heatmapData.map[`${e.espacioId}-${t.tipoId}`] ?? 0;
                          const intensidad = heatmapData.max === 0 ? 0 : valor / heatmapData.max;
                          const bg = valor === 0
                            ? '#f1f5f9'
                            : `rgba(0, 199, 255, ${0.2 + intensidad * 0.8})`;
                          return (
                            <td
                              key={t.tipoId}
                              title={`${e.espacioNombre} · ${t.tipoNombre}: ${valor}`}
                              className="w-8 h-7 text-center align-middle rounded font-medium tabular-nums"
                              style={{ background: bg, color: intensidad > 0.5 ? '#0c2340' : '#475569' }}
                            >
                              {valor || ''}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="flex items-center justify-end gap-1.5 mt-2 text-[10px] text-muted-foreground">
                  <Boxes className="h-3 w-3" />
                  <span>Menos</span>
                  {[0.2, 0.4, 0.6, 0.8, 1].map((i) => (
                    <span
                      key={i}
                      className="w-4 h-3 rounded"
                      style={{ background: `rgba(0, 199, 255, ${i})` }}
                    />
                  ))}
                  <span>Más</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
