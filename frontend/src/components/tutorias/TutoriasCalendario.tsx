import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import type { Tutoria } from '@/lib/types/tutorias';

const DIAS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const ESTADO_COLOR: Record<string, string> = {
  ABIERTA: 'bg-utec-green text-white',
  CERRADA: 'bg-utec-dark text-white',
  CANCELADA: 'bg-utec-red text-white',
};

export function TutoriasCalendario({ tutorias }: Readonly<{ tutorias: Tutoria[] }>) {
  const navigate = useNavigate();
  const [cursor, setCursor] = useState(() => { const d = new Date(); return { y: d.getFullYear(), m: d.getMonth() }; });

  const porDia = useMemo(() => {
    const map = new Map<string, Tutoria[]>();
    for (const t of tutorias) {
      const d = new Date(t.inicio);
      if (Number.isNaN(d.getTime())) continue;
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(t);
    }
    return map;
  }, [tutorias]);

  const { celdas, label } = useMemo(() => {
    const first = new Date(cursor.y, cursor.m, 1);
    const startOffset = (first.getDay() + 6) % 7;
    const diasMes = new Date(cursor.y, cursor.m + 1, 0).getDate();
    const cells: { dia: number | null; key: string }[] = [];
    for (let i = 0; i < startOffset; i++) cells.push({ dia: null, key: `b${i}` });
    for (let d = 1; d <= diasMes; d++) cells.push({ dia: d, key: `${cursor.y}-${cursor.m}-${d}` });
    const lbl = first.toLocaleDateString('es-UY', { month: 'long', year: 'numeric' });
    return { celdas: cells, label: lbl.charAt(0).toUpperCase() + lbl.slice(1) };
  }, [cursor]);

  const hoy = new Date();
  const esHoy = (dia: number) => hoy.getFullYear() === cursor.y && hoy.getMonth() === cursor.m && hoy.getDate() === dia;
  const mover = (delta: number) => setCursor((c) => { const m = c.m + delta; return { y: c.y + Math.floor(m / 12), m: ((m % 12) + 12) % 12 }; });

  return (
    <div className="rounded-2xl border bg-card overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <h3 className="text-sm font-semibold capitalize">{label}</h3>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => mover(-1)}><ChevronLeft className="h-4 w-4" /></Button>
          <Button variant="ghost" size="sm" className="h-7" onClick={() => { const d = new Date(); setCursor({ y: d.getFullYear(), m: d.getMonth() }); }}>Hoy</Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => mover(1)}><ChevronRight className="h-4 w-4" /></Button>
        </div>
      </div>
      <div className="grid grid-cols-7 text-center text-[11px] font-medium text-muted-foreground border-b">
        {DIAS.map((d) => <div key={d} className="py-1.5">{d}</div>)}
      </div>
      <div className="grid grid-cols-7">
        {celdas.map((c) => {
          if (c.dia === null) return <div key={c.key} className="min-h-[88px] border-b border-r bg-muted/20" />;
          const ts = porDia.get(c.key) ?? [];
          return (
            <div key={c.key} className="min-h-[88px] border-b border-r p-1.5 last:border-r-0">
              <div className={`text-xs font-medium mb-1 inline-flex h-5 w-5 items-center justify-center rounded-full ${esHoy(c.dia) ? 'bg-utec-blue text-white' : 'text-muted-foreground'}`}>{c.dia}</div>
              <div className="space-y-1">
                {ts.slice(0, 3).map((t) => (
                  <button key={t.id} type="button" onClick={() => navigate(`/tutorias/${t.id}`)} className={`block w-full truncate rounded px-1.5 py-0.5 text-left text-[10px] font-medium ${ESTADO_COLOR[t.estado] ?? 'bg-muted'}`} title={t.materiaNombre}>
                    {t.materiaNombre}
                  </button>
                ))}
                {ts.length > 3 && <span className="text-[10px] text-muted-foreground">+{ts.length - 3} más</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
