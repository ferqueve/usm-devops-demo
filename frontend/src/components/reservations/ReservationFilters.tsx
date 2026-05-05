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
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Filtro por rango de fechas */}
      <div className="flex items-center border rounded-lg p-0.5 bg-gray-50">
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => {
                onFechaInicioChange(undefined);
                onFechaFinChange(undefined);
              }}
              className={`p-1.5 rounded transition-colors ${
                fechaInicio === undefined && fechaFin === undefined
                  ? 'bg-white text-gray-900 shadow-md ring-1 ring-gray-300'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Filter className="h-3.5 w-3.5" />
            </button>
          </TooltipTrigger>
          <TooltipContent>Todas las fechas</TooltipContent>
        </Tooltip>
        <Popover>
          <Tooltip>
            <PopoverTrigger asChild>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  className={`flex items-center gap-1.5 px-1.5 py-1 rounded transition-colors ${
                    fechaInicio === undefined
                      ? 'text-gray-500 hover:text-gray-700'
                      : 'bg-white text-gray-900 shadow-md ring-1 ring-gray-300'
                  }`}
                >
                  <CalendarArrowDown className={`h-3.5 w-3.5 shrink-0 ${fechaInicio === undefined ? 'text-gray-500' : 'text-blue-600'}`} />
                  {fechaInicio && (
                    <span className="text-xs whitespace-nowrap">
                      {format(fechaInicio, "d MMM", { locale: es })}
                    </span>
                  )}
                </button>
              </TooltipTrigger>
            </PopoverTrigger>
            <TooltipContent>
              {fechaInicio ? format(fechaInicio, "PPP", { locale: es }) : 'Fecha inicio'}
            </TooltipContent>
          </Tooltip>
          <PopoverContent className="w-auto p-0" align="start" onClick={(e) => e.stopPropagation()}>
            <CalendarComponent
              mode="single"
              selected={fechaInicio}
              onSelect={(date) => {
                if (date) {
                  onFechaInicioChange(date);
                }
              }}
              disabled={(date) => {
                if (fechaFin) {
                  const fechaFinDate = new Date(fechaFin);
                  fechaFinDate.setHours(23, 59, 59, 999);
                  return date > fechaFinDate;
                }
                return false;
              }}
            />
          </PopoverContent>
        </Popover>
        <span className="mx-1 text-gray-400 text-xs">-</span>
        <Popover>
          <Tooltip>
            <PopoverTrigger asChild>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  className={`flex items-center gap-1.5 px-1.5 py-1 rounded transition-colors ${
                    fechaFin === undefined
                      ? 'text-gray-500 hover:text-gray-700'
                      : 'bg-white text-gray-900 shadow-md ring-1 ring-gray-300'
                  }`}
                >
                  <CalendarArrowUp className={`h-3.5 w-3.5 shrink-0 ${fechaFin === undefined ? 'text-gray-500' : 'text-blue-600'}`} />
                  {fechaFin && (
                    <span className="text-xs whitespace-nowrap">
                      {format(fechaFin, "d MMM", { locale: es })}
                    </span>
                  )}
                </button>
              </TooltipTrigger>
            </PopoverTrigger>
            <TooltipContent>
              {fechaFin ? format(fechaFin, "PPP", { locale: es }) : 'Fecha fin'}
            </TooltipContent>
          </Tooltip>
          <PopoverContent className="w-auto p-0" align="start" onClick={(e) => e.stopPropagation()}>
            <CalendarComponent
              mode="single"
              selected={fechaFin}
              onSelect={(date) => {
                if (date) {
                  onFechaFinChange(date);
                }
              }}
              disabled={(date) => {
                if (fechaInicio) {
                  const fechaInicioDate = new Date(fechaInicio);
                  fechaInicioDate.setHours(0, 0, 0, 0);
                  return date < fechaInicioDate;
                }
                return false;
              }}
            />
          </PopoverContent>
        </Popover>
      </div>
      {/* Filtro por tiempo */}
      <div className="flex items-center border rounded-lg p-0.5 bg-gray-50">
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => onTiempoFilterChange('todas')}
              className={`p-1.5 rounded transition-colors ${tiempoFilter === 'todas'
                  ? 'bg-white text-gray-900 shadow-md ring-1 ring-gray-300'
                  : 'text-gray-500 hover:text-gray-700'
                }`}
            >
              <Filter className="h-3.5 w-3.5" />
            </button>
          </TooltipTrigger>
          <TooltipContent>Todas las reservas</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => onTiempoFilterChange('futuras')}
              className={`p-1.5 rounded transition-colors ${tiempoFilter === 'futuras'
                  ? 'bg-white text-gray-900 shadow-md ring-1 ring-gray-300'
                  : 'text-gray-500 hover:text-gray-700'
                }`}
            >
              <Calendar className={`h-3.5 w-3.5 ${tiempoFilter === 'futuras' ? 'text-blue-600' : 'text-blue-500'}`} />
            </button>
          </TooltipTrigger>
          <TooltipContent>Reservas futuras</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => onTiempoFilterChange('pasadas')}
              className={`p-1.5 rounded transition-colors ${tiempoFilter === 'pasadas'
                  ? 'bg-white text-gray-900 shadow-md ring-1 ring-gray-300'
                  : 'text-gray-500 hover:text-gray-700'
                }`}
            >
              <Clock className={`h-3.5 w-3.5 ${tiempoFilter === 'pasadas' ? 'text-gray-600' : 'text-gray-500'}`} />
            </button>
          </TooltipTrigger>
          <TooltipContent>Reservas pasadas</TooltipContent>
        </Tooltip>
      </div>
      {/* Filtro por estado */}
      {!hideEstadoFilter && (
      <div className="flex items-center border rounded-lg p-0.5 bg-gray-50">
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => onEstadoFilterChange('todas')}
              className={`p-1.5 rounded transition-colors ${estadoFilter === 'todas'
                  ? 'bg-white text-gray-900 shadow-md ring-1 ring-gray-300'
                  : 'text-gray-500 hover:text-gray-700'
                }`}
            >
              <Filter className="h-3.5 w-3.5" />
            </button>
          </TooltipTrigger>
          <TooltipContent>Todos los estados</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => onEstadoFilterChange('APROBADO')}
              className={`p-1.5 rounded transition-colors ${estadoFilter === 'APROBADO'
                  ? 'bg-white text-gray-900 shadow-md ring-1 ring-gray-300'
                  : 'text-gray-500 hover:text-gray-700'
                }`}
            >
              <CheckCircle2 className={`h-3.5 w-3.5 ${estadoFilter === 'APROBADO' ? 'text-green-600' : 'text-green-500'}`} />
            </button>
          </TooltipTrigger>
          <TooltipContent>Reservas aprobadas</TooltipContent>
        </Tooltip>
        {showPendienteFilter && (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => onEstadoFilterChange('PENDIENTE')}
                className={`p-1.5 rounded transition-colors ${estadoFilter === 'PENDIENTE'
                    ? 'bg-white text-gray-900 shadow-md ring-1 ring-gray-300'
                    : 'text-gray-500 hover:text-gray-700'
                  }`}
              >
                <Hourglass className={`h-3.5 w-3.5 ${estadoFilter === 'PENDIENTE' ? 'text-amber-600' : 'text-amber-500'}`} />
              </button>
            </TooltipTrigger>
            <TooltipContent>Reservas pendientes</TooltipContent>
          </Tooltip>
        )}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => onEstadoFilterChange('CANCELADO')}
              className={`p-1.5 rounded transition-colors ${estadoFilter === 'CANCELADO'
                  ? 'bg-white text-gray-900 shadow-md ring-1 ring-gray-300'
                  : 'text-gray-500 hover:text-gray-700'
                }`}
            >
              <XCircle className={`h-3.5 w-3.5 ${estadoFilter === 'CANCELADO' ? 'text-red-600' : 'text-red-500'}`} />
            </button>
          </TooltipTrigger>
          <TooltipContent>Reservas canceladas</TooltipContent>
        </Tooltip>
      </div>
      )}
      {/* Filtro por espacio */}
      <div className="flex items-center border rounded-lg p-0.5 bg-gray-50">
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => onEspacioFilterChange(null)}
              className={`p-1.5 rounded transition-colors ${espacioFilter === null
                  ? 'bg-white text-gray-900 shadow-md ring-1 ring-gray-300'
                  : 'text-gray-500 hover:text-gray-700'
                }`}
            >
              <Filter className="h-3.5 w-3.5" />
            </button>
          </TooltipTrigger>
          <TooltipContent>Todos los espacios</TooltipContent>
        </Tooltip>
        <Popover>
          <Tooltip>
            <PopoverTrigger asChild>
              <TooltipTrigger asChild>
                <button
                  className={`p-1.5 rounded transition-colors ${espacioFilter === null
                      ? 'text-gray-500 hover:text-gray-700'
                      : 'bg-blue-100 text-blue-900 shadow-md ring-1 ring-blue-300'
                    }`}
                >
                  <Building2 className={`h-3.5 w-3.5 ${espacioFilter === null ? 'text-gray-500' : 'text-blue-700'}`} />
                </button>
              </TooltipTrigger>
            </PopoverTrigger>
            <TooltipContent>
              {espacioFilter === null
                ? 'Seleccionar espacio'
                : espaciosUnicos.find(e => e.id === espacioFilter)?.nombre || 'Seleccionar espacio'}
            </TooltipContent>
          </Tooltip>
          <PopoverContent className="w-64 p-2 max-h-[300px] overflow-y-auto" align="start">
            <div className="space-y-1">
              {espaciosUnicos.map((espacio) => (
                <button
                  key={espacio.id}
                  onClick={() => onEspacioFilterChange(espacio.id)}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${espacioFilter === espacio.id
                      ? 'bg-gray-100 text-gray-900 font-medium'
                      : 'text-gray-700 hover:bg-gray-50'
                    }`}
                >
                  {espacio.nombre}
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>
      </div>
      {/* Filtro por tipo de espacio */}
      <div className="flex items-center border rounded-lg p-0.5 bg-gray-50">
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => onTipoEspacioFilterChange(null)}
              className={`p-1.5 rounded transition-colors ${tipoEspacioFilter === null
                  ? 'bg-white text-gray-900 shadow-md ring-1 ring-gray-300'
                  : 'text-gray-500 hover:text-gray-700'
                }`}
            >
              <Filter className="h-3.5 w-3.5" />
            </button>
          </TooltipTrigger>
          <TooltipContent>Todos los tipos</TooltipContent>
        </Tooltip>
        <Popover>
          <Tooltip>
            <PopoverTrigger asChild>
              <TooltipTrigger asChild>
                <button
                  className={`p-1.5 rounded transition-colors ${tipoEspacioFilter === null
                      ? 'text-gray-500 hover:text-gray-700'
                      : 'bg-purple-100 text-purple-900 shadow-md ring-1 ring-purple-300'
                    }`}
                >
                  <Tag className={`h-3.5 w-3.5 ${tipoEspacioFilter === null ? 'text-gray-500' : 'text-purple-700'}`} />
                </button>
              </TooltipTrigger>
            </PopoverTrigger>
            <TooltipContent>
              {tipoEspacioFilter === null
                ? 'Seleccionar tipo de espacio'
                : tiposEspacioUnicos.find(t => t.id === tipoEspacioFilter)?.nombre || 'Seleccionar tipo'}
            </TooltipContent>
          </Tooltip>
          <PopoverContent className="w-64 p-2 max-h-[300px] overflow-y-auto" align="start">
            <div className="space-y-1">
              {tiposEspacioUnicos.map((tipo) => (
                <button
                  key={tipo.id}
                  onClick={() => onTipoEspacioFilterChange(tipo.id)}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors flex items-center gap-2 ${
                    tipoEspacioFilter === tipo.id
                      ? 'bg-gray-100 text-gray-900 font-medium'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {tipo.color && (
                    <div 
                      className="w-3 h-3 rounded-full shrink-0" 
                      style={{ backgroundColor: tipo.color }}
                    />
                  )}
                  <span>{tipo.nombre}</span>
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>
      </div>
      {/* Filtro por carrera */}
      <div className="flex items-center border rounded-lg p-0.5 bg-gray-50">
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => onCarreraFilterChange(null)}
              className={`p-1.5 rounded transition-colors ${carreraFilter === null
                  ? 'bg-white text-gray-900 shadow-md ring-1 ring-gray-300'
                  : 'text-gray-500 hover:text-gray-700'
                }`}
            >
              <Filter className="h-3.5 w-3.5" />
            </button>
          </TooltipTrigger>
          <TooltipContent>Todas las carreras</TooltipContent>
        </Tooltip>
        <Popover>
          <Tooltip>
            <PopoverTrigger asChild>
              <TooltipTrigger asChild>
                <button
                  className={`p-1.5 rounded transition-colors ${carreraFilter === null
                      ? 'text-gray-500 hover:text-gray-700'
                      : 'bg-indigo-100 text-indigo-900 shadow-md ring-1 ring-indigo-300'
                    }`}
                >
                  <GraduationCap className={`h-3.5 w-3.5 ${carreraFilter === null ? 'text-gray-500' : 'text-indigo-700'}`} />
                </button>
              </TooltipTrigger>
            </PopoverTrigger>
            <TooltipContent>
              {carreraFilter === null
                ? 'Seleccionar carrera'
                : carrerasUnicas.find(c => c.id === carreraFilter)?.nombre || 'Seleccionar carrera'}
            </TooltipContent>
          </Tooltip>
          <PopoverContent className="w-64 p-2 max-h-[300px] overflow-y-auto" align="start">
            <div className="space-y-1">
              {carrerasUnicas.map((carrera) => (
                <button
                  key={carrera.id}
                  onClick={() => onCarreraFilterChange(carrera.id)}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                    carreraFilter === carrera.id
                      ? 'bg-gray-100 text-gray-900 font-medium'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex flex-col">
                    <span>{carrera.nombre}</span>
                    {carrera.codigo && (
                      <span className="text-xs text-muted-foreground">{carrera.codigo}</span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>
      </div>
      {/* Botón limpiar filtros */}
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

