import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/Button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { SpaceFormDialog } from './SpaceFormDialog';
import { DeleteSpaceDialog } from './DeleteSpaceDialog';
import { InventarioFormDialog } from './InventarioFormDialog';
import { DeleteInventarioDialog } from './DeleteInventarioDialog';
import { espaciosApi } from '@/lib/api/spaces';
import type { Espacio, InventarioItem } from '@/lib/types/spaces';
import { 
  ArrowLeft, 
  Edit, 
  Trash2, 
  Users, 
  Calendar,
  Package,
  DollarSign,
  AlertCircle,
  CheckCircle,
  Wrench,
  Plus
} from 'lucide-react';
import { toast } from 'sonner';

interface SpaceDetailsProps {
  espacioId: number;
}

// Función para obtener configuración del tipo de espacio
function getTipoEspacioConfig(tipoNombre: string | null | undefined) {
  if (!tipoNombre) {
    return { label: 'Sin tipo', color: 'bg-gray-100 text-gray-800' };
  }
  
  const tipoLower = tipoNombre.toLowerCase();
  
  if (tipoLower.includes('aula')) {
    return { label: 'Aula', color: 'bg-blue-100 text-blue-800' };
  } else if (tipoLower.includes('laboratorio')) {
    return { label: 'Laboratorio', color: 'bg-green-100 text-green-800' };
  } else if (tipoLower.includes('auditorio')) {
    return { label: 'Auditorio', color: 'bg-purple-100 text-purple-800' };
  } else if (tipoLower.includes('reunion')) {
    return { label: 'Sala de Reuniones', color: 'bg-orange-100 text-orange-800' };
  } else if (tipoLower.includes('oficina')) {
    return { label: 'Oficina', color: 'bg-gray-100 text-gray-800' };
  } else if (tipoLower.includes('biblioteca')) {
    return { label: 'Biblioteca', color: 'bg-indigo-100 text-indigo-800' };
  } else if (tipoLower.includes('taller')) {
    return { label: 'Taller', color: 'bg-yellow-100 text-yellow-800' };
  } else if (tipoLower.includes('gimnasio')) {
    return { label: 'Gimnasio', color: 'bg-red-100 text-red-800' };
  } else {
    return { label: tipoNombre, color: 'bg-gray-100 text-gray-800' };
  }
}

// Función para obtener configuración del estado del inventario
function getEstadoConfig(estado: string) {
  switch (estado) {
    case 'DISPONIBLE':
      return { 
        label: 'Disponible', 
        color: 'bg-green-100 text-green-800',
        icon: CheckCircle
      };
    case 'MANTENIMIENTO':
      return { 
        label: 'Mantenimiento', 
        color: 'bg-yellow-100 text-yellow-800',
        icon: Wrench
      };
    case 'DANADO':
      return { 
        label: 'Dañado', 
        color: 'bg-red-100 text-red-800',
        icon: AlertCircle
      };
    default:
      return { 
        label: estado, 
        color: 'bg-gray-100 text-gray-800',
        icon: AlertCircle
      };
  }
}

// Función para formatear moneda
function formatCurrency(value?: number): string {
  if (!value) return 'N/A';
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'USD'
  }).format(value);
}

