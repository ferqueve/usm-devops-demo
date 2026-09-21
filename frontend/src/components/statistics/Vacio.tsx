import { EmptyState } from '@/components/ui/empty-state';

/**
 * El hueco dentro de un panel de estadísticas.
 *
 * No dibuja nada propio: es `EmptyState variant="linea"` con el texto que
 * corresponde acá. Vale la pena como preajuste porque son 37 llamadas y en
 * casi todas el texto por defecto es el correcto.
 */
export function Vacio({ texto = 'Sin datos en el período.' }: Readonly<{ texto?: string }>) {
  return <EmptyState variant="linea" title={texto} />;
}
