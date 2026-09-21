import { useEffect, useState } from 'react';
import { Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { postStatsSummary } from '@/lib/api/ai';
import type { ResumenCarrera, ResumenReservas } from '@/lib/api/stats';
import { Skeleton } from '@/components/ui/skeleton';

interface Props {
  resumen: ResumenReservas;
  periodoTexto: string;
  espacioMasOcupado?: string;
  carreras: ResumenCarrera[];
}

/**
 * Lectura del período en lenguaje natural, a pedido. Le llegan los mismos
 * números que ve la pantalla; antes recibía los históricos aunque se mirara
 * otro período.
 */
export function ResumenIA({ resumen, periodoTexto, espacioMasOcupado, carreras }: Readonly<Props>) {
  const [texto, setTexto] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Un resumen de otro período confunde más de lo que ayuda.
  useEffect(() => {
    setTexto(null);
    setError(null);
  }, [resumen.desde, resumen.hasta]);

  const generar = async () => {
    setCargando(true);
    setError(null);
    try {
      const { actual, anterior } = resumen;
      const res = await postStatsSummary({
        periodo: periodoTexto,
        stats: {
          reservas: actual.total,
          aprobadas: actual.aprobadas,
          pendientes: actual.pendientes,
          pendientes_vencidas_sin_respuesta: actual.pendientesVencidas,
          anticipacion_promedio_dias: Math.round(actual.anticipacionPromedioDias * 10) / 10,
          canceladas: actual.canceladas,
          horas_aprobadas: Math.round(actual.horasAprobadas),
          espacios_usados: actual.espaciosUsados,
          espacios_total: resumen.espaciosTotal,
          personas_que_reservaron: actual.usuarios,
          periodo_anterior: { reservas: anterior.total, aprobadas: anterior.aprobadas, canceladas: anterior.canceladas },
          espacio_mas_ocupado: espacioMasOcupado ?? null,
          carreras_con_mas_cancelacion: [...carreras]
            .sort((a, b) => Number(b.tasaCancelacion) - Number(a.tasaCancelacion))
            .slice(0, 3)
            .map((c) => ({ carrera: c.carreraNombre, tasa: Number(c.tasaCancelacion) })),
          serie: resumen.serie.map((p) => ({ periodo: p.periodo, aprobadas: p.aprobadas, canceladas: p.canceladas })),
        },
      });
      if (res.success && res.data) {
        setTexto(res.data.resumen);
      } else {
        setError(res.error || 'El asistente no respondió.');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'El asistente no respondió.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
      {texto ? (
        <p className="flex-1 whitespace-pre-wrap text-sm leading-relaxed">{texto}</p>
      ) : cargando ? (
        <div className="w-full flex-1 space-y-2">
          {[95, 100, 88, 72, 60].map((w) => (
            <Skeleton key={w} className="h-3 rounded" style={{ width: `${w}%` }} />
          ))}
        </div>
      ) : (
        <p className="flex-1 text-sm leading-relaxed text-muted-foreground">
          Un párrafo con los hallazgos más importantes del período y una recomendación concreta, escrito para alguien que no va a mirar los gráficos.
        </p>
      )}
      {error && <p className="text-xs text-destructive">{error}</p>}
      <div className="shrink-0 self-start sm:self-center">
        <Button size="sm" variant="outline" onClick={generar} disabled={cargando} className="h-8 text-xs">
          {cargando ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
          <span className="ml-1.5">{texto ? 'Volver a generar' : 'Resumir con IA'}</span>
        </Button>
      </div>
    </div>
  );
}
