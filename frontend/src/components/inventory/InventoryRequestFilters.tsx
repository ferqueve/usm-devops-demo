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
    activeClass: "text-amber-600",
    inactiveClass: "text-amber-500",
  },
  APROBADO: {
    label: "Aprobado",
    icon: CheckCircle2,
    activeClass: "text-emerald-600",
    inactiveClass: "text-emerald-500",
  },
  ENTREGADO: {
    label: "Entregado",
    icon: PackageCheck,
    activeClass: "text-blue-600",
    inactiveClass: "text-blue-500",
  },
  RECHAZADO: {
    label: "Rechazado",
    icon: XCircle,
    activeClass: "text-rose-600",
    inactiveClass: "text-rose-500",
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
  "bg-white text-gray-900 shadow-md ring-1 ring-gray-300 hover:text-gray-900";
const defaultButtonClass =
  "text-gray-500 hover:text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40";

const formatShortDate = (date?: Date) =>
  date ? format(date, "d MMM", { locale: es }) : "";

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
              className="p-1.5 rounded bg-rose-500 text-white transition-colors hover:bg-rose-600"
            >
              <BrushCleaning className="h-3.5 w-3.5" />
            </button>
          </TooltipTrigger>
          <TooltipContent>Limpiar filtros</TooltipContent>
        </Tooltip>
      )}

      <div className="flex items-center rounded-lg border bg-gray-50 p-0.5">
        <div
          className={cn(
            "flex items-center gap-1.5 rounded-md bg-white px-1.5 py-1 transition-colors shadow-xs",
            activeSearch ? "ring-1 ring-blue-500/40" : ""
          )}
        >
          <Search
            className={cn(
              "h-3.5 w-3.5 shrink-0",
              activeSearch ? "text-blue-600" : "text-gray-500"
            )}
          />
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
              className="rounded-full p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
              aria-label="Limpiar búsqueda"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center rounded-lg border bg-gray-50 p-0.5">
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={onResetFechas}
              className={cn(
                "p-1.5 rounded transition-colors",
                !fechaDesde && !fechaHasta ? highlightClass : defaultButtonClass
              )}
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
                  className={cn(
                    "flex items-center gap-1.5 rounded px-1.5 py-1 text-xs transition-colors",
                    fechaDesde ? highlightClass : defaultButtonClass
                  )}
                >
                  <CalendarArrowDown
                    className={cn(
                      "h-3.5 w-3.5 shrink-0",
                      fechaDesde ? "text-blue-600" : "text-gray-500"
                    )}
                  />
                  {fechaDesde && (
                    <span className="text-[11px]">{formatShortDate(fechaDesde)}</span>
                  )}
                </button>
              </TooltipTrigger>
            </PopoverTrigger>
            <TooltipContent>
              {fechaDesde
                ? format(fechaDesde, "PPP", { locale: es })
                : "Fecha desde"}
            </TooltipContent>
          </Tooltip>
          <PopoverContent className="w-auto p-0" align="start" onClick={(e) => e.stopPropagation()}>
            <CalendarComponent
              mode="single"
              selected={fechaDesde}
              onSelect={(date) => onFechaDesdeChange(date ?? undefined)}
              disabled={(date) => {
                if (fechaHasta) {
                  const limit = new Date(fechaHasta);
                  limit.setHours(23, 59, 59, 999);
                  return date > limit;
                }
                return false;
              }}
            />
          </PopoverContent>
        </Popover>

        <span className="mx-1 text-xs text-gray-400">-</span>

        <Popover>
          <Tooltip>
            <PopoverTrigger asChild>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  className={cn(
                    "flex items-center gap-1.5 rounded px-1.5 py-1 text-xs transition-colors",
                    fechaHasta ? highlightClass : defaultButtonClass
                  )}
                >
                  <CalendarArrowUp
                    className={cn(
                      "h-3.5 w-3.5 shrink-0",
                      fechaHasta ? "text-blue-600" : "text-gray-500"
                    )}
                  />
                  {fechaHasta && (
                    <span className="text-[11px]">{formatShortDate(fechaHasta)}</span>
                  )}
                </button>
              </TooltipTrigger>
            </PopoverTrigger>
            <TooltipContent>
              {fechaHasta
                ? format(fechaHasta, "PPP", { locale: es })
                : "Fecha hasta"}
            </TooltipContent>
          </Tooltip>
          <PopoverContent className="w-auto p-0" align="start" onClick={(e) => e.stopPropagation()}>
            <CalendarComponent
              mode="single"
              selected={fechaHasta}
              onSelect={(date) => onFechaHastaChange(date ?? undefined)}
              disabled={(date) => {
                if (fechaDesde) {
                  const limit = new Date(fechaDesde);
                  limit.setHours(0, 0, 0, 0);
                  return date < limit;
                }
                return false;
              }}
            />
          </PopoverContent>
        </Popover>
      </div>

      <div className="flex items-center rounded-lg border bg-gray-50 p-0.5">
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={onClearEstados}
              className={cn(
                "p-1.5 rounded transition-colors",
                selectedEstados.length === 0 ? highlightClass : defaultButtonClass
              )}
            >
              <Filter className="h-3.5 w-3.5" />
            </button>
          </TooltipTrigger>
          <TooltipContent>Todos los estados</TooltipContent>
        </Tooltip>

        {(
          Object.entries(estadoConfig) as Array<
            [ReservaItemSolicitadoEstado, (typeof estadoConfig)[ReservaItemSolicitadoEstado]]
          >
        ).map(([estado, config]) => {
          const Icon = config.icon;
          const active = selectedEstados.includes(estado);
          return (
            <Tooltip key={estado}>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={() => onToggleEstado(estado)}
                  className={cn(
                    "p-1.5 rounded transition-colors",
                    active ? highlightClass : defaultButtonClass
                  )}
                >
                  <Icon
                    className={cn(
                      "h-3.5 w-3.5",
                      active ? config.activeClass : config.inactiveClass
                    )}
                  />
                </button>
              </TooltipTrigger>
              <TooltipContent>{config.label}</TooltipContent>
            </Tooltip>
          );
        })}
      </div>

      <div className="flex items-center rounded-lg border bg-gray-50 p-0.5">
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={() => onEspacioChange(null)}
              className={cn(
                "p-1.5 rounded transition-colors",
                selectedEspacio === null ? highlightClass : defaultButtonClass
              )}
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
                  type="button"
                  className={cn(
                    "flex items-center gap-1.5 rounded px-1.5 py-1 text-xs transition-colors",
                    selectedEspacio === null ? defaultButtonClass : "bg-blue-100 text-blue-900 shadow-md ring-1 ring-blue-300"
                  )}
                >
                  <Building2
                    className={cn(
                      "h-3.5 w-3.5",
                      selectedEspacio === null ? "text-gray-500" : "text-blue-700"
                    )}
                  />
                  {selectedEspacio !== null && (
                    <span className="max-w-[140px] truncate text-[11px]">
                      {espacios.find((espacio) => espacio.id === selectedEspacio)?.nombre ??
                        "Espacio seleccionado"}
                    </span>
                  )}
                </button>
              </TooltipTrigger>
            </PopoverTrigger>
            <TooltipContent>
              {selectedEspacio === null
                ? "Seleccionar espacio"
                : espacios.find((espacio) => espacio.id === selectedEspacio)?.nombre ??
                  "Seleccionar espacio"}
            </TooltipContent>
          </Tooltip>
          <PopoverContent
            className="w-64 max-h-[280px] overflow-y-auto p-2"
            align="start"
          >
            {espacios.length > 0 ? (
              <div className="space-y-1">
                {espacios.map((espacio) => (
                  <button
                    key={espacio.id}
                    type="button"
                    onClick={() => onEspacioChange(espacio.id)}
                    className={cn(
                      "w-full rounded-md px-3 py-2 text-left text-sm transition-colors",
                      espacio.id === selectedEspacio
                        ? "bg-gray-100 text-gray-900 font-medium"
                        : "text-gray-700 hover:bg-gray-50"
                    )}
                  >
                    {espacio.nombre}
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center rounded-md border border-dashed border-gray-200 px-3 py-6 text-center text-[12px] text-muted-foreground">
                No hay espacios disponibles.
              </div>
            )}
          </PopoverContent>
        </Popover>
      </div>

      <div className="flex items-center rounded-lg border bg-gray-50 p-0.5">
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={() => onViewModeChange('cards')}
              className={cn(
                "p-1.5 rounded transition-colors",
                viewMode === 'cards' ? highlightClass : defaultButtonClass
              )}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
            </button>
          </TooltipTrigger>
          <TooltipContent>Vista de tarjetas</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={() => onViewModeChange('table')}
              className={cn(
                "p-1.5 rounded transition-colors",
                viewMode === 'table' ? highlightClass : defaultButtonClass
              )}
            >
              <TableIcon className="h-3.5 w-3.5" />
            </button>
          </TooltipTrigger>
          <TooltipContent>Vista de tabla</TooltipContent>
        </Tooltip>
      </div>

      <div className="flex items-center rounded-lg border bg-gray-50 p-0.5">
        <Tooltip>
          <TooltipTrigger asChild>
            <span
              className={cn(
                "px-1.5 text-[11px] text-muted-foreground",
                "hidden sm:inline"
              )}
            >
              Pág.
            </span>
          </TooltipTrigger>
          <TooltipContent>Elementos por página</TooltipContent>
        </Tooltip>
        <Popover>
          <Tooltip>
            <PopoverTrigger asChild>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  className={cn(
                    "flex items-center gap-1.5 rounded px-1.5 py-1 text-xs transition-colors",
                    highlightClass
                  )}
                >
                  <ListFilter className="h-3.5 w-3.5 text-blue-600" />
                  <span className="text-[11px]">{pageSize}</span>
                </button>
              </TooltipTrigger>
            </PopoverTrigger>
            <TooltipContent>Seleccionar tamaño de página</TooltipContent>
          </Tooltip>
          <PopoverContent className="w-40 p-2" align="start">
            <div className="space-y-1">
              {[10, 20, 50].map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => onPageSizeChange(size)}
                  className={cn(
                    "w-full rounded-md px-3 py-2 text-left text-sm transition-colors",
                    size === pageSize
                      ? "bg-blue-100 text-blue-900 font-medium shadow-inner"
                      : "text-gray-700 hover:bg-gray-50"
                  )}
                >
                  {size} por página
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}


