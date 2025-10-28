import { useState, useEffect, useMemo } from 'react';
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
import { espaciosApi } from '@/lib/api/spaces';
import type { Espacio, TipoEspacio, EspacioFilters, FiltroInventario, TipoElemento } from '@/lib/types/spaces';
import { 
  Plus, 
  Search, 
  Filter, 
  ChevronLeft, 
  ChevronRight, 
  Loader2, 
  RefreshCw, 
  Building2, 
  Download,
  Package,
  X,
  LayoutGrid,
  LayoutList
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { exportEspaciosToCSV } from '@/lib/utils/csv-export';

export default function SpacesManagement() {
  const navigate = useNavigate();
  
  // Estados principales
  const [espacios, setEspacios] = useState<Espacio[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [pageSize] = useState(12);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filters, setFilters] = useState<EspacioFilters>({});
  const [tiposEspacio, setTiposEspacio] = useState<TipoEspacio[]>([]);
  const [tiposElemento, setTiposElemento] = useState<TipoElemento[]>([]);
  const [filtrosInventario, setFiltrosInventario] = useState<FiltroInventario[]>([]);
  
  // Estados de filtros
  const [searchInput, setSearchInput] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  
  // Estados de visualización
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('cards');
  const [sortConfig, setSortConfig] = useState<{ column: string | null; direction: 'asc' | 'desc' }>({ 
    column: null, 
    direction: 'asc' 
  });
  
  // Modales
  const [createDialog, setCreateDialog] = useState(false);
  const [editDialog, setEditDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [selectedSpace, setSelectedSpace] = useState<Espacio | null>(null);
  const [showTiposManagement, setShowTiposManagement] = useState(false);

  // Cargar datos iniciales
  useEffect(() => {
    fetchEspacios();
    fetchTiposEspacio();
    fetchTiposElemento();
  }, [page, filters, filtrosInventario]);

  const fetchEspacios = async () => {
    try {
      setLoading(true);
      
      // Combinar filtros básicos con filtros de inventario
      const filtrosCompletos: EspacioFilters = {
        ...filters,
        filtrosInventario: filtrosInventario.length > 0 ? filtrosInventario : undefined
      };
      
      // Si hay filtros activos, usar el endpoint de filtros
      const hasActiveFilters = filtrosCompletos.search || filtrosCompletos.tipoEspacioId || 
                               filtrosCompletos.capacidadMin || filtrosCompletos.capacidadMax ||
                               filtrosCompletos.filtrosInventario;
      
      if (hasActiveFilters) {
        const response = await espaciosApi.filtrarEspacios(filtrosCompletos);
        const espaciosData: any = response.data || response;
        
        if (Array.isArray(espaciosData)) {
          setEspacios(espaciosData);
          setTotalPages(1); // Sin paginación cuando hay filtros
          setTotalElements(espaciosData.length);
        }
      } else {
        // Sin filtros, usar paginación normal
        const response = await espaciosApi.listarEspacios(page, pageSize, filtrosCompletos);
        const pagedData: any = response.data || response;
        
        if (pagedData?.content) {
          setEspacios(pagedData.content);
          setTotalPages(pagedData.totalPages);
          setTotalElements(pagedData.totalElements);
        }
      }
    } catch (error: any) {
      console.error('Error al cargar espacios:', error);
      toast.error('Error al cargar espacios', {
        description: error.message || 'No se pudo cargar la lista de espacios'
      });
    } finally {
      setLoading(false);
    }
  };

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

  const fetchTiposElemento = async () => {
    try {
      const response = await espaciosApi.listarTiposElemento();
      if (response.data) {
        setTiposElemento(response.data);
      }
    } catch (error) {
      console.error('Error al cargar tipos de elemento:', error);
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
      tipoEspacioId: tipoId === 'all' ? undefined : parseInt(tipoId)
    }));
  };

  const handleCapacidadMinFilter = (value: string) => {
    setPage(0);
    setFilters(prev => ({ 
      ...prev, 
      capacidadMin: value ? parseInt(value) : undefined 
    }));
  };

  const handleCapacidadMaxFilter = (value: string) => {
    setPage(0);
    setFilters(prev => ({ 
      ...prev, 
      capacidadMax: value ? parseInt(value) : undefined 
    }));
  };

  const handleEstadoFilter = (value: string) => {
    setPage(0);
    setFilters(prev => ({ 
      ...prev, 
      estado: value !== 'all' ? (value as 'DISPONIBLE' | 'MANTENIMIENTO' | 'NO_DISPONIBLE') : undefined 
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
                               filtrosCompletos.capacidadMin || filtrosCompletos.capacidadMax ||
                               filtrosCompletos.filtrosInventario;
      
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
    } catch (error: any) {
      console.error('Error al exportar:', error);
      toast.error('Error al exportar espacios', {
        description: error.message || 'No se pudo exportar los espacios'
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

  const eliminarFiltroInventario = (index: number) => {
    const nuevosFiltros = filtrosInventario.filter((_, i) => i !== index);
    setFiltrosInventario(nuevosFiltros);
  };

  const actualizarFiltroInventario = (index: number, campo: keyof FiltroInventario, valor: any) => {
    const nuevosFiltros = [...filtrosInventario];
    nuevosFiltros[index] = { ...nuevosFiltros[index], [campo]: valor };
    setFiltrosInventario(nuevosFiltros);
  };

  const obtenerNombreTipoElemento = (tipoElementoId: number) => {
    const tipo = tiposElemento.find(t => t.id === tipoElementoId);
    return tipo?.nombre || 'Tipo desconocido';
  };

  const handleCreateSuccess = (newSpace: Espacio) => {
    setEspacios(prev => [newSpace, ...prev]);
    setTotalElements(prev => prev + 1);
  };

  const handleEditSuccess = (updatedSpace: Espacio) => {
    setEspacios(prev => 
      prev.map(space => space.id === updatedSpace.id ? updatedSpace : space)
    );
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
    if (!sortConfig.column) return espacios;
    
    const sorted = [...espacios];
    sorted.sort((a, b) => {
      let aValue: any;
      let bValue: any;
      
      switch (sortConfig.column) {
        case 'id':
          aValue = a.id;
          bValue = b.id;
          break;
        case 'nombre':
          aValue = a.nombre.toLowerCase();
          bValue = b.nombre.toLowerCase();
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
        default:
          return 0;
      }
      
      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
    
    return sorted;
  }, [espacios, sortConfig]);

  const canEdit = true; // TODO: Implementar verificación de permisos

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
    filtrosInventario.forEach((filtro, index) => {
      if (filtro.tipoElementoId > 0) {
        const tipoNombre = obtenerNombreTipoElemento(filtro.tipoElementoId);
        const cantidadText = filtro.cantidadMin !== undefined && filtro.cantidadMax !== undefined
          ? `entre ${filtro.cantidadMin}-${filtro.cantidadMax}`
          : filtro.cantidadMin !== undefined
          ? `mín ${filtro.cantidadMin}`
          : filtro.cantidadMax !== undefined
          ? `máx ${filtro.cantidadMax}`
          : 'cualquier cantidad';
        
        items.push({
          id: `inventario-${index}`,
          label: `Inventario: ${tipoNombre} (${cantidadText})`,
          value: filtro,
          onRemove: () => eliminarFiltroInventario(index)
        });
      }
    });
    
    return items;
  }, [filters, tiposEspacio, filtrosInventario, tiposElemento]);

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
      {/* Header con estadísticas */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-3xl font-bold tracking-tight">Gestión de Espacios</h2>
          <p className="text-muted-foreground">
            Administra los espacios disponibles en el sistema
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-2 md:gap-3 w-full lg:w-auto">
          <div className="flex items-center gap-2 px-3 md:px-4 border rounded-lg shadow-sm bg-white h-10">
            <Building2 className="h-4 w-4 text-utec-blue" />
            <span className="font-bold text-sm">{totalElements}</span>
            <span className="text-sm text-muted-foreground hidden sm:inline">espacios</span>
          </div>
          
          <Button 
            variant="outline"
            onClick={() => navigate('/inventory')}
            className="h-10 flex-1 sm:flex-none"
          >
            <Package className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Gestionar Inventario</span>
            <span className="sm:hidden">Inventario</span>
          </Button>
          
          <Button 
            variant="outline"
            onClick={handleExport}
            className="h-10 flex-1 sm:flex-none"
          >
            <Download className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Exportar CSV</span>
            <span className="sm:hidden">CSV</span>
          </Button>
          
          <div 
            onClick={!isRefreshing ? handleRefresh : undefined}
            className={`flex items-center gap-1.5 md:gap-2 px-3 md:px-4 border rounded-lg shadow-sm bg-white h-10 transition-all flex-1 sm:flex-none justify-center ${isRefreshing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-gray-50'}`}
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin-once' : ''}`} key={isRefreshing ? 'spinning' : 'static'} />
            <span className="text-sm font-medium hidden sm:inline">Actualizar</span>
          </div>

          {/* Botones de switch de vista */}
          <div className="flex items-center border rounded-lg shadow-sm bg-white h-10 p-1 flex-shrink-0">
            <Button
              variant={viewMode === 'cards' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('cards')}
              className="h-8 px-3"
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'table' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('table')}
              className="h-8 px-3"
            >
              <LayoutList className="h-4 w-4" />
            </Button>
          </div>
          
          {canEdit && (
            <>
              <Button onClick={() => setShowTiposManagement(true)} variant="outline" className="h-10 flex-1 sm:flex-none">
                <Building2 className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Tipos de Espacios</span>
                <span className="sm:hidden">Tipos</span>
              </Button>
              <Button onClick={() => setCreateDialog(true)} className="h-10 flex-1 sm:flex-none">
                <Plus className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Agregar Espacio</span>
                <span className="sm:hidden">Agregar</span>
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Barra de búsqueda y filtros compacta */}
      <Card className="shadow-card">
        <CardHeader className="pb-0">
          <CardTitle className="text-lg">Filtros</CardTitle>
        </CardHeader>
        <CardContent className="pt-0 px-4 md:px-6 pb-4 md:pb-6">
          <div className="space-y-2">
            <div className="flex flex-col md:flex-row gap-3">
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

              {/* Botones de acción */}
              <div className="flex gap-2">
                <Button 
                  type="button"
                  variant="outline" 
                  onClick={() => setShowFilters(!showFilters)}
                  className={`transition-all duration-200 ${
                    showFilters 
                      ? 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100' 
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <Filter className={`h-4 w-4 mr-2 transition-transform duration-200 ${
                    showFilters ? 'rotate-180' : ''
                  }`} />
                  Filtros
                  {activeFilters.length > 0 && (
                    <Badge variant="secondary" className="ml-2 px-1.5 min-w-[20px]">
                      {activeFilters.length}
                    </Badge>
                  )}
                </Button>
              </div>
            </div>

            {/* Panel de filtros expandible */}
            {(() => {
              const filterFields: FilterField[] = [
                {
                  id: 'tipo-filter',
                  label: 'Tipo de Espacio',
                  type: 'select',
                  value: filters.tipoEspacioId?.toString() || 'all',
                  options: [
                    { value: 'all', label: 'Todos los tipos' },
                    ...tiposEspacio.map(tipo => ({ 
                      value: tipo.id.toString(), 
                      label: tipo.nombre 
                    }))
                  ],
                  onChange: (value) => handleTipoEspacioFilter(value)
                },
                {
                  id: 'estado-filter',
                  label: 'Estado',
                  type: 'select',
                  value: filters.estado || 'all',
                  options: [
                    { value: 'all', label: 'Todos los estados' },
                    { value: 'DISPONIBLE', label: 'Disponible' },
                    { value: 'MANTENIMIENTO', label: 'En Mantenimiento' },
                    { value: 'NO_DISPONIBLE', label: 'No Disponible' }
                  ],
                  onChange: (value) => handleEstadoFilter(value)
                },
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
                        <div key={index} className="border rounded-lg p-3 space-y-2">
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
                                onValueChange={(value) => actualizarFiltroInventario(index, 'tipoElementoId', parseInt(value))}
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
                                onChange={(e) => actualizarFiltroInventario(index, 'cantidadMin', e.target.value ? parseInt(e.target.value) : undefined)}
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
                                onChange={(e) => actualizarFiltroInventario(index, 'cantidadMax', e.target.value ? parseInt(e.target.value) : undefined)}
                                className="h-8"
                              />
                            </div>
                          </div>

                          {/* Resumen del filtro */}
                          {filtro.tipoElementoId > 0 && (
                            <div className="text-xs text-muted-foreground bg-gray-50 p-2 rounded">
                              <strong>Filtro:</strong> Espacios que tengan{' '}
                              {filtro.cantidadMin !== undefined && filtro.cantidadMax !== undefined
                                ? `entre ${filtro.cantidadMin} y ${filtro.cantidadMax}`
                                : filtro.cantidadMin !== undefined
                                ? `al menos ${filtro.cantidadMin}`
                                : filtro.cantidadMax !== undefined
                                ? `máximo ${filtro.cantidadMax}`
                                : 'cualquier cantidad de'
                              }{' '}
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
        </CardContent>
      </Card>

      {/* Filtros activos */}
      {activeFilters.length > 0 && (
        <FilterBar 
          filters={activeFilters} 
          onClearAll={clearFilters}
          className="animate-slide-up"
        />
      )}

      {/* Vista de espacios */}
      {loading ? (
        viewMode === 'cards' ? (
          <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: pageSize }).map((_, index) => (
              <SpaceCardSkeleton key={index} />
            ))}
          </div>
        ) : (
          <div className="border rounded-lg shadow-card p-8">
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="h-16 bg-gray-100 animate-pulse rounded" />
              ))}
            </div>
          </div>
        )
      ) : sortedEspacios.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No se encontraron espacios"
          description="No hay espacios que coincidan con los criterios de búsqueda"
          action={{
            label: 'Limpiar filtros',
            onClick: clearFilters
          }}
        />
      ) : (
        <>
          {viewMode === 'cards' ? (
            <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
            <SpaceTable
              espacios={sortedEspacios}
              canEdit={canEdit}
              onEdit={handleEdit}
              onDelete={canEdit ? handleDelete : undefined}
              sortConfig={sortConfig}
              onSort={handleSort}
            />
          )}

          {/* Paginación */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-3 border-t bg-gray-50/50">
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
      )}

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