export function SpaceDetails({ espacioId }: SpaceDetailsProps) {
  const navigate = useNavigate();
  const [espacio, setEspacio] = useState<Espacio | null>(null);
  const [inventario, setInventario] = useState<InventarioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingInventario, setLoadingInventario] = useState(true);
  
  // Modales
  const [editDialog, setEditDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [inventarioFormDialog, setInventarioFormDialog] = useState(false);
  const [deleteInventarioDialog, setDeleteInventarioDialog] = useState(false);
  const [selectedInventarioItem, setSelectedInventarioItem] = useState<InventarioItem | null>(null);

  const canEdit = true; // TODO: Implementar verificación de permisos

  useEffect(() => {
    fetchEspacio();
    fetchInventario();
  }, [espacioId]);

  const fetchEspacio = async () => {
    try {
      setLoading(true);
      const response = await espaciosApi.obtenerEspacio(espacioId);
      if (response.data) {
        setEspacio(response.data);
      }
    } catch (error: any) {
      console.error('Error al cargar espacio:', error);
      toast.error('Error al cargar espacio', {
        description: error.message || 'No se pudo cargar la información del espacio'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchInventario = async () => {
    try {
      setLoadingInventario(true);
      const response = await espaciosApi.listarInventarioPorEspacio(espacioId);
      if (response.data) {
        setInventario(response.data);
      }
    } catch (error: any) {
      console.error('Error al cargar inventario:', error);
      toast.error('Error al cargar inventario', {
        description: error.message || 'No se pudo cargar el inventario del espacio'
      });
    } finally {
      setLoadingInventario(false);
    }
  };

  const handleEditSuccess = (updatedSpace: Espacio) => {
    setEspacio(updatedSpace);
    toast.success('Espacio actualizado exitosamente');
  };

  const handleDeleteSuccess = () => {
    toast.success('Espacio eliminado exitosamente');
    navigate('/rooms');
  };

  const handleInventarioSuccess = (item: InventarioItem) => {
    if (selectedInventarioItem) {
      // Actualizar item existente
      setInventario(prev => 
        prev.map(i => i.id === item.id ? item : i)
      );
    } else {
      // Agregar nuevo item
      setInventario(prev => [...prev, item]);
    }
    setSelectedInventarioItem(null);
  };

  const handleDeleteInventarioSuccess = () => {
    if (selectedInventarioItem) {
      setInventario(prev => 
        prev.filter(i => i.id !== selectedInventarioItem.id)
      );
      setSelectedInventarioItem(null);
    }
  };

  const handleEditInventario = (item: InventarioItem) => {
    setSelectedInventarioItem(item);
    setInventarioFormDialog(true);
  };

  const handleDeleteInventario = (item: InventarioItem) => {
    setSelectedInventarioItem(item);
    setDeleteInventarioDialog(true);
  };

  const handleAddInventario = () => {
    setSelectedInventarioItem(null);
    setInventarioFormDialog(true);
  };

  const handleBack = () => {
    navigate(-1);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Header skeleton */}
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>

        {/* Card skeleton */}
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <Skeleton className="h-48 w-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-32" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!espacio) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Espacio no encontrado</h3>
            <p className="text-muted-foreground">
              El espacio solicitado no existe o no tienes permisos para verlo.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const tipoConfig = getTipoEspacioConfig(espacio.tipoEspacioNombre);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <Button variant="outline" onClick={handleBack} className="self-start sm:self-auto">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{espacio.nombre}</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge className={tipoConfig.color}>
                {tipoConfig.label}
              </Badge>
            </div>
          </div>
        </div>
        
        {canEdit && (
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" onClick={() => setEditDialog(true)} className="flex-1 sm:flex-none">
              <Edit className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Editar</span>
            </Button>
            <Button variant="outline" onClick={() => setDeleteDialog(true)} className="flex-1 sm:flex-none">
              <Trash2 className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Eliminar</span>
            </Button>
          </div>
        )}
      </div>

      {/* Información del espacio */}
      <Card>
        <CardHeader>
          <CardTitle>Información del Espacio</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:gap-6 grid-cols-1 md:grid-cols-2">
            {/* Imagen */}
            <div>
              {espacio.imagenUrl ? (
                <div className="aspect-video rounded-md overflow-hidden bg-gray-100">
                  <img 
                    src={espacio.imagenUrl} 
                    alt={espacio.nombre}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="aspect-video rounded-md bg-gray-100 flex items-center justify-center">
                  <Users className="h-12 w-12 text-gray-400" />
                </div>
              )}
            </div>

            {/* Detalles */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-gray-500" />
                <span className="font-medium">Capacidad:</span>
                <span>{espacio.capacidad} personas</span>
              </div>

              <div className="flex items-center gap-2">
                <Package className="h-5 w-5 text-gray-500" />
                <span className="font-medium">Tipo:</span>
                <Badge className={tipoConfig.color}>
                  {tipoConfig.label}
                </Badge>
              </div>

              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-gray-500" />
                <span className="font-medium">Creado:</span>
                <span>{new Date(espacio.createdAt).toLocaleDateString('es-ES')}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Inventario */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Inventario del Espacio
            </CardTitle>
            {canEdit && (
              <Button onClick={handleAddInventario} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Agregar Elemento
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {loadingInventario ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="flex items-center space-x-4">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-20" />
                </div>
              ))}
            </div>
          ) : inventario.length > 0 ? (
            <>
              {/* Vista de cards en móvil */}
              <div className="md:hidden space-y-3">
                {inventario.map((item) => {
                  const estadoConfig = getEstadoConfig(item.estado);
                  const EstadoIcon = estadoConfig.icon;
                  
                  return (
                    <Card key={item.id} className="shadow-sm">
                      <CardContent className="p-4 space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <p className="font-semibold text-sm mb-1">{item.tipoElementoNombre}</p>
                            <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                              <span>Cant: {item.cantidad}</span>
                              {item.marca && <span>• {item.marca}</span>}
                              {item.modelo && <span>• {item.modelo}</span>}
                            </div>
                          </div>
                          <Badge className={estadoConfig.color}>
                            <EstadoIcon className="h-3 w-3 mr-1" />
                            {estadoConfig.label}
                          </Badge>
                        </div>
                        
                        {item.valorEstimado && (
                          <div className="flex items-center gap-1 text-sm">
                            <DollarSign className="h-4 w-4 text-green-600" />
                            <span className="font-medium">{formatCurrency(item.valorEstimado)}</span>
                          </div>
                        )}
                        
                        {canEdit && (
                          <div className="flex gap-2 pt-2 border-t">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditInventario(item)}
                              className="flex-1"
                            >
                              <Edit className="h-3 w-3 mr-1" />
                              Editar
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteInventario(item)}
                              className="flex-1"
                            >
                              <Trash2 className="h-3 w-3 mr-1" />
                              Eliminar
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {/* Vista de tabla en desktop */}
              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tipo de Elemento</TableHead>
                      <TableHead>Cantidad</TableHead>
                      <TableHead>Marca</TableHead>
                      <TableHead>Modelo</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Valor Estimado</TableHead>
                      {canEdit && <TableHead>Acciones</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {inventario.map((item) => {
                      const estadoConfig = getEstadoConfig(item.estado);
                      const EstadoIcon = estadoConfig.icon;
                      
                      return (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">
                            {item.tipoElementoNombre}
                          </TableCell>
                          <TableCell>{item.cantidad}</TableCell>
                          <TableCell>{item.marca || 'N/A'}</TableCell>
                          <TableCell>{item.modelo || 'N/A'}</TableCell>
                          <TableCell>
                            <Badge className={estadoConfig.color}>
                              <EstadoIcon className="h-3 w-3 mr-1" />
                              {estadoConfig.label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {item.valorEstimado ? (
                              <div className="flex items-center gap-1">
                                <DollarSign className="h-4 w-4 text-green-600" />
                                {formatCurrency(item.valorEstimado)}
                              </div>
                            ) : (
                              'N/A'
                            )}
                          </TableCell>
                          {canEdit && (
                            <TableCell>
                              <div className="flex gap-1">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleEditInventario(item)}
                                >
                                  <Edit className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDeleteInventario(item)}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </TableCell>
                          )}
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Sin inventario</h3>
              <p className="text-muted-foreground">
                Este espacio no tiene inventario registrado.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modales */}
      <SpaceFormDialog
        espacio={espacio}
        open={editDialog}
        onOpenChange={setEditDialog}
        onSuccess={handleEditSuccess}
      />

      <DeleteSpaceDialog
        espacio={espacio}
        open={deleteDialog}
        onOpenChange={setDeleteDialog}
        onSuccess={handleDeleteSuccess}
      />

      <InventarioFormDialog
        espacioId={espacioId}
        inventarioItem={selectedInventarioItem || undefined}
        open={inventarioFormDialog}
        onOpenChange={setInventarioFormDialog}
        onSuccess={handleInventarioSuccess}
      />

      {selectedInventarioItem && (
        <DeleteInventarioDialog
          inventarioItem={selectedInventarioItem}
          open={deleteInventarioDialog}
          onOpenChange={setDeleteInventarioDialog}
          onSuccess={handleDeleteInventarioSuccess}
        />
      )}
    </div>
  );
}
