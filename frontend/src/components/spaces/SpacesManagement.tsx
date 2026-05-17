import { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SpaceCard } from './SpaceCard';
import { SpaceCardSkeleton } from './SpaceCardSkeleton';
import { SpaceTable } from './SpaceTable';
import { SpaceFormDialog } from './SpaceFormDialog';
import { DeleteSpaceDialog } from './DeleteSpaceDialog';
import { TipoEspacioManagement } from './TipoEspacioManagement';
import { FilterBar } from "@/components/ui/filter-bar";
import type { FilterItem } from "@/components/ui/filter-bar";
import { EmptyState } from "@/components/ui/empty-state";
import { FiltersPanel, type FilterField } from "@/components/common/FiltersPanel";
import {
  PopoverFilterSection,
  EnumFilterSection,
  ClearFiltersButton,
} from "@/components/ui/compact-filter";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { espaciosApi } from '@/lib/api/spaces';
import { useTiposElemento } from '@/hooks/useTiposElemento';
import type { Espacio, TipoEspacio, EspacioFilters, FiltroInventario, Edificio } from '@/lib/types/spaces';
import { 
  Plus,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Loader2,
  RefreshCw,
  Building2,
  Download,
  Package,
  ClipboardList,
  X,
  LayoutGrid,
  LayoutList,
  Tag,
  CheckCircle2,
  Wrench,
  XCircle,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { exportEspaciosToCSV } from '@/lib/utils/csv-export';
import PermissionGuard from '@/components/auth/PermissionGuard';
import { useRolePermissions } from '@/hooks/useRolePermissions';
import { usePreferences } from '@/hooks/usePreferences';

// Describe el rango de cantidad para el resumen de un filtro de inventario
function describirCantidadFiltro(min?: number, max?: number): string {
  if (min !== undefined && max !== undefined) return `entre ${min} y ${max}`;
  if (min !== undefined) return `al menos ${min}`;
  if (max !== undefined) return `máximo ${max}`;
  return 'cualquier cantidad de';
}

export default function SpacesManagement() {
  const navigate = useNavigate();
  const { preferencias } = usePreferences();
  
  // Estados principales
  const [espacios, setEspacios] = useState<Espacio[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const pageSize = preferencias?.espaciosPageSize || 12;
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filters, setFilters] = useState<EspacioFilters>({});
  const [tiposEspacio, setTiposEspacio] = useState<TipoEspacio[]>([]);
  const { tiposElemento } = useTiposElemento();
  const [edificios, setEdificios] = useState<Edificio[]>([]);
  const [filtrosInventario, setFiltrosInventario] = useState<FiltroInventario[]>([]);
  
  // Estados de filtros
  const [searchInput, setSearchInput] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  
  // Estados de visualización - desde preferencias
  const preferenciaViewMode = preferencias?.espaciosViewMode;
  const [viewMode, setViewMode] = useState<'table' | 'cards'>(preferenciaViewMode || 'cards');

  // Aplicar preferencias cuando se carguen
  useEffect(() => {
    if (preferencias?.espaciosViewMode) {
      setViewMode(preferencias.espaciosViewMode);
    }
  }, [preferencias]);
  const [sortConfig, setSortConfig] = useState<{ column: string | null; direction: 'asc' | 'desc' }>({ 
    column: 'nombre', 
    direction: 'asc' 
  });
  
  // Modales
  const [createDialog, setCreateDialog] = useState(false);
  const [editDialog, setEditDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [selectedSpace, setSelectedSpace] = useState<Espacio | null>(null);
  const [showTiposManagement, setShowTiposManagement] = useState(false);

  const fetchEspacios = useCallback(async () => {
    try {
      setLoading(true);
      
      // Combinar filtros básicos con filtros de inventario
      const filtrosCompletos: EspacioFilters = {
        ...filters,
        filtrosInventario: filtrosInventario.length > 0 ? filtrosInventario : undefined
      };
      
      // Si hay filtros activos, usar el endpoint de filtros
      const hasActiveFilters = filtrosCompletos.search || filtrosCompletos.tipoEspacioId || 
                               filtrosCompletos.edificioId || filtrosCompletos.capacidadMin || 
                               filtrosCompletos.capacidadMax || filtrosCompletos.estado || 
                               filtrosCompletos.filtrosInventario;
      
      if (hasActiveFilters) {
        const response = await espaciosApi.filtrarEspacios(filtrosCompletos);
        const espaciosData = response.data || [];
        
        if (Array.isArray(espaciosData)) {
          setEspacios(espaciosData);
          setTotalPages(1); // Sin paginación cuando hay filtros
          setTotalElements(espaciosData.length);
        }
      } else {
        // Sin filtros, usar paginación normal
        const response = await espaciosApi.listarEspacios(page, pageSize, filtrosCompletos);
        const pagedData = response.data;
        
        if (pagedData?.content) {
          setEspacios(pagedData.content);
          setTotalPages(pagedData.totalPages);
          setTotalElements(pagedData.totalElements);
        }
      }
    } catch (error: unknown) {
      console.error('Error al cargar espacios:', error);
      const errorMessage = error instanceof Error ? error.message : 'No se pudo cargar la lista de espacios';
      toast.error('Error al cargar espacios', {
        description: errorMessage
      });
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, filters, filtrosInventario]);

  // Cargar datos iniciales
  useEffect(() => {
    fetchEspacios();
    fetchTiposEspacio();
    fetchEdificios();
  }, [fetchEspacios]);

  const fetchTiposEspacio = async () => {
    try {
      const response = await espaciosApi.listarTiposEspacio();
      if (response.data) {
        setTiposEspacio(response.data);
      }
    } catch (error) {
      console.error('Error al cargar tipos de espacio:', error);
    }
  };

  const fetchEdificios = async () => {
    try {
      const response = await espaciosApi.listarEdificios();
      if (response.data) {
        setEdificios(response.data);
      }
    } catch (error) {
      console.error('Error al cargar edificios:', error);
    }
  };

  // Debouncer para búsqueda
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(0);
      setFilters(prev => ({ ...prev, search: searchInput || undefined }));
    }, 500);

    return () => clearTimeout(timer);
  }, [searchInput]);

  const handleTipoEspacioFilter = (tipoId: string) => {
    setPage(0);
    setFilters(prev => ({ 
      ...prev, 
      tipoEspacioId: tipoId === 'all' ? undefined : Number.parseInt(tipoId)
    }));
  };

  const handleCapacidadMinFilter = (value: string) => {
    setPage(0);
    setFilters(prev => ({ 
      ...prev, 
      capacidadMin: value ? Number.parseInt(value) : undefined 
    }));
  };

  const handleCapacidadMaxFilter = (value: string) => {
    setPage(0);
    setFilters(prev => ({ 
      ...prev, 
      capacidadMax: value ? Number.parseInt(value) : undefined 
    }));
  };

  const handleEstadoFilter = (value: string) => {
    setPage(0);
    setFilters(prev => ({ 
      ...prev, 
      estado: value === 'all' ? undefined : (value as 'DISPONIBLE' | 'MANTENIMIENTO' | 'NO_DISPONIBLE')
    }));
  };

  const handleEdificioFilter = (edificioId: string) => {
    setPage(0);
    setFilters(prev => ({ 
      ...prev, 
      edificioId: edificioId === 'all' ? undefined : Number.parseInt(edificioId)
    }));
  };


  const handleRefresh = async () => {
    setIsRefreshing(true);
    const startTime = Date.now();
    
    await fetchEspacios();
    toast.success('Lista actualizada');
    
    // Asegurar que la animación complete al menos 600ms
    const elapsed = Date.now() - startTime;
    const remaining = Math.max(0, 600 - elapsed);
    
    setTimeout(() => {
      setIsRefreshing(false);
    }, remaining);
  };

  const clearFilters = () => {
    setSearchInput('');
    setFilters({});
    setFiltrosInventario([]);
    setPage(0);
    toast.info('Filtros limpiados');
  };

  const handleExport = async () => {
    try {
      // Combinar filtros básicos con filtros de inventario
      const filtrosCompletos: EspacioFilters = {
        ...filters,
        filtrosInventario: filtrosInventario.length > 0 ? filtrosInventario : undefined
      };
      
      // Verificar si hay filtros activos
      const hasActiveFilters = filtrosCompletos.search || filtrosCompletos.tipoEspacioId || 
                               filtrosCompletos.edificioId || filtrosCompletos.capacidadMin || 
                               filtrosCompletos.capacidadMax || filtrosCompletos.filtrosInventario;
      
      let espaciosParaExportar: Espacio[];
      
      if (hasActiveFilters) {
        // Si hay filtros activos, usar el endpoint de filtros
        const response = await espaciosApi.filtrarEspacios(filtrosCompletos);
        espaciosParaExportar = response.data || [];
      } else {
        // Sin filtros, obtener todos los espacios sin paginación
        const response = await espaciosApi.obtenerEspacios();
        espaciosParaExportar = response.data || [];
      }
      
      if (!espaciosParaExportar || espaciosParaExportar.length === 0) {
        toast.info('No hay espacios para exportar');
        return;
      }
      
      exportEspaciosToCSV(espaciosParaExportar);
      toast.success(`${espaciosParaExportar.length} espacios exportados exitosamente`);
    } catch (error: unknown) {
      console.error('Error al exportar:', error);
      const errorMessage = error instanceof Error ? error.message : 'No se pudo exportar los espacios';
      toast.error('Error al exportar espacios', {
        description: errorMessage
      });
    }
  };

  // Funciones para manejar filtros de inventario
  const agregarFiltroInventario = () => {
    const nuevoFiltro: FiltroInventario = {
      tipoElementoId: 0,
      cantidadMin: undefined,
      cantidadMax: undefined
    };
    setFiltrosInventario([...filtrosInventario, nuevoFiltro]);
  };

  const eliminarFiltroInventario = useCallback((index: number) => {
    setFiltrosInventario(prev => prev.filter((_, i) => i !== index));
  }, []);

  const actualizarFiltroInventario = useCallback((index: number, campo: keyof FiltroInventario, valor: number | undefined) => {
    setFiltrosInventario(prev => {
      const nuevosFiltros = [...prev];
      nuevosFiltros[index] = { ...nuevosFiltros[index], [campo]: valor };
      return nuevosFiltros;
    });
  }, []);

  const obtenerNombreTipoElemento = useCallback((tipoElementoId: number) => {
    const tipo = tiposElemento.find(t => t.id === tipoElementoId);
    return tipo?.nombre || 'Tipo desconocido';
  }, [tiposElemento]);

  const handleCreateSuccess = (newSpace: Espacio) => {
    setEspacios(prev => [newSpace, ...prev]);
    setTotalElements(prev => prev + 1);
  };

  const handleEditSuccess = (updatedSpace: Espacio) => {
    setEspacios(prev => {
      // Mantener la posición del elemento actualizado en la lista
      const index = prev.findIndex(space => space.id === updatedSpace.id);
      if (index !== -1) {
        const newEspacios = [...prev];
        newEspacios[index] = updatedSpace;
        return newEspacios;
      }
      // Si no se encuentra, actualizar normalmente
      return prev.map(space => space.id === updatedSpace.id ? updatedSpace : space);
    });
  };

  const handleDeleteSuccess = () => {
    setEspacios(prev => prev.filter(space => space.id !== selectedSpace?.id));
    setTotalElements(prev => prev - 1);
  };

  const handleEdit = (espacio: Espacio) => {
    setSelectedSpace(espacio);
    setEditDialog(true);
  };

  const handleDelete = (espacio: Espacio) => {
    setSelectedSpace(espacio);
    setDeleteDialog(true);
  };

  const handleSort = (column: string) => {
    setSortConfig(prev => {
      if (prev.column === column) {
        return {
          column,
          direction: prev.direction === 'asc' ? 'desc' : 'asc'
        };
      }
      return { column, direction: 'asc' };
    });
  };

  // Aplicar ordenamiento a los espacios
  const sortedEspacios = useMemo(() => {
    const sorted = [...espacios];
    
    // Si no hay columna de ordenamiento, ordenar por nombre por defecto
    const columnToSort = sortConfig.column || 'nombre';
    const directionToSort = sortConfig.column ? sortConfig.direction : 'asc';
    
    sorted.sort((a, b) => {
      let aValue: string | number | boolean;
      let bValue: string | number | boolean;
      
      switch (columnToSort) {
        case 'id':
          aValue = a.id;
          bValue = b.id;
          break;
        case 'tipo':
          aValue = (a.tipoEspacioNombre || '').toLowerCase();
          bValue = (b.tipoEspacioNombre || '').toLowerCase();
          break;
        case 'capacidad':
          aValue = a.capacidad;
          bValue = b.capacidad;
          break;
        case 'activo':
          aValue = a.activo;
          bValue = b.activo;
          break;
        case 'nombre':
        default:
          // Por defecto, ordenar por nombre
          aValue = a.nombre.toLowerCase();
          bValue = b.nombre.toLowerCase();
      }
      
      if (aValue < bValue) return directionToSort === 'asc' ? -1 : 1;
      if (aValue > bValue) return directionToSort === 'asc' ? 1 : -1;
      return 0;
    });
    
    return sorted;
  }, [espacios, sortConfig]);

  const { canEdit: canEditResource } = useRolePermissions();
  const canEdit = canEditResource('espacio');

  // Crear array de filtros activos para FilterBar
  const activeFilters: FilterItem[] = useMemo(() => {
    const items: FilterItem[] = [];
    
    if (filters.search) {
      items.push({
        id: 'search',
        label: `Búsqueda: ${filters.search}`,
        value: filters.search,
        onRemove: () => {
          setSearchInput('');
          setFilters(prev => ({ ...prev, search: undefined }));
        }
      });
    }
    
    if (filters.tipoEspacioId) {
      const tipo = tiposEspacio.find(t => t.id === filters.tipoEspacioId);
      items.push({
        id: 'tipoEspacio',
        label: `Tipo: ${tipo?.nombre || 'Desconocido'}`,
        value: filters.tipoEspacioId,
        onRemove: () => setFilters(prev => ({ ...prev, tipoEspacioId: undefined }))
      });
    }
    
    if (filters.edificioId) {
      const edificio = edificios.find(e => e.id === filters.edificioId);
      items.push({
        id: 'edificio',
        label: `Edificio: ${edificio?.nombre || 'Desconocido'}`,
        value: filters.edificioId,
        onRemove: () => setFilters(prev => ({ ...prev, edificioId: undefined }))
      });
    }
    
    if (filters.capacidadMin) {
      items.push({
        id: 'capacidadMin',
        label: `Capacidad mín: ${filters.capacidadMin}`,
        value: filters.capacidadMin,
        onRemove: () => setFilters(prev => ({ ...prev, capacidadMin: undefined }))
      });
    }
    
    if (filters.capacidadMax) {
      items.push({
        id: 'capacidadMax',
        label: `Capacidad máx: ${filters.capacidadMax}`,
        value: filters.capacidadMax,
        onRemove: () => setFilters(prev => ({ ...prev, capacidadMax: undefined }))
      });
    }
    
    if (filters.estado) {
      const estadoLabels: Record<string, string> = {
        'DISPONIBLE': 'Disponible',
        'MANTENIMIENTO': 'En Mantenimiento',
        'NO_DISPONIBLE': 'No Disponible'
      };
      items.push({
        id: 'estado',
        label: `Estado: ${estadoLabels[filters.estado] || filters.estado}`,
        value: filters.estado,
        onRemove: () => setFilters(prev => ({ ...prev, estado: undefined }))
      });
    }
    
    // Agregar filtros de inventario
    const obtenerCantidadText = (min?: number, max?: number): string => {
      if (min !== undefined && max !== undefined) return `entre ${min}-${max}`;
      if (min !== undefined) return `mín ${min}`;
      if (max !== undefined) return `máx ${max}`;
      return 'cualquier cantidad';
    };
    filtrosInventario.forEach((filtro, index) => {
      if (filtro.tipoElementoId > 0) {
        const tipoNombre = obtenerNombreTipoElemento(filtro.tipoElementoId);
        const cantidadText = obtenerCantidadText(filtro.cantidadMin, filtro.cantidadMax);
        
        items.push({
          id: `inventario-${index}`,
          label: `Inventario: ${tipoNombre} (${cantidadText})`,
          value: filtro,
          onRemove: () => eliminarFiltroInventario(index)
        });
      }
    });
    
    return items;
  }, [filters, tiposEspacio, edificios, filtrosInventario, eliminarFiltroInventario, obtenerNombreTipoElemento]);

  if (loading && espacios.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin mx-auto text-muted-foreground" />
          <p className="text-muted-foreground">Cargando espacios...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Acciones de página */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{totalElements}</span> espacios · administra los espacios disponibles
        </p>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Acciones utilitarias */}
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

          <PermissionGuard requiredPermission="espacio:ver">
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

          {/* Acciones secundarias en dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="h-9">
                Gestionar
                <ChevronDown className="h-4 w-4 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => navigate('/inventory')}>
                <Package className="h-4 w-4 mr-2" />
                Gestionar Inventario
              </DropdownMenuItem>
              <PermissionGuard requiredPermission="solicitud_inventario:ver">
                <DropdownMenuItem onClick={() => navigate('/inventory/requests')}>
                  <ClipboardList className="h-4 w-4 mr-2" />
                  Solicitudes de Inventario
                </DropdownMenuItem>
              </PermissionGuard>
              <PermissionGuard requiredPermissions={['espacio:crear', 'tipo:crear']} requireAll={false}>
                <DropdownMenuItem onClick={() => setShowTiposManagement(true)}>
                  <Building2 className="h-4 w-4 mr-2" />
                  Tipos de Espacios
                </DropdownMenuItem>
              </PermissionGuard>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Acción principal */}
          <PermissionGuard requiredPermission="espacio:crear">
            <Button onClick={() => setCreateDialog(true)} className="h-9">
              <Plus className="h-4 w-4 mr-1.5" />
              Agregar Espacio
            </Button>
          </PermissionGuard>
        </div>
      </div>

      {/* Espacios con filtros embebidos */}
      <div className="border rounded-lg shadow-card overflow-hidden bg-white">
        <div className="px-4 pt-4 pb-3">
          <div className="space-y-2">
            <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center">
              {/* Campo de búsqueda principal */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Buscar por nombre de espacio..."
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Filtros compactos estilo Reservas */}
              <div className="flex items-center gap-2 flex-wrap">
                <PopoverFilterSection<number>
                  selectedId={filters.tipoEspacioId ?? null}
                  items={tiposEspacio.map(t => ({
                    id: t.id,
                    primary: t.nombre,
                    swatchColor: t.color,
                  }))}
                  onChange={(v) => handleTipoEspacioFilter(v === null ? 'all' : String(v))}
                  Icon={Tag}
                  tooltipNone="Todos los tipos"
                  activeBgClass="bg-purple-100 text-purple-900 shadow-md ring-1 ring-purple-300"
                  activeTextColorClass="text-purple-700"
                />
                <PopoverFilterSection<number>
                  selectedId={filters.edificioId ?? null}
                  items={edificios.map(e => ({ id: e.id, primary: e.nombre }))}
                  onChange={(v) => handleEdificioFilter(v === null ? 'all' : String(v))}
                  Icon={Building2}
                  tooltipNone="Todos los edificios"
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
                      value: 'NO_DISPONIBLE',
                      tooltip: 'No disponible',
                      Icon: XCircle,
                      activeColorClass: 'text-red-600',
                      inactiveColorClass: 'text-red-500',
                    },
                  ]}
                  onChange={(v) => handleEstadoFilter(v ?? 'all')}
                />
                <ClearFiltersButton
                  visible={activeFilters.length > 0}
                  onClear={clearFilters}
                />
                {/* Toggle para filtros avanzados (capacidad + inventario) */}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                  className={`h-9 ${
                    showFilters ? 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100' : ''
                  }`}
                  title="Filtros avanzados (capacidad e inventario)"
                >
                  <Filter className="h-3.5 w-3.5 mr-1.5" />
                  Avanzados
                </Button>
                {/* Switch de vista (cards / tabla) */}
                <div className="flex items-center border rounded-md bg-white h-9 p-0.5 ml-auto flex-shrink-0">
                  <Button
                    variant={viewMode === 'cards' ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('cards')}
                    className="h-8 px-2.5"
                    aria-label="Vista de tarjetas"
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'table' ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('table')}
                    className="h-8 px-2.5"
                    aria-label="Vista de tabla"
                  >
                    <LayoutList className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Panel expandible: filtros menos frecuentes (capacidad + inventario).
                Tipo/Edificio/Estado se manejan arriba en la fila compacta. */}
            {(() => {
              const filterFields: FilterField[] = [
                {
                  id: 'capacidad-min-filter',
                  label: 'Capacidad Mínima',
                  type: 'number',
                  value: filters.capacidadMin,
                  placeholder: 'Ej: 10',
                  onChange: (value) => handleCapacidadMinFilter(value)
                },
                {
                  id: 'capacidad-max-filter',
                  label: 'Capacidad Máxima',
                  type: 'number',
                  value: filters.capacidadMax,
                  placeholder: 'Ej: 50',
                  onChange: (value) => handleCapacidadMaxFilter(value)
                }
              ];

              const additionalContent = (
                <>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-medium text-gray-900">Filtros por Inventario</h4>
                      {filtrosInventario.length === 0 && (
                        <span className="text-xs text-muted-foreground">Sin filtros</span>
                      )}
                    </div>
                    <Button 
                      onClick={agregarFiltroInventario} 
                      variant="outline" 
                      size="sm"
                      className="h-7 px-2"
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Agregar
                    </Button>
                  </div>

                  {filtrosInventario.length > 0 && (
                    <div className="space-y-3">
                      {filtrosInventario.map((filtro, index) => (
                        <div key={`filtro-${filtro.tipoElementoId}-${index}`} className="border rounded-lg p-3 space-y-2">
                          <div className="flex items-center justify-between">
                            <Badge variant="outline" className="text-xs">
                              Filtro {index + 1}
                            </Badge>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => eliminarFiltroInventario(index)}
                              className="h-5 w-5 p-0 text-red-500 hover:text-red-700"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>

                          <div className="grid gap-2 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
                            {/* Tipo de Elemento */}
                            <div>
                              <Label className="text-xs block mb-1">Tipo de Elemento</Label>
                              <Select 
                                value={filtro.tipoElementoId === 0 ? "0" : filtro.tipoElementoId.toString()} 
                                onValueChange={(value) => actualizarFiltroInventario(index, 'tipoElementoId', Number.parseInt(value))}
                              >
                                <SelectTrigger className="h-8">
                                  <SelectValue placeholder="Selecciona tipo" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="0" disabled>Selecciona tipo</SelectItem>
                                  {tiposElemento.map(tipo => (
                                    <SelectItem key={tipo.id} value={tipo.id.toString()}>
                                      {tipo.nombre}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                            {/* Cantidad Mínima */}
                            <div>
                              <Label className="text-xs block mb-1">Cantidad Mínima</Label>
                              <Input
                                type="number"
                                min="0"
                                placeholder="Ej: 10"
                                value={filtro.cantidadMin || ''}
                                onChange={(e) => actualizarFiltroInventario(index, 'cantidadMin', e.target.value ? Number.parseInt(e.target.value) : undefined)}
                                className="h-8"
                              />
                            </div>

                            {/* Cantidad Máxima */}
                            <div>
                              <Label className="text-xs block mb-1">Cantidad Máxima</Label>
                              <Input
                                type="number"
                                min="0"
                                placeholder="Ej: 50"
                                value={filtro.cantidadMax || ''}
                                onChange={(e) => actualizarFiltroInventario(index, 'cantidadMax', e.target.value ? Number.parseInt(e.target.value) : undefined)}
                                className="h-8"
                              />
                            </div>
                          </div>

                          {/* Resumen del filtro */}
                          {filtro.tipoElementoId > 0 && (
                            <div className="text-xs text-muted-foreground bg-gray-50 p-2 rounded">
                              <strong>Filtro:</strong> Espacios que tengan{' '}
                              {describirCantidadFiltro(filtro.cantidadMin, filtro.cantidadMax)}{' '}
                              <strong>{obtenerNombreTipoElemento(filtro.tipoElementoId)}</strong>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </>
              );

              return (
                <FiltersPanel 
                  showFilters={showFilters} 
                  fields={filterFields}
                  additionalContent={additionalContent}
                />
              );
            })()}
          </div>
          {activeFilters.length > 0 && (
            <FilterBar
              filters={activeFilters}
              onClearAll={clearFilters}
              className="mt-3 animate-slide-up"
            />
          )}
        </div>

        {/* Vista de espacios */}
        {(() => {
        if (loading) {
          if (viewMode === 'cards') {
            return (
              <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {Array.from({ length: pageSize }, (_, index) => `space-skeleton-${index}`).map((skeletonKey) => (
                  <SpaceCardSkeleton key={skeletonKey} />
                ))}
              </div>
            );
          }
          return (
            <div className="border rounded-lg shadow-card p-8">
              <div className="space-y-3">
                {Array.from({ length: 5 }, (_, index) => `row-skeleton-${index}`).map((skeletonKey) => (
                  <div key={skeletonKey} className="h-16 bg-gray-100 animate-pulse rounded" />
                ))}
              </div>
            </div>
          );
        }
        if (sortedEspacios.length === 0) {
          return (
            <EmptyState
              icon={Building2}
              title="No se encontraron espacios"
              description="No hay espacios que coincidan con los criterios de búsqueda"
              action={{
                label: 'Limpiar filtros',
                onClick: clearFilters
              }}
            />
          );
        }
        return (
        <>
          {viewMode === 'cards' ? (
            <div className="px-4 pt-2 grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {sortedEspacios.map((espacio) => (
                <SpaceCard
                  key={espacio.id}
                  espacio={espacio}
                  canEdit={canEdit}
                  onEdit={handleEdit}
                />
              ))}
            </div>
          ) : (
            <div className="px-4 pt-2">
              <SpaceTable
                espacios={sortedEspacios}
                onEdit={handleEdit}
                onDelete={canEdit ? handleDelete : undefined}
                sortConfig={sortConfig}
                onSort={handleSort}
              />
            </div>
          )}

          {/* Paginación */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-3">
            <p className="text-sm text-muted-foreground">
              <span className="hidden sm:inline">
                Mostrando {sortedEspacios.length} de {totalElements} espacios (Página {page + 1} de {totalPages})
              </span>
              <span className="sm:hidden">
                Pág {page + 1}/{totalPages} ({sortedEspacios.length} de {totalElements})
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
        </>
        );
      })()}
      </div>

      {/* Modales */}
      <SpaceFormDialog
        espacio={null}
        open={createDialog}
        onOpenChange={setCreateDialog}
        onSuccess={handleCreateSuccess}
      />

      <SpaceFormDialog
        espacio={selectedSpace}
        open={editDialog}
        onOpenChange={setEditDialog}
        onSuccess={handleEditSuccess}
      />

      <DeleteSpaceDialog
        espacio={selectedSpace}
        open={deleteDialog}
        onOpenChange={setDeleteDialog}
        onSuccess={handleDeleteSuccess}
      />

      <TipoEspacioManagement
        open={showTiposManagement}
        onOpenChange={setShowTiposManagement}
        onSuccess={() => {
          fetchTiposEspacio(); // Recargar tipos cuando cambian
        }}
      />
    </div>
  );
}
