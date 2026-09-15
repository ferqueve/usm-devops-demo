import { porcentaje } from '../reservas/formato';
import { formatoNumero } from './tema';

export interface GrupoWaffle {
  nombre: string;
  valor: number;
  color: string;
}

/**
 * Cien cuadraditos, uno por cada 1% del total. Se lee sin ejes: "de cada
 * diez items, siete tienen entre tres meses y un año".
 */
export function Waffle({ grupos, celda = 14, apilado = false }: Readonly<{ grupos: GrupoWaffle[]; /** Lado de cada cuadro, en px. */ celda?: number; /** Leyenda debajo y centrada, en vez de al costado. */ apilado?: boolean }>) {
  const total = grupos.reduce((a, g) => a + g.valor, 0);
  if (total === 0) return <p className="py-8 text-center text-sm text-muted-foreground">Sin datos.</p>;

  // Reparto de los 100 cuadros por el método del mayor resto, para que sumen justo 100.
  const exactos = grupos.map((g) => (g.valor / total) * 100);
  const cuadros = exactos.map(Math.floor);
  let faltan = 100 - cuadros.reduce((a, c) => a + c, 0);
  exactos
    .map((e, i) => ({ i, resto: e - Math.floor(e) }))
    .sort((a, b) => b.resto - a.resto)
    .forEach(({ i }) => {
      if (faltan > 0 && grupos[i].valor > 0) {
        cuadros[i]++;
        faltan--;
      }
    });
  const celdas = grupos.flatMap((g, i) => Array.from({ length: cuadros[i] }, () => g));

  return (
    <div className={apilado ? 'flex flex-col items-center gap-4' : 'flex flex-wrap items-center gap-5'}>
      <div className="grid shrink-0 grid-cols-10 gap-[3px]" role="img" aria-label={grupos.map((g) => `${g.nombre} ${porcentaje(g.valor, total)}%`).join(', ')}>
        {celdas.map((g, i) => (
          <span key={i} className="rounded-[3px]" style={{ backgroundColor: g.color, width: celda, height: celda }} title={g.nombre} />
        ))}
      </div>
      <ul className={apilado ? 'w-full space-y-1.5' : 'min-w-[150px] flex-1 space-y-1.5'}>
        {grupos.map((g) => (
          <li key={g.nombre} className="flex items-center gap-2 text-sm">
            <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ backgroundColor: g.color }} />
            <span className="min-w-0 flex-1 truncate text-muted-foreground">{g.nombre}</span>
            <span className="font-semibold tabular-nums">{formatoNumero(g.valor)}</span>
            <span className="w-9 text-right text-xs tabular-nums text-muted-foreground">{porcentaje(g.valor, total)}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
