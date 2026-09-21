import { useEffect, useRef, type CSSProperties } from 'react';
import { NodeNetwork } from '@/components/layouts/AuthLayout/NodeNetwork';
import { UtecShapesBackground } from './UtecShapesBackground';
import { MARCA_EN, PALETA_DECORATIVA } from '@/lib/design/paleta';


const DARK = 'linear-gradient(160deg, #1b2236 0%, #0e1320 100%)';
const PALETTE = PALETA_DECORATIVA;

// Posiciones/tiempos deterministas (pseudo-random por seno) para no recomputar en cada render.
const spread = (i: number, k: number) => Math.round((Math.sin(i * k) * 0.5 + 0.5) * 100);
const STARS = Array.from({ length: 46 }, (_, i) => ({
  top: spread(i, 12.9898), left: spread(i, 78.233), size: 1 + (i % 3), delay: +((i * 0.37) % 3).toFixed(2), dur: 2 + (i % 4),
}));
const CONFETTI = Array.from({ length: 26 }, (_, i) => ({
  left: spread(i, 45.1), color: PALETTE[i % PALETTE.length], delay: +((i * 0.41) % 5).toFixed(2),
  dur: +(4 + ((i * 0.7) % 4)).toFixed(2), w: 5 + (i % 5), h: 9 + (i % 7),
}));
const EQ_BARS = Array.from({ length: 32 }, (_, i) => ({
  color: PALETTE[i % PALETTE.length], delay: +((i * 0.13) % 1.2).toFixed(2), dur: +(0.8 + ((i * 0.07) % 0.9)).toFixed(2),
}));
const BUBBLES = Array.from({ length: 16 }, (_, i) => ({
  left: spread(i, 33.7), color: PALETTE[i % PALETTE.length], size: 10 + (i % 5) * 6,
  delay: +((i * 0.5) % 6).toFixed(2), dur: +(6 + ((i * 0.9) % 6)).toFixed(2),
}));

interface PatternProps {
  interactive?: boolean;
}

// ---- Patrones individuales (cada uno llena `absolute inset-0`) ----

function Formas({ interactive }: Readonly<PatternProps>) {
  return <UtecShapesBackground interactive={interactive} />;
}

function Nodos() {
  return (
    <div className="absolute inset-0 overflow-hidden" style={{ background: DARK }} aria-hidden>
      <NodeNetwork />
    </div>
  );
}

function Aurora() {
  const style: CSSProperties = {
    background:
      'radial-gradient(45% 70% at 18% 30%, rgba(24,72,151,.65), transparent 60%),' +
      'radial-gradient(40% 65% at 82% 38%, rgba(222,122,39,.5), transparent 60%),' +
      'radial-gradient(55% 75% at 55% 95%, rgba(134,187,76,.42), transparent 60%),' +
      'radial-gradient(45% 60% at 70% 10%, rgba(0,199,255,.4), transparent 60%)',
    backgroundColor: '#0e1320',
    backgroundSize: '200% 200%',
  };
  return (
    <div className="absolute inset-0 overflow-hidden" style={{ backgroundColor: '#0e1320' }} aria-hidden>
      <div className="absolute inset-0 motion-safe:animate-[aurora-drift_18s_ease-in-out_infinite]" style={style} />
    </div>
  );
}

function Grilla() {
  const style: CSSProperties = {
    backgroundImage:
      'linear-gradient(rgba(0,199,255,.14) 1px, transparent 1px),' +
      'linear-gradient(90deg, rgba(0,199,255,.14) 1px, transparent 1px)',
    backgroundSize: '36px 36px',
  };
  return (
    <div className="absolute inset-0 overflow-hidden" style={{ background: DARK }} aria-hidden>
      <div className="absolute inset-0 motion-safe:animate-[grid-pan_18s_linear_infinite]" style={style} />
      <div className="absolute -top-8 right-[12%] h-32 w-32 rounded-full blur-2xl" style={{ background: 'rgba(24,72,151,.5)' }} />
    </div>
  );
}

function Diagonales() {
  const style: CSSProperties = {
    backgroundImage:
      `repeating-linear-gradient(45deg, ${MARCA_EN.blue}22 0 14px, transparent 14px 28px),` +
      `repeating-linear-gradient(45deg, ${MARCA_EN.orange}18 0 14px, transparent 14px 28px)`,
    backgroundSize: '56px 56px, 56px 56px',
    backgroundPosition: '0 0, 28px 28px',
  };
  return (
    <div className="absolute inset-0 overflow-hidden" style={{ background: DARK }} aria-hidden>
      <div className="absolute inset-0 motion-safe:animate-[diag-pan_14s_linear_infinite]" style={style} />
    </div>
  );
}

