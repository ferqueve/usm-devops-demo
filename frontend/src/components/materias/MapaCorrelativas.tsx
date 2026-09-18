import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/Button';
import {
  ArrowLeft, Check, GraduationCap, KeyRound, Loader2, Lock, Maximize2, Milestone, Route as RouteIcon, Search, ZoomIn, ZoomOut,
} from 'lucide-react';
import { toast } from 'sonner';
import { carrerasApi } from '@/lib/api/carreras';
import { materiasApi } from '@/lib/api/materias';
import type { Carrera } from '@/lib/types/spaces';
import type { EstadoMapa, MapaCarrera, MapaNodo } from '@/lib/types/materias';
import { MARCA, NEUTRO, escalaDe } from '@/lib/design/paleta';

// --- Geometría del tablero ---
const COL_W = 260;
const ROW_H = 112;
const NODE_W = 208;
const NODE_H = 80;
const PAD_X = 56;
const PAD_Y = 48;
const SIN_SEMESTRE = 999;

const STORAGE_CARRERA = 'materias_mapa_carrera';

type EstadoKey = EstadoMapa | 'NEUTRO';
type NodeStyle = { fill: string; stroke: string; text: string; sub: string };

interface Paleta {
  estado: Record<EstadoKey, NodeStyle>;
  sem: NodeStyle[];
  board: string;
  edge: string;
  edgeAprobada: string;
  edgeDim: string;
  semText: string;
}

/*
 * Color por semestre (vista sin progreso: admin/docente). Índice = (semestre-1) % 6.
 *
 * Los seis salen de los seis colores de la marca y las cuatro piezas de cada
 * uno las calcula `escalaDe`. Antes eran cuarenta y ocho hex escritos a mano
 * —uno por pieza, por semestre y por tema— y entre ellos había un morado
 * (#9333ea) que no es de la marca.
 */
const TONOS_SEMESTRE = [MARCA.azul, MARCA.cian, MARCA.verde, MARCA.amarillo, MARCA.naranja, MARCA.rojo];

const porSemestre = (tema: 'claro' | 'oscuro'): NodeStyle[] =>
  TONOS_SEMESTRE.map((hex) => {
    const e = escalaDe(hex, tema);
    return { fill: e.suave, stroke: e.solido, text: e.texto, sub: e.suaveTexto };
  });

const SEM_LIGHT: NodeStyle[] = porSemestre('claro');
const SEM_DARK: NodeStyle[] = porSemestre('oscuro');

/*
 * Estado de cada materia. Sale de la marca igual que los semestres: verde
 * para lo cursado, cian para lo que está en curso, y los neutros de la
 * superficie para lo disponible y lo bloqueado. Antes eran otros veinte hex a
 * mano por tema.
 *
 * El tablero no puede usar los tokens de Tailwind: es un gradiente que se
 * arma como string para un <svg>, así que se compone con los valores de la
 * escala.
 */
function paletaDe(tema: 'claro' | 'oscuro'): Paleta {
  const claro = tema === 'claro';
  const verde = escalaDe(MARCA.verde, tema);
  const cian = escalaDe(MARCA.cian, tema);
  const azul = escalaDe(MARCA.azul, tema);
  const gris = escalaDe(MARCA.oscuro, tema);
  const superficie = claro ? '#ffffff' : gris.suave;
  const tinta = claro ? MARCA.oscuro : NEUTRO.oscuro.texto;
  const apagado = claro ? NEUTRO.claro.eje : NEUTRO.oscuro.eje;

  return {
    estado: {
      APROBADA: { fill: MARCA.verde, stroke: verde.solido, text: verde.texto, sub: verde.suaveTexto },
      CURSANDO: { fill: MARCA.cian, stroke: cian.solido, text: cian.texto, sub: cian.suaveTexto },
      DISPONIBLE: { fill: superficie, stroke: MARCA.verde, text: tinta, sub: apagado },
      BLOQUEADA: { fill: gris.suave, stroke: gris.borde, text: apagado, sub: apagado },
      NEUTRO: { fill: superficie, stroke: azul.solido, text: tinta, sub: apagado },
    },
    sem: claro ? SEM_LIGHT : SEM_DARK,
    board: claro
      ? `radial-gradient(circle at 1px 1px, rgba(52,58,64,0.08) 1px, transparent 0) 0 0 / 26px 26px, linear-gradient(180deg, ${NEUTRO.claro.superficie}, ${NEUTRO.claro.vacio})`
      : `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.06) 1px, transparent 0) 0 0 / 26px 26px, linear-gradient(180deg, ${NEUTRO.oscuro.vacio}, ${NEUTRO.oscuro.superficie})`,
    edge: apagado,
    edgeAprobada: MARCA.verde,
    edgeDim: claro ? NEUTRO.claro.grilla : NEUTRO.oscuro.grilla,
    semText: apagado,
  };
}

