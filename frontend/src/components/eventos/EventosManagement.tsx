import { useMemo, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Area, CartesianGrid, Cell, ComposedChart, Line, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Activity, BarChart3, CalendarCheck, CalendarClock, CalendarDays,
  CheckCircle, FileText, Layers, Loader2, MapPin, Newspaper, Plus,
  Search, Sparkles, Tag, Trophy, Tv, Users,
} from 'lucide-react';
import { toast } from 'sonner';
import type { LucideIcon } from 'lucide-react';
import PermissionGuard from '@/components/auth/PermissionGuard';
import { useAuth } from '@/hooks/useAuth';
import { useEventos } from '@/hooks/useEventos';
import { eventosApi } from '@/lib/api/eventos';
import type { Evento } from '@/lib/types/eventos';
import { useCountUp } from '@/components/sostenibilidad/useCountUp';
import { Gauge, Podio, Tendencia, type PodioEntry } from '@/components/common/dataviz';
import { EventoFormDialog } from './EventoFormDialog';
import { DeleteEventoDialog } from './DeleteEventoDialog';
import { InscriptosEventoDialog } from './InscriptosEventoDialog';
import { ProximoEventoHero } from './ProximoEventoHero';
import { EventosCalendario } from './EventosCalendario';
import { CarteleraKiosko } from './CarteleraKiosko';
import { EventosDescubrir } from './EventosDescubrir';
import { EstadoBadge, parseTags } from './EventoCardDescubrir';
import { EventoPatternBg } from '@/components/ui/backgrounds/eventPatterns';
import { relativoInicio } from './eventoUtils';

const ADMIN_ROLES = ['ADMIN', 'ANALISTA'];
type VistaEventos = 'descubrir' | 'cartelera' | 'metricas';

