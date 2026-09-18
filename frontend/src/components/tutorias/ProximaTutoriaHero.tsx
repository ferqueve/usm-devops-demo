import { useNavigate } from 'react-router-dom';
import { ArrowRight, GraduationCap, MapPin, Video } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/badge';
import { EventoPatternBg } from '@/components/ui/backgrounds/eventPatterns';
import { useCountdown } from '@/lib/agenda/tiempo';
import type { Tutoria } from '@/lib/types/tutorias';

function fmt(iso: string): string {
  return new Date(iso).toLocaleString('es-UY', { weekday: 'long', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

/**
 * Banner contextual "Tu próxima tutoría" con countdown + patrón animado.
 * `modo` 'estudiante' = próxima agendada; 'docente' = próxima franja a dar.
 */
export function ProximaTutoriaHero({ tutorias, modo }: Readonly<{ tutorias: Tutoria[]; modo: 'docente' | 'estudiante' }>) {
  const navigate = useNavigate();
  const now = Date.now();
  const proxima = tutorias
    .filter((t) => t.estado !== 'CANCELADA' && new Date(t.inicio).getTime() >= now)
    .sort((a, b) => a.inicio.localeCompare(b.inicio))[0];
  const cd = useCountdown(proxima?.inicio);

  if (!proxima) return null;

  const esVirtual = proxima.modalidad === 'VIRTUAL';
  const label = modo === 'docente' ? 'TU PRÓXIMA TUTORÍA A DAR' : 'TU PRÓXIMA TUTORÍA';

  return (
    <div className="relative overflow-hidden rounded-2xl bg-chrome text-white p-5 sm:p-6">
      <EventoPatternBg patron={proxima.patron ?? 'plasma'} />
      <div className="absolute inset-0 bg-gradient-to-r from-[#0e1320]/85 via-[#0e1320]/35 to-transparent" />
      <div className="relative flex flex-wrap items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-xs text-white/60 mb-1.5"><GraduationCap className="h-3.5 w-3.5" />{label}</div>
          <h2 className="text-2xl font-bold leading-tight truncate">{proxima.materiaNombre}</h2>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-white/80 mt-1.5">
            <span>{fmt(proxima.inicio)}</span>
            {modo === 'estudiante' && <span>· {proxima.docenteNombre}</span>}
            {esVirtual
              ? <Badge className="bg-utec-cyan/20 text-utec-cyan border-utec-cyan/30 border text-2xs"><Video className="h-3 w-3 mr-1" />Virtual</Badge>
              : proxima.espacioNombre && <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{proxima.espacioNombre}</span>}
            {modo === 'estudiante' && proxima.reservaEstado === 'ESPERA' && (
              <Badge className="bg-utec-yellow text-marca-tinta border-utec-yellow text-2xs">En lista de espera</Badge>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            {([['D', cd.dias], ['H', cd.horas], ['M', cd.minutos], ['S', cd.segundos]] as const).map(([l, v]) => (
              <div key={l} className="text-center rounded-lg bg-[#1b2236] ring-1 ring-white/15 px-2.5 py-1.5 min-w-[48px]">
                <div className="text-xl font-bold tabular-nums leading-none">{String(v).padStart(2, '0')}</div>
                <div className="text-2xs text-white/60">{l}</div>
              </div>
            ))}
          </div>
          <Button variant="secondary" size="sm" onClick={() => navigate(`/tutorias/${proxima.id}`)}>Ver<ArrowRight className="h-4 w-4 ml-1" /></Button>
        </div>
      </div>
    </div>
  );
}
