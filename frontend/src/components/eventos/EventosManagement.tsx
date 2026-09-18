import { useMemo, useState } from 'react';
import { Panel } from '@/components/common/Panel';
import { StatStrip, type ColorUtec } from '@/components/common/StatStrip';

/** Los nombres de color de esta pantalla, a los de la paleta. */
const COLOR_KPI: Record<string, ColorUtec> = {
  green: 'verde', cyan: 'cian', blue: 'azul',
  // Decía `cyan`: el tile «Próximos» pedía naranja y salía cian.
  orange: 'naranja', yellow: 'amarillo', dark: 'oscuro',
};
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
import { PageHeader, HEADER_PRIMARY } from '@/components/layouts/PageHeader';
import { useAuth } from '@/hooks/useAuth';
import { useEventos } from '@/hooks/useEventos';
import { eventosApi } from '@/lib/api/eventos';
import type { Evento } from '@/lib/types/eventos';
import { Gauge, Podio, type PodioEntry } from '@/components/common/dataviz';
import { EventoFormDialog } from './EventoFormDialog';
import { DeleteEventoDialog } from './DeleteEventoDialog';
import { InscriptosEventoDialog } from './InscriptosEventoDialog';
import { ProximoEventoHero } from './ProximoEventoHero';
import { AgendaCalendario } from '@/components/agenda/AgendaCalendario';
import { eventoToAgendable } from '@/lib/agenda/types';
import { CarteleraKiosko } from './CarteleraKiosko';
import { EventosDescubrir } from './EventosDescubrir';
import { EstadoBadge, parseTags } from './EventoCardDescubrir';
import { EventoPatternBg } from '@/components/ui/backgrounds/eventPatterns';
import { relativoInicio } from '@/lib/agenda/tiempo';
import { MARCA } from '@/lib/design/paleta';

const ADMIN_ROLES = ['ADMIN', 'ANALISTA'];
type VistaEventos = 'descubrir' | 'calendario' | 'todos' | 'metricas';

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
  EVENTO: MARCA.cian, // utec-cyan
  CURSO: MARCA.azul, // utec-blue
};
const TIPO_FALLBACK = ['#9333ea', MARCA.cian, MARCA.verde, MARCA.amarillo, MARCA.rojo];

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


