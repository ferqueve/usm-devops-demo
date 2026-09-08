import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { StatStrip, type StatItem } from '@/components/dashboard/views/_components/StatStrip';
import {
  BookOpen,
  CalendarCheck,
  CalendarClock,
  CalendarDays,
  CalendarRange,
  CheckCircle,
  Compass,
  Flame,
  GraduationCap,
  LayoutGrid,
  ListChecks,
  Loader2,
  Plus,
  QrCode,
  Radio,
  Search,
  Star,
  Trophy,
  Users,
} from 'lucide-react';
import { toast } from 'sonner';
import PermissionGuard from '@/components/auth/PermissionGuard';
import { useAuth } from '@/hooks/useAuth';
import { useTutorias } from '@/hooks/useTutorias';
import { tutoriasApi } from '@/lib/api/tutorias';
import type { Tutoria } from '@/lib/types/tutorias';
import { TutoriaFormDialog } from './TutoriaFormDialog';
import { ProximaTutoriaHero } from './ProximaTutoriaHero';
import { RankingTutores } from './RankingTutores';
import { RachaBadges } from './RachaBadges';
import { AgendarTutoriaDialog } from './AgendarTutoriaDialog';
import { AgendaCalendario } from '@/components/agenda/AgendaCalendario';
import { tutoriaToAgendable } from '@/lib/agenda/types';
import { TutoriasAgenda } from './TutoriasAgenda';
import { TutoriaCard } from './TutoriaCard';
import { DisponibilidadSemanal } from './DisponibilidadSemanal';
import { CheckinScanner } from './CheckinScanner';

const DOCENTE_ROLES = ['DOCENTE', 'ADMIN', 'ANALISTA'];

/**
 * @param embedded true cuando se renderiza como pestaña dentro de Materias, donde
 *   el encabezado y el subtítulo ya los pone la página contenedora.
 */
export default function TutoriasManagement({ embedded = false }: Readonly<{ embedded?: boolean }> = {}) {
  const { user } = useAuth();
  const rol = user?.rol ?? '';
  const isDocente = DOCENTE_ROLES.includes(rol);

  if (isDocente) {
    const adminView = rol === 'ADMIN' || rol === 'ANALISTA';
    return <DocenteView scope={adminView ? 'todas' : 'dictadas'} adminView={adminView} embedded={embedded} />;
  }
  return <EstudianteView embedded={embedded} />;
}