const PALETA_LIGHT: Paleta = paletaDe('claro');
const PALETA_DARK: Paleta = paletaDe('oscuro');

const ESTADO_LABEL: Record<EstadoMapa, string> = {
  APROBADA: 'Cursada',
  CURSANDO: 'Cursando',
  DISPONIBLE: 'Disponible',
  BLOQUEADA: 'Bloqueada',
};

function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}

function truncar(s: string, n: number): string {
  return s.length > n ? `${s.slice(0, n - 1)}…` : s;
}

type Nodo = MapaNodo & { x: number; y: number };

interface Layout {
  nodos: Nodo[];
  edges: { from: number; to: number }[];
  columnas: { semestre: number; x: number }[];
  width: number;
  height: number;
  ancestros: Map<number, Set<number>>;
  descendientes: Map<number, Set<number>>;
}

function construirLayout(mapa: MapaCarrera | null): Layout {
  if (!mapa || mapa.materias.length === 0) {
    return { nodos: [], edges: [], columnas: [], width: 800, height: 400, ancestros: new Map(), descendientes: new Map() };
  }
  const idSet = new Set(mapa.materias.map((m) => m.id));

  // Agrupar por semestre (las sin semestre van a una columna final).
  const porSemestre = new Map<number, MapaNodo[]>();
  for (const m of mapa.materias) {
    const sem = m.semestre ?? SIN_SEMESTRE;
    if (!porSemestre.has(sem)) porSemestre.set(sem, []);
    porSemestre.get(sem)!.push(m);
  }
  const semestres = [...porSemestre.keys()].sort((a, b) => a - b);

  const nodos: Nodo[] = [];
  const columnas: { semestre: number; x: number }[] = [];
  let maxRows = 0;
  semestres.forEach((sem, col) => {
    const x = PAD_X + col * COL_W;
    columnas.push({ semestre: sem, x });
    const items = porSemestre.get(sem)!.slice().sort((a, b) => a.nombre.localeCompare(b.nombre));
    maxRows = Math.max(maxRows, items.length);
    items.forEach((m, row) => {
      nodos.push({ ...m, x, y: PAD_Y + row * ROW_H });
    });
  });

  // Aristas prereq -> materia (solo entre nodos presentes).
  const edges: { from: number; to: number }[] = [];
  const ancestros = new Map<number, Set<number>>();
  const descendientes = new Map<number, Set<number>>();
  for (const m of mapa.materias) {
    for (const pre of m.prerrequisitoIds) {
      if (idSet.has(pre)) edges.push({ from: pre, to: m.id });
    }
  }
  // Adyacencias directas.
  const prereqDe = new Map<number, number[]>();
  const desbloquea = new Map<number, number[]>();
  for (const e of edges) {
    if (!prereqDe.has(e.to)) prereqDe.set(e.to, []);
    prereqDe.get(e.to)!.push(e.from);
    if (!desbloquea.has(e.from)) desbloquea.set(e.from, []);
    desbloquea.get(e.from)!.push(e.to);
  }
  const cerrar = (start: number, adj: Map<number, number[]>): Set<number> => {
    const out = new Set<number>();
    const stack = [...(adj.get(start) ?? [])];
    while (stack.length) {
      const id = stack.pop()!;
      if (out.has(id)) continue;
      out.add(id);
      for (const nxt of adj.get(id) ?? []) stack.push(nxt);
    }
    return out;
  };
  for (const m of mapa.materias) {
    ancestros.set(m.id, cerrar(m.id, prereqDe));
    descendientes.set(m.id, cerrar(m.id, desbloquea));
  }

  const width = PAD_X * 2 + Math.max(1, semestres.length) * COL_W;
  const height = PAD_Y * 2 + Math.max(1, maxRows) * ROW_H;
  return { nodos, edges, columnas, width, height, ancestros, descendientes };
}

