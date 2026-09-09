import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { EventoPatternBg } from '@/components/ui/backgrounds/eventPatterns';
import { useCountdown } from '@/lib/agenda/tiempo';

interface HeroProps {
  /** Etiqueta chica de arriba: "TU PRÓXIMA TUTORÍA", "LA COLA DE HOY". */
  etiqueta: string;
  titulo: string;
  /** Línea de contexto: docente, aula, motivo. */
  detalle?: string;
  icono: LucideIcon;
  /** Uno de los patrones del catálogo de eventos. */
  patron?: string;
  accion?: { label: string; to: string };
  /** Con fecha se muestra cuenta regresiva; sin ella, el número grande. */
  cuandoISO?: string;
  foco?: { valor: string | number; leyenda: string };
}

function Casilla({ valor, letra }: Readonly<{ valor: number; letra: string }>) {
  return (
    <div className="min-w-[46px] rounded-lg bg-white/10 px-2.5 py-1.5 text-center ring-1 ring-white/15">
      <div className="text-lg font-bold leading-none tabular-nums">{String(valor).padStart(2, '0')}</div>
      <div className="text-[10px] text-white/60">{letra}</div>
    </div>
  );
}

/**
 * La franja destacada del dashboard: lo único que el rol tiene que mirar si
 * mira una sola cosa.
 *
 * Reusa los patrones animados del catálogo de eventos, que ya se usan en los
 * banners de /eventos y /tutorias, para que la pantalla de inicio no sea una
 * sucesión de recuadros blancos.
 */
export function Hero({
  etiqueta,
  titulo,
  detalle,
  icono: Icono,
  patron,
  accion,
  cuandoISO,
  foco,
}: Readonly<HeroProps>) {
  const cd = useCountdown(cuandoISO);

  return (
    <div className="relative shrink-0 overflow-hidden rounded-2xl bg-utec-dark px-5 py-4 text-white">
      <EventoPatternBg patron={patron} />
      {/* Velo hacia la izquierda: el título se lee sin apagar el patrón. */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#0e1320]/85 via-[#0e1320]/25 to-transparent" />

      <div className="relative flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
        <div className="min-w-0">
          <div className="mb-1 flex items-center gap-1.5 text-[11px] font-medium tracking-wider text-white/60">
            <Icono className="h-3.5 w-3.5" />
            {etiqueta}
          </div>
          <h2 className="truncate text-xl font-bold leading-tight sm:text-2xl">{titulo}</h2>
          {detalle && <p className="mt-1 truncate text-sm text-white/70">{detalle}</p>}
        </div>

        <div className="flex shrink-0 items-center gap-3">
          {cuandoISO && !cd.pasado && (
            <div className="flex items-center gap-1.5">
              <Casilla valor={cd.dias} letra="D" />
              <Casilla valor={cd.horas} letra="H" />
              <Casilla valor={cd.minutos} letra="M" />
              <Casilla valor={cd.segundos} letra="S" />
            </div>
          )}
          {foco && (
            <div className="text-right">
              <div className="text-3xl font-bold leading-none tabular-nums">{foco.valor}</div>
              <div className="text-[11px] text-white/60">{foco.leyenda}</div>
            </div>
          )}
          {accion && (
            <Link
              to={accion.to}
              className="inline-flex items-center gap-1 rounded-lg bg-white/15 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-white/25"
            >
              {accion.label}
              <ArrowRight className="h-4 w-4" />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
