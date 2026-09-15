import { useTemaGraficos } from './tema';

export interface FilaDivergente {
  nombre: string;
  valor: number;
  detalle?: string;
  /** Texto de la derecha en lugar del número (p. ej. "×1,9" cuando la barra va en escala log). */
  etiqueta?: string;
  /** Un efecto chico que no conviene pintar como ganancia ni como pérdida: va en gris. */
  neutro?: boolean;
}

/**
 * Cambios con signo: las altas crecen hacia la derecha en un color y las
 * bajas hacia la izquierda en otro, desde un cero al medio. Se ve enseguida
 * qué ganó y qué perdió, y cuánto, sin leer una tabla de "+4" y "-4".
 */
export function BarrasDivergentes({ filas, unidad = 'items' }: Readonly<{ filas: FilaDivergente[]; unidad?: string }>) {
  const tema = useTemaGraficos();
  if (filas.length === 0) return null;
  const maximo = Math.max(1e-9, ...filas.map((f) => Math.abs(f.valor)));

  return (
    <ul className="space-y-1.5">
      {filas.map((f) => {
        const ancho = `${(Math.abs(f.valor) / maximo) * 50}%`;
        const positivo = f.valor > 0;
        const color = f.neutro ? tema.vencidas : positivo ? tema.positivo : tema.negativo;
        const texto = f.etiqueta ?? `${positivo ? '+' : ''}${f.valor}`;
        return (
          <li key={f.nombre} className="grid grid-cols-[minmax(0,1fr)_minmax(0,2fr)_56px] items-center gap-3 text-sm">
            <span className="truncate" title={f.detalle ? `${f.nombre} · ${f.detalle}` : f.nombre}>
              {f.nombre}
            </span>
            <div className="relative h-4">
              <div className="absolute inset-y-0 left-1/2 w-px bg-border" />
              <div
                className="absolute inset-y-0.5 rounded-sm"
                style={{
                  width: ancho,
                  left: positivo ? '50%' : undefined,
                  right: positivo ? undefined : '50%',
                  backgroundColor: color,
                }}
                title={`${f.etiqueta ?? `${f.valor > 0 ? '+' : ''}${f.valor} ${unidad}`}${f.detalle ? ` · ${f.detalle}` : ''}`}
              />
            </div>
            <span className="text-right font-semibold tabular-nums" style={{ color }}>
              {texto}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
