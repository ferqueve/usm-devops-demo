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
  Award, BookOpen, Building2, CalendarClock, CalendarPlus, Check, CheckCircle, ChevronRight, Clock, Download, Edit,
  GraduationCap, Hourglass, Link2, Loader2, Lock, Mail, MapPin, Palette, QrCode, Radio, Send, Sparkles,
  Trash2, UserCheck, Users, Video, XCircle,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { toast } from 'sonner';
import PermissionGuard from '@/components/auth/PermissionGuard';
import { tutoriasApi } from '@/lib/api/tutorias';
import { materiasApi } from '@/lib/api/materias';
import { espaciosApi } from '@/lib/api/spaces';
import type { Tutoria, TutoriaAgendado, TutoriaEstado } from '@/lib/types/tutorias';
import type { Materia } from '@/lib/types/materias';
import type { Espacio } from '@/lib/types/spaces';
import { TutoriaFormDialog } from './TutoriaFormDialog';
import { TutoriaFeedbackPanel } from './TutoriaFeedbackPanel';
import { TutoriaRecursosPanel } from './TutoriaRecursosPanel';
import { EventoPatternBg, EVENTO_PATRONES } from '@/components/ui/backgrounds/eventPatterns';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { useCountdown } from '@/components/eventos/eventoUtils';
import { downloadICS, googleCalUrl } from './tutoriaCalendar';
import { CheckinScanner, ReservaQR } from './CheckinScanner';
import { postResumenTemario } from '@/lib/api/ai';
import { useAuth } from '@/hooks/useAuth';

interface TutoriaDetailProps { tutoriaId: number }

const TUTORIA_BADGE: Record<TutoriaEstado, { label: string; color: string; icon: LucideIcon }> = {
  ABIERTA: { label: 'Abierta', color: 'bg-utec-green text-white border-utec-green', icon: CheckCircle },
  CERRADA: { label: 'Cerrada', color: 'bg-utec-dark text-white border-utec-dark', icon: Lock },
  CANCELADA: { label: 'Cancelada', color: 'bg-utec-red text-white border-utec-red', icon: XCircle },
};

