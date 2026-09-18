import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/layouts/PageHeader';
import { StatStrip, type StatItem } from '@/components/common/StatStrip';
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Award,
  BookOpen,
  CheckCircle,
  Edit,
  Eye,
  GraduationCap,
  Library,
  Loader2,
  Plus,
  Search,
  Trash2,
  UserCheck,
  UserPlus,
  Users,
  UserX,
  XCircle,
  type LucideIcon,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { useMaterias, useMisMaterias } from '@/hooks/useMaterias';
import { useRolePermissions } from '@/hooks/useRolePermissions';
import { materiasApi } from '@/lib/api/materias';
import type { Materia } from '@/lib/types/materias';
import PermissionGuard from '@/components/auth/PermissionGuard';
import { MateriaFormDialog } from './MateriaFormDialog';
import { DeleteMateriaDialog } from './DeleteMateriaDialog';
import { MapaCorrelativas } from './MapaCorrelativas';
import TutoriasManagement from '@/components/tutorias/TutoriasManagement';
import { useNavigate, useSearchParams } from 'react-router-dom';

const ROLE_ANALISTA = 'ANALISTA';
const ROLE_ADMIN = 'ADMIN';
const ROLE_DOCENTE = 'DOCENTE';
const ROLE_ESTUDIANTE = 'ESTUDIANTE';

type MateriasTab = 'mapa' | 'listado' | 'tutorias';
const TABS_VALIDOS: MateriasTab[] = ['mapa', 'listado', 'tutorias'];

export default function MateriasManagement() {
  const { user } = useAuth();
  const rol = user?.rol ?? '';

  // La pestaña vive en la URL para que el link sea compartible y para que
  // /tutorias pueda redirigir acá sin perder a dónde iba.
  const [searchParams] = useSearchParams();
  const tabParam = searchParams.get('tab') as MateriasTab | null;
  const tab: MateriasTab = tabParam && TABS_VALIDOS.includes(tabParam) ? tabParam : 'mapa';

  let view: ReactNode = null;
  if (rol === ROLE_ANALISTA || rol === ROLE_ADMIN) {
    view = <AdminMateriasView />;
  } else if (rol === ROLE_DOCENTE) {
    view = <DocenteMateriasView />;
  } else if (rol === ROLE_ESTUDIANTE) {
    view = <EstudianteMateriasView />;
  }

  if (!view) {
    return (
      <div className="py-12">
        <EmptyState
          icon={BookOpen}
          title="Materias"
          description="No tienes acceso al módulo de materias."
        />
      </div>
    );
  }

  // Una sola superficie: header con toggle Mapa/Listado. El mapa es la vista por defecto.
  return (
    <div className="space-y-5">
      <PageHeader
        title={ENCABEZADO[tab].titulo}
        description={ENCABEZADO[tab].bajada}
        accentColor="#9333ea"
      />

      {renderTab(tab, view)}
    </div>
  );
}

/*
  Cada pestaña es una tarea distinta, así que cada una trae su propio título.
  Antes el H1 decía "Materias" aunque estuvieras mirando 144 tutorías.

  Las tres se quedan: el mapa recorre UNA carrera, el catálogo son las 252 de las
  18 carreras con sus filtros y la gestión, y tutorías es la agenda. La lista
  lateral del mapa no reemplaza al catálogo — está acotada a la carrera elegida.
*/
const ENCABEZADO: Record<MateriasTab, { titulo: string; bajada: string }> = {
  mapa: {
    titulo: 'Plan de estudios',
    bajada: 'El plan como un mapa: materias, correlativas y tu avance.',
  },
  listado: {
    titulo: 'Catálogo de materias',
    bajada: 'Todas las carreras, con filtros y gestión.',
  },
  tutorias: {
    titulo: 'Tutorías',
    bajada: 'Las tutorías de todas tus materias, en un solo lugar.',
  },
};

