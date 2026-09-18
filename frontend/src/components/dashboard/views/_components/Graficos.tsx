import { useMemo } from 'react';
import { MARCA, ORDEN_CATEGORIAS } from '@/lib/design/paleta';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { TooltipProps } from 'recharts';

/**
 * Los gráficos del dashboard.
 *
 * Compactos a propósito: acompañan a las listas, no reemplazan a la pantalla de
 * Estadísticas. Todos comen datos que el dashboard ya trae en su única llamada.
 */

/**
 * Paleta institucional, en el orden en que se van tomando los colores.
 *
 * Re-exportada desde `lib/design/paleta` para no volver a tener los hex
 * escritos acá: este objeto tenía el naranja equivocado (#e8630a en lugar del
 * #DE7A27 del manual) y nadie lo notaba porque no había con qué compararlo.
 */
export const UTEC = MARCA;

const PALETA = ORDEN_CATEGORIAS.map((k) => MARCA[k]);

function Globo({ active, payload, label }: Readonly<TooltipProps<number, string>>) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-md border border-utec-dark/40 bg-chrome px-2.5 py-1.5 text-xs text-white shadow-lg">
      {label && <div className="mb-0.5 font-medium">{label}</div>}
      {payload.map((e) => (
        <div key={e.name} className="tabular-nums">
          {e.name ? `${e.name}: ` : ''}
          {e.value?.toLocaleString('es-UY')}
        </div>
      ))}
    </div>
  );
}

const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'set', 'oct', 'nov', 'dic'];

/**
 * Numeros del eje en corto: 2000 -> 2k.
 *
 * Con los miles enteros el eje pedia mas ancho del que tenia y los digitos
 * salian cortados ("00", "50").
 */
function corto(valor: number): string {
  if (Math.abs(valor) >= 1000) {
    const miles = valor / 1000;
    return `${Number.isInteger(miles) ? miles : miles.toFixed(1)}k`;
  }
  return String(valor);
}

/** "2026-03" → "mar". El backend manda la clave así. */
function nombreDeMes(clave: string): string {
  const mes = Number.parseInt(clave.slice(5, 7), 10);
  return MESES[mes - 1] ?? clave;
}

/** Cuánto sube o baja la serie en su último tramo, para el subtítulo. */
export function variacion(serie: Record<string, number> | undefined): number | null {
  if (!serie) return null;
  const valores = Object.values(serie);
  if (valores.length < 2) return null;
  const ultimo = valores[valores.length - 1];
  const previo = valores[valores.length - 2];
  if (previo === 0) return null;
  return Math.round(((ultimo - previo) / previo) * 100);
}

interface TendenciaProps {
  /** Mapa "AAAA-MM" → cantidad, tal como lo manda el backend. */
  datos: Record<string, number>;
  color?: string;
  alto?: number;
  /**
   * El gráfico ocupa todo el alto del panel en vez de uno fijo.
   *
   * Solo donde el panel tiene alto definido (una fila de grilla): dentro de un
   * contenedor que crece con su contenido, ResponsiveContainer mide, agranda al
   * padre y vuelve a medir.
   */
  llenar?: boolean;
}

/** Envuelve el gráfico para que ocupe el alto del panel. */
function Marco({ llenar, alto, children }: Readonly<{ llenar?: boolean; alto: number; children: React.ReactElement }>) {
  if (llenar) {
    return (
      // minHeight da el piso: debajo de lg el panel mide auto y h-full seria 0.
      <div className="h-full min-h-0 w-full" style={{ minHeight: alto }}>
        <ResponsiveContainer width="100%" height="100%">
          {children}
        </ResponsiveContainer>
      </div>
    );
  }
  return (
    <ResponsiveContainer width="100%" height={alto}>
      {children}
    </ResponsiveContainer>
  );
}

