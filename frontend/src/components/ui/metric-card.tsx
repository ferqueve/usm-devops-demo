import { memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './card';
import { cn } from '@/lib/utils/helpers';
import { type LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  icon?: LucideIcon;
  description?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  progress?: number;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
  className?: string;
  children?: React.ReactNode;
}

export const MetricCard = memo(function MetricCard({
  title,
  value,
  icon: Icon,
  description,
  trend,
  progress,
  variant = 'default',
  className,
  children,
}: MetricCardProps) {
  const variantStyles = {
    default: 'bg-gradient-to-br from-gray-50 to-white border-gray-200',
    success: 'bg-gradient-to-br from-green-50 to-white border-green-200',
    warning: 'bg-gradient-to-br from-yellow-50 to-white border-yellow-200',
    error: 'bg-gradient-to-br from-red-50 to-white border-red-200',
    info: 'bg-gradient-to-br from-blue-50 to-white border-blue-200',
  };

  const iconColors = {
    default: 'text-gray-500',
    success: 'text-utec-green',
    warning: 'text-utec-yellow',
    error: 'text-utec-red',
    info: 'text-utec-blue',
  };

  return (
    <Card className={cn('hover-lift shadow-card overflow-hidden', variantStyles[variant], className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        {Icon && (
          <div className={cn('p-2 rounded-lg bg-white/80 shadow-sm', iconColors[variant])}>
            <Icon className="h-5 w-5" />
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-baseline gap-2">
            <div className="text-3xl font-bold tracking-tight">{value}</div>
            {trend && (
              <span
                className={cn(
                  'text-sm font-medium flex items-center gap-0.5',
                  trend.isPositive ? 'text-utec-green' : 'text-utec-red'
                )}
              >
                {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
              </span>
            )}
          </div>
          
          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
          
          {progress !== undefined && (
            <div className="space-y-1">
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={cn(
                    'h-full transition-all duration-300 rounded-full',
                    variant === 'success' && 'bg-utec-green',
                    variant === 'warning' && 'bg-utec-yellow',
                    variant === 'error' && 'bg-utec-red',
                    variant === 'info' && 'bg-utec-blue',
                    variant === 'default' && 'bg-gray-500'
                  )}
                  style={{ width: `${Math.min(progress, 100)}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground text-right">{progress.toFixed(1)}%</p>
            </div>
          )}
          
          {children}
        </div>
      </CardContent>
    </Card>
  );
});

