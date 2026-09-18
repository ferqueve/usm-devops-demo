import { Link } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import { MARCA } from '@/lib/design/paleta';

/**
 * Tira de métricas del dashboard.
 *
 * Celdas de color macizo con los colores institucionales MARCA. El color acá no
 * dice si algo está bien o mal: es la paleta de la casa, los mismos seis que
 * arma el isotipo.
 *
 * Cada celda lleva su línea de tendencia adentro del campo de color. Es lo que
 * la hace algo más que un número pintado: muestra si el valor viene subiendo,
 * bajando o quieto, sin robar espacio ni agregar otro elemento.
 */

export type ColorUtec = 'azul' | 'verde' | 'amarillo' | 'naranja' | 'rojo' | 'cian';

/**
 * Color de fondo y color de texto de cada celda.
 *
 * El texto no se elige a ojo: es el que gana en contraste contra ese fondo.
 * Medido en ratio WCAG sobre el hex exacto de marca:
 *
 *   verde    blanco 2.28:1 · tinta 6.78:1  → tinta
 *   amarillo blanco 1.57:1 · tinta 9.84:1  → tinta
 *   naranja  blanco 3.04:1 · tinta 5.08:1  → tinta
 *   cian     blanco 1.98:1 · tinta 7.80:1  → tinta
 *   rojo     blanco 4.64:1 · tinta 3.33:1  → blanco
 *   azul     blanco 8.70:1 · tinta 1.77:1  → blanco
 *
 * Verde y naranja venían con texto blanco y no llegaban ni a 3:1.
 */
const paleta: Record<ColorUtec, { fondo: string; texto: 'claro' | 'oscuro' }> = {
  azul: { fondo: MARCA.azul, texto: 'claro' },
  rojo: { fondo: MARCA.rojo, texto: 'claro' },
  verde: { fondo: MARCA.verde, texto: 'oscuro' },
  amarillo: { fondo: MARCA.amarillo, texto: 'oscuro' },
  naranja: { fondo: MARCA.naranja, texto: 'oscuro' },
  cian: { fondo: MARCA.cian, texto: 'oscuro' },
};

/** Orden por defecto, el de las aspas del isotipo. */
const RUEDA: ColorUtec[] = ['amarillo', 'azul', 'verde', 'cian', 'rojo', 'naranja'];

/** @deprecated Nombres viejos en inglés. */
export type UtecBg = 'blue' | 'yellow' | 'green' | 'orange' | 'red' | 'cyan' | 'dark';
const legado: Record<UtecBg, ColorUtec> = {
  blue: 'azul', yellow: 'amarillo', green: 'verde',
  orange: 'naranja', red: 'rojo', cyan: 'cian', dark: 'azul',
};

export interface StatItem {
  label: string;
  value: string | number;
  /** Aclaración corta bajo el número. Se muestra si no hay serie. */
  hint?: string;
  icon?: LucideIcon;
  /** Mapa "AAAA-MM" → cantidad. Dibuja la línea de tendencia. */
  serie?: Record<string, number>;
  /** Variación % contra el período anterior. */
  delta?: number | null;
  color?: ColorUtec;
  /** @deprecated Usar `color`. */
  bg?: UtecBg;
  /** Si se pasa, la celda actúa como link a esa ruta. */
  to?: string;
}

interface StatStripProps {
  items: StatItem[];
  loading?: boolean;
}

const columnas: Record<number, string> = {
  1: 'lg:grid-cols-1', 2: 'lg:grid-cols-2', 3: 'lg:grid-cols-3',
  4: 'lg:grid-cols-4', 5: 'lg:grid-cols-5', 6: 'lg:grid-cols-6',
};
const gridDe = (n: number) => columnas[Math.min(n, 6)] ?? 'lg:grid-cols-6';

/**
 * Línea de tendencia dentro del campo de color.
 *
 * Se dibuja en el mismo color del texto de la celda, bajada de opacidad: así
 * pertenece al bloque en vez de parecer algo pegado encima. Se apoya en el
 * borde inferior, que es donde no estorba al número.
 */
function Chispa({ serie, claro }: Readonly<{ serie: Record<string, number>; claro: boolean }>) {
  const valores = Object.values(serie);
  if (valores.length < 3) return null;

  const max = Math.max(...valores);
  const min = Math.min(...valores);
  const rango = max - min || 1;
  const paso = 100 / (valores.length - 1);
  const puntos = valores
    .map((v, i) => `${(i * paso).toFixed(2)},${(26 - ((v - min) / rango) * 22).toFixed(2)}`)
    .join(' ');

  const tinta = claro ? '#ffffff' : '#0f1720';

  return (
    <svg
      viewBox="0 0 100 28"
      preserveAspectRatio="none"
      className="pointer-events-none absolute inset-x-0 bottom-0 h-9 w-full"
      aria-hidden
    >
      <polygon points={`0,28 ${puntos} 100,28`} fill={tinta} opacity={claro ? 0.16 : 0.13} />
      <polyline
        points={puntos}
        fill="none"
        stroke={tinta}
        strokeOpacity={claro ? 0.55 : 0.42}
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

export function StatStrip({ items, loading = false }: Readonly<StatStripProps>) {
  if (loading) {
    return (
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="h-[104px] animate-pulse rounded-xl bg-muted" />
        ))}
      </div>
    );
  }

  return (
    <div className={`grid gap-3 grid-cols-2 sm:grid-cols-3 ${gridDe(items.length)}`}>
      {items.map((item, i) => {
        const color = item.color ?? (item.bg ? legado[item.bg] : RUEDA[i % RUEDA.length]);
        const { fondo, texto } = paleta[color];
        const claro = texto === 'claro';

        const principal = claro ? 'text-white' : 'text-[color:var(--success-foreground)]';
        const suave = claro ? 'text-white/75' : 'text-[color:var(--success-foreground)]/70';

        const inner = (
          <>
            {item.serie && <Chispa serie={item.serie} claro={claro} />}
            <span className="relative">
              <span className={`flex items-center gap-1.5 text-xs ${suave}`}>
                {item.icon && <item.icon className="size-3.5 shrink-0" />}
                <span className="truncate">{item.label}</span>
              </span>

              <span className="mt-1.5 flex items-baseline gap-1.5">
                <span className={`text-[1.75rem] font-semibold leading-none tabular-nums tracking-tight ${principal}`}>
                  {item.value}
                </span>
                {item.delta != null && item.delta !== 0 && (
                  <span className={`text-[11px] leading-none tabular-nums ${suave}`}>
                    {item.delta > 0 ? '↑' : '↓'} {Math.abs(item.delta)}%
                  </span>
                )}
              </span>

              {!item.serie && item.hint && (
                <span className={`mt-1 block truncate text-[11px] ${suave}`}>{item.hint}</span>
              )}
            </span>
          </>
        );

        const base = 'relative isolate overflow-hidden rounded-xl p-4 min-w-0 min-h-[104px]';
        const style = { backgroundColor: fondo };

        if (item.to) {
          return (
            <Link
              key={item.label}
              to={item.to}
              style={style}
              className={`${base} block transition-[filter,transform] hover:brightness-[1.06]`}
            >
              {inner}
            </Link>
          );
        }
        return (
          <div key={item.label} style={style} className={base}>
            {inner}
          </div>
        );
      })}
    </div>
  );
}
