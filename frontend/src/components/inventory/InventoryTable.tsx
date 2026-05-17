import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/checkbox";
import { Edit, Trash2, Package, Eye, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { InventarioItem } from '@/lib/types/spaces';
import PermissionGuard from '@/components/auth/PermissionGuard';
import { EstadoBadge } from './_shared/inventoryEstado';
import { EspacioCell } from './_shared/EspacioCell';

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
    <div className="border rounded-lg shadow-card overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent border-b-0">
            {onToggleSelect && (
              <TableHead style={{ backgroundColor: '#525961' }} className="h-10 text-[#d1d5db] w-[50px]">
                <Checkbox
                  checked={selectedItems?.size === items.length}
                  onCheckedChange={(checked) => {
                    items.forEach(item => {
                      const isSelected = selectedItems?.has(item.id);
                      if ((checked && !isSelected) || (!checked && isSelected)) {
                        onToggleSelect(item.id);
                      }
                    });
                  }}
                />
              </TableHead>
            )}
            <TableHead style={{ backgroundColor: '#525961' }} className="h-10 text-[#d1d5db] w-[50px]">
              <button
                onClick={() => onSort && handleSort('id')}
                className="flex items-center hover:text-white transition-colors"
              >
                ID {sortConfig && getSortIcon('id')}
              </button>
            </TableHead>
            <TableHead style={{ backgroundColor: '#525961' }} className="h-10 text-[#d1d5db]">
              <button
                onClick={() => onSort && handleSort('tipo')}
                className="flex items-center hover:text-white transition-colors"
              >
                Tipo {sortConfig && getSortIcon('tipo')}
              </button>
            </TableHead>
            <TableHead style={{ backgroundColor: '#525961' }} className="h-10 text-[#d1d5db]">
              <button
                onClick={() => onSort && handleSort('cantidad')}
                className="flex items-center hover:text-white transition-colors"
              >
                Cantidad {sortConfig && getSortIcon('cantidad')}
              </button>
            </TableHead>
            <TableHead style={{ backgroundColor: '#525961' }} className="h-10 text-[#d1d5db]">Espacio</TableHead>
            <TableHead style={{ backgroundColor: '#525961' }} className="h-10 text-[#d1d5db]">Estado</TableHead>
            <TableHead style={{ backgroundColor: '#525961' }} className="h-10 text-[#d1d5db] text-right">Acciones</TableHead>
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
                <EspacioCell item={item} variant="table" />
              </TableCell>
              <TableCell><EstadoBadge estado={item.estado} /></TableCell>
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
