import {
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
import type { PrediccionAcademico } from '@/lib/api/stats';
import { Medidor } from '@/components/statistics/graficos/Medidor';
import { useTemaGraficos } from '@/components/statistics/graficos/tema';
import { Vacio } from '@/components/statistics/Vacio';
import { useColores } from '../colores';
import { decimal, entero, fechaCorta, porcentaje01, SVG_LLENO } from '../formato';

type Modelo = PrediccionAcademico['modelo'];

/** El AUC como medidor, con lo que quiere decir en una frase. */
export function MedidorAuc({ auc, grande = false }: Readonly<{ auc: number | null | undefined; grande?: boolean }>) {
  if (auc == null) return <Vacio texto="Sin validación guardada." />;
  const deDiez = Math.round(auc * 10);
  return (
    <div className="space-y-3">
      <Medidor valor={auc * 100} etiqueta="Distingue quién va" detalle={`AUC ${decimal(auc, 2)}`} umbrales={{ alerta: 60, aviso: 70 }} ancho={grande ? 240 : 170} />
      <p className="text-center text-xs leading-relaxed text-muted-foreground">
        Entre alguien que fue y alguien que no, le da más chance al que fue <b className="text-foreground">{deDiez} de cada 10</b> veces.
        Tirar una moneda acierta 5.
      </p>
    </div>
  );
}

/** El Brier del modelo contra el de decir siempre el promedio, y cuánto mejora. */
export function BrierContraBase({ modelo, grande = false }: Readonly<{ modelo: Modelo; grande?: boolean }>) {
  const colores = useColores();
  const { brier, brierBase } = modelo;
  if (brier == null || brierBase == null) return <Vacio texto="Sin validación guardada." />;
  const mejora = brierBase > 0 ? (1 - brier / brierBase) * 100 : 0;
  const maximo = Math.max(brier, brierBase) * 1.1;
  return (
    <div className="space-y-3">
      <Medidor
        valor={Math.max(0, mejora)}
        etiqueta={mejora > 0 ? 'Mejor que el promedio' : 'No mejora al promedio'}
        detalle={mejora > 0 ? 'menos error que la base' : `${decimal(-mejora, 0)}% más error que la base`}
        umbrales={{ alerta: 0, aviso: 5 }}
        ancho={grande ? 240 : 150}
      />
      <div className="space-y-1.5 text-xs">
        {[
          { etiqueta: 'Modelo', valor: brier, color: colores.prediccion },
          { etiqueta: 'Siempre el promedio', valor: brierBase, color: colores.referencia },
        ].map((b) => (
          <div key={b.etiqueta} className="grid grid-cols-[110px_minmax(0,1fr)_40px] items-center gap-2">
            <span className="truncate text-muted-foreground">{b.etiqueta}</span>
            <span className="h-2 overflow-hidden rounded-full bg-muted">
              <span className="block h-full rounded-full" style={{ width: `${(b.valor / maximo) * 100}%`, backgroundColor: b.color }} />
            </span>
            <span className="text-right font-semibold tabular-nums">{decimal(b.valor, 3)}</span>
          </div>
        ))}
        <div className="flex justify-between border-t pt-1.5 text-muted-foreground">
          <span>Acierta con 50%: <b className="text-foreground">{porcentaje01(modelo.exactitud)}</b></span>
          <span>Log loss: <b className="text-foreground tabular-nums">{decimal(modelo.logLoss, 2)}</b></span>
        </div>
      </div>
    </div>
  );
}

interface PuntoCalibracion {
  predicho: number;
  real: number;
  n: number;
  desde: number;
  hasta: number;
}

function GloboCalibracion({ active, payload }: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload as PuntoCalibracion;
  return (
    <div className="rounded-lg bg-utec-dark px-3 py-2 text-xs text-white shadow-lg">
      <p className="mb-1 font-medium text-white/70">Predicho entre {porcentaje01(p.desde)} y {porcentaje01(p.hasta)}</p>
      <p>Predijo en promedio <b>{porcentaje01(p.predicho)}</b></p>
      <p>Fueron <b>{porcentaje01(p.real)}</b></p>
      <p className="text-white/60">{entero(p.n)} inscripciones</p>
    </div>
  );
}

/**
 * Curva de calibración: predicho medio contra asistencia real por tramo. La
 * diagonal es la calibración perfecta; el tamaño del punto, cuántas
 * inscripciones hay en el tramo (un punto chico lejos de la diagonal pesa poco).
 */
export function CurvaCalibracion({ calibracion, alto = 220 }: Readonly<{ calibracion: Modelo['calibracion']; alto?: number }>) {
  const colores = useColores();
  const puntos: PuntoCalibracion[] = (calibracion ?? [])
    .filter((c) => c.predicho != null && c.real != null && c.n > 0)
    .map((c) => ({ predicho: c.predicho as number, real: c.real as number, n: c.n, desde: c.desde, hasta: c.hasta }));
  if (puntos.length === 0) return <Vacio texto="Sin datos de calibración." />;
  const maxN = Math.max(...puntos.map((p) => p.n));

  return (
    <div>
      <div className={SVG_LLENO} style={{ height: alto }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={puntos} margin={{ top: 8, right: 12, bottom: 4, left: 0 }}>
            <CartesianGrid stroke={colores.grilla} />
            <XAxis type="number" dataKey="predicho" domain={[0, 1]} ticks={[0, 0.25, 0.5, 0.75, 1]} tickFormatter={(v: number) => `${Math.round(v * 100)}%`} tick={{ fontSize: 10, fill: colores.eje }} axisLine={{ stroke: colores.grilla }} tickLine={false} />
            <YAxis type="number" domain={[0, 1]} ticks={[0, 0.25, 0.5, 0.75, 1]} tickFormatter={(v: number) => `${Math.round(v * 100)}%`} tick={{ fontSize: 10, fill: colores.eje }} axisLine={false} tickLine={false} width={36} />
            <ReferenceLine segment={[{ x: 0, y: 0 }, { x: 1, y: 1 }]} stroke={colores.referencia} strokeDasharray="5 4" ifOverflow="extendDomain" />
            <Tooltip content={<GloboCalibracion />} cursor={false} />
            <Line
              dataKey="real"
              stroke={colores.real}
              strokeWidth={2}
              isAnimationActive={false}
              dot={(props: { cx?: number; cy?: number; payload?: PuntoCalibracion; index?: number }) => (
                <circle
                  key={`punto-${props.index}`}
                  cx={props.cx}
                  cy={props.cy}
                  r={4 + 6 * Math.sqrt((props.payload?.n ?? 0) / maxN)}
                  fill={colores.real}
                  fillOpacity={0.85}
                  stroke="var(--card)"
                  strokeWidth={2}
                />
              )}
              activeDot={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-1 flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: colores.real }} />asistencia real (tamaño = inscripciones)</span>
        <span className="inline-flex items-center gap-1.5"><span className="w-5 border-t-2 border-dashed" style={{ borderColor: colores.referencia }} />perfecta</span>
      </div>
    </div>
  );
}

type Semana = NonNullable<Modelo['historicoSemanal']>[number];

function GloboSemana({ active, payload }: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload as Semana;
  return (
    <div className="rounded-lg bg-utec-dark px-3 py-2 text-xs text-white shadow-lg">
      <p className="mb-1 font-medium text-white/70">Semana del {fechaCorta(p.semana)}</p>
      <p>Inscriptos: <b>{entero(p.inscriptos)}</b></p>
      <p>Asistieron: <b>{entero(p.asistieron)}</b></p>
      <p>Esperados: <b>{decimal(p.esperados)}</b></p>
    </div>
  );
}

/** Semanas de validación: inscriptos, los que fueron y los que el modelo esperaba sin haberlas visto. */
export function HistoricoSemanal({ semanas, alto = 260 }: Readonly<{ semanas: Modelo['historicoSemanal']; alto?: number }>) {
  const colores = useColores();
  const tema = useTemaGraficos();
  if (!semanas?.length) return <Vacio texto="Sin semanas de validación." />;
  return (
    <div>
      <div className={SVG_LLENO} style={{ height: alto }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={semanas} margin={{ top: 8, right: 8, bottom: 0, left: -8 }} barGap={2} barCategoryGap="24%">
            <CartesianGrid stroke={colores.grilla} vertical={false} />
            <XAxis dataKey="semana" tickFormatter={fechaCorta} tick={{ fontSize: 11, fill: colores.eje }} axisLine={{ stroke: colores.grilla }} tickLine={false} minTickGap={12} />
            <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: colores.eje }} axisLine={false} tickLine={false} width={40} />
            <Tooltip content={<GloboSemana />} cursor={{ fill: colores.grilla, fillOpacity: 0.5 }} />
            <Bar dataKey="inscriptos" fill={tema.categorias[0]} fillOpacity={0.3} radius={[3, 3, 0, 0]} isAnimationActive={false} />
            <Bar dataKey="asistieron" fill={tema.aprobadas} radius={[3, 3, 0, 0]} isAnimationActive={false} />
            <Line dataKey="esperados" stroke={colores.prediccion} strokeWidth={2} strokeDasharray="5 4" dot={{ r: 3, fill: colores.prediccion, stroke: 'var(--card)', strokeWidth: 1.5 }} isAnimationActive={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-1 flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: tema.categorias[0], opacity: 0.3 }} />Inscriptos</span>
        <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: tema.aprobadas }} />Asistieron</span>
        <span className="inline-flex items-center gap-1.5"><span className="w-5 border-t-2 border-dashed" style={{ borderColor: colores.prediccion }} />Esperados por el modelo</span>
      </div>
    </div>
  );
}
