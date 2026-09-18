import { cn } from '@/lib/utils/helpers';
import { Badge } from './badge';
import { CheckCircle2, XCircle, AlertCircle, Clock, Minus } from 'lucide-react';

type StatusType = 'success' | 'error' | 'warning' | 'info' | 'neutral';

interface StatusBadgeProps {
  status: StatusType;
  label: string;
  icon?: boolean;
  pulse?: boolean;
  className?: string;
}

/**
 * StatusBadge component con iconos y estilos visuales mejorados
 */
export function StatusBadge({ status, label, icon = true, pulse = false, className }: Readonly<StatusBadgeProps>) {
  const statusConfig = {
    // Tinta oscura y no blanca: blanco sobre el verde de marca da 2,28:1 y no
    // llega ni a 3:1. Medido sobre el hex exacto del manual, igual que en la
    // tira de métricas del dashboard.
    success: {
      variant: 'default' as const,
      className: 'bg-utec-green hover:bg-utec-green/90 text-[color:var(--success-foreground)]',
      icon: CheckCircle2,
    },
    error: {
      variant: 'destructive' as const,
      className: 'bg-utec-red hover:bg-utec-red/90 text-white',
      icon: XCircle,
    },
    warning: {
      variant: 'default' as const,
      className: 'bg-utec-yellow hover:bg-utec-yellow/90 text-foreground',
      icon: AlertCircle,
    },
    info: {
      variant: 'default' as const,
      className: 'bg-utec-blue hover:bg-utec-blue/90 text-white',
      icon: Clock,
    },
    // Con className vacío quedaba a merced del fondo de `secondary`, que era
    // el mismo valor que el de la página: la pastilla desaparecía y "Vencida"
    // se leía como texto suelto al lado de cuatro pastillas.
    neutral: {
      variant: 'secondary' as const,
      className: 'bg-secondary text-secondary-foreground border border-border',
      icon: Minus,
    },
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <Badge
      variant={config.variant}
      className={cn(
        'flex items-center gap-1.5 font-medium transition-all',
        config.className,
        pulse && 'badge-pulse',
        className
      )}
    >
      {icon && <Icon className="h-3.5 w-3.5" />}
      <span>{label}</span>
    </Badge>
  );
}

