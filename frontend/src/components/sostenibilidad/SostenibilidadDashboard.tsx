import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  Area, CartesianGrid, Cell, ComposedChart, Line, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import {
  Award, BatteryCharging, Car, Cloud, Coffee, Database, Download, Droplets, FileText, Files,
  Info, Leaf, Loader2, Lock, Maximize2, Minus, Share2, Sparkles, TreePine, Trophy, TrendingUp, TrendingDown,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { toast } from 'sonner';
import { PageHeader, HEADER_ACTION } from '@/components/layouts/PageHeader';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { useSostenibilidad } from '@/hooks/useSostenibilidad';
import { sostenibilidadApi } from '@/lib/api/sostenibilidad';
import type { RankingItem, SostenibilidadRanking, SostenibilidadStats } from '@/lib/types/sostenibilidad';
import { postChat } from '@/lib/api/ai';
import { useAuth } from '@/hooks/useAuth';
import { useCountUp } from './useCountUp';
import { BosqueForest } from './BosqueForest';
import {
  EQUIVALENCIAS, IMPACTO_HOJAS_TOPE, META_HOJAS_DEFAULT, META_HOJAS_STORAGE_KEY,
} from '@/lib/config/sostenibilidad';

const UTEC_GREEN = '#86bb4c';
const META_DEFAULT = META_HOJAS_DEFAULT; // hojas/año objetivo
const META_KEY = META_HOJAS_STORAGE_KEY;

function fmt(n: number, dec = 0): string {
  return n.toLocaleString('es-UY', { minimumFractionDigits: dec, maximumFractionDigits: dec });
}

// --- Hero stat con count-up ---
const HERO_CLS: Record<string, string> = {
  green: 'bg-utec-green text-white', cyan: 'bg-utec-cyan text-utec-dark',
  blue: 'bg-utec-blue text-white', orange: 'bg-utec-orange text-white', dark: 'bg-utec-dark text-white',
};
function HeroStat({ icon: Icon, label, value, suffix, dec = 0, variant }: Readonly<{ icon: LucideIcon; label: string; value: number; suffix?: string; dec?: number; variant: string }>) {
  const v = useCountUp(value);
  return (
    <div className={`relative overflow-hidden rounded-2xl p-4 ${HERO_CLS[variant]}`}>
      <Icon className="absolute -right-3 -bottom-3 h-16 w-16 opacity-15" />
      <div className="relative">
        <div className="text-2xl sm:text-3xl font-bold tabular-nums leading-none">{fmt(v, dec)}{suffix ? <span className="text-base font-semibold opacity-80"> {suffix}</span> : null}</div>
        <div className="text-xs font-medium opacity-80 mt-1.5 flex items-center gap-1"><Icon className="h-3.5 w-3.5" />{label}</div>
      </div>
    </div>
  );
}

// --- Gauge semicircular (índice 0-100) ---
function Gauge({ value }: Readonly<{ value: number }>) {
  const v = Math.max(0, Math.min(100, value));
  const r = 70; const cx = 90; const cy = 90;
  const ang = Math.PI * (1 - v / 100);
  const x = cx + r * Math.cos(ang); const y = cy - r * Math.sin(ang);
  const circ = Math.PI * r;
  const color = v >= 66 ? UTEC_GREEN : v >= 33 ? '#F6CA21' : '#DE7A27';
  return (
    <div className="relative w-[180px] h-[100px] mx-auto">
      <svg viewBox="0 0 180 100" className="w-[180px] h-[100px]">
        <path d={`M20 90 A70 70 0 0 1 160 90`} fill="none" stroke="currentColor" className="text-muted" strokeWidth="12" strokeLinecap="round" />
        <path d={`M20 90 A70 70 0 0 1 160 90`} fill="none" stroke={color} strokeWidth="12" strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={circ * (1 - v / 100)} style={{ transition: 'stroke-dashoffset 1s ease-out' }} />
        <circle cx={x} cy={y} r="6" fill={color} />
      </svg>
      <div className="absolute inset-x-0 bottom-0 text-center">
        <div className="text-3xl font-bold tabular-nums" style={{ color }}>{Math.round(v)}</div>
        <div className="text-[11px] text-muted-foreground -mt-1">/ 100</div>
      </div>
    </div>
  );
}

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

// --- Equivalencias en carrusel ---
function Equivalencias({ stats }: Readonly<{ stats: SostenibilidadStats }>) {
  const items = useMemo(() => {
    const co2g = stats.co2EvitadoKg * 1000;
    return [
      { icon: Droplets, color: 'text-utec-cyan', label: 'duchas de 8 min', value: stats.aguaAhorradaL / EQUIVALENCIAS.aguaLitrosPorDucha },
      { icon: BatteryCharging, color: 'text-utec-green', label: 'cargas de celular', value: co2g / EQUIVALENCIAS.co2GramosPorCargaCelular },
      { icon: Car, color: 'text-utec-orange', label: 'vueltas a la cancha en auto', value: (stats.kmAutoEquivalente * 1000) / EQUIVALENCIAS.metrosPorVueltaCancha },
      { icon: Coffee, color: 'text-utec-purple', label: 'tazas de agua', value: stats.aguaAhorradaL / EQUIVALENCIAS.aguaLitrosPorTaza },
      { icon: TreePine, color: 'text-utec-green', label: 'árboles salvados', value: stats.arbolesSalvados },
    ];
  }, [stats]);
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setIdx((i) => (i + 1) % items.length), 3500);
    return () => clearInterval(t);
  }, [items.length]);
  const it = items[idx];
  const Icon = it.icon;
  return (
    <Panel title="Equivalencias" icon={<Sparkles className="h-4 w-4 text-utec-yellow" />} accent="bg-utec-yellow/10">
      <div className="flex items-center justify-center gap-4 py-1">
        <span className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-muted/50 ${it.color}`}>
          <Icon className="h-7 w-7" />
        </span>
        <div>
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground leading-none">Equivale a</p>
          <p className="text-3xl font-bold tabular-nums leading-tight mt-0.5">{fmt(it.value, it.value < 10 ? 1 : 0)}</p>
          <p className="text-sm font-medium text-muted-foreground leading-tight">{it.label}</p>
        </div>
      </div>
      <div className="mt-3 flex justify-center gap-1.5">
        {items.map((_, i) => (
          <button key={i} type="button" onClick={() => setIdx(i)} className={`h-1.5 rounded-full transition-all ${i === idx ? 'w-5 bg-utec-green' : 'w-1.5 bg-muted'}`} aria-label={`Equivalencia ${i + 1}`} />
        ))}
      </div>
    </Panel>
  );
}

// --- Contador en vivo (tickea para sentirse "vivo") ---
function LiveCounter({ base }: Readonly<{ base: number }>) {
  const [extra, setExtra] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setExtra((e) => e + 1), 4000);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-utec-green opacity-75" /><span className="relative inline-flex rounded-full h-2 w-2 bg-utec-green" /></span>
      <span className="font-bold tabular-nums text-utec-green">{fmt(base + extra)}</span>
      <span className="text-muted-foreground">hojas evitadas y subiendo</span>
    </div>
  );
}

// Flechita de tendencia (variación de hojas mes actual vs. anterior).
function Tendencia({ delta }: Readonly<{ delta?: number }>) {
  if (delta == null || Math.abs(delta) < 1) {
    return <span className="inline-flex items-center text-[11px] text-muted-foreground/60" title="Sin cambios"><Minus className="h-3 w-3" /></span>;
  }
  const up = delta > 0;
  const txt = `${up ? '+' : ''}${Math.abs(delta) >= 999 ? '999' : Math.round(delta)}%`;
  return (
    <span className={`inline-flex items-center gap-0.5 text-[11px] font-semibold ${up ? 'text-utec-green' : 'text-utec-red'}`}
          title={`${txt} vs. mes anterior`}>
      {up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}{txt}
    </span>
  );
}

// Confeti que llueve de fondo del podio (determinista; se detiene con prefers-reduced-motion).
function Confetti() {
  // l=left%, c=color UTEC, s=forma, dur=duración caída, delay=desfase (negativo → ya lloviendo al cargar)
  const piezas = [
    { l: '5%', c: '#86bb4c', s: 'h-2 w-1', dur: 3.2, delay: -0.4 },
    { l: '12%', c: '#00c7ff', s: 'h-1.5 w-1.5 rounded-full', dur: 2.7, delay: -1.9 },
    { l: '19%', c: '#F6CA21', s: 'h-2.5 w-1', dur: 3.8, delay: -0.9 },
    { l: '27%', c: '#9333ea', s: 'h-1.5 w-1.5 rounded-full', dur: 2.4, delay: -2.6 },
    { l: '34%', c: '#DE7A27', s: 'h-2 w-1', dur: 3.5, delay: -1.2 },
    { l: '41%', c: '#86bb4c', s: 'h-1.5 w-1.5 rounded-full', dur: 2.9, delay: -0.2 },
    { l: '48%', c: '#184897', s: 'h-2.5 w-1', dur: 3.1, delay: -2.2 },
    { l: '55%', c: '#00c7ff', s: 'h-2 w-1', dur: 3.7, delay: -1.5 },
    { l: '62%', c: '#DF2B31', s: 'h-1.5 w-1.5 rounded-full', dur: 2.6, delay: -0.7 },
    { l: '69%', c: '#F6CA21', s: 'h-1.5 w-1.5 rounded-full', dur: 3.3, delay: -2.9 },
    { l: '76%', c: '#9333ea', s: 'h-2 w-1', dur: 2.8, delay: -1.1 },
    { l: '83%', c: '#DE7A27', s: 'h-1.5 w-1.5 rounded-full', dur: 3.6, delay: -0.5 },
    { l: '90%', c: '#86bb4c', s: 'h-2.5 w-1', dur: 2.5, delay: -2.4 },
    { l: '96%', c: '#00c7ff', s: 'h-1.5 w-1.5 rounded-full', dur: 3.4, delay: -1.7 },
  ];
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {piezas.map((p, i) => (
        <span
          key={i}
          className={`confetti-piece absolute top-0 ${p.s}`}
          style={{ left: p.l, backgroundColor: p.c, animationDuration: `${p.dur}s`, animationDelay: `${p.delay}s` }}
        />
      ))}
    </div>
  );
}

const PODIO_META: Record<number, { medal: string; alto: string; ped: string; ring: string }> = {
  1: { medal: '🥇', alto: 'h-24', ped: 'bg-utec-yellow', ring: 'ring-utec-yellow' },
  2: { medal: '🥈', alto: 'h-16', ped: 'bg-slate-400', ring: 'ring-slate-400' },
  3: { medal: '🥉', alto: 'h-12', ped: 'bg-orange-400', ring: 'ring-orange-400' },
};

// Podio literal: 2º a la izquierda, 1º al centro (más alto, con corona), 3º a la derecha.
function Podio({ top, valor }: Readonly<{ top: RankingItem[]; valor: (it: RankingItem) => string }>) {
  const orden: Array<{ it: RankingItem; pos: number }> = [];
  if (top[1]) orden.push({ it: top[1], pos: 2 });
  if (top[0]) orden.push({ it: top[0], pos: 1 });
  if (top[2]) orden.push({ it: top[2], pos: 3 });

  return (
    <div className="relative overflow-hidden rounded-2xl border bg-gradient-to-b from-muted/40 to-transparent px-2 pt-4">
      <Confetti />
      <div className="relative flex items-end justify-center gap-1.5 sm:gap-2.5">
        {orden.map(({ it, pos }) => {
          const m = PODIO_META[pos];
          const esPrimero = pos === 1;
          return (
            <div key={it.nombre} className={`flex flex-col items-center ${esPrimero ? 'w-[38%]' : 'w-[31%]'}`}>
              {esPrimero && <span className="-mb-0.5 text-lg leading-none">👑</span>}
              <span className={`flex ${esPrimero ? 'h-14 w-14 text-3xl' : 'h-11 w-11 text-2xl'} items-center justify-center rounded-full bg-background shadow-md ring-2 ${m.ring}`}>
                {m.medal}
              </span>
              <span className="mt-1.5 w-full truncate text-center text-xs font-semibold leading-tight" title={it.nombre}>{it.nombre}</span>
              <span className="text-[11px] font-bold tabular-nums">{valor(it)}</span>
              <Tendencia delta={it.deltaPct} />
              <div className={`mt-2 flex w-full ${m.alto} items-start justify-center rounded-t-lg ${m.ped} shadow-inner`}>
                <span className="mt-1 text-xl font-black text-white/90 drop-shadow">{pos}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function RankList({ items, unidad }: Readonly<{ items: RankingItem[]; unidad: 'papel' | 'co2' }>) {
  if (items.length === 0) return <p className="text-sm text-muted-foreground py-2">Sin datos.</p>;
  const valor = (it: RankingItem) => (unidad === 'papel' ? `${fmt(it.papelKg, 1)} kg` : `${fmt(it.co2Kg, 1)} kg CO₂`);
  const top = items.slice(0, 3);
  const rest = items.slice(3);
  return (
    <div className="space-y-3">
      {/* Podio literal para el top 3 */}
      <Podio top={top} valor={valor} />

      {/* Resto: lista compacta */}
      {rest.length > 0 && (
        <ul className="divide-y rounded-xl border">
          {rest.map((it, i) => (
            <li key={it.nombre} className="flex items-center gap-2.5 px-3 py-2 text-sm">
              <span className="w-4 shrink-0 text-center text-xs font-medium text-muted-foreground tabular-nums">{i + 4}</span>
              <span className="min-w-0 flex-1 truncate" title={it.nombre}>{it.nombre}</span>
              <Tendencia delta={it.deltaPct} />
              <span className="w-24 shrink-0 text-right text-xs text-muted-foreground tabular-nums">{valor(it)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function MateriaAI({ stats }: Readonly<{ stats: SostenibilidadStats }>) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resp, setResp] = useState<string | null>(null);
  const preguntar = async (prompt: string) => {
    try {
      setLoading(true); setResp(null);
      const ctx = `Datos de sostenibilidad UTEC: papel ahorrado ${fmt(stats.papelAhorradoKg, 1)} kg, CO2 evitado ${fmt(stats.co2EvitadoKg, 1)} kg, agua ${fmt(stats.aguaAhorradaL)} L, ${fmt(stats.hojasEvitadas)} hojas, ${fmt(stats.recursosArchivo)} archivos digitales.`;
      const r = await postChat({ mensaje: `${prompt}\n\n${ctx}`, usuario_id: user?.id ?? 0, rol: user?.rol ?? '' });
      setResp(r.data?.respuesta ?? 'Sin respuesta.');
    } catch (e: unknown) {
      toast.error('El asistente no está disponible', { description: e instanceof Error ? e.message : 'ai-svc' });
    } finally { setLoading(false); }
  };
  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Sparkles className="h-4 w-4 mr-1.5 text-utec-purple" />Asistente
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className="p-1.5 rounded-md bg-utec-purple/10 text-utec-purple"><Sparkles className="h-4 w-4" /></span>
              Asistente de impacto
            </DialogTitle>
            <DialogDescription>Preguntale a la IA por el impacto ambiental logrado y cómo mejorarlo.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" disabled={loading} onClick={() => preguntar('Resumí en 2 frases el impacto ambiental logrado por la digitalización.')}>Resumir impacto</Button>
            <Button variant="outline" size="sm" disabled={loading} onClick={() => preguntar('Sugerí 3 acciones concretas para mejorar la sostenibilidad digitalizando más recursos.')}>¿Cómo mejorar?</Button>
          </div>
          {loading && <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Pensando…</div>}
          {resp && !loading && <div className="rounded-lg bg-muted/50 p-3 text-sm whitespace-pre-wrap leading-relaxed max-h-[50vh] overflow-auto">{resp}</div>}
        </DialogContent>
      </Dialog>
    </>
  );
}

function ComoFuncionaDialog({ open, onOpenChange }: Readonly<{ open: boolean; onOpenChange: (v: boolean) => void }>) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[640px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="p-1.5 rounded-md bg-utec-green/10 text-utec-green"><Leaf className="h-4 w-4" /></span>
            ¿Cómo se calcula?
          </DialogTitle>
          <DialogDescription>
            Las métricas son una <b>estimación derivada</b> de los recursos digitales — no son mediciones reales.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 text-sm py-1">
          <div className="rounded-lg border bg-muted/40 p-3">
            <p className="font-medium mb-1">La idea base</p>
            <p className="text-muted-foreground">Cada <b>archivo</b> subido a una materia evita que <b>cada estudiante inscripto</b> imprima una copia física. Los enlaces no cuentan para el papel (solo aparecen en el donut).</p>
          </div>

          <div>
            <p className="font-medium mb-1.5">1 · Hojas evitadas (por archivo)</p>
            <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
              <li>Hojas del recurso: usa <code>páginas estimadas</code>; si no, ~1 hoja por cada <b>50 KB</b>; si no hay datos, 1.</li>
              <li>× <b>copias evitadas</b> = cantidad de inscriptos en la materia (mínimo 1).</li>
              <li>Se suman todos los archivos → <b>hojas evitadas</b> totales.</li>
            </ul>
          </div>

          <div>
            <p className="font-medium mb-1.5">2 · De hojas a impacto (factores fijos)</p>
            <div className="rounded-lg border overflow-hidden">
              <table className="w-full text-xs">
                <tbody className="[&_td]:px-3 [&_td]:py-1.5 [&_tr]:border-b [&_tr:last-child]:border-0">
                  <tr><td className="text-muted-foreground">Papel</td><td>hojas × 4,5 g</td><td className="text-right text-muted-foreground">4,5 g/hoja</td></tr>
                  <tr><td className="text-muted-foreground">CO₂</td><td>hojas × 4,7 g</td><td className="text-right text-muted-foreground">4,7 g/hoja</td></tr>
                  <tr><td className="text-muted-foreground">Agua</td><td>hojas × 10 L</td><td className="text-right text-muted-foreground">10 L/hoja</td></tr>
                  <tr><td className="text-muted-foreground">Árboles</td><td>papel ÷ 8,3 kg</td><td className="text-right text-muted-foreground">8,3 kg/árbol</td></tr>
                  <tr><td className="text-muted-foreground">Km en auto</td><td>CO₂ ÷ 0,12 kg</td><td className="text-right text-muted-foreground">0,12 kg/km</td></tr>
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <p className="font-medium mb-1.5">3 · El resto</p>
            <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
              <li><b>Índice (0-100):</b> 40% adopción digital + 60% impacto.</li>
              <li><b>Equivalencias:</b> agua/CO₂ divididos por factores cotidianos (duchas, cargas de celular…).</li>
              <li><b>Proyección:</b> promedio mensual extendido 3 meses.</li>
              <li><b>Ranking:</b> hojas agrupadas por carrera/docente de la materia.</li>
            </ul>
          </div>

          <p className="text-xs text-muted-foreground border-t pt-3">
            Los factores son constantes de referencia (aproximadas). Cuantos más recursos digitales se suban a materias con muchos inscriptos, mayor el ahorro estimado.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function SostenibilidadDashboard() {
  const { stats, loading } = useSostenibilidad();
  const [ranking, setRanking] = useState<SostenibilidadRanking | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const [meta, setMeta] = useState<number>(() => Number(localStorage.getItem(META_KEY)) || META_DEFAULT);
  const [infoOpen, setInfoOpen] = useState(false);

  useEffect(() => {
    sostenibilidadApi.obtenerRanking().then((r) => setRanking(r.data ?? null)).catch(() => { /* noop */ });
  }, []);

  const chartData = useMemo(() => {
    if (!stats) return [];
    let acc = 0;
    const real = stats.ahorroPorMes.map((p) => { acc += p.hojas; return { mes: p.mes, hojas: p.hojas, acumulado: acc, proyeccion: null as number | null }; });
    if (real.length > 0) real[real.length - 1].proyeccion = real[real.length - 1].acumulado;
    const avg = real.length ? real.reduce((a, p) => a + p.hojas, 0) / real.length : 0;
    let last = acc;
    const proj = Array.from({ length: 3 }, (_, i) => { last += avg; return { mes: `+${i + 1}m`, hojas: null as number | null, acumulado: null as number | null, proyeccion: Math.round(last) }; });
    return [...real, ...proj];
  }, [stats]);

  if (loading && !stats) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-4 w-72" />
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}</div>
        <div className="grid gap-4 lg:grid-cols-3"><Skeleton className="h-64 rounded-2xl lg:col-span-2" /><Skeleton className="h-64 rounded-2xl" /></div>
      </div>
    );
  }
  if (!stats) {
    return <div className="text-center text-muted-foreground py-12"><Leaf className="mx-auto mb-3 h-10 w-10 text-utec-green/50" /><p>No se pudieron cargar las métricas.</p></div>;
  }

  const indice = (() => {
    const adopcion = stats.recursosArchivo / Math.max(1, stats.recursosArchivo + stats.recursosEnlace);
    const impacto = Math.min(1, stats.hojasEvitadas / IMPACTO_HOJAS_TOPE);
    return Math.round(adopcion * 40 + impacto * 60);
  })();
  const progresoMeta = Math.min(100, Math.round((stats.hojasEvitadas / meta) * 100));

  // Escalera de hitos por árboles salvados: siempre hay un "próximo" al que apuntar.
  const arboles = stats.arbolesSalvados;
  const escalera = [
    { emoji: '🌱', label: 'Primer árbol', meta: 1 },
    { emoji: '🌿', label: '10 árboles', meta: 10 },
    { emoji: '🌳', label: '50 árboles', meta: 50 },
    { emoji: '🌲', label: '100 árboles', meta: 100 },
    { emoji: '🏕️', label: '250 árboles', meta: 250 },
    { emoji: '🏞️', label: '500 árboles', meta: 500 },
    { emoji: '🌍', label: '1.000 árboles', meta: 1000 },
  ];
  const hitos = escalera.map((h) => ({ ...h, ok: arboles >= h.meta }));
  const proximo = hitos.find((h) => !h.ok) ?? null;
  const metaAnterior = [...hitos].reverse().find((h) => h.ok)?.meta ?? 0;
  const faltan = proximo ? Math.max(0, Math.ceil(proximo.meta - arboles)) : 0;
  const progresoProximo = proximo
    ? Math.min(100, Math.round(((arboles - metaAnterior) / (proximo.meta - metaAnterior)) * 100))
    : 100;
  const metaSuperada = stats.hojasEvitadas >= meta;

  const donutData = [
    { name: 'Archivos', value: stats.recursosArchivo, fill: UTEC_GREEN },
    { name: 'Enlaces', value: stats.recursosEnlace, fill: '#00c7ff' },
  ];

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) rootRef.current?.requestFullscreen?.().catch(() => { /* noop */ });
    else document.exitFullscreen?.().catch(() => { /* noop */ });
  };
  const compartir = () => navigator.clipboard?.writeText(window.location.href).then(() => toast.success('Link copiado')).catch(() => { /* noop */ });
  const exportarPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18); doc.setTextColor(24, 72, 151); doc.text('Reporte de Sostenibilidad — USM UTEC', 14, 20);
    doc.setTextColor(60); doc.setFontSize(11);
    const filas: [string, string][] = [
      ['Papel ahorrado', `${fmt(stats.papelAhorradoKg, 1)} kg`],
      ['CO₂ evitado', `${fmt(stats.co2EvitadoKg, 1)} kg`],
      ['Agua ahorrada', `${fmt(stats.aguaAhorradaL)} L`],
      ['Hojas evitadas', `${fmt(stats.hojasEvitadas)}`],
      ['Árboles salvados', `≈ ${fmt(stats.arbolesSalvados, 1)}`],
      ['Km en auto evitados', `≈ ${fmt(stats.kmAutoEquivalente)}`],
      ['Recursos digitales', `${fmt(stats.recursosDigitalesTotales)} (${stats.recursosArchivo} archivos, ${stats.recursosEnlace} enlaces)`],
      ['Índice de sostenibilidad', `${indice} / 100`],
    ];
    let y = 36;
    filas.forEach(([k, v]) => { doc.setFont('helvetica', 'bold'); doc.text(`${k}:`, 14, y); doc.setFont('helvetica', 'normal'); doc.text(v, 80, y); y += 9; });
    doc.setFontSize(9); doc.setTextColor(150); doc.text(`Generado el ${new Date().toLocaleDateString('es-UY')}`, 14, y + 6);
    doc.save('sostenibilidad-utec.pdf');
  };

  const editarMeta = () => {
    const nueva = window.prompt('Meta anual de hojas evitadas:', String(meta));
    if (nueva && !Number.isNaN(Number(nueva)) && Number(nueva) > 0) {
      const n = Math.round(Number(nueva)); setMeta(n); localStorage.setItem(META_KEY, String(n)); toast.success('Meta actualizada');
    }
  };

  return (
    <div ref={rootRef} className="space-y-4 [&:fullscreen]:bg-background [&:fullscreen]:overflow-auto [&:fullscreen]:p-5">
      <PageHeader
        title="Sostenibilidad"
        description="Lo que la reserva digital le ahorra al campus: papel, agua y CO₂."
        accentColor="#86bb4c"
        actions={
          <>
            <Button variant="ghost" size="sm" className={HEADER_ACTION} onClick={() => setInfoOpen(true)}><Info className="mr-1.5 h-3.5 w-3.5" />Cómo funciona</Button>
            <Button variant="ghost" size="sm" className={HEADER_ACTION} onClick={compartir}><Share2 className="mr-1.5 h-3.5 w-3.5" />Compartir</Button>
            <Button variant="ghost" size="sm" className={HEADER_ACTION} onClick={exportarPDF}><Download className="mr-1.5 h-3.5 w-3.5" />PDF</Button>
            <Button variant="ghost" size="sm" className={HEADER_ACTION} onClick={toggleFullscreen}><Maximize2 className="mr-1.5 h-3.5 w-3.5" />Presentación</Button>
          </>
        }
        nav={
          <div className="flex w-full flex-wrap items-center justify-between gap-3">
            <LiveCounter base={stats.hojasEvitadas} />
            <MateriaAI stats={stats} />
          </div>
        }
      />

      <ComoFuncionaDialog open={infoOpen} onOpenChange={setInfoOpen} />

      {/* Hero count-up */}
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
        <HeroStat icon={FileText} label="Papel ahorrado" value={stats.papelAhorradoKg} suffix="kg" dec={1} variant="green" />
        <HeroStat icon={Cloud} label="CO₂ evitado" value={stats.co2EvitadoKg} suffix="kg" dec={1} variant="green" />
        <HeroStat icon={Droplets} label="Agua ahorrada" value={stats.aguaAhorradaL} suffix="L" variant="cyan" />
        <HeroStat icon={Files} label="Hojas evitadas" value={stats.hojasEvitadas} variant="blue" />
        <HeroStat icon={TreePine} label="Árboles salvados" value={stats.arbolesSalvados} dec={1} variant="green" />
        <HeroStat icon={Car} label="Km en auto" value={stats.kmAutoEquivalente} variant="orange" />
      </div>

      {/* Índice + bosque + equivalencias */}
      <div className="grid gap-4 lg:grid-cols-3 items-start">
        <Panel title="Índice de sostenibilidad" icon={<Leaf className="h-4 w-4 text-utec-green" />} accent="bg-utec-green/10">
          <Gauge value={indice} />
          <p className="text-xs text-muted-foreground text-center mt-2">Combina adopción digital e impacto ambiental.</p>
        </Panel>
        <div className="lg:col-span-2">
          <BosqueForest arboles={stats.arbolesSalvados} />
        </div>
      </div>

      {/* Izquierda (1/3): Equivalencias + Tipo de recurso apilados · Derecha (2/3): Meta anual a toda la altura */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Equivalencias stats={stats} />

        {/* Meta + badges */}
        <Panel
          title="Meta anual"
          icon={<Trophy className="h-4 w-4 text-utec-yellow" />}
          accent="bg-utec-yellow/10"
          className="lg:col-span-2 lg:row-span-2"
          action={<Button variant="ghost" size="sm" className="h-7" onClick={editarMeta}>Editar</Button>}
        >
          {/* Meta anual (hojas) */}
          <div className="flex items-end justify-between text-sm mb-1">
            <span className="text-muted-foreground">{fmt(stats.hojasEvitadas)} / {fmt(meta)} hojas</span>
            {metaSuperada
              ? <span className="inline-flex items-center gap-1 font-semibold text-utec-green"><Award className="h-3.5 w-3.5" />¡Superada!</span>
              : <span className="font-semibold text-utec-green">{progresoMeta}%</span>}
          </div>
          <div className="h-2.5 rounded-full bg-muted overflow-hidden mb-4">
            <div className="h-full rounded-full bg-gradient-to-r from-utec-green to-utec-cyan" style={{ width: `${progresoMeta}%` }} />
          </div>

          {/* Próximo hito */}
          {proximo && (
            <div className="rounded-xl border bg-muted/30 p-3 mb-3">
              <div className="flex items-center justify-between text-sm mb-1.5">
                <span className="flex items-center gap-1.5 min-w-0">
                  <span className="text-base leading-none">{proximo.emoji}</span>
                  <span className="font-medium truncate">Próximo: {proximo.label}</span>
                </span>
                <span className="text-xs text-muted-foreground tabular-nums shrink-0">faltan {fmt(faltan)}</span>
              </div>
              <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-utec-green to-utec-cyan transition-all duration-700" style={{ width: `${progresoProximo}%` }} />
              </div>
            </div>
          )}

          {/* Insignias (logros) */}
          <div className="grid grid-cols-2 gap-1.5">
            {hitos.map((h) => (
              <div
                key={h.label}
                className={`flex items-center gap-2 rounded-lg border px-2 py-1.5 text-xs transition-colors ${
                  h.ok ? 'border-utec-green/30 bg-utec-green/10' : 'border-dashed border-border'
                }`}
                title={h.ok ? `¡Conseguido! ${h.label}` : `Bloqueado — ${h.label}`}
              >
                <span className={`text-base leading-none ${h.ok ? '' : 'opacity-40 grayscale'}`}>{h.emoji}</span>
                <span className={`flex-1 truncate font-medium ${h.ok ? '' : 'text-muted-foreground'}`}>{h.label}</span>
                {h.ok
                  ? <Award className="h-3.5 w-3.5 shrink-0 text-utec-green" />
                  : <Lock className="h-3 w-3 shrink-0 text-muted-foreground/60" />}
              </div>
            ))}
          </div>
        </Panel>

        {/* Donut archivo vs enlace */}
        <Panel title="Tipo de recurso" icon={<Database className="h-4 w-4 text-utec-blue" />} accent="bg-utec-blue/10">
          <div className="flex items-center gap-3">
            <ResponsiveContainer width={92} height={92}>
              <PieChart>
                <Pie data={donutData} dataKey="value" innerRadius={24} outerRadius={40} paddingAngle={2}>
                  {donutData.map((d) => <Cell key={d.name} fill={d.fill} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-1.5 text-sm">
              <p className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-utec-green" />Archivos: <b>{stats.recursosArchivo}</b></p>
              <p className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-utec-cyan" />Enlaces: <b>{stats.recursosEnlace}</b></p>
              <p className="text-xs text-muted-foreground pt-1">Los archivos generan el ahorro de papel.</p>
            </div>
          </div>
        </Panel>
      </div>

      {/* Evolución + proyección */}
      <Panel
        title="Evolución y proyección"
        icon={<TrendingUp className="h-4 w-4 text-utec-green" />}
        accent="bg-utec-green/10"
        action={ranking && (
          <Badge className={ranking.comparativa.deltaPct >= 0 ? 'bg-utec-green/10 text-utec-green border-utec-green/20 border' : 'bg-utec-red/10 text-utec-red border-utec-red/20 border'}>
            {ranking.comparativa.deltaPct >= 0 ? <TrendingUp className="h-3.5 w-3.5 mr-1" /> : <TrendingDown className="h-3.5 w-3.5 mr-1" />}
            {ranking.comparativa.deltaPct >= 0 ? '+' : ''}{ranking.comparativa.deltaPct}% vs mes anterior
          </Badge>
        )}
      >
        {chartData.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">Aún no hay datos mensuales.</p>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <ComposedChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <defs><linearGradient id="gHojas" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={UTEC_GREEN} stopOpacity={0.35} /><stop offset="100%" stopColor={UTEC_GREEN} stopOpacity={0} /></linearGradient></defs>
              <CartesianGrid strokeDasharray="2 4" stroke="#e5e7eb" vertical={false} />
              <XAxis dataKey="mes" tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} width={44} />
              <Tooltip />
              <Area type="monotone" dataKey="hojas" name="Hojas/mes" stroke={UTEC_GREEN} strokeWidth={2} fill="url(#gHojas)" />
              <Line type="monotone" dataKey="acumulado" name="Acumulado" stroke="#184897" strokeWidth={2} dot={false} connectNulls />
              <Line type="monotone" dataKey="proyeccion" name="Proyección" stroke="#9333ea" strokeWidth={2} strokeDasharray="5 5" dot={false} connectNulls />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </Panel>

      {/* Leaderboard + IA */}
      <div className="grid gap-4 lg:grid-cols-2 items-stretch">
        <Panel title="Carreras más sostenibles" icon={<Trophy className="h-4 w-4 text-utec-yellow" />} accent="bg-utec-yellow/10">
          <RankList items={ranking?.carreras ?? []} unidad="papel" />
        </Panel>
        <Panel title="Docentes que más digitalizan" icon={<Trophy className="h-4 w-4 text-utec-orange" />} accent="bg-utec-orange/10">
          <RankList items={ranking?.docentes ?? []} unidad="co2" />
        </Panel>
      </div>
    </div>
  );
}
