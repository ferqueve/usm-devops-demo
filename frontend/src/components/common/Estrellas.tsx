import { Star } from 'lucide-react';

/**
 * Una valoración de 1 a 5, en estrellas.
 *
 * Había tres formas de dibujarlo: `Stars` —dos copias idénticas, en los
 * paneles de valoración de evento y de tutoría—, `Estrellas` en Visuales y
 * otra `Estrellas` en TutoriaCard. Las dos primeras redondeaban, así que un
 * 4,6 se veía igual que un 5.
 *
 * Queda la que rellena en proporción: dos capas de estrellas, la de arriba
 * recortada al porcentaje. Un 4,6 se ve como 4,6.
 */

interface Props {
  /** De 0 a 5. Con `null` se muestra el texto de «sin datos». */
  valor: number | null | undefined;
  /** Cuántas valoraciones hay. Si se pasa, va entre paréntesis. */
  total?: number;
  tamano?: 'chico' | 'normal' | 'grande';
  /** Qué decir cuando no hay ninguna. */
  sinDatos?: string;
  /** El número al lado de las estrellas. */
  conNumero?: boolean;
}

const TAMANO = { chico: 'size-3', normal: 'size-3.5', grande: 'size-5' } as const;
const TEXTO = { chico: 'text-2xs', normal: 'text-xs', grande: 'text-sm' } as const;

export function Estrellas({
  valor,
  total,
  tamano = 'normal',
  sinDatos = 'sin calificar',
  conNumero = true,
}: Readonly<Props>) {
  if (valor == null || total === 0) {
    return <span className={`${TEXTO[tamano]} text-muted-foreground`}>{sinDatos}</span>;
  }

  const tam = TAMANO[tamano];
  const acotado = Math.max(0, Math.min(5, valor));
  const estrellas = [0, 1, 2, 3, 4];

  return (
    <span className="inline-flex items-center gap-1" title={`${acotado.toFixed(1)} de 5`}>
      <span className="relative inline-flex">
        <span className="flex text-muted-foreground/30">
          {estrellas.map((i) => (
            <Star key={i} className={`${tam} fill-current`} />
          ))}
        </span>
        {/* La capa de arriba se recorta al porcentaje: así un 4,6 se ve 4,6
            y no 5. */}
        <span
          className="absolute inset-0 flex overflow-hidden text-marca-amarillo-texto"
          style={{ width: `${(acotado / 5) * 100}%` }}
        >
          {estrellas.map((i) => (
            <Star key={i} className={`${tam} shrink-0 fill-current`} />
          ))}
        </span>
      </span>
      {conNumero && (
        <b className={`tabular-nums ${TEXTO[tamano]}`}>{acotado.toFixed(1)}</b>
      )}
      {total != null && (
        <span className={`${TEXTO[tamano]} text-muted-foreground`}>({total})</span>
      )}
    </span>
  );
}
