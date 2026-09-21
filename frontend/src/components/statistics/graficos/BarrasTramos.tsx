import { formatoNumero } from './tema';

export interface SegmentoTramo {
  nombre: string;
  valor: number;
  color: string;
}

export interface Tramo {
  etiqueta: string;
  segmentos: SegmentoTramo[];
  /** Texto chico debajo de la etiqueta. */
  nota?: string;
}

interface Props {
  tramos: Tramo[];
  alto?: number;
  unidad?: string;
  /** Leyenda con los segmentos; por defecto si hay más de uno. */
  leyenda?: boolean;
}

/**
 * Columnas por tramo (histograma, antigüedad), con el número arriba de cada
 * una y segmentos apilados cuando hace falta partirla. En HTML y no en svg:
 * se acomoda a cualquier ancho y el texto no se deforma.
 */
export function BarrasTramos({ tramos, alto = 200, unidad = '', leyenda }: Readonly<Props>) {
  const totales = tramos.map((t) => t.segmentos.reduce((a, s) => a + Math.max(0, s.valor), 0));
  const maximo = Math.max(1, ...totales);
  const total = totales.reduce((a, v) => a + v, 0);
  const nombres = [...new Map(tramos.flatMap((t) => t.segmentos).map((s) => [s.nombre, s.color])).entries()];
  const conLeyenda = leyenda ?? nombres.length > 1;

  if (total === 0) return <p className="py-8 text-center text-sm text-muted-foreground">Sin datos en el período.</p>;

  return (
    <div className="flex flex-col">
      <div className="flex items-end gap-2 sm:gap-3" style={{ height: alto }}>
        {tramos.map((t, i) => {
          const pct = total > 0 ? Math.round((totales[i] / total) * 100) : 0;
          return (
            <div key={t.etiqueta} className="flex min-w-0 flex-1 flex-col items-center justify-end">
              <span className="mb-1 text-sm font-semibold tabular-nums">{formatoNumero(totales[i])}</span>
              <span className="mb-1 text-2xs text-muted-foreground tabular-nums">{pct}%</span>
              {totales[i] === 0 && <div className="h-[3px] w-full max-w-[64px] rounded-full bg-muted-foreground/30" aria-hidden />}
              <div
                className="flex w-full max-w-[64px] flex-col-reverse gap-[2px] overflow-hidden rounded-t-md"
                // Alto en px: un % no tiene contra qué medirse dentro de una columna flex.
                style={{ height: Math.max(totales[i] > 0 ? 3 : 0, (totales[i] / maximo) * (alto - 38)) }}
                title={`${t.etiqueta}: ${t.segmentos.map((s) => `${s.nombre} ${formatoNumero(s.valor)}${unidad}`).join(' · ')}`}
              >
                {t.segmentos
                  .filter((s) => s.valor > 0)
                  .map((s) => (
                    <div key={s.nombre} style={{ flexGrow: s.valor, backgroundColor: s.color }} className="min-h-[2px]" />
                  ))}
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-1.5 flex gap-2 border-t pt-1.5 sm:gap-3">
        {tramos.map((t) => (
          <div key={t.etiqueta} className="min-w-0 flex-1 text-center">
            <div className="truncate text-2xs font-medium text-muted-foreground" title={t.etiqueta}>{t.etiqueta}</div>
            {t.nota && <div className="truncate text-2xs text-muted-foreground">{t.nota}</div>}
          </div>
        ))}
      </div>
      {conLeyenda && (
        <div className="mt-2 flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
          {nombres.map(([nombre, color]) => (
            <span key={nombre} className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: color }} />
              {nombre}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
