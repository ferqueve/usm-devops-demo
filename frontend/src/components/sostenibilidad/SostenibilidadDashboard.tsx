import { useEffect, useMemo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Cell, LabelList, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import {
  BatteryCharging, Car, ChevronDown, Cloud, Download, Droplets, FileText, Files, Info, Leaf, Link2, Pencil, TreePine,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { toast } from 'sonner';
import { PageHeader, HEADER_ACTION } from '@/components/layouts/PageHeader';
import { Panel } from '@/components/dashboard/views/_components/Panel';
import { EmptyState } from '@/components/dashboard/views/_components/EmptyState';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useSostenibilidad } from '@/hooks/useSostenibilidad';
import { sostenibilidadApi } from '@/lib/api/sostenibilidad';
import type { RankingItem, SostenibilidadRanking, SostenibilidadStats } from '@/lib/types/sostenibilidad';
import { EQUIVALENCIAS, META_ARBOLES_DEFAULT, META_ARBOLES_STORAGE_KEY } from '@/lib/config/sostenibilidad';
import { useCountUp } from './useCountUp';
import { ComoFuncionaDialog } from './ComoFuncionaDialog';
import { MARCA } from '@/lib/design/paleta';

/**
 * Escala de verdes de la pantalla. Todo es verde a propósito: es la pantalla
 * del bosque, y un solo tono con sus variantes se lee más sereno que la
 * paleta institucional completa.
 */
const VERDE = {
  900: '#1f3d17',
  800: '#2d5a22',
  700: '#3d7a2d',
  600: '#5a9a3a',
  500: MARCA.verde,
  300: '#b9d99a',
  200: '#d7eac3',
  100: '#eef6e6',
} as const;

/** Verde translúcido para fondos y huecos: se ve bien sobre blanco y sobre el tema oscuro. */
const VACIO = 'rgba(134, 187, 76, 0.16)';

function fmt(n: number, dec = 0): string {
  return n.toLocaleString('es-UY', { minimumFractionDigits: dec, maximumFractionDigits: dec });
}

function fmtCorto(n: number): string {
  return n.toLocaleString('es-UY', { notation: 'compact', maximumFractionDigits: 1 });
}

function leerMeta(): number {
  try {
    return Number(localStorage.getItem(META_ARBOLES_STORAGE_KEY)) || META_ARBOLES_DEFAULT;
  } catch {
    return META_ARBOLES_DEFAULT;
  }
}

// --- Objetivo: el bosque del año, con los árboles plantados y los que faltan ---

/** Tope de arbolitos dibujados: con metas grandes cada uno pasa a valer varios árboles. */
const MAX_ARBOLITOS = 250;

function BosqueObjetivo({ arboles, meta, hojasPorArbol, onEditarMeta }: Readonly<{
  arboles: number; meta: number; hojasPorArbol: number; onEditarMeta: () => void;
}>) {
  const n = Math.min(meta, MAX_ARBOLITOS);
  const valePor = meta / n;
  const plantados = Math.min(n, Math.floor(arboles / valePor));
  const cols = Math.ceil(Math.sqrt(n * 7));
  const filas = Math.ceil(n / cols);
  const w = 17;
  const h = 22;
  const pct = Math.min(100, Math.round((arboles / meta) * 100));
  const faltan = Math.max(0, Math.ceil(meta - arboles));
  const tonos = [VERDE[300], VERDE[200], '#ffffff'];

  return (
    <section className="grid shrink-0 items-center gap-6 rounded-2xl p-5 text-white lg:grid-cols-[300px_minmax(0,1fr)]" style={{ backgroundColor: VERDE[800] }}>
      <div>
        <div className="flex items-center gap-1.5 text-2xs font-semibold tracking-wider" style={{ color: VERDE[300] }}>
          <TreePine className="h-3.5 w-3.5" />
          OBJETIVO {new Date().getFullYear()} · BOSQUE UTEC
        </div>
        <h2 className="mt-1.5 text-5xl font-bold leading-none tabular-nums">
          {fmt(Math.floor(arboles))}
          <span className="ml-2 text-lg font-medium" style={{ color: VERDE[300] }}>/ {fmt(meta)} árboles</span>
        </h2>
        <p className="mt-2 text-xs leading-relaxed" style={{ color: VERDE[200] }}>
          Cada árbol son ~{fmt(hojasPorArbol)} hojas que no se imprimieron.{' '}
          {faltan > 0
            ? <>Faltan <b className="text-white">{fmt(faltan)}</b> para completar el bosque del año.</>
            : <b className="text-white">El bosque del año está completo.</b>}
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-2 rounded-full py-1 pl-1 pr-3 text-xs" style={{ backgroundColor: VERDE[900], color: VERDE[200] }}>
            <b className="rounded-full px-2 py-0.5" style={{ backgroundColor: VERDE[500], color: VERDE[900] }}>{pct}%</b>
            {faltan > 0 ? `de la meta · ≈ ${fmtCorto(faltan * hojasPorArbol)} hojas más` : 'de la meta'}
          </span>
          <button
            type="button"
            onClick={onEditarMeta}
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-white/70 transition-colors hover:bg-white/10 hover:text-white"
          >
            <Pencil className="h-3 w-3" /> meta
          </button>
        </div>
      </div>

      <div>
        {/* Tamaño en línea: index.css achica todos los svg a tamaño de ícono en algunas pantallas. */}
        <svg
          viewBox={`0 0 ${cols * w + w / 2} ${filas * h}`}
          className="block"
          style={{ width: '100%', height: 'auto' }}
          role="img"
          aria-label={`${plantados} de ${n} árboles plantados`}
        >
          {Array.from({ length: n }, (_, k) => {
            const x = (k % cols) * w + (Math.floor(k / cols) % 2) * (w / 2);
            const y = Math.floor(k / cols) * h;
            if (k < plantados) {
              const tono = tonos[(k * 7) % 3];
              return (
                <g key={k} transform={`translate(${x},${y})`}>
                  <polygon points="8,1 2,11 14,11" fill={tono} />
                  <polygon points="8,6 1,17 15,17" fill={tono} />
                  <rect x="7" y="17" width="2" height="3" fill={tono} opacity={0.7} />
                </g>
              );
            }
            return (
              <g key={k} transform={`translate(${x},${y})`} fill="none" stroke={VERDE[300]} strokeWidth={1} strokeDasharray="2 1.5">
                <polygon points="8,1 2,11 14,11" />
                <polygon points="8,6 1,17 15,17" />
              </g>
            );
          })}
        </svg>
        <div className="mt-2 flex justify-between text-2xs" style={{ color: VERDE[300] }}>
          <span className="flex items-center gap-1.5">
            <i className="inline-block h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: VERDE[200] }} />
            {fmt(plantados)} plantados
          </span>
          {valePor > 1 && <span>cada arbolito ≈ {fmt(valePor, 1)} árboles</span>}
          <span className="flex items-center gap-1.5">
            <i className="inline-block h-2.5 w-2.5 rounded-sm border border-dashed" style={{ borderColor: VERDE[300] }} />
            {fmt(n - plantados)} por plantar
          </span>
        </div>
      </div>
    </section>
  );
}

// --- Tira de tarjetas en escala de verdes ---

interface Dato {
  icon: LucideIcon;
  label: string;
  value: number;
  dec?: number;
  unidad?: string;
  hint: string;
  className: string;
  style?: React.CSSProperties;
}

function Tarjeta({ dato }: Readonly<{ dato: Dato }>) {
  const v = useCountUp(dato.value);
  const Icon = dato.icon;
  return (
    <div className={`min-w-0 rounded-xl p-4 ${dato.className}`} style={dato.style}>
      <div className="mb-1 flex items-center gap-1.5 text-xs opacity-85">
        <Icon className="h-3.5 w-3.5 shrink-0" />
        <span className="truncate">{dato.label}</span>
      </div>
      <div className="text-2xl font-semibold tabular-nums">
        {fmt(v, dato.dec)}
        {dato.unidad && <span className="ml-1 text-sm font-medium opacity-80">{dato.unidad}</span>}
      </div>
      <div className="mt-0.5 truncate text-2xs opacity-75">{dato.hint}</div>
    </div>
  );
}

// --- Hojas por mes: los últimos 6, con el mes en curso marcado ---

function PorMes({ stats }: Readonly<{ stats: SostenibilidadStats }>) {
  const datos = useMemo(() => {
    const porMes = new Map(stats.ahorroPorMes.map((p) => [p.mes, p.hojas]));
    const hoy = new Date();
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date(hoy.getFullYear(), hoy.getMonth() - 5 + i, 1);
      const clave = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      return {
        mes: d.toLocaleDateString('es-UY', { month: 'short' }).replace('.', ''),
        hojas: porMes.get(clave) ?? 0,
        enCurso: i === 5,
      };
    });
  }, [stats]);

  return (
    <div className="flex h-full flex-col">
      <div className="min-h-[170px] flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={datos} margin={{ top: 18, right: 4, left: 0, bottom: 0 }}>
            <CartesianGrid stroke="#e5e7eb" strokeDasharray="2 4" vertical={false} />
            <XAxis dataKey="mes" tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} width={40} tickFormatter={fmtCorto} />
            <Tooltip formatter={(v: number) => [fmt(v), 'Hojas']} cursor={{ fill: VACIO }} />
            <Bar dataKey="hojas" radius={[5, 5, 0, 0]} maxBarSize={44}>
              {datos.map((d) => (
                <Cell
                  key={d.mes}
                  fill={d.enCurso ? VACIO : VERDE[600]}
                  stroke={d.enCurso ? VERDE[500] : undefined}
                  strokeDasharray={d.enCurso ? '3 3' : undefined}
                />
              ))}
              <LabelList dataKey="hojas" position="top" formatter={(v: number) => (v > 0 ? fmtCorto(v) : '')} style={{ fontSize: 11, fontWeight: 600, fill: VERDE[600] }} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">El último mes está en curso: todavía no se compara.</p>
    </div>
  );
}

