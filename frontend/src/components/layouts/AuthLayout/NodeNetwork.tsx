import { useEffect, useRef } from 'react';

// Cian UTEC en componentes RGB.
const RGB = '0, 199, 255';
const LINK = 135; // distancia máx. para unir dos nodos
const MOUSE = 190; // distancia máx. para unir un nodo al cursor

type Node = { x: number; y: number; vx: number; vy: number };

/**
 * Fondo de red de nodos animada (estilo constelación) en canvas.
 * Los nodos flotan, se enlazan entre sí cuando están cerca y se enlazan al
 * cursor del mouse. Respeta `prefers-reduced-motion` (congela el flote).
 */
export function NodeNetwork() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let w = 0;
    let h = 0;
    let nodes: Node[] = [];
    const mouse = { x: -9999, y: -9999, on: false };
    let raf = 0;

    const seed = () => {
      const count = Math.round((w * h) / 15000);
      const n = Math.max(14, Math.min(90, count));
      nodes = Array.from({ length: n }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
      }));
    };

    const resize = () => {
      const r = canvas.getBoundingClientRect();
      w = r.width;
      h = r.height;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      seed();
    };

    const draw = () => {
      ctx.clearRect(0, 0, w, h);

      if (!reduced) {
        for (const n of nodes) {
          n.x += n.vx;
          n.y += n.vy;
          if (n.x < 0 || n.x > w) n.vx *= -1;
          if (n.y < 0 || n.y > h) n.vy *= -1;
        }
      }

      // Enlaces nodo–nodo
      ctx.lineWidth = 1;
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i];
          const b = nodes[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < LINK * LINK) {
            const d = Math.sqrt(d2);
            ctx.strokeStyle = `rgba(${RGB}, ${0.16 * (1 - d / LINK)})`;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }

      // Enlaces nodo–cursor
      if (mouse.on) {
        for (const n of nodes) {
          const dx = n.x - mouse.x;
          const dy = n.y - mouse.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < MOUSE * MOUSE) {
            const d = Math.sqrt(d2);
            ctx.strokeStyle = `rgba(${RGB}, ${0.5 * (1 - d / MOUSE)})`;
            ctx.beginPath();
            ctx.moveTo(n.x, n.y);
            ctx.lineTo(mouse.x, mouse.y);
            ctx.stroke();
          }
        }
      }

      // Nodos
      ctx.fillStyle = `rgba(${RGB}, 0.55)`;
      for (const n of nodes) {
        ctx.beginPath();
        ctx.arc(n.x, n.y, 1.7, 0, Math.PI * 2);
        ctx.fill();
      }

      raf = requestAnimationFrame(draw);
    };

    const onMove = (e: MouseEvent) => {
      const r = canvas.getBoundingClientRect();
      const x = e.clientX - r.left;
      const y = e.clientY - r.top;
      mouse.on = x >= 0 && x <= r.width && y >= 0 && y <= r.height;
      mouse.x = x;
      mouse.y = y;
    };

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    resize();
    window.addEventListener('mousemove', onMove, { passive: true });
    raf = requestAnimationFrame(draw);

    return () => {
      ro.disconnect();
      window.removeEventListener('mousemove', onMove);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" aria-hidden />;
}
