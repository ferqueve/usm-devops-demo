import { Input } from "@/components/ui/input";
import { Box, Activity, Hash, Search } from 'lucide-react';
import {
  PopoverFilterSection,
  DateRangeFilterSection,
  ClearFiltersButton,
} from '@/components/ui/compact-filter';
import type { AuditLogFilters, AuditLogAccion } from '@/lib/types/audit';

interface AuditFiltersProps {
  filters: AuditLogFilters;
  onFiltersChange: (filters: AuditLogFilters) => void;
  onClearFilters: () => void;
}

const ENTIDADES = [
  'Usuario',
  'Reserva',
  'Espacio',
  'InventarioItem',
  'Carrera',
  'TipoEspacio',
  'TipoElemento',
  'ReservaItemSolicitado',
  'Autenticacion',
];

const ACCIONES: { value: AuditLogAccion; label: string }[] = [
  { value: 'CREATE', label: 'Crear' },
  { value: 'UPDATE', label: 'Actualizar' },
  { value: 'DELETE', label: 'Eliminar' },
];

export default function AuditFilters({
  filters,
  onFiltersChange,
  onClearFilters,
}: Readonly<AuditFiltersProps>) {
  const hasActiveFilters = Boolean(
    filters.entidad ||
    filters.usuarioId ||
    filters.accion ||
    filters.fechaDesde ||
    filters.fechaHasta ||
    filters.search
  );

  const handleFilterChange = (
    key: keyof AuditLogFilters,
    value: string | number | Date | undefined
  ) => {
    onFiltersChange({
      ...filters,
      [key]: value || undefined,
    });
  };

  return (
    <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center py-2">
      <div className="flex-1 relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Buscar por entidad, usuario, email..."
          value={filters.search || ''}
          onChange={(e) => handleFilterChange('search', e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <PopoverFilterSection<string>
          selectedId={filters.entidad ?? null}
          items={ENTIDADES.map(e => ({ id: e, primary: e }))}
          onChange={(v) => handleFilterChange('entidad', v ?? undefined)}
          Icon={Box}
          tooltipNone="Todas las entidades"
          activeBgClass="bg-info-suave text-info-texto shadow-md ring-1 ring-info-borde"
          activeTextColorClass="text-info-texto"
        />
        <PopoverFilterSection<string>
          selectedId={filters.accion ?? null}
          items={ACCIONES.map(a => ({ id: a.value, primary: a.label }))}
          onChange={(v) =>
            handleFilterChange('accion', (v as AuditLogAccion | null) ?? undefined)
          }
          Icon={Activity}
          tooltipNone="Todas las acciones"
          activeBgClass="bg-acento-suave text-acento-texto shadow-md ring-1 ring-acento-borde"
          activeTextColorClass="text-acento-texto"
        />
        <div className="flex items-center border rounded-lg p-0.5 bg-muted h-9">
          <div className="px-2 text-muted-foreground">
            <Hash className="h-3.5 w-3.5" />
          </div>
          <Input
            type="number"
            placeholder="ID Usuario"
            value={filters.usuarioId ?? ''}
            onChange={(e) =>
              handleFilterChange(
                'usuarioId',
                e.target.value ? Number.parseInt(e.target.value) : undefined
              )
            }
            className="h-7 w-24 border-0 bg-transparent shadow-none focus-visible:ring-0 px-1 text-sm"
          />
        </div>
        <DateRangeFilterSection
          fechaInicio={filters.fechaDesde ? new Date(filters.fechaDesde) : undefined}
          fechaFin={filters.fechaHasta ? new Date(filters.fechaHasta) : undefined}
          onFechaInicioChange={(d) =>
            handleFilterChange('fechaDesde', d ? d.toISOString() : undefined)
          }
          onFechaFinChange={(d) =>
            handleFilterChange('fechaHasta', d ? d.toISOString() : undefined)
          }
        />
        <ClearFiltersButton visible={hasActiveFilters} onClear={onClearFilters} />
      </div>
    </div>
  );
}
