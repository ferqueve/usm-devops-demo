import { memo, type ReactNode } from 'react';
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/Button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { RefreshCw } from 'lucide-react';
import { StatusBadge } from '@/components/ui/status-badge';
import { PageHeader, HEADER_ACTION_ICON } from '@/components/layouts/PageHeader';
import { MARCA } from '@/lib/design/paleta';

interface SystemHeaderProps {
  /** Título y bajada de la vista actual; por defecto, los de la pantalla. */
  title?: string;
  description?: string;
  accentColor?: string;
  /** Acciones propias de la vista, antes de las comunes. */
  extraActions?: ReactNode;
  hasConnectionError: boolean;
  autoRefresh: boolean;
  setAutoRefresh: (value: boolean) => void;
  isRefreshing: boolean;
  handleRefresh: () => void;
}

export const SystemHeader = memo(function SystemHeader({
  title = 'Sistema',
  description = 'Monitoreo en tiempo real del servidor.',
  accentColor = MARCA.cian,
  extraActions,
  hasConnectionError,
  autoRefresh,
  setAutoRefresh,
  isRefreshing,
  handleRefresh
}: SystemHeaderProps) {
  return (
    <PageHeader
      title={title}
      description={description}
      accentColor={accentColor}
      actions={
        <>
          {extraActions}

          {hasConnectionError && (
            <div className="mr-2">
              <StatusBadge status="error" label="Sin conexión" pulse />
            </div>
          )}

          <div className="mr-1 flex items-center gap-2">
            <Switch
              id="auto-refresh"
              checked={autoRefresh}
              onCheckedChange={setAutoRefresh}
            />
            <Label htmlFor="auto-refresh" className="cursor-pointer text-xs text-white/70">
              Auto-refresh
            </Label>
          </div>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={isRefreshing ? undefined : handleRefresh}
                disabled={isRefreshing}
                aria-label="Actualizar"
                className={HEADER_ACTION_ICON}
              >
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin-once' : ''}`} key={isRefreshing ? 'spinning' : 'static'} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Actualizar</TooltipContent>
          </Tooltip>
        </>
      }
    />
  );
});

