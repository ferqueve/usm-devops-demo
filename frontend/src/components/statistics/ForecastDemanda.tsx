import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { toast } from 'sonner';
import {
  Brain,
  Loader2,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { TooltipProps } from 'recharts';
import {
  statsApi,
  type CalidadModelo,
  type ForecastDemanda as ForecastData,
} from '@/lib/api/stats';
import { postAnalyzeForecast } from '@/lib/api/ai';
import { useRolePermissions } from '@/hooks/useRolePermissions';

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

interface TooltipPayload { name?: string; value?: number; color?: string; payload?: Record<string, unknown>; }

const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-utec-dark text-white border border-utec-dark/40 rounded-md shadow-lg px-2.5 py-1.5 text-xs">
      {label && <p className="text-white/60 mb-0.5">{label}</p>}
      {payload.map((entry, i) => {
        const p = entry as TooltipPayload;
        if (p.value == null) return null;
        return (
          <p key={`${p.name ?? 'e'}-${i}`} className="tabular-nums">
            <span style={{ color: p.color }}>●</span>{' '}
            <span className="text-white/70">{p.name}:</span>{' '}
            <span className="font-semibold">{Math.round(p.value)}</span>
          </p>
        );
      })}
    </div>
  );
};

function formatFechaCorta(fecha: string): string {
  // "2026-05-18" → "18 may"
  const d = new Date(`${fecha}T00:00:00Z`);
  return d.toLocaleDateString('es-UY', { day: '2-digit', month: 'short', timeZone: 'UTC' });
}

function formatTrainedAt(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleString('es-UY', { dateStyle: 'medium', timeStyle: 'short' });
}

