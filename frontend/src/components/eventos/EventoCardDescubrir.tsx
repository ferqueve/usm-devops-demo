import {
  CalendarDays, CheckCircle, Clock, Edit, FileText, Loader2, MapPin, Trash2, Users, XCircle,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/Button';
import PermissionGuard from '@/components/auth/PermissionGuard';
import { EventoPatternBg } from '@/components/ui/backgrounds/eventPatterns';
import type { Evento } from '@/lib/types/eventos';
import { relativoInicio, estaEnVivo } from '@/lib/agenda/tiempo';

// --- helpers compartidos con EventosManagement ---
export function parseTags(csv?: string): string[] {
  return (csv ?? '').split(',').map((t) => t.trim()).filter(Boolean);
}

const ESTADO_CONFIG: Record<string, { label: string; color: string; icon: typeof CheckCircle }> = {
  PUBLICADO: { label: 'Publicado', color: 'bg-utec-green text-marca-tinta border-utec-green', icon: CheckCircle },
  BORRADOR: { label: 'Borrador', color: 'bg-utec-yellow text-marca-tinta border-utec-yellow', icon: FileText },
  FINALIZADO: { label: 'Finalizado', color: 'bg-chrome text-white border-utec-dark', icon: Clock },
  CANCELADO: { label: 'Cancelado', color: 'bg-utec-red text-white border-utec-red', icon: XCircle },
};

export function EstadoBadge({ estado }: Readonly<{ estado: Evento['estado'] }>) {
  const config = ESTADO_CONFIG[estado] ?? { label: estado, color: 'bg-muted text-foreground border-border', icon: FileText };
  const Icon = config.icon;
  return (
    <Badge className={`${config.color} border font-medium text-2xs shrink-0`}>
      <Icon className="h-3 w-3 mr-1" />
      {config.label}
    </Badge>
  );
}


function fmtFechaCorta(iso?: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString('es-UY', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export interface EventoCardDescubrirProps {
  evento: Evento;
  yaInscrito?: boolean;
  className?: string;
  onNavigate: (id: number) => void;
  onInscribirse?: (e: Evento) => void;
  onCancelar?: (e: Evento) => void;
  onEditar?: (e: Evento) => void;
  onEliminar?: (e: Evento) => void;
  onTag?: (t: string) => void;
  inscribiendo?: boolean;
  cancelando?: boolean;
}

export function EventoCardDescubrir({
  evento, yaInscrito, className, onNavigate, onInscribirse, onCancelar, onEditar, onEliminar, onTag,
  inscribiendo, cancelando,
}: Readonly<EventoCardDescubrirProps>) {
  const conCupo = evento.cupo != null && evento.cupo > 0;
  const libres = evento.plazasDisponibles ?? 0;
  const enVivo = estaEnVivo(evento.inicio, evento.fin);
  const agotado = conCupo && libres <= 0;
  const ultimos = conCupo && libres > 0 && libres <= 3;
  const relativo = relativoInicio(evento.inicio, evento.fin);
  const tags = parseTags(evento.tags);
  const stop = (e: React.MouseEvent) => e.stopPropagation();

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onNavigate(evento.id)}
      onKeyDown={(e) => { if (e.key === 'Enter') onNavigate(evento.id); }}
      className={`group flex cursor-pointer flex-col overflow-hidden rounded-2xl border bg-card text-left transition-all hover:-translate-y-0.5 hover:shadow-lg hover:border-utec-cyan/40 ${className ?? ''}`}
    >
      {/* Cabecera con el PATRÓN del evento (cada evento se ve distinto) */}
      <div className="relative h-24 shrink-0 overflow-hidden bg-chrome p-3 text-white">
        <EventoPatternBg patron={evento.patron} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/15 to-transparent" />
        <div className="relative flex items-center justify-between gap-2">
          <span className="rounded-full bg-white/20 px-2 py-0.5 text-2xs font-semibold uppercase tracking-wide">{evento.tipo}</span>
          {enVivo
            ? <span className="inline-flex items-center gap-1 rounded-full bg-utec-red px-2 py-0.5 text-2xs font-bold"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-card" />EN VIVO</span>
            : <EstadoBadge estado={evento.estado} />}
        </div>
        <h3 className="relative mt-2 line-clamp-2 text-sm font-bold leading-tight">{evento.titulo}</h3>
      </div>

      {/* Cuerpo */}
      <div className="flex flex-1 flex-col gap-2 p-3 text-sm">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="inline-flex items-center gap-1 text-xs font-medium text-foreground"><Clock className="h-3.5 w-3.5 text-marca-cian-texto" />{relativo}</span>
          {agotado && <span className="rounded-full bg-muted px-2 py-0.5 text-2xs font-semibold text-muted-foreground">Agotado</span>}
          {ultimos && <span className="inline-flex items-center gap-1 rounded-full bg-utec-red/10 px-2 py-0.5 text-2xs font-bold text-marca-rojo-texto">🔥 Últimos {libres}</span>}
          {yaInscrito && <span className="inline-flex items-center gap-1 rounded-full bg-utec-green/10 px-2 py-0.5 text-2xs font-semibold text-marca-verde-texto"><CheckCircle className="h-3 w-3" />Inscrito</span>}
        </div>

        <p className="flex items-center gap-1.5 text-xs text-muted-foreground"><CalendarDays className="h-3.5 w-3.5" />{fmtFechaCorta(evento.inicio)}</p>
        {evento.espacioNombre && <p className="flex items-center gap-1.5 truncate text-xs text-muted-foreground"><MapPin className="h-3.5 w-3.5 shrink-0" /><span className="truncate">{evento.espacioNombre}</span></p>}
        {conCupo && !agotado && !ultimos && (
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground"><Users className="h-3.5 w-3.5" />{libres} plazas libres</p>
        )}

        {tags.length > 0 && onTag && (
          <div className="flex flex-wrap gap-1">
            {tags.slice(0, 3).map((t) => (
              <button key={t} type="button" onClick={(e) => { stop(e); onTag(t); }} className="inline-flex items-center rounded-full bg-utec-blue/10 px-2 py-0.5 text-2xs font-medium text-marca-azul-texto transition-colors hover:bg-utec-blue/20">{t}</button>
            ))}
          </div>
        )}

        {/* Acciones al pie */}
        <div className="mt-auto flex items-center gap-1.5 pt-1" onClick={stop} role="presentation">
          {onInscribirse && !yaInscrito && (
            <PermissionGuard requiredPermission="evento:inscribir">
              <Button size="sm" className="h-8 flex-1" disabled={agotado || inscribiendo} onClick={() => onInscribirse(evento)}>
                {inscribiendo && <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />}
                {agotado ? 'Sin plazas' : 'Inscribirme'}
              </Button>
            </PermissionGuard>
          )}
          {onCancelar && yaInscrito && (
            <PermissionGuard requiredPermission="evento:inscribir">
              <Button variant="outline" size="sm" className="h-8 flex-1 text-destructive hover:text-destructive" disabled={cancelando} onClick={() => onCancelar(evento)}>
                {cancelando ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <XCircle className="h-3.5 w-3.5 mr-1" />}
                Cancelar
              </Button>
            </PermissionGuard>
          )}
          {onEditar && (
            <PermissionGuard requiredPermission="evento:editar">
              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" title="Editar" onClick={() => onEditar(evento)}><Edit className="h-4 w-4" /></Button>
            </PermissionGuard>
          )}
          {onEliminar && (
            <PermissionGuard requiredPermission="evento:eliminar">
              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-destructive hover:text-destructive" title="Eliminar" onClick={() => onEliminar(evento)}><Trash2 className="h-4 w-4" /></Button>
            </PermissionGuard>
          )}
        </div>
      </div>
    </div>
  );
}
