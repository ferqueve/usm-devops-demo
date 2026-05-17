import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/Button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from 'sonner';
import {
  Plus,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Loader2,
  RefreshCw,
  Package,
  Download,
  Upload,
  LayoutGrid,
  LayoutList,
  ArrowLeft,
  ArrowRightLeft,
  Building2,
  Tag,
  CheckCircle2,
  Wrench,
  XCircle,
  Filter,
} from 'lucide-react';
import { FilterBar } from "@/components/ui/filter-bar";
import type { FilterItem } from "@/components/ui/filter-bar";
import { EmptyState } from "@/components/ui/empty-state";
import { Label } from "@/components/ui/label";
import { PopoverFilterSection, EnumFilterSection } from "@/components/ui/compact-filter";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { inventarioApi } from '@/lib/api/inventory';
import type { InventarioItem, InventarioFilters } from '@/lib/types/spaces';
import { exportInventarioToCSV } from '@/lib/utils/csv-export';
import InventoryTable from './InventoryTable';
import InventoryCardView from './InventoryCardView';
import InventoryStatsCards from './InventoryStatsCards';
import InventoryFormDialog from './InventoryFormDialog';
import InventoryDetailsDialog from './InventoryDetailsDialog';
import DeleteInventoryDialog from './DeleteInventoryDialog';
import AssignSpaceDialog from './AssignSpaceDialog';
import ImportCSVDialog from './ImportCSVDialog';
import BulkActionsBar from './BulkActionsBar';
import PermissionGuard from '@/components/auth/PermissionGuard';
import { usePreferences } from '@/hooks/usePreferences';
import { MantenimientoRecomendaciones } from '@/components/recomendaciones/MantenimientoRecomendaciones';
import { recomendacionesApi } from '@/lib/api/recomendaciones';
import type { RecomendacionInventario } from '@/lib/types/recomendaciones';
import { useRolePermissions } from '@/hooks/useRolePermissions';
import { TipoElementoManagement } from './TipoElementoManagement';
import { useEspacios } from '@/hooks/useEspacios';
import { useTiposElemento } from '@/hooks/useTiposElemento';

type ViewMode = 'table' | 'cards';

