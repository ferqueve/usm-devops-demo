import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Award, Building2, CalendarClock, CalendarDays, CalendarPlus, Check, CheckCircle, ChevronLeft, ChevronRight, Clock, Copy, Download, Edit, FileText,
  Globe, Hourglass, Image as ImageIcon, Link2, Loader2, Lock, Mail, MapPin, Palette, QrCode, Send, Trash2, User, UserCheck, Users, XCircle,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import QRCode from 'qrcode';
import { jsPDF } from 'jspdf';
import { toast } from 'sonner';
import PermissionGuard from '@/components/auth/PermissionGuard';
import { eventosApi } from '@/lib/api/eventos';
import { espaciosApi } from '@/lib/api/spaces';
import type { Evento, EventoEstado, EventoInscripto } from '@/lib/types/eventos';
import type { Espacio } from '@/lib/types/spaces';
import { EventoFormDialog } from './EventoFormDialog';
import { AfichePoster } from './AfichePoster';
import { FeedbackEventoPanel } from './FeedbackEventoPanel';
import { EventoPatternBg, EVENTO_PATRONES } from '@/components/ui/backgrounds/eventPatterns';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { downloadICS, googleCalUrl, useCountdown } from './eventoUtils';

interface EventoDetailProps { eventoId: number }

const ESTADO_BADGE: Record<EventoEstado, { label: string; color: string; icon: LucideIcon }> = {
  PUBLICADO: { label: 'Publicado', color: 'bg-utec-green text-white border-utec-green', icon: CheckCircle },
  BORRADOR: { label: 'Borrador', color: 'bg-utec-yellow text-utec-dark border-utec-yellow', icon: FileText },
  FINALIZADO: { label: 'Finalizado', color: 'bg-utec-dark text-white border-utec-dark', icon: Clock },
  CANCELADO: { label: 'Cancelado', color: 'bg-utec-red text-white border-utec-red', icon: XCircle },
};

