import { porcentaje } from '../reservas/formato';
import { formatoNumero } from './tema';

export interface EtapaEmbudo {
  nombre: string;
  valor: number;
  color: string;
  detalle?: string;
}

/**
 * Embudo: cuánto llega de cada etapa a la siguiente. Cada franja se centra y
 * se angosta según su valor contra la primera; el nombre y el número van al
 * costado para que se lean aunque la franja quede finita, y a la derecha qué
 * parte de la etapa anterior pasó.
 */
export function Embudo({ etapas }: Readonly<{ etapas: EtapaEmbudo[] }>) {
  const inicial = etapas[0]?.valor ?? 0;
  if (inicial <= 0) return <p className="py-8 text-center text-sm text-muted-foreground">Sin datos en el período.</p>;
  return (
    <ol className="space-y-1.5">
      {etapas.map((e, i) => {
        const ancho = Math.max(4, (e.valor / inicial) * 100);
        const previo = i === 0 ? null : etapas[i - 1].valor;
        return (
          <li key={e.nombre} className="grid grid-cols-[78px_minmax(0,1fr)_52px] items-center gap-2">
            <div className="min-w-0 text-right leading-tight">
              <div className="text-sm font-semibold tabular-nums">{formatoNumero(e.valor)}</div>
              <div className="truncate text-2xs text-muted-foreground">{e.nombre}</div>
            </div>
            <div className="flex justify-center">
              <div
                className="h-9 rounded-md shadow-sm"
                style={{ width: `${ancho}%`, backgroundColor: e.color }}
                title={`${e.nombre}: ${formatoNumero(e.valor)}${e.detalle ? ` · ${e.detalle}` : ''}`}
              />
            </div>
            <span className="text-right text-xs leading-tight tabular-nums text-muted-foreground">
              {previo == null ? '100%' : <><b className="text-foreground">{porcentaje(e.valor, previo)}%</b><br />pasa</>}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