interface ToggleDef { v: VistaEventos; icon: LucideIcon; label: string; adminOnly?: boolean }
/*
  "Cartelera" nombraba dos cosas distintas en la misma barra: una de estas vistas
  y el botón de pantalla completa de al lado. Ahora cada nombre es de una sola.
*/
const VISTAS: ToggleDef[] = [
  { v: 'descubrir', icon: Sparkles, label: 'Descubrir' },
  { v: 'calendario', icon: CalendarDays, label: 'Calendario' },
  { v: 'todos', icon: Newspaper, label: 'Todos' },
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

    if (vista === 'calendario') {
      return <AgendaCalendario items={eventosFiltrados.map(eventoToAgendable)} />;
    }

    if (vista === 'descubrir') {
      return (
        <div className="space-y-6">
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
          <StatStrip
            items={kpis.map((k) => ({
              label: k.label,
              value: fmtNum(k.value),
              hint: k.hint,
              icon: k.icon,
              color: COLOR_KPI[k.variant],
              delta: k.delta,
            }))}
          />

          <div className="grid gap-4 lg:grid-cols-4">
            <Panel title="Tipos de evento" icon={<Layers className="size-4" />} accentColor={MARCA.azul}>
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

            <Panel title="Ocupación global" icon={<Activity className="size-4" />} accentColor={MARCA.cian}>
              <Gauge value={ocupacion.pct} suffix="%" />
              <p className="text-xs text-muted-foreground text-center mt-2">
                {ocupacion.cap > 0
                  ? <><b className="text-foreground">{fmtNum(ocupacion.ins)}</b> / {fmtNum(ocupacion.cap)} plazas ocupadas</>
                  : 'Ningún evento tiene cupo definido.'}
              </p>
            </Panel>

            <Panel title="Actividad por mes" icon={<BarChart3 className="size-4" />} accentColor={MARCA.verde} className="lg:col-span-2">
              {serieData.length === 0 ? (
                <p className="py-10 text-center text-sm text-muted-foreground">Aún no hay datos mensuales.</p>
              ) : (
                <ResponsiveContainer width="100%" height={168}>
                  <ComposedChart data={serieData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    <defs><linearGradient id="gEvInscriptos" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={MARCA.cian} stopOpacity={0.35} /><stop offset="100%" stopColor={MARCA.cian} stopOpacity={0} /></linearGradient></defs>
                    <CartesianGrid strokeDasharray="2 4" stroke="#e5e7eb" vertical={false} />
                    <XAxis dataKey="mes" tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} width={32} allowDecimals={false} />
                    <Tooltip />
                    <Area type="monotone" dataKey="inscriptos" name="Inscriptos" stroke={MARCA.cian} strokeWidth={2} fill="url(#gEvInscriptos)" />
                    <Line type="monotone" dataKey="eventos" name="Eventos" stroke={MARCA.azul} strokeWidth={2} dot={false} />
                  </ComposedChart>
                </ResponsiveContainer>
              )}
            </Panel>
          </div>

          {topEventos.length > 0 && (
            <Panel title="Eventos más populares" icon={<Trophy className="size-4" />} accentColor={MARCA.amarillo}>
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

    if (vista === 'todos') {
      return (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {eventosFiltrados.map((evento) => {
            const conCupo = evento.cupo != null && evento.cupo > 0;
            return (
              <button key={evento.id} type="button" onClick={() => navigate(`/eventos/${evento.id}`)} className="group text-left rounded-2xl border overflow-hidden bg-card transition-all hover:shadow-lg hover:-translate-y-0.5">
                <div className="relative h-32 overflow-hidden bg-chrome p-4 flex flex-col justify-between text-white">
                  <EventoPatternBg patron={evento.patron} />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/15 to-transparent" />
                  <div className="relative flex items-center justify-between">
                    <span className="rounded-full bg-white/15 px-2.5 py-0.5 text-2xs font-semibold">{evento.tipo}</span>
                    <EstadoBadge estado={evento.estado} />
                  </div>
                  <h3 className="relative text-lg font-bold leading-tight line-clamp-2">{evento.titulo}</h3>
                </div>
                <div className="p-4 space-y-2 text-sm">
                  <p className="flex items-center gap-2 text-muted-foreground"><CalendarDays className="h-4 w-4 text-marca-cian-texto" />{formatFecha(evento.inicio)} · <span className="font-medium text-foreground">{relativoInicio(evento.inicio, evento.fin)}</span></p>
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
      <PageHeader
        title="Eventos"
        count={eventos.length}
        description="Descubrí y participá de la oferta abierta."
        accentColor={MARCA.naranja}
        actions={
          <PermissionGuard requiredPermission="evento:crear">
            <Button onClick={() => setCreateDialog(true)} className={HEADER_PRIMARY}>
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              Crear evento
            </Button>
          </PermissionGuard>
        }
      />

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
                <SelectItem value="all">Todos</SelectItem>
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
              <button key={v} type="button" onClick={() => setVista(v)} title={label} className={`flex h-8 w-8 items-center justify-center rounded ${vista === v ? 'bg-utec-cyan text-marca-tinta' : 'text-muted-foreground hover:text-foreground'}`}>
                <Icon className="h-4 w-4" />
              </button>
            ))}
          </div>
          <Button variant="outline" size="sm" className="h-9" onClick={() => setKioskoOpen(true)} title="Mostrar la cartelera a pantalla completa"><Tv className="h-4 w-4 mr-1.5" />Pantalla completa</Button>
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
