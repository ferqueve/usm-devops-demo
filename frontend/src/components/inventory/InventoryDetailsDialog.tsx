import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { CheckCircle, Wrench, AlertCircle } from "lucide-react";
import type { InventarioItem } from '@/lib/types/spaces';
import { formatDate, formatRelativeTime } from '@/lib/utils/date-helpers';

interface InventoryDetailsDialogProps {
  item: InventarioItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function InventoryDetailsDialog({ item, open, onOpenChange }: InventoryDetailsDialogProps) {
  if (!item) return null;

  const getEstadoBadge = (estado: string) => {
    const configs: Record<string, { label: string; color: string; icon: React.ComponentType<{ className?: string }> }> = {
      'DISPONIBLE': { label: 'Disponible', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle },
      'MANTENIMIENTO': { label: 'Mantenimiento', color: 'bg-amber-50 text-amber-700 border-amber-200', icon: Wrench },
      'DANADO': { label: 'Dañado', color: 'bg-red-50 text-red-700 border-red-200', icon: AlertCircle }
    };
    
    const config = configs[estado] || { label: estado, color: 'bg-gray-50 text-gray-700 border-gray-200', icon: AlertCircle };
    const Icon = config.icon;
    
    return (
      <Badge className={`${config.color} border font-medium`}>
        <Icon className="h-3.5 w-3.5 mr-1.5" />
        {config.label}
      </Badge>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Detalles del Item de Inventario</DialogTitle>
          <DialogDescription>
            Información completa del item {item.id}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* Información básica */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">ID</Label>
              <p className="font-medium">{item.id}</p>
            </div>
            
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Tipo de Elemento</Label>
              <p className="font-medium">{item.tipoElementoNombre}</p>
            </div>
            
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Cantidad</Label>
              <p className="font-medium">{item.cantidad}</p>
            </div>
            
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Estado</Label>
              <div>
                {getEstadoBadge(item.estado)}
              </div>
            </div>
          </div>

          {/* Espacio asignado */}
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Espacio Asignado</Label>
            <p className="font-medium">{item.espacioNombre || 'Sin asignar'}</p>
          </div>

          {/* Observaciones */}
          {item.observaciones && (
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Observaciones</Label>
              <p className="text-sm bg-muted p-3 rounded-lg">{item.observaciones}</p>
            </div>
          )}

          {/* Fechas del sistema */}
          <div className="grid grid-cols-2 gap-4 pt-4 border-t">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Fecha de Registro</Label>
              <p className="text-sm font-medium">{formatDate(item.createdAt)}</p>
              <p className="text-xs text-muted-foreground">{formatRelativeTime(item.createdAt)}</p>
            </div>
            
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Última Actualización</Label>
              <p className="text-sm font-medium">{formatDate(item.updatedAt)}</p>
              <p className="text-xs text-muted-foreground">{formatRelativeTime(item.updatedAt)}</p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

