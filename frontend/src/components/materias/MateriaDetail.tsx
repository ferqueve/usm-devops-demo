import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Award, BookOpen, CalendarClock, CheckCircle, ChevronRight, Download, Edit, FolderOpen,
  GraduationCap, Layers, Link2, Loader2, Lock, Mail, MapPin, Plus, RotateCcw, Search, Trash2, UserPlus, Users, XCircle,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { toast } from 'sonner';
import { useRolePermissions } from '@/hooks/useRolePermissions';
import PermissionGuard from '@/components/auth/PermissionGuard';
import { useAuth } from '@/hooks/useAuth';
import { materiasApi } from '@/lib/api/materias';
import type { Inscripcion, Materia } from '@/lib/types/materias';
import type { Tutoria, TutoriaEstado } from '@/lib/types/tutorias';
import type { Recurso } from '@/lib/types/recursos';
import { useTutorias } from '@/hooks/useTutorias';
import { useRecursos } from '@/hooks/useRecursos';
import { RecursosPanel } from '@/components/recursos/RecursosPanel';
import { MateriaFormDialog } from './MateriaFormDialog';
import { DeleteMateriaDialog } from './DeleteMateriaDialog';
import { TutoriaFormDialog } from '@/components/tutorias/TutoriaFormDialog';
import { AddInscriptoDialog } from './AddInscriptoDialog';
import { NotificarDialog } from './NotificarDialog';
import { MateriaAsistente } from './MateriaAsistente';

interface MateriaDetailProps { materiaId: number }

const ADMIN_ROLES = ['ADMIN', 'ANALISTA'];