function renderTab(tab: MateriasTab, listado: ReactNode): ReactNode {
  if (tab === 'mapa') return <MapaCorrelativas embedded withList />;
  if (tab === 'tutorias') return <TutoriasManagement embedded />;
  return listado;
}

// ----- Helpers compartidos -----
function sum(list: Materia[], pick: (m: Materia) => number | null | undefined): number {
  return list.reduce((acc, m) => acc + (pick(m) ?? 0), 0);
}

function distinctCarreras(list: Materia[]): { id: number; nombre: string }[] {
  const map = new Map<number, string>();
  list.forEach((m) => {
    if (m.carreraId != null && m.carreraNombre) map.set(m.carreraId, m.carreraNombre);
  });
  return Array.from(map, ([id, nombre]) => ({ id, nombre })).sort((a, b) => a.nombre.localeCompare(b.nombre));
}

function detailPath(id: number): string {
  return `/materias/${id}`;
}

// ----- Sistema de acentos por materia (colores de marca UTEC) -----
interface Accent {
  icon: string;
  soft: string;
  grad: string;
  hoverBorder: string;
  bar: string;
  chip: string;
}

const ACCENTS: Accent[] = [
  { icon: 'text-utec-blue',   soft: 'bg-utec-blue/10',   grad: 'from-utec-blue/10',   hoverBorder: 'hover:border-utec-blue/40',   bar: 'bg-utec-blue',   chip: 'bg-utec-blue/10 text-utec-blue' },
  { icon: 'text-utec-purple', soft: 'bg-utec-purple/10', grad: 'from-utec-purple/10', hoverBorder: 'hover:border-utec-purple/40', bar: 'bg-utec-purple', chip: 'bg-utec-purple/10 text-utec-purple' },
  { icon: 'text-utec-green',  soft: 'bg-utec-green/10',  grad: 'from-utec-green/10',  hoverBorder: 'hover:border-utec-green/40',  bar: 'bg-utec-green',  chip: 'bg-utec-green/10 text-utec-green' },
  { icon: 'text-utec-orange', soft: 'bg-utec-orange/10', grad: 'from-utec-orange/10', hoverBorder: 'hover:border-utec-orange/40', bar: 'bg-utec-orange', chip: 'bg-utec-orange/10 text-utec-orange' },
];

// Materias de la misma carrera comparten acento; fallback a semestre / id.
function accentFor(m: Materia): Accent {
  const key = m.carreraId ?? m.semestre ?? m.id ?? 0;
  return ACCENTS[Math.abs(key) % ACCENTS.length];
}

function MiniStat({ icon: Icon, value, label }: Readonly<{ icon: LucideIcon; value: ReactNode; label: string }>) {
  return (
    <div className="px-2 py-2.5">
      <div className="flex items-center justify-center gap-1 text-sm font-semibold tabular-nums text-foreground">
        <Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        {value}
      </div>
      <div className="mt-0.5 text-2xs uppercase tracking-wide text-muted-foreground">{label}</div>
    </div>
  );
}

/**
 * Card de materia estilo bento: banda superior con acento de color, chip de
 * código mono, nombre destacado, docente y una fila de mini-stats. Se usa en
 * las vistas de docente y estudiante.
 */
