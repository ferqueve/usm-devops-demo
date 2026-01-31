import { Button } from "@/components/ui/Button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CheckCircle2, AlertCircle, XCircle, MoreHorizontal, Package, PackageX, Download } from "lucide-react";
import PermissionGuard from '@/components/auth/PermissionGuard';

interface BulkActionsBarProps {
  selectedCount: number;
  onBulkStateChange: (estado: 'DISPONIBLE' | 'MANTENIMIENTO' | 'DANADO') => void;
  onBulkAssign: () => void;
  onBulkUnassign: () => void;
  onBulkExport: () => void;
  onClearSelection: () => void;
}

export default function BulkActionsBar({ 
  selectedCount, 
  onBulkStateChange, 
  onBulkAssign,
  onBulkUnassign,
  onBulkExport,
  onClearSelection 
}: BulkActionsBarProps) {
  return (
    <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-lg">
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-blue-900">
          {selectedCount} item{selectedCount !== 1 ? 's' : ''} seleccionado{selectedCount !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <PermissionGuard requiredPermission="inventario:asignar">
          <Button
            variant="outline"
            size="sm"
            onClick={onBulkAssign}
          >
            <Package className="h-4 w-4 mr-2" />
            Asignar Espacio
          </Button>
        </PermissionGuard>

        <PermissionGuard requiredPermission="inventario:asignar">
          <Button
            variant="outline"
            size="sm"
            onClick={onBulkUnassign}
          >
            <PackageX className="h-4 w-4 mr-2" />
            Desasignar
          </Button>
        </PermissionGuard>

        <PermissionGuard requiredPermission="inventario:ver">
          <Button
            variant="outline"
            size="sm"
            onClick={onBulkExport}
          >
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </PermissionGuard>

        <PermissionGuard requiredPermission="inventario:editar">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <MoreHorizontal className="h-4 w-4 mr-2" />
                Estado
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onBulkStateChange('DISPONIBLE')}>
                <CheckCircle2 className="mr-2 h-4 w-4 text-green-600" />
                Marcar como Disponible
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onBulkStateChange('MANTENIMIENTO')}>
                <AlertCircle className="mr-2 h-4 w-4 text-yellow-600" />
                Marcar como Mantenimiento
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onBulkStateChange('DANADO')}>
                <XCircle className="mr-2 h-4 w-4 text-red-600" />
                Marcar como Dañado
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </PermissionGuard>

        <Button 
          variant="ghost" 
          size="sm"
          onClick={onClearSelection}
        >
          Limpiar
        </Button>
      </div>
    </div>
  );
}

