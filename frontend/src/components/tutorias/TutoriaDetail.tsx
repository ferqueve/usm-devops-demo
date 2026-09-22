import { useCallback, useEffect, useMemo, useState } from 'react';
import { Panel } from '@/components/common/Panel';
import { MARCA } from '@/lib/design/paleta';
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
  Award, BookOpen, Building2, CalendarClock, CalendarPlus, Check, ChevronRight, Clock, Download, Edit,
  GraduationCap, Hourglass, Link2, Loader2, Lock, Mail, MapPin, Palette, QrCode, Radio, Send,
  Trash2, UserCheck, Users, Video, } from 'lucide-react';
import { toast } from 'sonner';
import PermissionGuard from '@/components/auth/PermissionGuard';
import { useRolePermissions } from '@/hooks/useRolePermissions';
import { tutoriasApi } from '@/lib/api/tutorias';
import { materiasApi } from '@/lib/api/materias';
import { espaciosApi } from '@/lib/api/spaces';
import type { Tutoria, TutoriaAgendado, TutoriaEstado } from '@/lib/types/tutorias';
import type { Materia } from '@/lib/types/materias';
import type { Espacio } from '@/lib/types/spaces';
import { TutoriaFormDialog } from './TutoriaFormDialog';
import { TutoriaFeedbackPanel } from './TutoriaFeedbackPanel';
import { TemariosPanel } from './TemariosPanel';
import { TutoriaRecursosPanel } from './TutoriaRecursosPanel';
import { EventoPatternBg, EVENTO_PATRONES } from '@/components/ui/backgrounds/eventPatterns';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { useCountdown } from '@/lib/agenda/tiempo';
import { downloadICS, googleCalUrl } from '@/lib/agenda/ics';
import { tutoriaToAgendable } from '@/lib/agenda/types';
import { CheckinScanner, ReservaQR } from './CheckinScanner';
import { useAuth } from '@/hooks/useAuth';
import { fechaHora, relativa } from '@/lib/utils/fechas';
import { ESTADO_TUTORIA, EstadoBadge, estadoDe } from '@/components/common/estados';
import { csvEscape, descargarCSV } from '@/lib/utils/csv-helpers';
import { EstadoCarga } from '@/components/common/EstadoCarga';

