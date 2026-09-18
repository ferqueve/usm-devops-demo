import { useNavigate } from 'react-router-dom';
import { CalendarClock, MapPin, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/badge';
import { EventoPatternBg } from '@/components/ui/backgrounds/eventPatterns';
import type { Evento } from '@/lib/types/eventos';
import { useCountdown } from '@/lib/agenda/tiempo';

interface ProximoEventoHeroProps {
  eventos: Evento[];
}

function fmt(iso: string): string {
  return new Date(iso).toLocaleString('es-UY', { weekday: 'long', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export function ProximoEventoHero({ eventos }: Readonly<ProximoEventoHeroProps>) {
  const navigate = useNavigate();
  const now = Date.now();
  const proximo = eventos
    .filter((e) => e.estado === 'PUBLICADO' && new Date(e.inicio).getTime() >= now)
    .sort((a, b) => a.inicio.localeCompare(b.inicio))[0];
  const cd = useCountdown(proximo?.inicio);

  if (!proximo) return null;

  return (
    <div className="relative overflow-hidden rounded-2xl bg-chrome text-white p-5 sm:p-6">
      {/* Patrón del próximo evento (catálogo); por defecto las formas UTEC del login */}
      <EventoPatternBg patron={proximo.patron} />
      {/* Velo suave solo a la izquierda para legibilidad del título (no apaga los colores) */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#0e1320]/85 via-[#0e1320]/20 to-transparent" />
      <div className="relative flex flex-wrap items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-xs text-white/60 mb-1.5"><CalendarClock className="h-3.5 w-3.5" />PRÓXIMO EVENTO</div>
          <h2 className="text-2xl font-bold leading-tight truncate">{proximo.titulo}</h2>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-white/80 mt-1.5">
            <Badge className="bg-white/15 text-white border-white/20 border text-2xs">{proximo.tipo}</Badge>
            <span>{fmt(proximo.inicio)}</span>
            {proximo.espacioNombre && <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{proximo.espacioNombre}</span>}
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
          <Button variant="secondary" size="sm" onClick={() => navigate(`/eventos/${proximo.id}`)}>Ver<ArrowRight className="h-4 w-4 ml-1" /></Button>
        </div>
      </div>
    </div>
  );
}
