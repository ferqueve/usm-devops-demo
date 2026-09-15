import { useMemo } from 'react';
import { useTheme } from 'next-themes';
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { TooltipProps } from 'recharts';
import type { ResumenReservas } from '@/lib/api/stats';
import { fechaCorta } from '../periodo';
import { marcarIncompletos, type TramoSerie as Punto } from './tramos';

/**
 * Colores de estado, no de serie: verde/ámbar/rojo significan lo que
 * significan en toda la app. Para quien no distingue verde de rojo, el orden
 * de apilado es fijo (aprobadas abajo) y la leyenda y el globo los nombran.
 */
const ESTADOS = {
  claro: { aprobadas: '#5f9433', pendientes: '#c98a00', canceladas: '#c9372c', grilla: '#eceef1', eje: '#6b7280' },
  oscuro: { aprobadas: '#6fa23e', pendientes: '#d49b1c', canceladas: '#e0564a', grilla: '#2f3237', eje: '#a1a1aa' },
};

const ETIQUETAS = { aprobadas: 'Aprobadas', pendientes: 'Pendientes', canceladas: 'Canceladas' } as const;
type Clave = keyof typeof ETIQUETAS;
const ORDEN: Clave[] = ['aprobadas', 'pendientes', 'canceladas'];

type Granularidad = ResumenReservas['granularidad'];

function etiquetaTramo(p: Punto, granularidad: Granularidad, larga = false): string {
  const d = new Date(`${p.periodo}T00:00:00Z`);
  if (granularidad === 'mes') {
    return d
      .toLocaleDateString('es-UY', { month: larga ? 'long' : 'short', year: larga ? 'numeric' : '2-digit', timeZone: 'UTC' })
      .replace('.', '');
  }
  if (granularidad === 'semana' && larga) return `Semana del ${fechaCorta(p.periodo)}`;
  return fechaCorta(p.periodo);
}

function Globo({ active, payload, granularidad, colores }: TooltipProps<number, string> & {
  granularidad: Granularidad;
  colores: typeof ESTADOS.claro;
}) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload as Punto;
  const total = ORDEN.reduce((a, k) => a + p[k], 0);
  return (
    <div className="min-w-[170px] rounded-lg bg-utec-dark px-3 py-2 text-xs text-white shadow-lg">
      <p className="font-medium capitalize text-white/70">{etiquetaTramo(p, granularidad, true)}</p>
      {p.incompleto && (
        <p className="mb-1 text-[11px] text-utec-yellow">
          Incompleta: sólo del {fechaCorta(p.desde)} al {fechaCorta(p.hasta)}
        </p>
      )}
      <div className="mt-1.5">
        {[...ORDEN].reverse().map((k) => (
          <div key={k} className="flex items-center gap-2 py-0.5">
            <span className="h-2 w-2 rounded-sm" style={{ backgroundColor: colores[k] }} />
            <span className="flex-1 text-white/70">{ETIQUETAS[k]}</span>
            <span className="font-semibold tabular-nums">{p[k].toLocaleString('es-UY')}</span>
          </div>
        ))}
      </div>
      <div className="mt-1 flex justify-between border-t border-white/15 pt-1">
        <span className="text-white/70">Total</span>
        <span className="font-semibold tabular-nums">{total.toLocaleString('es-UY')}</span>
      </div>
    </div>
  );
}

export function Tendencia({ resumen, alto = 260 }: Readonly<{ resumen: ResumenReservas; alto?: number }>) {
  const { resolvedTheme } = useTheme();
  const colores = resolvedTheme === 'dark' ? ESTADOS.oscuro : ESTADOS.claro;
  const { granularidad } = resumen;
  const datos = useMemo(() => marcarIncompletos(resumen), [resumen]);
  const hayIncompletos = datos.some((p) => p.incompleto);

  return (
    <div>
      <ResponsiveContainer width="100%" height={alto}>
        <BarChart data={datos} margin={{ top: 8, right: 4, bottom: 0, left: 0 }} barCategoryGap={datos.length > 20 ? 2 : '20%'}>
          <CartesianGrid stroke={colores.grilla} vertical={false} />
          <XAxis
            dataKey="periodo"
            // Por valor y no por índice: el índice es el del tick dibujado, y con
            // ticks salteados las fechas quedaban corridas.
            tickFormatter={(periodo: string) => {
              const p = datos.find((d) => d.periodo === periodo);
              return p ? etiquetaTramo(p, granularidad) : '';
            }}
            tick={{ fontSize: 11, fill: colores.eje }}
            axisLine={{ stroke: colores.grilla }}
            tickLine={false}
            minTickGap={16}
          />
          <YAxis tick={{ fontSize: 11, fill: colores.eje }} axisLine={false} tickLine={false} width={40} allowDecimals={false} />
          <Tooltip content={<Globo granularidad={granularidad} colores={colores} />} cursor={{ fill: colores.grilla, fillOpacity: 0.6 }} />
          {ORDEN.map((k, i) => (
            <Bar key={k} dataKey={k} stackId="estado" fill={colores[k]} maxBarSize={28} radius={i === ORDEN.length - 1 ? [4, 4, 0, 0] : 0} isAnimationActive={false}>
              {datos.map((p) => (
                <Cell key={p.periodo} fillOpacity={p.incompleto ? 0.35 : 1} />
              ))}
            </Bar>
          ))}
        </BarChart>
      </ResponsiveContainer>
      <ul className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1 px-1 text-xs text-muted-foreground">
        {ORDEN.map((k) => (
          <li key={k} className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: colores[k] }} />
            {ETIQUETAS[k]}
          </li>
        ))}
        {hayIncompletos && (
          <li className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: colores.aprobadas, opacity: 0.35 }} />
            {granularidad === 'mes' ? 'mes incompleto' : 'semana incompleta'}
          </li>
        )}
        <li className="ml-auto">por {granularidad === 'dia' ? 'día' : granularidad}</li>
      </ul>
    </div>
  );
}
