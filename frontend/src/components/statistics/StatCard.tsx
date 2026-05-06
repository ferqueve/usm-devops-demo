import type { LucideIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface StatCardProps {
  title: string;
  value: string | number;
  /** Texto secundario debajo del valor (ej: porcentaje, totales relacionados) */
  subtitle?: React.ReactNode;
  icon: LucideIcon;
  /** Clase de tailwind para colorear el valor principal y el icono */
  accentClass?: string;
  /** Cuando true se aplica el color de acento al icono pero el valor queda en negro. */
  iconOnly?: boolean;
}

/**
 * Tarjeta estándar de estadística con título, valor grande y un texto auxiliar.
 * Reemplaza el patrón repetido en `InventoryStats` y otros paneles de métricas
 * que repetían `Card > CardHeader > CardTitle + Icon` y `CardContent` con un
 * número grande y un sub-texto.
 */
export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  accentClass,
  iconOnly = false,
}: StatCardProps) {
  const valueClass = iconOnly ? 'text-2xl font-bold' : `text-2xl font-bold ${accentClass ?? ''}`;
  const iconClass = `h-4 w-4 ${accentClass ?? 'text-muted-foreground'}`;
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className={iconClass} />
      </CardHeader>
      <CardContent>
        <div className={valueClass}>{value}</div>
        {subtitle !== undefined && (
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        )}
      </CardContent>
    </Card>
  );
}

export default StatCard;
