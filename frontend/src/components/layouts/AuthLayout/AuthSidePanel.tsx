import { useEffect, useRef, type CSSProperties } from 'react';
import { NodeNetwork } from './NodeNetwork';

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

/**
 * Panel lateral del login: fondo oscuro liso con formas geométricas sólidas en
 * los colores UTEC (estilo flat/playful pero tecnológico). Las formas flotan
 * solas y reaccionan al mouse con parallax por capas (profundidad).
 * Respeta `prefers-reduced-motion`.
 */
export function AuthSidePanel() {
  const ref = useRef<HTMLDivElement>(null);

  // Trackea el mouse en TODA la pantalla (no solo sobre el panel): moviéndolo
  // sobre el formulario también reaccionan las figuras.
  useEffect(() => {
    let raf = 0;
    const onMove = (e: MouseEvent) => {
      const el = ref.current;
      if (!el) return;
      const x = e.clientX / window.innerWidth - 0.5; // -0.5 .. 0.5 (todo el ancho)
      const y = e.clientY / window.innerHeight - 0.5;
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
  }, []);

  const par = (dx: number, dy: number): CSSProperties => ({
    transform: `translate3d(calc(var(--mx, 0) * ${dx}px), calc(var(--my, 0) * ${dy}px), 0)`,
  });

  return (
    <div
      ref={ref}
      className="relative hidden lg:block overflow-hidden"
      style={{
        background: 'linear-gradient(160deg, #1b2236 0%, #0e1320 100%)',
        ['--mx' as string]: 0,
        ['--my' as string]: 0,
      }}
    >
      {/* ===== Red de nodos animada (fondo, detrás de las formas) ===== */}
      <NodeNetwork />

      {/* ===== Formas sólidas (flat, colores UTEC a full) ===== */}

      {/* Hexágono relleno (motivo del logo UTEC), girando lento */}
      <div className="absolute top-[8%] right-[14%]" style={par(30, 30)}>
        <svg
          width="170"
          height="170"
          viewBox="0 0 100 100"
          className="motion-safe:animate-[auth-spin-slow_40s_linear_infinite]"
        >
          <polygon points="50,3 92,26 92,74 50,97 8,74 8,26" fill={UTEC.cyan} />
        </svg>
      </div>

      {/* Círculo grande azul */}
      <div className="absolute -top-10 -left-10" style={par(44, 44)}>
        <div
          className="h-44 w-44 rounded-full motion-safe:animate-[auth-float-a_12s_ease-in-out_infinite]"
          style={{ background: UTEC.blue }}
        />
      </div>

      {/* Cuadrado redondeado amarillo (rotado) */}
      <div className="absolute top-[40%] left-[10%]" style={par(58, 58)}>
        <div
          className="h-28 w-28 rounded-2xl motion-safe:animate-[auth-float-b_15s_ease-in-out_infinite]"
          style={{ background: UTEC.yellow, transform: 'rotate(15deg)' }}
        />
      </div>

      {/* Triángulo verde */}
      <div className="absolute bottom-[12%] left-[22%]" style={par(50, 50)}>
        <div
          className="motion-safe:animate-[auth-float-c_13s_ease-in-out_infinite]"
          style={{
            width: 0,
            height: 0,
            borderLeft: '60px solid transparent',
            borderRight: '60px solid transparent',
            borderBottom: `104px solid ${UTEC.green}`,
            transform: 'rotate(-10deg)',
          }}
        />
      </div>

      {/* Cruz / plus naranja (tech) */}
      <div className="absolute bottom-[26%] right-[16%]" style={par(64, 64)}>
        <svg
          width="84"
          height="84"
          viewBox="0 0 24 24"
          className="motion-safe:animate-[auth-float-a_11s_ease-in-out_infinite]"
        >
          <path
            d="M9 3h6v6h6v6h-6v6H9v-6H3V9h6z"
            fill={UTEC.orange}
          />
        </svg>
      </div>

      {/* Anillo rojo grueso */}
      <div className="absolute top-[20%] right-[6%]" style={par(72, 72)}>
        <div
          className="h-24 w-24 rounded-full motion-safe:animate-[auth-float-b_9s_ease-in-out_infinite]"
          style={{ border: `12px solid ${UTEC.red}` }}
        />
      </div>

      {/* Semicírculo púrpura */}
      <div className="absolute bottom-[40%] right-[34%]" style={par(54, 54)}>
        <div
          className="h-16 w-32 motion-safe:animate-[auth-float-c_17s_ease-in-out_infinite]"
          style={{
            background: UTEC.purple,
            borderTopLeftRadius: '999px',
            borderTopRightRadius: '999px',
          }}
        />
      </div>

      {/* Píldora cian */}
      <div className="absolute top-[64%] left-[40%]" style={par(40, 40)}>
        <div
          className="h-7 w-24 rounded-full motion-safe:animate-[auth-float-a_14s_ease-in-out_infinite]"
          style={{ background: UTEC.cyan, transform: 'rotate(-25deg)' }}
        />
      </div>

      {/* Puntos sueltos */}
      <div className="absolute top-[14%] left-[40%]" style={par(96, 96)}>
        <div className="h-5 w-5 rounded-full" style={{ background: UTEC.green }} />
      </div>
      <div className="absolute bottom-[16%] right-[40%]" style={par(110, 110)}>
        <div className="h-6 w-6 rounded-full" style={{ background: UTEC.yellow }} />
      </div>
      <div className="absolute top-[48%] right-[12%]" style={par(120, 120)}>
        <div className="h-4 w-4 rounded-full" style={{ background: UTEC.cyan }} />
      </div>

      {/* ===== Marca ===== */}
      <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
        <div className="text-center text-white px-8">
          <h2 className="text-4xl font-utec mb-4 drop-shadow-lg">UTEC SPACE MANAGER</h2>
          <p className="text-lg font-utec tracking-wide opacity-90 drop-shadow-md">Gestor de espacios de UTEC</p>
        </div>
      </div>
    </div>
  );
}
