import { useMemo } from 'react';
import type { Evento } from '@/lib/types/eventos';

interface LineaTiempoSemanaProps {
  eventos: Evento[];
  onNavigate: (id: number) => void;
}

const DIAS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

// Acento por tipo de evento (chip del día).
const TIPO_CHIP: Record<string, string> = {
  EVENTO: 'bg-utec-cyan/15 text-marca-cian-texto hover:bg-utec-cyan/25',
  CURSO: 'bg-utec-blue/15 text-marca-azul-texto hover:bg-utec-blue/25',
};
const TIPO_CHIP_DEFAULT = 'bg-muted text-foreground hover:bg-muted/70';

function hora(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleTimeString('es-UY', { hour: '2-digit', minute: '2-digit' });
}

/** Tira horizontal de la semana actual (lunes→domingo) con los eventos de cada día. */
export function LineaTiempoSemana({ eventos, onNavigate }: Readonly<LineaTiempoSemanaProps>) {
  const { dias, hoyKey } = useMemo(() => {
    const now = new Date();
    const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    monday.setDate(monday.getDate() - ((now.getDay() + 6) % 7));
    const keyOf = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;

    const porDia = new Map<string, Evento[]>();
    for (const e of eventos) {
      const d = new Date(e.inicio);
      if (Number.isNaN(d.getTime())) continue;
      const k = keyOf(d);
      if (!porDia.has(k)) porDia.set(k, []);
      porDia.get(k)!.push(e);
    }

    const out = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const k = keyOf(d);
      const evs = (porDia.get(k) ?? []).sort((a, b) => a.inicio.localeCompare(b.inicio));
      return { key: k, nombre: DIAS[i], numero: d.getDate(), eventos: evs };
    });
    return { dias: out, hoyKey: keyOf(new Date(now.getFullYear(), now.getMonth(), now.getDate())) };
  }, [eventos]);

  return (
    <div className="overflow-x-auto pb-1">
      <div className="grid min-w-[640px] grid-cols-7 gap-2">
        {dias.map((d) => {
          const esHoy = d.key === hoyKey;
          return (
            <div key={d.key} className={`rounded-xl border p-2 ${esHoy ? 'border-utec-cyan/60 bg-utec-cyan/5' : 'bg-card'}`}>
              <div className="mb-2 flex items-center justify-between">
                <span className={`text-2xs font-medium ${esHoy ? 'text-marca-cian-texto' : 'text-muted-foreground'}`}>{d.nombre}</span>
                <span className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-2xs font-semibold ${esHoy ? 'bg-utec-cyan text-marca-tinta' : 'text-foreground'}`}>{d.numero}</span>
              </div>
              <div className="space-y-1">
                {d.eventos.length === 0 && <p className="py-2 text-center text-2xs text-muted-foreground/60">Sin eventos</p>}
                {d.eventos.map((e) => (
                  <button
                    key={e.id}
                    type="button"
                    onClick={() => onNavigate(e.id)}
                    title={`${hora(e.inicio)} · ${e.titulo}`}
                    className={`block w-full truncate rounded-md px-1.5 py-1 text-left text-2xs font-medium transition-colors ${TIPO_CHIP[e.tipo] ?? TIPO_CHIP_DEFAULT}`}
                  >
                    <span className="tabular-nums opacity-80">{hora(e.inicio)}</span> {e.titulo}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
