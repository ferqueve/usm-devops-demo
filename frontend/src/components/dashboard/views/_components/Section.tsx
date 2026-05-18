import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

interface SectionProps {
  /** Label corto en mayúsculas tracking-wide (estilo etiqueta, no título). */
  title: string;
  /** Conteo o detalle inline al lado del título. */
  count?: string | number;
  /** Link de acción a la derecha con apariencia de botón sutil. */
  action?: { label: string; to: string };
  children: ReactNode;
  className?: string;
}

export function Section({ title, count, action, children, className }: Readonly<SectionProps>) {
  return (
    <section className={className}>
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-baseline gap-2 min-w-0">
          <h2 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            {title}
          </h2>
          {count !== undefined && (
            <span className="text-[11px] text-muted-foreground tabular-nums">{count}</span>
          )}
        </div>
        {action && (
          <Link
            to={action.to}
            className="inline-flex items-center gap-0.5 text-xs font-medium text-foreground/80 hover:text-foreground bg-muted/40 hover:bg-muted px-2 py-1 rounded-md transition-colors"
          >
            {action.label}
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}
