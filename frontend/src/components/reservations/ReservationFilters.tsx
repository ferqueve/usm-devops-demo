import { Calendar, Clock, CheckCircle2, XCircle, Hourglass, Filter, BrushCleaning, Building2, CalendarArrowDown, CalendarArrowUp, GraduationCap, Tag } from 'lucide-react';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

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

const ACTIVE_BUTTON_CLASS = 'bg-white text-gray-900 shadow-md ring-1 ring-gray-300';
const INACTIVE_BUTTON_CLASS = 'text-gray-500 hover:text-gray-700';

function getFilterButtonClass(isActive: boolean): string {
  return `p-1.5 rounded transition-colors ${isActive ? ACTIVE_BUTTON_CLASS : INACTIVE_BUTTON_CLASS}`;
}

function getFilterTriggerClass(isActive: boolean): string {
  return `flex items-center gap-1.5 px-1.5 py-1 rounded transition-colors ${
    isActive ? ACTIVE_BUTTON_CLASS : INACTIVE_BUTTON_CLASS
  }`;
}

interface DateRangeFilterProps {
  fechaInicio: Date | undefined;
  fechaFin: Date | undefined;
  onFechaInicioChange: (date: Date | undefined) => void;
  onFechaFinChange: (date: Date | undefined) => void;
}

function DateRangeFilterSection({
  fechaInicio,
  fechaFin,
  onFechaInicioChange,
  onFechaFinChange,
}: Readonly<DateRangeFilterProps>) {
  const allClass = getFilterButtonClass(fechaInicio === undefined && fechaFin === undefined);
  return (
    <div className="flex items-center border rounded-lg p-0.5 bg-gray-50">
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={() => {
              onFechaInicioChange(undefined);
              onFechaFinChange(undefined);
            }}
            className={allClass}
          >
            <Filter className="h-3.5 w-3.5" />
          </button>
        </TooltipTrigger>
        <TooltipContent>Todas las fechas</TooltipContent>
      </Tooltip>
      <DateBoundButton
        value={fechaInicio}
        otherBound={fechaFin}
        otherIsUpperBound
        Icon={CalendarArrowDown}
        tooltipFallback="Fecha inicio"
        onChange={onFechaInicioChange}
      />
      <span className="mx-1 text-gray-400 text-xs">-</span>
      <DateBoundButton
        value={fechaFin}
        otherBound={fechaInicio}
        otherIsUpperBound={false}
        Icon={CalendarArrowUp}
        tooltipFallback="Fecha fin"
        onChange={onFechaFinChange}
      />
    </div>
  );
}

interface DateBoundButtonProps {
  value: Date | undefined;
  otherBound: Date | undefined;
  otherIsUpperBound: boolean;
  Icon: typeof CalendarArrowDown;
  tooltipFallback: string;
  onChange: (date: Date | undefined) => void;
}

function DateBoundButton({
  value,
  otherBound,
  otherIsUpperBound,
  Icon,
  tooltipFallback,
  onChange,
}: Readonly<DateBoundButtonProps>) {
  const isUnset = value === undefined;
  const buttonClass = getFilterTriggerClass(!isUnset);
  const iconClass = `h-3.5 w-3.5 shrink-0 ${isUnset ? 'text-gray-500' : 'text-blue-600'}`;
  const disabledChecker = (date: Date) => {
    if (!otherBound) return false;
    const limit = new Date(otherBound);
    if (otherIsUpperBound) {
      limit.setHours(23, 59, 59, 999);
      return date > limit;
    }
    limit.setHours(0, 0, 0, 0);
    return date < limit;
  };
  return (
    <Popover>
      <Tooltip>
        <PopoverTrigger asChild>
          <TooltipTrigger asChild>
            <button type="button" className={buttonClass}>
              <Icon className={iconClass} />
              {value && (
                <span className="text-xs whitespace-nowrap">
                  {format(value, "d MMM", { locale: es })}
                </span>
              )}
            </button>
          </TooltipTrigger>
        </PopoverTrigger>
        <TooltipContent>
          {value ? format(value, "PPP", { locale: es }) : tooltipFallback}
        </TooltipContent>
      </Tooltip>
      <PopoverContent className="w-auto p-0" align="start" onClick={(e) => e.stopPropagation()}>
        <CalendarComponent
          mode="single"
          selected={value}
          onSelect={(date) => date && onChange(date)}
          disabled={disabledChecker}
        />
      </PopoverContent>
    </Popover>
  );
}

interface TiempoFilterProps {
  tiempoFilter: string;
  onTiempoFilterChange: (filter: string) => void;
}