export default function InventoryManagement() {
  const navigate = useNavigate();
  const { hasPermission } = useRolePermissions();

  // Permission-based logic
  const canManageInventory = hasPermission('inventario:editar'); // ADMIN/MANTENIMIENTO can manage inventory

  // Usar hooks compartidos con caché
  const { espacios } = useEspacios();
  const { tiposElemento, refresh: refreshTiposElemento } = useTiposElemento();

  // Estados principales
  const [items, setItems] = useState<InventarioItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const { preferencias } = usePreferences();
  const pageSize = preferencias?.inventarioPageSize || 25;
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filters, setFilters] = useState<InventarioFilters>({});
  const [reasignaciones, setReasignaciones] = useState<RecomendacionInventario[]>([]);
  
  // Estado para estadísticas globales
  const [statistics, setStatistics] = useState<{
    totalItems: number;
    disponibles: number;
    mantenimiento: number;
    danados: number;
    sinAsignar: number;
  } | null>(null);
  
  // Estados de visualización y selección - desde preferencias
  const preferenciaViewMode = preferencias?.inventarioViewMode as ViewMode | undefined;
  const [viewMode, setViewMode] = useState<ViewMode>(preferenciaViewMode || 'table');
  
  // Aplicar preferencias cuando se carguen
  useEffect(() => {
    if (preferencias?.inventarioViewMode) {
      setViewMode(preferencias.inventarioViewMode as ViewMode);
    }
  }, [preferencias]);
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
  const [sortConfig, setSortConfig] = useState<{ column: string | null; direction: 'asc' | 'desc' }>({ 
    column: null, 
    direction: 'asc' 
  });
  
  // Estados para acciones masivas
  const [showBulkConfirm, setShowBulkConfirm] = useState(false);
  const [pendingBulkState, setPendingBulkState] = useState<'DISPONIBLE' | 'MANTENIMIENTO' | 'DANADO' | null>(null);
  const [bulkProcessing, setBulkProcessing] = useState(false);
  const [showBulkAssignDialog, setShowBulkAssignDialog] = useState(false);
  const [bulkEspacio, setBulkEspacio] = useState<number | null>(null);
  
  // Modales
  const [createDialog, setCreateDialog] = useState(false);
  const [editDialog, setEditDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [detailsDialog, setDetailsDialog] = useState(false);
  const [assignDialog, setAssignDialog] = useState(false);
  const [importDialog, setImportDialog] = useState(false);
  const [showTiposManagement, setShowTiposManagement] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventarioItem | null>(null);

  // Cargar estadísticas y recomendaciones
  useEffect(() => {
    fetchStatistics();

    // Cargar recomendaciones de reasignación (solo para usuarios con permiso inventario:editar)
    if (canManageInventory) {
      fetchReasignaciones();
    }
  }, [canManageInventory]);

  // Función para cargar recomendaciones de reasignación
  const fetchReasignaciones = async () => {
    try {
      const response = await recomendacionesApi.obtenerReasignaciones();
      if (response.success && response.data) {
        setReasignaciones(response.data);
      }
    } catch (error) {
      console.warn('No se pudieron cargar recomendaciones de reasignación:', error);
    }
  };

  // Función para cargar estadísticas
  const fetchStatistics = async () => {
    try {
      const response = await inventarioApi.obtenerEstadisticasInventario();
      const statsData = response.data;
      
      if (statsData) {
        setStatistics({
          totalItems: statsData.totalItems || 0,
          disponibles: statsData.disponibles || 0,
          mantenimiento: statsData.mantenimiento || 0,
          danados: statsData.danados || 0,
          sinAsignar: statsData.sinAsignar || 0
        });
      }
    } catch (error) {
      console.error('Error al cargar estadísticas:', error);
    }
  };

  // Mapear columnas del frontend a campos del backend
  // Para el endpoint /paged Spring usa estos nombres de campos de la entidad
  // Para el endpoint /filter el backend convierte estos a nombres de DTO
  const mapFrontendColumnToBackend = (frontendColumn: string): string => {
    const mapping: Record<string, string> = {
      'id': 'id',
      'tipo': 'tipoElemento.nombre',  // Para ordenar por tipo, necesitamos la relación
      'cantidad': 'cantidad',
      'estado': 'estado',
      'espacio': 'espacio.nombre'  // Para ordenar por espacio
    };
    return mapping[frontendColumn] || frontendColumn;
  };

  const fetchItems = useCallback(async (showLoading: boolean = true) => {
    try {
      if (showLoading) {
      setLoading(true);
      }
      
      // Convertir columna de sortConfig a nombre de campo del backend
      const backendSortColumn = sortConfig.column 
        ? mapFrontendColumnToBackend(sortConfig.column) 
        : undefined;
      
      // Siempre usar el endpoint paginado con filtros
      const response = await inventarioApi.listarInventario(
        page, 
        pageSize, 
        filters, 
        backendSortColumn, 
        sortConfig.direction
      );
      
        const pagedData = response.data;
        
        if (pagedData?.content) {
          setItems(pagedData.content);
        setTotalPages(pagedData.totalPages || 0);
        setTotalElements(pagedData.totalElements || 0);
      } else {
        setTotalPages(0);
        setTotalElements(0);
      }
    } catch (error: unknown) {
      if (showLoading) {
        const errorMessage = error instanceof Error ? error.message : 'No se pudo cargar el inventario';
        toast.error('Error al cargar inventario', {
          description: errorMessage
        });
      }
    } finally {
      if (showLoading) {
      setLoading(false);
      }
    }
  }, [page, pageSize, filters, sortConfig]);

  // Recargar cuando cambian filtros o página
  useEffect(() => {
    fetchItems(true); // true para usar sortConfig
  }, [fetchItems, page, filters]);

  // Solo recargar cuando cambia SORT (sin page ni filters), sin mostrar loading
  useEffect(() => {
    // Solo ejecutar si ya hay un sortConfig activo (no en la primera carga)
    if (sortConfig.column) {
      fetchItems(false); // false para NO mostrar loading spinner
    }
  }, [fetchItems, sortConfig.column, sortConfig.direction]);

  const handleFilterChange = (key: keyof InventarioFilters, value: string | number | boolean | undefined) => {
    setPage(0);
    if (value === undefined) {
      setFilters(prev => {
        const newFilters = { ...prev };
        delete newFilters[key];
        return newFilters;
      });
    } else {
      setFilters(prev => ({ ...prev, [key]: value }));
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    const startTime = Date.now();
    
    await Promise.all([fetchItems(), fetchStatistics()]);
    toast.success('Lista actualizada');
    
    const elapsed = Date.now() - startTime;
    const remaining = Math.max(0, 600 - elapsed);
    
    setTimeout(() => {
      setIsRefreshing(false);
    }, remaining);
  };

  const clearFilters = () => {
    setFilters({});
    setPage(0);
    toast.info('Filtros limpiados');
  };

  const handleCreateSuccess = async (newItem: InventarioItem) => {
    setItems(prev => [newItem, ...prev]);
    setTotalElements(prev => prev + 1);
    await fetchStatistics();
  };

  const handleEditSuccess = async (updatedItem: InventarioItem) => {
    setItems(prev => {
      // Mantener la posición del elemento actualizado en la lista
      const index = prev.findIndex(item => item.id === updatedItem.id);
      if (index !== -1) {
        const newItems = [...prev];
        newItems[index] = updatedItem;
        return newItems;
      }
      // Si no se encuentra, actualizar normalmente
      return prev.map(item => item.id === updatedItem.id ? updatedItem : item);
    });
    await fetchStatistics();
  };

  const handleDeleteSuccess = async () => {
    if (selectedItem) {
      setItems(prev => prev.filter(item => item.id !== selectedItem.id));
      setTotalElements(prev => prev - 1);
      await fetchStatistics();
    }
  };

  const handleAssignSuccess = async () => {
    // Recargar los datos para reflejar cambios (especialmente cuando se divide el inventario)
    await fetchItems(false);
    await fetchStatistics();
  };

  const handleEdit = (item: InventarioItem) => {
    setSelectedItem(item);
    setEditDialog(true);
  };

  const handleDelete = (item: InventarioItem) => {
    setSelectedItem(item);
    setDeleteDialog(true);
  };

  const handleAssign = (item: InventarioItem) => {
    setSelectedItem(item);
    setAssignDialog(true);
  };

  const handleExport = async () => {
    try {
      // Obtener el inventario completo de la BD sin paginación ni filtros
      const response = await inventarioApi.obtenerTodoElInventario();
      const allItems = response.data || [];
      
      if (!allItems || allItems.length === 0) {
        toast.info('No hay items para exportar');
        return;
      }
      
      exportInventarioToCSV(allItems);
      toast.success(`${allItems.length} items exportados exitosamente`);
    } catch (error: unknown) {
      console.error('Error al exportar:', error);
      const errorMessage = error instanceof Error ? error.message : 'No se pudo exportar el inventario';
      toast.error('Error al exportar inventario', {
        description: errorMessage
      });
    }
  };

  // Funciones para detalles
  const handleView = (item: InventarioItem) => {
    setSelectedItem(item);
    setDetailsDialog(true);
  };

  // Funciones para selección múltiple
  const handleToggleSelect = (id: number) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  // Funciones de ordenamiento
  const handleSort = (column: string) => {
    setSortConfig(prev => {
      if (prev.column === column) {
        return { column, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
      }
      return { column, direction: 'asc' };
    });
    // Resetear página cuando se cambia ordenamiento
    setPage(0);
  };

  // Items ya vienen ordenados del backend
  const sortedItems = items;

  // Funciones para cambio masivo de estado
  const handleBulkStateChange = (estado: 'DISPONIBLE' | 'MANTENIMIENTO' | 'DANADO') => {
    setPendingBulkState(estado);
    setShowBulkConfirm(true);
  };

  const handleConfirmBulkStateChange = async () => {
    if (!pendingBulkState) return;
    
    setBulkProcessing(true);
    const itemsToUpdate = Array.from(selectedItems);
    
    try {
      // Actualizar items con llamada real a la API
      await Promise.all(
        itemsToUpdate.map(async (id) => {
          const item = items.find(i => i.id === id);
          if (item) {
            await inventarioApi.actualizarInventarioItem(id, {
              espacioId: item.espacioId,
              tipoElementoId: item.tipoElementoId,
              cantidad: item.cantidad,
              estado: pendingBulkState,
              observaciones: item.observaciones
            });
          }
        })
      );
      
      toast.success(`Estado de ${itemsToUpdate.length} items actualizado a ${pendingBulkState}`);
      setSelectedItems(new Set());
      setShowBulkConfirm(false);
      setPendingBulkState(null);
      await fetchStatistics();
      await fetchItems(false);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'No se pudieron actualizar todos los items';
      toast.error('Error al actualizar estados', {
        description: errorMessage
      });
    } finally {
      setBulkProcessing(false);
    }
  };

  // Funciones para asignación masiva
  const handleBulkAssign = () => {
    setShowBulkAssignDialog(true);
  };

  const handleBulkUnassign = async () => {
    const itemsToUnassign = Array.from(selectedItems);
    
    try {
      setBulkProcessing(true);
      
      await Promise.all(
        itemsToUnassign.map(async (id) => {
          const item = items.find(i => i.id === id);
          if (item?.espacioId) {
            await inventarioApi.actualizarInventarioItem(id, {
              espacioId: 0, // Desasignar
              tipoElementoId: item.tipoElementoId,
              cantidad: item.cantidad,
              estado: item.estado,
              observaciones: item.observaciones
            });
          }
        })
      );
      
      toast.success(`${itemsToUnassign.length} items desasignados exitosamente`);
      setSelectedItems(new Set());
      await fetchItems(false);
      await fetchStatistics();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'No se pudieron desasignar todos los items';
      toast.error('Error al desasignar items', {
        description: errorMessage
      });
    } finally {
      setBulkProcessing(false);
    }
  };

  const handleBulkExport = async () => {
    const itemsToExport = items.filter(item => selectedItems.has(item.id));
    
    try {
      exportInventarioToCSV(itemsToExport);
      toast.success(`${itemsToExport.length} items exportados exitosamente`);
      setSelectedItems(new Set());
    } catch {
      toast.error('Error al exportar items');
    }
  };

  const handleBulkAssignConfirm = async () => {
    if (!bulkEspacio) {
      toast.error('Por favor selecciona un espacio');
      return;
    }

    const itemsToAssign = Array.from(selectedItems);
    
    try {
      setBulkProcessing(true);
      
      await Promise.all(
        itemsToAssign.map(async (id) => {
          const item = items.find(i => i.id === id);
          if (item) {
            await inventarioApi.actualizarInventarioItem(id, {
              espacioId: bulkEspacio,
              tipoElementoId: item.tipoElementoId,
              cantidad: item.cantidad,
              estado: item.estado,
              observaciones: item.observaciones
            });
          }
        })
      );
      
      const espacioNombre = espacios.find(e => e.id === bulkEspacio)?.nombre;
      toast.success(`${itemsToAssign.length} items asignados a ${espacioNombre} exitosamente`);
      setSelectedItems(new Set());
      setShowBulkAssignDialog(false);
      setBulkEspacio(null);
      await fetchItems(false);
      await fetchStatistics();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'No se pudieron asignar todos los items';
      toast.error('Error al asignar items', {
        description: errorMessage
      });
    } finally {
      setBulkProcessing(false);
    }
  };

  const clearSelectedItems = () => {
    setSelectedItems(new Set());
  };

  // Crear array de filtros activos
  const activeFilters: FilterItem[] = [
    filters.espacioId && {
      id: 'espacio',
      label: `Espacio: ${espacios.find(e => e.id === filters.espacioId)?.nombre || 'Desconocido'}`,
      value: filters.espacioId,
      onRemove: () => setFilters(prev => ({ ...prev, espacioId: undefined }))
    },
    filters.tipoElementoId && {
      id: 'tipo',
      label: `Tipo: ${tiposElemento.find(t => t.id === filters.tipoElementoId)?.nombre || 'Desconocido'}`,
      value: filters.tipoElementoId,
      onRemove: () => setFilters(prev => ({ ...prev, tipoElementoId: undefined }))
    },
    filters.estado && {
      id: 'estado',
      label: `Estado: ${filters.estado}`,
      value: filters.estado,
      onRemove: () => setFilters(prev => ({ ...prev, estado: undefined }))
    },
    filters.sinAsignar && {
      id: 'sinAsignar',
      label: 'Sin asignar',
      value: true,
      onRemove: () => setFilters(prev => ({ ...prev, sinAsignar: undefined }))
    }
  ].filter(Boolean) as FilterItem[];

  if (loading && items.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin mx-auto text-muted-foreground" />
          <p className="text-muted-foreground">Cargando inventario...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Acciones de página */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/rooms')}
            className="h-9"
          >
            <ArrowLeft className="h-4 w-4 mr-1.5" />
            Volver
          </Button>
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{totalElements}</span> items · administra el inventario del sistema
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
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

          <PermissionGuard requiredPermission="inventario:ver">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleExport}
                  aria-label="Exportar CSV"
                  className="h-9 w-9"
                >
                  <Download className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Exportar CSV</TooltipContent>
            </Tooltip>
          </PermissionGuard>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="h-9">
                Gestionar
                <ChevronDown className="h-4 w-4 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <PermissionGuard requiredPermission="inventario:crear">
                <DropdownMenuItem onClick={() => setImportDialog(true)}>
                  <Upload className="h-4 w-4 mr-2" />
                  Importar CSV
                </DropdownMenuItem>
              </PermissionGuard>
              <PermissionGuard requiredPermissions={['tipo:crear', 'tipo:editar']} requireAll={false}>
                <DropdownMenuItem onClick={() => setShowTiposManagement(true)}>
                  <Package className="h-4 w-4 mr-2" />
                  Gestionar Tipos
                </DropdownMenuItem>
              </PermissionGuard>
            </DropdownMenuContent>
          </DropdownMenu>

          <PermissionGuard requiredPermission="inventario:crear">
            <Button onClick={() => setCreateDialog(true)} className="h-9">
              <Plus className="h-4 w-4 mr-1.5" />
              Agregar Item
            </Button>
          </PermissionGuard>
        </div>
      </div>

      {/* Estadísticas */}
      <InventoryStatsCards statistics={statistics} />

      {/* Recomendaciones de Mantenimiento (solo para usuarios con permiso inventario:editar) */}
      {canManageInventory && <MantenimientoRecomendaciones />}

      {/* Recomendaciones de Reasignación (solo para usuarios con permiso inventario:editar) */}
      {canManageInventory && reasignaciones.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowRightLeft className="h-5 w-5 text-blue-600" />
              Reasignaciones Recomendadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {reasignaciones.slice(0, 5).map((rec) => (
                <button
                  type="button"
                  key={rec.id}
                  className="w-full text-left flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => {
                    if (rec.inventarioItemId) {
                      // Filtrar por itemId
                      setFilters(prev => ({ ...prev, itemId: rec.inventarioItemId }));
                    } else if (rec.espacioId) {
                      navigate(`/rooms/${rec.espacioId}`);
                    }
                  }}
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium">{rec.razon}</p>
                    {rec.metadata && (() => {
                      const meta = rec.metadata;
                      const itemNombre = meta.itemNombre as string | undefined;
                      const espacioActual = meta.espacioActual as string | undefined;
                      const espacioRecomendado = meta.espacioRecomendado as string | undefined;
                      return (itemNombre || espacioActual || espacioRecomendado) ? (
                        <p className="text-xs text-muted-foreground mt-1">
                          {itemNombre && `Item: ${itemNombre}`}
                          {espacioActual && ` • Espacio actual: ${espacioActual}`}
                          {espacioRecomendado && ` • Espacio recomendado: ${espacioRecomendado}`}
                        </p>
                      ) : null;
                    })()}
                  </div>
                  <span className="text-xs font-medium text-primary ml-2">
                    {(rec.puntaje * 100).toFixed(0)}%
                  </span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Inventario con filtros embebidos */}
      <div className="border rounded-lg shadow-card overflow-hidden bg-white">
        <div className="px-4 pt-4 pb-3">
          <div className="flex items-center gap-2 flex-wrap">
        <PopoverFilterSection<number>
          selectedId={filters.sinAsignar ? -1 : (filters.espacioId ?? null)}
          items={[
            { id: -1, primary: 'Sin asignar' },
            ...espacios.map(e => ({ id: e.id, primary: e.nombre })),
          ]}
          onChange={(value) => {
            setPage(0);
            setFilters(prev => {
              const next = { ...prev };
              delete next.sinAsignar;
              delete next.espacioId;
              if (value === -1) next.sinAsignar = true;
              else if (typeof value === 'number') next.espacioId = value;
              return next;
            });
          }}
          Icon={Building2}
          tooltipNone="Todos los espacios"
        />
        <PopoverFilterSection<number>
          selectedId={filters.tipoElementoId ?? null}
          items={tiposElemento.map(t => ({ id: t.id, primary: t.nombre }))}
          onChange={(value) =>
            handleFilterChange('tipoElementoId', value ?? undefined)
          }
          Icon={Tag}
          tooltipNone="Todos los tipos"
          activeBgClass="bg-purple-100 text-purple-900 shadow-md ring-1 ring-purple-300"
          activeTextColorClass="text-purple-700"
        />
        <EnumFilterSection
          value={filters.estado ?? null}
          options={[
            { value: null, tooltip: 'Todos los estados', Icon: Filter },
            {
              value: 'DISPONIBLE',
              tooltip: 'Disponible',
              Icon: CheckCircle2,
              activeColorClass: 'text-green-600',
              inactiveColorClass: 'text-green-500',
            },
            {
              value: 'MANTENIMIENTO',
              tooltip: 'En mantenimiento',
              Icon: Wrench,
              activeColorClass: 'text-amber-600',
              inactiveColorClass: 'text-amber-500',
            },
            {
              value: 'DANADO',
              tooltip: 'Dañado',
              Icon: XCircle,
              activeColorClass: 'text-red-600',
              inactiveColorClass: 'text-red-500',
            },
          ]}
          onChange={(value) =>
            handleFilterChange('estado', value ?? undefined)
          }
        />
        <Button
          type="button"
          variant="outline"
          onClick={() => setViewMode(prev => prev === 'table' ? 'cards' : 'table')}
          className="h-9 ml-auto"
          title={viewMode === 'table' ? 'Cambiar a vista de cards' : 'Cambiar a vista de tabla'}
        >
          {viewMode === 'table' ? <LayoutGrid className="h-4 w-4" /> : <LayoutList className="h-4 w-4" />}
        </Button>
          </div>
          {activeFilters.length > 0 && (
            <FilterBar
              filters={activeFilters}
              onClearAll={clearFilters}
              className="mt-3 animate-slide-up"
            />
          )}
          {selectedItems.size > 0 && (
            <div className="mt-3">
              <BulkActionsBar
                selectedCount={selectedItems.size}
                onBulkStateChange={handleBulkStateChange}
                onBulkAssign={handleBulkAssign}
                onBulkUnassign={handleBulkUnassign}
                onBulkExport={handleBulkExport}
                onClearSelection={clearSelectedItems}
              />
            </div>
          )}
        </div>

        {/* Tabla o Cards de inventario */}
        {(() => {
        if (loading) {
          return (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          );
        }
        if (sortedItems.length === 0) {
          return (
            <EmptyState
              icon={Package}
              title="No se encontraron items"
              description="No hay items que coincidan con los criterios de búsqueda"
              action={{
                label: 'Limpiar filtros',
                onClick: clearFilters
              }}
            />
          );
        }
        return (
        <>
          {viewMode === 'table' ? (
            <div className="px-4 pt-2">
              <InventoryTable
                items={sortedItems}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onAssign={handleAssign}
                onView={handleView}
                selectedItems={selectedItems}
                onToggleSelect={handleToggleSelect}
                sortConfig={sortConfig}
                onSort={handleSort}
              />
            </div>
          ) : (
            <div className="px-4 pt-2">
              <InventoryCardView
                items={sortedItems}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onAssign={handleAssign}
                onView={handleView}
                selectedItems={selectedItems}
                onToggleSelect={handleToggleSelect}
              />
            </div>
          )}

          {/* Paginación - siempre mostrar si hay totalPages */}
          {totalPages > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-3">
              <p className="text-sm text-muted-foreground">
                <span className="hidden sm:inline">
                  Mostrando {items.length} de {totalElements} items (Página {page + 1} de {totalPages})
                </span>
                <span className="sm:hidden">
                  Pág {page + 1}/{totalPages} ({items.length} de {totalElements})
                </span>
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={page === 0 || loading}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1 || loading}
                >
                  Siguiente
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </>
        );
        })()}
      </div>

      {/* Modales */}
      <InventoryFormDialog
        item={null}
        open={createDialog}
        onOpenChange={setCreateDialog}
        onSuccess={handleCreateSuccess}
      />

      <InventoryFormDialog
        item={selectedItem}
        open={editDialog}
        onOpenChange={setEditDialog}
        onSuccess={handleEditSuccess}
      />

      <DeleteInventoryDialog
        item={selectedItem}
        open={deleteDialog}
        onOpenChange={setDeleteDialog}
        onSuccess={handleDeleteSuccess}
      />

      <InventoryDetailsDialog
        item={selectedItem}
        open={detailsDialog}
        onOpenChange={setDetailsDialog}
      />

      <AssignSpaceDialog
        item={selectedItem}
        open={assignDialog}
        onOpenChange={setAssignDialog}
        onSuccess={handleAssignSuccess}
      />

      <ImportCSVDialog
        open={importDialog}
        onOpenChange={setImportDialog}
        onSuccess={async () => {
          await Promise.all([fetchItems(), fetchStatistics()]);
          toast.success('Inventario importado exitosamente');
        }}
      />

      {/* Confirmación de cambio masivo de estado */}
      <AlertDialog open={showBulkConfirm} onOpenChange={setShowBulkConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar cambio masivo de estado</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que deseas cambiar el estado de {selectedItems.size} item{selectedItems.size === 1 ? '' : 's'} a{' '}
              <strong>{pendingBulkState}</strong>?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={bulkProcessing}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmBulkStateChange}
              disabled={bulkProcessing}
            >
              {bulkProcessing && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Diálogo de asignación masiva */}
      <Dialog open={showBulkAssignDialog} onOpenChange={setShowBulkAssignDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Asignar Espacio</DialogTitle>
            <DialogDescription>
              Selecciona el espacio para {selectedItems.size} item{selectedItems.size === 1 ? 's' : 's seleccionado'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="bulk-espacio">Espacio *</Label>
              <Select
                value={bulkEspacio?.toString() || "seleccionar"}
                onValueChange={(value) => {
                  if (value !== "seleccionar") {
                    setBulkEspacio(Number.parseInt(value));
                  }
                }}
              >
                <SelectTrigger id="bulk-espacio" className="w-full">
                  <SelectValue placeholder="Seleccionar espacio" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="seleccionar" disabled>Seleccionar</SelectItem>
                  {espacios.map((espacio) => (
                    <SelectItem key={espacio.id} value={espacio.id.toString()}>
                      {espacio.nombre} (Capacidad: {espacio.capacidad})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setShowBulkAssignDialog(false)}
              disabled={bulkProcessing}
            >
              Cancelar
            </Button>
            <Button onClick={handleBulkAssignConfirm} disabled={bulkProcessing || !bulkEspacio}>
              {bulkProcessing && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Asignar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <TipoElementoManagement
        open={showTiposManagement}
        onOpenChange={setShowTiposManagement}
        onSuccess={() => {
          refreshTiposElemento(); // Recargar tipos cuando cambian
        }}
      />
    </div>
  );
}
