import type { ReactNode } from 'react';
import { formatoNumero } from './tema';

export interface FilaMancuerna {
  clave: string | number;
  nombre: string;
  detalle?: string;
  /** El valor chico (asistieron). */
  a: number;
  /** El valor grande (agendadas). */
  b: number;
  extra?: ReactNode;
  /** Etiqueta corta junto al nombre (p. ej. la sigla de la carrera). */
  chip?: { texto: string; titulo?: string };
  /** Sin dato de "a" todavía: se dibuja sólo "b", en gris. */
  sinA?: boolean;
}

/**
 * Mancuernas: dos puntos por fila unidos por una línea. La distancia entre
 * ambos es lo que se pierde (agendadas que no asistieron) y se ve sin restar.
 */
export function Mancuernas({ filas, nombreA, nombreB, colorA, colorB, textoSinA = 'sin dato' }: Readonly<{ filas: FilaMancuerna[]; nombreA: string; nombreB: string; colorA: string; colorB: string; textoSinA?: string }>) {
  if (filas.length === 0) return <p className="py-8 text-center text-sm text-muted-foreground">Sin datos en el período.</p>;
  const maximo = Math.max(1, ...filas.map((f) => Math.max(f.a, f.b)));
  return (
    <div>
      <ul className="space-y-2">
        {filas.map((f) => {
          const pa = (f.a / maximo) * 100;
          const pb = (f.b / maximo) * 100;
          return (
            <li key={f.clave} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 text-sm sm:grid-cols-[minmax(0,1.1fr)_minmax(0,1.6fr)_auto]">
              <span className="min-w-0">
                <span className="flex min-w-0 items-center gap-1.5">
                  <span className="truncate" title={f.nombre}>{f.nombre}</span>
                  {f.chip && (
                    <span className="shrink-0 rounded bg-muted px-1.5 py-px text-2xs font-semibold tracking-wide text-muted-foreground" title={f.chip.titulo}>
                      {f.chip.texto}
                    </span>
                  )}
                </span>
                {f.detalle && <span className="block truncate text-2xs text-muted-foreground">{f.detalle}</span>}
              </span>
              {/* En celular la barra va en su propio renglón, así el nombre no se corta. */}
              <div className="relative col-span-2 row-start-2 h-4 sm:col-span-1 sm:row-start-auto" title={f.sinA ? `${nombreB}: ${formatoNumero(f.b)} · ${textoSinA}` : `${nombreA}: ${formatoNumero(f.a)} · ${nombreB}: ${formatoNumero(f.b)}`}>
                <div className="absolute inset-x-0 top-1/2 h-px bg-border" />
                {f.sinA ? (
                  <span className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-dashed border-muted-foreground/60 bg-card" style={{ left: `${pb}%` }} />
                ) : (<>
                <div
                  className="absolute top-1/2 h-[3px] -translate-y-1/2 rounded-full"
                  style={{ left: `${Math.min(pa, pb)}%`, width: `${Math.abs(pb - pa)}%`, backgroundColor: colorB, opacity: 0.35 }}
                />
                <span className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-card" style={{ left: `${pb}%`, backgroundColor: colorB }} />
                <span className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-card" style={{ left: `${pa}%`, backgroundColor: colorA }} />
                </>)}
              </div>
              <span className="flex items-center gap-2 text-xs tabular-nums text-muted-foreground">
                {f.sinA ? (
                  <span className="whitespace-nowrap">{formatoNumero(f.b)} · <i>{textoSinA}</i></span>
                ) : (
                  <span><b className="text-foreground">{formatoNumero(f.a)}</b>/{formatoNumero(f.b)}</span>
                )}
                {f.extra}
              </span>
            </li>
          );
        })}
      </ul>
      <div className="mt-3 flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: colorA }} />{nombreA}</span>
        <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: colorB }} />{nombreB}</span>
        {filas.some((f) => f.sinA) && (
          <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full border-2 border-dashed border-muted-foreground/60" />{textoSinA}</span>
        )}
      </div>
    </div>
  );
}