/** Encabezado de sección reutilizable (título con acento e ícono). */
function SectionHeader({
  icon: Icon, title, subtitle, accent = 'blue',
}: Readonly<{ icon: typeof GraduationCap; title: string; subtitle?: string; accent?: 'blue' | 'orange' }>) {
  const accentCls = accent === 'orange' ? 'bg-utec-orange/10 text-utec-orange' : 'bg-utec-blue/10 text-utec-blue';
  return (
    <div className="flex items-center gap-2.5">
      <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${accentCls}`}><Icon className="h-4 w-4" /></span>
      <div>
        <h2 className="text-base font-bold leading-tight">{title}</h2>
        {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
      </div>
    </div>
  );
}

// ----- Vista DOCENTE / ADMIN: gestiona franjas de tutoría -----
function DocenteView({ scope, adminView, embedded }: Readonly<{ scope: 'dictadas' | 'todas'; adminView: boolean; embedded?: boolean }>) {
  const { tutorias, loading, refresh } = useTutorias({ scope });
  const [createDialog, setCreateDialog] = useState(false);
  const [editDialog, setEditDialog] = useState(false);
  const [selected, setSelected] = useState<Tutoria | null>(null);
  const [search, setSearch] = useState('');
  const [estadoFilter, setEstadoFilter] = useState('all');
  const [tiempo, setTiempo] = useState('todas');
  const [vista, setVista] = useState<'grilla' | 'calendario' | 'agenda'>('grilla');
  // 144 tarjetas de una eran 8.300 nodos en el DOM, seis veces la pantalla mas
  // pesada de la app. El endpoint no pagina, asi que la grilla se corta aca.
  const [pagina, setPagina] = useState(0);
  const POR_PAGINA = 24;
  const [scanOpen, setScanOpen] = useState(false);

  const kpis: StatItem[] = useMemo(() => {
    const now = Date.now();
    const abiertas = tutorias.filter((t) => t.estado === 'ABIERTA').length;
    const proximas = tutorias.filter((t) => new Date(t.inicio).getTime() >= now).length;
    const cupoTot = tutorias.reduce((a, t) => a + t.cupo, 0);
    const ocup = tutorias.reduce((a, t) => a + Math.max(0, t.cupo - t.plazasDisponibles), 0);
    const pct = cupoTot > 0 ? Math.round((ocup / cupoTot) * 100) : 0;
    return [
      { label: 'Tutorías', value: tutorias.length, icon: CalendarDays, bg: 'dark' },
      { label: 'Abiertas', value: abiertas, icon: CheckCircle, bg: 'green' },
      { label: 'Próximas', value: proximas, icon: CalendarClock, bg: 'orange' },
      { label: 'Plazas', value: cupoTot, hint: 'Cupo total', icon: Users, bg: 'blue' },
      { label: 'Ocupadas', value: ocup, icon: CalendarCheck, bg: 'cyan' },
      { label: 'Ocupación', value: `${pct}%`, icon: Users, bg: 'yellow' },
    ];
  }, [tutorias]);

  // Rating agregado del docente (solo cuando ve "sus" franjas).
  const miRating = useMemo(() => {
    if (scope !== 'dictadas') return null;
    let totalVal = 0;
    let suma = 0;
    let estudiantes = 0;
    for (const t of tutorias) {
      const val = t.ratingTotal ?? 0;
      totalVal += val;
      suma += (t.ratingPromedio ?? 0) * val;
      estudiantes += t.agendadosCount ?? 0;
    }
    return { promedio: totalVal > 0 ? suma / totalVal : 0, totalVal, tutorias: tutorias.length, estudiantes };
  }, [tutorias, scope]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const now = Date.now();
    const list = tutorias.filter((t) => {
      if (q && !t.materiaNombre.toLowerCase().includes(q) && !(t.docenteNombre ?? '').toLowerCase().includes(q)) return false;
      if (estadoFilter !== 'all' && t.estado !== estadoFilter) return false;
      const fut = new Date(t.inicio).getTime() >= now;
      if (tiempo === 'proximas' && !fut) return false;
      if (tiempo === 'pasadas' && fut) return false;
      return true;
    });
    return [...list].sort((a, b) => (tiempo === 'pasadas' ? b.inicio.localeCompare(a.inicio) : a.inicio.localeCompare(b.inicio)));
  }, [tutorias, search, estadoFilter, tiempo]);

  const totalPaginas = Math.max(1, Math.ceil(filtered.length / POR_PAGINA));
  const paginaActual = Math.min(pagina, totalPaginas - 1);
  const visibles = filtered.slice(paginaActual * POR_PAGINA, paginaActual * POR_PAGINA + POR_PAGINA);

  // Al filtrar, la página en la que estabas puede dejar de existir.
  useEffect(() => { setPagina(0); }, [search, estadoFilter, tiempo]);

  const handleEdit = (tutoria: Tutoria) => { setSelected(tutoria); setEditDialog(true); };

  const onScan = async (reservaId: number) => {
    try {
      await tutoriasApi.marcarAsistencia(reservaId, true);
      toast.success('Asistencia registrada', { description: `Reserva #${reservaId}` });
      await refresh();
    } catch (e: unknown) {
      toast.error('No se pudo registrar', { description: e instanceof Error ? e.message : 'Error' });
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{tutorias.length}</span> tutorías{embedded ? '' : ` · ${adminView
            ? 'todas las franjas del sistema y su cupo agendado.'
            : 'gestioná tus franjas de tutoría y revisá el cupo agendado.'}`}
        </p>
        <div className="flex items-center gap-2">
          <PermissionGuard requiredPermission="tutoria:editar">
            <Button variant="outline" onClick={() => setScanOpen(true)}><QrCode className="h-4 w-4" />Check-in</Button>
          </PermissionGuard>
          <PermissionGuard requiredPermission="tutoria:crear">
            <Button onClick={() => setCreateDialog(true)}><Plus className="h-4 w-4" />Crear Tutoría</Button>
          </PermissionGuard>
        </div>
      </div>

      <ProximaTutoriaHero tutorias={tutorias} modo="docente" />

      <StatStrip items={kpis} loading={loading && tutorias.length === 0} />

      {/* Mi ranking / rating personal como tutor */}
      {miRating && miRating.totalVal > 0 && (
        <div className="flex flex-wrap items-center gap-4 rounded-2xl border bg-gradient-to-r from-utec-yellow/10 via-card to-card p-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-utec-yellow/20 text-utec-yellow"><Trophy className="h-6 w-6" /></span>
          <div className="min-w-0">
            <p className="text-xs font-medium text-muted-foreground">Tu valoración como tutor</p>
            <div className="flex items-center gap-2">
              <div className="flex">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star key={i} className={i <= Math.round(miRating.promedio) ? 'h-4 w-4 fill-utec-yellow text-utec-yellow' : 'h-4 w-4 text-muted-foreground/30'} />
                ))}
              </div>
              <span className="text-xl font-bold tabular-nums">{miRating.promedio.toFixed(1)}</span>
              <span className="text-xs text-muted-foreground">· {miRating.totalVal} valoraciones</span>
            </div>
          </div>
          <div className="ml-auto flex gap-5 text-center">
            <div>
              <div className="text-lg font-bold tabular-nums text-utec-blue">{miRating.tutorias}</div>
              <div className="text-[11px] text-muted-foreground">franjas</div>
            </div>
            <div>
              <div className="text-lg font-bold tabular-nums text-utec-green">{miRating.estudiantes}</div>
              <div className="text-[11px] text-muted-foreground">estudiantes</div>
            </div>
          </div>
        </div>
      )}

      {tutorias.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar por materia o docente…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8 h-9" />
          </div>
          <Select value={tiempo} onValueChange={setTiempo}>
            <SelectTrigger className="w-[140px] h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas</SelectItem>
              <SelectItem value="proximas">Próximas</SelectItem>
              <SelectItem value="pasadas">Pasadas</SelectItem>
            </SelectContent>
          </Select>
          <Select value={estadoFilter} onValueChange={setEstadoFilter}>
            <SelectTrigger className="w-[140px] h-9"><SelectValue placeholder="Estado" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todo estado</SelectItem>
              <SelectItem value="ABIERTA">Abierta</SelectItem>
              <SelectItem value="CERRADA">Cerrada</SelectItem>
              <SelectItem value="CANCELADA">Cancelada</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex items-center rounded-md border p-0.5 h-9">
            {([['grilla', LayoutGrid], ['agenda', ListChecks], ['calendario', CalendarRange]] as const).map(([v, Icon]) => (
              <button key={v} type="button" onClick={() => setVista(v)} title={v} className={`flex h-8 w-8 items-center justify-center rounded ${vista === v ? 'bg-utec-blue text-white' : 'text-muted-foreground hover:text-foreground'}`}>
                <Icon className="h-4 w-4" />
              </button>
            ))}
          </div>
        </div>
      )}

      {(() => {
        if (tutorias.length === 0) {
          return (
            <div className="text-center py-16">
              <GraduationCap className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">{adminView ? 'No hay tutorías registradas' : 'No tenés franjas de tutoría registradas'}</p>
            </div>
          );
        }
        if (vista === 'calendario') return <AgendaCalendario items={filtered.map(tutoriaToAgendable)} />;
        if (vista === 'agenda') return <TutoriasAgenda tutorias={filtered} />;
        if (filtered.length === 0) {
          return <div className="text-center py-16"><Search className="h-10 w-10 mx-auto text-muted-foreground mb-3" /><p className="text-muted-foreground">Ninguna tutoría coincide con los filtros.</p></div>;
        }
        return (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {visibles.map((tutoria) => (
                <TutoriaCard key={tutoria.id} tutoria={tutoria} variant="docente" onEdit={handleEdit} />
              ))}
            </div>
            {filtered.length > POR_PAGINA && (
              <div className="mt-4 flex items-center justify-between gap-3 border-t pt-3">
                <span className="text-xs text-muted-foreground tabular-nums">
                  {paginaActual * POR_PAGINA + 1}–{paginaActual * POR_PAGINA + visibles.length} de {filtered.length}
                </span>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="sm" className="h-7 px-2" onClick={() => setPagina(paginaActual - 1)} disabled={paginaActual === 0}>
                    Anterior
                  </Button>
                  <span className="px-1 text-xs text-muted-foreground tabular-nums">
                    {paginaActual + 1} / {totalPaginas}
                  </span>
                  <Button variant="ghost" size="sm" className="h-7 px-2" onClick={() => setPagina(paginaActual + 1)} disabled={paginaActual >= totalPaginas - 1}>
                    Siguiente
                  </Button>
                </div>
              </div>
            )}
          </>
        );
      })()}

      {tutorias.length > 0 && <DisponibilidadSemanal tutorias={tutorias} />}

      <RankingTutores />

      <TutoriaFormDialog tutoria={null} open={createDialog} onOpenChange={setCreateDialog} onSuccess={refresh} />
      <TutoriaFormDialog tutoria={selected} open={editDialog} onOpenChange={setEditDialog} onSuccess={refresh} />
      <CheckinScanner open={scanOpen} onOpenChange={setScanOpen} onDetect={onScan} />
    </div>
  );
}

