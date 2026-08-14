import { useEffect, useRef, type CSSProperties } from 'react';
import { NodeNetwork } from '@/components/layouts/AuthLayout/NodeNetwork';

// Colores institucionales UTEC (hex exactos, sólidos como las metric-cards).
const UTEC = {
  green: '#86BB4C',
  yellow: '#F6CA21',
  orange: '#DE7A27',
  red: '#DF2B31',
  blue: '#184897',
  cyan: '#00C7FF',
  purple: '#9333EA',
};

interface UtecShapesBackgroundProps {
  /** Clases extra para el contenedor raíz (absolute inset-0). */
  className?: string;
  /** Multiplica el tamaño de las formas. 1 = como el login. Útil para barras chicas. */
  scale?: number;
  /** Muestra la red de nodos animada por detrás. Default: true. */
  nodes?: boolean;
  /** Reacciona al mouse con parallax. Default: true (como el login). En false, las formas igual flotan solas. */
  interactive?: boolean;
}

/**
 * Fondo animado institucional UTEC, reutilizable. Gradiente oscuro + formas
 * geométricas sólidas en los colores UTEC que flotan solas y reaccionan al
 * mouse con parallax por capas (profundidad), más una red de nodos opcional
 * por detrás. Respeta `prefers-reduced-motion`.
 *
 * Se renderiza como capa `absolute inset-0`: ponelo dentro de un contenedor
 * `relative overflow-hidden` y montá el contenido encima (con `relative`/z).
 *
 * Es el mismo patrón que el panel del login (ver `AuthSidePanel`). Para crear
 * variantes nuevas, duplicá este componente y cambiá formas/colores.
 */
export function UtecShapesBackground({ className = '', scale = 1, nodes = true, interactive = true }: Readonly<UtecShapesBackgroundProps>) {
  const ref = useRef<HTMLDivElement>(null);

  // Trackea el mouse en toda la pantalla y lo normaliza al rect del contenedor,
  // de modo que el parallax funcione en cualquier tamaño/posición.
  useEffect(() => {
    if (!interactive) return; // sin parallax: las formas igual flotan por CSS
    let raf = 0;
    const onMove = (e: MouseEvent) => {
      const el = ref.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5; // -0.5 .. 0.5
      const y = (e.clientY - r.top) / r.height - 0.5;
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        el.style.setProperty('--mx', x.toFixed(3));
        el.style.setProperty('--my', y.toFixed(3));
      });
    };
    window.addEventListener('mousemove', onMove, { passive: true });
    return () => {
      window.removeEventListener('mousemove', onMove);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [interactive]);

  const par = (dx: number, dy: number): CSSProperties => ({
    transform: `translate3d(calc(var(--mx, 0) * ${dx}px), calc(var(--my, 0) * ${dy}px), 0)`,
  });
  const s = (px: number) => Math.round(px * scale);

  return (
    <div
      ref={ref}
      className={`absolute inset-0 overflow-hidden ${className}`}
      style={{
        background: 'linear-gradient(160deg, #1b2236 0%, #0e1320 100%)',
        ['--mx' as string]: 0,
        ['--my' as string]: 0,
      }}
      aria-hidden
    >
      {/* ===== Red de nodos animada (fondo, detrás de las formas) ===== */}
      {nodes && <NodeNetwork />}

      {/* ===== Formas sólidas (flat, colores UTEC a full) ===== */}

      {/* Hexágono relleno (motivo del logo UTEC), girando lento */}
      <div className="absolute top-[8%] right-[14%]" style={par(30, 30)}>
        <svg width={s(170)} height={s(170)} viewBox="0 0 100 100" className="motion-safe:animate-[auth-spin-slow_40s_linear_infinite]">
          <polygon points="50,3 92,26 92,74 50,97 8,74 8,26" fill={UTEC.cyan} />
        </svg>
      </div>

      {/* Círculo grande azul */}
      <div className="absolute -top-10 -left-10" style={par(44, 44)}>
        <div
          className="rounded-full motion-safe:animate-[auth-float-a_12s_ease-in-out_infinite]"
          style={{ height: s(176), width: s(176), background: UTEC.blue }}
        />
      </div>

      {/* Cuadrado redondeado amarillo (rotado) */}
      <div className="absolute top-[40%] left-[10%]" style={par(58, 58)}>
        <div
          className="rounded-2xl motion-safe:animate-[auth-float-b_15s_ease-in-out_infinite]"
          style={{ height: s(112), width: s(112), background: UTEC.yellow, transform: 'rotate(15deg)' }}
        />
      </div>

      {/* Triángulo verde */}
      <div className="absolute bottom-[12%] left-[22%]" style={par(50, 50)}>
        <div
          className="motion-safe:animate-[auth-float-c_13s_ease-in-out_infinite]"
          style={{
            width: 0,
            height: 0,
            borderLeft: `${s(60)}px solid transparent`,
            borderRight: `${s(60)}px solid transparent`,
            borderBottom: `${s(104)}px solid ${UTEC.green}`,
            transform: 'rotate(-10deg)',
          }}
        />
      </div>

      {/* Cruz / plus naranja (tech) */}
      <div className="absolute bottom-[26%] right-[16%]" style={par(64, 64)}>
        <svg width={s(84)} height={s(84)} viewBox="0 0 24 24" className="motion-safe:animate-[auth-float-a_11s_ease-in-out_infinite]">
          <path d="M9 3h6v6h6v6h-6v6H9v-6H3V9h6z" fill={UTEC.orange} />
        </svg>
      </div>

      {/* Anillo rojo grueso */}
      <div className="absolute top-[20%] right-[6%]" style={par(72, 72)}>
        <div
          className="rounded-full motion-safe:animate-[auth-float-b_9s_ease-in-out_infinite]"
          style={{ height: s(96), width: s(96), border: `${s(12)}px solid ${UTEC.red}` }}
        />
      </div>

      {/* Semicírculo púrpura */}
      <div className="absolute bottom-[40%] right-[34%]" style={par(54, 54)}>
        <div
          className="motion-safe:animate-[auth-float-c_17s_ease-in-out_infinite]"
          style={{ height: s(64), width: s(128), background: UTEC.purple, borderTopLeftRadius: '999px', borderTopRightRadius: '999px' }}
        />
      </div>

      {/* Píldora cian */}
      <div className="absolute top-[64%] left-[40%]" style={par(40, 40)}>
        <div
          className="rounded-full motion-safe:animate-[auth-float-a_14s_ease-in-out_infinite]"
          style={{ height: s(28), width: s(96), background: UTEC.cyan, transform: 'rotate(-25deg)' }}
        />
      </div>

      {/* Puntos sueltos */}
      <div className="absolute top-[14%] left-[40%]" style={par(96, 96)}>
        <div className="rounded-full" style={{ height: s(20), width: s(20), background: UTEC.green }} />
      </div>
      <div className="absolute bottom-[16%] right-[40%]" style={par(110, 110)}>
        <div className="rounded-full" style={{ height: s(24), width: s(24), background: UTEC.yellow }} />
      </div>
      <div className="absolute top-[48%] right-[12%]" style={par(120, 120)}>
        <div className="rounded-full" style={{ height: s(16), width: s(16), background: UTEC.cyan }} />
      </div>
    </div>
  );
}