function formatFecha(iso?: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('es-UY', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}
function relativo(iso?: string): string {
  if (!iso) return '';
  const diff = new Date(iso).getTime() - Date.now();
  if (Number.isNaN(diff)) return '';
  const dias = Math.round(diff / 86400000);
  if (dias === 0) return 'Hoy';
  if (dias === 1) return 'Mañana';
  if (dias === -1) return 'Ayer';
  return dias > 1 ? `En ${dias} días` : `Hace ${Math.abs(dias)} días`;
}

type TileVariant = 'blue' | 'yellow' | 'cyan' | 'green' | 'orange';
const TILE_CLS: Record<TileVariant, string> = {
  blue: 'bg-utec-blue text-white', yellow: 'bg-utec-yellow text-utec-dark',
  cyan: 'bg-utec-cyan text-utec-dark', green: 'bg-utec-green text-white', orange: 'bg-utec-cyan text-utec-dark',
};
function StatTile({ icon: Icon, label, value, variant }: Readonly<{ icon: LucideIcon; label: string; value: ReactNode; variant: TileVariant }>) {
  return (
    <div className={`relative overflow-hidden rounded-xl px-4 py-2.5 flex items-center gap-3 ${TILE_CLS[variant]}`}>
      <Icon className="h-6 w-6 shrink-0 opacity-90" />
      <div className="min-w-0">
        <div className="text-xl font-bold tabular-nums leading-none">{value}</div>
        <div className="text-[11px] font-medium opacity-80 mt-0.5">{label}</div>
      </div>
    </div>
  );
}
function MetaItem({ icon: Icon, label, value }: Readonly<{ icon: LucideIcon; label: string; value: ReactNode }>) {
  return (
    <div className="flex items-start gap-2.5 rounded-xl border bg-muted/30 p-3">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-utec-cyan/10 text-utec-cyan"><Icon className="h-4 w-4" /></span>
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-wide text-muted-foreground leading-none">{label}</p>
        <p className="text-sm font-medium truncate mt-1">{value}</p>
      </div>
    </div>
  );
}
function Panel({ title, icon, accent, action, children, className }: Readonly<{ title: string; icon: ReactNode; accent: string; action?: ReactNode; children: ReactNode; className?: string }>) {
  return (
    <div className={`rounded-2xl border bg-card overflow-hidden flex flex-col ${className ?? ''}`}>
      <div className="flex items-center gap-2.5 px-4 py-3 border-b shrink-0">
        <span className={`flex h-7 w-7 items-center justify-center rounded-lg ${accent}`}>{icon}</span>
        <h3 className="text-sm font-semibold">{title}</h3>
        {action && <div className="ml-auto">{action}</div>}
      </div>
      <div className="p-4 flex-1">{children}</div>
    </div>
  );
}
function NotificarEventoDialog({ eventoId, open, onOpenChange }: Readonly<{ eventoId: number; open: boolean; onOpenChange: (v: boolean) => void }>) {
  const [asunto, setAsunto] = useState('Aviso del evento');
  const [mensaje, setMensaje] = useState('');
  const [sending, setSending] = useState(false);
  const enviar = async () => {
    if (!mensaje.trim()) { toast.error('Escribí un mensaje'); return; }
    try {
      setSending(true);
      const r = await eventosApi.notificar(eventoId, { asunto, mensaje });
      const { enviados = 0, total = 0 } = r.data ?? {};
      if (enviados > 0) toast.success(`Enviado a ${enviados}/${total} inscriptos`);
      else toast.warning('No se envió ningún email', { description: 'Puede que no haya inscriptos o el email no esté disponible.' });
      onOpenChange(false);
    } catch (e: unknown) {
      toast.error('No se pudo notificar', { description: e instanceof Error ? e.message : 'Error' });
    } finally { setSending(false); }
  };
  return (
    <Dialog open={open} onOpenChange={(v) => (sending ? undefined : onOpenChange(v))}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><span className="p-1.5 rounded-md bg-utec-green/10 text-utec-green"><Mail className="h-4 w-4" /></span>Notificar a los inscriptos</DialogTitle>
          <DialogDescription>Se enviará un email a los anotados en este evento.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="space-y-2"><Label htmlFor="e-asunto">Asunto</Label><Input id="e-asunto" value={asunto} onChange={(e) => setAsunto(e.target.value)} disabled={sending} /></div>
          <div className="space-y-2"><Label htmlFor="e-msg">Mensaje</Label>
            <textarea id="e-msg" rows={4} value={mensaje} onChange={(e) => setMensaje(e.target.value)} disabled={sending} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-y" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={sending}>Cancelar</Button>
          <Button onClick={enviar} disabled={sending}>{sending ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Send className="h-4 w-4 mr-1" />}Enviar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function EventoDetail({ eventoId }: Readonly<EventoDetailProps>) {
  const navigate = useNavigate();
  const [evento, setEvento] = useState<Evento | null>(null);
  const [inscriptos, setInscriptos] = useState<EventoInscripto[]>([]);
  const [inscPage, setInscPage] = useState(0);
  const [espacio, setEspacio] = useState<Espacio | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [notifyOpen, setNotifyOpen] = useState(false);
  const [aficheOpen, setAficheOpen] = useState(false);
  const [savingEstado, setSavingEstado] = useState(false);
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const countdown = useCountdown(evento?.inicio);

  useEffect(() => {
    QRCode.toDataURL(window.location.href, { margin: 1, width: 180 }).then(setQrUrl).catch(() => { /* noop */ });
  }, [eventoId]);

  const descargarCertificado = (nombre: string) => {
    if (!evento) return;
    const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
    const w = doc.internal.pageSize.getWidth();
    doc.setDrawColor(24, 72, 151); doc.setLineWidth(6); doc.rect(24, 24, w - 48, doc.internal.pageSize.getHeight() - 48);
    doc.setTextColor(24, 72, 151); doc.setFont('helvetica', 'bold'); doc.setFontSize(16); doc.text('UTEC · USM', w / 2, 90, { align: 'center' });
    doc.setFontSize(30); doc.text('Certificado de asistencia', w / 2, 160, { align: 'center' });
    doc.setTextColor(60); doc.setFont('helvetica', 'normal'); doc.setFontSize(16); doc.text('Se certifica que', w / 2, 220, { align: 'center' });
    doc.setTextColor(20); doc.setFont('helvetica', 'bold'); doc.setFontSize(26); doc.text(nombre, w / 2, 262, { align: 'center' });
    doc.setTextColor(60); doc.setFont('helvetica', 'normal'); doc.setFontSize(16);
    doc.text(`participó de "${evento.titulo}"`, w / 2, 310, { align: 'center' });
    doc.text(new Date(evento.inicio).toLocaleDateString('es-UY', { day: '2-digit', month: 'long', year: 'numeric' }), w / 2, 340, { align: 'center' });
    doc.save(`certificado-${nombre.replace(/\s+/g, '_')}.pdf`);
  };

  const fetchEvento = useCallback(() => {
    setLoading(true);
    eventosApi.obtener(eventoId)
      .then((r) => { if (r.data) setEvento(r.data); else setNotFound(true); })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [eventoId]);
  const fetchInscriptos = useCallback(() => {
    eventosApi.inscriptos(eventoId).then((r) => setInscriptos(r.data ?? [])).catch(() => { /* noop */ });
  }, [eventoId]);

  useEffect(() => { fetchEvento(); fetchInscriptos(); }, [fetchEvento, fetchInscriptos]);
  useEffect(() => {
    if (evento?.espacioId != null) {
      let active = true;
      espaciosApi.obtenerEspacio(evento.espacioId).then((r) => { if (active) setEspacio(r.data ?? null); }).catch(() => { /* noop */ });
      return () => { active = false; };
    }
    setEspacio(null);
  }, [evento?.espacioId]);

  const cambiarEstado = async (estado: EventoEstado) => {
    try { setSavingEstado(true); await eventosApi.actualizar(eventoId, { estado }); toast.success(`Evento ${estado.toLowerCase()}`); fetchEvento(); }
    catch (e: unknown) { toast.error('No se pudo cambiar el estado', { description: e instanceof Error ? e.message : 'Error' }); }
    finally { setSavingEstado(false); }
  };
  const cambiarPatron = async (patron: string) => {
    setEvento((prev) => (prev ? { ...prev, patron } : prev)); // optimista
    try { await eventosApi.actualizar(eventoId, { patron }); }
    catch (e: unknown) {
      toast.error('No se pudo cambiar el patrón', { description: e instanceof Error ? e.message : 'Error' });
      fetchEvento();
    }
  };
  const eliminar = async () => {
    try { await eventosApi.eliminar(eventoId); toast.success('Evento eliminado'); navigate('/eventos'); }
    catch (e: unknown) { toast.error('No se pudo eliminar', { description: e instanceof Error ? e.message : 'Error' }); }
  };
  const toggleAsistencia = async (i: EventoInscripto) => {
    const asistio = i.estado !== 'ASISTIO';
    try { await eventosApi.marcarAsistencia(i.inscripcionId, asistio); fetchInscriptos(); fetchEvento(); }
    catch (e: unknown) { toast.error('No se pudo marcar asistencia', { description: e instanceof Error ? e.message : 'Error' }); }
  };
  const duplicar = async () => {
    if (!evento) return;
    try {
      const r = await eventosApi.crear({
        titulo: `${evento.titulo} (copia)`, descripcion: evento.descripcion, tipo: evento.tipo,
        inicio: evento.inicio, fin: evento.fin, cupo: evento.cupo, esPublico: evento.esPublico, espacioId: evento.espacioId,
      });
      toast.success('Evento duplicado');
      if (r.data?.id) navigate(`/eventos/${r.data.id}`);
    } catch (e: unknown) { toast.error('No se pudo duplicar', { description: e instanceof Error ? e.message : 'Error' }); }
  };
  const copyLink = () => navigator.clipboard?.writeText(window.location.href).then(() => toast.success('Link copiado')).catch(() => {});
  const exportCSV = () => {
    const esc = (v: string) => `"${(v ?? '').replace(/"/g, '""')}"`;
    const rows = inscriptos.map((i) => [esc(i.nombre ?? ''), esc(i.email ?? ''), esc(formatFecha(i.createdAt))].join(',')).join('\n');
    const blob = new Blob([`﻿Nombre,Email,Inscripto\n${rows}`], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `inscriptos-evento-${eventoId}.csv`; a.click(); URL.revokeObjectURL(url);
  };

  const ocupacion = useMemo(() => {
    if (!evento?.cupo || evento.cupo <= 0) return 0;
    const disp = evento.plazasDisponibles ?? evento.cupo;
    return Math.round(((evento.cupo - disp) / evento.cupo) * 100);
  }, [evento]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-6 w-48" />
        <div className="grid gap-4 lg:grid-cols-3"><Skeleton className="h-44 rounded-2xl" /><Skeleton className="h-44 rounded-2xl lg:col-span-2" /></div>
        <Skeleton className="h-56 rounded-2xl" />
      </div>
    );
  }
  if (notFound || !evento) {
    return (
      <div className="space-y-6">
        <button type="button" onClick={() => navigate('/eventos')} className="text-sm text-muted-foreground hover:text-foreground">← Eventos</button>
        <EmptyState icon={CalendarDays} title="Evento no encontrado" description="El evento no existe o fue eliminado." />
      </div>
    );
  }

  const badge = ESTADO_BADGE[evento.estado];
  const BadgeIcon = badge.icon;
  const conCupo = evento.cupo != null && evento.cupo > 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <nav className="flex items-center gap-1.5 text-sm text-muted-foreground min-w-0">
          <button type="button" onClick={() => navigate('/eventos')} className="hover:text-foreground">Eventos</button>
          <ChevronRight className="h-4 w-4 shrink-0" />
          <span className="text-foreground font-medium truncate">{evento.titulo}</span>
        </nav>
        <div className="flex items-center gap-1 shrink-0">
          <Button variant="ghost" size="sm" onClick={() => setAficheOpen(true)} title="Generar afiche"><ImageIcon className="h-4 w-4" /></Button>
          <Button variant="ghost" size="sm" onClick={() => downloadICS(evento)} title="Agregar a calendario (.ics)"><CalendarPlus className="h-4 w-4" /></Button>
          <Button variant="ghost" size="sm" onClick={copyLink} title="Copiar link"><Link2 className="h-4 w-4" /></Button>
          <PermissionGuard requiredPermission="evento:ver_inscriptos"><Button variant="ghost" size="sm" onClick={() => setNotifyOpen(true)} title="Notificar inscriptos"><Mail className="h-4 w-4" /></Button></PermissionGuard>
          <PermissionGuard requiredPermission="evento:crear"><Button variant="ghost" size="sm" onClick={duplicar} title="Duplicar evento"><Copy className="h-4 w-4" /></Button></PermissionGuard>
          <PermissionGuard requiredPermission="evento:editar"><Button variant="ghost" size="sm" onClick={() => setEditOpen(true)} title="Editar"><Edit className="h-4 w-4" /></Button></PermissionGuard>
          <PermissionGuard requiredPermission="evento:eliminar"><Button variant="ghost" size="sm" onClick={eliminar} title="Eliminar" className="text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /></Button></PermissionGuard>
        </div>
      </div>

      {/* Identidad (75%) + tiles (25% en columna) */}
      <div className="grid gap-4 lg:grid-cols-4 items-stretch">
        <div className="lg:col-span-3 rounded-2xl border bg-card overflow-hidden flex flex-col">
          {/* Banner con el patrón del evento */}
          <div className="relative min-h-[9rem] overflow-hidden bg-utec-dark p-4 text-white flex flex-col justify-between gap-3">
            <EventoPatternBg patron={evento.patron} />
            <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/25 to-transparent" />
            {/* Arriba: tipo (izq) · estado + tema (der) */}
            <div className="relative flex items-start justify-between gap-2">
              <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide">{evento.tipo}</span>
              <div className="flex items-center gap-1.5">
                <Badge className={`${badge.color} border font-medium text-xs`}><BadgeIcon className="h-3.5 w-3.5 mr-1.5" />{badge.label}</Badge>
                <PermissionGuard requiredPermission="evento:editar">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-white/70 hover:text-white hover:bg-white/10" title="Cambiar patrón de fondo">
                        <Palette className="h-4 w-4" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent align="end" className="w-72 p-2 max-h-[60vh] overflow-y-auto">
                      <p className="px-1 pb-1.5 text-xs font-semibold text-muted-foreground">Patrón de fondo · {EVENTO_PATRONES.length} estilos</p>
                      <div className="grid grid-cols-2 gap-1.5">
                        {EVENTO_PATRONES.map((p) => {
                          const activo = (evento.patron ?? 'formas') === p.id;
                          return (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => cambiarPatron(p.id)}
                              className={`relative h-14 overflow-hidden rounded-lg border text-left transition-shadow ${activo ? 'ring-2 ring-utec-cyan' : 'hover:ring-1 hover:ring-utec-cyan/50'}`}
                            >
                              <EventoPatternBg patron={p.id} />
                              <span className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-black/45 px-1.5 py-0.5 text-[10px] font-medium text-white">
                                {p.nombre}{activo && <Check className="h-3 w-3" />}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </PopoverContent>
                  </Popover>
                </PermissionGuard>
              </div>
            </div>
            {/* Abajo: título (izq) · countdown (der) */}
            <div className="relative flex items-end justify-between gap-3">
              <h1 className="min-w-0 text-xl font-bold leading-tight line-clamp-2">{evento.titulo}</h1>
              {!countdown.pasado && evento.estado === 'PUBLICADO' && (
                <div className="flex shrink-0 items-center gap-1.5">
                  {([['D', countdown.dias], ['H', countdown.horas], ['M', countdown.minutos], ['S', countdown.segundos]] as const).map(([l, v]) => (
                    <div key={l} className="text-center rounded-md bg-white/15 ring-1 ring-white/15 px-2.5 py-1 min-w-[42px]">
                      <div className="text-base font-bold tabular-nums leading-none">{String(v).padStart(2, '0')}</div>
                      <div className="text-[9px] text-white/60 uppercase">{l}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          {/* Cuerpo */}
          <div className="flex flex-1 flex-col p-5">
            <div className="flex flex-wrap items-center gap-1.5">
              <Badge variant="outline" className="text-xs flex items-center gap-1">{evento.esPublico ? <><Globe className="h-3 w-3" />Público</> : <><Lock className="h-3 w-3" />Interno</>}</Badge>
              {evento.tags && evento.tags.split(',').map((t) => t.trim()).filter(Boolean).map((t) => (
                <span key={t} className="inline-flex items-center rounded-full bg-utec-blue/10 text-utec-blue px-2 py-0.5 text-xs font-medium">{t}</span>
              ))}
            </div>
            {evento.descripcion && <p className="text-sm text-muted-foreground mt-3 leading-relaxed">{evento.descripcion}</p>}
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <MetaItem icon={CalendarClock} label="Cuándo" value={<>{formatFecha(evento.inicio)} · <span className="text-muted-foreground">{relativo(evento.inicio)}</span></>} />
              {evento.espacioNombre && <MetaItem icon={MapPin} label="Lugar" value={evento.espacioNombre} />}
              {evento.organizadorNombre && <MetaItem icon={User} label="Organiza" value={evento.organizadorNombre} />}
            </div>
          </div>
        </div>
        <div className="lg:col-span-1 grid grid-cols-1 gap-4">
          <StatTile icon={Users} label="Inscriptos" value={evento.inscriptosCount} variant="blue" />
          <StatTile icon={Users} label="Cupo" value={conCupo ? evento.cupo : '∞'} variant="orange" />
          <StatTile icon={CheckCircle} label="Disponibles" value={conCupo ? (evento.plazasDisponibles ?? 0) : '—'} variant="green" />
          <StatTile icon={CalendarClock} label="Ocupación" value={conCupo ? `${ocupacion}%` : '—'} variant="cyan" />
        </div>
      </div>

      {/* Inscriptos 40% · Satisfacción 40% · resto 20% (misma altura) */}
      <div className="grid gap-4 lg:grid-cols-5 items-stretch">
        <div className="lg:col-span-2">
          <Panel
            title={`Inscriptos · ${inscriptos.filter((i) => i.estado !== 'ESPERA').length}`}
            icon={<Users className="h-4 w-4 text-utec-blue" />}
            accent="bg-utec-blue/10"
            className="h-full"
            action={inscriptos.length > 0 ? <Button variant="ghost" size="sm" className="h-7" onClick={exportCSV}><Download className="h-3.5 w-3.5 mr-1.5" />CSV</Button> : undefined}
          >
            {(() => {
              if (inscriptos.length === 0) return <p className="text-sm text-muted-foreground py-2">Nadie se inscribió todavía.</p>;
              const confirmados = inscriptos.filter((i) => i.estado !== 'ESPERA');
              const espera = inscriptos.filter((i) => i.estado === 'ESPERA');
              const asistieron = confirmados.filter((i) => i.estado === 'ASISTIO').length;
              const tasa = confirmados.length ? Math.round((asistieron / confirmados.length) * 100) : 0;
              const cupoNum = evento.cupo ?? 0;
              const libres = conCupo ? Math.max(0, cupoNum - confirmados.length) : 0;
              const pctIns = conCupo && cupoNum ? Math.min(100, (confirmados.length / cupoNum) * 100) : 0;
              const pctEsp = conCupo && cupoNum ? Math.min(100 - pctIns, (espera.length / cupoNum) * 100) : 0;
              const PAGE = 8;
              const totalPag = Math.max(1, Math.ceil(confirmados.length / PAGE));
              const pag = Math.min(inscPage, totalPag - 1);
              const fila = (i: EventoInscripto) => {
                const presente = i.estado === 'ASISTIO';
                return (
                  <li key={i.inscripcionId} className="flex items-center justify-between gap-3 rounded-lg border p-3">
                    <span className="flex items-center gap-2 min-w-0">
                      <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${presente ? 'bg-utec-green/15 text-utec-green' : 'bg-utec-blue/10 text-utec-blue'}`}>{i.nombre?.slice(0, 2).toUpperCase()}</span>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium">{i.nombre}</span>
                        <span className="block truncate text-xs text-muted-foreground">{i.email}</span>
                      </span>
                    </span>
                    <span className="flex items-center gap-1 shrink-0">
                      {presente && evento.tipo === 'CURSO' && i.nombre && (
                        <Button variant="ghost" size="icon" className="h-7 w-7" title="Certificado" onClick={() => descargarCertificado(i.nombre as string)}><Award className="h-3.5 w-3.5 text-utec-green" /></Button>
                      )}
                      <PermissionGuard requiredPermission="evento:ver_inscriptos">
                        <Button variant={presente ? 'default' : 'outline'} size="sm" className="h-7 text-xs" onClick={() => toggleAsistencia(i)} title="Marcar asistencia">
                          <UserCheck className="h-3.5 w-3.5 mr-1" />{presente ? 'Presente' : 'Check-in'}
                        </Button>
                      </PermissionGuard>
                    </span>
                  </li>
                );
              };
              return (
                <div className="flex h-full flex-col gap-3">
                  {/* Avatares apilados + conteo */}
                  <div className="flex items-center gap-3">
                    <div className="flex -space-x-2">
                      {confirmados.slice(0, 6).map((i) => (
                        <span key={i.inscripcionId} className={`flex h-8 w-8 items-center justify-center rounded-full border-2 border-background text-xs font-semibold ${i.estado === 'ASISTIO' ? 'bg-utec-green/15 text-utec-green' : 'bg-utec-blue/10 text-utec-blue'}`}>{i.nombre?.slice(0, 2).toUpperCase()}</span>
                      ))}
                      {confirmados.length > 6 && <span className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-background bg-muted text-xs font-semibold text-muted-foreground">+{confirmados.length - 6}</span>}
                    </div>
                    <span className="text-sm text-muted-foreground"><b className="text-foreground">{confirmados.length}</b> inscripto{confirmados.length === 1 ? '' : 's'}{espera.length > 0 ? ` · ${espera.length} en espera` : ''}</span>
                  </div>
                  {/* Barra de cupo segmentada */}
                  {conCupo && (
                    <div>
                      <div className="mb-1 flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">{confirmados.length}/{cupoNum} plazas</span>
                        <span className={libres === 0 ? 'font-semibold text-utec-red' : 'text-muted-foreground'}>{libres === 0 ? '¡Completo!' : `${libres} libres`}</span>
                      </div>
                      <div className="flex h-2.5 overflow-hidden rounded-full bg-muted">
                        <div className="bg-utec-blue" style={{ width: `${pctIns}%` }} title="Inscriptos" />
                        <div className="bg-utec-yellow" style={{ width: `${pctEsp}%` }} title="En espera" />
                      </div>
                    </div>
                  )}
                  {/* Barra de asistencia */}
                  {confirmados.length > 0 && (
                    <div className="flex items-center gap-3 text-sm">
                      <span className="flex shrink-0 items-center gap-1.5"><UserCheck className="h-4 w-4 text-utec-green" /><b>{asistieron}</b>/{confirmados.length} asistieron</span>
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-utec-green transition-all" style={{ width: `${tasa}%` }} /></div>
                      <span className="shrink-0 text-xs tabular-nums text-muted-foreground">{tasa}%</span>
                    </div>
                  )}
                  <ul className="space-y-2">{confirmados.slice(pag * PAGE, pag * PAGE + PAGE).map(fila)}</ul>
                  {espera.length > 0 && (
                    <div className="pt-1">
                      <p className="text-xs font-semibold text-muted-foreground uppercase flex items-center gap-1.5 mb-2"><Hourglass className="h-3.5 w-3.5" />Lista de espera · {espera.length}</p>
                      <ul className="space-y-2">
                        {espera.map((i) => (
                          <li key={i.inscripcionId} className="flex items-center justify-between gap-3 rounded-lg border border-dashed p-3 opacity-80">
                            <span className="flex items-center gap-2 min-w-0">
                              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-utec-yellow/20 text-utec-dark text-xs font-semibold">{i.nombre?.slice(0, 2).toUpperCase()}</span>
                              <span className="block truncate text-sm font-medium">{i.nombre}</span>
                            </span>
                            <Badge className="bg-utec-yellow text-utec-dark border-utec-yellow text-[10px]">En espera</Badge>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {totalPag > 1 && (
                    <div className="mt-auto flex items-center justify-center gap-3 border-t pt-3">
                      <Button variant="outline" size="icon" className="h-7 w-7" disabled={pag === 0} onClick={() => setInscPage(pag - 1)} aria-label="Anterior"><ChevronLeft className="h-4 w-4" /></Button>
                      <span className="text-xs text-muted-foreground tabular-nums">Página {pag + 1} de {totalPag}</span>
                      <Button variant="outline" size="icon" className="h-7 w-7" disabled={pag >= totalPag - 1} onClick={() => setInscPage(pag + 1)} aria-label="Siguiente"><ChevronRight className="h-4 w-4" /></Button>
                    </div>
                  )}
                </div>
              );
            })()}
          </Panel>
        </div>
        <div className="lg:col-span-2">
          <FeedbackEventoPanel eventoId={evento.id} />
        </div>
        <div className="lg:col-span-1 flex flex-col gap-4">
          <PermissionGuard requiredPermission="evento:editar">
            <Panel title="Estado" icon={<FileText className="h-4 w-4 text-utec-cyan" />} accent="bg-utec-cyan/10">
              <Select value={evento.estado} onValueChange={(v) => cambiarEstado(v as EventoEstado)} disabled={savingEstado}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="BORRADOR">Borrador</SelectItem>
                  <SelectItem value="PUBLICADO">Publicado</SelectItem>
                  <SelectItem value="FINALIZADO">Finalizado</SelectItem>
                  <SelectItem value="CANCELADO">Cancelado</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-2">Solo los eventos <b>publicados</b> aparecen en el catálogo y aceptan inscripciones.</p>
            </Panel>
          </PermissionGuard>
          {espacio && (
            <Panel title="Espacio" icon={<MapPin className="h-4 w-4 text-utec-green" />} accent="bg-utec-green/10">
              <p className="font-medium">{espacio.nombre}</p>
              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-sm text-muted-foreground">
                <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" />Cap. {espacio.capacidad}</span>
                {espacio.edificioNombre && <span className="flex items-center gap-1"><Building2 className="h-3.5 w-3.5" />{espacio.edificioNombre}</span>}
                {espacio.tipoEspacioNombre && <span>{espacio.tipoEspacioNombre}</span>}
              </div>
            </Panel>
          )}

          {/* Compartir y difundir (QR + calendario + afiche) */}
          <Panel title="Compartir y difundir" icon={<QrCode className="h-4 w-4 text-utec-blue" />} accent="bg-utec-blue/10" className="flex-1">
            <div className="flex h-full flex-col">
              <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center">
                {qrUrl ? <img src={qrUrl} alt="QR del evento" className="h-32 w-32 rounded-lg border" /> : <div className="h-32 w-32 rounded-lg border flex items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>}
                <p className="text-sm text-muted-foreground">Escaneá para abrir el evento e<br />inscribirte desde el celular.</p>
              </div>
              <div className="mt-4 flex flex-col gap-2 border-t pt-4">
                <Button variant="outline" size="sm" className="justify-start" asChild>
                  <a href={googleCalUrl(evento)} target="_blank" rel="noopener noreferrer"><CalendarPlus className="h-4 w-4 mr-2" />Agregar a Google Calendar</a>
                </Button>
                <Button variant="outline" size="sm" className="justify-start" onClick={() => downloadICS(evento)}><Download className="h-4 w-4 mr-2" />Descargar .ics</Button>
                <Button variant="outline" size="sm" className="justify-start" onClick={() => setAficheOpen(true)}><ImageIcon className="h-4 w-4 mr-2" />Generar afiche</Button>
              </div>
            </div>
          </Panel>
        </div>
      </div>

      <EventoFormDialog evento={evento} open={editOpen} onOpenChange={setEditOpen} onSuccess={() => { setEditOpen(false); fetchEvento(); }} />
      <NotificarEventoDialog eventoId={evento.id} open={notifyOpen} onOpenChange={setNotifyOpen} />
      <AfichePoster evento={evento} open={aficheOpen} onOpenChange={setAficheOpen} />
    </div>
  );
}