function TiempoFilterSection({ tiempoFilter, onTiempoFilterChange }: Readonly<TiempoFilterProps>) {
  return (
    <div className="flex items-center border rounded-lg p-0.5 bg-gray-50">
      <Tooltip>
        <TooltipTrigger asChild>
          <button onClick={() => onTiempoFilterChange('todas')} className={getFilterButtonClass(tiempoFilter === 'todas')}>
            <Filter className="h-3.5 w-3.5" />
          </button>
        </TooltipTrigger>
        <TooltipContent>Todas las reservas</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <button onClick={() => onTiempoFilterChange('futuras')} className={getFilterButtonClass(tiempoFilter === 'futuras')}>
            <Calendar className={`h-3.5 w-3.5 ${tiempoFilter === 'futuras' ? 'text-blue-600' : 'text-blue-500'}`} />
          </button>
        </TooltipTrigger>
        <TooltipContent>Reservas futuras</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <button onClick={() => onTiempoFilterChange('pasadas')} className={getFilterButtonClass(tiempoFilter === 'pasadas')}>
            <Clock className={`h-3.5 w-3.5 ${tiempoFilter === 'pasadas' ? 'text-gray-600' : 'text-gray-500'}`} />
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
    <div className="flex items-center border rounded-lg p-0.5 bg-gray-50">
      <Tooltip>
        <TooltipTrigger asChild>
          <button onClick={() => onEstadoFilterChange('todas')} className={getFilterButtonClass(estadoFilter === 'todas')}>
            <Filter className="h-3.5 w-3.5" />
          </button>
        </TooltipTrigger>
        <TooltipContent>Todos los estados</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <button onClick={() => onEstadoFilterChange('APROBADO')} className={getFilterButtonClass(estadoFilter === 'APROBADO')}>
            <CheckCircle2 className={`h-3.5 w-3.5 ${estadoFilter === 'APROBADO' ? 'text-green-600' : 'text-green-500'}`} />
          </button>
        </TooltipTrigger>
        <TooltipContent>Reservas aprobadas</TooltipContent>
      </Tooltip>
      {showPendienteFilter && (
        <Tooltip>
          <TooltipTrigger asChild>
            <button onClick={() => onEstadoFilterChange('PENDIENTE')} className={getFilterButtonClass(estadoFilter === 'PENDIENTE')}>
              <Hourglass className={`h-3.5 w-3.5 ${estadoFilter === 'PENDIENTE' ? 'text-amber-600' : 'text-amber-500'}`} />
            </button>
          </TooltipTrigger>
          <TooltipContent>Reservas pendientes</TooltipContent>
        </Tooltip>
      )}
      <Tooltip>
        <TooltipTrigger asChild>
          <button onClick={() => onEstadoFilterChange('CANCELADO')} className={getFilterButtonClass(estadoFilter === 'CANCELADO')}>
            <XCircle className={`h-3.5 w-3.5 ${estadoFilter === 'CANCELADO' ? 'text-red-600' : 'text-red-500'}`} />
          </button>
        </TooltipTrigger>
        <TooltipContent>Reservas canceladas</TooltipContent>
      </Tooltip>
    </div>
  );
}

interface PopoverFilterItem {
  id: number;
  primary: string;
  secondary?: string;
  swatchColor?: string;
}

interface PopoverFilterProps {
  selectedId: number | null;
  items: PopoverFilterItem[];
  onChange: (id: number | null) => void;
  Icon: typeof CalendarArrowDown;
  tooltipNone: string;
  activeBgClass: string;
  activeTextColorClass: string;
}

function PopoverFilterSection({
  selectedId, items, onChange, Icon, tooltipNone, activeBgClass, activeTextColorClass,
}: Readonly<PopoverFilterProps>) {
  const isAll = selectedId === null;
  const allClass = getFilterButtonClass(isAll);
  const triggerClass = `p-1.5 rounded transition-colors ${
    isAll ? INACTIVE_BUTTON_CLASS : activeBgClass
  }`;
  const iconClass = `h-3.5 w-3.5 ${isAll ? 'text-gray-500' : activeTextColorClass}`;
  const selectedItem = items.find(item => item.id === selectedId);
  return (
    <div className="flex items-center border rounded-lg p-0.5 bg-gray-50">
      <Tooltip>
        <TooltipTrigger asChild>
          <button onClick={() => onChange(null)} className={allClass}>
            <Filter className="h-3.5 w-3.5" />
          </button>
        </TooltipTrigger>
        <TooltipContent>{tooltipNone}</TooltipContent>
      </Tooltip>
      <Popover>
        <Tooltip>
          <PopoverTrigger asChild>
            <TooltipTrigger asChild>
              <button className={triggerClass}>
                <Icon className={iconClass} />
              </button>
            </TooltipTrigger>
          </PopoverTrigger>
          <TooltipContent>
            {selectedItem ? selectedItem.primary : tooltipNone.replace('Todos los ', 'Seleccionar ').replace('Todas las ', 'Seleccionar ')}
          </TooltipContent>
        </Tooltip>
        <PopoverContent className="w-64 p-2 max-h-[300px] overflow-y-auto" align="start">
          <div className="space-y-1">
            {items.map((item) => (
              <button
                key={item.id}
                onClick={() => onChange(item.id)}
                className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors flex items-center gap-2 ${
                  item.id === selectedId
                    ? 'bg-gray-100 text-gray-900 font-medium'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                {item.swatchColor && (
                  <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: item.swatchColor }} />
                )}
                <div className="flex flex-col">
                  <span>{item.primary}</span>
                  {item.secondary && (
                    <span className="text-xs text-muted-foreground">{item.secondary}</span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </PopoverContent>
      </Popover>
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
        activeBgClass="bg-blue-100 text-blue-900 shadow-md ring-1 ring-blue-300"
        activeTextColorClass="text-blue-700"
      />
      <PopoverFilterSection
        selectedId={tipoEspacioFilter}
        items={tipoEspacioItems}
        onChange={onTipoEspacioFilterChange}
        Icon={Tag}
        tooltipNone="Todos los tipos"
        activeBgClass="bg-purple-100 text-purple-900 shadow-md ring-1 ring-purple-300"
        activeTextColorClass="text-purple-700"
      />
      <PopoverFilterSection
        selectedId={carreraFilter}
        items={carreraItems}
        onChange={onCarreraFilterChange}
        Icon={GraduationCap}
        tooltipNone="Todas las carreras"
        activeBgClass="bg-indigo-100 text-indigo-900 shadow-md ring-1 ring-indigo-300"
        activeTextColorClass="text-indigo-700"
      />
      {hayFiltrosActivos && (
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={onClearFilters}
              className="p-1.5 rounded transition-colors bg-red-500 text-white hover:bg-red-600"
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
