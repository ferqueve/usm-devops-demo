/**
 * Filtros compactos estilo "fila de íconos con popover" extraídos del
 * componente original de ReservationFilters para que el mismo estilo
 * visual se reuse en Espacios, Usuarios, Auditoría e Inventario.
 *
 * Convención visual:
 *   - Cada grupo vive dentro de `<div className="flex items-center border rounded-lg p-0.5 bg-muted">`
 *     con sub-botones de 28-32px.
 *   - Botón activo: `bg-card text-foreground shadow-md ring-1 ring-gray-300`.
 *   - Botón inactivo: `text-muted-foreground hover:text-foreground/80`.
 */
import type { LucideIcon } from 'lucide-react';
import { Filter, CalendarArrowDown, CalendarArrowUp, BrushCleaning } from 'lucide-react';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

const ACTIVE_BUTTON_CLASS = 'bg-card text-foreground shadow-md ring-1 ring-gray-300';
const INACTIVE_BUTTON_CLASS = 'text-muted-foreground hover:text-foreground/80';

export function compactFilterButtonClass(isActive: boolean): string {
  return `p-1.5 rounded transition-colors ${isActive ? ACTIVE_BUTTON_CLASS : INACTIVE_BUTTON_CLASS}`;
}

function filterTriggerClass(isActive: boolean): string {
  return `flex items-center gap-1.5 px-1.5 py-1 rounded transition-colors ${
    isActive ? ACTIVE_BUTTON_CLASS : INACTIVE_BUTTON_CLASS
  }`;
}

export interface PopoverFilterItem {
  id: number | string;
  primary: string;
  secondary?: string;
  swatchColor?: string;
}

interface PopoverFilterSectionProps<T extends number | string> {
  selectedId: T | null;
  items: PopoverFilterItem[];
  onChange: (id: T | null) => void;
  Icon: LucideIcon;
  tooltipNone: string;
  /** Tailwind class para el fondo del botón ícono cuando hay selección. */
  activeBgClass?: string;
  /** Tailwind class para el color del ícono cuando hay selección. */
  activeTextColorClass?: string;
}

/**
 * Filtro compacto con ícono + popover de selección por lista.
 * - Botón izquierdo (Filter): limpia la selección.
 * - Botón derecho (Icon): abre el popover con la lista.
 */
export function PopoverFilterSection<T extends number | string>({
  selectedId,
  items,
  onChange,
  Icon,
  tooltipNone,
  activeBgClass = 'bg-blue-100 text-blue-900 shadow-md ring-1 ring-blue-300',
  activeTextColorClass = 'text-blue-700',
}: Readonly<PopoverFilterSectionProps<T>>) {
  const isAll = selectedId === null;
  const allClass = compactFilterButtonClass(isAll);
  const triggerClass = `p-1.5 rounded transition-colors ${
    isAll ? INACTIVE_BUTTON_CLASS : activeBgClass
  }`;
  const iconClass = `h-3.5 w-3.5 ${isAll ? 'text-muted-foreground' : activeTextColorClass}`;
  const selectedItem = items.find(item => item.id === selectedId);
  return (
    <div className="flex items-center border rounded-lg p-0.5 bg-muted">
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
            {selectedItem ? selectedItem.primary : tooltipNone}
          </TooltipContent>
        </Tooltip>
        <PopoverContent className="w-64 p-2 max-h-[300px] overflow-y-auto" align="start">
          <div className="space-y-1">
            {items.map((item) => (
              <button
                key={item.id}
                onClick={() => onChange(item.id as T)}
                className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors flex items-center gap-2 ${
                  item.id === selectedId
                    ? 'bg-muted text-foreground font-medium'
                    : 'text-foreground/80 hover:bg-muted'
                }`}
              >
                {item.swatchColor && (
                  <div
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: item.swatchColor }}
                  />
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

export interface EnumFilterOption {
  /** Valor que se reporta al onChange. `null` representa "todos". */
  value: string | null;
  tooltip: string;
  Icon: LucideIcon;
  /** Color del ícono cuando esta opción está activa. */
  activeColorClass?: string;
  /** Color del ícono cuando no está activa. */
  inactiveColorClass?: string;
}

interface EnumFilterSectionProps {
  value: string | null;
  options: EnumFilterOption[];
  onChange: (value: string | null) => void;
}

/**
 * Filtro de enum con una opción por ícono. Pensado para sets pequeños
 * (estados, modos, recurrencia, etc.).
 */
export function EnumFilterSection({ value, options, onChange }: Readonly<EnumFilterSectionProps>) {
  return (
    <div className="flex items-center border rounded-lg p-0.5 bg-muted">
      {options.map((opt) => {
        const isActive = opt.value === value;
        const colorClass = isActive
          ? (opt.activeColorClass ?? '')
          : (opt.inactiveColorClass ?? 'text-muted-foreground');
        return (
          <Tooltip key={opt.tooltip}>
            <TooltipTrigger asChild>
              <button
                onClick={() => onChange(opt.value)}
                className={compactFilterButtonClass(isActive)}
              >
                <opt.Icon className={`h-3.5 w-3.5 ${colorClass}`} />
              </button>
            </TooltipTrigger>
            <TooltipContent>{opt.tooltip}</TooltipContent>
          </Tooltip>
        );
      })}
    </div>
  );
}

interface DateRangeFilterSectionProps {
  fechaInicio: Date | undefined;
  fechaFin: Date | undefined;
  onFechaInicioChange: (date: Date | undefined) => void;
  onFechaFinChange: (date: Date | undefined) => void;
}

export function DateRangeFilterSection({
  fechaInicio,
  fechaFin,
  onFechaInicioChange,
  onFechaFinChange,
}: Readonly<DateRangeFilterSectionProps>) {
  const allClass = compactFilterButtonClass(fechaInicio === undefined && fechaFin === undefined);
  return (
    <div className="flex items-center border rounded-lg p-0.5 bg-muted">
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
      <span className="mx-1 text-muted-foreground text-xs">-</span>
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
  Icon: LucideIcon;
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
  const buttonClass = filterTriggerClass(!isUnset);
  const iconClass = `h-3.5 w-3.5 shrink-0 ${isUnset ? 'text-muted-foreground' : 'text-blue-600'}`;
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
                  {format(value, 'd MMM', { locale: es })}
                </span>
              )}
            </button>
          </TooltipTrigger>
        </PopoverTrigger>
        <TooltipContent>
          {value ? format(value, 'PPP', { locale: es }) : tooltipFallback}
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

interface ClearFiltersButtonProps {
  onClear: () => void;
  visible: boolean;
}

export function ClearFiltersButton({ onClear, visible }: Readonly<ClearFiltersButtonProps>) {
  if (!visible) return null;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={onClear}
          aria-label="Limpiar filtros"
          className="p-1.5 rounded transition-colors bg-red-500 text-white hover:bg-red-600"
        >
          <BrushCleaning className="h-3.5 w-3.5" />
        </button>
      </TooltipTrigger>
      <TooltipContent>Limpiar filtros</TooltipContent>
    </Tooltip>
  );
}
