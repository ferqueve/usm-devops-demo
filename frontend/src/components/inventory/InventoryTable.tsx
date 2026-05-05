import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/checkbox";
import { Edit, Trash2, Package, Eye, ArrowUpDown, ArrowUp, ArrowDown, CheckCircle, Wrench, AlertCircle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { InventarioItem } from '@/lib/types/spaces';
import PermissionGuard from '@/components/auth/PermissionGuard';

interface InventoryTableProps {
  items: InventarioItem[];
  onEdit: (item: InventarioItem) => void;
  onDelete: (item: InventarioItem) => void;
  onAssign: (item: InventarioItem) => void;
  onView?: (item: InventarioItem) => void;
  selectedItems?: Set<number>;
  onToggleSelect?: (id: number) => void;
  sortConfig?: { column: string | null; direction: 'asc' | 'desc' };
  onSort?: (column: string) => void;
}

export default function InventoryTable({ 
  items, 
  onEdit, 
  onDelete, 
  onAssign, 
  onView,
  selectedItems,
  onToggleSelect,
  sortConfig,
  onSort
}: Readonly<InventoryTableProps>) {
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

  const getSortIcon = (column: string) => {
    if (sortConfig?.column !== column) {
      return <ArrowUpDown className="ml-2 h-4 w-4" />;
    }
    return sortConfig.direction === 'asc' 
      ? <ArrowUp className="ml-2 h-4 w-4" />
      : <ArrowDown className="ml-2 h-4 w-4" />;
  };

  const handleSort = (column: string) => {
    if (onSort) {
      onSort(column);
    }
  };

  return (
    <div className="border rounded-lg shadow-card">
      <Table>
        <TableHeader>
          <TableRow>
            {onToggleSelect && (
              <TableHead className="w-[50px]">
                <Checkbox
                  checked={selectedItems?.size === items.length}
                  onCheckedChange={(checked) => {
                    items.forEach(item => {
                      if (checked && !selectedItems?.has(item.id)) {
                        onToggleSelect(item.id);
                      } else if (!checked && selectedItems?.has(item.id)) {
                        onToggleSelect(item.id);
                      }
                    });
                  }}
                />
              </TableHead>
            )}
            <TableHead className="w-[50px]">
              <button
                onClick={() => onSort && handleSort('id')}
                className="flex items-center hover:text-utec-blue transition-colors"
              >
                ID {sortConfig && getSortIcon('id')}
              </button>
            </TableHead>
            <TableHead>
              <button
                onClick={() => onSort && handleSort('tipo')}
                className="flex items-center hover:text-utec-blue transition-colors"
              >
                Tipo {sortConfig && getSortIcon('tipo')}
              </button>
            </TableHead>
            <TableHead>
              <button
                onClick={() => onSort && handleSort('cantidad')}
                className="flex items-center hover:text-utec-blue transition-colors"
              >
                Cantidad {sortConfig && getSortIcon('cantidad')}
              </button>
            </TableHead>
            <TableHead>Espacio</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.id}>
              {onToggleSelect && (
                <TableCell>
                  <Checkbox
                    checked={selectedItems?.has(item.id)}
                    onCheckedChange={() => onToggleSelect?.(item.id)}
                  />
                </TableCell>
              )}
              <TableCell className="font-medium">{item.id}</TableCell>
              <TableCell>{item.tipoElementoNombre}</TableCell>
              <TableCell>{item.cantidad}</TableCell>
              <TableCell>
                {(() => {
                  if (!item.espacioId || !item.espacioNombre) {
                    return <span className="text-muted-foreground">Sin asignar</span>;
                  }
                  if (item.espacioColor) {
                    return (
                      <span
                        className="inline-block px-2 py-0.5 rounded text-white text-xs font-medium"
                        style={{ backgroundColor: item.espacioColor }}
                      >
                        {item.espacioNombre}
                      </span>
                    );
                  }
                  return <span className="text-sm">{item.espacioNombre}</span>;
                })()}
              </TableCell>
              <TableCell>{getEstadoBadge(item.estado)}</TableCell>
              <TableCell>
                <div className="flex items-center justify-end gap-1">
                  <TooltipProvider>
                    {onView && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => onView(item)}
                            className="h-8 w-8 p-0"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Ver Detalles</TooltipContent>
                      </Tooltip>
                    )}
                    
                    <PermissionGuard requiredPermission="inventario:asignar">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => onAssign(item)}
                            className="h-8 w-8 p-0"
                          >
                            <Package className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>{item.espacioId ? 'Reasignar' : 'Asignar'}</TooltipContent>
                      </Tooltip>
                    </PermissionGuard>
                    
                    <PermissionGuard requiredPermission="inventario:editar">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => onEdit(item)}
                            className="h-8 w-8 p-0"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Editar</TooltipContent>
                      </Tooltip>
                    </PermissionGuard>
                    
                    <PermissionGuard requiredPermission="inventario:eliminar">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => onDelete(item)}
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Eliminar</TooltipContent>
                      </Tooltip>
                    </PermissionGuard>
                  </TooltipProvider>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
