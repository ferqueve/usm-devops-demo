import type { Comparacion } from '@/lib/api/stats';

const OPCIONES: Array<{ id: Comparacion; texto: string }> = [
  { id: 'anterior', texto: 'Período anterior' },
  { id: 'anio', texto: 'Año pasado' },
];

/**
 * Contra qué se comparan los cambios del resumen y las novedades. Va sobre la
 * tarjeta de color de la sección, con el mismo estilo que el selector de
 * período del encabezado.
 */
export function CompararContra({ valor, onCambiar }: Readonly<{ valor: Comparacion; onCambiar: (c: Comparacion) => void }>) {
  return (
    <div className="flex items-center gap-2">
      <span className="hidden text-[10px] uppercase tracking-wide opacity-75 sm:inline">Comparar con</span>
      <div className="flex items-center rounded-lg bg-black/15 p-0.5 ring-1 ring-black/5" role="radiogroup" aria-label="Comparar con">
        {OPCIONES.map((o) => {
          const activo = o.id === valor;
          return (
            <button
              key={o.id}
              type="button"
              role="radio"
              aria-checked={activo}
              onClick={() => onCambiar(o.id)}
              className={`h-7 whitespace-nowrap rounded-md px-2.5 text-xs font-medium transition-colors ${
                activo ? 'bg-card text-chrome shadow-sm' : 'text-current opacity-80 hover:bg-white/15 hover:opacity-100'
              }`}
            >
              {o.texto}
            </button>
          );
        })}
      </div>
    </div>
  );
}

