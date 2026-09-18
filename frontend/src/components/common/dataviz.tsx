import type { ReactNode } from 'react';
import { Minus, TrendingDown, TrendingUp } from 'lucide-react';

import { cn } from '@/lib/utils/helpers';
import { MARCA } from '@/lib/design/paleta';

// ============================================================================
// Componentes de data-viz reutilizables (generalizados desde el dashboard de
// Sostenibilidad para poder reusarlos en Eventos y otros módulos).
// Reglas: claro/oscuro con tokens, sin overflow, animaciones respetan
// prefers-reduced-motion (via .confetti-piece / keyframe en index.css).
// ============================================================================

const UTEC_GREEN = MARCA.verde;

/**
 * El globo que sale al pasar el mouse por un gráfico.
 *
 * Había once copias del mismo caparazón —`bg-chrome`, texto blanco, sombra—
 * repartidas entre Estadísticas, Predicciones y el dashboard. Lo de adentro
 * sí es propio de cada gráfico: un reparto no se explica como una serie. Lo
 * que no tenía por qué variar era la caja, y ya había variado: nueve usaban
 * `py-2`, cuatro `py-1.5` y una un borde y un radio distintos.
 */
export function GloboGrafico({ className, children }: Readonly<{ className?: string; children: ReactNode }>) {
  return (
    <div className={cn('rounded-lg bg-chrome px-3 py-2 text-xs text-white shadow-lg', className)}>
      {children}
    </div>
  );
}

// --- Flechita de tendencia ▲▼ (variación % vs. período anterior) ---
export function Tendencia({ delta }: Readonly<{ delta?: number }>) {
  if (delta == null || Math.abs(delta) < 1) {
    return (
      <span className="inline-flex items-center text-2xs text-muted-foreground/60" title="Sin cambios">
        <Minus className="h-3 w-3" />
      </span>
    );
  }
  const up = delta > 0;
  const txt = `${up ? '+' : ''}${Math.abs(delta) >= 999 ? '999' : Math.round(delta)}%`;
  return (
    <span
      className={`inline-flex items-center gap-0.5 text-2xs font-semibold ${up ? 'text-marca-verde-texto' : 'text-marca-rojo-texto'}`}
      title={`${txt} vs. período anterior`}
    >
      {up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}{txt}
    </span>
  );
}

// --- Gauge semicircular (índice 0-100) ---
export function Gauge({ value, suffix = '/ 100' }: Readonly<{ value: number; suffix?: string }>) {
  const v = Math.max(0, Math.min(100, value));
  const r = 70; const cx = 90; const cy = 90;
  const ang = Math.PI * (1 - v / 100);
  const x = cx + r * Math.cos(ang); const y = cy - r * Math.sin(ang);
  const circ = Math.PI * r;
  const color = v >= 66 ? UTEC_GREEN : v >= 33 ? MARCA.amarillo : MARCA.naranja;
  return (
    <div className="relative w-[180px] h-[100px] mx-auto">
      <svg viewBox="0 0 180 100" className="w-[180px] h-[100px]">
        <path d="M20 90 A70 70 0 0 1 160 90" fill="none" stroke="currentColor" className="text-muted" strokeWidth="12" strokeLinecap="round" />
        <path d="M20 90 A70 70 0 0 1 160 90" fill="none" stroke={color} strokeWidth="12" strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={circ * (1 - v / 100)} style={{ transition: 'stroke-dashoffset 1s ease-out' }} />
        <circle cx={x} cy={y} r="6" fill={color} />
      </svg>
      <div className="absolute inset-x-0 bottom-0 text-center">
        <div className="text-3xl font-bold tabular-nums" style={{ color }}>{Math.round(v)}</div>
        <div className="text-2xs text-muted-foreground -mt-1">{suffix}</div>
      </div>
    </div>
  );
}

