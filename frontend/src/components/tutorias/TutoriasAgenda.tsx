import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarClock, ChevronRight, MapPin, Users, Video } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { Tutoria } from '@/lib/types/tutorias';

const ESTADO_COLOR: Record<string, string> = {
  ABIERTA: 'border-l-utec-green',
  CERRADA: 'border-l-utec-dark',
  CANCELADA: 'border-l-utec-red',
};

/** Agenda de los próximos 7 días, agrupada por día. */
export function TutoriasAgenda({ tutorias }: Readonly<{ tutorias: Tutoria[] }>) {
  const navigate = useNavigate();

  const dias = useMemo(() => {
    const now = new Date();
    const hoy0 = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const limite = new Date(hoy0.getTime() + 7 * 86400000);
    const futuras = tutorias
      .filter((t) => { const d = new Date(t.inicio); return d >= now && d < limite; })
      .sort((a, b) => a.inicio.localeCompare(b.inicio));
    const map = new Map<string, { fecha: Date; items: Tutoria[] }>();
    for (const t of futuras) {
      const d = new Date(t.inicio);
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      if (!map.has(key)) map.set(key, { fecha: new Date(d.getFullYear(), d.getMonth(), d.getDate()), items: [] });
      map.get(key)!.items.push(t);
    }
    return [...map.values()];
  }, [tutorias]);

  if (dias.length === 0) {
    return <div className="rounded-2xl border bg-card p-8 text-center text-sm text-muted-foreground">No hay tutorías en los próximos 7 días.</div>;
  }

  const hora = (iso: string) => new Date(iso).toLocaleTimeString('es-UY', { hour: '2-digit', minute: '2-digit' });
  const fechaLbl = (d: Date) => d.toLocaleDateString('es-UY', { weekday: 'long', day: '2-digit', month: 'long' });

  return (
    <div className="space-y-4">
      {dias.map(({ fecha, items }) => (
        <div key={fecha.toISOString()} className="rounded-2xl border bg-card overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-2.5 border-b bg-muted/30">
            <CalendarClock className="h-4 w-4 text-marca-azul-texto" />
            <span className="text-sm font-semibold capitalize">{fechaLbl(fecha)}</span>
            <span className="ml-auto text-xs text-muted-foreground">{items.length} {items.length === 1 ? 'tutoría' : 'tutorías'}</span>
          </div>
          <ul className="divide-y">
            {items.map((t) => (
              <li key={t.id}>
                <button type="button" onClick={() => navigate(`/tutorias/${t.id}`)} className={`flex w-full items-center gap-3 px-4 py-3 text-left border-l-4 ${ESTADO_COLOR[t.estado] ?? 'border-l-muted'} hover:bg-muted/40`}>
                  <span className="w-24 shrink-0 text-sm font-semibold tabular-nums">{hora(t.inicio)}–{hora(t.fin)}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{t.materiaNombre}</span>
                    <span className="block truncate text-xs text-muted-foreground">{t.docenteNombre}</span>
                  </span>
                  <span className="flex items-center gap-2 shrink-0">
                    {t.modalidad === 'VIRTUAL'
                      ? <Badge className="bg-utec-cyan/15 text-marca-cian-texto border-utec-cyan/30 border text-2xs gap-1"><Video className="h-3 w-3" />Virtual</Badge>
                      : t.espacioNombre && <span className="hidden sm:flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="h-3 w-3" />{t.espacioNombre}</span>}
                    <span className="hidden sm:flex items-center gap-1 text-xs text-muted-foreground"><Users className="h-3 w-3" />{Math.max(0, t.cupo - t.plazasDisponibles)}/{t.cupo}</span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
