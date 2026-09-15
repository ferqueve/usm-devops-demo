import { useEffect, useState } from 'react';
import { CloudOff, Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import type { ApiResponse } from '@/lib/api/client';

interface Props {
  /** Qué va a contar el análisis, antes de pedirlo. */
  descripcion: string;
  /** Arma el pedido con los números que se ven en la vista. */
  pedir: () => Promise<ApiResponse<{ analisis: string }>>;
  /** Cuando cambia (otro tipo de espacio, otro entrenamiento) el texto anterior se descarta. */
  clave?: string | number;
}

/**
 * El detalle técnico que devuelve el backend ("HTTP 502: {detail: LLM error…}")
 * no le dice nada a quien mira la predicción y parecía que se había roto la
 * vista. Se muestra un aviso llano y el detalle queda en el tooltip y la consola.
 */
const IA_NO_DISPONIBLE = 'El asistente de IA no está disponible en este momento. Las predicciones de arriba no dependen de él: probá de nuevo más tarde.';

/**
 * Lectura en lenguaje natural de una predicción, a pedido: cada una cuesta una
 * llamada al LLM. Las tres vistas usan la misma tarjeta y cambian sólo lo que
 * le mandan.
 */
export function AnalisisIA({ descripcion, pedir, clave }: Readonly<Props>) {
  const [texto, setTexto] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);
  // Detalle técnico del fallo; en pantalla se muestra IA_NO_DISPONIBLE.
  const [error, setError] = useState<string | null>(null);

  // Un análisis de otro modelo o de otro tipo confunde más de lo que ayuda.
  useEffect(() => {
    setTexto(null);
    setError(null);
  }, [clave]);

  const analizar = async () => {
    setCargando(true);
    setError(null);
    try {
      const res = await pedir();
      if (res.success && res.data?.analisis) {
        setTexto(res.data.analisis);
      } else {
        setError(res.error || 'El asistente no respondió.');
      }
    } catch (e) {
      const detalle = e instanceof Error ? e.message : 'El asistente no respondió.';
      console.warn('Análisis con IA no disponible:', detalle);
      setError(detalle);
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
      <span className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-utec-cyan/15 text-utec-cyan sm:flex" aria-hidden>
        <Sparkles className="h-5 w-5" />
      </span>
      <div className="w-full min-w-0 flex-1 space-y-2">
        {cargando && !texto ? (
          <div className="space-y-2" aria-label="Analizando">
            {[95, 100, 88, 72].map((w) => (
              <div key={w} className="h-3 animate-pulse rounded bg-muted" style={{ width: `${w}%` }} />
            ))}
          </div>
        ) : texto ? (
          <p className="whitespace-pre-wrap text-sm leading-relaxed">{texto}</p>
        ) : (
          <p className="text-sm leading-relaxed text-muted-foreground">{descripcion}</p>
        )}
        {/* Debajo del texto y no en lugar de él: si falla un "volver a analizar", la lectura anterior sigue sirviendo. */}
        {error && !cargando && (
          <p role="status" title={error} className="flex items-start gap-1.5 rounded-lg bg-utec-orange/10 px-2.5 py-1.5 text-xs text-foreground">
            <CloudOff className="mt-0.5 h-3.5 w-3.5 shrink-0 text-utec-orange" />
            {IA_NO_DISPONIBLE}
          </p>
        )}
      </div>
      <div className="shrink-0 self-start sm:self-center">
        <Button size="sm" variant="outline" onClick={analizar} disabled={cargando} className="h-8 text-xs">
          {cargando ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
          <span className="ml-1.5">{texto ? 'Volver a analizar' : 'Analizar con IA'}</span>
        </Button>
      </div>
    </div>
  );
}
