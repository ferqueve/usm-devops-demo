import { useMemo } from 'react';

interface HeatmapDemandaProps {
  // Genérico: cualquier ítem con fecha de inicio (eventos, tutorías, etc.).
  // El peso opcional pondera la celda (ej. inscriptos/agendados).
  eventos: ReadonlyArray<{ inicio: string; inscriptosCount?: number; agendadosCount?: number }>;
}

const DIAS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const HORAS = Array.from({ length: 15 }, (_, i) => i + 8); // 8 a 22

export function HeatmapDemanda({ eventos }: Readonly<HeatmapDemandaProps>) {
  const { grid, max } = useMemo(() => {
    const g: number[][] = Array.from({ length: 7 }, () => Array(HORAS.length).fill(0));
    let mx = 0;
    for (const e of eventos) {
      const d = new Date(e.inicio);
      if (Number.isNaN(d.getTime())) continue;
      const dow = (d.getDay() + 6) % 7;
      const hIdx = d.getHours() - 8;
      if (hIdx < 0 || hIdx >= HORAS.length) continue;
      const peso = 1 + (e.inscriptosCount ?? e.agendadosCount ?? 0);
      g[dow][hIdx] += peso;
      mx = Math.max(mx, g[dow][hIdx]);
    }
    return { grid: g, max: mx };
  }, [eventos]);

  return (
    <div className="overflow-x-auto">
      <div className="inline-block min-w-full">
        <div className="flex">
          <div className="w-10 shrink-0" />
          {HORAS.map((h) => <div key={h} className="flex-1 text-center text-2xs text-muted-foreground min-w-[20px]">{h}</div>)}
        </div>
        {DIAS.map((dia, r) => (
          <div key={dia} className="flex items-center">
            <div className="w-10 shrink-0 text-2xs text-muted-foreground pr-1 text-right">{dia}</div>
            {HORAS.map((_, c) => {
              const v = grid[r][c];
              const op = max > 0 && v > 0 ? 0.15 + 0.85 * (v / max) : 0;
              return (
                <div key={c} className="flex-1 aspect-square min-w-[20px] p-[1px]">
                  <div
                    className="h-full w-full rounded-[3px] border border-border/40"
                    style={{ backgroundColor: v > 0 ? `rgba(222,122,39,${op})` : 'transparent' }}
                    title={v > 0 ? `${DIAS[r]} ${HORAS[c]}h · demanda ${v}` : undefined}
                  />
                </div>
              );
            })}
          </div>
        ))}
        <p className="text-2xs text-muted-foreground mt-2">Intensidad = eventos + inscriptos por franja. Más oscuro = más demanda.</p>
      </div>
    </div>
  );
}