function Blobs() {
  const blob = (cls: string, color: string, anim: string) => (
    <div className={`absolute rounded-full blur-2xl ${cls} ${anim}`} style={{ background: color }} />
  );
  return (
    <div className="absolute inset-0 overflow-hidden" style={{ background: DARK }} aria-hidden>
      {blob('-top-10 left-[8%] h-40 w-40', `${MARCA_EN.blue}cc`, 'motion-safe:animate-[auth-float-a_12s_ease-in-out_infinite]')}
      {blob('top-[30%] left-[42%] h-28 w-28', `${MARCA_EN.orange}b3`, 'motion-safe:animate-[auth-float-b_15s_ease-in-out_infinite]')}
      {blob('-bottom-12 right-[24%] h-44 w-44', `${MARCA_EN.green}aa`, 'motion-safe:animate-[auth-float-c_13s_ease-in-out_infinite]')}
      {blob('top-[10%] right-[8%] h-24 w-24', `${MARCA_EN.cyan}99`, 'motion-safe:animate-[auth-float-a_11s_ease-in-out_infinite]')}
      {blob('bottom-[10%] left-[30%] h-20 w-20', `${MARCA_EN.yellow}99`, 'motion-safe:animate-[auth-float-b_9s_ease-in-out_infinite]')}
    </div>
  );
}

function Olas() {
  // Las clases de animación deben ser literales estáticas para que Tailwind las genere.
  const wave = (fill: string, opacity: number, animCls: string, y: number) => (
    <svg className={`absolute left-0 bottom-0 h-full w-[200%] ${animCls}`} viewBox="0 0 1200 200" preserveAspectRatio="none" aria-hidden>
      <path d={`M0 ${y} C150 ${y - 40} 300 ${y + 40} 600 ${y} S1050 ${y - 40} 1200 ${y} V200 H0 Z`} fill={fill} opacity={opacity} />
    </svg>
  );
  return (
    <div className="absolute inset-0 overflow-hidden" style={{ background: DARK }} aria-hidden>
      {wave(MARCA_EN.blue, 0.5, 'motion-safe:animate-[wave-x_13s_linear_infinite]', 120)}
      {wave(MARCA_EN.cyan, 0.28, 'motion-safe:animate-[wave-x_9s_linear_infinite]', 150)}
      {wave(MARCA_EN.cyan, 0.22, 'motion-safe:animate-[wave-x_17s_linear_infinite]', 95)}
    </div>
  );
}

// Constelación / espacio
function Estrellas() {
  return (
    <div className="bg-anim absolute inset-0 overflow-hidden" style={{ background: 'radial-gradient(120% 100% at 50% 0%, #1a2440 0%, #080c16 72%)' }} aria-hidden>
      {STARS.map((s, i) => (
        <span key={i} className="absolute rounded-full bg-card" style={{ top: `${s.top}%`, left: `${s.left}%`, width: s.size, height: s.size, animation: `twinkle ${s.dur}s ease-in-out ${s.delay}s infinite` }} />
      ))}
      <span className="absolute h-px w-24" style={{ top: '12%', left: '4%', background: 'linear-gradient(90deg, transparent, #fff)', animation: 'shooting-star 7s ease-in 1s infinite' }} />
      <span className="absolute h-px w-20" style={{ top: '32%', left: '18%', background: 'linear-gradient(90deg, transparent, #9ad8ff)', animation: 'shooting-star 11s ease-in 5s infinite' }} />
    </div>
  );
}

// Circuito / tecnología
function Circuito() {
  const vias: ReadonlyArray<[number, number]> = [[120, 40], [260, 90], [80, 120], [220, 160], [180, 70], [360, 60]];
  return (
    <div className="bg-anim absolute inset-0 overflow-hidden" style={{ background: DARK }} aria-hidden>
      <svg className="absolute inset-0 h-full w-full" preserveAspectRatio="xMidYMid slice" viewBox="0 0 400 200">
        <g fill="none" stroke={MARCA_EN.cyan} strokeOpacity="0.4" strokeWidth="1.4" strokeDasharray="6 6" style={{ animation: 'circuit-flow 1.2s linear infinite' }}>
          <path d="M0 40 H120 V90 H260 V30 H400" />
          <path d="M0 120 H80 V160 H220 V110 H400" />
          <path d="M40 0 V70 H180 V200" />
          <path d="M320 0 V60 H360 V200" />
        </g>
        <g fill={MARCA_EN.cyan}>
          {vias.map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r="3.2" style={{ animation: `twinkle ${2 + (i % 3)}s ease-in-out ${i * 0.3}s infinite` }} />
          ))}
        </g>
      </svg>
    </div>
  );
}

