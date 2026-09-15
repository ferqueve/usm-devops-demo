import { porcentaje } from '../reservas/formato';
import { formatoNumero } from './tema';

export interface FilaApilada {
  etiqueta: string;
  segmentos: Array<{ nombre: string; valor: number; color: string; texto?: string }>;
}

/**
 * Una barra por fila que siempre llena el ancho: compara proporciones entre
 * grupos de tamaños muy distintos (50 pedidos del mismo día contra 800 con un
 * mes de antelación) sin que el grande aplaste al chico.
 */
export function Apiladas100({ filas }: Readonly<{ filas: FilaApilada[] }>) {
  const leyenda = [...new Map(filas.flatMap((f) => f.segmentos).map((s) => [s.nombre, s.color])).entries()];
  if (filas.every((f) => f.segmentos.every((s) => s.valor <= 0))) {
    return <p className="py-8 text-center text-sm text-muted-foreground">Sin datos en el período.</p>;
  }
  return (
    <div className="space-y-2.5">
      {filas.map((f) => {
        const total = f.segmentos.reduce((a, s) => a + s.valor, 0);
        return (
          <div key={f.etiqueta} className="grid grid-cols-[88px_minmax(0,1fr)_44px] items-center gap-2 sm:grid-cols-[110px_minmax(0,1fr)_52px]">
            <span className="truncate text-xs font-medium" title={f.etiqueta}>{f.etiqueta}</span>
            <div className="flex h-6 gap-[2px] overflow-hidden rounded-md bg-muted">
              {total > 0 &&
                f.segmentos
                  .filter((s) => s.valor > 0)
                  .map((s) => {
                    const pct = porcentaje(s.valor, total);
                    return (
                      <div
                        key={s.nombre}
                        className="flex min-w-[3px] items-center justify-center overflow-hidden text-[10px] font-semibold tabular-nums"
                        style={{ flexGrow: s.valor, flexBasis: 0, backgroundColor: s.color, color: s.texto ?? '#ffffff' }}
                        title={`${f.etiqueta} · ${s.nombre}: ${formatoNumero(s.valor)} (${pct}%)`}
                      >
                        {pct >= 12 ? `${pct}%` : ''}
                      </div>
                    );
                  })}
            </div>
            <span className="text-right text-xs tabular-nums text-muted-foreground">{formatoNumero(total)}</span>
          </div>
        );
      })}
      <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 pt-1 text-xs text-muted-foreground">
        {leyenda.map(([nombre, color]) => (
          <span key={nombre} className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: color }} />
            {nombre}
          </span>
        ))}
      </div>
    </div>
  );
}
