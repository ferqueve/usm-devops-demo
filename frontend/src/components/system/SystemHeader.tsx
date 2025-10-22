import { memo } from 'react';
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { RefreshCw, Play, Pause } from 'lucide-react';
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
    <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4">
      <div className="space-y-1 w-full xl:w-auto">
        <div className="flex items-center gap-3 flex-wrap">
          <h2 className="text-3xl font-bold tracking-tight">Estado del Sistema</h2>
          {hasConnectionError && (
            <StatusBadge status="error" label="Sin conexión" pulse />
          )}
        </div>
        <p className="text-muted-foreground">
          Monitoreo en tiempo real del servidor
        </p>
      </div>
      
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full xl:w-auto flex-shrink-0">
        <div className="flex items-center gap-2 px-3 border rounded-lg shadow-sm bg-white h-10 justify-center flex-shrink min-w-0">
          <Switch
            id="auto-refresh"
            checked={autoRefresh}
            onCheckedChange={setAutoRefresh}
            className="flex-shrink-0"
          />
          <Label htmlFor="auto-refresh" className="cursor-pointer flex items-center gap-1.5 flex-shrink min-w-0">
            {autoRefresh ? (
              <>
                <Play className="h-4 w-4 text-utec-green flex-shrink-0" />
                <span className="font-medium text-sm truncate">Auto-refresh</span>
              </>
            ) : (
              <>
                <Pause className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <span className="font-medium text-sm text-muted-foreground truncate">Auto-refresh</span>
              </>
            )}
          </Label>
        </div>
        
        <div 
          onClick={!isRefreshing ? handleRefresh : undefined}
          className={`flex items-center justify-center gap-1.5 px-4 border rounded-lg shadow-sm bg-white h-10 transition-all flex-shrink-0 ${isRefreshing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-gray-50'}`}
        >
          <RefreshCw className={`h-4 w-4 flex-shrink-0 ${isRefreshing ? 'animate-spin-once' : ''}`} key={isRefreshing ? 'spinning' : 'static'} />
          <span className="font-medium text-sm">Actualizar</span>
        </div>
      </div>
    </div>
  );
});

