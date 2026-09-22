"use client";

import type { ElementType } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  BrushCleaning,
  Building2,
  CalendarArrowDown,
  CalendarArrowUp,
  Filter,
  Hourglass,
  PackageCheck,
  CheckCircle2,
  Search,
  X,
  XCircle,
  ListFilter,
  LayoutGrid,
  Table as TableIcon,
} from "lucide-react";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils/helpers";
import type {
  Espacio,
  ReservaItemSolicitadoEstado,
} from "@/lib/types/spaces";

const estadoConfig: Record<
  ReservaItemSolicitadoEstado,
  {
    label: string;
    icon: ElementType;
    activeClass: string;
    inactiveClass: string;
  }
> = {
  PENDIENTE: {
    label: "Pendiente",
    icon: Hourglass,
    activeClass: "text-warning-texto",
    inactiveClass: "text-warning",
  },
  APROBADO: {
    label: "Aprobado",
    icon: CheckCircle2,
    activeClass: "text-success-texto",
    inactiveClass: "text-success",
  },
  ENTREGADO: {
    label: "Entregado",
    icon: PackageCheck,
    activeClass: "text-info-texto",
    inactiveClass: "text-info",
  },
  RECHAZADO: {
    label: "Rechazado",
    icon: XCircle,
    activeClass: "text-danger-texto",
    inactiveClass: "text-danger",
  },
};

interface InventoryRequestFiltersProps {
  searchValue: string;
  activeSearch: string;
  onSearchChange: (value: string) => void;
  onSearchClear: () => void;
  selectedEstados: ReservaItemSolicitadoEstado[];
  onToggleEstado: (estado: ReservaItemSolicitadoEstado) => void;
  onClearEstados: () => void;
  espacios: Espacio[];
  selectedEspacio: number | null;
  onEspacioChange: (espacioId: number | null) => void;
  fechaDesde?: Date;
  fechaHasta?: Date;
  onFechaDesdeChange: (date: Date | undefined) => void;
  onFechaHastaChange: (date: Date | undefined) => void;
  onResetFechas: () => void;
  pageSize: number;
  onPageSizeChange: (size: number) => void;
  hasFilters: boolean;
  onClearFilters: () => void;
  viewMode: 'table' | 'cards';
  onViewModeChange: (mode: 'table' | 'cards') => void;
}

const highlightClass =
  "bg-card text-foreground shadow-md ring-1 ring-border hover:text-foreground";
const defaultButtonClass =
  "text-muted-foreground hover:text-foreground/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-info/40";

const formatShortDate = (date?: Date) =>
  date ? format(date, "d MMM", { locale: es }) : "";

interface SearchInputProps {
  searchValue: string;
  activeSearch: string;
  onSearchChange: (value: string) => void;
  onSearchClear: () => void;
}

