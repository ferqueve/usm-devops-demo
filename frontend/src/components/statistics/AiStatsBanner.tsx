import { useState } from 'react';
import { Sparkles, Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { postStatsSummary } from '@/lib/api/ai';
import type { ReservaStats } from '@/lib/types/spaces';

interface AiStatsBannerProps {
  stats: ReservaStats | null;
  periodo?: string;
}

export function AiStatsBanner({ stats, periodo = 'últimos 30 días' }: Readonly<AiStatsBannerProps>) {
  const [loading, setLoading] = useState(false);
  const [resumen, setResumen] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function generar() {
    if (!stats) return;
    setLoading(true);
    setError(null);
    try {
      const res = await postStatsSummary({
        periodo,
        stats: {
          total_reservas: stats.totalReservas,
          aprobadas: stats.totalAprobadas,
          pendientes: stats.totalPendientes,
          canceladas: stats.totalCanceladas,
          este_mes: stats.reservasEsteMes,
          proximo_mes: stats.reservasProximoMes,
          este_anio: stats.reservasEsteAnio,
          promedio_semanal: stats.promedioReservasPorSemana,
          promedio_mensual: stats.promedioReservasPorMes,
          duracion_total_horas: stats.duracionTotalHoras,
          duracion_promedio_horas: stats.duracionPromedioHoras,
          espacio_mas_usado: stats.nombreEspacioMasUsado,
          mes_pico: stats.mesConMasReservas,
          diferencia_mes_anterior: stats.diferenciaMesAnterior,
          reservas_por_dia_semana: stats.reservasPorDiaSemana,
        },
      });
      if (res.success && res.data) {
        setResumen(res.data.resumen);
      } else {
        setError(res.error || 'Sin respuesta');
      }
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-xl border bg-gradient-to-br from-utec-blue/5 via-white to-utec-cyan/5 overflow-hidden">
      <div className="flex items-center justify-between gap-3 px-4 py-2.5 bg-utec-dark text-white">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="w-1 h-4 rounded-sm bg-utec-yellow shrink-0" aria-hidden />
          <Sparkles className="h-3.5 w-3.5 text-utec-yellow shrink-0" />
          <h3 className="text-sm font-semibold tracking-tight truncate">Resumen ejecutivo con IA</h3>
          <span className="ml-1 inline-flex items-center gap-1 text-[10px] uppercase tracking-wider text-white/60 bg-white/10 px-1.5 py-0.5 rounded">
            Gemini
          </span>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={generar}
          disabled={loading || !stats}
          className="h-7 text-xs px-2.5 bg-white/10 text-white border-white/20 hover:bg-white/20"
        >
          {loading ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : resumen ? (
            <RefreshCw className="h-3 w-3" />
          ) : (
            <Sparkles className="h-3 w-3" />
          )}
          <span className="ml-1">{resumen ? 'Regenerar' : 'Generar resumen'}</span>
        </Button>
      </div>
      <div className="px-4 py-3 text-sm">
        {!resumen && !error && !loading && (
          <p className="text-muted-foreground">
            Pedile al asistente un resumen narrativo del estado actual de las reservas.
          </p>
        )}
        {loading && (
          <p className="text-muted-foreground italic">Analizando datos con Gemini…</p>
        )}
        {resumen && (
          <p className="whitespace-pre-wrap leading-relaxed text-gray-800">{resumen}</p>
        )}
        {error && (
          <p className="text-red-600">Error: {error}</p>
        )}
      </div>
    </div>
  );
}
