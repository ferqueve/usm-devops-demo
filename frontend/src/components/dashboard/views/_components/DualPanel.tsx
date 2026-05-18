import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

interface PanelSide {
  title: string;
  count?: string;
  action?: { label: string; to: string };
  /** Hex de acento institucional UTEC (#184897, #F6CA21, etc.). */
  accentColor?: string;
  body: ReactNode;
}

interface DualPanelProps {
  left: PanelSide;
  right: PanelSide;
  /** Proporción de columnas (default 3/2). */
  ratio?: '1/1' | '3/2' | '2/3';
}

const ratioGrid: Record<NonNullable<DualPanelProps['ratio']>, string> = {
  '1/1': 'lg:grid-cols-2',
  '3/2': 'lg:grid-cols-[3fr_2fr]',
  '2/3': 'lg:grid-cols-[2fr_3fr]',
};

function PanelHeader({ title, count, action, accentColor }: Readonly<PanelSide>) {
  return (
    <div className="flex items-center justify-between gap-3 px-5 py-3 bg-utec-dark text-white">
      <div className="flex items-center gap-2.5 min-w-0">
        <span
          className="w-1 h-4 rounded-sm shrink-0"
          style={{ backgroundColor: accentColor ?? '#F6CA21' }}
          aria-hidden
        />
        <h2 className="text-sm font-semibold tracking-tight">{title}</h2>
        {count && (
          <span className="text-xs text-white/60 tabular-nums truncate">{count}</span>
        )}
      </div>
      {action && (
        <Link
          to={action.to}
          className="inline-flex items-center gap-0.5 text-xs font-medium text-white/80 hover:text-white bg-white/10 hover:bg-white/20 px-2 py-1 rounded-md transition-colors shrink-0"
        >
          {action.label}
          <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      )}
    </div>
  );
}

/**
 * Panel doble unificado: dos listas lado a lado dentro de un mismo card,
 * separadas por un divider vertical. Header oscuro usando el color
 * institucional UTEC del sidebar/topbar.
 */
export function DualPanel({ left, right, ratio = '3/2' }: Readonly<DualPanelProps>) {
  return (
    <div className={`grid ${ratioGrid[ratio]} rounded-xl border bg-card overflow-hidden divide-y lg:divide-y-0 lg:divide-x divide-border`}>
      <div className="min-w-0">
        <PanelHeader {...left} />
        <div className="p-3">{left.body}</div>
      </div>
      <div className="min-w-0">
        <PanelHeader {...right} />
        <div className="p-3">{right.body}</div>
      </div>
    </div>
  );
}
