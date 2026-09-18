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
          <TableRow>
            <TableHead className="w-[80px]">
              <button
                onClick={() => onSort && handleSort('id')}
                className="flex items-center hover:text-white transition-colors"
              >
                ID {onSort && getSortIcon('id')}
              </button>
            </TableHead>
            <TableHead>
              <button
                onClick={() => onSort && handleSort('nombre')}
                className="flex items-center hover:text-white transition-colors"
              >
                Nombre {onSort && getSortIcon('nombre')}
              </button>
            </TableHead>
            <TableHead>
              <button
                onClick={() => onSort && handleSort('tipo')}
                className="flex items-center hover:text-white transition-colors"
              >
                Tipo de Espacio {onSort && getSortIcon('tipo')}
              </button>
            </TableHead>
            <TableHead>
              Edificio
            </TableHead>
            <TableHead>
              <button
                onClick={() => onSort && handleSort('capacidad')}
                className="flex items-center hover:text-white transition-colors"
              >
                Capacidad {onSort && getSortIcon('capacidad')}
              </button>
            </TableHead>
            <TableHead>
              Estado
            </TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {espacios.map((espacio) => (
            <TableRow key={espacio.id} className="hover:bg-muted">
              <TableCell className="font-medium">#{espacio.id}</TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
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
                  <span className="text-sm text-foreground/80">{espacio.edificioNombre}</span>
                ) : (
                  <span className="text-sm text-muted-foreground">Sin edificio</span>
                )}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2 text-sm">
                  <Users className="h-4 w-4 text-muted-foreground" />
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
                          color: 'bg-utec-green text-marca-tinta border-utec-green',
                          icon: CheckCircle
                        };
                      case 'MANTENIMIENTO':
                        return {
                          label: 'En Mantenimiento',
                          color: 'bg-utec-yellow text-marca-tinta border-utec-yellow',
                          icon: Wrench
                        };
                      case 'NO_DISPONIBLE':
                        return {
                          label: 'No Disponible',
                          color: 'bg-utec-red text-white border-utec-red',
                          icon: XCircle
                        };
                      default:
                        return {
                          label: estado,
                          color: 'bg-secondary text-utec-dark border-border',
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

