import type { InventarioItem } from '@/lib/types/spaces';

interface EspacioCellProps {
  item: Pick<InventarioItem, 'espacioId' | 'espacioNombre' | 'espacioColor'>;
  /** Visual variant: "table" uses smaller text, "card" uses font-medium label. */
  variant?: 'table' | 'card';
}

/**
 * Shared rendering of the espacio assigned to an inventory item.
 * Handles three cases: unassigned, assigned with color, and assigned without color.
 */
export function EspacioCell({ item, variant = 'table' }: Readonly<EspacioCellProps>) {
  if (!item.espacioId || !item.espacioNombre) {
    if (variant === 'card') {
      return <span className="font-medium text-muted-foreground">Sin asignar</span>;
    }
    return <span className="text-muted-foreground">Sin asignar</span>;
  }

  if (item.espacioColor) {
    return (
      <span
        className="inline-block px-2 py-0.5 rounded text-white text-xs font-medium"
        style={{ backgroundColor: item.espacioColor }}
      >
        {item.espacioNombre}
      </span>
    );
  }

  if (variant === 'card') {
    return <span className="font-medium">{item.espacioNombre}</span>;
  }
  return <span className="text-sm">{item.espacioNombre}</span>;
}