function MateriaCard({
  materia,
  statusBadge,
  footer,
  onOpen,
}: Readonly<{
  materia: Materia;
  statusBadge?: ReactNode;
  footer?: ReactNode;
  onOpen: () => void;
}>) {
  const a = accentFor(materia);
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onOpen(); } }}
      className={`group flex flex-col overflow-hidden rounded-2xl border bg-card cursor-pointer transition-all hover:shadow-lg hover:-translate-y-0.5 ${a.hoverBorder}`}
    >
      <div className={`relative bg-gradient-to-br ${a.grad} to-transparent px-4 pt-4 pb-3`}>
        <span className={`absolute left-0 top-4 h-9 w-1 rounded-r-full ${a.bar}`} />
        <div className="flex items-start justify-between gap-2">
          <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${a.soft} ${a.icon} shrink-0`}>
            <BookOpen className="h-5 w-5" />
          </span>
          {statusBadge}
        </div>
        {materia.codigo && (
          <span className={`mt-3 inline-flex items-center rounded-md px-1.5 py-0.5 font-mono text-2xs font-semibold ${a.chip}`}>
            {materia.codigo}
          </span>
        )}
        <h3 className="mt-1.5 font-semibold leading-snug line-clamp-2">{materia.nombre}</h3>
        <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">
          {materia.carreraNombre ?? 'Sin carrera'}
        </p>
      </div>

      <div className="flex items-center gap-1.5 border-t px-4 py-2 text-xs">
        {materia.docenteNombre ? (
          <>
            <UserCheck className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <span className="truncate text-muted-foreground">{materia.docenteNombre}</span>
          </>
        ) : (
          <>
            <UserX className="h-3.5 w-3.5 shrink-0 text-utec-orange" />
            <span className="text-utec-orange">Sin docente asignado</span>
          </>
        )}
      </div>

      <div className="grid grid-cols-3 divide-x border-t text-center">
        <MiniStat icon={Award} value={materia.creditos ?? '—'} label="Créditos" />
        <MiniStat icon={Users} value={materia.totalInscriptos ?? 0} label="Inscriptos" />
        <MiniStat icon={GraduationCap} value={materia.semestre ?? '—'} label="Semestre" />
      </div>

      {footer && (
        <div className="mt-auto flex items-center gap-2 border-t px-3 py-2.5" onClick={(e) => e.stopPropagation()}>
          {footer}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Vista ANALISTA / ADMIN - CRUD global con tabla, KPIs, filtros y detalle
// ============================================================================
type SortKey = 'nombre' | 'semestre' | 'creditos' | 'inscriptos';

function AdminMateriasView() {
  const { materias, loading, refresh } = useMaterias();
  const [createDialog, setCreateDialog] = useState(false);
  const [editDialog, setEditDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [selected, setSelected] = useState<Materia | null>(null);
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [carreraFilter, setCarreraFilter] = useState('all');
  const [semestreFilter, setSemestreFilter] = useState('all');
  const [sortKey, setSortKey] = useState<SortKey>('nombre');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const activas = useMemo(() => materias.filter((m) => !m.deletedAt), [materias]);

  const kpis: StatItem[] = useMemo(() => {
    const sinDocente = activas.filter((m) => m.docenteId == null).length;
    /*
      "Con docente" y "Sin docente" eran el mismo dato y su complemento, y con el
      plan completo daban 252 y 0: dos tiles para decir "no falta ninguno". Queda
      sólo el que pide acción, y sólo cuando hay algo que hacer.
    */
    return [
      { label: 'Materias', value: activas.length, icon: BookOpen, bg: 'dark' },
      { label: 'Inscriptos', value: sum(activas, (m) => m.totalInscriptos), icon: Users, bg: 'blue' },
      { label: 'Carreras', value: distinctCarreras(activas).length, icon: Library, bg: 'cyan' },
      { label: 'Créditos', value: sum(activas, (m) => m.creditos), hint: 'Totales', icon: Award, bg: 'yellow' },
      ...(sinDocente > 0
        ? [{ label: 'Sin docente', value: sinDocente, hint: 'Requieren asignación', icon: UserX, bg: 'orange' } as StatItem]
        : []),
    ];
  }, [activas]);

  const carreraOptions = useMemo(() => distinctCarreras(activas), [activas]);
  const semestreOptions = useMemo(
    () => Array.from(new Set(activas.map((m) => m.semestre).filter((s): s is number => s != null))).sort((a, b) => a - b),
    [activas],
  );

  // 252 materias renderizadas de una eran 12k nodos en el DOM. El endpoint no
  // pagina, así que la lista se corta acá.
  const [pagina, setPagina] = useState(0);
  const POR_PAGINA = 25;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = activas.filter((m) => {
      if (q && !m.nombre.toLowerCase().includes(q) && !(m.codigo ?? '').toLowerCase().includes(q)) return false;
      if (carreraFilter !== 'all' && String(m.carreraId) !== carreraFilter) return false;
      if (semestreFilter !== 'all' && String(m.semestre) !== semestreFilter) return false;
      return true;
    });
    const dir = sortDir === 'asc' ? 1 : -1;
    list = [...list].sort((a, b) => {
      if (sortKey === 'nombre') return a.nombre.localeCompare(b.nombre) * dir;
      const pick = (m: Materia) =>
        (sortKey === 'inscriptos' ? m.totalInscriptos : sortKey === 'creditos' ? m.creditos : m.semestre) ?? 0;
      return (pick(a) - pick(b)) * dir;
    });
    return list;
  }, [activas, search, carreraFilter, semestreFilter, sortKey, sortDir]);

  const totalPaginas = Math.max(1, Math.ceil(filtered.length / POR_PAGINA));
  const paginaActual = Math.min(pagina, totalPaginas - 1);
  const visibles = filtered.slice(paginaActual * POR_PAGINA, paginaActual * POR_PAGINA + POR_PAGINA);

  // Al filtrar, la página en la que estabas puede dejar de existir.
  useEffect(() => { setPagina(0); }, [search, carreraFilter, semestreFilter]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(key); setSortDir('asc'); }
  };

  const SortHead = ({ label, k, className }: { label: string; k: SortKey; className?: string }) => (
    <TableHead className={className}>
      <button
        type="button"
        onClick={() => toggleSort(k)}
        className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
      >
        {label}
        {sortKey === k
          ? (sortDir === 'asc' ? <ArrowUp className="h-3.5 w-3.5" /> : <ArrowDown className="h-3.5 w-3.5" />)
          : <ArrowUpDown className="h-3.5 w-3.5 opacity-40" />}
      </button>
    </TableHead>
  );

  const handleEdit = (m: Materia) => { setSelected(m); setEditDialog(true); };
  const handleDelete = (m: Materia) => { setSelected(m); setDeleteDialog(true); };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{activas.length}</span> materias · administra alta, edición y baja lógica
        </p>
        <PermissionGuard requiredPermission="materia:crear">
          <Button onClick={() => setCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Crear Materia
          </Button>
        </PermissionGuard>
      </div>

      <StatStrip items={kpis} loading={loading && activas.length === 0} />

      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre o código…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-9"
          />
        </div>
        <Select value={carreraFilter} onValueChange={setCarreraFilter}>
          <SelectTrigger className="w-[190px] h-9"><SelectValue placeholder="Carrera" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las carreras</SelectItem>
            {carreraOptions.map((c) => (
              <SelectItem key={c.id} value={String(c.id)}>{c.nombre}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={semestreFilter} onValueChange={setSemestreFilter}>
          <SelectTrigger className="w-[150px] h-9"><SelectValue placeholder="Semestre" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todo semestre</SelectItem>
            {semestreOptions.map((s) => (
              <SelectItem key={s} value={String(s)}>Semestre {s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="flex items-center gap-2.5 px-4 py-2.5 bg-chrome text-white">
          <span className="w-1 h-4 rounded-sm bg-utec-blue shrink-0" />
          <BookOpen className="h-4 w-4 text-utec-blue" />
          <span className="text-sm font-semibold">Materias</span>
          {!loading && <span className="ml-auto text-xs text-white/60 tabular-nums">{filtered.length} de {activas.length}</span>}
        </div>
        {(() => {
          if (loading) {
            return (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            );
          }
          if (activas.length === 0) {
            return (
              <div className="py-12">
                <EmptyState icon={BookOpen} title="No hay materias registradas" description="Crea la primera materia para comenzar." />
              </div>
            );
          }
          if (filtered.length === 0) {
            return (
              <div className="py-12">
                <EmptyState icon={Search} title="Sin resultados" description="Ninguna materia coincide con los filtros." />
              </div>
            );
          }
          return (
            <Table>
              <TableHeader>
                <TableRow>
                  <SortHead label="Materia" k="nombre" />
                  <TableHead>Carrera</TableHead>
                  <TableHead>Docente</TableHead>
                  <SortHead label="Semestre" k="semestre" className="text-center" />
                  <SortHead label="Créditos" k="creditos" className="text-center" />
                  <SortHead label="Inscriptos" k="inscriptos" className="text-center" />
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibles.map((materia) => {
                  const a = accentFor(materia);
                  return (
                  <TableRow
                    key={materia.id}
                    onClick={() => navigate(detailPath(materia.id))}
                    className="cursor-pointer transition-colors hover:bg-muted/40"
                  >
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${a.soft} ${a.icon} shrink-0`}>
                          <BookOpen className="h-4 w-4" />
                        </span>
                        <div className="min-w-0">
                          <div className="font-medium truncate">{materia.nombre}</div>
                          {materia.codigo && (
                            <div className="font-mono text-2xs text-muted-foreground">{materia.codigo}</div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {materia.carreraNombre
                        ? <Badge className="bg-utec-blue/10 text-utec-blue border-utec-blue/20 border text-xs font-medium">{materia.carreraNombre}</Badge>
                        : <span className="text-muted-foreground text-xs">—</span>}
                    </TableCell>
                    <TableCell>
                      {materia.docenteNombre
                        ? <span className="text-sm">{materia.docenteNombre}</span>
                        : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-utec-orange/10 px-2 py-0.5 text-xs font-medium text-utec-orange">
                            <UserX className="h-3 w-3" />Sin asignar
                          </span>
                        )}
                    </TableCell>
                    <TableCell className="text-center">
                      {materia.semestre != null
                        ? <Badge variant="outline" className="text-xs tabular-nums">Sem {materia.semestre}</Badge>
                        : <span className="text-muted-foreground text-xs">—</span>}
                    </TableCell>
                    <TableCell className="text-center tabular-nums">
                      {materia.creditos != null
                        ? <span className="inline-flex items-center gap-1 text-sm"><Award className="h-3.5 w-3.5 text-utec-yellow" />{materia.creditos}</span>
                        : <span className="text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="inline-flex items-center gap-1 rounded-full bg-utec-blue/10 px-2 py-0.5 text-xs font-semibold text-utec-blue tabular-nums">
                        <Users className="h-3 w-3" />{materia.totalInscriptos ?? 0}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                        <PermissionGuard requiredPermission="materia:ver_inscriptos">
                          <Button variant="ghost" size="sm" title="Ver inscriptos" onClick={() => navigate(detailPath(materia.id))}>
                            <Users className="h-4 w-4" />
                          </Button>
                        </PermissionGuard>
                        <PermissionGuard requiredPermission="materia:editar">
                          <Button variant="ghost" size="sm" title="Editar" onClick={() => handleEdit(materia)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                        </PermissionGuard>
                        <PermissionGuard requiredPermission="materia:eliminar">
                          <Button variant="ghost" size="sm" title="Eliminar" onClick={() => handleDelete(materia)} className="text-destructive hover:text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </PermissionGuard>
                      </div>
                    </TableCell>
                  </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          );
        })()}

        {filtered.length > POR_PAGINA && (
          <div className="flex items-center justify-between gap-3 border-t px-4 py-2.5">
            <span className="text-xs text-muted-foreground tabular-nums">
              {paginaActual * POR_PAGINA + 1}–{paginaActual * POR_PAGINA + visibles.length} de {filtered.length}
            </span>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2"
                onClick={() => setPagina(paginaActual - 1)}
                disabled={paginaActual === 0}
              >
                Anterior
              </Button>
              <span className="px-1 text-xs text-muted-foreground tabular-nums">
                {paginaActual + 1} / {totalPaginas}
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2"
                onClick={() => setPagina(paginaActual + 1)}
                disabled={paginaActual >= totalPaginas - 1}
              >
                Siguiente
              </Button>
            </div>
          </div>
        )}
      </div>

      <MateriaFormDialog materia={null} open={createDialog} onOpenChange={setCreateDialog} onSuccess={() => refresh()} />
      <MateriaFormDialog materia={selected} open={editDialog} onOpenChange={setEditDialog} onSuccess={() => refresh()} />
      <DeleteMateriaDialog materia={selected} open={deleteDialog} onOpenChange={setDeleteDialog} onSuccess={() => refresh()} />
    </div>
  );
}

