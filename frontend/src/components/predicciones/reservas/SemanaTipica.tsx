import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { TooltipProps } from 'recharts';
import { useColores } from '../colores';
import { entero } from '../formato';

interface Props {
  semana: Array<{ dia: string; valor: number }>;
}

function Globo({ active, payload, label }: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg bg-chrome px-3 py-1.5 text-xs text-white shadow-lg">
      {label}: <b className="tabular-nums">{entero(Number(payload[0].value))}</b> por día
    </div>
  );
}

/**
 * El patrón semanal que aprendió el modelo, promediando lo que espera para
 * cada día de la semana dentro del horizonte. El día más cargado va entero;
 * el resto, más tenue.
 */
export function SemanaTipica({ semana }: Readonly<Props>) {
  const colores = useColores();
  const pico = Math.max(...semana.map((d) => d.valor));

  return (
    <div className="h-full min-h-[150px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={semana} margin={{ top: 16, right: 4, bottom: 0, left: 0 }}>
          <XAxis
            dataKey="dia"
            tick={{ fontSize: 11, fill: colores.eje }}
            axisLine={{ stroke: colores.grilla }}
            tickLine={false}
          />
          <YAxis hide />
          <Tooltip content={<Globo />} cursor={{ fill: colores.grilla }} />
          <Bar
            dataKey="valor"
            radius={[4, 4, 0, 0]}
            maxBarSize={24}
            isAnimationActive={false}
            label={{
              position: 'top',
              fontSize: 10,
              fill: colores.eje,
              formatter: (v: number) => (v === pico ? entero(v) : ''),
            }}
          >
            {semana.map((d) => (
              <Cell key={d.dia} fill={colores.prediccion} fillOpacity={d.valor === pico ? 1 : 0.4} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