function SearchInput({ searchValue, activeSearch, onSearchChange, onSearchClear }: Readonly<SearchInputProps>) {
  const wrapperClass = cn(
    "flex items-center gap-1.5 rounded-md bg-card px-1.5 py-1 transition-colors shadow-xs",
    activeSearch ? "ring-1 ring-info/40" : ""
  );
  const iconClass = cn("h-3.5 w-3.5 shrink-0", activeSearch ? "text-info-texto" : "text-muted-foreground");
  return (
    <div className="flex items-center rounded-lg border bg-muted p-0.5">
      <div className={wrapperClass}>
        <Search className={iconClass} />
        <Input
          value={searchValue}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Buscar por solicitante, correo, tipo o ID..."
          className="h-[20px] border-0 bg-transparent px-0 text-sm shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
        />
        {searchValue && (
          <button
            type="button"
            onClick={onSearchClear}
            className="rounded-full p-1 text-muted-foreground transition hover:bg-muted hover:text-muted-foreground"
            aria-label="Limpiar búsqueda"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}

interface DateButtonProps {
  date?: Date;
  otherDate?: Date;
  isStart: boolean;
  onChange: (date: Date | undefined) => void;
  Icon: ElementType;
  tooltipFallback: string;
}

function DateRangeButton({ date, otherDate, isStart, onChange, Icon, tooltipFallback }: Readonly<DateButtonProps>) {
  const buttonClass = cn(
    "flex items-center gap-1.5 rounded px-1.5 py-1 text-xs transition-colors",
    date ? highlightClass : defaultButtonClass
  );
  const iconClass = cn("h-3.5 w-3.5 shrink-0", date ? "text-info-texto" : "text-muted-foreground");
  const disabledChecker = (candidate: Date) => {
    if (!otherDate) return false;
    const limit = new Date(otherDate);
    if (isStart) {
      limit.setHours(23, 59, 59, 999);
      return candidate > limit;
    }
    limit.setHours(0, 0, 0, 0);
    return candidate < limit;
  };
  return (
    <Popover>
      <Tooltip>
        <PopoverTrigger asChild>
          <TooltipTrigger asChild>
            <button type="button" aria-label={tooltipFallback} className={buttonClass}>
              <Icon className={iconClass} />
              {date && <span className="text-2xs">{formatShortDate(date)}</span>}
            </button>
          </TooltipTrigger>
        </PopoverTrigger>
        <TooltipContent>
          {date ? format(date, "PPP", { locale: es }) : tooltipFallback}
        </TooltipContent>
      </Tooltip>
      <PopoverContent className="w-auto p-0" align="start" onClick={(e) => e.stopPropagation()}>
        <CalendarComponent
          mode="single"
          selected={date}
          onSelect={(d) => onChange(d ?? undefined)}
          disabled={disabledChecker}
        />
      </PopoverContent>
    </Popover>
  );
}

interface DateRangeFilterProps {
  fechaDesde?: Date;
  fechaHasta?: Date;
  onFechaDesdeChange: (date: Date | undefined) => void;
  onFechaHastaChange: (date: Date | undefined) => void;
  onResetFechas: () => void;
}

function DateRangeFilter({
  fechaDesde,
  fechaHasta,
  onFechaDesdeChange,
  onFechaHastaChange,
  onResetFechas,
}: Readonly<DateRangeFilterProps>) {
  const resetClass = cn(
    "p-1.5 rounded transition-colors",
    !fechaDesde && !fechaHasta ? highlightClass : defaultButtonClass
  );
  return (
    <div className="flex items-center rounded-lg border bg-muted p-0.5">
      <Tooltip>
        <TooltipTrigger asChild>
          <button type="button" onClick={onResetFechas} aria-label="Todas las fechas" className={resetClass}>
            <Filter className="h-3.5 w-3.5" />
          </button>
        </TooltipTrigger>
        <TooltipContent>Todas las fechas</TooltipContent>
      </Tooltip>
      <DateRangeButton
        date={fechaDesde}
        otherDate={fechaHasta}
        isStart
        onChange={onFechaDesdeChange}
        Icon={CalendarArrowDown}
        tooltipFallback="Fecha desde"
      />
      <span className="mx-1 text-xs text-muted-foreground">-</span>
      <DateRangeButton
        date={fechaHasta}
        otherDate={fechaDesde}
        isStart={false}
        onChange={onFechaHastaChange}
        Icon={CalendarArrowUp}
        tooltipFallback="Fecha hasta"
      />
    </div>
  );
}

interface EstadoFilterProps {
  selectedEstados: ReservaItemSolicitadoEstado[];
  onToggleEstado: (estado: ReservaItemSolicitadoEstado) => void;
  onClearEstados: () => void;
}

function EstadoFilter({ selectedEstados, onToggleEstado, onClearEstados }: Readonly<EstadoFilterProps>) {
  const clearClass = cn(
    "p-1.5 rounded transition-colors",
    selectedEstados.length === 0 ? highlightClass : defaultButtonClass
  );
  const entries = Object.entries(estadoConfig) as Array<
    [ReservaItemSolicitadoEstado, (typeof estadoConfig)[ReservaItemSolicitadoEstado]]
  >;
  return (
    <div className="flex items-center rounded-lg border bg-muted p-0.5">
      <Tooltip>
        <TooltipTrigger asChild>
          <button type="button" onClick={onClearEstados} aria-label="Todos los estados" className={clearClass}>
            <Filter className="h-3.5 w-3.5" />
          </button>
        </TooltipTrigger>
        <TooltipContent>Todos los estados</TooltipContent>
      </Tooltip>
      {entries.map(([estado, config]) => {
        const Icon = config.icon;
        const active = selectedEstados.includes(estado);
        const buttonClass = cn(
          "p-1.5 rounded transition-colors",
          active ? highlightClass : defaultButtonClass
        );
        const iconClass = cn("h-3.5 w-3.5", active ? config.activeClass : config.inactiveClass);
        return (
          <Tooltip key={estado}>
            <TooltipTrigger asChild>
              <button type="button" onClick={() => onToggleEstado(estado)} aria-label={config.label} aria-pressed={active} className={buttonClass}>
                <Icon className={iconClass} />
              </button>
            </TooltipTrigger>
            <TooltipContent>{config.label}</TooltipContent>
          </Tooltip>
        );
      })}
    </div>
  );
}

interface EspacioFilterProps {
  espacios: Espacio[];
  selectedEspacio: number | null;
  onEspacioChange: (espacioId: number | null) => void;
}

function EspacioFilter({ espacios, selectedEspacio, onEspacioChange }: Readonly<EspacioFilterProps>) {
  const isAll = selectedEspacio === null;
  const allClass = cn(
    "p-1.5 rounded transition-colors",
    isAll ? highlightClass : defaultButtonClass
  );
  const triggerClass = cn(
    "flex items-center gap-1.5 rounded px-1.5 py-1 text-xs transition-colors",
    isAll ? defaultButtonClass : "bg-info-suave text-info-texto shadow-md ring-1 ring-info-borde"
  );
  const iconClass = cn("h-3.5 w-3.5", isAll ? "text-muted-foreground" : "text-info-texto");
  const selectedNombre = isAll
    ? null
    : espacios.find((espacio) => espacio.id === selectedEspacio)?.nombre ?? "Espacio seleccionado";
  const tooltipText = isAll ? "Seleccionar espacio" : selectedNombre ?? "Seleccionar espacio";
  return (
    <div className="flex items-center rounded-lg border bg-muted p-0.5">
      <Tooltip>
        <TooltipTrigger asChild>
          <button type="button" onClick={() => onEspacioChange(null)} aria-label="Todos los espacios" className={allClass}>
            <Filter className="h-3.5 w-3.5" />
          </button>
        </TooltipTrigger>
        <TooltipContent>Todos los espacios</TooltipContent>
      </Tooltip>
      <Popover>
        <Tooltip>
          <PopoverTrigger asChild>
            <TooltipTrigger asChild>
              <button type="button" aria-label={tooltipText} className={triggerClass}>
                <Building2 className={iconClass} />
                {selectedNombre && (
                  <span className="max-w-[140px] truncate text-2xs">{selectedNombre}</span>
                )}
              </button>
            </TooltipTrigger>
          </PopoverTrigger>
          <TooltipContent>{tooltipText}</TooltipContent>
        </Tooltip>
        <PopoverContent className="w-64 max-h-[280px] overflow-y-auto p-2" align="start">
          {espacios.length > 0 ? (
            <div className="space-y-1">
              {espacios.map((espacio) => {
                const itemClass = cn(
                  "w-full rounded-md px-3 py-2 text-left text-sm transition-colors",
                  espacio.id === selectedEspacio
                    ? "bg-muted text-foreground font-medium"
                    : "text-foreground/80 hover:bg-muted"
                );
                return (
                  <button
                    key={espacio.id}
                    type="button"
                    onClick={() => onEspacioChange(espacio.id)}
                    className={itemClass}
                  >
                    {espacio.nombre}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="flex items-center justify-center rounded-md border border-dashed border-border px-3 py-6 text-center text-xs text-muted-foreground">
              No hay espacios disponibles.
            </div>
          )}
        </PopoverContent>
      </Popover>
    </div>
  );
}

interface ViewModeToggleProps {
  viewMode: 'table' | 'cards';
  onViewModeChange: (mode: 'table' | 'cards') => void;
}

function ViewModeToggle({ viewMode, onViewModeChange }: Readonly<ViewModeToggleProps>) {
  const cardsClass = cn(
    "p-1.5 rounded transition-colors",
    viewMode === 'cards' ? highlightClass : defaultButtonClass
  );
  const tableClass = cn(
    "p-1.5 rounded transition-colors",
    viewMode === 'table' ? highlightClass : defaultButtonClass
  );
  return (
    <div className="flex items-center rounded-lg border bg-muted p-0.5">
      <Tooltip>
        <TooltipTrigger asChild>
          <button type="button" onClick={() => onViewModeChange('cards')} aria-label="Vista de tarjetas" aria-pressed={viewMode === 'cards'} className={cardsClass}>
            <LayoutGrid className="h-3.5 w-3.5" />
          </button>
        </TooltipTrigger>
        <TooltipContent>Vista de tarjetas</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <button type="button" onClick={() => onViewModeChange('table')} aria-label="Vista de tabla" aria-pressed={viewMode === 'table'} className={tableClass}>
            <TableIcon className="h-3.5 w-3.5" />
          </button>
        </TooltipTrigger>
        <TooltipContent>Vista de tabla</TooltipContent>
      </Tooltip>
    </div>
  );
}

interface PageSizeSelectorProps {
  pageSize: number;
  onPageSizeChange: (size: number) => void;
}

function PageSizeSelector({ pageSize, onPageSizeChange }: Readonly<PageSizeSelectorProps>) {
  const triggerClass = cn(
    "flex items-center gap-1.5 rounded px-1.5 py-1 text-xs transition-colors",
    highlightClass
  );
  return (
    <div className="flex items-center rounded-lg border bg-muted p-0.5">
      <Tooltip>
        <TooltipTrigger asChild>
          <span className={cn("px-1.5 text-2xs text-muted-foreground", "hidden sm:inline")}>
            Pág.
          </span>
        </TooltipTrigger>
        <TooltipContent>Elementos por página</TooltipContent>
      </Tooltip>
      <Popover>
        <Tooltip>
          <PopoverTrigger asChild>
            <TooltipTrigger asChild>
              <button type="button" aria-label="Seleccionar tamaño de página" className={triggerClass}>
                <ListFilter className="h-3.5 w-3.5 text-info-texto" />
                <span className="text-2xs">{pageSize}</span>
              </button>
            </TooltipTrigger>
          </PopoverTrigger>
          <TooltipContent>Seleccionar tamaño de página</TooltipContent>
        </Tooltip>
        <PopoverContent className="w-40 p-2" align="start">
          <div className="space-y-1">
            {[10, 20, 50].map((size) => {
              const itemClass = cn(
                "w-full rounded-md px-3 py-2 text-left text-sm transition-colors",
                size === pageSize
                  ? "bg-info-suave text-info-texto font-medium shadow-inner"
                  : "text-foreground/80 hover:bg-muted"
              );
              return (
                <button key={size} type="button" onClick={() => onPageSizeChange(size)} className={itemClass}>
                  {size} por página
                </button>
              );
            })}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

export function InventoryRequestFilters({
  searchValue,
  activeSearch,
  onSearchChange,
  onSearchClear,
  selectedEstados,
  onToggleEstado,
  onClearEstados,
  espacios,
  selectedEspacio,
  onEspacioChange,
  fechaDesde,
  fechaHasta,
  onFechaDesdeChange,
  onFechaHastaChange,
  onResetFechas,
  pageSize,
  onPageSizeChange,
  hasFilters,
  onClearFilters,
  viewMode,
  onViewModeChange,
}: Readonly<InventoryRequestFiltersProps>) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {hasFilters && (
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={onClearFilters}
              aria-label="Limpiar filtros"
              className="p-1.5 rounded bg-danger text-white transition-colors hover:bg-danger"
            >
              <BrushCleaning className="h-3.5 w-3.5" />
            </button>
          </TooltipTrigger>
          <TooltipContent>Limpiar filtros</TooltipContent>
        </Tooltip>
      )}

      <SearchInput
        searchValue={searchValue}
        activeSearch={activeSearch}
        onSearchChange={onSearchChange}
        onSearchClear={onSearchClear}
      />

      <DateRangeFilter
        fechaDesde={fechaDesde}
        fechaHasta={fechaHasta}
        onFechaDesdeChange={onFechaDesdeChange}
        onFechaHastaChange={onFechaHastaChange}
        onResetFechas={onResetFechas}
      />

      <EstadoFilter
        selectedEstados={selectedEstados}
        onToggleEstado={onToggleEstado}
        onClearEstados={onClearEstados}
      />

      <EspacioFilter
        espacios={espacios}
        selectedEspacio={selectedEspacio}
        onEspacioChange={onEspacioChange}
      />

      <ViewModeToggle viewMode={viewMode} onViewModeChange={onViewModeChange} />

      <PageSizeSelector pageSize={pageSize} onPageSizeChange={onPageSizeChange} />
    </div>
  );
}


