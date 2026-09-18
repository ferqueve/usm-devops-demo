import { useNavigate } from 'react-router-dom';
import {
  CalendarClock,
  CheckCircle,
  Edit,
  Eye,
  GraduationCap,
  Loader2,
  MapPin,
  Star,
  Users,
  Video,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/badge';
import PermissionGuard from '@/components/auth/PermissionGuard';
import { feriadoDe } from '@/lib/feriadosUy';
import { cn } from '@/lib/utils/helpers';
import type { Tutoria } from '@/lib/types/tutorias';

type Variant = 'disponible' | 'agendada' | 'docente';

interface TutoriaCardProps {
  tutoria: Tutoria;
  variant: Variant;
  esMiMateria?: boolean;
  yaAgendada?: boolean;
  busy?: boolean;
  onAgendar?: (t: Tutoria) => void;
  onConfirmar?: (t: Tutoria) => void;
  onCancelar?: (t: Tutoria) => void;
  onEdit?: (t: Tutoria) => void;
}

function tagsDe(csv?: string | null): string[] {
  return (csv ?? '').split(',').map((t) => t.trim()).filter(Boolean);
}

function formatRango(inicio?: string, fin?: string): string {
  if (!inicio) return '';
  const inicioDate = new Date(inicio);
  if (Number.isNaN(inicioDate.getTime())) return '';
  const fecha = inicioDate.toLocaleString('es-UY', {
    weekday: 'short', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
  });
  if (!fin) return fecha;
  const finDate = new Date(fin);
  if (Number.isNaN(finDate.getTime())) return fecha;
  const horaFin = finDate.toLocaleString('es-UY', { hour: '2-digit', minute: '2-digit' });
  return `${fecha}–${horaFin}`;
}

function relativo(iso?: string): string {
  if (!iso) return '';
  const diff = new Date(iso).getTime() - Date.now();
  if (Number.isNaN(diff)) return '';
  const dias = Math.round(diff / 86400000);
  if (dias === 0) return 'Hoy';
  if (dias === 1) return 'Mañana';
  if (dias === -1) return 'Ayer';
  return dias > 1 ? `en ${dias} días` : `hace ${Math.abs(dias)} días`;
}

/** Estrellas de rating del docente (ratingPromedio / ratingTotal). */
function Estrellas({ promedio, total }: Readonly<{ promedio?: number; total?: number }>) {
  if (!total || total === 0) {
    return <span className="text-2xs text-muted-foreground">Docente nuevo · sin valoraciones aún</span>;
  }
  const p = promedio ?? 0;
  const redondeado = Math.round(p);
  return (
    <span className="flex items-center gap-1 text-xs">
      <span className="flex">
        {[1, 2, 3, 4, 5].map((i) => (
          <Star key={i} className={cn('h-3.5 w-3.5', i <= redondeado ? 'fill-utec-yellow text-marca-amarillo-texto' : 'text-muted-foreground/30')} />
        ))}
      </span>
      <span className="font-semibold tabular-nums text-foreground">{p.toFixed(1)}</span>
      <span className="text-muted-foreground">({total})</span>
    </span>
  );
}

/** Badge "En vivo" cálido (rojo, con latido) para tutorías walk-in disponibles ahora. */
function EnVivoBadge() {
  return (
    <Badge className="border-utec-red bg-utec-red text-white text-2xs gap-1">
      <span className="relative flex h-1.5 w-1.5">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-card opacity-75" />
        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-card" />
      </span>
      En vivo
    </Badge>
  );
}

function ModalidadChip({ tutoria }: Readonly<{ tutoria: Tutoria }>) {
  if (tutoria.modalidad === 'VIRTUAL') {
    if (tutoria.enlace) {
      return (
        <a
          href={tutoria.enlace}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="inline-flex items-center gap-1 rounded-full border border-utec-cyan/30 bg-utec-cyan/15 px-2 py-0.5 text-2xs font-medium text-marca-cian-texto transition-colors hover:bg-utec-cyan/25"
        >
          <Video className="h-3 w-3" />Virtual · enlace
        </a>
      );
    }
    return (
      <Badge className="border border-utec-cyan/30 bg-utec-cyan/15 text-marca-cian-texto text-2xs gap-1">
        <Video className="h-3 w-3" />Virtual
      </Badge>
    );
  }
  return (
    <Badge className="border border-utec-green/30 bg-utec-green/15 text-marca-verde-texto text-2xs gap-1">
      <MapPin className="h-3 w-3" />Presencial
    </Badge>
  );
}

/** Estado del cupo con lenguaje de urgencia cálido. */
function CupoInfo({ tutoria }: Readonly<{ tutoria: Tutoria }>) {
  const libres = tutoria.plazasDisponibles;
  if (libres <= 0) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-utec-yellow/15 px-2 py-0.5 text-2xs font-semibold text-marca-naranja-texto">
        <Users className="h-3.5 w-3.5" />Completo · lista de espera
      </span>
    );
  }
  if (libres <= 3) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-utec-orange/15 px-2 py-0.5 text-2xs font-semibold text-marca-naranja-texto">
        <Users className="h-3.5 w-3.5" />¡Últimos {libres} lugares!
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-2xs font-medium text-muted-foreground">
      <Users className="h-3.5 w-3.5" />{libres} lugares disponibles
    </span>
  );
}