// Confeti / celebración
function Confeti() {
  return (
    <div className="bg-anim absolute inset-0 overflow-hidden" style={{ background: DARK }} aria-hidden>
      {CONFETTI.map((c, i) => (
        <span key={i} className="absolute -top-3" style={{ left: `${c.left}%`, width: c.w, height: c.h, background: c.color, borderRadius: 2, animation: `confetti-fall ${c.dur}s linear ${c.delay}s infinite` }} />
      ))}
    </div>
  );
}

// Ecualizador / música
function Ecualizador() {
  return (
    <div className="bg-anim absolute inset-0 flex items-end gap-[3px] overflow-hidden px-2" style={{ background: DARK }} aria-hidden>
      {EQ_BARS.map((b, i) => (
        <span key={i} className="flex-1 origin-bottom rounded-t-sm" style={{ height: '72%', background: `linear-gradient(to top, ${b.color}, ${b.color}44)`, animation: `eq-bounce ${b.dur}s ease-in-out ${b.delay}s infinite` }} />
      ))}
    </div>
  );
}

// Panal / geometría
function Panal() {
  return (
    <div className="bg-anim absolute inset-0 overflow-hidden" style={{ background: DARK }} aria-hidden>
      <svg className="absolute inset-0 h-full w-full opacity-50" aria-hidden>
        <defs>
          <pattern id="hex-panal" width="56" height="48" patternUnits="userSpaceOnUse">
            <path d="M14 0 L42 0 L56 24 L42 48 L14 48 L0 24 Z" fill="none" stroke={MARCA_EN.cyan} strokeOpacity="0.35" strokeWidth="1.2" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#hex-panal)" />
      </svg>
      <div className="absolute inset-0" style={{ background: `linear-gradient(105deg, transparent 42%, ${MARCA_EN.cyan}26 50%, transparent 58%)`, animation: 'bg-shimmer 4.5s ease-in-out infinite' }} />
    </div>
  );
}

// Topografía / mapas
function Topografia() {
  return (
    <div className="bg-anim absolute inset-0 overflow-hidden" style={{ background: DARK }} aria-hidden>
      <div className="absolute inset-0" style={{ backgroundImage: `repeating-radial-gradient(circle at 28% 132%, ${MARCA_EN.green}00 0 14px, ${MARCA_EN.green}33 14px 16px)`, backgroundSize: '90px 90px', animation: 'topo-drift 20s linear infinite' }} />
      <div className="absolute inset-0" style={{ backgroundImage: `repeating-radial-gradient(circle at 82% -24%, ${MARCA_EN.cyan}00 0 16px, ${MARCA_EN.cyan}2b 16px 18px)`, backgroundSize: '110px 110px', animation: 'topo-drift 28s linear infinite reverse' }} />
    </div>
  );
}

// Plasma / nebulosa
function Plasma() {
  return (
    <div className="bg-anim absolute inset-0 overflow-hidden" style={{ backgroundColor: '#0a0e1a' }} aria-hidden>
      <div
        className="absolute inset-0 blur-2xl"
        style={{
          background: `conic-gradient(from 0deg at 50% 50%, ${MARCA_EN.blue}, ${MARCA_EN.cyan}, ${MARCA_EN.red}, ${MARCA_EN.orange}, ${MARCA_EN.green}, ${MARCA_EN.cyan}, ${MARCA_EN.blue})`,
          opacity: 0.55,
          animation: 'plasma-spin 24s linear infinite',
        }}
      />
    </div>
  );
}

// Burbujas
function Burbujas() {
  return (
    <div className="bg-anim absolute inset-0 overflow-hidden" style={{ background: DARK }} aria-hidden>
      {BUBBLES.map((b, i) => (
        <span key={i} className="absolute bottom-0 rounded-full" style={{ left: `${b.left}%`, width: b.size, height: b.size, border: `2px solid ${b.color}99`, animation: `bubble-rise ${b.dur}s ease-in ${b.delay}s infinite` }} />
      ))}
    </div>
  );
}

