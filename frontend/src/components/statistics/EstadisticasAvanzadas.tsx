import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { toast } from 'sonner';
import {
  Activity,
  Building2,
  CalendarRange,
  GraduationCap,
  TrendingUp,
  Users,
} from 'lucide-react';
import {
  statsApi,
  type HeatmapCelda,
  type OcupacionEspacio,
  type ResumenCarrera,
  type ResumenEdificio,
  type TopUsuario,
} from '@/lib/api/stats';
import ForecastDemanda from './ForecastDemanda';

type RangoPreset = 'mes-actual' | 'ultimos-30' | 'anio-actual';

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
      const hace30 = new Date();
      hace30.setDate(hoy.getDate() - 30);
      return {
        desde: hace30.toISOString().slice(0, 10),
        hasta: hoy.toISOString().slice(0, 10),
        label: 'Últimos 30 días',
      };
    },
  },
  'mes-actual': {
    label: 'Mes actual',
    build: () => {
      const hoy = new Date();
      const inicio = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
      return {
        desde: inicio.toISOString().slice(0, 10),
        hasta: hoy.toISOString().slice(0, 10),
        label: 'Mes actual',
      };
    },
  },
  'anio-actual': {
    label: 'Año actual',
    build: () => {
      const hoy = new Date();
      const inicio = new Date(hoy.getFullYear(), 0, 1);
      return {
        desde: inicio.toISOString().slice(0, 10),
        hasta: hoy.toISOString().slice(0, 10),
        label: 'Año actual',
      };
    },
  },
};

const DIAS_SEMANA = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const HORAS = Array.from({ length: 24 }, (_, i) => i);
// Sólo mostramos el rango horario operativo de la sede (8-22) para evitar
// una grilla con mayoría de celdas vacías.
const HORAS_VISIBLES = HORAS.filter((h) => h >= 7 && h <= 22);

function formatHoras(horas: number): string {
  if (horas < 1) return `${Math.round(horas * 60)}m`;
  if (Number.isInteger(horas)) return `${horas}h`;
  const h = Math.floor(horas);
  const m = Math.round((horas - h) * 60);
  return `${h}h ${m}m`;
}

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

