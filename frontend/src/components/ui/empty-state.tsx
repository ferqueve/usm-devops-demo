import { type LucideIcon } from 'lucide-react';

import { cn } from '@/lib/utils/helpers';
import { Button } from './Button';

/**
 * El hueco cuando no hay nada que mostrar.
 *
 * Había dos: éste y uno de diez líneas en `dashboard/views/_components`, que
 * pese a vivir en una carpeta privada lo importaban también `asistente/` y
 * `sostenibilidad/`. No eran lo mismo con dos nombres: uno llena una pantalla
 * y el otro es un renglón dentro de un widget de 200 px de alto. Esa
 * diferencia es real, así que quedó como variante y no como componente
 * aparte: el hueco se dibuja en un solo lugar.
 */

interface EmptyStateProps {
  title: string;

  /**
   * `bloque` llena el espacio de una pantalla o una tarjeta grande.
   * `linea` es un renglón: cabe dentro de un widget sin empujar nada.
   *
   * Va en `text-sm`, el cuerpo de la interfaz. Las tres copias que había
   * usaban 13 y 14 px; que el hueco se lea más chico que el dato que
   * reemplaza no tiene ningún motivo.
   */
  variant?: 'bloque' | 'linea';

  /** Sólo en `bloque`. En un renglón no entra. */
  icon?: LucideIcon;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function EmptyState({
  title,
  variant = 'bloque',
  icon: Icon,
  description,
  action,
  className,
}: Readonly<EmptyStateProps>) {
  if (variant === 'linea') {
    return <p className={cn('py-8 text-center text-sm text-muted-foreground', className)}>{title}</p>;
  }

  return (
    <div className={cn('flex flex-col items-center justify-center px-4 py-12 text-center', className)}>
      {Icon && (
        <div className="mb-4 rounded-full bg-muted p-4">
          <Icon className="size-12 text-muted-foreground" />
        </div>
      )}
      <h3 className="mb-2 text-lg font-semibold">{title}</h3>
      {description && <p className="mb-6 max-w-md text-sm text-muted-foreground">{description}</p>}
      {action && (
        <Button onClick={action.onClick} variant="outline">
          {action.label}
        </Button>
      )}
    </div>
  );
}
