import { useMemo } from 'react';
import {
  Area,
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { TooltipProps } from 'recharts';
import type { ForecastHistoricoPunto } from '@/lib/api/stats';
import { useColores, type Colores } from '../colores';
import { entero, fechaCorta, fechaLarga } from '../formato';
import type { Dia } from './usePredicciones';

interface Punto {
  fecha: string;
  real?: number;
  esperadas?: number;
  /** Piso de la banda: invisible, sostiene al ancho apilado encima. */
  bandaPiso?: number;
  bandaAncho?: number;
  minimo?: number;
  maximo?: number;
  confirmadas?: number;
}

function Globo({ active, payload, colores }: TooltipProps<number, string> & { colores: Colores }) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload as Punto;
  const esPronostico = p.minimo !== undefined;

  return (
    <div className="min-w-[180px] rounded-lg bg-chrome px-3 py-2 text-xs text-white shadow-lg">
      <p className="mb-1.5 font-medium capitalize text-white/70">{fechaLarga(p.fecha)}</p>
      {p.real !== undefined && !esPronostico && (
        <Linea color={colores.real} etiqueta="Aprobadas" valor={entero(p.real)} />
      )}
      {esPronostico && (
        <>
          <Linea
            color={colores.prediccion}
            etiqueta="Esperadas"
            valor={entero(p.esperadas ?? 0)}
            extra={`${entero(p.minimo ?? 0)}–${entero(p.maximo ?? 0)}`}
          />
          <Linea color={colores.reservadas} etiqueta="Ya aprobadas" valor={entero(p.confirmadas ?? 0)} />
        </>
      )}
    </div>
  );
}

function Linea({ color, etiqueta, valor, extra }: Readonly<{ color: string; etiqueta: string; valor: string; extra?: string }>) {
  return (
    <div className="flex items-center gap-2 py-0.5">
      <span className="h-2 w-2 shrink-0 rounded-sm" style={{ backgroundColor: color }} aria-hidden />
      <span className="flex-1 text-white/70">{etiqueta}</span>
      <span className="font-semibold tabular-nums">{valor}</span>
      {extra && <span className="tabular-nums text-white/50">{extra}</span>}
    </div>
  );
}

interface Props {
  historico: ForecastHistoricoPunto[];
  dias: Dia[];
  alto?: number;
}

/**
 * Lo que pasó y lo que viene, en el mismo eje.
 *
 * El pronóstico sale del último día real para que la línea no quede
 * cortada, y las reservas ya aprobadas del horizonte van como barras
 * finas debajo: la distancia entre barra y línea es lo que falta por llegar.
 */
export function GraficoDemanda({ historico, dias, alto = 300 }: Readonly<Props>) {
  const colores = useColores();

  const datos = useMemo<Punto[]>(() => {
    const pasado: Punto[] = historico.map((h) => ({ fecha: h.fecha, real: h.real }));
    const ultimo = pasado.at(-1);
    if (ultimo) ultimo.esperadas = ultimo.real;

    const futuro: Punto[] = dias.map((d) => ({
      fecha: d.fecha,
      esperadas: d.esperadas,
      bandaPiso: d.minimo,
      bandaAncho: Math.max(0, d.maximo - d.minimo),
      minimo: d.minimo,
      maximo: d.maximo,
      confirmadas: d.confirmadas,
    }));
    return [...pasado, ...futuro];
  }, [historico, dias]);

  const inicio = dias[0]?.fecha;

  return (
    <div>
      <ResponsiveContainer width="100%" height={alto}>
        <ComposedChart data={datos} margin={{ top: 18, right: 8, bottom: 0, left: 0 }}>
          <CartesianGrid stroke={colores.grilla} vertical={false} />
          <XAxis
            dataKey="fecha"
            tickFormatter={fechaCorta}
            tick={{ fontSize: 11, fill: colores.eje }}
            axisLine={{ stroke: colores.grilla }}
            tickLine={false}
            minTickGap={28}
          />
          <YAxis
            tick={{ fontSize: 11, fill: colores.eje }}
            axisLine={false}
            tickLine={false}
            width={34}
            allowDecimals={false}
          />
          <Tooltip
            content={<Globo colores={colores} />}
            cursor={{ stroke: colores.eje, strokeWidth: 1 }}
          />

          <Area
            dataKey="bandaPiso"
            stackId="banda"
            stroke="none"
            fill="transparent"
            activeDot={false}
            isAnimationActive={false}
          />
          <Area
            dataKey="bandaAncho"
            stackId="banda"
            stroke="none"
            fill={colores.prediccion}
            fillOpacity={0.14}
            activeDot={false}
            isAnimationActive={false}
          />
          <Bar
            dataKey="confirmadas"
            fill={colores.reservadas}
            fillOpacity={0.6}
            barSize={5}
            radius={[3, 3, 0, 0]}
            isAnimationActive={false}
          />
          <Line
            dataKey="real"
            stroke={colores.real}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, strokeWidth: 2, stroke: 'var(--card)' }}
            isAnimationActive={false}
          />
          <Line
            dataKey="esperadas"
            stroke={colores.prediccion}
            strokeWidth={2}
            strokeDasharray="5 4"
            dot={false}
            activeDot={{ r: 4, strokeWidth: 2, stroke: 'var(--card)' }}
            isAnimationActive={false}
          />

          {inicio && (
            <ReferenceLine
              x={inicio}
              stroke={colores.hoy}
              strokeOpacity={0.35}
              label={{ value: 'pronóstico', position: 'insideTopLeft', fontSize: 11, fill: colores.eje, offset: 6, dy: -16 }}
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>

      <ul className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1 px-1 text-xs text-muted-foreground">
        <Leyenda>
          <span className="h-0.5 w-5 rounded" style={{ backgroundColor: colores.real }} />
          Aprobadas
        </Leyenda>
        <Leyenda>
          <span className="w-5 border-t-2 border-dashed" style={{ borderColor: colores.prediccion }} />
          Esperadas
        </Leyenda>
        <Leyenda>
          <span className="h-3 w-5 rounded-sm" style={{ backgroundColor: colores.prediccion, opacity: 0.2 }} />
          Rango probable (80%)
        </Leyenda>
        <Leyenda>
          <span className="h-3 w-1.5 rounded-t-sm" style={{ backgroundColor: colores.reservadas, opacity: 0.6 }} />
          Ya aprobadas
        </Leyenda>
      </ul>
    </div>
  );
}

function Leyenda({ children }: Readonly<{ children: React.ReactNode }>) {
  return <li className="flex items-center gap-1.5">{children}</li>;
}