// --- Equivalencias en lista fija ---

function Equivalencias({ stats }: Readonly<{ stats: SostenibilidadStats }>) {
  const items: Array<{ icon: LucideIcon; valor: number; texto: string }> = [
    { icon: TreePine, valor: stats.arbolesSalvados, texto: 'árboles en pie' },
    { icon: Droplets, valor: stats.aguaAhorradaL / EQUIVALENCIAS.aguaLitrosPorDucha, texto: 'duchas de 8 minutos' },
    { icon: BatteryCharging, valor: (stats.co2EvitadoKg * 1000) / EQUIVALENCIAS.co2GramosPorCargaCelular, texto: 'cargas de celular' },
    { icon: Car, valor: (stats.kmAutoEquivalente * 1000) / EQUIVALENCIAS.metrosPorVueltaCancha, texto: 'vueltas a una cancha en auto' },
  ];
  return (
    <div className="divide-y divide-border/60 px-4">
      {items.map(({ icon: Icon, valor, texto }) => (
        <div key={texto} className="flex items-center gap-3 py-2.5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: VACIO, color: VERDE[600] }}>
            <Icon className="h-4 w-4" />
          </span>
          <b className="text-lg font-semibold tabular-nums">{fmt(valor)}</b>
          <span className="truncate text-sm text-muted-foreground">{texto}</span>
        </div>
      ))}
    </div>
  );
}

