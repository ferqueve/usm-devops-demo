import { CalendarDays, LayoutGrid, Maximize2, Minimize2, Table as TableIcon } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from '@/components/ui/pagination';

export type ReservationViewMode = 'cards' | 'table' | 'calendar';

export interface ViewModeToggleProps {
  viewMode: ReservationViewMode;
  onViewModeChange: (mode: ReservationViewMode) => void;
}

// Toggle compartido entre las 3 vistas (cards/table/calendar) que permite cambiar el modo activo.
export function ViewModeToggle({ viewMode, onViewModeChange }: Readonly<ViewModeToggleProps>) {
  const buttonClass = (active: boolean) =>
    `p-1.5 rounded transition-colors ${active
      ? 'bg-card text-foreground shadow-md ring-1 ring-border'
      : 'text-muted-foreground hover:text-foreground/80'}`;

  return (
    <div className="flex items-center border rounded-lg p-0.5 bg-muted flex-shrink-0 self-start">
      <Tooltip>
        <TooltipTrigger asChild>
          <button onClick={() => onViewModeChange('cards')} aria-label="Vista de tarjetas" aria-pressed={viewMode === 'cards'} className={buttonClass(viewMode === 'cards')}>
            <LayoutGrid className="h-3.5 w-3.5" />
          </button>
        </TooltipTrigger>
        <TooltipContent>Vista de tarjetas</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <button onClick={() => onViewModeChange('table')} aria-label="Vista de tabla" aria-pressed={viewMode === 'table'} className={buttonClass(viewMode === 'table')}>
            <TableIcon className="h-3.5 w-3.5" />
          </button>
        </TooltipTrigger>
        <TooltipContent>Vista de tabla</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <button onClick={() => onViewModeChange('calendar')} aria-label="Vista de calendario" aria-pressed={viewMode === 'calendar'} className={buttonClass(viewMode === 'calendar')}>
            <CalendarDays className="h-3.5 w-3.5" />
          </button>
        </TooltipTrigger>
        <TooltipContent>Vista de calendario</TooltipContent>
      </Tooltip>
    </div>
  );
}

export interface FullScreenToggleProps {
  isFullScreen: boolean;
  onToggle: () => void;
}

// Botón compartido para entrar/salir de pantalla completa.
export function FullScreenToggle({ isFullScreen, onToggle }: Readonly<FullScreenToggleProps>) {
  return (
    <div className="flex items-center border rounded-lg p-0.5 bg-muted flex-shrink-0 self-start">
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={onToggle}
            aria-label={isFullScreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
            className={`p-1.5 rounded transition-colors ${isFullScreen
              ? 'bg-card text-foreground shadow-md ring-1 ring-border'
              : 'text-muted-foreground hover:text-foreground/80'}`}
          >
            {isFullScreen ? (
              <Minimize2 className="h-3.5 w-3.5 text-info-texto" />
            ) : (
              <Maximize2 className="h-3.5 w-3.5" />
            )}
          </button>
        </TooltipTrigger>
        <TooltipContent>
          {isFullScreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
        </TooltipContent>
      </Tooltip>
    </div>
  );
}

export interface ReservationListPaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

// Paginación compartida entre la vista de tarjetas y la vista de tabla.
export function ReservationListPagination({
  page,
  totalPages,
  onPageChange,
}: Readonly<ReservationListPaginationProps>) {
  if (totalPages <= 1) return null;

  const pages: number[] = [];
  const maxVisiblePages = 5;
  let startPage = Math.max(0, page - Math.floor(maxVisiblePages / 2));
  const endPage = Math.min(totalPages - 1, startPage + maxVisiblePages - 1);
  if (endPage - startPage < maxVisiblePages - 1) {
    startPage = Math.max(0, endPage - maxVisiblePages + 1);
  }
  for (let i = startPage; i <= endPage; i++) pages.push(i);

  return (
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            href="#"
            onClick={(e) => { e.preventDefault(); if (page > 0) onPageChange(page - 1); }}
            className={page === 0 ? 'pointer-events-none opacity-50' : ''}
          />
        </PaginationItem>

        {startPage > 0 && (
          <>
            <PaginationItem>
              <PaginationLink href="#" onClick={(e) => { e.preventDefault(); onPageChange(0); }}>1</PaginationLink>
            </PaginationItem>
            {startPage > 1 && (
              <PaginationItem>
                <PaginationEllipsis />
              </PaginationItem>
            )}
          </>
        )}

        {pages.map((p) => (
          <PaginationItem key={p}>
            <PaginationLink
              href="#"
              onClick={(e) => { e.preventDefault(); onPageChange(p); }}
              isActive={p === page}
            >
              {p + 1}
            </PaginationLink>
          </PaginationItem>
        ))}

        {endPage < totalPages - 1 && (
          <>
            {endPage < totalPages - 2 && (
              <PaginationItem>
                <PaginationEllipsis />
              </PaginationItem>
            )}
            <PaginationItem>
              <PaginationLink href="#" onClick={(e) => { e.preventDefault(); onPageChange(totalPages - 1); }}>
                {totalPages}
              </PaginationLink>
            </PaginationItem>
          </>
        )}

        <PaginationItem>
          <PaginationNext
            href="#"
            onClick={(e) => { e.preventDefault(); if (page < totalPages - 1) onPageChange(page + 1); }}
            className={page >= totalPages - 1 ? 'pointer-events-none opacity-50' : ''}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}

