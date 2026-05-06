import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/Button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { CalendarIcon, Filter, X } from 'lucide-react';
import { cn } from '@/lib/utils/helpers';
import type { AuditLogFilters, AuditLogAccion } from '@/lib/types/audit';

interface AuditFiltersProps {
  filters: AuditLogFilters;
  onFiltersChange: (filters: AuditLogFilters) => void;
  onClearFilters: () => void;
  showFilters: boolean;
  onToggleFilters: () => void;
}

// Entidades disponibles en el sistema
const ENTIDADES = [
  'Usuario',
  'Reserva',
  'Espacio',
  'InventarioItem',
  'Carrera',
  'TipoEspacio',
  'TipoElemento',
  'ReservaItemSolicitado'
];

const ACCIONES: { value: AuditLogAccion; label: string }[] = [
  { value: 'CREATE', label: 'Crear' },
  { value: 'UPDATE', label: 'Actualizar' },
  { value: 'DELETE', label: 'Eliminar' }
];

export default function AuditFilters({
  filters,
  onFiltersChange,
  onClearFilters,
  showFilters,
  onToggleFilters
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
      [key]: value || undefined
    });
  };

  return (
    <Card className="shadow-card">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Filtros de Auditoría</CardTitle>
          <div className="flex items-center gap-2">
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClearFilters}
                className="h-8 text-xs"
              >
                <X className="h-3 w-3 mr-1" />
                Limpiar
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={onToggleFilters}
              className={cn(
                "h-8 transition-all duration-200",
                showFilters && "bg-blue-50 border-blue-200 text-blue-700"
              )}
            >
              <Filter className={cn(
                "h-3 w-3 mr-1 transition-transform duration-200",
                showFilters && "rotate-180"
              )} />
              {showFilters ? 'Ocultar' : 'Mostrar'}
            </Button>
          </div>
        </div>
      </CardHeader>
      
      {showFilters && (
        <CardContent className="space-y-4">
          {/* Búsqueda general */}
          <div>
            <Label htmlFor="search">Búsqueda</Label>
            <Input
              id="search"
              placeholder="Buscar por entidad, usuario, email..."
              value={filters.search || ''}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="mt-1"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Filtro por entidad */}
            <div>
              <Label htmlFor="entidad">Entidad</Label>
              <Select
                value={filters.entidad || 'all'}
                onValueChange={(value) => handleFilterChange('entidad', value === 'all' ? undefined : value)}
              >
                <SelectTrigger id="entidad" className="mt-1">
                  <SelectValue placeholder="Todas las entidades" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las entidades</SelectItem>
                  {ENTIDADES.map(entidad => (
                    <SelectItem key={entidad} value={entidad}>
                      {entidad}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Filtro por acción */}
            <div>
              <Label htmlFor="accion">Acción</Label>
              <Select
                value={filters.accion || 'all'}
                onValueChange={(value) => handleFilterChange('accion', value === 'all' ? undefined : value as AuditLogAccion)}
              >
                <SelectTrigger id="accion" className="mt-1">
                  <SelectValue placeholder="Todas las acciones" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las acciones</SelectItem>
                  {ACCIONES.map(accion => (
                    <SelectItem key={accion.value} value={accion.value}>
                      {accion.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Filtro por usuario ID */}
            <div>
              <Label htmlFor="usuarioId">ID Usuario</Label>
              <Input
                id="usuarioId"
                type="number"
                placeholder="Filtrar por ID de usuario"
                value={filters.usuarioId || ''}
                onChange={(e) => handleFilterChange('usuarioId', e.target.value ? Number.parseInt(e.target.value) : undefined)}
                className="mt-1"
              />
            </div>

            {/* Filtro por fecha desde */}
            <div>
              <Label>Fecha Desde</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full mt-1 justify-start text-left font-normal",
                      !filters.fechaDesde && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filters.fechaDesde ? (
                      format(new Date(filters.fechaDesde), "PPP", { locale: es })
                    ) : (
                      <span>Seleccionar fecha</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={filters.fechaDesde ? new Date(filters.fechaDesde) : undefined}
                    onSelect={(date) => handleFilterChange('fechaDesde', date ? date.toISOString() : undefined)}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Filtro por fecha hasta */}
            <div>
              <Label>Fecha Hasta</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full mt-1 justify-start text-left font-normal",
                      !filters.fechaHasta && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filters.fechaHasta ? (
                      format(new Date(filters.fechaHasta), "PPP", { locale: es })
                    ) : (
                      <span>Seleccionar fecha</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={filters.fechaHasta ? new Date(filters.fechaHasta) : undefined}
                    onSelect={(date) => handleFilterChange('fechaHasta', date ? date.toISOString() : undefined)}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}

