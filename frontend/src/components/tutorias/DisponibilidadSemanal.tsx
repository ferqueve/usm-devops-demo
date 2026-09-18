import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarRange, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils/helpers';
import type { Tutoria } from '@/lib/types/tutorias';

const DIAS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

// Paleta cálida-fría para diferenciar materias (tinte suave + texto legible en claro/oscuro).
const MATERIA_COLORES = [
  'bg-utec-blue/15 text-marca-azul-texto',
  'bg-utec-cyan/15 text-marca-cian-texto',
  'bg-utec-red/15 text-marca-rojo-texto',
  'bg-utec-orange/15 text-marca-naranja-texto',
  'bg-utec-green/15 text-marca-verde-texto',
  'bg-utec-yellow/20 text-marca-amarillo-texto',
];

function colorDeMateria(nombre: string): string {
  let h = 0;
  for (let i = 0; i < nombre.length; i++) h = (h * 31 + nombre.charCodeAt(i)) >>> 0;
  return MATERIA_COLORES[h % MATERIA_COLORES.length];
}

function lunesDe(base: Date): Date {
  const d = new Date(base.getFullYear(), base.getMonth(), base.getDate());
  const offset = (d.getDay() + 6) % 7; // 0 = lunes
  d.setDate(d.getDate() - offset);
  return d;
}

const hora = (iso: string) => new Date(iso).toLocaleTimeString('es-UY', { hour: '2-digit', minute: '2-digit' });

/**
 * Grilla de disponibilidad semanal (lun→dom). Cada día muestra sus tutorías como
 * chips (hora + materia, color por materia), con marcador de "hoy" y navegación por semana.
 * Reemplaza al heatmap día×hora prestado de eventos.
 */
export function DisponibilidadSemanal({ tutorias }: Readonly<{ tutorias: Tutoria[] }>) {
  const navigate = useNavigate();
  const [semanaOffset, setSemanaOffset] = useState(0);

  const { dias, rangoLabel } = useMemo(() => {
    const hoy = new Date();
    const inicioSemana = lunesDe(hoy);
    inicioSemana.setDate(inicioSemana.getDate() + semanaOffset * 7);

    const cols = DIAS.map((label, i) => {
      const fecha = new Date(inicioSemana);
      fecha.setDate(inicioSemana.getDate() + i);
      return { label, fecha, items: [] as Tutoria[] };
    });

    for (const t of tutorias) {
      const d = new Date(t.inicio);
      if (Number.isNaN(d.getTime())) continue;
      const diff = Math.floor((new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime() - inicioSemana.getTime()) / 86400000);
      if (diff >= 0 && diff < 7) cols[diff].items.push(t);
    }
    cols.forEach((c) => c.items.sort((a, b) => a.inicio.localeCompare(b.inicio)));

    const fin = new Date(inicioSemana);
    fin.setDate(inicioSemana.getDate() + 6);
    const fmt = (d: Date) => d.toLocaleDateString('es-UY', { day: '2-digit', month: 'short' });
    return { dias: cols, rangoLabel: `${fmt(inicioSemana)} – ${fmt(fin)}` };
  }, [tutorias, semanaOffset]);

  const hoyKey = new Date().toDateString();
  const totalSemana = dias.reduce((a, d) => a + d.items.length, 0);

  return (
    <div className="rounded-2xl border bg-card overflow-hidden">
      <div className="flex items-center gap-2.5 px-4 py-3 border-b">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-utec-blue/10 text-marca-azul-texto"><CalendarRange className="h-4 w-4" /></span>
        <h3 className="text-sm font-semibold">Disponibilidad de la semana</h3>
        <span className="ml-2 text-xs text-muted-foreground capitalize">{rangoLabel}</span>
        <div className="ml-auto flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setSemanaOffset((o) => o - 1)} title="Semana anterior"><ChevronLeft className="h-4 w-4" /></Button>
          <Button variant="ghost" size="sm" className="h-7" onClick={() => setSemanaOffset(0)} disabled={semanaOffset === 0}>Hoy</Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setSemanaOffset((o) => o + 1)} title="Semana siguiente"><ChevronRight className="h-4 w-4" /></Button>
        </div>
      </div>

      {totalSemana === 0 ? (
        <div className="px-4 py-10 text-center text-sm text-muted-foreground">No hay tutorías en esta semana.</div>
      ) : (
        <div className="grid grid-cols-2 gap-px bg-border sm:grid-cols-4 lg:grid-cols-7">
          {dias.map((d) => {
            const esHoy = d.fecha.toDateString() === hoyKey;
            return (
              <div key={d.label} className="flex min-h-[120px] flex-col bg-card p-2">
                <div className="mb-1.5 flex items-center gap-1.5">
                  <span className={cn('text-2xs font-semibold uppercase', esHoy ? 'text-marca-azul-texto' : 'text-muted-foreground')}>{d.label}</span>
                  <span className={cn('flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-2xs font-medium tabular-nums', esHoy ? 'bg-utec-blue text-white' : 'text-muted-foreground')}>{d.fecha.getDate()}</span>
                </div>
                <div className="flex flex-1 flex-col gap-1">
                  {d.items.length === 0 ? (
                    <span className="text-2xs text-muted-foreground/50">—</span>
                  ) : (
                    d.items.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => navigate(`/tutorias/${t.id}`)}
                        title={`${hora(t.inicio)} · ${t.materiaNombre} · ${t.docenteNombre}`}
                        className={cn(
                          'flex items-center gap-1 rounded-md px-1.5 py-1 text-left text-2xs font-medium transition-transform hover:scale-[1.02]',
                          colorDeMateria(t.materiaNombre),
                          t.estado === 'CANCELADA' && 'line-through opacity-60',
                        )}
                      >
                        {t.enVivo && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-utec-red" />}
                        <span className="shrink-0 tabular-nums opacity-80">{hora(t.inicio)}</span>
                        <span className="truncate">{t.materiaNombre}</span>
                      </button>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
