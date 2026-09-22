import { Link } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import { MARCA } from '@/lib/design/paleta';
import { Skeleton } from '@/components/ui/skeleton';

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

export type ColorUtec = 'azul' | 'verde' | 'amarillo' | 'naranja' | 'rojo' | 'cian' | 'oscuro';

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
  // La celda que es el total y no una categoría. Va en `--chrome`, el mismo
  // gris de los encabezados de panel, para que un tile oscuro y un encabezado
  // no sean dos grises parecidos pero distintos.
  oscuro: { fondo: 'var(--chrome)', texto: 'claro' },
};

/** Orden por defecto, el de las aspas del isotipo. */
const RUEDA: ColorUtec[] = ['amarillo', 'azul', 'verde', 'cian', 'rojo', 'naranja'];

/** @deprecated Nombres viejos en inglés. */
export type UtecBg = 'blue' | 'yellow' | 'green' | 'orange' | 'red' | 'cyan' | 'dark';
const legado: Record<UtecBg, ColorUtec> = {
  blue: 'azul', yellow: 'amarillo', green: 'verde',
  orange: 'naranja', red: 'rojo', cyan: 'cian', dark: 'oscuro',
};

export interface StatItem {
  label: string;
  value: string | number;
  /** Aclaración corta bajo el número. Se muestra si no hay serie. */
  hint?: string;
  icon?: LucideIcon;
  /**
   * La tendencia dibujada al fondo. Mapa "AAAA-MM" → cantidad, o la lista de
   * valores en orden cronológico.
   */
  serie?: Record<string, number> | number[];
  /** Variación % contra el período anterior. */
  delta?: number | null;
  /**
   * Si subir es malo —cancelaciones, vencidas—, cambia la explicación del
   * globo. No cambia el color: acá el color es la paleta de la casa y no dice
   * si algo está bien o mal.
   */
  subirEsMalo?: boolean;
  /** Antes era cero y ahora no: no hay porcentaje posible, dice «nuevo». */
  nuevo?: boolean;
  color?: ColorUtec;
  /** @deprecated Usar `color`. */
  bg?: UtecBg;
  /** Si se pasa, la celda actúa como link a esa ruta. */
  to?: string;
}

interface StatStripProps {
  items: StatItem[];
  loading?: boolean;
  /** Contra qué se calcula la variación, para el globo. */
  contra?: string;
  /**
   * Cuántas columnas como mucho en pantalla grande. Por defecto 6, el ancho
   * completo; media pantalla no da para seis celdas.
   */
  maxColumnas?: number;
}

const columnas: Record<number, string> = {
  1: 'lg:grid-cols-1', 2: 'lg:grid-cols-2', 3: 'lg:grid-cols-3',
  4: 'lg:grid-cols-4', 5: 'lg:grid-cols-5', 6: 'lg:grid-cols-6',
};
const gridDe = (n: number, tope: number) => columnas[Math.min(n, tope)] ?? 'lg:grid-cols-6';

/** "18%", o "×6" cuando el anterior era tan chico que el porcentaje no se lee. */
function textoCambio(delta: number): string {
  const abs = Math.abs(delta);
  return abs >= 400 ? `×${Math.round(1 + abs / 100)}` : `${Math.round(abs)}%`;
}

/**
 * Línea de tendencia dentro del campo de color.
 *
 * Se dibuja en el mismo color del texto de la celda, bajada de opacidad: así
 * pertenece al bloque en vez de parecer algo pegado encima. Se apoya en el
 * borde inferior, que es donde no estorba al número.
 */
/**
 * Promedia la serie en tramos para que dibuje la forma y no el ruido diario:
 * con 90 puntos de lunes a domingo la línea era un serrucho.
 */
function suavizar(datos: number[], tramos = 16): number[] {
  if (datos.length <= tramos) return datos;
  const largo = datos.length / tramos;
  return Array.from({ length: tramos }, (_, i) => {
    const parte = datos.slice(Math.floor(i * largo), Math.floor((i + 1) * largo));
    return parte.reduce((a, v) => a + v, 0) / Math.max(1, parte.length);
  });
}

function Chispa({ serie, claro }: Readonly<{ serie: Record<string, number> | number[]; claro: boolean }>) {
  const valores = suavizar(Array.isArray(serie) ? serie : Object.values(serie));
  if (valores.length < 3) return null;

  const max = Math.max(...valores);
  const min = Math.min(...valores);
  const rango = max - min || 1;
  const paso = 100 / (valores.length - 1);
  const puntos = valores
    .map((v, i) => `${(i * paso).toFixed(2)},${(26 - ((v - min) / rango) * 22).toFixed(2)}`)
    .join(' ');

  const tinta = claro ? '#ffffff' : MARCA.tinta;

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

export function StatStrip({
  items,
  loading = false,
  contra = 'el período anterior',
  maxColumnas = 6,
}: Readonly<StatStripProps>) {
  if (loading) {
    return (
      <div className={`grid gap-3 grid-cols-2 sm:grid-cols-3 ${gridDe(6, maxColumnas)}`}>
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Skeleton key={i} className="h-[104px] rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className={`grid gap-3 grid-cols-2 sm:grid-cols-3 ${gridDe(items.length, maxColumnas)}`}>
      {items.map((item, i) => {
        const color = item.color ?? (item.bg ? legado[item.bg] : RUEDA[i % RUEDA.length]);
        const { fondo, texto } = paleta[color];
        const claro = texto === 'claro';

        const principal = claro ? 'text-white' : 'text-marca-tinta';
        // Sin opacidad: a 11 y 13 px, el pie sobre rojo se quedaba en 2,89:1
        // y ni al 90% llegaba a 4,5. La jerarquía la dan el tamaño y el peso,
        // que ya son bien distintos: 28 px semibold contra 13 px normal.
        const suave = claro ? 'text-white' : 'text-marca-tinta';

        const inner = (
          <>
            {item.serie && <Chispa serie={item.serie} claro={claro} />}
            <span className="relative">
              <span className={`flex items-center gap-1.5 text-xs ${suave}`}>
                {item.icon && <item.icon className="size-3.5 shrink-0" />}
                <span className="truncate">{item.label}</span>
              </span>

              {/* flex-wrap: sin esto, en una celda angosta el cambio se
                  montaba encima del número en vez de bajar un renglón. */}
              <span className="mt-1.5 flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5">
                <span className={`text-[1.75rem] font-semibold leading-none tabular-nums tracking-tight ${principal}`}>
                  {item.value}
                </span>
                {item.nuevo ? (
                  <span className={`text-2xs leading-none ${suave}`} title={`no había contra ${contra}`}>
                    nuevo
                  </span>
                ) : (
                  item.delta != null &&
                  Number.isFinite(item.delta) &&
                  Math.round(item.delta) !== 0 && (
                    <span
                      className={`text-2xs leading-none tabular-nums ${suave}`}
                      title={
                        item.subirEsMalo
                          ? `contra ${contra}; acá subir es peor`
                          : `contra ${contra}`
                      }
                    >
                      {item.delta > 0 ? '↑' : '↓'} {textoCambio(item.delta)}
                    </span>
                  )
                )}
              </span>

              {item.hint && (
                <span className={`mt-1 block truncate text-2xs ${suave}`}>{item.hint}</span>
              )}
            </span>
          </>
        );

        // Con serie, la franja de abajo es del gráfico: el pie encima quedaba tachado.
        const base = `relative isolate overflow-hidden rounded-xl min-w-0 min-h-[104px] p-4 ${
          item.serie ? 'pb-9' : ''
        }`;
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