function formatFecha(iso?: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('es-UY', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

const TUTORIA_BADGE: Record<TutoriaEstado, { label: string; color: string; icon: typeof CheckCircle }> = {
  ABIERTA: { label: 'Abierta', color: 'bg-utec-green text-white border-utec-green', icon: CheckCircle },
  CERRADA: { label: 'Cerrada', color: 'bg-chrome text-white border-utec-dark', icon: Lock },
  CANCELADA: { label: 'Cancelada', color: 'bg-utec-red text-white border-utec-red', icon: XCircle },
};

type TileVariant = 'blue' | 'yellow' | 'cyan' | 'green' | 'purple';
const TILE_CLS: Record<TileVariant, string> = {
  blue: 'bg-utec-blue text-white', yellow: 'bg-utec-yellow text-utec-dark',
  cyan: 'bg-utec-cyan text-utec-dark', green: 'bg-utec-green text-white',
  purple: 'bg-utec-purple text-white',
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
  const r = 26;
  const circ = 2 * Math.PI * r;
  const off = circ * (1 - Math.min(100, Math.max(0, value)) / 100);
  return (
    <div className="relative h-16 w-16 shrink-0">
      <svg viewBox="0 0 64 64" className="h-16 w-16 -rotate-90">
        <circle cx="32" cy="32" r={r} fill="none" strokeWidth="8" className="stroke-muted" />
        <circle cx="32" cy="32" r={r} fill="none" strokeWidth="8" strokeLinecap="round" className="stroke-utec-purple" strokeDasharray={circ} strokeDashoffset={off} />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center text-sm font-bold tabular-nums">{value}%</div>
    </div>
  );
}

function exportInscriptosCSV(materia: Materia, inscriptos: Inscripcion[]) {
  const esc = (v: string) => `"${(v ?? '').replace(/"/g, '""')}"`;
  const rows = inscriptos.map((i) => [esc(i.estudianteNombre), esc(i.estado), esc(formatFecha(i.createdAt))].join(',')).join('\n');
  const blob = new Blob([`\uFEFFEstudiante,Estado,Fecha\n${rows}`], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `inscriptos-${materia.codigo ?? materia.id}.csv`; a.click();
  URL.revokeObjectURL(url);
}

function TutoriaRow({ tutoria }: Readonly<{ tutoria: Tutoria }>) {
  const navigate = useNavigate();
  const badge = TUTORIA_BADGE[tutoria.estado];
  const Icon = badge.icon;
  const ocupados = Math.max(0, tutoria.cupo - tutoria.plazasDisponibles);
  const pct = tutoria.cupo > 0 ? Math.round((ocupados / tutoria.cupo) * 100) : 0;
  const libre = tutoria.plazasDisponibles > 0;
  return (
    <li>
      <button
        type="button"
        onClick={() => navigate(`/tutorias/${tutoria.id}`)}
        className="w-full rounded-lg border p-3 text-left text-sm transition-all hover:border-utec-purple/40 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-utec-purple/40"
      >
      <div className="flex items-center justify-between gap-2 mb-1">
        <span className="flex items-center gap-1.5 font-medium"><CalendarClock className="h-4 w-4 text-utec-purple shrink-0" />{formatFecha(tutoria.inicio)}</span>
        <Badge className={`${badge.color} border font-medium text-xs shrink-0`}><Icon className="h-3.5 w-3.5 mr-1.5" />{badge.label}</Badge>
      </div>
      <p className="text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-0.5">
        <span className="flex items-center gap-1"><GraduationCap className="h-3.5 w-3.5" />{tutoria.docenteNombre}</span>
        {tutoria.espacioNombre && <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{tutoria.espacioNombre}</span>}
      </p>
      <div className="mt-2">
        <div className="flex justify-between text-2xs text-muted-foreground mb-1">
          <span>Cupo</span>
          <span className={`tabular-nums ${libre ? 'text-utec-green font-medium' : ''}`}>
            {ocupados}/{tutoria.cupo} · {tutoria.plazasDisponibles} libres
          </span>
        </div>
        <div className="h-1.5 rounded-full bg-muted overflow-hidden"><div className="h-full rounded-full bg-utec-purple transition-all" style={{ width: `${pct}%` }} /></div>
      </div>
      </button>
    </li>
  );
}

// ---------- Panels ----------
function InscriptosPanel({ materia, inscriptos, loading, onRefresh, canManage }: Readonly<{
  materia: Materia; inscriptos: Inscripcion[]; loading: boolean; onRefresh: () => void; canManage: boolean;
}>) {
  const [query, setQuery] = useState('');
  const [estado, setEstado] = useState('all');
  const [addOpen, setAddOpen] = useState(false);
  const [removingId, setRemovingId] = useState<number | null>(null);
  const [togglingId, setTogglingId] = useState<number | null>(null);

  const estados = useMemo(() => Array.from(new Set(inscriptos.map((i) => i.estado))), [inscriptos]);
  const visibles = useMemo(() => {
    const q = query.trim().toLowerCase();
    return inscriptos.filter((i) => (!q || i.estudianteNombre.toLowerCase().includes(q)) && (estado === 'all' || i.estado === estado));
  }, [inscriptos, query, estado]);

  const quitar = async (id: number) => {
    try { setRemovingId(id); await materiasApi.eliminarInscripcionAdmin(id); toast.success('Inscripción eliminada'); onRefresh(); }
    catch (e: unknown) { toast.error('No se pudo eliminar', { description: e instanceof Error ? e.message : 'Error' }); }
    finally { setRemovingId(null); }
  };

  const cambiarEstado = async (id: number, valor: 'ACTIVA' | 'APROBADA') => {
    try {
      setTogglingId(id);
      await materiasApi.cambiarEstadoInscripcion(id, valor);
      toast.success(valor === 'APROBADA' ? 'Marcada como cursada' : 'Revertida a cursando');
      onRefresh();
    } catch (e: unknown) {
      toast.error('No se pudo actualizar el estado', { description: e instanceof Error ? e.message : 'Error' });
    } finally {
      setTogglingId(null);
    }
  };

  const action = (
    <div className="flex items-center gap-1">
      {inscriptos.length > 0 && (
        <Button variant="ghost" size="sm" className="h-7" onClick={() => exportInscriptosCSV(materia, visibles)}><Download className="h-3.5 w-3.5 mr-1.5" />CSV</Button>
      )}
      {canManage && (
        <Button variant="ghost" size="sm" className="h-7" onClick={() => setAddOpen(true)}><UserPlus className="h-3.5 w-3.5 mr-1" />Agregar</Button>
      )}
    </div>
  );

  return (
    <Panel title={`Inscriptos · ${inscriptos.length}`} icon={<Users className="h-4 w-4 text-utec-blue" />} accent="bg-utec-blue/10" action={action}>
      {(() => {
        if (loading) return <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>;
        if (inscriptos.length === 0) {
          return (
            <div className="flex flex-col items-center gap-3 py-2">
              <p className="text-sm text-muted-foreground">Aún no hay estudiantes inscriptos.</p>
              {canManage && <Button variant="outline" size="sm" onClick={() => setAddOpen(true)}><UserPlus className="h-4 w-4 mr-1" />Inscribir estudiante</Button>}
            </div>
          );
        }
        return (
          <>
            <div className="flex -space-x-2 mb-3">
              {inscriptos.slice(0, 7).map((i) => (
                <span key={i.id} title={i.estudianteNombre} className="flex h-8 w-8 items-center justify-center rounded-full bg-utec-blue/15 text-utec-blue text-xs font-semibold ring-2 ring-card">{i.estudianteNombre?.slice(0, 2).toUpperCase()}</span>
              ))}
              {inscriptos.length > 7 && <span className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-muted-foreground text-xs font-semibold ring-2 ring-card">+{inscriptos.length - 7}</span>}
            </div>
            <div className="flex items-center gap-2 mb-2">
              <div className="relative flex-1 min-w-0">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Buscar…" value={query} onChange={(e) => setQuery(e.target.value)} className="pl-8 h-8" />
              </div>
              {estados.length > 1 && (
                <Select value={estado} onValueChange={setEstado}>
                  <SelectTrigger className="w-[110px] h-8"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="all">Todos</SelectItem>{estados.map((e) => <SelectItem key={e} value={e}>{e}</SelectItem>)}</SelectContent>
                </Select>
              )}
            </div>
            {visibles.length === 0 ? (
              <p className="text-sm text-muted-foreground py-2 text-center">Sin coincidencias.</p>
            ) : (
              <ul className="space-y-1 max-h-56 overflow-y-auto">
                {visibles.map((i) => (
                  <li key={i.id} className="flex items-center justify-between gap-2 text-sm group">
                    <span className="truncate">{i.estudianteNombre}</span>
                    <span className="flex items-center gap-1 shrink-0">
                      {i.estado === 'APROBADA' ? (
                        <Badge className="bg-utec-green/10 text-utec-green border-utec-green/20 border text-2xs font-medium">
                          <CheckCircle className="h-3 w-3 mr-1" />Cursada
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-2xs">{i.estado}</Badge>
                      )}
                      {canManage && i.estado === 'ACTIVA' && (
                        <Button variant="ghost" size="sm" className="h-6 px-2 text-2xs text-utec-green hover:text-utec-green" disabled={togglingId === i.id} onClick={() => cambiarEstado(i.id, 'APROBADA')} title="Marcar cursada">
                          {togglingId === i.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <><CheckCircle className="h-3.5 w-3.5 mr-1" />Cursada</>}
                        </Button>
                      )}
                      {canManage && i.estado === 'APROBADA' && (
                        <Button variant="ghost" size="icon" className="h-6 w-6" disabled={togglingId === i.id} onClick={() => cambiarEstado(i.id, 'ACTIVA')} title="Revertir a cursando">
                          {togglingId === i.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RotateCcw className="h-3.5 w-3.5" />}
                        </Button>
                      )}
                      {canManage && (
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:text-destructive" disabled={removingId === i.id} onClick={() => quitar(i.id)} title="Quitar">
                          {removingId === i.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <XCircle className="h-3.5 w-3.5" />}
                        </Button>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </>
        );
      })()}
      <AddInscriptoDialog materiaId={materia.id} open={addOpen} onOpenChange={setAddOpen} onSuccess={onRefresh} />
    </Panel>
  );
}

function TutoriasPanel({ materiaId, tutorias, loading, onRefresh }: Readonly<{ materiaId: number; tutorias: Tutoria[]; loading: boolean; onRefresh: () => void }>) {
  const [formOpen, setFormOpen] = useState(false);

  const { proximas, pasadas, ocupacion } = useMemo(() => {
    const now = Date.now();
    const prox: Tutoria[] = []; const pas: Tutoria[] = [];
    let cupoTot = 0; let ocup = 0;
    for (const t of tutorias) {
      (new Date(t.inicio).getTime() >= now ? prox : pas).push(t);
      cupoTot += t.cupo; ocup += Math.max(0, t.cupo - t.plazasDisponibles);
    }
    prox.sort((a, b) => a.inicio.localeCompare(b.inicio));
    pas.sort((a, b) => b.inicio.localeCompare(a.inicio));
    return { proximas: prox, pasadas: pas, ocupacion: cupoTot > 0 ? Math.round((ocup / cupoTot) * 100) : 0 };
  }, [tutorias]);

  const action = (
    <PermissionGuard requiredPermission="tutoria:crear">
      <Button variant="ghost" size="sm" className="h-7" onClick={() => setFormOpen(true)}><Plus className="h-3.5 w-3.5 mr-1" />Nueva</Button>
    </PermissionGuard>
  );

  return (
    <Panel title={`Tutorías · ${tutorias.length}`} icon={<CalendarClock className="h-4 w-4 text-utec-purple" />} accent="bg-utec-purple/10" action={action}>
      {(() => {
        if (loading) return <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>;
        if (tutorias.length === 0) {
          return (
            <div className="flex flex-col items-center gap-3 py-2">
              <p className="text-sm text-muted-foreground">Esta materia no tiene tutorías programadas.</p>
              <PermissionGuard requiredPermission="tutoria:crear"><Button variant="outline" size="sm" onClick={() => setFormOpen(true)}><Plus className="h-4 w-4 mr-1" />Crear tutoría</Button></PermissionGuard>
            </div>
          );
        }
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-3 rounded-lg bg-muted/40 p-3">
              <Donut value={ocupacion} />
              <div className="text-sm">
                <p className="font-medium">Ocupación general</p>
                <p className="text-muted-foreground text-xs">{proximas.length} próxima{proximas.length === 1 ? '' : 's'} · {pasadas.length} pasada{pasadas.length === 1 ? '' : 's'}</p>
              </div>
            </div>
            {proximas.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Próximas</p>
                <ul className="grid gap-2 sm:grid-cols-2">{proximas.map((t) => <TutoriaRow key={t.id} tutoria={t} />)}</ul>
              </div>
            )}
            {pasadas.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Pasadas</p>
                <ul className="grid gap-2 opacity-70 sm:grid-cols-2">{pasadas.map((t) => <TutoriaRow key={t.id} tutoria={t} />)}</ul>
              </div>
            )}
          </div>
        );
      })()}
      <TutoriaFormDialog tutoria={null} defaultMateriaId={materiaId} open={formOpen} onOpenChange={setFormOpen} onSuccess={() => { setFormOpen(false); onRefresh(); }} />
    </Panel>
  );
}

interface Actividad { ts: number; label: string; icon: LucideIcon; color: string }
function ActividadPanel({ recursos, inscriptos, tutorias }: Readonly<{ recursos: Recurso[]; inscriptos: Inscripcion[]; tutorias: Tutoria[] }>) {
  const eventos = useMemo<Actividad[]>(() => {
    const ev: Actividad[] = [];
    for (const r of recursos) ev.push({ ts: Date.parse(r.createdAt ?? ''), label: `Recurso agregado: ${r.titulo}`, icon: FolderOpen, color: 'text-utec-cyan' });
    for (const i of inscriptos) ev.push({ ts: Date.parse(i.createdAt ?? ''), label: `Se inscribió ${i.estudianteNombre}`, icon: UserPlus, color: 'text-utec-blue' });
    for (const t of tutorias) ev.push({ ts: Date.parse(t.createdAt ?? ''), label: `Tutoría creada para el ${formatFecha(t.inicio)}`, icon: CalendarClock, color: 'text-utec-purple' });
    return ev.filter((e) => !Number.isNaN(e.ts)).sort((a, b) => b.ts - a.ts).slice(0, 8);
  }, [recursos, inscriptos, tutorias]);

  return (
    <Panel title="Actividad reciente" icon={<CalendarClock className="h-4 w-4 text-utec-orange" />} accent="bg-utec-orange/10">
      {eventos.length === 0 ? (
        <p className="text-sm text-muted-foreground py-2">Sin actividad registrada.</p>
      ) : (
        <ol className="relative ml-1 space-y-3 before:absolute before:left-[7px] before:top-1 before:bottom-1 before:w-px before:bg-border">
          {eventos.map((e, idx) => {
            const Icon = e.icon;
            return (
              <li key={`${e.ts}-${idx}`} className="relative pl-6">
                <span className={`absolute left-0 top-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-card ring-2 ring-border ${e.color}`}>
                  <Icon className="h-2.5 w-2.5" />
                </span>
                <p className="text-sm leading-tight">{e.label}</p>
                <p className="text-xs text-muted-foreground">{formatFecha(new Date(e.ts).toISOString())}</p>
              </li>
            );
          })}
        </ol>
      )}
    </Panel>
  );
}

// ---------- Page ----------
export function MateriaDetail({ materiaId }: Readonly<MateriaDetailProps>) {
  const { hasPermission } = useRolePermissions();
  const puedeVerInscriptos = hasPermission('materia:ver_inscriptos');
  const navigate = useNavigate();
  const { user } = useAuth();
  const canManage = ADMIN_ROLES.includes(user?.rol ?? '');
  const canNotify = canManage || user?.rol === 'DOCENTE';

  const [materia, setMateria] = useState<Materia | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [notifyOpen, setNotifyOpen] = useState(false);

  const { recursos } = useRecursos(materiaId);
  const { tutorias, loading: loadingTut, refresh: refreshTut } = useTutorias({ scope: 'todas', materiaId });

  const [inscriptos, setInscriptos] = useState<Inscripcion[]>([]);
  const [loadingInsc, setLoadingInsc] = useState(true);
  // La lista de inscriptos es para quien dicta o administra: un ESTUDIANTE que
  // abria el detalle se comia un 403.
  const refreshInscriptos = useCallback(() => {
    if (!puedeVerInscriptos) { setLoadingInsc(false); return; }
    setLoadingInsc(true);
    materiasApi.obtenerInscriptos(materiaId)
      .then((r) => setInscriptos(r.data ?? []))
      .catch(() => { /* noop */ })
      .finally(() => setLoadingInsc(false));
  }, [materiaId, puedeVerInscriptos]);

  const fetchMateria = useCallback(() => {
    setLoading(true);
    materiasApi.obtenerMateria(materiaId)
      .then((r) => { if (r.data) setMateria(r.data); else setNotFound(true); })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [materiaId]);

  useEffect(() => { fetchMateria(); }, [fetchMateria]);
  useEffect(() => { refreshInscriptos(); }, [refreshInscriptos]);

  const copyLink = () => {
    navigator.clipboard?.writeText(window.location.href).then(() => toast.success('Link copiado')).catch(() => toast.error('No se pudo copiar'));
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-6 w-48" />
        <div className="grid gap-4 lg:grid-cols-3"><Skeleton className="h-44 rounded-2xl" /><Skeleton className="h-44 rounded-2xl lg:col-span-2" /></div>
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    );
  }
  if (notFound || !materia) {
    return (
      <div className="space-y-6">
        <button type="button" onClick={() => navigate('/materias')} className="text-sm text-muted-foreground hover:text-foreground">← Materias</button>
        <EmptyState icon={Layers} title="Materia no encontrada" description="La materia no existe o fue eliminada." />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Breadcrumb + acciones */}
      <div className="flex items-center justify-between gap-3">
        <nav className="flex items-center gap-1.5 text-sm text-muted-foreground min-w-0">
          <button type="button" onClick={() => navigate('/materias')} className="hover:text-foreground transition-colors">Materias</button>
          <ChevronRight className="h-4 w-4 shrink-0" />
          <span className="text-foreground font-medium truncate">{materia.nombre}</span>
        </nav>
        <div className="flex items-center gap-1 shrink-0">
          <Button variant="ghost" size="sm" onClick={copyLink} title="Copiar link"><Link2 className="h-4 w-4" /></Button>
          {canNotify && <Button variant="ghost" size="sm" onClick={() => setNotifyOpen(true)} title="Notificar inscriptos"><Mail className="h-4 w-4" /></Button>}
          <PermissionGuard requiredPermission="materia:editar"><Button variant="ghost" size="sm" onClick={() => setEditOpen(true)} title="Editar"><Edit className="h-4 w-4" /></Button></PermissionGuard>
          <PermissionGuard requiredPermission="materia:eliminar"><Button variant="ghost" size="sm" onClick={() => setDeleteOpen(true)} title="Eliminar" className="text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /></Button></PermissionGuard>
        </div>
      </div>

      {/* Identidad + tiles */}
      <div className="grid gap-4 lg:grid-cols-3 items-stretch">
        <div className="rounded-2xl border bg-card p-5 flex flex-col">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-utec-blue/10 text-utec-blue mb-3"><BookOpen className="h-6 w-6" /></div>
          <h1 className="text-2xl font-bold leading-tight">{materia.nombre}</h1>
          <div className="flex flex-wrap gap-2 mt-2">
            {materia.codigo && <Badge variant="outline" className="text-xs">{materia.codigo}</Badge>}
            {materia.carreraNombre && <Badge className="bg-utec-blue/10 text-utec-blue border-utec-blue/20 border text-xs font-medium">{materia.carreraNombre}</Badge>}
            {!materia.docenteNombre && <Badge className="bg-utec-orange/10 text-utec-orange border-utec-orange/20 border text-xs font-medium">Sin docente</Badge>}
          </div>
          {materia.docenteNombre && <p className="text-sm text-muted-foreground mt-3 flex items-center gap-1.5"><GraduationCap className="h-4 w-4" />{materia.docenteNombre}</p>}
          {materia.descripcion && <p className="text-sm text-muted-foreground mt-3 leading-relaxed">{materia.descripcion}</p>}
        </div>
        <div className="lg:col-span-2 grid grid-cols-2 gap-4">
          <StatTile icon={Users} label="Inscriptos" value={inscriptos.length} variant="blue" />
          <StatTile icon={Award} label="Créditos" value={materia.creditos ?? '—'} variant="yellow" />
          <StatTile icon={Layers} label="Semestre" value={materia.semestre ?? '—'} variant="cyan" />
          <StatTile icon={CalendarClock} label="Tutorías" value={tutorias.length} variant="purple" />
        </div>
      </div>

      {/* Recursos + sidebar */}
      <div className="grid gap-4 lg:grid-cols-3 items-start">
        <div className="lg:col-span-2 space-y-4">
          <RecursosPanel materiaId={materia.id} />
          {/* Las tutorías de la materia viven acá, en la columna principal: son la razón
              por la que un estudiante entra al detalle, no un dato al costado. */}
          <TutoriasPanel materiaId={materia.id} tutorias={tutorias} loading={loadingTut} onRefresh={refreshTut} />
          <ActividadPanel recursos={recursos} inscriptos={inscriptos} tutorias={tutorias} />
        </div>
        <div className="space-y-4">
          <InscriptosPanel materia={materia} inscriptos={inscriptos} loading={loadingInsc} onRefresh={refreshInscriptos} canManage={canManage} />
          <MateriaAsistente materia={materia} recursos={recursos} />
        </div>
      </div>

      <MateriaFormDialog materia={materia} open={editOpen} onOpenChange={setEditOpen} onSuccess={() => fetchMateria()} />
      <DeleteMateriaDialog materia={materia} open={deleteOpen} onOpenChange={setDeleteOpen} onSuccess={() => navigate('/materias')} />
      <NotificarDialog materiaId={materia.id} materiaNombre={materia.nombre} open={notifyOpen} onOpenChange={setNotifyOpen} />
    </div>
  );
}
