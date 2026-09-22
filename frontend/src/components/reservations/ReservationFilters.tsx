import { Calendar, Clock, CheckCircle2, XCircle, Hourglass, Filter, BrushCleaning, Building2, GraduationCap, Tag } from 'lucide-react';
import {
  compactFilterButtonClass,
  DateRangeFilterSection,
  PopoverFilterSection,
  type PopoverFilterItem,
} from '@/components/ui/compact-filter';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface Espacio {
  id: number;
  nombre: string;
}

interface Carrera {
  id: number;
  nombre: string;
  codigo?: string;
}

interface TipoEspacio {
  id: number;
  nombre: string;
  color?: string;
}



interface TiempoFilterProps {
  tiempoFilter: string;
  onTiempoFilterChange: (filter: string) => void;
}

function TiempoFilterSection({ tiempoFilter, onTiempoFilterChange }: Readonly<TiempoFilterProps>) {
  return (
    <div className="flex items-center border rounded-lg p-0.5 bg-muted">
      <Tooltip>
        <TooltipTrigger asChild>
          <button onClick={() => onTiempoFilterChange('todas')} aria-label="Todas las reservas" aria-pressed={tiempoFilter === 'todas'} className={compactFilterButtonClass(tiempoFilter === 'todas')}>
            <Filter className="h-3.5 w-3.5" />
          </button>
        </TooltipTrigger>
        <TooltipContent>Todas las reservas</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <button onClick={() => onTiempoFilterChange('futuras')} aria-label="Reservas futuras" aria-pressed={tiempoFilter === 'futuras'} className={compactFilterButtonClass(tiempoFilter === 'futuras')}>
            <Calendar className={`h-3.5 w-3.5 ${tiempoFilter === 'futuras' ? 'text-info-texto' : 'text-info'}`} />
          </button>
        </TooltipTrigger>
        <TooltipContent>Reservas futuras</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <button onClick={() => onTiempoFilterChange('pasadas')} aria-label="Reservas pasadas" aria-pressed={tiempoFilter === 'pasadas'} className={compactFilterButtonClass(tiempoFilter === 'pasadas')}>
            <Clock className={`h-3.5 w-3.5 ${tiempoFilter === 'pasadas' ? 'text-muted-foreground' : 'text-muted-foreground'}`} />
          </button>
        </TooltipTrigger>
        <TooltipContent>Reservas pasadas</TooltipContent>
      </Tooltip>
    </div>
  );
}

interface EstadoFilterProps {
  estadoFilter: string;
  showPendienteFilter: boolean;
  onEstadoFilterChange: (filter: string) => void;
}

function EstadoFilterSection({ estadoFilter, showPendienteFilter, onEstadoFilterChange }: Readonly<EstadoFilterProps>) {
  return (
    <div className="flex items-center border rounded-lg p-0.5 bg-muted">
      <Tooltip>
        <TooltipTrigger asChild>
          <button onClick={() => onEstadoFilterChange('todas')} aria-label="Todos los estados" aria-pressed={estadoFilter === 'todas'} className={compactFilterButtonClass(estadoFilter === 'todas')}>
            <Filter className="h-3.5 w-3.5" />
          </button>
        </TooltipTrigger>
        <TooltipContent>Todos los estados</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <button onClick={() => onEstadoFilterChange('APROBADO')} aria-label="Reservas aprobadas" aria-pressed={estadoFilter === 'APROBADO'} className={compactFilterButtonClass(estadoFilter === 'APROBADO')}>
            <CheckCircle2 className={`h-3.5 w-3.5 ${estadoFilter === 'APROBADO' ? 'text-success-texto' : 'text-success'}`} />
          </button>
        </TooltipTrigger>
        <TooltipContent>Reservas aprobadas</TooltipContent>
      </Tooltip>
      {showPendienteFilter && (
        <Tooltip>
          <TooltipTrigger asChild>
            <button onClick={() => onEstadoFilterChange('PENDIENTE')} aria-label="Reservas pendientes" aria-pressed={estadoFilter === 'PENDIENTE'} className={compactFilterButtonClass(estadoFilter === 'PENDIENTE')}>
              <Hourglass className={`h-3.5 w-3.5 ${estadoFilter === 'PENDIENTE' ? 'text-warning-texto' : 'text-warning'}`} />
            </button>
          </TooltipTrigger>
          <TooltipContent>Reservas pendientes</TooltipContent>
        </Tooltip>
      )}
      <Tooltip>
        <TooltipTrigger asChild>
          <button onClick={() => onEstadoFilterChange('CANCELADO')} aria-label="Reservas canceladas" aria-pressed={estadoFilter === 'CANCELADO'} className={compactFilterButtonClass(estadoFilter === 'CANCELADO')}>
            <XCircle className={`h-3.5 w-3.5 ${estadoFilter === 'CANCELADO' ? 'text-danger-texto' : 'text-danger'}`} />
          </button>
        </TooltipTrigger>
        <TooltipContent>Reservas canceladas</TooltipContent>
      </Tooltip>
    </div>
  );
}