function edgePath(a: Nodo, b: Nodo): string {
  const ax = a.x + NODE_W;
  const ay = a.y + NODE_H / 2;
  const bx = b.x;
  const by = b.y + NODE_H / 2;
  const dx = Math.max(40, Math.abs(bx - ax) * 0.5);
  return `M ${ax} ${ay} C ${ax + dx} ${ay}, ${bx - dx} ${by}, ${bx} ${by}`;
}

export function MapaCorrelativas({ embedded = false, withList = false }: { embedded?: boolean; withList?: boolean }) {
  const navigate = useNavigate();
  const [busqueda, setBusqueda] = useState('');
  const [extra, setExtra] = useState<Set<number> | null>(null);
  const [carreras, setCarreras] = useState<Carrera[]>([]);
  const [carreraId, setCarreraId] = useState<number | null>(null);
  const [mapa, setMapa] = useState<MapaCarrera | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMapa, setLoadingMapa] = useState(false);
  const [hover, setHover] = useState<number | null>(null);
  const [dark, setDark] = useState(() =>
    typeof document !== 'undefined' && document.documentElement.classList.contains('dark'));
  const PAL = dark ? PALETA_DARK : PALETA_LIGHT;

  // Seguir el tema claro/oscuro de la app (clase `.dark` en el root).
  useEffect(() => {
    const el = document.documentElement;
    const obs = new MutationObserver(() => setDark(el.classList.contains('dark')));
    obs.observe(el, { attributes: true, attributeFilter: ['class'] });
    return () => obs.disconnect();
  }, []);

  const boardRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [view, setView] = useState({ x: 0, y: 0, k: 1 });
  const drag = useRef<{ x: number; y: number; vx: number; vy: number } | null>(null);
  const movio = useRef(false);
  const [dragging, setDragging] = useState(false);

  const layout = useMemo(() => construirLayout(mapa), [mapa]);

  // Cargar carreras y elegir por defecto la que tenga más materias (mapa poblado de entrada).
  useEffect(() => {
    let vivo = true;
    Promise.all([carrerasApi.obtenerCarreras(), materiasApi.obtenerMaterias()])
      .then(([resCarreras, resMaterias]) => {
        if (!vivo) return;
        const list = resCarreras.data ?? [];
        setCarreras(list);

        const conteo = new Map<number, number>();
        for (const m of resMaterias.data ?? []) {
          if (m.carreraId != null) conteo.set(m.carreraId, (conteo.get(m.carreraId) ?? 0) + 1);
        }
        const masPoblada = [...conteo.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];

        const guardada = Number(localStorage.getItem(STORAGE_CARRERA));
        const inicial = list.find((c) => c.id === guardada)?.id
          ?? (masPoblada != null ? masPoblada : list[0]?.id)
          ?? null;
        setCarreraId(inicial);
      })
      .catch(() => toast.error('No se pudieron cargar las carreras'))
      .finally(() => { if (vivo) setLoading(false); });
    return () => { vivo = false; };
  }, []);

  // Cargar mapa al cambiar de carrera.
  useEffect(() => {
    if (carreraId == null) return;
    let vivo = true;
    setLoadingMapa(true);
    localStorage.setItem(STORAGE_CARRERA, String(carreraId));
    materiasApi.obtenerMapa(carreraId)
      .then((res) => { if (vivo) setMapa(res.data ?? null); })
      .catch(() => { if (vivo) { setMapa(null); toast.error('No se pudo cargar el mapa'); } })
      .finally(() => { if (vivo) setLoadingMapa(false); });
    return () => { vivo = false; };
  }, [carreraId]);

  const ajustar = useCallback(() => {
    const board = boardRef.current;
    if (!board || layout.width === 0) return;
    const bw = board.clientWidth;
    const bh = board.clientHeight;
    const k = clamp(Math.min(bw / layout.width, bh / layout.height) * 0.94, 0.3, 1.4);
    setView({ x: (bw - layout.width * k) / 2, y: Math.max(16, (bh - layout.height * k) / 2), k });
  }, [layout.width, layout.height]);

  // Encajar el mapa cuando cambia el layout.
  useEffect(() => { ajustar(); }, [ajustar]);

  // Zoom con rueda (listener nativo para poder prevenir el scroll).
  useEffect(() => {
    const el = boardRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      setView((v) => {
        const k2 = clamp(v.k * (1 - e.deltaY * 0.0015), 0.3, 2.4);
        const ratio = k2 / v.k;
        return { x: mx - (mx - v.x) * ratio, y: my - (my - v.y) * ratio, k: k2 };
      });
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  const zoom = (factor: number) => {
    const el = boardRef.current;
    const cx = el ? el.clientWidth / 2 : 0;
    const cy = el ? el.clientHeight / 2 : 0;
    setView((v) => {
      const k2 = clamp(v.k * factor, 0.3, 2.4);
      const ratio = k2 / v.k;
      return { x: cx - (cx - v.x) * ratio, y: cy - (cy - v.y) * ratio, k: k2 };
    });
  };

  // Pan con listeners de ventana (sin pointer capture → no crashea ni pierde el pointer al soltar).
  const onPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    const start = { x: e.clientX, y: e.clientY, vx: view.x, vy: view.y };
    drag.current = start;
    movio.current = false;
    const move = (ev: PointerEvent) => {
      const dx = ev.clientX - start.x;
      const dy = ev.clientY - start.y;
      if (Math.abs(dx) + Math.abs(dy) > 4) movio.current = true;
      setView((v) => ({ ...v, x: start.vx + dx, y: start.vy + dy }));
    };
    const up = () => {
      drag.current = null;
      setDragging(false);
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
    };
    setDragging(true);
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
  };
  const abrirMateria = (id: number) => { if (!movio.current) navigate(`/materias/${id}`); };

  // Conjunto resaltado: prioridad al override (extra), si no la cadena del nodo bajo el mouse.
  const resaltado = useMemo(() => {
    if (extra) return extra;
    if (hover == null) return null;
    const set = new Set<number>([hover]);
    layout.ancestros.get(hover)?.forEach((id) => set.add(id));
    layout.descendientes.get(hover)?.forEach((id) => set.add(id));
    return set;
  }, [hover, layout, extra]);

  const posDe = useMemo(() => {
    const m = new Map<number, Nodo>();
    for (const n of layout.nodos) m.set(n.id, n);
    return m;
  }, [layout.nodos]);

  // Análisis del grafo: factor de bloqueo (cuántas materias desbloquea c/u) + ruta crítica.
  const analisis = useMemo(() => {
    const nodos = layout.nodos;
    const nombre = new Map(nodos.map((n) => [n.id, n]));
    // Materias-llave: mayor cantidad de materias que dependen (transitivamente) de ella.
    const llaves = nodos
      .map((n) => ({ nodo: n, bloquea: layout.descendientes.get(n.id)?.size ?? 0 }))
      .filter((x) => x.bloquea > 0)
      .sort((a, b) => b.bloquea - a.bloquea)
      .slice(0, 6);

    // Adyacencia directa (prereq -> materia) para la ruta más larga.
    const hijos = new Map<number, number[]>();
    for (const e of layout.edges) {
      if (!hijos.has(e.from)) hijos.set(e.from, []);
      hijos.get(e.from)!.push(e.to);
    }
    const memo = new Map<number, number[]>();
    const masLarga = (id: number): number[] => {
      if (memo.has(id)) return memo.get(id)!;
      let mejor: number[] = [];
      for (const h of hijos.get(id) ?? []) {
        const sub = masLarga(h);
        if (sub.length > mejor.length) mejor = sub;
      }
      const camino = [id, ...mejor];
      memo.set(id, camino);
      return camino;
    };
    let ruta: number[] = [];
    for (const n of nodos) {
      const c = masLarga(n.id);
      if (c.length > ruta.length) ruta = c;
    }
    return {
      llaves,
      rutaCritica: ruta.map((id) => nombre.get(id)!).filter(Boolean),
      profundidad: ruta.length,
    };
  }, [layout]);

  const progreso = mapa && mapa.conProgreso && mapa.totalMaterias > 0
    ? Math.round((mapa.materiasAprobadas / mapa.totalMaterias) * 100)
    : null;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin mr-2" /> Cargando…
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Encabezado */}
      <div className="flex flex-wrap items-center gap-3">
        {!embedded && (
          <Button variant="ghost" size="sm" onClick={() => navigate('/materias')} className="gap-1">
            <ArrowLeft className="h-4 w-4" /> Materias
          </Button>
        )}
        {/*
          Embebido dentro de Materias, la página ya pone el título "Plan de
          estudios" arriba: repetirlo acá era decirlo dos veces seguidas. Suelto
          en /materias/mapa sí lo necesita, porque no hay otro encabezado.
        */}
        {!embedded && (
          <div className="flex items-center gap-2">
            <RouteIcon className="h-5 w-5 text-marca-verde-texto" />
            <h1 className="text-base font-semibold">Mapa de la carrera</h1>
          </div>
        )}
        <div className="ml-auto flex items-center gap-2">
          <Select value={carreraId != null ? String(carreraId) : undefined} onValueChange={(v) => setCarreraId(Number(v))}>
            <SelectTrigger className="w-[240px] h-9"><SelectValue placeholder="Elegí una carrera" /></SelectTrigger>
            <SelectContent>
              {carreras.map((c) => <SelectItem key={c.id} value={String(c.id)}>{c.nombre}</SelectItem>)}
            </SelectContent>
          </Select>
          {embedded && (
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => navigate('/materias/mapa')} title="Ver en pantalla completa">
              <Maximize2 className="h-4 w-4" /> Ampliar
            </Button>
          )}
        </div>
      </div>

      {/* Barra de progreso del estudiante */}
      {progreso != null && mapa && (
        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="font-medium flex items-center gap-1.5"><GraduationCap className="h-4 w-4 text-marca-verde-texto" /> Tu avance en {mapa.carreraNombre}</span>
            <span className="text-muted-foreground">
              {mapa.materiasAprobadas}/{mapa.totalMaterias} materias · {mapa.creditosAprobados}/{mapa.totalCreditos} créditos
            </span>
          </div>
          <div className="h-3 rounded-full bg-muted overflow-hidden">
            <div className="h-full rounded-full bg-gradient-to-r from-utec-green to-utec-cyan transition-all duration-700"
                 style={{ width: `${progreso}%` }} />
          </div>
          <div className="text-right text-xs text-muted-foreground mt-1">{progreso}% completado</div>
        </div>
      )}

      {/* Leyenda + controles */}
      <div className="flex flex-wrap items-center gap-2">
        {mapa?.conProgreso
          ? (['APROBADA', 'CURSANDO', 'DISPONIBLE', 'BLOQUEADA'] as EstadoMapa[]).map((e) => (
              <span key={e} className="inline-flex items-center gap-1.5 text-xs rounded-full border px-2.5 py-1 bg-card">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: PAL.estado[e].fill, border: `1px solid ${PAL.estado[e].stroke}` }} />
                {ESTADO_LABEL[e]}
              </span>
            ))
          : layout.columnas.filter((c) => c.semestre !== SIN_SEMESTRE).map((c) => (
              <span key={c.semestre} className="inline-flex items-center gap-1.5 text-xs rounded-full border px-2.5 py-1 bg-card">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: PAL.sem[((c.semestre - 1) % 6 + 6) % 6].stroke }} />
                Sem {c.semestre}
              </span>
            ))}
        <div className="ml-auto flex items-center gap-1">
          <Button variant="outline" size="icon" className="h-8 w-8" title="Alejar" onClick={() => zoom(0.85)}><ZoomOut className="h-4 w-4" /></Button>
          <Button variant="outline" size="icon" className="h-8 w-8" title="Acercar" onClick={() => zoom(1.18)}><ZoomIn className="h-4 w-4" /></Button>
          <Button variant="outline" size="icon" className="h-8 w-8" title="Encajar" onClick={ajustar}><Maximize2 className="h-4 w-4" /></Button>
        </div>
      </div>

      {/* Split: izquierda = mapa (arriba) + análisis (abajo); derecha = lista sincronizada */}
      <div className={withList ? 'flex flex-col lg:flex-row gap-3 items-stretch' : ''}>
      <div className={withList ? 'flex-1 min-w-0 flex flex-col gap-3' : ''}>
      <div
        ref={boardRef}
        className={`relative overflow-hidden rounded-2xl border select-none ${
          withList
            ? 'h-[calc(100vh-540px)] min-h-[300px]'
            : embedded ? 'h-[calc(100vh-280px)] min-h-[520px]' : 'h-[calc(100vh-320px)] min-h-[460px]'
        }`}
        style={{
          background: PAL.board,
          cursor: dragging ? 'grabbing' : 'grab',
        }}
      >
        {loadingMapa && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/40 backdrop-blur-[1px]">
            <Loader2 className="h-6 w-6 animate-spin text-marca-verde-texto" />
          </div>
        )}

        {!loadingMapa && (!mapa || mapa.materias.length === 0) ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground gap-2">
            <RouteIcon className="h-8 w-8 opacity-40" />
            <p>Esta carrera todavía no tiene materias en el mapa.</p>
          </div>
        ) : (
          <svg
            ref={svgRef}
            className="w-full h-full touch-none"
            onPointerDown={onPointerDown}
          >
            <g transform={`translate(${view.x} ${view.y}) scale(${view.k})`}>
              {/* Encabezados de semestre */}
              {layout.columnas.map((c) => (
                <text key={`h-${c.semestre}`} x={c.x + NODE_W / 2} y={PAD_Y - 20} textAnchor="middle"
                      fontSize={13} fontWeight={700} fill={PAL.semText}>
                  {c.semestre === SIN_SEMESTRE ? 'Sin semestre' : `Semestre ${c.semestre}`}
                </text>
              ))}

              {/* Aristas */}
              {layout.edges.map((e) => {
                const a = posDe.get(e.from);
                const b = posDe.get(e.to);
                if (!a || !b) return null;
                const on = !resaltado || (resaltado.has(e.from) && resaltado.has(e.to));
                const aprobadaBase = a.estado === 'APROBADA';
                // Punteado solo para previas aún no cumplidas (vista de estudiante).
                const punteado = mapa?.conProgreso ? !aprobadaBase : false;
                return (
                  <path key={`${e.from}-${e.to}`} d={edgePath(a, b)} fill="none"
                        stroke={on ? (aprobadaBase ? PAL.edgeAprobada : PAL.edge) : PAL.edgeDim}
                        strokeWidth={on ? 2.4 : 1.4}
                        strokeOpacity={on ? 0.9 : 0.5}
                        strokeDasharray={punteado ? '5 5' : undefined} />
                );
              })}

              {/* Nodos */}
              {layout.nodos.map((n) => {
                // Con progreso (estudiante): color por estado. Sin progreso: color por semestre.
                const st = n.estado
                  ? PAL.estado[n.estado]
                  : PAL.sem[(((n.semestre ?? 1) - 1) % 6 + 6) % 6];
                const dim = resaltado != null && !resaltado.has(n.id);
                const isHover = hover === n.id;
                return (
                  <g key={n.id} transform={`translate(${n.x} ${n.y})`}
                     style={{ cursor: 'pointer', opacity: dim ? 0.28 : 1, transition: 'opacity 0.15s' }}
                     onMouseEnter={() => setHover(n.id)}
                     onMouseLeave={() => setHover(null)}
                     onClick={() => abrirMateria(n.id)}>
                    <title>{n.nombre}{n.docenteNombre ? ` · ${n.docenteNombre}` : ''}</title>

                    {n.estado === 'CURSANDO' && (
                      <rect x={-4} y={-4} width={NODE_W + 8} height={NODE_H + 8} rx={18} fill="none"
                            stroke={MARCA.cian} strokeWidth={3}>
                        <animate attributeName="opacity" values="0.7;0.15;0.7" dur="1.8s" repeatCount="indefinite" />
                      </rect>
                    )}

                    <rect width={NODE_W} height={NODE_H} rx={14} fill={st.fill} stroke={st.stroke}
                          strokeWidth={isHover ? 2.5 : 1.5}
                          style={{ filter: dim ? 'none' : (dark ? 'drop-shadow(0 2px 8px rgba(0,0,0,0.45))' : 'drop-shadow(0 2px 6px rgba(30,40,60,0.12))') }} />

                    {/* Franja lateral por estado */}
                    <rect width={6} height={NODE_H} rx={3} fill={st.stroke} />

                    {n.codigo && (
                      <text x={18} y={22} fontSize={10.5} fontWeight={700} fill={st.sub} letterSpacing={0.4}>
                        {truncar(n.codigo, 16)}
                      </text>
                    )}
                    <text x={18} y={n.codigo ? 42 : 34} fontSize={13.5} fontWeight={600} fill={st.text}>
                      {truncar(n.nombre, 24)}
                    </text>
                    <text x={18} y={NODE_H - 14} fontSize={10.5} fill={st.sub}>
                      {(n.creditos ?? 0)} créditos · {n.totalInscriptos} inscript{n.totalInscriptos === 1 ? 'o' : 'os'}
                    </text>

                    {/* Ícono de estado */}
                    {n.estado === 'APROBADA' && (
                      <g transform={`translate(${NODE_W - 32} 12)`}>
                        <circle cx={8} cy={8} r={11} fill="rgba(255,255,255,0.25)" />
                        <g transform="translate(1 1)"><Check width={14} height={14} color="#ffffff" /></g>
                      </g>
                    )}
                    {n.estado === 'BLOQUEADA' && (
                      <g transform={`translate(${NODE_W - 30} 12)`}>
                        <Lock width={14} height={14} color="#aeb4bb" />
                      </g>
                    )}
                  </g>
                );
              })}
            </g>
          </svg>
        )}
      </div>

      {withList && mapa && mapa.materias.length > 0 && (
        <div className="grid gap-3 md:grid-cols-2">
          {/* Materias-llave (cuellos de botella) */}
          <div className="rounded-2xl border bg-card p-4">
            <div className="flex items-center gap-2 mb-1">
              <KeyRound className="h-4 w-4 text-marca-naranja-texto" />
              <h3 className="text-sm font-semibold">Materias llave</h3>
              <span className="text-xs text-muted-foreground ml-auto">las que más desbloquean</span>
            </div>
            <p className="text-xs text-muted-foreground mb-3">
              Priorizá estas: aprobarlas habilita la mayor parte del plan. Pasá el mouse para verlo en el mapa.
            </p>
            <div className="space-y-1.5">
              {analisis.llaves.map(({ nodo, bloquea }, i) => (
                <button
                  key={nodo.id}
                  type="button"
                  onMouseEnter={() => setHover(nodo.id)}
                  onMouseLeave={() => setHover(null)}
                  onClick={() => navigate(`/materias/${nodo.id}`)}
                  className={`w-full flex items-center gap-3 rounded-xl border px-3 py-2 text-left transition-colors ${
                    hover === nodo.id ? 'bg-muted border-border' : 'border-transparent hover:bg-muted/60'
                  }`}
                >
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-utec-orange/15 text-marca-naranja-texto text-xs font-bold shrink-0">
                    {i + 1}
                  </span>
                  <span className="min-w-0 flex-1">
                    {nodo.codigo && <span className="block font-mono text-2xs font-semibold text-muted-foreground tracking-wide">{nodo.codigo}</span>}
                    <span className="block text-sm font-medium truncate">{nodo.nombre}</span>
                  </span>
                  <span className="flex items-center gap-1 text-xs font-semibold text-marca-naranja-texto whitespace-nowrap">
                    <Milestone className="h-3.5 w-3.5" />
                    {bloquea}
                  </span>
                </button>
              ))}
              {analisis.llaves.length === 0 && (
                <p className="text-sm text-muted-foreground py-4 text-center">Este plan no tiene correlativas cargadas.</p>
              )}
            </div>
          </div>

          {/* Ruta crítica */}
          <div className="rounded-2xl border bg-card p-4">
            <div className="flex items-center gap-2 mb-1">
              <RouteIcon className="h-4 w-4 text-marca-verde-texto" />
              <h3 className="text-sm font-semibold">Ruta crítica</h3>
              <span className="text-xs text-muted-foreground ml-auto">{analisis.profundidad} materias encadenadas</span>
            </div>
            <p className="text-xs text-muted-foreground mb-3">
              La cadena de correlativas más larga: el camino mínimo hasta el egreso. Pasá el mouse para resaltarla.
            </p>
            <div
              className="flex flex-wrap items-center gap-1.5"
              onMouseEnter={() => setExtra(new Set(analisis.rutaCritica.map((n) => n.id)))}
              onMouseLeave={() => setExtra(null)}
            >
              {analisis.rutaCritica.map((n, i) => (
                <span key={n.id} className="inline-flex items-center gap-1.5">
                  {i > 0 && <span className="text-muted-foreground">→</span>}
                  <button
                    type="button"
                    onClick={() => navigate(`/materias/${n.id}`)}
                    onMouseEnter={() => setHover(n.id)}
                    className="rounded-lg border bg-background px-2 py-1 text-xs font-medium hover:border-utec-green transition-colors"
                    title={n.nombre}
                  >
                    {n.codigo ?? truncar(n.nombre, 12)}
                  </button>
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
      </div>{/* fin columna izquierda */}

      {withList && mapa && mapa.materias.length > 0 && (() => {
        const filtradas = mapa.materias.filter((m) =>
          (m.nombre + ' ' + (m.codigo ?? '')).toLowerCase().includes(busqueda.trim().toLowerCase()));
        const colorDe = (n: MapaNodo) => n.estado
          ? PAL.estado[n.estado].stroke
          : PAL.sem[(((n.semestre ?? 1) - 1) % 6 + 6) % 6].stroke;
        return (
          <aside className="w-full lg:w-[300px] shrink-0 rounded-2xl border bg-card flex flex-col overflow-hidden">
            <div className="p-3 border-b">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  placeholder="Buscar materia…"
                  className="w-full h-9 pl-8 pr-3 rounded-lg border bg-background text-sm outline-none focus:border-utec-green"
                />
              </div>
            </div>
            <div className="flex-1 overflow-auto p-2 space-y-1 min-h-[180px]">
              {filtradas.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onMouseEnter={() => setHover(m.id)}
                  onMouseLeave={() => setHover(null)}
                  onClick={() => navigate(`/materias/${m.id}`)}
                  className={`w-full flex items-center gap-2.5 rounded-xl border px-2.5 py-2 text-left transition-colors ${
                    hover === m.id ? 'bg-muted border-border' : 'border-transparent hover:bg-muted/60'
                  }`}
                >
                  <span className="w-2.5 h-7 rounded-full shrink-0" style={{ backgroundColor: colorDe(m) }} />
                  <span className="min-w-0 flex-1">
                    {m.codigo && <span className="block font-mono text-2xs font-semibold text-muted-foreground tracking-wide">{m.codigo}</span>}
                    <span className="block text-sm font-medium truncate">{m.nombre}</span>
                  </span>
                  <span className="text-2xs text-muted-foreground whitespace-nowrap tabular-nums">
                    S{m.semestre ?? '—'} · {m.creditos ?? 0}cr
                  </span>
                </button>
              ))}
              {filtradas.length === 0 && (
                <p className="text-center text-sm text-muted-foreground py-8">Sin resultados.</p>
              )}
            </div>
            <div className="px-3 py-2 border-t text-xs text-muted-foreground">
              {filtradas.length} de {mapa.materias.length} materias
            </div>
          </aside>
        );
      })()}
      </div>{/* fin split */}

      <p className="text-xs text-muted-foreground text-center">
        Arrastrá para moverte · rueda para zoom · pasá el mouse por una materia (mapa o lista) para ver su cadena de correlativas · clic para ver el detalle.
      </p>
    </div>
  );
}

export default MapaCorrelativas;