function formatFecha(iso?: string): string {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString('es-UY', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

// --- Colores de marca por tipo de evento (donut + podio en Métricas) ---
const TIPO_COLOR: Record<string, string> = {
  EVENTO: '#00c7ff', // utec-cyan
  CURSO: '#184897', // utec-blue
};
const TIPO_FALLBACK = ['#9333ea', '#00c7ff', '#86bb4c', '#F6CA21', '#DF2B31'];

function fmtNum(n: number, dec = 0): string {
  return n.toLocaleString('es-UY', { minimumFractionDigits: dec, maximumFractionDigits: dec });
}

// Clave AAAA-MM del mes de una fecha ISO.
function monthKey(iso?: string): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}
function monthLabel(key: string): string {
  const [y, m] = key.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString('es-UY', { month: 'short', year: '2-digit' });
}

// --- Panel con header (mismo patrón visual que Sostenibilidad) ---
function Panel({ title, icon, accent, action, children, className }: Readonly<{ title: string; icon: ReactNode; accent: string; action?: ReactNode; children: ReactNode; className?: string }>) {
  return (
    <div className={`rounded-2xl border bg-card overflow-hidden ${className ?? ''}`}>
      <div className="flex items-center gap-2.5 px-4 py-3 border-b">
        <span className={`flex h-7 w-7 items-center justify-center rounded-lg ${accent}`}>{icon}</span>
        <h3 className="text-sm font-semibold">{title}</h3>
        {action && <div className="ml-auto">{action}</div>}
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

// --- KPI tile con count-up + tendencia opcional ---
const KPI_CLS: Record<string, string> = {
  green: 'bg-utec-green text-white', cyan: 'bg-utec-cyan text-utec-dark',
  blue: 'bg-utec-blue text-white', orange: 'bg-utec-cyan text-utec-dark',
  yellow: 'bg-utec-yellow text-utec-dark', dark: 'bg-utec-dark text-white',
};
function KpiTile({ icon: Icon, label, value, hint, variant, delta }: Readonly<{ icon: LucideIcon; label: string; value: number; hint?: string; variant: string; delta?: number }>) {
  const v = useCountUp(value);
  return (
    <div className={`relative overflow-hidden rounded-xl p-4 min-w-0 ${KPI_CLS[variant]}`}>
      <Icon className="absolute -right-3 -bottom-3 h-16 w-16 opacity-15" />
      <div className="relative">
        <div className="flex items-center gap-1.5">
          <div className="text-2xl sm:text-3xl font-bold tabular-nums leading-none">{fmtNum(v)}</div>
          {delta != null && (
            <span className="rounded-full bg-black/15 px-1.5 py-0.5 dark:bg-white/15">
              <Tendencia delta={delta} />
            </span>
          )}
        </div>
        <div className="text-xs font-medium opacity-80 mt-1.5 flex items-center gap-1"><Icon className="h-3.5 w-3.5" />{label}</div>
        {hint && <div className="text-[11px] opacity-70 mt-0.5 truncate">{hint}</div>}
      </div>
    </div>
  );
}

interface ToggleDef { v: VistaEventos; icon: LucideIcon; label: string; adminOnly?: boolean }
const VISTAS: ToggleDef[] = [
  { v: 'descubrir', icon: Sparkles, label: 'Descubrir' },
  { v: 'cartelera', icon: Newspaper, label: 'Cartelera' },
  { v: 'metricas', icon: BarChart3, label: 'Métricas', adminOnly: true },
];

export default function EventosManagement() {
  const { user } = useAuth();
  const rol = user?.rol ?? '';
  const isAdmin = ADMIN_ROLES.includes(rol);
  const navigate = useNavigate();

  const { eventos, misInscripciones, loading, refresh } = useEventos();

  const [createDialog, setCreateDialog] = useState(false);
  const [editDialog, setEditDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [inscriptosDialog, setInscriptosDialog] = useState(false);
  const [selected, setSelected] = useState<Evento | null>(null);
  const [inscribiendo, setInscribiendo] = useState<number | null>(null);
  const [cancelando, setCancelando] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [estadoFilter, setEstadoFilter] = useState('all');
  const [tipoFilter, setTipoFilter] = useState('all');
  const [tagFilter, setTagFilter] = useState('all');
  const [vista, setVista] = useState<VistaEventos>('descubrir');
  const [orden, setOrden] = useState('fecha');
  const [kioskoOpen, setKioskoOpen] = useState(false);

  const idsInscripto = useMemo(
    () => new Set(misInscripciones.map((e) => e.id)),
    [misInscripciones],
  );

  const allTags = useMemo(() => {
    const set = new Set<string>();
    eventos.forEach((e) => parseTags(e.tags).forEach((t) => set.add(t)));
    return [...set].sort((a, b) => a.localeCompare(b));
  }, [eventos]);

  interface KpiData { label: string; value: number; hint?: string; icon: LucideIcon; variant: string; delta?: number }
  const kpis: KpiData[] = useMemo(() => {
    const now = Date.now();
    const publicados = eventos.filter((e) => e.estado === 'PUBLICADO').length;
    const borradores = eventos.filter((e) => e.estado === 'BORRADOR').length;
    const proximos = eventos.filter((e) => new Date(e.inicio).getTime() >= now).length;
    const inscriptos = eventos.reduce((a, e) => a + (e.inscriptosCount ?? 0), 0);
    const cursos = eventos.filter((e) => e.tipo === 'CURSO').length;

    const d = new Date();
    const curKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const prev = new Date(d.getFullYear(), d.getMonth() - 1, 1);
    const prevKey = `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, '0')}`;
    let evCur = 0; let evPrev = 0; let insCur = 0; let insPrev = 0;
    eventos.forEach((e) => {
      const k = monthKey(e.inicio);
      if (k === curKey) { evCur += 1; insCur += e.inscriptosCount ?? 0; }
      else if (k === prevKey) { evPrev += 1; insPrev += e.inscriptosCount ?? 0; }
    });
    const pct = (cur: number, before: number) => (before > 0 ? ((cur - before) / before) * 100 : (cur > 0 ? 100 : undefined));

    return [
      { label: 'Eventos', value: eventos.length, icon: CalendarDays, variant: 'dark', delta: pct(evCur, evPrev) },
      { label: 'Publicados', value: publicados, icon: CheckCircle, variant: 'green' },
      { label: 'Borradores', value: borradores, icon: FileText, variant: 'yellow' },
      { label: 'Próximos', value: proximos, icon: CalendarClock, variant: 'orange' },
      { label: 'Inscriptos', value: inscriptos, icon: Users, variant: 'blue', delta: pct(insCur, insPrev) },
      { label: 'Cursos', value: cursos, hint: `${eventos.length - cursos} eventos`, icon: CalendarCheck, variant: 'cyan' },
    ];
  }, [eventos]);

  // Donut: distribución por tipo de evento.
  const tipoData = useMemo(() => {
    const counts = new Map<string, number>();
    eventos.forEach((e) => counts.set(e.tipo, (counts.get(e.tipo) ?? 0) + 1));
    let fb = 0;
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([name, value]) => ({
        name,
        value,
        fill: TIPO_COLOR[name] ?? TIPO_FALLBACK[fb++ % TIPO_FALLBACK.length],
      }));
  }, [eventos]);

  // Gauge: ocupación global = inscriptos / cupo (solo eventos con cupo).
  const ocupacion = useMemo(() => {
    let ins = 0; let cap = 0;
    eventos.forEach((e) => { if (e.cupo != null && e.cupo > 0) { ins += e.inscriptosCount ?? 0; cap += e.cupo; } });
    return { pct: cap > 0 ? Math.round((ins / cap) * 100) : 0, ins, cap };
  }, [eventos]);

  // Serie temporal: eventos e inscriptos por mes (por `inicio`).
  const serieData = useMemo(() => {
    const map = new Map<string, { eventos: number; inscriptos: number }>();
    eventos.forEach((e) => {
      const k = monthKey(e.inicio);
      if (!k) return;
      const cur = map.get(k) ?? { eventos: 0, inscriptos: 0 };
      cur.eventos += 1;
      cur.inscriptos += e.inscriptosCount ?? 0;
      map.set(k, cur);
    });
    return [...map.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([k, v]) => ({ mes: monthLabel(k), ...v }));
  }, [eventos]);

  // Top eventos por inscriptos (podio + lista).
  const topEventos = useMemo(
    () => [...eventos].filter((e) => (e.inscriptosCount ?? 0) > 0)
      .sort((a, b) => (b.inscriptosCount ?? 0) - (a.inscriptosCount ?? 0))
      .slice(0, 10),
    [eventos],
  );

  const hayFiltro = search.trim() !== '' || estadoFilter !== 'all' || tipoFilter !== 'all' || tagFilter !== 'all';

  const eventosFiltrados = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = eventos.filter((e) => {
      if (q && !e.titulo.toLowerCase().includes(q) && !(e.descripcion ?? '').toLowerCase().includes(q)) return false;
      if (estadoFilter !== 'all' && e.estado !== estadoFilter) return false;
      if (tipoFilter !== 'all' && e.tipo !== tipoFilter) return false;
      if (tagFilter !== 'all' && !parseTags(e.tags).includes(tagFilter)) return false;
      return true;
    });
    return [...list].sort((a, b) => orden === 'populares'
      ? (b.inscriptosCount ?? 0) - (a.inscriptosCount ?? 0)
      : a.inicio.localeCompare(b.inicio));
  }, [eventos, search, estadoFilter, tipoFilter, tagFilter, orden]);

  const handleEdit = (evento: Evento) => { setSelected(evento); setEditDialog(true); };
  const handleDelete = (evento: Evento) => { setSelected(evento); setDeleteDialog(true); };
  const handleTag = (t: string) => setTagFilter(t);

  const handleInscribirse = async (evento: Evento) => {
    try {
      setInscribiendo(evento.id);
      await eventosApi.inscribirse(evento.id);
      toast.success('Inscripción realizada', { description: evento.titulo });
      await refresh();
    } catch (error: unknown) {
      const description = error instanceof Error ? error.message : 'No se pudo completar la inscripción';
      toast.error('Error al inscribirse', { description });
    } finally {
      setInscribiendo(null);
    }
  };
  const handleCancelar = async (evento: Evento) => {
    try {
      setCancelando(evento.id);
      await eventosApi.cancelarInscripcion(evento.id);
      toast.success('Inscripción cancelada', { description: evento.titulo });
      await refresh();
    } catch (error: unknown) {
      const description = error instanceof Error ? error.message : 'No se pudo cancelar la inscripción';
      toast.error('Error al cancelar', { description });
    } finally {
      setCancelando(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const renderContenido = () => {
    if (eventos.length === 0) {
      return (
        <div className="text-center py-16">
          <CalendarDays className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No hay eventos disponibles</p>
        </div>
      );
    }

    if (vista === 'descubrir') {
      return (
        <div className="space-y-6">
          <EventosCalendario eventos={eventosFiltrados} />
          <EventosDescubrir
            eventos={eventosFiltrados}
            misInscripciones={misInscripciones}
            hayFiltro={hayFiltro}
            idsInscripto={idsInscripto}
            onNavigate={(id) => navigate(`/eventos/${id}`)}
            onInscribirse={handleInscribirse}
            onCancelar={handleCancelar}
            onEditar={handleEdit}
            onEliminar={handleDelete}
            onTag={handleTag}
            inscribiendo={inscribiendo}
            cancelando={cancelando}
          />
        </div>
      );
    }

    if (vista === 'metricas' && isAdmin) {
      return (
        <div className="space-y-6">
          <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
            {kpis.map((k) => (
              <KpiTile key={k.label} icon={k.icon} label={k.label} value={k.value} hint={k.hint} variant={k.variant} delta={k.delta} />
            ))}
          </div>

          <div className="grid gap-4 lg:grid-cols-4">
            <Panel title="Tipos de evento" icon={<Layers className="h-4 w-4 text-utec-blue" />} accent="bg-utec-blue/10">
              {tipoData.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">Sin datos.</p>
              ) : (
                <div className="flex items-center gap-3">
                  <ResponsiveContainer width={96} height={96}>
                    <PieChart>
                      <Pie data={tipoData} dataKey="value" nameKey="name" innerRadius={26} outerRadius={44} paddingAngle={2}>
                        {tipoData.map((d) => <Cell key={d.name} fill={d.fill} />)}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-1.5 text-sm min-w-0">
                    {tipoData.map((d) => (
                      <p key={d.name} className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: d.fill }} />
                        <span className="truncate">{d.name}</span>
                        <b className="ml-auto tabular-nums">{d.value}</b>
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </Panel>

            <Panel title="Ocupación global" icon={<Activity className="h-4 w-4 text-utec-cyan" />} accent="bg-utec-cyan/10">
              <Gauge value={ocupacion.pct} suffix="%" />
              <p className="text-xs text-muted-foreground text-center mt-2">
                {ocupacion.cap > 0
                  ? <><b className="text-foreground">{fmtNum(ocupacion.ins)}</b> / {fmtNum(ocupacion.cap)} plazas ocupadas</>
                  : 'Ningún evento tiene cupo definido.'}
              </p>
            </Panel>

            <Panel title="Actividad por mes" icon={<BarChart3 className="h-4 w-4 text-utec-green" />} accent="bg-utec-green/10" className="lg:col-span-2">
              {serieData.length === 0 ? (
                <p className="py-10 text-center text-sm text-muted-foreground">Aún no hay datos mensuales.</p>
              ) : (
                <ResponsiveContainer width="100%" height={168}>
                  <ComposedChart data={serieData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    <defs><linearGradient id="gEvInscriptos" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#00c7ff" stopOpacity={0.35} /><stop offset="100%" stopColor="#00c7ff" stopOpacity={0} /></linearGradient></defs>
                    <CartesianGrid strokeDasharray="2 4" stroke="#e5e7eb" vertical={false} />
                    <XAxis dataKey="mes" tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} width={32} allowDecimals={false} />
                    <Tooltip />
                    <Area type="monotone" dataKey="inscriptos" name="Inscriptos" stroke="#00c7ff" strokeWidth={2} fill="url(#gEvInscriptos)" />
                    <Line type="monotone" dataKey="eventos" name="Eventos" stroke="#184897" strokeWidth={2} dot={false} />
                  </ComposedChart>
                </ResponsiveContainer>
              )}
            </Panel>
          </div>

          {topEventos.length > 0 && (
            <Panel title="Eventos más populares" icon={<Trophy className="h-4 w-4 text-utec-yellow" />} accent="bg-utec-yellow/10">
              <div className="space-y-3">
                <Podio
                  top={topEventos.slice(0, 3).map((e): PodioEntry => ({
                    nombre: e.titulo,
                    valor: `${fmtNum(e.inscriptosCount ?? 0)} insc.`,
                    onClick: () => navigate(`/eventos/${e.id}`),
                  }))}
                />
                {topEventos.length > 3 && (
                  <ul className="divide-y rounded-xl border">
                    {topEventos.slice(3).map((e, i) => (
                      <li key={e.id}>
                        <button type="button" onClick={() => navigate(`/eventos/${e.id}`)} className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-left hover:bg-muted/50 transition-colors">
                          <span className="w-4 shrink-0 text-center text-xs font-medium text-muted-foreground tabular-nums">{i + 4}</span>
                          <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: TIPO_COLOR[e.tipo] ?? '#9333ea' }} />
                          <span className="min-w-0 flex-1 truncate" title={e.titulo}>{e.titulo}</span>
                          <span className="w-24 shrink-0 text-right text-xs text-muted-foreground tabular-nums">{fmtNum(e.inscriptosCount ?? 0)} insc.</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </Panel>
          )}
        </div>
      );
    }

    if (eventosFiltrados.length === 0) {
      return <div className="text-center py-16"><Search className="h-10 w-10 mx-auto text-muted-foreground mb-3" /><p className="text-muted-foreground">Ningún evento coincide con los filtros.</p></div>;
    }

    if (vista === 'cartelera') {
      return (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {eventosFiltrados.map((evento) => {
            const conCupo = evento.cupo != null && evento.cupo > 0;
            return (
              <button key={evento.id} type="button" onClick={() => navigate(`/eventos/${evento.id}`)} className="group text-left rounded-2xl border overflow-hidden bg-card transition-all hover:shadow-lg hover:-translate-y-0.5">
                <div className="relative h-32 overflow-hidden bg-utec-dark p-4 flex flex-col justify-between text-white">
                  <EventoPatternBg patron={evento.patron} />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/15 to-transparent" />
                  <div className="relative flex items-center justify-between">
                    <span className="rounded-full bg-white/15 px-2.5 py-0.5 text-[10px] font-semibold">{evento.tipo}</span>
                    <EstadoBadge estado={evento.estado} />
                  </div>
                  <h3 className="relative text-lg font-bold leading-tight line-clamp-2">{evento.titulo}</h3>
                </div>
                <div className="p-4 space-y-2 text-sm">
                  <p className="flex items-center gap-2 text-muted-foreground"><CalendarDays className="h-4 w-4 text-utec-cyan" />{formatFecha(evento.inicio)} · <span className="font-medium text-foreground">{relativoInicio(evento.inicio, evento.fin)}</span></p>
                  {evento.espacioNombre && <p className="flex items-center gap-2 text-muted-foreground"><MapPin className="h-4 w-4" />{evento.espacioNombre}</p>}
                  <p className="flex items-center gap-2 text-muted-foreground"><Users className="h-4 w-4" />{evento.inscriptosCount}{conCupo ? `/${evento.cupo}` : ''} inscriptos</p>
                </div>
              </button>
            );
          })}
        </div>
      );
    }

    return null;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{eventos.length}</span> eventos · descubrí y participá de la oferta abierta.
        </p>
        <PermissionGuard requiredPermission="evento:crear">
          <Button onClick={() => setCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Crear Evento
          </Button>
        </PermissionGuard>
      </div>

      {eventos.length > 0 && <ProximoEventoHero eventos={eventos} />}

      {eventos.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar por título o descripción…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8 h-9" />
          </div>
          <Select value={tipoFilter} onValueChange={setTipoFilter}>
            <SelectTrigger className="w-[130px] h-9"><SelectValue placeholder="Tipo" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todo tipo</SelectItem>
              <SelectItem value="EVENTO">Evento</SelectItem>
              <SelectItem value="CURSO">Curso</SelectItem>
            </SelectContent>
          </Select>
          <Select value={estadoFilter} onValueChange={setEstadoFilter}>
            <SelectTrigger className="w-[140px] h-9"><SelectValue placeholder="Estado" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todo estado</SelectItem>
              <SelectItem value="BORRADOR">Borrador</SelectItem>
              <SelectItem value="PUBLICADO">Publicado</SelectItem>
              <SelectItem value="FINALIZADO">Finalizado</SelectItem>
              <SelectItem value="CANCELADO">Cancelado</SelectItem>
            </SelectContent>
          </Select>
          {allTags.length > 0 && (
            <Select value={tagFilter} onValueChange={setTagFilter}>
              <SelectTrigger className="w-[140px] h-9"><Tag className="h-3.5 w-3.5 mr-1 text-muted-foreground" /><SelectValue placeholder="Tag" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los tags</SelectItem>
                {allTags.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          )}
          <Select value={orden} onValueChange={setOrden}>
            <SelectTrigger className="w-[130px] h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="fecha">Por fecha</SelectItem>
              <SelectItem value="populares">🔥 Populares</SelectItem>
            </SelectContent>
          </Select>
          {/* Toggle de vista */}
          <div className="flex items-center rounded-md border p-0.5 h-9">
            {VISTAS.filter((t) => !t.adminOnly || isAdmin).map(({ v, icon: Icon, label }) => (
              <button key={v} type="button" onClick={() => setVista(v)} title={label} className={`flex h-8 w-8 items-center justify-center rounded ${vista === v ? 'bg-utec-cyan text-utec-dark' : 'text-muted-foreground hover:text-foreground'}`}>
                <Icon className="h-4 w-4" />
              </button>
            ))}
          </div>
          <Button variant="outline" size="sm" className="h-9" onClick={() => setKioskoOpen(true)} title="Cartelera pantalla completa"><Tv className="h-4 w-4 mr-1.5" />Cartelera</Button>
        </div>
      )}

      {renderContenido()}

      <EventoFormDialog evento={null} open={createDialog} onOpenChange={setCreateDialog} onSuccess={refresh} />
      <EventoFormDialog evento={selected} open={editDialog} onOpenChange={setEditDialog} onSuccess={refresh} />
      <DeleteEventoDialog evento={selected} open={deleteDialog} onOpenChange={setDeleteDialog} onSuccess={refresh} />
      <InscriptosEventoDialog evento={selected} open={inscriptosDialog} onOpenChange={setInscriptosDialog} />
      {kioskoOpen && <CarteleraKiosko eventos={eventos} onClose={() => setKioskoOpen(false)} />}
    </div>
  );
}