/**
 * Card nativa de tutoría: materia protagonista, docente + rating en estrellas,
 * modalidad, urgencia de cupo, temario y acciones según el rol.
 * Acento azul UTEC con toques cálidos de gamificación.
 */
export function TutoriaCard({
  tutoria, variant, esMiMateria, yaAgendada, busy,
  onAgendar, onConfirmar, onCancelar, onEdit,
}: Readonly<TutoriaCardProps>) {
  const navigate = useNavigate();
  const feriado = feriadoDe(tutoria.inicio);
  const ocup = Math.max(0, tutoria.cupo - tutoria.plazasDisponibles);
  const pct = tutoria.cupo > 0 ? Math.round((ocup / tutoria.cupo) * 100) : 0;
  const enEspera = tutoria.reservaEstado === 'ESPERA';
  const sinConfirmar = tutoria.reservaEstado === 'AGENDADA' && !tutoria.reservaConfirmada;

  const open = () => navigate(`/tutorias/${tutoria.id}`);
  const stop = (e: React.MouseEvent) => e.stopPropagation();

  return (
    <div
      onClick={open}
      className={cn(
        'group flex cursor-pointer flex-col overflow-hidden rounded-2xl border bg-card text-card-foreground shadow-sm transition-all',
        'hover:-translate-y-0.5 hover:border-utec-blue/40 hover:shadow-md',
        tutoria.enVivo && 'border-utec-red/40 ring-1 ring-utec-red/20',
      )}
    >
      {/* Franja superior azul con materia protagonista */}
      <div className="relative bg-gradient-to-br from-utec-blue/10 via-utec-blue/5 to-transparent px-4 pt-4 pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-utec-blue/15 text-marca-azul-texto">
              <GraduationCap className="h-4 w-4" />
            </span>
            <h3 className="truncate text-base font-bold leading-tight" title={tutoria.materiaNombre}>{tutoria.materiaNombre}</h3>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1">
            {tutoria.enVivo && <EnVivoBadge />}
            {esMiMateria && <Badge className="border border-utec-blue/30 bg-utec-blue/15 text-marca-azul-texto text-2xs">Tu materia</Badge>}
            {enEspera && <Badge className="border-utec-yellow bg-utec-yellow text-marca-tinta text-2xs">En espera</Badge>}
          </div>
        </div>
        <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
          <CalendarClock className="h-3.5 w-3.5 shrink-0" />
          <span className="capitalize">{formatRango(tutoria.inicio, tutoria.fin)}</span>
          <span className="font-medium text-marca-azul-texto">· {relativo(tutoria.inicio)}</span>
        </p>
      </div>

      <div className="flex flex-1 flex-col gap-2.5 px-4 py-3 text-sm">
        {/* Docente + rating */}
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="text-muted-foreground">{tutoria.docenteNombre}</span>
          <span className="text-muted-foreground/40">·</span>
          <Estrellas promedio={tutoria.ratingPromedio} total={tutoria.ratingTotal} />
        </div>

        {/* Chips: modalidad, espacio, tags */}
        <div className="flex flex-wrap items-center gap-1.5">
          <ModalidadChip tutoria={tutoria} />
          {tutoria.modalidad !== 'VIRTUAL' && tutoria.espacioNombre && (
            <span className="inline-flex items-center gap-1 text-2xs text-muted-foreground"><MapPin className="h-3 w-3" />{tutoria.espacioNombre}</span>
          )}
          {tagsDe(tutoria.tags).slice(0, 3).map((t) => (
            <span key={t} className="inline-flex items-center rounded-full bg-utec-blue/10 px-1.5 py-0.5 text-2xs font-medium text-marca-azul-texto">
              {t.toLowerCase() === 'mate' ? '🧉' : t}
            </span>
          ))}
        </div>

        {/* Preview del temario pedido (solo en las agendadas) */}
        {variant === 'agendada' && tutoria.reservaTemario && (
          <p className="rounded-lg border-l-2 border-utec-blue/40 bg-muted/40 py-1.5 pl-2.5 pr-2 text-xs text-muted-foreground">
            📋 {tutoria.reservaTemario}
          </p>
        )}

        {/* Cupo / progreso */}
        <div className="mt-auto space-y-1.5 pt-1">
          {variant === 'docente' ? (
            <>
              <div className="flex justify-between text-2xs text-muted-foreground">
                <span>{ocup}/{tutoria.cupo} agendados</span>
                <span>{tutoria.plazasDisponibles} libres</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-utec-blue transition-all" style={{ width: `${pct}%` }} />
              </div>
            </>
          ) : (
            <CupoInfo tutoria={tutoria} />
          )}
          {feriado && <p className="text-2xs text-marca-naranja-texto">⚠️ Ese día es feriado ({feriado})</p>}
        </div>
      </div>

      {/* Acciones */}
      <div className="flex items-center gap-2 border-t px-4 py-3" onClick={stop}>
        {variant === 'disponible' && (
          <PermissionGuard requiredPermission="tutoria:agendar">
            <Button
              className="w-full"
              variant={tutoria.plazasDisponibles <= 0 ? 'outline' : 'default'}
              disabled={yaAgendada || busy}
              onClick={() => onAgendar?.(tutoria)}
            >
              {busy && <Loader2 className="h-4 w-4 animate-spin" />}
              {yaAgendada ? 'Ya agendada' : (tutoria.plazasDisponibles <= 0 ? 'Anotarme en espera' : 'Agendar')}
            </Button>
          </PermissionGuard>
        )}

        {variant === 'agendada' && (
          <>
            {sinConfirmar && (
              <Button className="flex-1 bg-utec-green hover:bg-utec-green/90" disabled={busy} onClick={() => onConfirmar?.(tutoria)}>
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}Confirmar
              </Button>
            )}
            {!sinConfirmar && tutoria.reservaConfirmada && (
              <span className="flex flex-1 items-center gap-1 text-xs font-medium text-marca-verde-texto"><CheckCircle className="h-3.5 w-3.5" />Asistencia confirmada</span>
            )}
            {!sinConfirmar && !tutoria.reservaConfirmada && (
              <span className="flex-1 text-xs text-muted-foreground">{enEspera ? 'En lista de espera' : 'Reservada'}</span>
            )}
            <PermissionGuard requiredPermission="tutoria:cancelar_reserva">
              <Button variant="outline" className="text-destructive hover:text-destructive" disabled={busy} onClick={() => onCancelar?.(tutoria)}>
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
              </Button>
            </PermissionGuard>
          </>
        )}

        {variant === 'docente' && (
          <div className="flex w-full items-center justify-end gap-1">
            <Button variant="ghost" size="sm" onClick={open} title="Ver detalle"><Eye className="h-4 w-4" />Ver</Button>
            <PermissionGuard requiredPermission="tutoria:editar">
              <Button variant="ghost" size="sm" onClick={() => onEdit?.(tutoria)} title="Editar"><Edit className="h-4 w-4" />Editar</Button>
            </PermissionGuard>
          </div>
        )}
      </div>
    </div>
  );
}