// --- Confeti que llueve de fondo del podio (determinista; se detiene con
//     prefers-reduced-motion). Reusa el keyframe confetti-fall de index.css. ---
export function Confetti() {
  const piezas = [
    { l: '5%', c: MARCA.verde, s: 'h-2 w-1', dur: 3.2, delay: -0.4 },
    { l: '12%', c: MARCA.cian, s: 'h-1.5 w-1.5 rounded-full', dur: 2.7, delay: -1.9 },
    { l: '19%', c: MARCA.amarillo, s: 'h-2.5 w-1', dur: 3.8, delay: -0.9 },
    { l: '27%', c: '#9333ea', s: 'h-1.5 w-1.5 rounded-full', dur: 2.4, delay: -2.6 },
    { l: '34%', c: MARCA.naranja, s: 'h-2 w-1', dur: 3.5, delay: -1.2 },
    { l: '41%', c: MARCA.verde, s: 'h-1.5 w-1.5 rounded-full', dur: 2.9, delay: -0.2 },
    { l: '48%', c: MARCA.azul, s: 'h-2.5 w-1', dur: 3.1, delay: -2.2 },
    { l: '55%', c: MARCA.cian, s: 'h-2 w-1', dur: 3.7, delay: -1.5 },
    { l: '62%', c: MARCA.rojo, s: 'h-1.5 w-1.5 rounded-full', dur: 2.6, delay: -0.7 },
    { l: '69%', c: MARCA.amarillo, s: 'h-1.5 w-1.5 rounded-full', dur: 3.3, delay: -2.9 },
    { l: '76%', c: '#9333ea', s: 'h-2 w-1', dur: 2.8, delay: -1.1 },
    { l: '83%', c: MARCA.naranja, s: 'h-1.5 w-1.5 rounded-full', dur: 3.6, delay: -0.5 },
    { l: '90%', c: MARCA.verde, s: 'h-2.5 w-1', dur: 2.5, delay: -2.4 },
    { l: '96%', c: MARCA.cian, s: 'h-1.5 w-1.5 rounded-full', dur: 3.4, delay: -1.7 },
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

// --- Podio literal 🥇🥈🥉 con pedestales oro/plata/bronce + confeti ---
export interface PodioEntry {
  nombre: string;
  valor: string;
  deltaPct?: number;
  onClick?: () => void;
}

const PODIO_META: Record<number, { medal: string; alto: string; ped: string; ring: string }> = {
  1: { medal: '🥇', alto: 'h-24', ped: 'bg-utec-yellow', ring: 'ring-utec-yellow' },
  2: { medal: '🥈', alto: 'h-16', ped: 'bg-muted-foreground', ring: 'ring-border' },
  3: { medal: '🥉', alto: 'h-12', ped: 'bg-warning', ring: 'ring-warning' },
};

// Podio literal: 2º a la izquierda, 1º al centro (más alto, con corona), 3º a la derecha.
export function Podio({ top }: Readonly<{ top: PodioEntry[] }>) {
  const orden: Array<{ it: PodioEntry; pos: number }> = [];
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
          const Tag = it.onClick ? 'button' : 'div';
          return (
            <Tag
              key={it.nombre}
              type={it.onClick ? 'button' : undefined}
              onClick={it.onClick}
              className={`flex flex-col items-center ${esPrimero ? 'w-[38%]' : 'w-[31%]'} ${it.onClick ? 'cursor-pointer transition-transform hover:-translate-y-0.5' : ''}`}
            >
              {esPrimero && <span className="-mb-0.5 text-lg leading-none">👑</span>}
              <span className={`flex ${esPrimero ? 'h-14 w-14 text-3xl' : 'h-11 w-11 text-2xl'} items-center justify-center rounded-full bg-background shadow-md ring-2 ${m.ring}`}>
                {m.medal}
              </span>
              <span className="mt-1.5 w-full truncate text-center text-xs font-semibold leading-tight" title={it.nombre}>{it.nombre}</span>
              <span className="text-2xs font-bold tabular-nums">{it.valor}</span>
              <Tendencia delta={it.deltaPct} />
              <div className={`mt-2 flex w-full ${m.alto} items-start justify-center rounded-t-lg ${m.ped} shadow-inner`}>
                <span className="mt-1 text-xl font-black text-white/90 drop-shadow">{pos}</span>
              </div>
            </Tag>
          );
        })}
      </div>
    </div>
  );
}