// --- Recursos digitales: archivos vs enlaces ---

function Recursos({ stats }: Readonly<{ stats: SostenibilidadStats }>) {
  const total = Math.max(1, stats.recursosArchivo + stats.recursosEnlace);
  const porciones = [
    { nombre: 'Archivos', valor: stats.recursosArchivo, color: VERDE[700] },
    { nombre: 'Enlaces', valor: stats.recursosEnlace, color: VERDE[200] },
  ];
  return (
    <div className="flex h-full items-center gap-4 p-4">
      <div className="relative h-[124px] w-[124px] shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={porciones} dataKey="valor" innerRadius={42} outerRadius={60} startAngle={90} endAngle={-270} stroke="none">
              {porciones.map((p) => <Cell key={p.nombre} fill={p.color} />)}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-bold tabular-nums">{fmt(stats.recursosDigitalesTotales)}</span>
          <span className="text-2xs uppercase tracking-wider text-muted-foreground">recursos</span>
        </div>
      </div>
      <div className="min-w-0 flex-1 space-y-1.5 text-sm">
        {porciones.map((p) => (
          <div key={p.nombre} className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-2"><i className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: p.color }} />{p.nombre}</span>
            <b className="tabular-nums">{fmt(p.valor)} <span className="font-normal text-muted-foreground">{Math.round((p.valor / total) * 100)}%</span></b>
          </div>
        ))}
        <p className="pt-1 text-xs text-muted-foreground">Solo los archivos cuentan como papel ahorrado.</p>
      </div>
    </div>
  );
}

// --- Rankings: cada cuadradito es un árbol ---

/** Con más árboles que esto, cada cuadradito pasa a valer varios. */
const MAX_CUADRADITOS = 20;

