import { useMemo } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { ReactNode } from 'react';
import type { Reserva } from '@/lib/types/spaces';

interface ReservaRowProps {
  reserva: Reserva;
  onClick?: (r: Reserva) => void;
  /** Texto secundario opcional al lado del espacio (carrera, motivo…). */
  meta?: string;
  /** Pinta el dot de estado en lugar del color del tipo de espacio. */
  showEstado?: boolean;
  /** Slot a la derecha (badge "urgente", ver pendiente, etc.). */
  rightSlot?: ReactNode;
  /** Si true, se marca la fila con un border-left de acento. */
  accent?: 'urgent' | 'success' | null;
  /** Mostrar avatar del solicitante. Default: true. */
  showAvatar?: boolean;
}

const estadoDot: Record<string, string> = {
  APROBADO: 'bg-emerald-500',
  PENDIENTE: 'bg-amber-500',
  CANCELADO: 'bg-red-500',
};

const accentBorder: Record<NonNullable<ReservaRowProps['accent']>, string> = {
  urgent: 'border-l-red-500',
  success: 'border-l-emerald-500',
};

const AVATAR_PALETTE = [
  'bg-blue-100 text-blue-700',
  'bg-emerald-100 text-emerald-700',
  'bg-amber-100 text-amber-700',
  'bg-purple-100 text-purple-700',
  'bg-pink-100 text-pink-700',
  'bg-cyan-100 text-cyan-700',
  'bg-orange-100 text-orange-700',
  'bg-teal-100 text-teal-700',
];

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function iniciales(nombre: string | undefined | null): string {
  if (!nombre) return '?';
  const parts = nombre.trim().split(/\s+/).slice(0, 2);
  return parts.map(p => p[0]?.toUpperCase() ?? '').join('') || '?';
}

/** Separa "Defensa de tesis #BEAA" en { base: 'Defensa de tesis', id: '#BEAA' }. */
function splitTitleId(titulo: string | undefined | null): { base: string; id: string | null } {
  if (!titulo) return { base: '', id: null };
  const m = /^(.*?)\s+(#[0-9A-Z]{3,})$/.exec(titulo.trim());
  return m ? { base: m[1], id: m[2] } : { base: titulo, id: null };
}

export function ReservaRow({
  reserva, onClick, meta, showEstado, rightSlot, accent, showAvatar = true,
}: Readonly<ReservaRowProps>) {
  const inicio = new Date(reserva.inicio);
  const fin = new Date(reserva.fin);
  const ahora = new Date();
  const esHoy = inicio.toDateString() === ahora.toDateString();
  const fechaCorta = esHoy ? 'hoy' : format(inicio, 'd MMM', { locale: es });
  const duracionMin = Math.round((fin.getTime() - inicio.getTime()) / 60000);
  const duracionLabel = duracionMin >= 60
    ? `${(duracionMin / 60).toFixed(duracionMin % 60 === 0 ? 0 : 1)} h`
    : `${duracionMin} min`;

  const { base: titleBase, id: titleId } = useMemo(
    () => splitTitleId(reserva.titulo),
    [reserva.titulo],
  );

  const avatarColor = useMemo(() => {
    const key = reserva.usuarioEmail || reserva.usuarioNombre || String(reserva.usuarioId ?? '');
    return AVATAR_PALETTE[hashString(key) % AVATAR_PALETTE.length];
  }, [reserva.usuarioEmail, reserva.usuarioNombre, reserva.usuarioId]);

  const clickable = !!onClick;
  const handleClick = () => onClick?.(reserva);
  const handleKey = (e: React.KeyboardEvent) => {
    if (clickable && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      onClick?.(reserva);
    }
  };

  const dotColor = showEstado
    ? estadoDot[reserva.estado] ?? 'bg-muted-foreground'
    : null;

  return (
    <div
      onClick={clickable ? handleClick : undefined}
      onKeyDown={clickable ? handleKey : undefined}
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
      className={[
        'group grid items-center gap-3 py-2 -mx-3 px-3 rounded-sm transition-colors',
        'grid-cols-[60px_1fr_auto]',
        clickable ? 'cursor-pointer hover:bg-muted/40' : '',
        accent ? `border-l-2 -ml-3 pl-2 ${accentBorder[accent]}` : '',
      ].filter(Boolean).join(' ')}
    >
      {/* Columna 1: hora */}
      <div className="text-xs tabular-nums leading-tight">
        <div className="font-medium">{format(inicio, 'HH:mm')}</div>
        <div className="text-muted-foreground text-[11px]">{fechaCorta}</div>
      </div>

      {/* Columna 2: título + meta (espacio, dur) */}
      <div className="min-w-0">
        <div className="flex items-baseline gap-2 min-w-0">
          {dotColor && <span className={`w-1.5 h-1.5 rounded-full shrink-0 self-center ${dotColor}`} />}
          {!dotColor && reserva.tipoEspacioColor && (
            <span
              className="w-1.5 h-1.5 rounded-full shrink-0 self-center"
              style={{ backgroundColor: reserva.tipoEspacioColor }}
              title={reserva.tipoEspacioNombre ?? undefined}
            />
          )}
          <span className="text-sm leading-tight truncate font-medium">{titleBase || reserva.espacioNombre}</span>
          {titleId && (
            <span className="text-[10px] font-mono text-muted-foreground tracking-tight shrink-0">{titleId}</span>
          )}
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5 min-w-0">
          <span className="truncate">{reserva.espacioNombre}</span>
          <span className="text-muted-foreground/60">·</span>
          <span className="tabular-nums">{duracionLabel}</span>
          {reserva.capacidadEspacio && (
            <>
              <span className="text-muted-foreground/60">·</span>
              <span className="tabular-nums">cap. {reserva.capacidadEspacio}</span>
            </>
          )}
          {meta && (
            <>
              <span className="text-muted-foreground/60">·</span>
              <span className="truncate">{meta}</span>
            </>
          )}
        </div>
      </div>

      {/* Columna 3: avatar usuario + slot derecho */}
      <div className="flex items-center gap-2 shrink-0">
        {showAvatar && (reserva.usuarioNombre || reserva.usuarioId) && (
          <div
            className={`w-6 h-6 rounded-full text-[10px] font-semibold flex items-center justify-center shrink-0 ${avatarColor}`}
            title={reserva.usuarioNombre ?? undefined}
          >
            {iniciales(reserva.usuarioNombre)}
          </div>
        )}
        {rightSlot}
      </div>
    </div>
  );
}
