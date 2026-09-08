import { Link } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';

export type UtecBg =
  | 'blue' | 'yellow' | 'green' | 'orange' | 'red'
  | 'cyan' | 'dark';

export interface StatItem {
  label: string;
  value: string | number;
  hint?: string;
  icon?: LucideIcon;
  /** Fondo institucional UTEC. El color de texto se calcula automáticamente. */
  bg?: UtecBg;
  /** Si se pasa, la celda actúa como link a esa ruta. */
  to?: string;
}

interface StatStripProps {
  items: StatItem[];
  loading?: boolean;
}

/**
 * Columnas segun cuantas tarjetas hay.
 *
 * Estaba fijo en seis: con cuatro tarjetas quedaban dos huecos a la derecha y
 * la tira no llegaba al borde.
 */
const columnas: Record<number, string> = {
  1: 'lg:grid-cols-1',
  2: 'lg:grid-cols-2',
  3: 'lg:grid-cols-3',
  4: 'lg:grid-cols-4',
  5: 'lg:grid-cols-5',
  6: 'lg:grid-cols-6',
};

function gridDe(cantidad: number): string {
  return columnas[Math.min(cantidad, 6)] ?? 'lg:grid-cols-6';
}

/**
 * Mapeo de fondo UTEC → clases tailwind para bg + texto principal + texto
 * secundario. Los colores claros (yellow, cyan) usan texto oscuro; los
 * oscuros usan blanco.
 */
const bgClasses: Record<UtecBg, { bg: string; text: string; subtle: string; hover: string }> = {
  blue:   { bg: 'bg-utec-blue',   text: 'text-white',          subtle: 'text-white/70',          hover: 'hover:brightness-110' },
  yellow: { bg: 'bg-utec-yellow', text: 'text-utec-dark',      subtle: 'text-utec-dark/70',      hover: 'hover:brightness-95'  },
  green:  { bg: 'bg-utec-green',  text: 'text-white',          subtle: 'text-white/80',          hover: 'hover:brightness-110' },
  orange: { bg: 'bg-utec-orange', text: 'text-white',          subtle: 'text-white/80',          hover: 'hover:brightness-110' },
  red:    { bg: 'bg-utec-red',    text: 'text-white',          subtle: 'text-white/80',          hover: 'hover:brightness-110' },
  cyan:   { bg: 'bg-utec-cyan',   text: 'text-utec-dark',      subtle: 'text-utec-dark/70',      hover: 'hover:brightness-95'  },
  dark:   { bg: 'bg-utec-dark',   text: 'text-white',          subtle: 'text-white/60',          hover: 'hover:bg-utec-dark-lighter' },
};

/**
 * Strip de stats con fondo institucional UTEC. Cada celda es un card
 * de color completo (no más rounded-border-blanco aburrido).
 */
export function StatStrip({ items, loading = false }: Readonly<StatStripProps>) {
  if (loading) {
    return (
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="rounded-xl bg-muted p-4 animate-pulse">
            <div className="h-3 w-16 bg-foreground/10 rounded mb-2" />
            <div className="h-6 w-12 bg-foreground/20 rounded" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={`grid gap-3 grid-cols-2 sm:grid-cols-3 ${gridDe(items.length)}`}>
      {items.map((item) => {
        const Icon = item.icon;
        const c = bgClasses[item.bg ?? 'dark'];
        const inner = (
          <>
            <div className={`flex items-center gap-1.5 text-xs mb-1 ${c.subtle}`}>
              {Icon && <Icon className="h-3.5 w-3.5 shrink-0" />}
              <span className="truncate">{item.label}</span>
            </div>
            <div className={`text-2xl font-semibold tabular-nums ${c.text}`}>
              {item.value}
            </div>
            {item.hint && (
              <div className={`text-[11px] mt-0.5 truncate ${c.subtle}`}>{item.hint}</div>
            )}
          </>
        );

        const base = `rounded-xl p-4 min-w-0 transition-all ${c.bg}`;

        if (item.to) {
          return (
            <Link key={item.label} to={item.to} className={`${base} ${c.hover}`}>
              {inner}
            </Link>
          );
        }
        return <div key={item.label} className={base}>{inner}</div>;
      })}
    </div>
  );
}
