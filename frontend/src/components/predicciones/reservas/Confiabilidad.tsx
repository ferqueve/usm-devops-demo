import { CheckCircle2, AlertTriangle } from 'lucide-react';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { TooltipProps } from 'recharts';
import type { ValidacionPunto } from '@/lib/api/stats';
import { useColores, type Colores } from '../colores';
import { entero, fechaCorta, fechaLarga } from '../formato';
import { GloboGrafico } from '@/components/common/dataviz';

interface Props {
  validacion: ValidacionPunto[];
  modelo: number;
  referencia: number | null;
  mejora: number | null;
  mae: number | null;
  /** Alto fijo del gráfico (en el modal); sin esto ocupa lo que sobra del panel. */
  alto?: number;
}

function Globo({ active, payload, colores }: TooltipProps<number, string> & { colores: Colores }) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload as ValidacionPunto;
  return (
    <GloboGrafico>
      <p className="mb-1 font-medium capitalize text-white/70">{fechaLarga(p.fecha)}</p>
      <p className="tabular-nums">
        <span style={{ color: colores.real }}>●</span> Hubo <b>{p.real}</b>
      </p>
      <p className="tabular-nums">
        <span style={{ color: colores.prediccion }}>●</span> Predijo <b>{entero(p.prediccion)}</b>
      </p>
    </GloboGrafico>
  );
}

function Barra({ etiqueta, valor, maximo, color, destacada }: Readonly<{
  etiqueta: string;
  valor: number;
  maximo: number;
  color: string;
  destacada?: boolean;
}>) {
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between text-xs">
        <span className={destacada ? 'font-medium text-foreground' : 'text-muted-foreground'}>{etiqueta}</span>
        <span className={`tabular-nums ${destacada ? 'font-semibold text-foreground' : 'text-muted-foreground'}`}>
          {valor.toFixed(1)}% de error
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full"
          style={{ width: `${Math.min(100, (valor / maximo) * 100)}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

/**
 * La prueba de que el modelo sirve: sus predicciones contra lo que pasó en
 * días que no vio al entrenar, y contra la alternativa más simple posible.
 */
export function Confiabilidad({ validacion, modelo, referencia, mejora, mae, alto }: Readonly<Props>) {
  const colores = useColores();
  const gana = referencia != null && modelo < referencia;
  const maximo = Math.max(modelo, referencia ?? 0, 1) * 1.15;

  return (
    <div className="flex h-full flex-col gap-3">
      <p className="text-xs leading-relaxed text-muted-foreground">
        Se apartaron los últimos {validacion.length} días del entrenamiento: el modelo los predijo sin verlos y acá está contra lo que pasó.
      </p>

      <div className="min-h-[120px] flex-1" style={alto ? { height: alto, flex: 'none' } : undefined}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={validacion} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
            <CartesianGrid stroke={colores.grilla} vertical={false} />
            <XAxis
              dataKey="fecha"
              tickFormatter={(v) => fechaCorta(v)}
              tick={{ fontSize: 10, fill: colores.eje }}
              axisLine={{ stroke: colores.grilla }}
              tickLine={false}
              minTickGap={24}
            />
            <YAxis tick={{ fontSize: 10, fill: colores.eje }} axisLine={false} tickLine={false} width={28} />
            <Tooltip content={<Globo colores={colores} />} cursor={{ stroke: colores.eje, strokeWidth: 1 }} />
            <Line dataKey="real" stroke={colores.real} strokeWidth={2} dot={false} isAnimationActive={false} />
            <Line
              dataKey="prediccion"
              stroke={colores.prediccion}
              strokeWidth={2}
              strokeDasharray="5 4"
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="space-y-2.5">
        <Barra etiqueta="Prophet" valor={modelo} maximo={maximo} color={colores.prediccion} destacada />
        {referencia != null && (
          <Barra
            etiqueta="Repetir la última semana"
            valor={referencia}
            maximo={maximo}
            color={colores.referencia}
          />
        )}
      </div>

      {referencia != null && (
        <div
          className={`flex items-start gap-2 rounded-lg px-3 py-2 text-xs ${
            gana ? 'bg-utec-green/10 text-foreground' : 'bg-utec-orange/10 text-foreground'
          }`}
        >
          {gana ? (
            <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-marca-verde-texto" />
          ) : (
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-marca-naranja-texto" />
          )}
          <span>
            {gana
              ? `Se equivoca ${Math.round(mejora ?? 0)}% menos que la alternativa simple.`
              : 'Con estos datos no le gana a repetir la última semana: tomalo como orientación.'}
            {mae != null && ` Error típico: ±${entero(mae)} reservas por día.`}
          </span>
        </div>
      )}
    </div>
  );
}
