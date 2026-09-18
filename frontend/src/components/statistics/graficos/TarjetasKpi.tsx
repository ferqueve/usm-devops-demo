import type { LucideIcon } from 'lucide-react';

import { StatStrip, type ColorUtec, type StatItem } from '@/components/common/StatStrip';

/**
 * Los KPI de las pantallas de Estadísticas.
 *
 * No dibuja nada propio: arma `StatItem` y deja que `StatStrip` los pinte.
 *
 * Antes era su propia tira. La diferencia se veía: el mini gráfico lo hacía
 * con Recharts en vez del polígono de `StatStrip`, el cambio iba en una
 * pastilla que en una celda angosta se montaba encima del número, y el verde
 * y el naranja llevaban texto blanco —2,28:1 y 3,04:1—, el mismo error que
 * `StatStrip` ya tenía corregido. Arreglado en un lado seguía roto en el otro.
 *
 * Lo que sí era propio suyo —la serie como lista, el suavizado, «nuevo», el
 * `×6` cuando el porcentaje deja de leerse— se subió a `StatStrip`, así que
 * lo tienen las dos.
 */

/** @deprecated Los nombres de color en inglés. Usar `ColorUtec`. */
type Fondo = 'dark' | 'green' | 'yellow' | 'red' | 'blue' | 'cyan' | 'orange';

const COLOR: Record<Fondo, ColorUtec> = {
  dark: 'oscuro',
  green: 'verde',
  yellow: 'amarillo',
  red: 'rojo',
  blue: 'azul',
  cyan: 'cian',
  orange: 'naranja',
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

export function TarjetasKpi({
  items,
  contra = 'el período anterior',
}: Readonly<{ items: Kpi[]; /** Contra qué se calcula el cambio, para el globo. */ contra?: string }>) {
  const celdas: StatItem[] = items.map((k) => ({
    label: k.etiqueta,
    value: k.valor,
    hint: k.detalle,
    icon: k.icono,
    color: COLOR[k.fondo ?? 'dark'],
    serie: k.serie,
    delta: k.cambio,
    subirEsMalo: k.subirEsMalo,
    nuevo: k.nuevo,
  }));

  return <StatStrip items={celdas} contra={contra} />;
}