function Ranking({ items, hojasPorArbol }: Readonly<{ items: RankingItem[]; hojasPorArbol: number }>) {
  if (items.length === 0) return <EmptyState title="Sin datos." />;
  const maxArboles = Math.max(...items.map((it) => it.hojas / hojasPorArbol));
  const slots = Math.min(MAX_CUADRADITOS, Math.max(1, Math.ceil(maxArboles)));
  const valePor = maxArboles > MAX_CUADRADITOS ? maxArboles / MAX_CUADRADITOS : 1;

  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b text-left text-2xs uppercase tracking-wide text-muted-foreground">
          <th className="w-px py-2 pl-4 pr-2 font-medium" />
          <th className="py-2 font-medium">Nombre</th>
          <th className="w-px whitespace-nowrap py-2 pl-3 text-right font-medium">Hojas evitadas</th>
          <th className="w-px py-2 pl-3 pr-4 text-right font-medium">Árboles</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-border/60">
        {items.map((it, i) => {
          const arboles = it.hojas / hojasPorArbol;
          const llenos = Math.round(arboles / valePor);
          return (
            <tr key={it.nombre} className="transition-colors hover:bg-muted/40">
              <td className="py-2 pl-4 pr-2 text-xs font-semibold tabular-nums" style={{ color: i === 0 ? VERDE[700] : '#9ca3af' }}>{i + 1}</td>
              <td className="max-w-0 py-2">
                <div className="truncate font-medium" title={it.nombre}>{it.nombre}</div>
                <div className="mt-1 flex gap-[3px]" title={valePor > 1 ? `cada cuadradito ≈ ${fmt(valePor, 1)} árboles` : 'cada cuadradito es un árbol'}>
                  {Array.from({ length: slots }, (_, j) => (
                    <i key={j} className="h-[7px] w-[7px] rounded-[2px]" style={{ backgroundColor: j < llenos ? VERDE[500] : VACIO }} />
                  ))}
                </div>
              </td>
              <td className="whitespace-nowrap py-2 pl-3 text-right font-semibold tabular-nums">{fmt(it.hojas)}</td>
              <td className="whitespace-nowrap py-2 pl-3 pr-4 text-right font-semibold tabular-nums" style={{ color: VERDE[600] }}>{fmt(arboles, 1)}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

export default function SostenibilidadDashboard() {
  const { stats, loading } = useSostenibilidad();
  const [ranking, setRanking] = useState<SostenibilidadRanking | null>(null);
  const [meta, setMeta] = useState<number>(leerMeta);
  const [infoOpen, setInfoOpen] = useState(false);

  useEffect(() => {
    sostenibilidadApi.obtenerRanking().then((r) => setRanking(r.data ?? null)).catch(() => { /* noop */ });
  }, []);

  if (loading && !stats) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-44 rounded-2xl" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}</div>
        <div className="grid gap-3 lg:grid-cols-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-64 rounded-xl" />)}</div>
      </div>
    );
  }
  if (!stats) {
    return <div className="py-12 text-center text-muted-foreground"><Leaf className="mx-auto mb-3 h-10 w-10 text-utec-green/50" /><p>No se pudieron cargar las métricas.</p></div>;
  }

  // Sale de los mismos factores del backend (papel por hoja y papel por árbol).
  const hojasPorArbol = stats.arbolesSalvados > 0 ? stats.hojasEvitadas / stats.arbolesSalvados : 1844;

  const datos: Dato[] = [
    { icon: FileText, label: 'Papel ahorrado', value: stats.papelAhorradoKg, unidad: 'kg', hint: `≈ ${fmt(stats.hojasEvitadas / EQUIVALENCIAS.hojasPorResma)} resmas`, className: 'text-white', style: { backgroundColor: VERDE[900] } },
    { icon: Files, label: 'Hojas evitadas', value: stats.hojasEvitadas, hint: 'copias que no se imprimieron', className: 'text-white', style: { backgroundColor: VERDE[700] } },
    { icon: Droplets, label: 'Agua ahorrada', value: stats.aguaAhorradaL / 1_000_000, dec: 2, unidad: 'M L', hint: 'en fabricar ese papel', className: 'text-white', style: { backgroundColor: VERDE[500] } },
    { icon: Cloud, label: 'CO₂ evitado', value: stats.co2EvitadoKg, unidad: 'kg', hint: 'de producción y transporte', className: '', style: { backgroundColor: VERDE[200], color: VERDE[900] } },
    { icon: Car, label: 'Km en auto', value: stats.kmAutoEquivalente, hint: 'mismo CO₂ que manejar', className: 'col-span-2 border-[1.5px] bg-card text-foreground sm:col-span-1', style: { borderColor: VERDE[300] } },
  ];

  const editarMeta = () => {
    const nueva = window.prompt('Meta del año, en árboles salvados:', String(meta));
    const n = Math.round(Number(nueva));
    if (nueva && n > 0) {
      setMeta(n);
      try { localStorage.setItem(META_ARBOLES_STORAGE_KEY, String(n)); } catch { /* noop */ }
      toast.success('Meta actualizada');
    }
  };

  const copiarLink = () => navigator.clipboard?.writeText(window.location.href).then(() => toast.success('Link copiado')).catch(() => { /* noop */ });
  const exportarPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18); doc.setTextColor(45, 90, 34); doc.text('Reporte de Sostenibilidad — USM UTEC', 14, 20);
    doc.setTextColor(60); doc.setFontSize(11);
    const filas: [string, string][] = [
      ['Papel ahorrado', `${fmt(stats.papelAhorradoKg, 1)} kg`],
      ['CO₂ evitado', `${fmt(stats.co2EvitadoKg, 1)} kg`],
      ['Agua ahorrada', `${fmt(stats.aguaAhorradaL)} L`],
      ['Hojas evitadas', `${fmt(stats.hojasEvitadas)}`],
      ['Árboles salvados', `≈ ${fmt(stats.arbolesSalvados, 1)} de ${fmt(meta)} (meta)`],
      ['Km en auto evitados', `≈ ${fmt(stats.kmAutoEquivalente)}`],
      ['Recursos digitales', `${fmt(stats.recursosDigitalesTotales)} (${stats.recursosArchivo} archivos, ${stats.recursosEnlace} enlaces)`],
    ];
    let y = 36;
    filas.forEach(([k, v]) => { doc.setFont('helvetica', 'bold'); doc.text(`${k}:`, 14, y); doc.setFont('helvetica', 'normal'); doc.text(v, 80, y); y += 9; });
    doc.setFontSize(9); doc.setTextColor(150); doc.text(`Generado el ${new Date().toLocaleDateString('es-UY')}`, 14, y + 6);
    doc.save('sostenibilidad-utec.pdf');
  };

  return (
    <div className="space-y-3">
      <PageHeader
        title="Sostenibilidad"
        description="Lo que la reserva digital le ahorra al campus: papel, agua y CO₂."
        accentColor={VERDE[500]}
        actions={
          <>
            <Button variant="ghost" size="sm" className={HEADER_ACTION} onClick={() => setInfoOpen(true)}>
              <Info className="mr-1.5 h-3.5 w-3.5" />Cómo funciona
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className={HEADER_ACTION}>
                  <Download className="mr-1.5 h-3.5 w-3.5" />Exportar<ChevronDown className="ml-1 h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={exportarPDF}><FileText className="mr-2 h-4 w-4" />Reporte PDF</DropdownMenuItem>
                <DropdownMenuItem onClick={copiarLink}><Link2 className="mr-2 h-4 w-4" />Copiar link</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        }
      />

      <ComoFuncionaDialog open={infoOpen} onOpenChange={setInfoOpen} />

      <BosqueObjetivo arboles={stats.arbolesSalvados} meta={meta} hojasPorArbol={hojasPorArbol} onEditarMeta={editarMeta} />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {datos.map((d) => <Tarjeta key={d.label} dato={d} />)}
      </div>

      <div className="grid gap-3 lg:grid-cols-[1.3fr_1fr_1fr]">
        <Panel title="Hojas evitadas por mes" count="últimos 6 meses" accentColor={VERDE[500]} className="min-h-[260px]">
          <PorMes stats={stats} />
        </Panel>
        <Panel title="Equivale a" count="en el día a día" accentColor={VERDE[500]} flush>
          <Equivalencias stats={stats} />
        </Panel>
        <Panel title="Recursos digitales" count={fmt(stats.recursosDigitalesTotales)} accentColor={VERDE[500]} flush>
          <Recursos stats={stats} />
        </Panel>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <Panel title="Carreras" count="las que más papel ahorran" accentColor={VERDE[500]} flush>
          <Ranking items={ranking?.carreras ?? []} hojasPorArbol={hojasPorArbol} />
        </Panel>
        <Panel title="Docentes" count="los que más digitalizan" accentColor={VERDE[500]} flush>
          <Ranking items={ranking?.docentes ?? []} hojasPorArbol={hojasPorArbol} />
        </Panel>
      </div>
    </div>
  );
}
