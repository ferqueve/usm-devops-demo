import { useMemo } from 'react';
import { Minus, TrendingDown, TrendingUp } from 'lucide-react';
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
import type { DiaInventarioML, TipoInventarioML } from '@/lib/api/stats';
import { mezclar, useTemaGraficos } from '@/components/statistics/graficos/tema';
import { useColores } from '../colores';
import { decimal, entero, fechaConDia, fechaCorta, fechaLarga, porcentaje01, SVG_LLENO } from '../formato';
import { estiloRiesgo } from './estilos';
import { MARCA } from '@/lib/design/paleta';

/** Chips para elegir el tipo; el punto de color es su riesgo. */
export function SelectorTipos({ tipos, elegido, onElegir }: Readonly<{
  tipos: TipoInventarioML[];
  elegido: number | null;
  onElegir: (id: number) => void;
}>) {
  const tema = useTemaGraficos();
  return (
    <div className="flex gap-1.5 overflow-x-auto rounded-xl border bg-card p-1.5 [scrollbar-width:thin]" role="radiogroup" aria-label="Tipo de elemento">
      {tipos.map((t) => {
        const activo = t.tipoElementoId === elegido;
        const estilo = estiloRiesgo(t.status === 'omitido' ? null : t.riesgo, tema);
        return (
          <button
            key={t.tipoElementoId}
            type="button"
            role="radio"
            aria-checked={activo}
            onClick={() => onElegir(t.tipoElementoId)}
            title={estilo.etiqueta}
            className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              activo ? 'bg-chrome text-white' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            } ${t.status === 'omitido' ? 'italic' : ''}`}
          >
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: estilo.color }} aria-hidden />
            {t.nombre}
          </button>
        );
      })}
    </div>
  );
}

interface Punto extends DiaInventarioML {
  piso: number;
  ancho: number;
  /** El pico esperado sólo en los días con más de 50% de faltante, para marcarlos. */
  enRiesgo: number | null;
}

function Globo({ active, payload }: TooltipProps<number, string>) {
  const colores = useColores();
  if (!active || !payload?.length) return null;
  const p = payload[0].payload as Punto;
  return (
    <div className="min-w-[190px] rounded-lg bg-chrome px-3 py-2 text-xs text-white shadow-lg">
      <p className="mb-1.5 font-medium capitalize text-white/70">{fechaLarga(p.fecha)}</p>
      <Renglon color={colores.prediccion} etiqueta="Pico esperado" valor={decimal(p.prediccion)} extra={p.bandaInferior != null && p.bandaSuperior != null ? `${entero(p.bandaInferior)}–${entero(p.bandaSuperior)}` : undefined} />
      <Renglon color={colores.reservadas} etiqueta="Ya pedidas" valor={entero(p.comprometidas)} />
      <Renglon color={MARCA.rojo} etiqueta="Prob. de faltante" valor={porcentaje01(p.probFaltante)} />
    </div>
  );
}

function Renglon({ color, etiqueta, valor, extra }: Readonly<{ color: string; etiqueta: string; valor: string; extra?: string }>) {
  return (
    <div className="flex items-center gap-2 py-0.5">
      <span className="h-2 w-2 shrink-0 rounded-sm" style={{ backgroundColor: color }} aria-hidden />
      <span className="flex-1 text-white/70">{etiqueta}</span>
      <span className="font-semibold tabular-nums">{valor}</span>
      {extra && <span className="tabular-nums text-white/50">{extra}</span>}
    </div>
  );
}

/**
 * El pico esperado de unidades a la vez, con su banda del 80%, lo ya pedido
 * y la línea del stock disponible. Donde la banda cruza la línea hay riesgo; los
 * días con más de 50% de probabilidad llevan un punto rojo.
 */
export function GraficoPico({ tipo, alto = 300 }: Readonly<{ tipo: TipoInventarioML; alto?: number }>) {
  const colores = useColores();
  const tema = useTemaGraficos();
  const stock = tipo.stockDisponible ?? 0;
  const datos = useMemo<Punto[]>(
    () =>
      tipo.serie.map((d) => ({
        ...d,
        piso: d.bandaInferior ?? d.prediccion,
        ancho: Math.max(0, (d.bandaSuperior ?? d.prediccion) - (d.bandaInferior ?? d.prediccion)),
        enRiesgo: d.probFaltante >= 0.5 ? d.prediccion : null,
      })),
    [tipo.serie],
  );

  return (
    <div>
      <div className={SVG_LLENO} style={{ height: alto }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={datos} margin={{ top: 20, right: 12, bottom: 0, left: 0 }}>
            <CartesianGrid stroke={colores.grilla} vertical={false} />
            <XAxis dataKey="fecha" tickFormatter={fechaCorta} tick={{ fontSize: 11, fill: colores.eje }} axisLine={{ stroke: colores.grilla }} tickLine={false} minTickGap={24} />
            <YAxis
              tick={{ fontSize: 11, fill: colores.eje }}
              axisLine={false}
              tickLine={false}
              width={34}
              allowDecimals={false}
              // La línea de stock tiene que entrar aunque la demanda quede muy por debajo.
              domain={[0, (max: number) => Math.ceil(Math.max(max, stock) * 1.12)]}
            />
            <Tooltip content={<Globo />} cursor={{ stroke: colores.eje, strokeWidth: 1 }} />
            <Area dataKey="piso" stackId="banda" stroke="none" fill="transparent" activeDot={false} isAnimationActive={false} />
            <Area dataKey="ancho" stackId="banda" stroke="none" fill={colores.prediccion} fillOpacity={0.16} activeDot={false} isAnimationActive={false} />
            <Bar dataKey="comprometidas" fill={colores.reservadas} fillOpacity={0.65} barSize={8} radius={[3, 3, 0, 0]} isAnimationActive={false} />
            <Line dataKey="prediccion" stroke={colores.prediccion} strokeWidth={2} dot={false} activeDot={{ r: 4, strokeWidth: 2, stroke: 'var(--card)' }} isAnimationActive={false} />
            <Line dataKey="enRiesgo" stroke="none" dot={{ r: 4, fill: tema.danado, stroke: 'var(--card)', strokeWidth: 2 }} activeDot={false} isAnimationActive={false} legendType="none" />
            <ReferenceLine
              y={stock}
              stroke={tema.danado}
              strokeDasharray="6 4"
              strokeWidth={1.5}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <ul className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1 px-1 text-xs text-muted-foreground">
        <li className="flex items-center gap-1.5"><span className="h-0.5 w-5 rounded" style={{ backgroundColor: colores.prediccion }} />Pico esperado</li>
        <li className="flex items-center gap-1.5"><span className="h-3 w-5 rounded-sm" style={{ backgroundColor: colores.prediccion, opacity: 0.2 }} />Rango probable (80%)</li>
        <li className="flex items-center gap-1.5"><span className="h-3 w-1.5 rounded-t-sm" style={{ backgroundColor: colores.reservadas, opacity: 0.65 }} />Ya pedidas</li>
        <li className="flex items-center gap-1.5"><span className="w-5 border-t-2 border-dashed" style={{ borderColor: tema.danado }} />
          {/* El número va en la leyenda: sobre la línea se pisaba con el pronóstico. */}
          Disponibles hoy: <b className="text-foreground tabular-nums">{entero(stock)}</b>
        </li>
        <li className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: tema.danado }} />Más de 50% de faltante</li>
      </ul>
    </div>
  );
}

/** Tira de un cuadro por día con la probabilidad de faltante: se ve de un vistazo cuándo aprieta. */
export function TiraRiesgo({ serie }: Readonly<{ serie: DiaInventarioML[] }>) {
  const tema = useTemaGraficos();
  if (serie.length === 0) return null;
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-[11px] text-muted-foreground">
        <span>Probabilidad de faltante, día por día</span>
        <span className="flex items-center gap-1">
          0%
          {[0.15, 0.4, 0.65, 0.9].map((a) => <span key={a} className="h-2.5 w-3 rounded-sm" style={{ backgroundColor: mezclar(tema.vacio, tema.danado, a) }} />)}
          100%
        </span>
      </div>
      <div className="flex gap-[2px]" role="img" aria-label={`Días con más de 50% de faltante: ${serie.filter((d) => d.probFaltante >= 0.5).length}`}>
        {serie.map((d) => (
          <span
            key={d.fecha}
            className="h-5 min-w-0 flex-1 rounded-[3px]"
            style={{ backgroundColor: mezclar(tema.vacio, tema.danado, 0.08 + d.probFaltante * 0.92) }}
            title={`${fechaConDia(d.fecha)}: ${porcentaje01(d.probFaltante)}`}
          />
        ))}
      </div>
      <div className="mt-0.5 flex justify-between text-[10px] text-muted-foreground">
        <span>{fechaCorta(serie[0].fecha)}</span>
        <span>{fechaCorta(serie.at(-1)!.fecha)}</span>
      </div>
    </div>
  );
}

/**
 * Los multiplicadores por día de la semana que aprendió el modelo, como
 * columnas contra la línea del día promedio (×1). La tendencia va al lado.
 */
export function PatronSemanal({ tipo, alto = 120 }: Readonly<{ tipo: TipoInventarioML; alto?: number }>) {
  const colores = useColores();
  const dias = tipo.diaSemana ?? [];
  if (dias.length === 0) return <p className="py-6 text-center text-sm text-muted-foreground">Sin patrón semanal.</p>;
  const tope = Math.max(1.2, ...dias.map((d) => d.multiplicador)) * 1.08;
  const tendencia = tipo.tendenciaSemanalPct;
  const IconoTendencia = tendencia == null || Math.abs(tendencia) < 0.5 ? Minus : tendencia > 0 ? TrendingUp : TrendingDown;
  return (
    <div className="space-y-2">
      <div className="relative flex items-end gap-1.5" style={{ height: alto }}>
        {/* La leyenda de esta línea va abajo: arriba se pisaba con la etiqueta de las columnas. */}
        <div className="pointer-events-none absolute inset-x-0 border-t border-dashed border-muted-foreground/50" style={{ bottom: `${(1 / tope) * 100}%` }} />
        {dias.map((d) => (
          <div key={d.dia} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end" title={`${d.dia}: ×${decimal(d.multiplicador, 2)}`}>
            <span className="mb-0.5 text-[10px] font-semibold tabular-nums">×{decimal(d.multiplicador)}</span>
            <div
              className="w-full max-w-[28px] rounded-t-[4px]"
              style={{ height: `${(d.multiplicador / tope) * 100}%`, backgroundColor: colores.prediccion, opacity: d.multiplicador >= 1 ? 1 : 0.4 }}
            />
          </div>
        ))}
      </div>
      <div className="flex gap-1.5 border-t pt-1">
        {dias.map((d) => <span key={d.dia} className="min-w-0 flex-1 text-center text-[11px] text-muted-foreground">{d.dia}</span>)}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <IconoTendencia className="h-3.5 w-3.5" />
          tendencia <b className="text-foreground tabular-nums">{tendencia == null ? '—' : `${tendencia > 0 ? '+' : ''}${decimal(tendencia)}%`}</b> por semana
        </span>
        <span className="inline-flex items-center gap-1"><span className="w-4 border-t border-dashed border-muted-foreground" />día promedio: <b className="text-foreground tabular-nums">{decimal(tipo.mediaHistorica)}</b> a la vez</span>
      </div>
    </div>
  );
}

/** El horizonte del tipo por semana. */
export function SemanasTipo({ tipo }: Readonly<{ tipo: TipoInventarioML }>) {
  const tema = useTemaGraficos();
  const stock = tipo.stockDisponible ?? 0;
  const semanas = tipo.semanas ?? [];
  if (semanas.length === 0) return <p className="py-6 text-center text-sm text-muted-foreground">Sin semanas en el horizonte.</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[460px] text-sm">
        <thead className="text-[11px] uppercase tracking-wide text-muted-foreground">
          <tr className="border-b">
            <th className="px-3 py-2 text-left font-medium">Semana</th>
            <th className="px-3 py-2 text-right font-medium">Pico esperado</th>
            <th className="px-3 py-2 text-right font-medium">Ya pedido</th>
            <th className="px-3 py-2 text-left font-medium">Prob. de faltante</th>
          </tr>
        </thead>
        <tbody>
          {semanas.map((s) => {
            const estilo = estiloRiesgo(s.probFaltanteMax >= 0.5 ? 'alto' : s.probFaltanteMax >= 0.2 ? 'medio' : 'bajo', tema);
            const supera = s.comprometidasMax > stock;
            return (
              <tr key={s.semana} className="border-b border-border/60 last:border-0">
                <td className="px-3 py-2 whitespace-nowrap">del {fechaCorta(s.semana)}</td>
                <td className="px-3 py-2 text-right tabular-nums">
                  <b>{decimal(s.picoEsperado)}</b> <span className="text-xs text-muted-foreground">/ {entero(stock)}</span>
                </td>
                <td className={`px-3 py-2 text-right tabular-nums ${supera ? 'font-semibold text-utec-red' : ''}`}>{entero(s.comprometidasMax)}</td>
                <td className="px-3 py-2">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-full max-w-[140px] overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full" style={{ width: `${s.probFaltanteMax * 100}%`, backgroundColor: estilo.color }} />
                    </div>
                    <span className="w-10 text-right text-xs font-semibold tabular-nums">{porcentaje01(s.probFaltanteMax)}</span>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
