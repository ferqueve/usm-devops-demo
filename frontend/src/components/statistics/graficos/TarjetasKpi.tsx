import { useId } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Area, AreaChart, ResponsiveContainer } from 'recharts';
import { TrendingDown, TrendingUp } from 'lucide-react';

type Fondo = 'dark' | 'green' | 'yellow' | 'red' | 'blue' | 'cyan' | 'orange';

const FONDOS: Record<Fondo, { bg: string; texto: string; tenue: string; trazo: string }> = {
  dark: { bg: 'bg-utec-dark', texto: 'text-white', tenue: 'text-white/60', trazo: '#ffffff' },
  green: { bg: 'bg-utec-green', texto: 'text-white', tenue: 'text-white/80', trazo: '#ffffff' },
  yellow: { bg: 'bg-utec-yellow', texto: 'text-utec-dark', tenue: 'text-utec-dark/70', trazo: '#343a40' },
  red: { bg: 'bg-utec-red', texto: 'text-white', tenue: 'text-white/80', trazo: '#ffffff' },
  blue: { bg: 'bg-utec-blue', texto: 'text-white', tenue: 'text-white/75', trazo: '#ffffff' },
  cyan: { bg: 'bg-utec-cyan', texto: 'text-utec-dark', tenue: 'text-utec-dark/70', trazo: '#343a40' },
  orange: { bg: 'bg-utec-orange', texto: 'text-white', tenue: 'text-white/80', trazo: '#ffffff' },
};

export interface Kpi {
  etiqueta: string;
  valor: string;
  detalle?: string;
  icono?: LucideIcon;
  fondo?: Fondo;
  /** Serie para el mini gráfico del fondo, en orden cronológico. */
  serie?: number[];
  /** Cambio en % contra el período anterior. */
  cambio?: number | null;
  /** Si subir es malo (cancelaciones, vencidas), la flecha se lee al revés. */
  subirEsMalo?: boolean;
  /** Antes había cero y ahora no: no hay porcentaje posible. */
  nuevo?: boolean;
}

/** "+25%", o "×6" cuando el anterior era tan chico que el porcentaje no se lee. */
function textoCambio(cambio: number): string {
  if (cambio >= 400) return `×${Math.round(1 + cambio / 100)}`;
  return `${cambio > 0 ? '+' : ''}${Math.round(cambio)}%`;
}

/**
 * Promedia la serie en tramos para que dibuje la forma y no el ruido diario:
 * con 90 puntos de lunes a domingo el mini gráfico era un serrucho.
 */
function suavizar(datos: number[], tramos = 16): number[] {
  if (datos.length <= tramos) return datos;
  const largo = datos.length / tramos;
  return Array.from({ length: tramos }, (_, i) => {
    const parte = datos.slice(Math.floor(i * largo), Math.floor((i + 1) * largo));
    return parte.reduce((a, v) => a + v, 0) / Math.max(1, parte.length);
  });
}

function Sparkline({ datos, color }: Readonly<{ datos: number[]; color: string }>) {
  const id = useId().replace(/:/g, '');
  const puntos = suavizar(datos).map((v, i) => ({ i, v }));
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={puntos} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id={`sp-${id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.22} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area dataKey="v" type="monotone" stroke={color} strokeOpacity={0.45} strokeWidth={1.5} fill={`url(#sp-${id})`} isAnimationActive={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

/**
 * Tarjetas de color institucional con la tendencia del período dibujada al
 * fondo y el cambio contra el período anterior. El número manda; el mini
 * gráfico da la forma sin tener que ir a buscarla abajo.
 */
export function TarjetasKpi({ items, contra = 'el período anterior' }: Readonly<{ items: Kpi[]; /** Contra qué se calcula el cambio, para el globo. */ contra?: string }>) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {items.map((k) => {
        const f = FONDOS[k.fondo ?? 'dark'];
        const Icono = k.icono;
        const sube = (k.cambio ?? 0) > 0;
        const bueno = k.subirEsMalo ? !sube : sube;
        return (
          // pb-9 deja la franja de abajo para el mini gráfico: encima del texto lo tachaba.
          <div key={k.etiqueta} className={`relative min-w-0 overflow-hidden rounded-xl px-4 pt-4 pb-9 ${f.bg}`}>
            {k.serie && k.serie.length > 1 && (
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-8" aria-hidden>
                <Sparkline datos={k.serie} color={f.trazo} />
              </div>
            )}
            <div className="relative">
              <div className={`mb-1 flex items-center gap-1.5 text-xs ${f.tenue}`}>
                {Icono && <Icono className="h-3.5 w-3.5 shrink-0" />}
                <span className="truncate">{k.etiqueta}</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className={`text-2xl font-semibold ${f.texto}`}>{k.valor}</span>
                {k.nuevo && (
                  <span className={`rounded-full bg-white/25 px-1.5 py-0.5 text-[10px] font-semibold ${f.texto}`} title={`no había contra ${contra}`}>
                    nuevo
                  </span>
                )}
                {!k.nuevo && k.cambio != null && Number.isFinite(k.cambio) && Math.round(k.cambio) !== 0 && (
                  <span
                    className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                      bueno ? 'bg-white/25' : 'bg-black/20'
                    } ${f.texto}`}
                    title={`contra ${contra}`}
                  >
                    {sube ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                    {textoCambio(k.cambio)}
                  </span>
                )}
              </div>
              {k.detalle && <div className={`mt-0.5 truncate text-[11px] ${f.tenue}`}>{k.detalle}</div>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
