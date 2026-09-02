import { TreePine } from 'lucide-react';

interface BosqueForestProps {
  arboles: number;
}

/** "Bosque UTEC" que crece: un árbol por cada árbol salvado (estimado). */
export function BosqueForest({ arboles }: Readonly<BosqueForestProps>) {
  const n = Math.max(1, Math.min(80, Math.ceil(arboles)));
  const trees = Array.from({ length: n });
  return (
    <div
      className="relative overflow-hidden rounded-2xl border"
      style={{ background: 'linear-gradient(to bottom, #e3f4ff 0%, #eaf6e0 55%, #cdecb1 100%)' }}
    >
      <style>{`@keyframes utecTreeGrow{0%{transform:scale(0) translateY(12px);opacity:0}100%{transform:scale(1) translateY(0);opacity:1}}`}</style>

      <div className="absolute top-3 left-4 z-10 flex items-center gap-1.5 text-sm font-semibold text-utec-green">
        <TreePine className="h-4 w-4" />
        Bosque UTEC · ≈ {arboles.toFixed(1)} árboles
      </div>

      <div className="relative flex flex-wrap content-end items-end justify-center gap-x-1 gap-y-0 px-3 pt-10 pb-3 min-h-[200px]">
        {trees.map((_, i) => {
          const scale = 0.85 + ((i * 37) % 30) / 100; // variación de tamaño determinística
          return (
            <svg
              key={i}
              viewBox="0 0 24 34"
              className="origin-bottom drop-shadow-sm"
              style={{
                height: `${34 * scale}px`,
                width: `${24 * scale}px`,
                animation: 'utecTreeGrow .5s ease-out both',
                animationDelay: `${Math.min(2000, i * 35)}ms`,
              }}
            >
              <rect x="10.5" y="24" width="3" height="9" rx="1" fill="#7a5230" />
              <polygon points="12,2 3.5,15 20.5,15" fill="#86bb4c" />
              <polygon points="12,8 4.5,21 19.5,21" fill="#6ea83f" />
              <polygon points="12,13 6,25 18,25" fill="#5a8f34" />
            </svg>
          );
        })}
      </div>
    </div>
  );
}
