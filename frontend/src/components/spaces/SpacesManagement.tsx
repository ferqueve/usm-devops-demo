import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent } from "@/components/ui/card";
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
import { SpaceFormDialog } from './SpaceFormDialog';
import { DeleteSpaceDialog } from './DeleteSpaceDialog';
import { FilterBar } from "@/components/ui/filter-bar";
import type { FilterItem } from "@/components/ui/filter-bar";
import { EmptyState } from "@/components/ui/empty-state";
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
  X
} from 'lucide-react';
import { toast } from 'sonner';

export default function SpacesManagement() {
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
  
  // Modales
  const [createDialog, setCreateDialog] = useState(false);
  const [editDialog, setEditDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [selectedSpace, setSelectedSpace] = useState<Espacio | null>(null);

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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(0);
    setFilters(prev => ({ ...prev, search: searchInput || undefined }));
  };

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
            onClick={() => {/* TODO: Implementar exportación */}}
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
          
          {canEdit && (
            <Button onClick={() => setCreateDialog(true)} className="h-10 flex-1 sm:flex-none">
              <Plus className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Agregar Espacio</span>
              <span className="sm:hidden">Agregar</span>
            </Button>
          )}
        </div>
      </div>

      {/* Barra de búsqueda y filtros compacta */}
      <Card className="shadow-card">
        <CardContent className="p-4 md:p-6">
          <form onSubmit={handleSearch} className="space-y-4">
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
                <Button type="submit" className="hover-lift">
                  <Search className="h-4 w-4 mr-2" />
                  Buscar
                </Button>
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
            <div className={`overflow-hidden transition-all duration-300 ease-in-out ${
              showFilters ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
            }`}>
              <div className={`flex flex-wrap gap-3 pt-3 border-t transition-transform duration-300 ease-in-out ${
                showFilters ? 'translate-y-0' : '-translate-y-2'
              }`}>
                <div className="min-w-[200px] flex-1">
                  <Label htmlFor="tipo-filter" className="text-xs text-muted-foreground mb-1.5 block">
                    Tipo de Espacio
                  </Label>
                  <Select 
                    value={filters.tipoEspacioId?.toString() || 'all'} 
                    onValueChange={handleTipoEspacioFilter}
                  >
                    <SelectTrigger id="tipo-filter">
                      <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos los tipos</SelectItem>
                      {tiposEspacio.map(tipo => (
                        <SelectItem key={tipo.id} value={tipo.id.toString()}>
                          {tipo.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="min-w-[150px] flex-1">
                  <Label htmlFor="capacidad-min-filter" className="text-xs text-muted-foreground mb-1.5 block">
                    Capacidad Mínima
                  </Label>
                  <Input
                    id="capacidad-min-filter"
                    type="number"
                    placeholder="Ej: 10"
                    value={filters.capacidadMin || ''}
                    onChange={(e) => handleCapacidadMinFilter(e.target.value)}
                    className="h-9"
                  />
                </div>

                <div className="min-w-[150px] flex-1">
                  <Label htmlFor="capacidad-max-filter" className="text-xs text-muted-foreground mb-1.5 block">
                    Capacidad Máxima
                  </Label>
                  <Input
                    id="capacidad-max-filter"
                    type="number"
                    placeholder="Ej: 50"
                    value={filters.capacidadMax || ''}
                    onChange={(e) => handleCapacidadMaxFilter(e.target.value)}
                    className="h-9"
                  />
                </div>
              </div>

              {/* Filtros de Inventario */}
              <div className="mt-4 pt-4 border-t">
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
                          <div className="space-y-1">
                            <Label className="text-xs">Tipo de Elemento</Label>
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
                          <div className="space-y-1">
                            <Label className="text-xs">Cantidad Mínima</Label>
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
                          <div className="space-y-1">
                            <Label className="text-xs">Cantidad Máxima</Label>
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
              </div>
            </div>
          </form>
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

      {/* Grid de espacios */}
      {loading ? (
        <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: pageSize }).map((_, index) => (
            <SpaceCardSkeleton key={index} />
          ))}
        </div>
      ) : espacios.length === 0 ? (
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
          <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {espacios.map((espacio) => (
              <SpaceCard
                key={espacio.id}
                espacio={espacio}
                canEdit={canEdit}
                onEdit={handleEdit}
              />
            ))}
          </div>

          {/* Paginación */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-3 border-t bg-gray-50/50">
            <p className="text-sm text-muted-foreground">
              <span className="hidden sm:inline">
                Mostrando {espacios.length} de {totalElements} espacios (Página {page + 1} de {totalPages})
              </span>
              <span className="sm:hidden">
                Pág {page + 1}/{totalPages} ({espacios.length} de {totalElements})
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
    </div>
  );
}
