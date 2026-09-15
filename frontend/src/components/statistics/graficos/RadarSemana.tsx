import { PolarAngleAxis, PolarGrid, Radar, RadarChart, ResponsiveContainer, Tooltip } from 'recharts';
import type { TooltipProps } from 'recharts';
import { formatoNumero, useTemaGraficos } from './tema';

interface Props {
  /** Lunes a domingo. */
  dias: Array<{ dia: string; valor: number }>;
  alto?: number;
}

function Globo({ active, payload }: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload as { dia: string; valor: number; pct: number };
  return (
    <div className="rounded-lg bg-utec-dark px-3 py-1.5 text-xs text-white shadow-lg">
      {p.dia}: <b>{formatoNumero(p.valor)}</b> · {p.pct}% de la semana
    </div>
  );
}

/**
 * La forma de la semana: cuánto pesa cada día. Un campus de clases dibuja un
 * pentágono aplastado hacia el fin de semana; un evento grande lo deforma.
 */
export function RadarSemana({ dias, alto = 240 }: Readonly<Props>) {
  const tema = useTemaGraficos();
  const total = dias.reduce((a, d) => a + d.valor, 0);
  const datos = dias.map((d) => ({ ...d, pct: total > 0 ? Math.round((d.valor / total) * 100) : 0 }));
  const pico = datos.reduce((m, d) => (d.valor > m.valor ? d : m), datos[0]);
  const flojo = datos.reduce((m, d) => (d.valor < m.valor ? d : m), datos[0]);

  if (total === 0) return <p className="py-8 text-center text-sm text-muted-foreground">Sin datos en el período.</p>;

  return (
    <div>
      <ResponsiveContainer width="100%" height={alto}>
        <RadarChart data={datos} outerRadius="75%">
          <PolarGrid stroke={tema.grilla} />
          <PolarAngleAxis dataKey="dia" tick={{ fontSize: 11, fill: tema.eje }} />
          <Tooltip content={<Globo />} />
          <Radar dataKey="valor" stroke={tema.categorias[0]} fill={tema.categorias[0]} fillOpacity={0.25} strokeWidth={2} isAnimationActive={false} />
        </RadarChart>
      </ResponsiveContainer>
      <p className="text-center text-xs text-muted-foreground">
        El más cargado es el <b className="text-foreground">{pico.dia.toLowerCase()}</b> ({pico.pct}%); el más tranquilo, el{' '}
        <b className="text-foreground">{flojo.dia.toLowerCase()}</b> ({flojo.pct}%).
      </p>
    </div>
  );
}