interface TutoriaDetailProps { tutoriaId: number }


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
          <DialogTitle className="flex items-center gap-2"><span className="p-1.5 rounded-md bg-utec-green/10 text-marca-verde-texto"><Mail className="h-4 w-4" /></span>Notificar a los agendados</DialogTitle>
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
  const { hasPermission } = useRolePermissions();
  const puedeVerAgendados = hasPermission('tutoria:ver_agendados');
  const navigate = useNavigate();
  const { user } = useAuth();
  const puedeGestionar = ['DOCENTE', 'ADMIN', 'ANALISTA'].includes(user?.rol ?? '');
  const [tutoria, setTutoria] = useState<Tutoria | null>(null);
  const [errorAgendados, setErrorAgendados] = useState<string | null>(null);
  const [agendados, setAgendados] = useState<TutoriaAgendado[]>([]);
  const [materia, setMateria] = useState<Materia | null>(null);
  const [otras, setOtras] = useState<Tutoria[]>([]);
  const [espacio, setEspacio] = useState<Espacio | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [notifyOpen, setNotifyOpen] = useState(false);
  const [savingEstado, setSavingEstado] = useState(false);
  const [scanOpen, setScanOpen] = useState(false);
  const cd = useCountdown(tutoria?.inicio);

  const fetchTutoria = useCallback(() => {
    setLoading(true);
    tutoriasApi.obtener(tutoriaId)
      .then((r) => { if (r.data) setTutoria(r.data); else setNotFound(true); })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [tutoriaId]);

  // Quien se agendó lo ve quien dicta o administra: un ESTUDIANTE que abría el
  // detalle se comía un 403.
  const fetchAgendados = useCallback(() => {
    if (!puedeVerAgendados) return;
    setErrorAgendados(null);
    tutoriasApi.agendados(tutoriaId)
      .then((r) => setAgendados(r.data ?? []))
      .catch((e: unknown) => setErrorAgendados(e instanceof Error ? e.message : 'Error de red.'));
  }, [tutoriaId, puedeVerAgendados]);

  useEffect(() => { fetchTutoria(); fetchAgendados(); }, [fetchTutoria, fetchAgendados]);

  // Contexto: materia, otras franjas de la misma materia, y el espacio reservado.
  useEffect(() => {
    if (!tutoria) return;
    let active = true;
    materiasApi.obtenerMateria(tutoria.materiaId).then((r) => { if (active) setMateria(r.data ?? null); }).catch(() => { if (active) toast.error('No se pudo cargar la materia'); });
    tutoriasApi.listar(tutoria.materiaId).then((r) => {
      if (active) setOtras((r.data ?? []).filter((t) => t.id !== tutoria.id).sort((a, b) => a.inicio.localeCompare(b.inicio)));
    }).catch(() => { if (active) toast.error('No se pudo cargar las otras franjas'); });
    if (tutoria.espacioId != null) {
      espaciosApi.obtenerEspacio(tutoria.espacioId).then((r) => { if (active) setEspacio(r.data ?? null); }).catch(() => { if (active) toast.error('No se pudo cargar el espacio'); });
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
      // Se vuelve a la materia de la que colgaba; si no se llegó a cargar, al listado.
      navigate(tutoria ? `/materias/${tutoria.materiaId}` : '/materias?tab=tutorias');
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

  const copyLink = () => navigator.clipboard?.writeText(window.location.href).then(() => toast.success('Link copiado')).catch(() => {});

  const exportCSV = () => {
    descargarCSV(
      [
        'Estudiante,Email,Agendado',
        ...agendados.map((a) =>
          [
            csvEscape(a.nombre ?? ''),
            csvEscape(a.email ?? ''),
            csvEscape(fechaHora(a.createdAt, { diaSemana: true })),
          ].join(',')
        ),
      ],
      `agendados-tutoria-${tutoriaId}.csv`
    );
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
        <button type="button" onClick={() => navigate('/materias?tab=tutorias')} className="text-sm text-muted-foreground hover:text-foreground">← Tutorías</button>
        <EmptyState icon={CalendarClock} title="Tutoría no encontrada" description="La tutoría no existe o fue eliminada." />
      </div>
    );
  }

  const badge = estadoDe(ESTADO_TUTORIA, tutoria.estado);
  const ocupados = Math.max(0, tutoria.cupo - tutoria.plazasDisponibles);
  const enEspera = agendados.filter((a) => a.estado === 'ESPERA').length;

  return (
    <div className="space-y-4">
      {/* Breadcrumb + acciones */}
      <div className="flex items-center justify-between gap-3">
        <nav className="flex items-center gap-1.5 text-sm text-muted-foreground min-w-0">
          <button type="button" onClick={() => navigate('/materias')} className="hover:text-foreground transition-colors shrink-0">Materias</button>
          <ChevronRight className="h-4 w-4 shrink-0" />
          <button
            type="button"
            onClick={() => navigate(`/materias/${tutoria.materiaId}`)}
            className="hover:text-foreground transition-colors truncate"
          >
            {tutoria.materiaNombre}
          </button>
          <ChevronRight className="h-4 w-4 shrink-0" />
          <span className="text-foreground font-medium shrink-0">Tutoría</span>
        </nav>
        {/*
          Antes eran ocho íconos seguidos sin una sola etiqueta: no había forma de
          saber qué hacía cada uno sin pasar el mouse por los ocho. Ahora las
          acciones principales dicen su nombre, las de compartir quedan agrupadas
          como íconos (glifos reconocibles) y la destructiva va separada al final.
        */}
        <div className="flex items-center gap-1 shrink-0">
          <PermissionGuard requiredPermission="tutoria:editar">
            <Button variant={tutoria.enVivo ? 'default' : 'ghost'} size="sm" onClick={toggleEnVivo} title="Marcar la tutoría como disponible ahora, sin agenda previa" className={tutoria.enVivo ? 'bg-utec-green hover:bg-utec-green/90' : ''}>
              <Radio className="h-4 w-4" /><span className="ml-1.5 hidden sm:inline">{tutoria.enVivo ? 'En vivo' : 'Walk-in'}</span>
            </Button>
          </PermissionGuard>

          <span className="mx-1 h-5 w-px bg-border" aria-hidden />

          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => downloadICS(tutoriaToAgendable(tutoria))} title="Descargar .ics"><CalendarPlus className="h-4 w-4" /></Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" asChild title="Agregar a Google Calendar"><a href={googleCalUrl(tutoriaToAgendable(tutoria))} target="_blank" rel="noopener noreferrer"><CalendarClock className="h-4 w-4" /></a></Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={copyLink} title="Copiar link"><Link2 className="h-4 w-4" /></Button>
          <PermissionGuard requiredPermission="tutoria:editar">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setScanOpen(true)} title="Check-in por QR"><QrCode className="h-4 w-4" /></Button>
          </PermissionGuard>

          <span className="mx-1 h-5 w-px bg-border" aria-hidden />

          <Button variant="ghost" size="sm" onClick={() => setNotifyOpen(true)}>
            <Mail className="h-4 w-4" /><span className="ml-1.5 hidden sm:inline">Notificar</span>
          </Button>
          <PermissionGuard requiredPermission="tutoria:editar">
            <Button variant="ghost" size="sm" onClick={() => setEditOpen(true)}>
              <Edit className="h-4 w-4" /><span className="ml-1.5 hidden sm:inline">Editar</span>
            </Button>
          </PermissionGuard>
          <PermissionGuard requiredPermission="tutoria:editar">
            <Button variant="ghost" size="icon" className="h-8 w-8 ml-1 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={eliminar} title="Eliminar tutoría"><Trash2 className="h-4 w-4" /></Button>
          </PermissionGuard>
        </div>
      </div>

      {/* Countdown con patrón animado (catálogo) */}
      {!cd.pasado && tutoria.estado === 'ABIERTA' && (
        <div className="relative overflow-hidden rounded-2xl border bg-chrome text-white px-5 py-4">
          <EventoPatternBg patron={tutoria.patron ?? 'nodos'} />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0e1320]/85 via-[#0e1320]/20 to-transparent" />
          <div className="relative flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm font-semibold"><CalendarClock className="h-4 w-4 text-marca-azul-texto" />Faltan para la tutoría</div>
            <div className="flex items-center gap-2">
              {([['Días', cd.dias], ['Horas', cd.horas], ['Min', cd.minutos], ['Seg', cd.segundos]] as const).map(([l, v]) => (
                <div key={l} className="text-center rounded-lg bg-[#1b2236] ring-1 ring-white/15 px-3 py-1.5 min-w-[60px]">
                  <div className="text-2xl font-bold tabular-nums leading-none">{String(v).padStart(2, '0')}</div>
                  <div className="text-2xs text-white/60 uppercase mt-0.5">{l}</div>
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
                            <span className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-black/45 px-1.5 py-0.5 text-2xs font-medium text-white">{p.nombre}{activo && <Check className="h-3 w-3" />}</span>
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

      {/*
        Un solo encabezado. Antes eran dos tarjetas: la identidad a la izquierda y
        cuatro tiles —Cupo, Agendados, Disponibles, Ocupación— que decían el mismo
        dato cuatro veces. Ahora la ocupación es una barra dentro del mismo bloque.
      */}
      <div className="rounded-2xl border bg-card p-5">
        <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold leading-tight">{tutoria.materiaNombre}</h1>
              <EstadoBadge estado={badge} className="text-xs" />
            </div>

            <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <GraduationCap className="h-4 w-4" />{tutoria.docenteNombre}
              </span>
              <span className="flex items-center gap-1.5">
                <CalendarClock className="h-4 w-4" />{fechaHora(tutoria.inicio, { diaSemana: true })}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="h-4 w-4" />
                {formatHora(tutoria.inicio)}–{formatHora(tutoria.fin)} · {duracion(tutoria.inicio, tutoria.fin)}
              </span>
              {tutoria.modalidad === 'VIRTUAL' ? (
                <span className="flex items-center gap-1.5 text-marca-cian-texto">
                  <Video className="h-4 w-4" />Virtual
                  {tutoria.enlace && (
                    <a href={tutoria.enlace} target="_blank" rel="noopener noreferrer" className="hover:underline">· unirse</a>
                  )}
                </span>
              ) : tutoria.espacioNombre && (
                <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4" />{tutoria.espacioNombre}</span>
              )}
            </p>

            <p className="mt-1.5 flex flex-wrap items-center gap-2 text-sm">
              <span className="font-medium">{relativa(tutoria.inicio)}</span>
              <span className="text-muted-foreground">·</span>
              <span className="text-muted-foreground">
                {tutoria.tipo === 'INDIVIDUAL' ? 'Tutoría individual (1 a 1)' : 'Tutoría grupal'}
              </span>
              {tutoria.tags?.split(',').map((t) => t.trim()).filter(Boolean).map((t) => (
                <span key={t} className="inline-flex items-center rounded-full bg-utec-blue/10 text-marca-azul-texto px-2 py-0.5 text-xs font-medium">
                  {t.toLowerCase() === 'mate' ? '🧉 mate' : t}
                </span>
              ))}
            </p>
          </div>

          {/* Ocupación: una barra en vez de cuatro tiles. */}
          <div className="w-full sm:w-64 shrink-0">
            <div className="flex items-baseline justify-between gap-3 mb-1.5">
              <p className="text-sm">
                <span className="text-2xl font-bold tabular-nums leading-none">{ocupados}</span>
                <span className="text-muted-foreground"> de {tutoria.cupo} lugares</span>
              </p>
              <span className={`text-sm font-semibold tabular-nums ${tutoria.plazasDisponibles > 0 ? 'text-marca-verde-texto' : 'text-marca-naranja-texto'}`}>
                {tutoria.plazasDisponibles > 0
                  ? `${tutoria.plazasDisponibles} libre${tutoria.plazasDisponibles === 1 ? '' : 's'}`
                  : 'Completo'}
              </span>
            </div>
            <div className="h-2.5 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-utec-blue transition-all"
                style={{ width: `${ocupacion}%` }}
                role="progressbar"
                aria-valuenow={ocupacion}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="Ocupación de la tutoría"
              />
            </div>
            {enEspera > 0 && (
              <p className="mt-1.5 flex items-center gap-1.5 text-xs text-marca-naranja-texto">
                <Users className="h-3.5 w-3.5" />{enEspera} en lista de espera
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Agendados + estado */}
      <div className="grid gap-4 lg:grid-cols-3 items-start">
        <div className="lg:col-span-2 space-y-4">
          {puedeGestionar && (
            <TemariosPanel
              tutoriaId={tutoriaId}
              materiaNombre={tutoria.materiaNombre}
              refreshKey={agendados.length}
            />
          )}
          <Panel
            title={`Agendados · ${agendados.filter((a) => a.estado !== 'ESPERA').length}`}
            icon={<Users className="size-4" />}
            accentColor={MARCA.azul}
            acciones={(
              agendados.length > 0
                ? <Button variant="ghost" size="sm" className="h-7" onClick={exportCSV}><Download className="h-3.5 w-3.5 mr-1.5" />CSV</Button>
                : null
            )}
          >
            {errorAgendados ? (
              <EstadoCarga cargando={false} error={errorAgendados} alReintentar={fetchAgendados}>
                {null}
              </EstadoCarga>
            ) : agendados.length === 0 ? (
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
                        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${presente ? 'bg-utec-green/15 text-marca-verde-texto' : 'bg-utec-blue/10 text-marca-azul-texto'}`}>{a.nombre?.slice(0, 2).toUpperCase()}</span>
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
                              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-utec-yellow/20 text-marca-tinta text-xs font-semibold">{a.nombre?.slice(0, 2).toUpperCase()}</span>
                              <span className="block truncate text-sm font-medium">{a.nombre}</span>
                            </span>
                            <Badge className="bg-utec-yellow text-marca-tinta border-utec-yellow text-2xs">En espera</Badge>
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
            <Panel title={`Otras tutorías de ${materia?.nombre ?? 'la materia'} · ${otras.length}`} icon={<CalendarClock className="size-4" />} accentColor={MARCA.azul}>
              <ul className="space-y-2">
                {otras.map((t) => {
                  const b = estadoDe(ESTADO_TUTORIA, t.estado);
                  return (
                    <li key={t.id}>
                      <button type="button" onClick={() => navigate(`/tutorias/${t.id}`)} className="w-full text-left rounded-lg border p-3 transition-colors hover:border-utec-blue/40">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-medium flex items-center gap-1.5"><CalendarClock className="h-3.5 w-3.5 text-marca-azul-texto" />{fechaHora(t.inicio, { diaSemana: true })}</span>
                          <EstadoBadge estado={b} className="shrink-0 text-2xs" />
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{Math.max(0, t.cupo - t.plazasDisponibles)}/{t.cupo} agendados · {relativa(t.inicio)}</p>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </Panel>
          )}
        </div>
        <div className="space-y-4">
          {/* La dona de ocupación vivía acá y repetía por quinta vez el mismo dato
              que ya cuenta la barra del encabezado. */}
          <PermissionGuard requiredPermission="tutoria:editar">
            <Panel title="Estado" icon={<Lock className="size-4" />} accentColor={MARCA.naranja}>
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
              icon={<BookOpen className="size-4" />}
              accentColor={MARCA.azul}
              acciones={<Button variant="ghost" size="sm" className="h-7" onClick={() => navigate(`/materias/${materia.id}`)}>Ver<ChevronRight className="h-3.5 w-3.5 ml-0.5" /></Button>}
            >
              <p className="font-medium">{materia.nombre}</p>
              {materia.carreraNombre && (
                <Badge className="bg-utec-blue/10 text-marca-azul-texto border-utec-blue/20 border text-xs font-medium mt-1">{materia.carreraNombre}</Badge>
              )}
              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-sm text-muted-foreground">
                {materia.docenteNombre && <span className="flex items-center gap-1"><GraduationCap className="h-3.5 w-3.5" />{materia.docenteNombre}</span>}
                {materia.creditos != null && <span className="flex items-center gap-1"><Award className="h-3.5 w-3.5" />{materia.creditos} créditos</span>}
                <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" />{materia.totalInscriptos ?? 0} inscriptos</span>
              </div>
            </Panel>
          )}

          {espacio && (
            <Panel title="Espacio" icon={<MapPin className="size-4" />} accentColor={MARCA.verde}>
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
