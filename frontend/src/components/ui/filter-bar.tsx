import { cn } from '@/lib/utils/helpers';
import { X } from 'lucide-react';
import { Badge } from './badge';
import { Button } from './Button';

export interface FilterItem {
  id: string;
  label: string;
  value: any;
  onRemove: () => void;
}

interface FilterBarProps {
  filters: FilterItem[];
  onClearAll?: () => void;
  className?: string;
}

/**
 * FilterBar component - Barra compacta para mostrar filtros activos
 */
export function FilterBar({ filters, onClearAll, className }: Readonly<FilterBarProps>) {
  if (filters.length === 0) return null;

  return (
    <div className={cn('flex items-center gap-2 flex-wrap p-3 bg-gray-50 rounded-lg border border-gray-200', className)}>
      <span className="text-sm font-medium text-muted-foreground">Filtros activos:</span>
      
      <div className="flex items-center gap-2 flex-wrap flex-1">
        {filters.map((filter) => (
          <Badge
            key={filter.id}
            variant="secondary"
            className="pl-3 pr-2 py-1 gap-1.5 hover:bg-gray-200 transition-colors"
          >
            <span className="text-xs font-medium">{filter.label}</span>
            <button
              onClick={filter.onRemove}
              className="ml-1 hover:bg-gray-300 rounded-full p-0.5 transition-colors"
              aria-label={`Quitar filtro ${filter.label}`}
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
      </div>

      {onClearAll && filters.length > 1 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearAll}
          className="text-xs h-7 px-2"
        >
          Limpiar todo
        </Button>
      )}
    </div>
  );
}