function formatFecha(iso?: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('es-UY', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}
function formatHora(iso?: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleTimeString('es-UY', { hour: '2-digit', minute: '2-digit' });
}
function duracion(inicio: string, fin: string): string {
  const ms = new Date(fin).getTime() - new Date(inicio).getTime();
  if (Number.isNaN(ms) || ms <= 0) return '';
  const mins = Math.round(ms / 60000);
  const h = Math.floor(mins / 60); const m = mins % 60;
  return `${h > 0 ? `${h}h ` : ''}${m > 0 ? `${m}min` : (h > 0 ? '' : '0min')}`.trim();
}
function relativo(iso: string): string {
  const diff = new Date(iso).getTime() - Date.now();
  const dias = Math.round(diff / 86400000);
  if (dias === 0) return 'Hoy';
  if (dias === 1) return 'Mañana';
  if (dias === -1) return 'Ayer';
  if (dias > 1) return `En ${dias} días`;
  return `Hace ${Math.abs(dias)} días`;
}

type TileVariant = 'blue' | 'yellow' | 'cyan' | 'green' | 'purple';
const TILE_CLS: Record<TileVariant, string> = {
  blue: 'bg-utec-blue text-white', yellow: 'bg-utec-yellow text-utec-dark',
  cyan: 'bg-utec-cyan text-utec-dark', green: 'bg-utec-green text-white', purple: 'bg-utec-blue text-white',
};
function StatTile({ icon: Icon, label, value, variant }: Readonly<{ icon: LucideIcon; label: string; value: ReactNode; variant: TileVariant }>) {
  return (
    <div className={`relative overflow-hidden rounded-2xl p-4 ${TILE_CLS[variant]}`}>
      <Icon className="absolute -right-3 -bottom-3 h-16 w-16 opacity-15" />
      <div className="relative">
        <div className="text-3xl font-bold tabular-nums leading-none">{value}</div>
        <div className="text-xs font-medium opacity-80 mt-1.5">{label}</div>
      </div>
    </div>
  );
}
function Panel({ title, icon, accent, action, children }: Readonly<{ title: string; icon: ReactNode; accent: string; action?: ReactNode; children: ReactNode }>) {
  return (
    <div className="rounded-2xl border bg-card overflow-hidden">
      <div className="flex items-center gap-2.5 px-4 py-3 border-b">
        <span className={`flex h-7 w-7 items-center justify-center rounded-lg ${accent}`}>{icon}</span>
        <h3 className="text-sm font-semibold">{title}</h3>
        {action && <div className="ml-auto">{action}</div>}
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}
function Donut({ value }: Readonly<{ value: number }>) {
  const r = 26; const circ = 2 * Math.PI * r;
  const off = circ * (1 - Math.min(100, Math.max(0, value)) / 100);
  return (
    <div className="relative h-16 w-16 shrink-0">
      <svg viewBox="0 0 64 64" className="h-16 w-16 -rotate-90">
        <circle cx="32" cy="32" r={r} fill="none" strokeWidth="8" className="stroke-muted" />
        <circle cx="32" cy="32" r={r} fill="none" strokeWidth="8" strokeLinecap="round" className="stroke-utec-blue" strokeDasharray={circ} strokeDashoffset={off} />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center text-sm font-bold tabular-nums">{value}%</div>
    </div>
  );
}
function NotificarTutoriaDialog({ tutoriaId, open, onOpenChange }: Readonly<{ tutoriaId: number; open: boolean; onOpenChange: (v: boolean) => void }>) {
  const [asunto, setAsunto] = useState('Aviso de tutoría');
  const [mensaje, setMensaje] = useState('');
  const [sending, setSending] = useState(false);
  const enviar = async () => {
    if (!mensaje.trim()) { toast.error('Escribí un mensaje'); return; }
    try {
      setSending(true);
      const r = await tutoriasApi.notificar(tutoriaId, { asunto, mensaje });
      const { enviados = 0, total = 0 } = r.data ?? {};
      if (enviados > 0) toast.success(`Enviado a ${enviados}/${total} agendados`);
      else toast.warning('No se envió ningún email', { description: 'Puede que no haya agendados o el email no esté disponible.' });
      onOpenChange(false);
    } catch (e: unknown) {
      toast.error('No se pudo notificar', { description: e instanceof Error ? e.message : 'Error' });
    } finally { setSending(false); }
  };
  return (
    <Dialog open={open} onOpenChange={(v) => (sending ? undefined : onOpenChange(v))}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><span className="p-1.5 rounded-md bg-utec-green/10 text-utec-green"><Mail className="h-4 w-4" /></span>Notificar a los agendados</DialogTitle>
          <DialogDescription>Se enviará un email a los estudiantes anotados en esta tutoría.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="space-y-2"><Label htmlFor="t-asunto">Asunto</Label><Input id="t-asunto" value={asunto} onChange={(e) => setAsunto(e.target.value)} disabled={sending} /></div>
          <div className="space-y-2"><Label htmlFor="t-msg">Mensaje</Label>
            <textarea id="t-msg" rows={4} value={mensaje} onChange={(e) => setMensaje(e.target.value)} disabled={sending} placeholder="Ej: se cambia el aula…" className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-y" />
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

export function TutoriaDetail({ tutoriaId }: Readonly<TutoriaDetailProps>) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const puedeGestionar = ['DOCENTE', 'ADMIN', 'ANALISTA'].includes(user?.rol ?? '');
  const [tutoria, setTutoria] = useState<Tutoria | null>(null);
  const [agendados, setAgendados] = useState<TutoriaAgendado[]>([]);
  const [materia, setMateria] = useState<Materia | null>(null);
  const [otras, setOtras] = useState<Tutoria[]>([]);
  const [espacio, setEspacio] = useState<Espacio | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [notifyOpen, setNotifyOpen] = useState(false);
  const [savingEstado, setSavingEstado] = useState(false);
  const [resumenIA, setResumenIA] = useState<string | null>(null);
  const [resumenLoading, setResumenLoading] = useState(false);
  const [scanOpen, setScanOpen] = useState(false);
  const cd = useCountdown(tutoria?.inicio);

  const fetchTutoria = useCallback(() => {
    setLoading(true);
    tutoriasApi.obtener(tutoriaId)
      .then((r) => { if (r.data) setTutoria(r.data); else setNotFound(true); })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [tutoriaId]);

  const fetchAgendados = useCallback(() => {
    tutoriasApi.agendados(tutoriaId).then((r) => setAgendados(r.data ?? [])).catch(() => { /* noop */ });
  }, [tutoriaId]);

  useEffect(() => { fetchTutoria(); fetchAgendados(); }, [fetchTutoria, fetchAgendados]);

  // Contexto: materia, otras franjas de la misma materia, y el espacio reservado.
  useEffect(() => {
    if (!tutoria) return;
    let active = true;
    materiasApi.obtenerMateria(tutoria.materiaId).then((r) => { if (active) setMateria(r.data ?? null); }).catch(() => { /* noop */ });
    tutoriasApi.listar(tutoria.materiaId).then((r) => {
      if (active) setOtras((r.data ?? []).filter((t) => t.id !== tutoria.id).sort((a, b) => a.inicio.localeCompare(b.inicio)));
    }).catch(() => { /* noop */ });
    if (tutoria.espacioId != null) {
      espaciosApi.obtenerEspacio(tutoria.espacioId).then((r) => { if (active) setEspacio(r.data ?? null); }).catch(() => { /* noop */ });
    } else {
      setEspacio(null);
    }
    return () => { active = false; };
  }, [tutoria]);

  const cambiarEstado = async (estado: TutoriaEstado) => {
    try {
      setSavingEstado(true);
      await tutoriasApi.actualizar(tutoriaId, { estado });
      toast.success(`Tutoría ${estado.toLowerCase()}`);
      fetchTutoria();
    } catch (e: unknown) {
      toast.error('No se pudo cambiar el estado', { description: e instanceof Error ? e.message : 'Error' });
    } finally { setSavingEstado(false); }
  };

  const eliminar = async () => {
    try {
      await tutoriasApi.eliminar(tutoriaId);
      toast.success('Tutoría eliminada');
      navigate('/tutorias');
    } catch (e: unknown) {
      toast.error('No se pudo eliminar', { description: e instanceof Error ? e.message : 'Error' });
    }
  };

  const cambiarPatron = async (patron: string) => {
    setTutoria((prev) => (prev ? { ...prev, patron } : prev));
    try { await tutoriasApi.actualizar(tutoriaId, { patron }); }
    catch (e: unknown) { toast.error('No se pudo cambiar el patrón', { description: e instanceof Error ? e.message : 'Error' }); fetchTutoria(); }
  };
  const toggleEnVivo = async () => {
    if (!tutoria) return;
    try { const r = await tutoriasApi.toggleEnVivo(tutoriaId, !tutoria.enVivo); if (r.data) setTutoria(r.data); }
    catch (e: unknown) { toast.error('No se pudo cambiar', { description: e instanceof Error ? e.message : 'Error' }); }
  };
  const toggleAsistencia = async (a: TutoriaAgendado) => {
    const asistio = a.estado !== 'ASISTIO';
    try { await tutoriasApi.marcarAsistencia(a.reservaId, asistio); fetchAgendados(); fetchTutoria(); }
    catch (e: unknown) { toast.error('No se pudo marcar asistencia', { description: e instanceof Error ? e.message : 'Error' }); }
  };
  const onScanReserva = async (reservaId: number) => {
    const a = agendados.find((x) => x.reservaId === reservaId);
    try {
      await tutoriasApi.marcarAsistencia(reservaId, true);
      toast.success('Asistencia registrada', { description: a?.nombre ?? `Reserva #${reservaId}` });
      fetchAgendados(); fetchTutoria();
    } catch (e: unknown) { toast.error('No se pudo registrar', { description: e instanceof Error ? e.message : 'Error' }); }
  };
  const resumirTemarios = async () => {
    const temas = agendados.map((a) => a.temario).filter(Boolean) as string[];
    if (temas.length === 0) { toast.info('Todavía nadie anotó qué quiere repasar'); return; }
    try {
      setResumenLoading(true);
      const r = await postResumenTemario({ materia: tutoria?.materiaNombre, temarios: temas });
      const txt = (r.data as { resumen?: string } | undefined)?.resumen;
      if (txt) setResumenIA(txt);
      else toast.error('La IA no está disponible', { description: 'Verificá que ai-svc esté arriba.' });
    } catch (e: unknown) { toast.error('No se pudo resumir', { description: e instanceof Error ? e.message : 'Error' }); }
    finally { setResumenLoading(false); }
  };

  const copyLink = () => navigator.clipboard?.writeText(window.location.href).then(() => toast.success('Link copiado')).catch(() => {});

  const exportCSV = () => {
    const esc = (v: string) => `"${(v ?? '').replace(/"/g, '""')}"`;
    const rows = agendados.map((a) => [esc(a.nombre ?? ''), esc(a.email ?? ''), esc(formatFecha(a.createdAt))].join(',')).join('\n');
    const blob = new Blob([`﻿Estudiante,Email,Agendado\n${rows}`], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `agendados-tutoria-${tutoriaId}.csv`; a.click(); URL.revokeObjectURL(url);
  };

  const ocupacion = useMemo(() => {
    if (!tutoria || tutoria.cupo <= 0) return 0;
    return Math.round(((tutoria.cupo - tutoria.plazasDisponibles) / tutoria.cupo) * 100);
  }, [tutoria]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-6 w-48" />
        <div className="grid gap-4 lg:grid-cols-3"><Skeleton className="h-44 rounded-2xl" /><Skeleton className="h-44 rounded-2xl lg:col-span-2" /></div>
        <Skeleton className="h-56 rounded-2xl" />
      </div>
    );
  }
  if (notFound || !tutoria) {
    return (
      <div className="space-y-6">
        <button type="button" onClick={() => navigate('/tutorias')} className="text-sm text-muted-foreground hover:text-foreground">← Tutorías</button>
        <EmptyState icon={CalendarClock} title="Tutoría no encontrada" description="La tutoría no existe o fue eliminada." />
      </div>
    );
  }

  const badge = TUTORIA_BADGE[tutoria.estado];
  const BadgeIcon = badge.icon;
  const ocupados = Math.max(0, tutoria.cupo - tutoria.plazasDisponibles);

  return (
    <div className="space-y-4">
      {/* Breadcrumb + acciones */}
      <div className="flex items-center justify-between gap-3">
        <nav className="flex items-center gap-1.5 text-sm text-muted-foreground min-w-0">
          <button type="button" onClick={() => navigate('/tutorias')} className="hover:text-foreground">Tutorías</button>
          <ChevronRight className="h-4 w-4 shrink-0" />
          <span className="text-foreground font-medium truncate">{tutoria.materiaNombre}</span>
        </nav>
        <div className="flex items-center gap-1 shrink-0">
          <PermissionGuard requiredPermission="tutoria:editar">
            <Button variant={tutoria.enVivo ? 'default' : 'ghost'} size="sm" onClick={toggleEnVivo} title="Disponible en vivo (walk-in)" className={tutoria.enVivo ? 'bg-utec-green hover:bg-utec-green/90' : ''}>
              <Radio className="h-4 w-4" />{tutoria.enVivo && <span className="ml-1 text-xs">En vivo</span>}
            </Button>
          </PermissionGuard>
          <Button variant="ghost" size="sm" onClick={() => downloadICS(tutoria)} title="Agregar a calendario (.ics)"><CalendarPlus className="h-4 w-4" /></Button>
          <Button variant="ghost" size="sm" asChild title="Agregar a Google Calendar"><a href={googleCalUrl(tutoria)} target="_blank" rel="noopener noreferrer"><CalendarClock className="h-4 w-4" /></a></Button>
          <Button variant="ghost" size="sm" onClick={copyLink} title="Copiar link"><Link2 className="h-4 w-4" /></Button>
          <PermissionGuard requiredPermission="tutoria:editar"><Button variant="ghost" size="sm" onClick={() => setScanOpen(true)} title="Check-in por QR"><QrCode className="h-4 w-4" /></Button></PermissionGuard>
          <Button variant="ghost" size="sm" onClick={() => setNotifyOpen(true)} title="Notificar agendados"><Mail className="h-4 w-4" /></Button>
          <PermissionGuard requiredPermission="tutoria:editar"><Button variant="ghost" size="sm" onClick={() => setEditOpen(true)} title="Editar"><Edit className="h-4 w-4" /></Button></PermissionGuard>
          <PermissionGuard requiredPermission="tutoria:editar"><Button variant="ghost" size="sm" onClick={eliminar} title="Eliminar" className="text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /></Button></PermissionGuard>
        </div>
      </div>

      {/* Countdown con patrón animado (catálogo) */}
      {!cd.pasado && tutoria.estado === 'ABIERTA' && (
        <div className="relative overflow-hidden rounded-2xl border bg-utec-dark text-white px-5 py-4">
          <EventoPatternBg patron={tutoria.patron ?? 'nodos'} />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0e1320]/85 via-[#0e1320]/20 to-transparent" />
          <div className="relative flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm font-semibold"><CalendarClock className="h-4 w-4 text-utec-blue" />Faltan para la tutoría</div>
            <div className="flex items-center gap-2">
              {([['Días', cd.dias], ['Horas', cd.horas], ['Min', cd.minutos], ['Seg', cd.segundos]] as const).map(([l, v]) => (
                <div key={l} className="text-center rounded-lg bg-[#1b2236] ring-1 ring-white/15 px-3 py-1.5 min-w-[60px]">
                  <div className="text-2xl font-bold tabular-nums leading-none">{String(v).padStart(2, '0')}</div>
                  <div className="text-[10px] text-white/60 uppercase mt-0.5">{l}</div>
                </div>
              ))}
              <PermissionGuard requiredPermission="tutoria:editar">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-white/70 hover:text-white hover:bg-white/10" title="Cambiar patrón de fondo"><Palette className="h-4 w-4" /></Button>
                  </PopoverTrigger>
                  <PopoverContent align="end" className="w-72 p-2 max-h-[60vh] overflow-y-auto">
                    <p className="px-1 pb-1.5 text-xs font-semibold text-muted-foreground">Patrón de fondo · {EVENTO_PATRONES.length} estilos</p>
                    <div className="grid grid-cols-2 gap-1.5">
                      {EVENTO_PATRONES.map((p) => {
                        const activo = (tutoria.patron ?? 'nodos') === p.id;
                        return (
                          <button key={p.id} type="button" onClick={() => cambiarPatron(p.id)} className={`relative h-14 overflow-hidden rounded-lg border text-left transition-shadow ${activo ? 'ring-2 ring-utec-blue' : 'hover:ring-1 hover:ring-utec-blue/50'}`}>
                            <EventoPatternBg patron={p.id} />
                            <span className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-black/45 px-1.5 py-0.5 text-[10px] font-medium text-white">{p.nombre}{activo && <Check className="h-3 w-3" />}</span>
                          </button>
                        );
                      })}
                    </div>
                  </PopoverContent>
                </Popover>
              </PermissionGuard>
            </div>
          </div>
        </div>
      )}

      {/* Identidad + tiles */}
      <div className="grid gap-4 lg:grid-cols-3 items-stretch">
        <div className="rounded-2xl border bg-card p-5 flex flex-col">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-utec-blue/10 text-utec-blue mb-3"><CalendarClock className="h-6 w-6" /></div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-bold leading-tight">{tutoria.materiaNombre}</h1>
            <Badge className={`${badge.color} border font-medium text-xs`}><BadgeIcon className="h-3.5 w-3.5 mr-1.5" />{badge.label}</Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-2 flex items-center gap-1.5"><GraduationCap className="h-4 w-4" />{tutoria.docenteNombre}</p>
          <div className="mt-3 space-y-1.5 text-sm">
            <p className="flex items-center gap-1.5"><CalendarClock className="h-4 w-4 text-utec-blue" />{formatFecha(tutoria.inicio)}</p>
            <p className="flex items-center gap-1.5 text-muted-foreground"><Clock className="h-4 w-4" />{formatHora(tutoria.inicio)}–{formatHora(tutoria.fin)} · {duracion(tutoria.inicio, tutoria.fin)} · <span className="font-medium text-foreground">{relativo(tutoria.inicio)}</span></p>
            {tutoria.modalidad === 'VIRTUAL'
              ? <p className="flex items-center gap-1.5"><Video className="h-4 w-4 text-utec-cyan" />Virtual{tutoria.enlace && <a href={tutoria.enlace} target="_blank" rel="noopener noreferrer" className="text-utec-cyan hover:underline">· unirse</a>}</p>
              : tutoria.espacioNombre && <p className="flex items-center gap-1.5 text-muted-foreground"><MapPin className="h-4 w-4" />{tutoria.espacioNombre}</p>}
            <p className="flex items-center gap-1.5 text-muted-foreground text-xs">{tutoria.tipo === 'INDIVIDUAL' ? 'Tutoría individual (1 a 1)' : 'Tutoría grupal'}</p>
          </div>
          {tutoria.tags && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {tutoria.tags.split(',').map((t) => t.trim()).filter(Boolean).map((t) => (
                <span key={t} className="inline-flex items-center rounded-full bg-utec-blue/10 text-utec-blue px-2 py-0.5 text-xs font-medium">{t.toLowerCase() === 'mate' ? '🧉 mate' : t}</span>
              ))}
            </div>
          )}
        </div>
        <div className="lg:col-span-2 grid grid-cols-2 gap-4">
          <StatTile icon={Users} label="Cupo" value={tutoria.cupo} variant="purple" />
          <StatTile icon={CheckCircle} label="Agendados" value={ocupados} variant="blue" />
          <StatTile icon={Users} label="Disponibles" value={tutoria.plazasDisponibles} variant="green" />
          <StatTile icon={CalendarClock} label="Ocupación" value={`${ocupacion}%`} variant="cyan" />
        </div>
      </div>

      {/* Agendados + estado */}
      <div className="grid gap-4 lg:grid-cols-3 items-start">
        <div className="lg:col-span-2 space-y-4">
          <Panel
            title={`Agendados · ${agendados.filter((a) => a.estado !== 'ESPERA').length}`}
            icon={<Users className="h-4 w-4 text-utec-blue" />}
            accent="bg-utec-blue/10"
            action={(
              <div className="flex items-center gap-1">
                {agendados.some((a) => a.temario) && (
                  <Button variant="ghost" size="sm" className="h-7" onClick={resumirTemarios} disabled={resumenLoading} title="Resumir temas con IA">
                    {resumenLoading ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5 mr-1.5 text-utec-orange" />}Resumir IA
                  </Button>
                )}
                {agendados.length > 0 && <Button variant="ghost" size="sm" className="h-7" onClick={exportCSV}><Download className="h-3.5 w-3.5 mr-1.5" />CSV</Button>}
              </div>
            )}
          >
            {resumenIA && (
              <div className="mb-3 rounded-lg border border-utec-orange/30 bg-utec-orange/5 p-3 text-sm">
                <p className="flex items-center gap-1.5 font-medium text-utec-orange mb-1"><Sparkles className="h-3.5 w-3.5" />Resumen de temas (IA)</p>
                <p className="text-muted-foreground leading-relaxed">{resumenIA}</p>
              </div>
            )}
            {agendados.length === 0 ? (
              <p className="text-sm text-muted-foreground py-2">Nadie se agendó todavía.</p>
            ) : (() => {
              const confirmados = agendados.filter((a) => a.estado !== 'ESPERA');
              const espera = agendados.filter((a) => a.estado === 'ESPERA');
              const fila = (a: TutoriaAgendado) => {
                const presente = a.estado === 'ASISTIO';
                return (
                  <li key={a.reservaId} className="rounded-lg border p-3">
                    <div className="flex items-center justify-between gap-3">
                      <span className="flex items-center gap-2 min-w-0">
                        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${presente ? 'bg-utec-green/15 text-utec-green' : 'bg-utec-blue/10 text-utec-blue'}`}>{a.nombre?.slice(0, 2).toUpperCase()}</span>
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-medium">{a.nombre}{a.confirmada && <span title="Confirmó asistencia"> ✓</span>}</span>
                          <span className="block truncate text-xs text-muted-foreground">{a.email}</span>
                        </span>
                      </span>
                      <span className="flex items-center gap-1 shrink-0">
                        <ReservaQR reservaId={a.reservaId} nombre={a.nombre ?? ''} />
                        <PermissionGuard requiredPermission="tutoria:editar">
                          <Button variant={presente ? 'default' : 'outline'} size="sm" className="h-7 text-xs" onClick={() => toggleAsistencia(a)}>
                            <UserCheck className="h-3.5 w-3.5 mr-1" />{presente ? 'Presente' : 'Check-in'}
                          </Button>
                        </PermissionGuard>
                      </span>
                    </div>
                    {a.temario && <p className="mt-2 text-xs text-muted-foreground border-l-2 border-utec-blue/40 pl-2">📋 {a.temario}</p>}
                  </li>
                );
              };
              return (
                <div className="space-y-3">
                  <ul className="space-y-2">{confirmados.map(fila)}</ul>
                  {espera.length > 0 && (
                    <div className="pt-1">
                      <p className="text-xs font-semibold text-muted-foreground uppercase flex items-center gap-1.5 mb-2"><Hourglass className="h-3.5 w-3.5" />Lista de espera · {espera.length}</p>
                      <ul className="space-y-2">
                        {espera.map((a) => (
                          <li key={a.reservaId} className="flex items-center justify-between gap-3 rounded-lg border border-dashed p-3 opacity-80">
                            <span className="flex items-center gap-2 min-w-0">
                              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-utec-yellow/20 text-utec-dark text-xs font-semibold">{a.nombre?.slice(0, 2).toUpperCase()}</span>
                              <span className="block truncate text-sm font-medium">{a.nombre}</span>
                            </span>
                            <Badge className="bg-utec-yellow text-utec-dark border-utec-yellow text-[10px]">En espera</Badge>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              );
            })()}
          </Panel>

          <TutoriaRecursosPanel tutoriaId={tutoria.id} canEdit={puedeGestionar} />
          <TutoriaFeedbackPanel tutoriaId={tutoria.id} />

          {otras.length > 0 && (
            <Panel title={`Otras tutorías de ${materia?.nombre ?? 'la materia'} · ${otras.length}`} icon={<CalendarClock className="h-4 w-4 text-utec-blue" />} accent="bg-utec-blue/10">
              <ul className="space-y-2">
                {otras.map((t) => {
                  const b = TUTORIA_BADGE[t.estado];
                  const BI = b.icon;
                  return (
                    <li key={t.id}>
                      <button type="button" onClick={() => navigate(`/tutorias/${t.id}`)} className="w-full text-left rounded-lg border p-3 transition-colors hover:border-utec-blue/40">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-medium flex items-center gap-1.5"><CalendarClock className="h-3.5 w-3.5 text-utec-blue" />{formatFecha(t.inicio)}</span>
                          <Badge className={`${b.color} border font-medium text-[10px] shrink-0`}><BI className="h-3 w-3 mr-1" />{b.label}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{Math.max(0, t.cupo - t.plazasDisponibles)}/{t.cupo} agendados · {relativo(t.inicio)}</p>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </Panel>
          )}
        </div>
        <div className="space-y-4">
          <Panel title="Ocupación" icon={<CalendarClock className="h-4 w-4 text-utec-blue" />} accent="bg-utec-blue/10">
            <div className="flex items-center gap-3">
              <Donut value={ocupacion} />
              <div className="text-sm"><p className="font-medium">{ocupados}/{tutoria.cupo} plazas</p><p className="text-muted-foreground text-xs">{tutoria.plazasDisponibles} disponibles</p></div>
            </div>
          </Panel>
          <PermissionGuard requiredPermission="tutoria:editar">
            <Panel title="Estado" icon={<Lock className="h-4 w-4 text-utec-orange" />} accent="bg-utec-orange/10">
              <Select value={tutoria.estado} onValueChange={(v) => cambiarEstado(v as TutoriaEstado)} disabled={savingEstado}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ABIERTA">Abierta</SelectItem>
                  <SelectItem value="CERRADA">Cerrada</SelectItem>
                  <SelectItem value="CANCELADA">Cancelada</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-2">Solo las tutorías <b>abiertas</b> aceptan nuevos agendados.</p>
            </Panel>
          </PermissionGuard>

          {materia && (
            <Panel
              title="Materia"
              icon={<BookOpen className="h-4 w-4 text-utec-blue" />}
              accent="bg-utec-blue/10"
              action={<Button variant="ghost" size="sm" className="h-7" onClick={() => navigate(`/materias/${materia.id}`)}>Ver<ChevronRight className="h-3.5 w-3.5 ml-0.5" /></Button>}
            >
              <p className="font-medium">{materia.nombre}</p>
              {materia.carreraNombre && (
                <Badge className="bg-utec-blue/10 text-utec-blue border-utec-blue/20 border text-xs font-medium mt-1">{materia.carreraNombre}</Badge>
              )}
              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-sm text-muted-foreground">
                {materia.docenteNombre && <span className="flex items-center gap-1"><GraduationCap className="h-3.5 w-3.5" />{materia.docenteNombre}</span>}
                {materia.creditos != null && <span className="flex items-center gap-1"><Award className="h-3.5 w-3.5" />{materia.creditos} créditos</span>}
                <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" />{materia.totalInscriptos ?? 0} inscriptos</span>
              </div>
            </Panel>
          )}

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
        </div>
      </div>

      <TutoriaFormDialog tutoria={tutoria} open={editOpen} onOpenChange={setEditOpen} onSuccess={() => { setEditOpen(false); fetchTutoria(); }} />
      <NotificarTutoriaDialog tutoriaId={tutoria.id} open={notifyOpen} onOpenChange={setNotifyOpen} />
      <CheckinScanner open={scanOpen} onOpenChange={setScanOpen} onDetect={onScanReserva} />
    </div>
  );
}
