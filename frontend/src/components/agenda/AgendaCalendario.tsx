import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import type { Agendable } from '@/lib/agenda/types';
import { ESTADO, estadoDe, relleno } from '@/components/common/estados';

interface AgendaCalendarioProps {
  items: Agendable[];
  /** Máximo de items visibles por día antes de colapsar en "+N más". */
  maxPorDia?: number;
}

const DIAS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

/**
 * Color del chip según el estado crudo de la entidad. Cubre los estados de tutoría
 * y de evento en un solo mapa: no se pisan entre sí y así el calendario puede mostrar
 * los dos tipos juntos sin saber de cuál viene cada uno.
 */

/**
 * Calendario mensual de agendables. Sirve tanto a tutorías como a eventos —
 * antes existía una copia por entidad, idénticas salvo el color del día de hoy
 * y el relleno de la última semana.
 */
export function AgendaCalendario({ items, maxPorDia = 3 }: Readonly<AgendaCalendarioProps>) {
  const navigate = useNavigate();
  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    return { y: d.getFullYear(), m: d.getMonth() };
  });

  const porDia = useMemo(() => {
    const map = new Map<string, Agendable[]>();
    for (const item of items) {
      const d = new Date(item.inicio);
      if (Number.isNaN(d.getTime())) continue;
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(item);
    }
    // Dentro de cada día, en orden cronológico.
    for (const lista of map.values()) {
      lista.sort((a, b) => a.inicio.localeCompare(b.inicio));
    }
    return map;
  }, [items]);

  const { celdas, label } = useMemo(() => {
    const first = new Date(cursor.y, cursor.m, 1);
    const startOffset = (first.getDay() + 6) % 7; // lunes = 0
    const diasMes = new Date(cursor.y, cursor.m + 1, 0).getDate();
    const cells: { dia: number | null; key: string }[] = [];
    for (let i = 0; i < startOffset; i++) cells.push({ dia: null, key: `b${i}` });
    for (let d = 1; d <= diasMes; d++) cells.push({ dia: d, key: `${cursor.y}-${cursor.m}-${d}` });
    // Rellenar la última semana con celdas vacías para que la grilla no se estire.
    while (cells.length % 7 !== 0) cells.push({ dia: null, key: `a${cells.length}` });
    const lbl = first.toLocaleDateString('es-UY', { month: 'long', year: 'numeric' });
    return { celdas: cells, label: lbl.charAt(0).toUpperCase() + lbl.slice(1) };
  }, [cursor]);

  const hoy = new Date();
  const esHoy = (dia: number) =>
    hoy.getFullYear() === cursor.y && hoy.getMonth() === cursor.m && hoy.getDate() === dia;
  const mover = (delta: number) =>
    setCursor((c) => {
      const m = c.m + delta;
      return { y: c.y + Math.floor(m / 12), m: ((m % 12) + 12) % 12 };
    });

  return (
    <div className="rounded-2xl border bg-card overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <h3 className="text-sm font-semibold capitalize">{label}</h3>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => mover(-1)} aria-label="Mes anterior">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7"
            onClick={() => { const d = new Date(); setCursor({ y: d.getFullYear(), m: d.getMonth() }); }}
          >
            Hoy
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => mover(1)} aria-label="Mes siguiente">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 text-center text-2xs font-medium text-muted-foreground border-b">
        {DIAS.map((d) => <div key={d} className="py-1.5">{d}</div>)}
      </div>

      <div className="grid grid-cols-7">
        {celdas.map((c) => {
          if (c.dia === null) {
            return <div key={c.key} className="min-h-[88px] border-b border-r bg-muted/20" />;
          }
          const delDia = porDia.get(c.key) ?? [];
          return (
            <div key={c.key} className="min-h-[88px] border-b border-r p-1.5 last:border-r-0">
              <div
                className={`text-xs font-medium mb-1 inline-flex h-5 w-5 items-center justify-center rounded-full ${
                  esHoy(c.dia) ? 'bg-utec-blue text-white' : 'text-muted-foreground'
                }`}
              >
                {c.dia}
              </div>
              <div className="space-y-1">
                {delDia.slice(0, maxPorDia).map((item) => (
                  <button
                    key={`${item.fuente}-${item.id}`}
                    type="button"
                    onClick={() => navigate(item.href)}
                    className={`block w-full truncate rounded px-1.5 py-0.5 text-left text-2xs font-medium ${
                      relleno(estadoDe(ESTADO, item.estado))
                    }`}
                    title={item.titulo}
                  >
                    {item.titulo}
                  </button>
                ))}
                {delDia.length > maxPorDia && (
                  <span className="text-2xs text-muted-foreground">
                    +{delDia.length - maxPorDia} más
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