interface ReservationFiltersProps {
  tiempoFilter: string;
  estadoFilter: string;
  espacioFilter: number | null;
  carreraFilter: number | null;
  tipoEspacioFilter: number | null;
  fechaInicio: Date | undefined;
  fechaFin: Date | undefined;
  espaciosUnicos: Espacio[];
  carrerasUnicas: Carrera[];
  tiposEspacioUnicos: TipoEspacio[];
  hayFiltrosActivos: boolean;
  showPendienteFilter?: boolean; // Solo para docentes/externos
  hideEstadoFilter?: boolean; // Ocultar completamente el filtro de estado
  onTiempoFilterChange: (filter: string) => void;
  onEstadoFilterChange: (filter: string) => void;
  onEspacioFilterChange: (filter: number | null) => void;
  onCarreraFilterChange: (filter: number | null) => void;
  onTipoEspacioFilterChange: (filter: number | null) => void;
  onFechaInicioChange: (date: Date | undefined) => void;
  onFechaFinChange: (date: Date | undefined) => void;
  onClearFilters: () => void;
}

export default function ReservationFilters({
  tiempoFilter,
  estadoFilter,
  espacioFilter,
  carreraFilter,
  tipoEspacioFilter,
  fechaInicio,
  fechaFin,
  espaciosUnicos,
  carrerasUnicas,
  tiposEspacioUnicos,
  hayFiltrosActivos,
  showPendienteFilter = false,
  hideEstadoFilter = false,
  onTiempoFilterChange,
  onEstadoFilterChange,
  onEspacioFilterChange,
  onCarreraFilterChange,
  onTipoEspacioFilterChange,
  onFechaInicioChange,
  onFechaFinChange,
  onClearFilters,
}: Readonly<ReservationFiltersProps>) {
  const espacioItems: PopoverFilterItem[] = espaciosUnicos.map(e => ({ id: e.id, primary: e.nombre }));
  const tipoEspacioItems: PopoverFilterItem[] = tiposEspacioUnicos.map(t => ({
    id: t.id,
    primary: t.nombre,
    swatchColor: t.color,
  }));
  const carreraItems: PopoverFilterItem[] = carrerasUnicas.map(c => ({
    id: c.id,
    primary: c.nombre,
    secondary: c.codigo,
  }));

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <DateRangeFilterSection
        fechaInicio={fechaInicio}
        fechaFin={fechaFin}
        onFechaInicioChange={onFechaInicioChange}
        onFechaFinChange={onFechaFinChange}
      />
      <TiempoFilterSection tiempoFilter={tiempoFilter} onTiempoFilterChange={onTiempoFilterChange} />
      {!hideEstadoFilter && (
        <EstadoFilterSection
          estadoFilter={estadoFilter}
          showPendienteFilter={showPendienteFilter}
          onEstadoFilterChange={onEstadoFilterChange}
        />
      )}
      <PopoverFilterSection
        selectedId={espacioFilter}
        items={espacioItems}
        onChange={onEspacioFilterChange}
        Icon={Building2}
        tooltipNone="Todos los espacios"
        activeBgClass="bg-info-suave text-info-texto shadow-md ring-1 ring-info-borde"
        activeTextColorClass="text-info-texto"
      />
      <PopoverFilterSection
        selectedId={tipoEspacioFilter}
        items={tipoEspacioItems}
        onChange={onTipoEspacioFilterChange}
        Icon={Tag}
        tooltipNone="Todos los tipos"
        activeBgClass="bg-acento-suave text-acento-texto shadow-md ring-1 ring-acento-borde"
        activeTextColorClass="text-acento-texto"
      />
      <PopoverFilterSection
        selectedId={carreraFilter}
        items={carreraItems}
        onChange={onCarreraFilterChange}
        Icon={GraduationCap}
        tooltipNone="Todas las carreras"
        activeBgClass="bg-info-suave text-info-texto shadow-md ring-1 ring-info-borde"
        activeTextColorClass="text-info-texto"
      />
      {hayFiltrosActivos && (
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={onClearFilters}
              aria-label="Limpiar filtros"
              className="p-1.5 rounded transition-colors bg-danger text-white hover:bg-danger"
            >
              <BrushCleaning className="h-3.5 w-3.5" />
            </button>
          </TooltipTrigger>
          <TooltipContent>Limpiar filtros</TooltipContent>
        </Tooltip>
      )}
    </div>
  );
}