// ----- Vista ESTUDIANTE: hub de ayuda académica agrupado por materia -----
function EstudianteView({ embedded }: Readonly<{ embedded?: boolean }>) {
  const { tutorias: disponibles, loading: loadingDisponibles, refresh: refreshDisponibles } =
    useTutorias({ scope: 'todas' });
  const { tutorias: agendadas, loading: loadingAgendadas, refresh: refreshAgendadas } =
    useTutorias({ scope: 'agendadas' });

  const [accion, setAccion] = useState<number | null>(null);
  const [agendarTarget, setAgendarTarget] = useState<Tutoria | null>(null);

  const refreshAll = async () => {
    await Promise.all([refreshDisponibles(), refreshAgendadas()]);
  };

  const handleAgendar = async (tutoria: Tutoria, temario: string) => {
    try {
      setAccion(tutoria.id);
      await tutoriasApi.agendar(tutoria.id, temario || undefined);
      toast.success(tutoria.plazasDisponibles <= 0 ? 'Te anotaste en la lista de espera' : 'Tutoría agendada', { description: tutoria.materiaNombre });
      setAgendarTarget(null);
      await refreshAll();
    } catch (error: unknown) {
      const description = error instanceof Error ? error.message : 'No se pudo agendar la tutoría';
      toast.error('Error al agendar', { description });
    } finally {
      setAccion(null);
    }
  };

  const handleConfirmar = async (tutoria: Tutoria) => {
    if (tutoria.reservaId == null) return;
    try {
      setAccion(tutoria.id);
      await tutoriasApi.confirmarReserva(tutoria.reservaId);
      toast.success('Asistencia confirmada', { description: tutoria.materiaNombre });
      await refreshAll();
    } catch (error: unknown) {
      toast.error('No se pudo confirmar', { description: error instanceof Error ? error.message : 'Error' });
    } finally {
      setAccion(null);
    }
  };

  const handleCancelar = async (tutoria: Tutoria) => {
    if (tutoria.reservaId == null) return;
    try {
      setAccion(tutoria.id);
      await tutoriasApi.cancelarReserva(tutoria.reservaId);
      toast.success('Reserva cancelada', { description: tutoria.materiaNombre });
      await refreshAll();
    } catch (error: unknown) {
      const description = error instanceof Error ? error.message : 'No se pudo cancelar la reserva';
      toast.error('Error al cancelar', { description });
    } finally {
      setAccion(null);
    }
  };

  const {
    agendadasIds, misMaterias, tusGrupos, otrosGrupos, esFinales, topMateria, hayEnVivo,
  } = useMemo(() => {
    const ids = new Set(agendadas.map((t) => t.id));
    const materias = new Set(agendadas.map((t) => t.materiaNombre));
    const abiertas = disponibles.filter((t) => t.estado === 'ABIERTA');

    // Agrupar tutorías disponibles por materia.
    const porMateria = new Map<string, Tutoria[]>();
    for (const t of abiertas) {
      if (!porMateria.has(t.materiaNombre)) porMateria.set(t.materiaNombre, []);
      porMateria.get(t.materiaNombre)!.push(t);
    }
    const grupos = [...porMateria.entries()].map(([materia, items]) => ({
      materia,
      items: [...items].sort((a, b) => a.inicio.localeCompare(b.inicio)),
      proxima: items.reduce((min, t) => (t.inicio < min ? t.inicio : min), items[0].inicio),
    }));
    grupos.sort((a, b) => a.proxima.localeCompare(b.proxima));

    const tus = grupos.filter((g) => materias.has(g.materia));
    const otros = grupos.filter((g) => !materias.has(g.materia));

    // Termómetro de finales: en meses de parcial, materia más demandada.
    const finales = [6, 7, 11, 12].includes(new Date().getMonth() + 1);
    const demanda = new Map<string, number>();
    abiertas.forEach((t) => demanda.set(t.materiaNombre, (demanda.get(t.materiaNombre) ?? 0) + (t.agendadosCount ?? 0)));
    const top = [...demanda.entries()].sort((a, b) => b[1] - a[1])[0];

    return {
      agendadasIds: ids,
      misMaterias: materias,
      tusGrupos: tus,
      otrosGrupos: otros,
      esFinales: finales,
      topMateria: top,
      hayEnVivo: abiertas.some((t) => t.enVivo),
    };
  }, [disponibles, agendadas]);

  if (loadingDisponibles || loadingAgendadas) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const renderGrupos = (grupos: { materia: string; items: Tutoria[] }[]) => (
    <div className="space-y-6">
      {grupos.map(({ materia, items }) => (
        <div key={materia} className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-utec-blue/10 text-utec-blue"><GraduationCap className="h-3.5 w-3.5" /></span>
            <h3 className="text-sm font-bold">{materia}</h3>
            {misMaterias.has(materia) && <span className="rounded-full bg-utec-blue/15 px-2 py-0.5 text-[10px] font-medium text-utec-blue">Tu materia</span>}
            <span className="ml-auto text-xs text-muted-foreground">{items.length} {items.length === 1 ? 'horario' : 'horarios'}</span>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {items.map((tutoria) => (
              <TutoriaCard
                key={tutoria.id}
                tutoria={tutoria}
                variant="disponible"
                esMiMateria={misMaterias.has(tutoria.materiaNombre)}
                yaAgendada={agendadasIds.has(tutoria.id)}
                busy={accion === tutoria.id}
                onAgendar={setAgendarTarget}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="space-y-6">
      {!embedded && (
        <p className="text-sm text-muted-foreground">Tu hub de ayuda académica: agendá tutorías, sumá racha y llegá listo a los finales.</p>
      )}

      <ProximaTutoriaHero tutorias={agendadas} modo="estudiante" />

      {/* Gamificación protagonista (cálida y visible) */}
      <RachaBadges />

      {/* Banners contextuales */}
      {esFinales && topMateria && topMateria[1] > 0 && (
        <div className="flex items-center gap-2 rounded-xl border border-utec-red/30 bg-utec-red/5 px-4 py-2.5 text-sm">
          <Flame className="h-4 w-4 text-utec-red shrink-0" />
          <span><b>Época de finales</b> 🔥 — <b>{topMateria[0]}</b> es la materia con más demanda. Agendá temprano antes de que se llene.</span>
        </div>
      )}
      {hayEnVivo && (
        <div className="flex items-center gap-2 rounded-xl border border-utec-green/30 bg-utec-green/5 px-4 py-2.5 text-sm">
          <Radio className="h-4 w-4 text-utec-green shrink-0" />
          <span>Hay <b>tutores disponibles en vivo</b> ahora mismo — buscá el cartel <span className="font-medium text-utec-red">En vivo</span>.</span>
        </div>
      )}

      {/* Mis tutorías agendadas */}
      {agendadas.length > 0 && (
        <section className="space-y-3">
          <SectionHeader icon={CalendarCheck} title="Mis tutorías agendadas" subtitle="Confirmá tu asistencia para no perder el lugar." />
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {agendadas.map((tutoria) => (
              <TutoriaCard
                key={tutoria.id}
                tutoria={tutoria}
                variant="agendada"
                esMiMateria
                busy={accion === tutoria.id}
                onConfirmar={handleConfirmar}
                onCancelar={handleCancelar}
              />
            ))}
          </div>
        </section>
      )}

      {/* Tutorías de tus materias (agrupadas) */}
      {tusGrupos.length > 0 && (
        <section className="space-y-4">
          <SectionHeader icon={BookOpen} title="Tutorías de tus materias" subtitle="Los horarios de las materias que ya venís cursando." />
          {renderGrupos(tusGrupos)}
        </section>
      )}

      {/* Explorá otras tutorías */}
      {otrosGrupos.length > 0 && (
        <section className="space-y-4">
          <SectionHeader icon={Compass} title={tusGrupos.length > 0 ? 'Explorá otras tutorías' : 'Explorá las tutorías disponibles'} subtitle="Ayuda de otras materias que quizás te sirva." accent="orange" />
          {renderGrupos(otrosGrupos)}
        </section>
      )}

      {tusGrupos.length === 0 && otrosGrupos.length === 0 && (
        <div className="rounded-2xl border bg-card py-16 text-center">
          <GraduationCap className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
          <p className="text-muted-foreground">No hay tutorías disponibles por ahora. Volvé pronto.</p>
        </div>
      )}

      <RankingTutores />

      <AgendarTutoriaDialog
        tutoria={agendarTarget}
        open={agendarTarget != null}
        loading={accion != null}
        onOpenChange={(v) => { if (!v) setAgendarTarget(null); }}
        onConfirm={(temario) => { if (agendarTarget) handleAgendar(agendarTarget, temario); }}
      />
    </div>
  );
}
