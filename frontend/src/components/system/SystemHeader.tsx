import { memo } from 'react';
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/Button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { RefreshCw } from 'lucide-react';
import { StatusBadge } from '@/components/ui/status-badge';

interface SystemHeaderProps {
  hasConnectionError: boolean;
  autoRefresh: boolean;
  setAutoRefresh: (value: boolean) => void;
  isRefreshing: boolean;
  handleRefresh: () => void;
}

export const SystemHeader = memo(function SystemHeader({
  hasConnectionError,
  autoRefresh,
  setAutoRefresh,
  isRefreshing,
  handleRefresh
}: SystemHeaderProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <p className="text-sm text-muted-foreground">Monitoreo en tiempo real del servidor</p>
        {hasConnectionError && (
          <StatusBadge status="error" label="Sin conexión" pulse />
        )}
      </div>

      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 h-9 px-3">
          <Switch
            id="auto-refresh"
            checked={autoRefresh}
            onCheckedChange={setAutoRefresh}
          />
          <Label htmlFor="auto-refresh" className="cursor-pointer text-sm">
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
              className="h-9 w-9"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin-once' : ''}`} key={isRefreshing ? 'spinning' : 'static'} />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Actualizar</TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
});

