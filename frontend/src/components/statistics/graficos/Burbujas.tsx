import { CartesianGrid, LabelList, ReferenceLine, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis, ZAxis } from 'recharts';
import type { TooltipProps } from 'recharts';
import { formatoNumero, useTemaGraficos } from './tema';

export interface PuntoBurbuja {
  nombre: string;
  x: number;
  y: number;
  /** Tamaño de la burbuja. */
  z: number;
  /** Si está, la burbuja filtra la vista. */
  alClic?: () => void;
  /** Nombre escrito junto a la burbuja (sólo en las que lo llevan). */
  etiqueta?: string;
  /** La etiqueta va debajo de la burbuja en vez de arriba. */
  etiquetaAbajo?: boolean;
}

interface Props {
  puntos: PuntoBurbuja[];
  ejeX: string;
  ejeY: string;
  tamano: string;
  /** Línea horizontal de referencia (p. ej. el promedio). */
  referenciaY?: number;
  /** Por encima de esto el punto se marca como alerta. */
  alertaY?: number;
  formatoY?: (v: number) => string;
  formatoX?: (v: number) => string;
  alto?: number;
  /** Texto de la línea de referencia. */
  etiquetaReferencia?: string;
  /** Rango del eje vertical; por defecto de 0 al máximo. */
  dominioY?: [number, number];
  ticksY?: number[];
  /** Escala logarítmica horizontal, para cuando hay valores muy dispares. */
  logX?: boolean;
  /** Cortes del eje horizontal (necesarios con escala log: los automáticos se repiten). */
  ticksX?: number[];
}

interface GloboProps extends TooltipProps<number, string> {
  ejeX: string;
  ejeY: string;
  tamano: string;
  formatoY: (v: number) => string;
  formatoX: (v: number) => string;
}

function Globo({ active, payload, ejeX, ejeY, tamano, formatoY, formatoX }: GloboProps) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload as PuntoBurbuja;
  return (
    <div className="rounded-lg bg-utec-dark px-3 py-2 text-xs text-white shadow-lg">
      <p className="mb-1 font-medium">{p.nombre}</p>
      <p>{ejeX}: <b>{formatoX(p.x)}</b></p>
      <p>{ejeY}: <b>{formatoY(p.y)}</b></p>
      <p>{tamano}: <b>{formatoNumero(p.z)}</b></p>
      {p.alClic && <p className="mt-1 text-[10px] text-white/60">Clic para filtrar</p>}
    </div>
  );
}

/**
 * Dispersión con burbujas: dos medidas a la vez (volumen y tasa), y el tamaño
 * una tercera. Separa lo que importa: una carrera que reserva mucho y cancela
 * mucho está arriba a la derecha.
 */
export function Burbujas({ puntos, ejeX, ejeY, tamano, referenciaY, alertaY, formatoY = (v) => `${v}`, formatoX = formatoNumero, alto = 300, etiquetaReferencia = 'promedio', dominioY, ticksY, logX = false, ticksX }: Readonly<Props>) {
  const tema = useTemaGraficos();

  if (puntos.length === 0) return <p className="py-8 text-center text-sm text-muted-foreground">Sin datos en el período.</p>;

  const conClic = puntos.some((p) => p.alClic);
  const alClic = (d: { payload?: PuntoBurbuja } & Partial<PuntoBurbuja>) => (d?.payload?.alClic ?? d?.alClic)?.();
  const normales = alertaY == null ? puntos : puntos.filter((p) => p.y <= alertaY);
  const alertas = alertaY == null ? [] : puntos.filter((p) => p.y > alertaY);

  return (
    <ResponsiveContainer width="100%" height={alto}>
      <ScatterChart margin={{ top: 12, right: 64, bottom: 18, left: 4 }}>
        <CartesianGrid stroke={tema.grilla} />
        <XAxis
          type="number"
          dataKey="x"
          name={ejeX}
          scale={logX ? 'log' : 'auto'}
          ticks={ticksX}
          domain={logX ? [(min: number) => Math.max(1, min * 0.8), (max: number) => max * 1.25] : [(min: number) => Math.max(0, Math.floor(min * 0.85)), (max: number) => Math.ceil(max * 1.08)]}
          allowDecimals={false}
          tick={{ fontSize: 11, fill: tema.eje }}
          axisLine={{ stroke: tema.grilla }}
          tickLine={false}
          tickFormatter={formatoX}
          label={{ value: ejeX, position: 'insideBottom', offset: -10, fontSize: 11, fill: tema.eje }}
        />
        <YAxis
          type="number"
          dataKey="y"
          name={ejeY}
          domain={dominioY ?? [0, (max: number) => Math.ceil(Math.max(max, alertaY ?? 0) * 1.15)]}
          ticks={ticksY}
          allowDataOverflow={dominioY != null}
          tick={{ fontSize: 11, fill: tema.eje }}
          axisLine={false}
          tickLine={false}
          tickFormatter={formatoY}
          width={44}
          label={{ value: ejeY, angle: -90, position: 'insideLeft', fontSize: 11, fill: tema.eje, dy: 40 }}
        />
        <ZAxis type="number" dataKey="z" range={[60, 600]} name={tamano} />
        <Tooltip content={<Globo ejeX={ejeX} ejeY={ejeY} tamano={tamano} formatoY={formatoY} formatoX={formatoX} />} cursor={{ strokeDasharray: '3 3', stroke: tema.eje }} />
        {referenciaY != null && (
          <ReferenceLine y={referenciaY} stroke={tema.eje} strokeDasharray="4 4" label={{ value: etiquetaReferencia, position: 'right', fontSize: 10, fill: tema.eje }} />
        )}
        <Scatter data={normales} fill={tema.categorias[0]} fillOpacity={0.55} stroke={tema.categorias[0]} isAnimationActive={false} onClick={alClic} cursor={conClic ? 'pointer' : undefined}>
          <LabelList
            dataKey="etiqueta"
            content={(props: { x?: number | string; y?: number | string; width?: number | string; height?: number | string; value?: unknown; index?: number }) => {
              if (props.value == null || props.value === '') return null;
              const p = normales[props.index ?? -1];
              const cx = Number(props.x) + Number(props.width) / 2;
              const abajo = p?.etiquetaAbajo;
              // Texto sin cortar en renglones: el Label de recharts lo partía al ancho de la burbuja.
              return (
                // Cerca del eje izquierdo, alineada a la izquierda para no pisar los números del eje.
                <text
                  x={cx < 130 ? Number(props.x) : cx}
                  y={abajo ? Number(props.y) + Number(props.height) + 12 : Number(props.y) - 5}
                  textAnchor={cx < 130 ? 'start' : 'middle'} fontSize={10} fill={tema.eje} style={{ pointerEvents: 'none' }}>
                  {String(props.value)}
                </text>
              );
            }}
          />
        </Scatter>
        {alertaY != null && (
          <ReferenceLine y={alertaY} stroke={tema.danado} strokeOpacity={0.5} label={{ value: `${formatoY(alertaY)}`, position: 'right', fontSize: 10, fill: tema.danado }} />
        )}
        {alertas.length > 0 && (
          <Scatter data={alertas} fill={tema.danado} fillOpacity={0.6} stroke={tema.danado} isAnimationActive={false} onClick={alClic} cursor={conClic ? 'pointer' : undefined} />
        )}
      </ScatterChart>
    </ResponsiveContainer>
  );
}
