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
import { 
  Edit, 
  Trash2, 
  Eye, 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown,
  Building2,
  Users,
  CheckCircle,
  Wrench,
  XCircle
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { Espacio } from '@/lib/types/spaces';
import PermissionGuard from '@/components/auth/PermissionGuard';

interface SpaceTableProps {
  espacios: Espacio[];
  onEdit: (espacio: Espacio) => void;
  onDelete?: (espacio: Espacio) => void;
  sortConfig?: { column: string | null; direction: 'asc' | 'desc' };
  onSort?: (column: string) => void;
}

export function SpaceTable({ 
  espacios, 
  onEdit,
  onDelete,
  sortConfig, 
  onSort
}: Readonly<SpaceTableProps>) {
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
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent border-b-0">
            <TableHead style={{ backgroundColor: '#525961' }} className="h-10 text-[#d1d5db] w-[80px]">
              <button
                onClick={() => onSort && handleSort('id')}
                className="flex items-center hover:text-white transition-colors"
              >
                ID {onSort && getSortIcon('id')}
              </button>
            </TableHead>
            <TableHead style={{ backgroundColor: '#525961' }} className="h-10 text-[#d1d5db]">
              <button
                onClick={() => onSort && handleSort('nombre')}
                className="flex items-center hover:text-white transition-colors"
              >
                Nombre {onSort && getSortIcon('nombre')}
              </button>
            </TableHead>
            <TableHead style={{ backgroundColor: '#525961' }} className="h-10 text-[#d1d5db]">
              <button
                onClick={() => onSort && handleSort('tipo')}
                className="flex items-center hover:text-white transition-colors"
              >
                Tipo de Espacio {onSort && getSortIcon('tipo')}
              </button>
            </TableHead>
            <TableHead style={{ backgroundColor: '#525961' }} className="h-10 text-[#d1d5db]">
              Edificio
            </TableHead>
            <TableHead style={{ backgroundColor: '#525961' }} className="h-10 text-[#d1d5db]">
              <button
                onClick={() => onSort && handleSort('capacidad')}
                className="flex items-center hover:text-white transition-colors"
              >
                Capacidad {onSort && getSortIcon('capacidad')}
              </button>
            </TableHead>
            <TableHead style={{ backgroundColor: '#525961' }} className="h-10 text-[#d1d5db]">
              Estado
            </TableHead>
            <TableHead style={{ backgroundColor: '#525961' }} className="h-10 text-[#d1d5db] text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {espacios.map((espacio) => (
            <TableRow key={espacio.id} className="hover:bg-gray-50">
              <TableCell className="font-medium">#{espacio.id}</TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-gray-500" />
                  <span className="font-medium">{espacio.nombre}</span>
                </div>
              </TableCell>
              <TableCell>
                {espacio.tipoEspacioColor ? (
                  <span 
                    className="inline-flex items-center px-2 py-1 rounded text-white text-xs font-medium"
                    style={{ backgroundColor: espacio.tipoEspacioColor }}
                  >
                    {espacio.tipoEspacioNombre || 'Sin tipo'}
                  </span>
                ) : (
                  <Badge variant="secondary" className="text-xs">
                    {espacio.tipoEspacioNombre || 'Sin tipo'}
                  </Badge>
                )}
              </TableCell>
              <TableCell>
                {espacio.edificioNombre ? (
                  <span className="text-sm text-gray-700">{espacio.edificioNombre}</span>
                ) : (
                  <span className="text-sm text-gray-400">Sin edificio</span>
                )}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2 text-sm">
                  <Users className="h-4 w-4 text-gray-500" />
                  <span>{espacio.capacidad} personas</span>
                </div>
              </TableCell>
              <TableCell>
                {(() => {
                  const getEstadoConfig = (estado: string) => {
                    switch (estado) {
                      case 'DISPONIBLE':
                        return { 
                          label: 'Disponible', 
                          color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
                          icon: CheckCircle
                        };
                      case 'MANTENIMIENTO':
                        return { 
                          label: 'En Mantenimiento', 
                          color: 'bg-amber-50 text-amber-700 border-amber-200',
                          icon: Wrench
                        };
                      case 'NO_DISPONIBLE':
                        return { 
                          label: 'No Disponible', 
                          color: 'bg-red-50 text-red-700 border-red-200',
                          icon: XCircle
                        };
                      default:
                        return { 
                          label: estado, 
                          color: 'bg-gray-50 text-gray-700 border-gray-200',
                          icon: CheckCircle
                        };
                    }
                  };
                  const estadoConfig = getEstadoConfig(espacio.estado);
                  const EstadoIcon = estadoConfig.icon;
                  return (
                    <Badge className={`${estadoConfig.color} border font-medium text-xs`}>
                      <EstadoIcon className="h-3 w-3 mr-1" />
                      {estadoConfig.label}
                    </Badge>
                  );
                })()}
              </TableCell>
              <TableCell>
                <div className="flex items-center justify-end gap-1">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => {
                            // Navegar a detalles del espacio
                            globalThis.location.href = `/rooms/${espacio.id}`;
                          }}
                          className="h-8 w-8 p-0"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Ver Detalles</TooltipContent>
                    </Tooltip>
                    
                    <PermissionGuard requiredPermission="espacio:editar">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => onEdit(espacio)}
                            className="h-8 w-8 p-0"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Editar</TooltipContent>
                      </Tooltip>
                    </PermissionGuard>
                    
                    <PermissionGuard requiredPermission="espacio:eliminar">
                      {onDelete && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => onDelete(espacio)}
                              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Eliminar</TooltipContent>
                        </Tooltip>
                      )}
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

