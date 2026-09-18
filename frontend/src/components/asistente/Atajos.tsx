import type { UtecBg } from '@/components/dashboard/views/_components/StatStrip';
import { useAuth } from '@/hooks/useAuth';
import { sugerenciasPara } from './sugerencias';

/** Mismos fondos y contraste que la tira de tarjetas del dashboard. */
const FONDOS: Record<UtecBg, string> = {
  blue: 'bg-utec-blue text-white hover:brightness-110',
  yellow: 'bg-utec-yellow text-utec-dark hover:brightness-95',
  green: 'bg-utec-green text-white hover:brightness-110',
  orange: 'bg-utec-orange text-white hover:brightness-110',
  red: 'bg-utec-red text-white hover:brightness-110',
  cyan: 'bg-utec-cyan text-utec-dark hover:brightness-95',
  dark: 'bg-chrome text-white hover:bg-utec-dark-lighter',
};

/** Consultas de un clic para arrancar la conversación. */
export function Atajos({ onPreguntar, disabled }: Readonly<{ onPreguntar: (p: string) => void; disabled?: boolean }>) {
  const { user } = useAuth();
  const sugerencias = sugerenciasPara(user?.rol);

  return (
    <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {sugerencias.map((s) => (
        <button
          key={s.titulo}
          type="button"
          onClick={() => onPreguntar(s.prompt)}
          disabled={disabled}
          className={`min-w-0 rounded-xl p-4 text-left transition-all disabled:cursor-wait disabled:opacity-70 ${FONDOS[s.bg]}`}
        >
          <div className="mb-1 flex items-center gap-1.5 text-xs opacity-75">
            <s.icon className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{s.titulo}</span>
          </div>
          <div className="line-clamp-2 text-sm font-semibold leading-snug">{s.prompt}</div>
        </button>
      ))}
    </div>
  );
}