// Lluvia de código / programación (canvas)
function MatrixCodigo() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const FONT = 14;
    let w = 0, h = 0, cols = 0;
    let drops: number[] = [];
    let raf = 0;
    let last = 0;

    const resize = () => {
      const r = canvas.getBoundingClientRect();
      w = r.width; h = r.height;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cols = Math.max(1, Math.floor(w / FONT));
      drops = Array.from({ length: cols }, () => Math.floor((Math.random() * h) / FONT));
    };

    const step = (t: number) => {
      raf = requestAnimationFrame(step);
      if (t - last < 70) return; // ~14 fps, look "matrix"
      last = t;
      ctx.fillStyle = 'rgba(7, 11, 18, 0.22)';
      ctx.fillRect(0, 0, w, h);
      ctx.font = `${FONT}px monospace`;
      for (let i = 0; i < cols; i++) {
        const ch = String.fromCharCode(0x30a0 + Math.floor(Math.random() * 96));
        const x = i * FONT;
        const y = drops[i] * FONT;
        ctx.fillStyle = Math.random() < 0.08 ? '#d6ffe0' : MARCA_EN.green;
        ctx.fillText(ch, x, y);
        if (y > h && Math.random() > 0.975) drops[i] = 0;
        drops[i]++;
      }
    };

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    resize();
    if (!reduced) raf = requestAnimationFrame(step);
    else { ctx.fillStyle = '#070b12'; ctx.fillRect(0, 0, w, h); }
    return () => { ro.disconnect(); if (raf) cancelAnimationFrame(raf); };
  }, []);
  return (
    <div className="absolute inset-0 overflow-hidden" style={{ background: '#070b12' }} aria-hidden>
      <canvas ref={ref} className="absolute inset-0 h-full w-full" />
    </div>
  );
}

// ---- Catálogo ----

export type EventoPatron =
  | 'formas' | 'nodos' | 'aurora' | 'grilla' | 'diagonales' | 'blobs' | 'olas'
  | 'estrellas' | 'circuito' | 'confeti' | 'ecualizador' | 'panal' | 'topografia' | 'plasma' | 'burbujas' | 'matrix';

export const EVENTO_PATRONES: ReadonlyArray<{ id: EventoPatron; nombre: string }> = [
  { id: 'formas', nombre: 'Formas UTEC' },
  { id: 'nodos', nombre: 'Red de nodos' },
  { id: 'aurora', nombre: 'Aurora' },
  { id: 'plasma', nombre: 'Plasma' },
  { id: 'estrellas', nombre: 'Constelación' },
  { id: 'circuito', nombre: 'Circuito' },
  { id: 'matrix', nombre: 'Código' },
  { id: 'panal', nombre: 'Panal' },
  { id: 'grilla', nombre: 'Grilla tech' },
  { id: 'diagonales', nombre: 'Diagonales' },
  { id: 'topografia', nombre: 'Topografía' },
  { id: 'olas', nombre: 'Olas' },
  { id: 'ecualizador', nombre: 'Ecualizador' },
  { id: 'confeti', nombre: 'Confeti' },
  { id: 'burbujas', nombre: 'Burbujas' },
  { id: 'blobs', nombre: 'Blobs' },
];

/**
 * Renderiza el patrón de fondo elegido (capa `absolute inset-0`). Para usar,
 * ponelo dentro de un contenedor `relative overflow-hidden` con el contenido
 * por encima. `interactive` solo afecta al patrón "formas" (parallax al mouse).
 */
export function EventoPatternBg({ patron, interactive = false }: Readonly<{ patron?: string | null; interactive?: boolean }>) {
  switch (patron) {
    case 'nodos': return <Nodos />;
    case 'aurora': return <Aurora />;
    case 'grilla': return <Grilla />;
    case 'diagonales': return <Diagonales />;
    case 'blobs': return <Blobs />;
    case 'olas': return <Olas />;
    case 'estrellas': return <Estrellas />;
    case 'circuito': return <Circuito />;
    case 'confeti': return <Confeti />;
    case 'ecualizador': return <Ecualizador />;
    case 'panal': return <Panal />;
    case 'topografia': return <Topografia />;
    case 'plasma': return <Plasma />;
    case 'burbujas': return <Burbujas />;
    case 'matrix': return <MatrixCodigo />;
    case 'formas':
    default: return <Formas interactive={interactive} />;
  }
}
