import { cn } from '@/lib/utils/helpers';
import { User, Boxes, CalendarClock, Mail, ClipboardCheck } from 'lucide-react';
import type { ReservaItemSolicitado, ReservaItemSolicitadoEstado } from '@/lib/types/spaces';
import PermissionGuard from '@/components/auth/PermissionGuard';

interface EstadoOption {
  value: ReservaItemSolicitadoEstado;
  label: string;
  badgeClass: string;
}

interface InventoryRequestsCardViewProps {
  requests: ReservaItemSolicitado[];
  onManage: (request: ReservaItemSolicitado) => void;
  onDeliver?: (request: ReservaItemSolicitado) => void;
  processingRequestId?: number | null;
  formatDateTime: (iso: string | undefined) => string;
  estadoOptions: EstadoOption[];
  estadoLabel: Record<ReservaItemSolicitadoEstado, string>;
}

export default function InventoryRequestsCardView({
  requests,
  onManage,
  onDeliver,
  processingRequestId,
  formatDateTime,
  estadoOptions,
  estadoLabel,
}: Readonly<InventoryRequestsCardViewProps>) {
  const getEstadoBadgeClass = (estado: ReservaItemSolicitadoEstado) =>
    estadoOptions.find((option) => option.value === estado)?.badgeClass ??
    'bg-muted text-foreground/80 border-border';

  const getSpaceBadgeStyles = (hexColor?: string) => {
    if (!hexColor) {
      return {
        backgroundColor: '#dcfce780', // emerald with alpha
        borderColor: '#34d39966',
        color: '#047857',
      };
    }

    const normalize = (color: string) => {
      const c = color.trim();
      if (!c.startsWith('#')) return null;
      const value = c.slice(1);
      if (value.length === 3) {
        const expanded = value
          .split('')
          .map((char) => char + char)
          .join('');
        return expanded.toUpperCase();
      }
      if (value.length === 6) {
        return value.toUpperCase();
      }
      if (value.length === 8) {
        return value.slice(0, 6).toUpperCase();
      }
      return null;
    };

    const parsed = normalize(hexColor);
    if (!parsed) {
      return {
        backgroundColor: '#dcfce780',
        borderColor: '#34d39966',
        color: '#047857',
      };
    }

    const r = Number.parseInt(parsed.slice(0, 2), 16);
    const g = Number.parseInt(parsed.slice(2, 4), 16);
    const b = Number.parseInt(parsed.slice(4, 6), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;

    return {
      backgroundColor: `#${parsed}1F`,
      borderColor: `#${parsed}40`,
      color: brightness > 160 ? '#1f2937' : '#f8fafc',
    };
  };

  const formatCompactDateTime = (iso?: string) => {
    if (!iso) return '—';
    try {
      return new Intl.DateTimeFormat('es-PE', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      })
        .format(new Date(iso))
        .replace('.', '')
        .replace(',', '');
    } catch {
      return formatDateTime(iso);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      {requests.map((request) => (
        <article
          key={request.id}
          className="group overflow-hidden rounded-lg border border-border bg-white/95 px-3 py-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus-within:shadow-md sm:px-4"
        >
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start lg:gap-5">
            <div className="flex min-w-0 flex-col gap-2.5">
              <header className="flex flex-wrap items-center gap-2 text-2xs uppercase tracking-wide text-muted-foreground">
                <span className="rounded-md bg-muted px-2 py-0.5 font-semibold text-foreground">
                  #{request.id}
                </span>
                <span
                  className={cn(
                    'inline-flex items-center rounded-md border border-transparent px-2 py-0.5 font-semibold',
                    getEstadoBadgeClass(request.estado)
                  )}
                >
                  {estadoLabel[request.estado]}
                </span>
                {request.tipoElementoNombre && (
                  <span
                    title={request.tipoElementoNombre}
                    className="inline-flex max-w-[128px] items-center truncate rounded-md border border-info-borde bg-info-suave px-2 py-0.5 text-2xs font-semibold uppercase tracking-wide text-info-texto"
                  >
                    {request.tipoElementoNombre}
                  </span>
                )}
                {request.espacioNombre && (
                  <span
                    title={request.espacioNombre}
                    className="inline-flex max-w-[160px] items-center truncate rounded-md border px-2 py-0.5 text-2xs font-semibold uppercase tracking-wide"
                    style={getSpaceBadgeStyles(
                      (request as { espacioTipoColor?: string; espacioColor?: string }).espacioTipoColor ??
                        (request as { espacioTipoColor?: string; espacioColor?: string }).espacioColor
                    )}
                  >
                    {request.espacioNombre}
                  </span>
                )}
                <span className="inline-flex items-center gap-1 rounded-md border border-border bg-muted px-2 py-0.5 text-2xs font-semibold uppercase tracking-wide text-foreground/80">
                  <Boxes className="h-3 w-3" />
                  x{request.cantidadSolicitada}
                </span>
                <span className="ml-auto text-2xs normal-case text-muted-foreground lg:hidden">
                  Creada {formatDateTime(request.createdAt)}
                </span>
              </header>

              <dl className="grid gap-2 sm:gap-3 text-xs leading-relaxed text-foreground sm:grid-cols-1 lg:grid-cols-2">
                <div className="grid grid-cols-[auto_1fr] items-start gap-2">
                  <User className="mt-0.5 h-4 w-4 text-muted-foreground" />
                  <div className="min-w-0 space-y-1 text-foreground">
                    <p className="truncate text-sm font-semibold leading-tight">
                      {request.solicitanteNombre ?? '—'}
                    </p>
                    <div className="flex items-center gap-1 text-2xs text-muted-foreground">
                      <Mail className="h-3 w-3 shrink-0" />
                      <span className="truncate break-all font-medium">
                        {request.solicitanteEmail ?? '—'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-[auto_1fr] items-start gap-2">
                  <CalendarClock className="mt-0.5 h-4 w-4 text-muted-foreground" />
                  <div className="flex flex-wrap items-center gap-1 text-sm font-semibold leading-tight text-foreground">
                    <span>{formatCompactDateTime(request.reservaInicio)}</span>
                    <span className="mx-1 text-2xs text-muted-foreground">→</span>
                    <span>{formatCompactDateTime(request.reservaFin)}</span>
                  </div>
                </div>
              </dl>
            </div>

            <aside className="mt-2 flex flex-col gap-2 border-t border-border pt-2 text-2xs text-muted-foreground lg:mt-0 lg:min-w-[184px] lg:max-w-[224px] lg:border-0 lg:pt-0 lg:items-end lg:justify-start lg:gap-3">
              <span className="hidden rounded-md border border-dashed border-border px-2 py-1 text-center text-2xs text-muted-foreground lg:block">
                Creada {formatDateTime(request.createdAt)}
              </span>
              <PermissionGuard requiredPermission="solicitud_inventario:aprobar">
                {request.estado === 'APROBADO' && request.inventarioItemId != null && onDeliver && (
                  <button
                    type="button"
                    onClick={() => onDeliver(request)}
                    disabled={processingRequestId === request.id || request.inventarioItemId == null}
                    className="inline-flex h-8 w-full items-center justify-center gap-1 rounded-md bg-success px-3 text-xs font-semibold text-white transition hover:bg-success/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-success/40 disabled:cursor-not-allowed disabled:opacity-70 lg:h-8"
                  >
                    <ClipboardCheck className="h-3.5 w-3.5" />
                    Entregado
                  </button>
                )}
              </PermissionGuard>
              <button
                type="button"
                onClick={() => onManage(request)}
                disabled={processingRequestId === request.id}
                className="inline-flex h-9 w-full items-center justify-center gap-1 rounded-md bg-utec-blue px-3 text-xs font-semibold text-white transition hover:bg-utec-blue/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-utec-blue/40 disabled:cursor-not-allowed disabled:opacity-70 lg:h-8"
              >
                Gestionar
              </button>
            </aside>
          </div>
        </article>
      ))}
    </div>
  );
}