export default function EstadisticasAvanzadas() {
  const [preset, setPreset] = useState<RangoPreset>('ultimos-30');
  const rango = useMemo<Rango>(() => PRESETS[preset].build(), [preset]);

  const [ocupacion, setOcupacion] = useState<OcupacionEspacio[]>([]);
  const [heatmap, setHeatmap] = useState<HeatmapCelda[]>([]);
  const [porCarrera, setPorCarrera] = useState<ResumenCarrera[]>([]);
  const [porEdificio, setPorEdificio] = useState<ResumenEdificio[]>([]);
  const [topUsuarios, setTopUsuarios] = useState<TopUsuario[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelado = false;
    const cargar = async () => {
      setLoading(true);
      try {
        const [ocu, hm, car, ed, top] = await Promise.all([
          statsApi.ocupacionPorEspacio(rango),
          statsApi.heatmapDiaHora(rango),
          statsApi.resumenPorCarrera(rango),
          statsApi.resumenPorEdificio(rango),
          statsApi.topUsuarios({ ...rango, limite: 10 }),
        ]);
        if (cancelado) return;
        setOcupacion(ocu.data ?? []);
        setHeatmap(hm.data ?? []);
        setPorCarrera(car.data ?? []);
        setPorEdificio(ed.data ?? []);
        setTopUsuarios(top.data ?? []);
      } catch (error) {
        console.error('Error cargando estadísticas avanzadas', error);
        toast.error('No se pudieron cargar las métricas avanzadas');
      } finally {
        if (!cancelado) setLoading(false);
      }
    };
    cargar();
    return () => {
      cancelado = true;
    };
  }, [rango]);

  const maxHeatmap = useMemo(
    () => heatmap.reduce((m, c) => (c.cant > m ? c.cant : m), 0),
    [heatmap],
  );
  const matrizHeatmap = useMemo(() => {
    const matrix: Record<number, Record<number, number>> = {};
    for (const dia of [0, 1, 2, 3, 4, 5, 6]) matrix[dia] = {};
    for (const celda of heatmap) {
      matrix[celda.diaSemana][celda.hora] = celda.cant;
    }
    return matrix;
  }, [heatmap]);

  const maxCantEdificio = useMemo(
    () => porEdificio.reduce((m, e) => (e.cantReservas > m ? e.cantReservas : m), 0),
    [porEdificio],
  );

  const maxCantUsuario = useMemo(
    () => topUsuarios.reduce((m, u) => (u.cantReservas > m ? u.cantReservas : m), 0),
    [topUsuarios],
  );

  return (
    <div className="space-y-4">
      {/* Header con selector de rango */}
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

      {/* Heatmap full-width compacto */}
      <div className="rounded-xl border bg-card overflow-hidden">
        <SectionHeader title="Mapa de calor · día × hora (reservas aprobadas)" accent="#184897" icon={Activity} />
        <div className="p-3">
          {loading ? (
            <div className="h-32 animate-pulse rounded bg-muted" />
          ) : maxHeatmap === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">Sin reservas aprobadas en el rango.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="text-[10px] border-separate border-spacing-[2px] mx-auto">
                <thead>
                  <tr>
                    <th className="w-9"></th>
                    {HORAS_VISIBLES.map((h) => (
                      <th key={h} className="w-7 text-center font-medium text-muted-foreground py-1">
                        {h}h
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[1, 2, 3, 4, 5, 6, 0].map((dia) => (
                    <tr key={dia}>
                      <td className="pr-2 text-right text-muted-foreground font-medium">{DIAS_SEMANA[dia]}</td>
                      {HORAS_VISIBLES.map((h) => {
                        const cant = matrizHeatmap[dia][h] ?? 0;
                        const intensidad = maxHeatmap === 0 ? 0 : cant / maxHeatmap;
                        const bg = cant === 0
                          ? '#f1f5f9'
                          : `rgba(24, 72, 151, ${0.18 + intensidad * 0.82})`;
                        return (
                          <td
                            key={h}
                            title={`${DIAS_SEMANA[dia]} ${h}:00 → ${cant} reservas`}
                            className="w-7 h-7 text-center align-middle rounded font-medium tabular-nums"
                            style={{ background: bg, color: intensidad > 0.5 ? 'white' : '#475569' }}
                          >
                            {cant || ''}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="flex items-center justify-end gap-1.5 mt-2 text-[10px] text-muted-foreground">
                <span>Menos</span>
                {[0.18, 0.4, 0.6, 0.8, 1].map((i) => (
                  <span
                    key={i}
                    className="w-4 h-3 rounded"
                    style={{ background: `rgba(24, 72, 151, ${i})` }}
                  />
                ))}
                <span>Más</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Grilla 3 columnas: ocupación + edificio + top usuarios */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-xl border bg-card overflow-hidden">
          <SectionHeader title="Ocupación por espacio" accent="#86bb4c" icon={TrendingUp} />
          <div className="p-3">
            {loading ? (
              <div className="h-48 animate-pulse rounded bg-muted" />
            ) : ocupacion.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin datos.</p>
            ) : (
              <ul className="space-y-1.5">
                {ocupacion.slice(0, 10).map((o) => (
                  <li key={o.espacioId}>
                    <div className="flex items-center justify-between text-xs mb-0.5">
                      <span className="font-medium truncate pr-2">{o.espacioNombre}</span>
                      <span className="text-muted-foreground tabular-nums shrink-0">
                        {formatHoras(o.horasReservadas)} · <span className="font-semibold text-utec-green">{o.porcentaje}%</span>
                      </span>
                    </div>
                    <div className="h-1.5 bg-muted rounded">
                      <div
                        className="h-1.5 rounded bg-utec-green"
                        style={{ width: `${Math.min(100, o.porcentaje)}%` }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="px-3 py-1.5 border-t bg-muted/40 text-[10px] text-muted-foreground">
            Base: 14h disponibles/día × días del rango
          </div>
        </div>

        <div className="rounded-xl border bg-card overflow-hidden">
          <SectionHeader title="Distribución por edificio" accent="#00c7ff" icon={Building2} />
          <div className="p-3">
            {loading ? (
              <div className="h-48 animate-pulse rounded bg-muted" />
            ) : porEdificio.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin datos.</p>
            ) : (
              <ul className="space-y-2">
                {porEdificio.map((e) => (
                  <li key={`${e.edificioId ?? 'sin'}`}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-medium truncate pr-2">{e.edificioNombre}</span>
                      <span className="font-semibold tabular-nums">{e.cantReservas}</span>
                    </div>
                    <div className="h-2 bg-muted rounded">
                      <div
                        className="h-2 rounded bg-utec-cyan"
                        style={{
                          width: `${maxCantEdificio === 0 ? 0 : (e.cantReservas / maxCantEdificio) * 100}%`,
                        }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="rounded-xl border bg-card overflow-hidden">
          <SectionHeader title="Top 10 usuarios reservadores" accent="#F6CA21" icon={Users} />
          <div className="p-1">
            {loading ? (
              <div className="h-48 animate-pulse rounded bg-muted m-2" />
            ) : topUsuarios.length === 0 ? (
              <p className="text-sm text-muted-foreground p-3">Sin datos.</p>
            ) : (
              <ul className="divide-y divide-border/60">
                {topUsuarios.map((u, idx) => {
                  const ratio = maxCantUsuario === 0 ? 0 : (u.cantReservas / maxCantUsuario) * 100;
                  return (
                    <li key={u.usuarioId} className="px-2.5 py-1.5 relative overflow-hidden">
                      <div
                        className="absolute inset-y-0 left-0 bg-utec-yellow/20"
                        style={{ width: `${ratio}%` }}
                        aria-hidden
                      />
                      <div className="relative flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-muted-foreground tabular-nums w-4 text-right">{idx + 1}.</span>
                          <div className="min-w-0">
                            <div className="font-medium truncate">{u.nombre}</div>
                            <div className="text-[10px] text-muted-foreground truncate">{u.email}</div>
                          </div>
                        </div>
                        <span className="font-semibold tabular-nums ml-2 shrink-0">{u.cantReservas}</span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* Forecast de demanda (capa ML) */}
      <ForecastDemanda />

      {/* Tasa de cancelación por carrera, fila full */}
      <div className="rounded-xl border bg-card overflow-hidden">
        <SectionHeader title="Tasa de cancelación por carrera" accent="#DE7A27" icon={GraduationCap} />
        <div className="p-3">
          {loading ? (
            <div className="h-32 animate-pulse rounded bg-muted" />
          ) : porCarrera.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin datos.</p>
          ) : (
            <table className="w-full text-xs">
              <thead>
                <tr className="text-[10px] uppercase tracking-wide text-muted-foreground border-b">
                  <th className="text-left py-1.5 font-medium">Carrera</th>
                  <th className="text-right py-1.5 font-medium w-20">Aprobadas</th>
                  <th className="text-right py-1.5 font-medium w-20">Canceladas</th>
                  <th className="text-right py-1.5 font-medium w-24">Tasa</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {porCarrera.slice(0, 12).map((c) => {
                  const alta = c.tasaCancelacion > 15;
                  const media = c.tasaCancelacion > 8 && c.tasaCancelacion <= 15;
                  return (
                    <tr key={`${c.carreraId ?? 'sin'}-${c.carreraNombre}`} className="hover:bg-muted/30">
                      <td className="py-1.5 truncate pr-2">{c.carreraNombre}</td>
                      <td className="py-1.5 text-right tabular-nums">{c.aprobadas}</td>
                      <td className="py-1.5 text-right tabular-nums text-muted-foreground">{c.canceladas}</td>
                      <td className="py-1.5 text-right">
                        <span
                          className={`inline-block min-w-[3rem] text-center px-2 py-0.5 rounded font-semibold tabular-nums text-[11px] ${
                            alta
                              ? 'bg-utec-red text-white'
                              : media
                                ? 'bg-utec-orange text-white'
                                : 'bg-utec-green/15 text-utec-green'
                          }`}
                        >
                          {c.tasaCancelacion}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
