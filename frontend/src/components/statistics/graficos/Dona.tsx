import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import type { TooltipProps } from 'recharts';
import { porcentaje } from '../reservas/formato';
import { filtrable, HOVER_FILTRO } from './filtrable';
import { formatoNumero, useTemaGraficos } from './tema';

export interface PorcionDona {
  nombre: string;
  valor: number;
  color: string;
  /** Si está, la porción y su renglón filtran la vista. */
  alClic?: () => void;
}

interface Props {
  porciones: PorcionDona[];
  /** Número grande del centro; por defecto el total. */
  centro?: string;
  leyendaCentro?: string;
  /** Diámetro en px. */
  tamano?: number;
}

function Globo({ active, payload }: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload as PorcionDona & { total: number };
  return (
    <div className="rounded-lg bg-chrome px-3 py-1.5 text-xs text-white shadow-lg">
      <span style={{ color: p.color }}>●</span> {p.nombre}: <b>{formatoNumero(p.valor)}</b> · {porcentaje(p.valor, p.total)}%
    </div>
  );
}

/**
 * Parte de un todo, de un vistazo: hasta seis porciones, con el total en el
 * centro y la leyenda con número y porcentaje (el color nunca va solo).
 */
export function Dona({ porciones, centro, leyendaCentro, tamano = 150 }: Readonly<Props>) {
  const tema = useTemaGraficos();
  const total = porciones.reduce((a, p) => a + p.valor, 0);
  const datos = porciones.filter((p) => p.valor > 0).map((p) => ({ ...p, total }));
  const conClic = porciones.some((p) => p.alClic);

  return (
    <div className={`flex flex-wrap items-center gap-4 ${conClic ? '[&_.recharts-sector]:outline-none' : ''}`}>
      <div className="relative shrink-0" style={{ width: tamano, height: tamano }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={datos.length ? datos : [{ nombre: 'Sin datos', valor: 1, color: tema.vacio, total: 1 }]}
              dataKey="valor"
              nameKey="nombre"
              innerRadius="68%"
              outerRadius="100%"
              paddingAngle={datos.length > 1 ? 2 : 0}
              stroke={tema.superficie}
              strokeWidth={2}
              isAnimationActive={false}
              onClick={(d: { payload?: PorcionDona }) => d?.payload?.alClic?.()}
            >
              {(datos.length ? datos : [{ color: tema.vacio, nombre: 'vacio' } as PorcionDona]).map((p) => (
                <Cell key={p.nombre} fill={p.color} style={p.alClic ? { cursor: 'pointer' } : undefined} />
              ))}
            </Pie>
            {datos.length > 0 && <Tooltip content={<Globo />} />}
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-2xl font-semibold leading-none">{centro ?? formatoNumero(total)}</span>
          {leyendaCentro && <span className="mt-1 text-2xs uppercase tracking-wide text-muted-foreground">{leyendaCentro}</span>}
        </div>
      </div>
      <ul className="min-w-[160px] flex-1 space-y-1.5">
        {porciones.map((p) => {
          const { className: claseClic, ...clic } = filtrable(p.nombre, p.alClic);
          return (
          <li key={p.nombre} {...clic} className={`flex items-center gap-2 text-sm ${p.alClic ? `${HOVER_FILTRO} ${claseClic} -mx-1 px-1` : ''}`}>
            <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ backgroundColor: p.color }} />
            <span className="min-w-0 flex-1 truncate text-muted-foreground">{p.nombre}</span>
            <span className="font-semibold tabular-nums">{formatoNumero(p.valor)}</span>
            <span className="w-9 text-right text-xs tabular-nums text-muted-foreground">{porcentaje(p.valor, total)}%</span>
          </li>
          );
        })}
      </ul>
    </div>
  );
}