// ============================================================================
// Vista DOCENTE - sus materias con KPIs, detalle y edición
// ============================================================================
function DocenteMateriasView() {
  const { materias, loading, refresh } = useMisMaterias('dicto');
  const [editDialog, setEditDialog] = useState(false);
  const [selected, setSelected] = useState<Materia | null>(null);
  const navigate = useNavigate();

  const kpis: StatItem[] = useMemo(() => [
    { label: 'Materias', value: materias.length, icon: BookOpen, bg: 'dark' },
    { label: 'Inscriptos', value: sum(materias, (m) => m.totalInscriptos), icon: Users, bg: 'blue' },
    { label: 'Carreras', value: distinctCarreras(materias).length, icon: Library, bg: 'cyan' },
    { label: 'Créditos', value: sum(materias, (m) => m.creditos), icon: Award, bg: 'yellow' },
  ], [materias]);

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Materias que dictas. Entrá al detalle para gestionar inscriptos, recursos y tutorías.
      </p>

      {!(loading && materias.length === 0) && materias.length > 0 && <StatStrip items={kpis} />}

      {(() => {
        if (loading) {
          return (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          );
        }
        if (materias.length === 0) {
          return (
            <div className="py-12">
              <EmptyState icon={BookOpen} title="No dictas materias" description="Aún no tienes materias asignadas." />
            </div>
          );
        }
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {materias.map((materia) => (
              <MateriaCard
                key={materia.id}
                materia={materia}
                onOpen={() => navigate(detailPath(materia.id))}
                footer={
                  <>
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => navigate(detailPath(materia.id))}>
                      <Eye className="h-4 w-4 mr-1" />
                      Ver detalle
                    </Button>
                    <PermissionGuard requiredPermission="materia:editar">
                      <Button variant="ghost" size="sm" onClick={() => { setSelected(materia); setEditDialog(true); }}>
                        <Edit className="h-4 w-4 mr-1" />
                        Editar
                      </Button>
                    </PermissionGuard>
                  </>
                }
              />
            ))}
          </div>
        );
      })()}

      <MateriaFormDialog materia={selected} open={editDialog} onOpenChange={setEditDialog} onSuccess={() => refresh()} />
    </div>
  );
}