/** Doce meses de actividad, en área. */
export function Tendencia({ datos, color = UTEC.azul, alto = 150, llenar }: Readonly<TendenciaProps>) {
  const serie = useMemo(
    () => Object.entries(datos).map(([clave, cantidad]) => ({ mes: nombreDeMes(clave), cantidad })),
    [datos],
  );
  if (serie.length === 0) return null;

  return (
    <Marco llenar={llenar} alto={alto}>
      <AreaChart data={serie} margin={{ top: 6, right: 8, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id={`grad-${color.slice(1)}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.35} />
            <stop offset="100%" stopColor={color} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <XAxis dataKey="mes" tick={{ fontSize: 11, fill: 'currentColor' }} axisLine={false} tickLine={false} className="text-muted-foreground" />
        <YAxis
          tick={{ fontSize: 11, fill: 'currentColor' }}
          axisLine={false}
          tickLine={false}
          width={34}
          tickFormatter={corto}
          className="text-muted-foreground"
        />
        <Tooltip content={<Globo />} cursor={{ stroke: color, strokeOpacity: 0.25 }} />
        <Area
          type="monotone"
          dataKey="cantidad"
          name="reservas"
          stroke={color}
          strokeWidth={2}
          fill={`url(#grad-${color.slice(1)})`}
        />
      </AreaChart>
    </Marco>
  );
}

export interface Porcion {
  nombre: string;
  valor: number;
  color: string;
}

interface AnilloProps {
  porciones: Porcion[];
  /** Número grande en el centro. Si no se pasa, se usa la suma. */
  centro?: string | number;
  leyendaCentro?: string;
  alto?: number;
  /** Centra el anillo en el alto del panel en vez de arrimarlo arriba. */
  llenar?: boolean;
}

/** Un anillo con el total en el medio y la leyenda al costado. */
export function Anillo({ porciones, centro, leyendaCentro, alto = 150, llenar }: Readonly<AnilloProps>) {
  const datos = porciones.filter((p) => p.valor > 0);
  const total = porciones.reduce((a, p) => a + p.valor, 0);
  if (datos.length === 0) {
    return <p className="py-8 text-center text-sm text-muted-foreground">Sin datos para graficar.</p>;
  }

  return (
    <div className={`flex items-center gap-3 ${llenar ? 'h-full' : ''}`}>
      {/* Con llenar el anillo crece con el panel, hasta donde no le coma la leyenda. */}
      <div
        className={`relative shrink-0 ${llenar ? 'aspect-square h-full max-h-[240px] max-w-[45%]' : ''}`}
        style={llenar ? { minHeight: alto } : { width: alto, height: alto }}
      >
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={datos}
              dataKey="valor"
              nameKey="nombre"
              innerRadius="64%"
              outerRadius="92%"
              paddingAngle={2}
              stroke="none"
            >
              {datos.map((p) => (
                <Cell key={p.nombre} fill={p.color} />
              ))}
            </Pie>
            <Tooltip content={<Globo />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-semibold tabular-nums leading-none">
            {(centro ?? total).toLocaleString?.('es-UY') ?? centro ?? total}
          </span>
          {leyendaCentro && (
            <span className="mt-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">{leyendaCentro}</span>
          )}
        </div>
      </div>
      <ul className="min-w-0 flex-1 space-y-1.5">
        {porciones.map((p) => (
          <li key={p.nombre} className="flex items-center gap-2 text-sm">
            <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ backgroundColor: p.color }} aria-hidden />
            <span className="min-w-0 flex-1 truncate text-muted-foreground">{p.nombre}</span>
            <span className="shrink-0 font-medium tabular-nums">{p.valor.toLocaleString('es-UY')}</span>
            {total > 0 && (
              <span className="w-9 shrink-0 text-right text-xs tabular-nums text-muted-foreground">
                {Math.round((p.valor / total) * 100)}%
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

interface BarrasProps {
  datos: Array<{ nombre: string; valor: number }>;
  color?: string;
  alto?: number;
  /** Colorea cada barra con la paleta, en vez de un solo color. */
  multicolor?: boolean;
  /** Ocupa el alto del panel. Ver la nota de Tendencia. */
  llenar?: boolean;
}

/** Ranking en barras horizontales: nombres largos que se leen. */
export function BarrasHorizontales({ datos, color = UTEC.azul, alto, multicolor = false, llenar }: Readonly<BarrasProps>) {
  if (datos.length === 0) {
    return <p className="py-8 text-center text-sm text-muted-foreground">Sin datos para graficar.</p>;
  }
  // Recharts saltea etiquetas cuando no entran: el alto lo decide la cantidad
  // de filas, no un numero fijo.
  const altoUtil = alto ?? Math.max(90, datos.length * 26 + 16);
  return (
    <Marco llenar={llenar} alto={altoUtil}>
      <BarChart data={datos} layout="vertical" margin={{ top: 2, right: 12, bottom: 2, left: 4 }}>
        <XAxis type="number" hide />
        <YAxis
          type="category"
          dataKey="nombre"
          width={104}
          interval={0}
          tick={{ fontSize: 11, fill: 'currentColor' }}
          axisLine={false}
          tickLine={false}
          className="text-muted-foreground"
        />
        <Tooltip content={<Globo />} cursor={{ fill: 'currentColor', fillOpacity: 0.06 }} />
        <Bar dataKey="valor" name="total" radius={[0, 4, 4, 0]} maxBarSize={18}>
          {datos.map((d, i) => (
            <Cell key={d.nombre} fill={multicolor ? PALETA[i % PALETA.length] : color} />
          ))}
        </Bar>
      </BarChart>
    </Marco>
  );
}

const DIAS: Array<[string, string]> = [
  ['MONDAY', 'Lun'],
  ['TUESDAY', 'Mar'],
  ['WEDNESDAY', 'Mié'],
  ['THURSDAY', 'Jue'],
  ['FRIDAY', 'Vie'],
  ['SATURDAY', 'Sáb'],
  ['SUNDAY', 'Dom'],
];

/** Qué días se carga el campus. El pico se pinta distinto. */
export function RitmoSemanal({ datos, alto = 150, llenar }: Readonly<{ datos: Record<string, number>; alto?: number; llenar?: boolean }>) {
  const serie = useMemo(
    () => DIAS.map(([clave, etiqueta]) => ({ dia: etiqueta, cantidad: datos[clave] ?? 0 })),
    [datos],
  );
  const pico = Math.max(...serie.map((d) => d.cantidad));
  if (pico === 0) {
    return <p className="py-8 text-center text-sm text-muted-foreground">Sin datos para graficar.</p>;
  }

  return (
    <Marco llenar={llenar} alto={alto}>
      <BarChart data={serie} margin={{ top: 6, right: 8, bottom: 0, left: 0 }}>
        <XAxis dataKey="dia" tick={{ fontSize: 11, fill: 'currentColor' }} axisLine={false} tickLine={false} className="text-muted-foreground" />
        <YAxis
          tick={{ fontSize: 11, fill: 'currentColor' }}
          axisLine={false}
          tickLine={false}
          width={34}
          tickFormatter={corto}
          className="text-muted-foreground"
        />
        <Tooltip content={<Globo />} cursor={{ fill: 'currentColor', fillOpacity: 0.06 }} />
        <Bar dataKey="cantidad" name="reservas" radius={[4, 4, 0, 0]} maxBarSize={34}>
          {serie.map((d) => (
            <Cell key={d.dia} fill={d.cantidad === pico ? UTEC.azul : '#c9d3e4'} />
          ))}
        </Bar>
      </BarChart>
    </Marco>
  );
}

/** Barra de progreso con etiqueta: para cupos y ocupaciones. */
export function Progreso({
  etiqueta,
  actual,
  total,
  color = UTEC.verde,
}: Readonly<{ etiqueta: string; actual: number; total: number; color?: string }>) {
  const porcentaje = total > 0 ? Math.min(100, Math.round((actual / total) * 100)) : 0;
  return (
    <div className="space-y-1">
      <div className="flex items-baseline justify-between gap-2 text-sm">
        <span className="min-w-0 truncate">{etiqueta}</span>
        <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
          {actual}/{total}
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full transition-all" style={{ width: `${porcentaje}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}