export default function ForecastDemanda() {
  const { hasRole } = useRolePermissions();
  const esAdmin = hasRole('ADMIN');

  const [forecast, setForecast] = useState<ForecastData | null>(null);
  const [calidad, setCalidad] = useState<CalidadModelo | null>(null);
  const [loading, setLoading] = useState(true);
  const [retraining, setRetraining] = useState(false);
  const [aiAnalisis, setAiAnalisis] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const cargar = async () => {
    setLoading(true);
    try {
      const [f, c] = await Promise.all([
        statsApi.forecastDemanda(60),
        statsApi.calidadModeloML(),
      ]);
      setForecast(f.data ?? null);
      setCalidad(c.data ?? null);
    } catch (error) {
      console.error('Error cargando forecast', error);
      toast.error('No se pudo cargar el forecast');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargar();
  }, []);

  const handleRetrain = async () => {
    setRetraining(true);
    toast.info('Reentrenando modelo, esto puede tardar unos segundos...');
    try {
      const res = await statsApi.reentrenarModeloML();
      const body = res.data as Record<string, unknown> | undefined;
      if (body?.status === 'error') {
        toast.error('Error al reentrenar', { description: String(body.error ?? '') });
      } else {
        toast.success('Modelo reentrenado');
        await cargar();
      }
    } catch (error) {
      toast.error('Falló el reentrenamiento', {
        description: error instanceof Error ? error.message : 'Error desconocido',
      });
    } finally {
      setRetraining(false);
    }
  };

  const chartData = useMemo(() => {
    if (!forecast) return [];
    const map = new Map<string, { fecha: string; real?: number; prediccion?: number; bandaInferior?: number; bandaSuperior?: number }>();
    for (const h of forecast.historico) {
      map.set(h.fecha, { fecha: h.fecha, real: h.real });
    }
    for (const p of forecast.predicciones) {
      const existing = map.get(p.fecha) ?? { fecha: p.fecha };
      existing.prediccion = p.prediccion;
      existing.bandaInferior = p.bandaInferior ?? undefined;
      existing.bandaSuperior = p.bandaSuperior ?? undefined;
      map.set(p.fecha, existing);
    }
    return [...map.values()].sort((a, b) => a.fecha.localeCompare(b.fecha));
  }, [forecast]);

  const sinModelo = !loading && (!forecast || forecast.modeloId == null);

  const handleAnalyzeAi = async () => {
    if (!forecast) return;
    setAiLoading(true);
    setAiError(null);
    setAiAnalisis(null);
    try {
      const res = await postAnalyzeForecast({
        historico: forecast.historico.map((h) => ({ fecha: h.fecha, real: h.real })),
        predicciones: forecast.predicciones.map((p) => ({
          fecha: p.fecha,
          prediccion: p.prediccion,
          bandaInferior: p.bandaInferior,
          bandaSuperior: p.bandaSuperior,
        })),
        mape: calidad?.mape ?? null,
      });
      if (res.success && res.data) {
        setAiAnalisis(res.data.analisis);
      } else {
        setAiError(res.error || 'Sin respuesta');
      }
    } catch (e) {
      setAiError(String(e));
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      <div className="flex items-center justify-between gap-3 px-4 py-2.5 bg-utec-dark text-white">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="w-1 h-4 rounded-sm bg-utec-cyan shrink-0" aria-hidden />
          <Brain className="h-3.5 w-3.5 text-white/70 shrink-0" />
          <h3 className="text-sm font-semibold tracking-tight">Predicción de demanda · próximos 30 días</h3>
          <span className="ml-1 inline-flex items-center gap-1 text-[10px] uppercase tracking-wider text-white/60 bg-white/10 px-1.5 py-0.5 rounded">
            <Sparkles className="h-2.5 w-2.5" /> ML
          </span>
        </div>
        {esAdmin && (
          <Button
            size="sm"
            variant="outline"
            onClick={handleRetrain}
            disabled={retraining}
            className="h-7 text-xs px-2.5 bg-white/10 text-white border-white/20 hover:bg-white/20"
          >
            {retraining ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
            <span className="ml-1">Reentrenar</span>
          </Button>
        )}
      </div>

      <div className="grid lg:grid-cols-[1fr_220px]">
        <div className="p-3">
          {loading ? (
            <div className="h-56 animate-pulse rounded bg-muted" />
          ) : sinModelo ? (
            <div className="flex flex-col items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
              <Brain className="h-8 w-8 text-utec-cyan/40" />
              <p>Todavía no hay un modelo entrenado.</p>
              {esAdmin && (
                <p className="text-xs">Usá <span className="font-medium">"Reentrenar"</span> para generarlo (requiere ml-svc activo).</p>
              )}
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <ComposedChart data={chartData} margin={{ top: 5, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="2 4" stroke="#e5e7eb" vertical={false} />
                <XAxis
                  dataKey="fecha"
                  tick={{ fontSize: 10, fill: '#6b7280' }}
                  axisLine={{ stroke: '#e5e7eb' }}
                  tickLine={false}
                  interval="preserveStartEnd"
                  tickFormatter={formatFechaCorta}
                />
                <YAxis tick={{ fontSize: 10, fill: '#6b7280' }} axisLine={false} tickLine={false} width={32} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 10, paddingTop: 4 }} iconSize={8} />
                <Area
                  type="monotone"
                  dataKey="bandaSuperior"
                  name="Banda superior"
                  stroke="none"
                  fill="#00c7ff"
                  fillOpacity={0.12}
                  legendType="none"
                  activeDot={false}
                  isAnimationActive={false}
                />
                <Area
                  type="monotone"
                  dataKey="bandaInferior"
                  name="Banda inferior"
                  stroke="none"
                  fill="#ffffff"
                  fillOpacity={1}
                  legendType="none"
                  activeDot={false}
                  isAnimationActive={false}
                />
                <Line
                  type="monotone"
                  dataKey="real"
                  name="Histórico real"
                  stroke="#184897"
                  strokeWidth={2}
                  dot={false}
                  connectNulls={false}
                />
                <Line
                  type="monotone"
                  dataKey="prediccion"
                  name="Predicción"
                  stroke="#00c7ff"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  dot={false}
                  connectNulls={false}
                />
              </ComposedChart>
            </ResponsiveContainer>
          )}
        </div>

        <aside className="border-t lg:border-t-0 lg:border-l border-border bg-muted/30 p-3 space-y-2">
          <div className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">Modelo activo</div>
          <div className="space-y-2 text-xs">
            <div>
              <div className="text-muted-foreground text-[10px]">Algoritmo</div>
              <div className="font-semibold uppercase">{calidad?.algoritmo ?? '—'}</div>
            </div>
            <div>
              <div className="text-muted-foreground text-[10px]">MAPE (error)</div>
              <div className="font-semibold tabular-nums text-utec-blue">
                {calidad?.mape != null ? `${Number(calidad.mape).toFixed(2)}%` : '—'}
              </div>
            </div>
            <div>
              <div className="text-muted-foreground text-[10px]">MAE</div>
              <div className="font-semibold tabular-nums">
                {calidad?.mae != null ? Number(calidad.mae).toFixed(2) : '—'}
              </div>
            </div>
            <div>
              <div className="text-muted-foreground text-[10px]">Muestra de entrenamiento</div>
              <div className="font-semibold tabular-nums">
                {calidad?.sampleSize != null ? `${calidad.sampleSize} días` : '—'}
              </div>
            </div>
            <div>
              <div className="text-muted-foreground text-[10px]">Último entrenamiento</div>
              <div className="font-semibold text-[11px]">{formatTrainedAt(calidad?.trainedAt)}</div>
            </div>
          </div>
        </aside>
      </div>
      {!sinModelo && (
        <div className="border-t bg-utec-blue/5 px-4 py-3">
          <div className="flex items-center justify-between gap-3 mb-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-utec-dark">
              <Sparkles className="h-3.5 w-3.5 text-utec-blue" />
              Análisis del forecast con IA
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground bg-white px-1.5 py-0.5 rounded border">
                Gemini
              </span>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={handleAnalyzeAi}
              disabled={aiLoading || loading}
              className="h-7 text-xs px-2.5"
            >
              {aiLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
              <span className="ml-1">{aiAnalisis ? 'Regenerar' : 'Analizar'}</span>
            </Button>
          </div>
          {!aiAnalisis && !aiError && !aiLoading && (
            <p className="text-xs text-muted-foreground">
              Interpreta tendencia, picos de demanda y recomendaciones operativas en lenguaje natural.
            </p>
          )}
          {aiLoading && <p className="text-xs italic text-muted-foreground">Analizando con Gemini…</p>}
          {aiAnalisis && <p className="text-sm leading-relaxed text-gray-800 whitespace-pre-wrap">{aiAnalisis}</p>}
          {aiError && <p className="text-xs text-red-600">Error: {aiError}</p>}
        </div>
      )}
      <div className="px-4 py-1.5 border-t bg-muted/40 text-[10px] text-muted-foreground">
        Modelo entrenado por el servicio Python <span className="font-mono">ml-svc</span> sobre la capa analítica. Reentrenamiento programado cada domingo.
      </div>
    </div>
  );
}