// ============================================================================
// Vista ESTUDIANTE - materias inscriptas + inscribirse a otras
// ============================================================================
function EstudianteMateriasView() {
  const { hasPermission } = useRolePermissions();
  const { materias: misMaterias, loading: loadingMias, refresh: refreshMias } = useMisMaterias('curso');
  const { materias: todas, loading: loadingTodas, refresh: refreshTodas } = useMaterias();
  const [actionId, setActionId] = useState<number | null>(null);
  const navigate = useNavigate();

  const inscriptasIds = useMemo(() => new Set(misMaterias.map((m) => m.id)), [misMaterias]);
  const disponibles = useMemo(
    () => todas.filter((m) => !m.deletedAt && !inscriptasIds.has(m.id)),
    [todas, inscriptasIds],
  );

  // Casi 250 materias dibujadas de una eran 13.000 nodos en el DOM, la pantalla
  // mas pesada de la app. Y sin buscador no se encontraba ninguna igual.
  const [busqueda, setBusqueda] = useState('');
  const [pagina, setPagina] = useState(0);
  const [paginaMias, setPaginaMias] = useState(0);
  const POR_PAGINA = 24;

  const filtradas = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return disponibles;
    return disponibles.filter(
      (m) => m.nombre.toLowerCase().includes(q) || (m.codigo ?? '').toLowerCase().includes(q),
    );
  }, [disponibles, busqueda]);

  const totalPaginas = Math.max(1, Math.ceil(filtradas.length / POR_PAGINA));
  const paginaActual = Math.min(pagina, totalPaginas - 1);
  const visibles = filtradas.slice(paginaActual * POR_PAGINA, paginaActual * POR_PAGINA + POR_PAGINA);

  // Al buscar, la página en la que estabas puede dejar de existir.
  useEffect(() => { setPagina(0); }, [busqueda]);

  const totalPaginasMias = Math.max(1, Math.ceil(misMaterias.length / POR_PAGINA));
  const paginaMiasActual = Math.min(paginaMias, totalPaginasMias - 1);
  const miasVisibles = misMaterias.slice(
    paginaMiasActual * POR_PAGINA,
    paginaMiasActual * POR_PAGINA + POR_PAGINA,
  );

  const kpis: StatItem[] = useMemo(() => [
    { label: 'Inscriptas', value: misMaterias.length, icon: BookOpen, bg: 'blue' },
    { label: 'Créditos', value: sum(misMaterias, (m) => m.creditos), hint: 'Cursando', icon: Award, bg: 'green' },
    { label: 'Carreras', value: distinctCarreras(misMaterias).length, icon: Library, bg: 'cyan' },
    { label: 'Disponibles', value: disponibles.length, icon: GraduationCap, bg: 'dark' },
  ], [misMaterias, disponibles.length]);

  const handleInscribirse = async (materia: Materia) => {
    try {
      setActionId(materia.id);
      await materiasApi.inscribirse(materia.id);
      toast.success('Inscripción realizada', { description: `Te inscribiste en ${materia.nombre}.` });
      await Promise.all([refreshMias(), refreshTodas()]);
    } catch (error: unknown) {
      const description = error instanceof Error ? error.message : 'No se pudo completar la inscripción';
      toast.error('Error al inscribirse', { description });
    } finally {
      setActionId(null);
    }
  };

  const handleCancelar = async (materia: Materia) => {
    try {
      setActionId(materia.id);
      const response = await materiasApi.misInscripciones();
      const inscripcion = (response.data ?? []).find((i) => i.materiaId === materia.id);
      if (!inscripcion) {
        toast.error('No se encontró la inscripción a cancelar');
        return;
      }
      await materiasApi.cancelarInscripcion(inscripcion.id);
      toast.success('Inscripción cancelada', { description: `Cancelaste ${materia.nombre}.` });
      await Promise.all([refreshMias(), refreshTodas()]);
    } catch (error: unknown) {
      const description = error instanceof Error ? error.message : 'No se pudo cancelar la inscripción';
      toast.error('Error al cancelar', { description });
    } finally {
      setActionId(null);
    }
  };

  const renderCard = (materia: Materia, inscripta: boolean) => (
    <MateriaCard
      key={materia.id}
      materia={materia}
      onOpen={() => navigate(detailPath(materia.id))}
      statusBadge={
        inscripta ? (
          <Badge className="bg-utec-green text-marca-tinta border-utec-green text-2xs gap-1 shrink-0">
            <CheckCircle className="h-3 w-3" />Inscripta
          </Badge>
        ) : (
          <Badge variant="outline" className="text-2xs shrink-0">Disponible</Badge>
        )
      }
      footer={
        <>
          <Button variant="outline" size="sm" className="flex-1" onClick={() => navigate(detailPath(materia.id))}>
            <Eye className="h-4 w-4 mr-1" />
            Ver detalle
          </Button>
          {inscripta ? (
            <PermissionGuard requiredPermission="inscripcion:cancelar">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleCancelar(materia)}
                disabled={actionId === materia.id}
                className="text-destructive hover:text-destructive"
              >
                {actionId === materia.id ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <XCircle className="h-4 w-4 mr-1" />}
                Cancelar
              </Button>
            </PermissionGuard>
          ) : (
            <Button size="sm" onClick={() => handleInscribirse(materia)} disabled={actionId === materia.id}>
              {actionId === materia.id ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <UserPlus className="h-4 w-4 mr-1" />}
              Inscribirse
            </Button>
          )}
        </>
      }
    />
  );

  return (
    <div className="space-y-8">
      <p className="text-sm text-muted-foreground">
        Consulta tus materias inscriptas e inscríbete en nuevas.
      </p>

      {!(loadingMias && misMaterias.length === 0) && <StatStrip items={kpis} />}

      <section className="space-y-4">
        <div className="flex items-center gap-2.5">
          <span className="w-1 h-4 rounded-sm bg-utec-blue shrink-0" />
          <BookOpen className="h-4 w-4 text-utec-blue" />
          <h2 className="text-lg font-medium tracking-tight">Inscriptas</h2>
          {misMaterias.length > 0 && <span className="text-xs text-muted-foreground tabular-nums">{misMaterias.length}</span>}
        </div>
        {(() => {
          if (loadingMias) {
            return <div className="flex items-center justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
          }
          if (misMaterias.length === 0) {
            return <EmptyState icon={GraduationCap} title="No estás inscripto en materias" description="Inscríbete en alguna de las materias disponibles." />;
          }
          return (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {miasVisibles.map((m) => renderCard(m, true))}
              </div>
              {misMaterias.length > POR_PAGINA && (
                <div className="flex items-center justify-between gap-3 border-t pt-3">
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {paginaMiasActual * POR_PAGINA + 1}–{paginaMiasActual * POR_PAGINA + miasVisibles.length} de {misMaterias.length}
                  </span>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="sm" className="h-7 px-2" onClick={() => setPaginaMias(paginaMiasActual - 1)} disabled={paginaMiasActual === 0}>
                      Anterior
                    </Button>
                    <span className="px-1 text-xs text-muted-foreground tabular-nums">
                      {paginaMiasActual + 1} / {totalPaginasMias}
                    </span>
                    <Button variant="ghost" size="sm" className="h-7 px-2" onClick={() => setPaginaMias(paginaMiasActual + 1)} disabled={paginaMiasActual >= totalPaginasMias - 1}>
                      Siguiente
                    </Button>
                  </div>
                </div>
              )}
            </>
          );
        })()}
      </section>

      {hasPermission('inscripcion:crear') && (
        <section className="space-y-4">
          <div className="flex items-center gap-2.5">
            <span className="w-1 h-4 rounded-sm bg-utec-green shrink-0" />
            <GraduationCap className="h-4 w-4 text-utec-green" />
            <h2 className="text-lg font-medium tracking-tight">Disponibles para inscribirse</h2>
            {disponibles.length > 0 && <span className="text-xs text-muted-foreground tabular-nums">{disponibles.length}</span>}
            {disponibles.length > POR_PAGINA && (
              <div className="relative ml-auto w-full max-w-[240px]">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar materia o código…"
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  className="pl-8 h-9"
                />
              </div>
            )}
          </div>
          {(() => {
            if (loadingTodas) {
              return <div className="flex items-center justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
            }
            if (disponibles.length === 0) {
              return <EmptyState icon={BookOpen} title="No hay materias disponibles" description="Estás inscripto en todas las materias disponibles." />;
            }
            if (filtradas.length === 0) {
              return <EmptyState icon={Search} title="Ninguna materia coincide" description={`Nada coincide con «${busqueda}».`} />;
            }
            return (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {visibles.map((m) => renderCard(m, false))}
                </div>
                {filtradas.length > POR_PAGINA && (
                  <div className="flex items-center justify-between gap-3 border-t pt-3">
                    <span className="text-xs text-muted-foreground tabular-nums">
                      {paginaActual * POR_PAGINA + 1}–{paginaActual * POR_PAGINA + visibles.length} de {filtradas.length}
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
        </section>
      )}
    </div>
  );
}
