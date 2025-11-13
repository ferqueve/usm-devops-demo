import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  reservationsApi,
  type InventoryRequestsQuery,
  type InventoryRequestUpdatePayload,
  type PagedResponse,
} from '@/lib/api/reservations';
import { espaciosApi } from '@/lib/api/spaces';
import type { Espacio, InventarioItem, ReservaItemSolicitado, ReservaItemSolicitadoEstado } from '@/lib/types/spaces';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { EmptyState } from '@/components/ui/empty-state';
import {
  ArrowLeft,
  ClipboardList,
  CalendarClock,
  Building2,
  User,
  Boxes,
  RefreshCw,
  Search,
  Loader2,
} from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';

const ESTADO_OPTIONS: Array<{
  value: ReservaItemSolicitadoEstado;
  label: string;
  badgeClass: string;
}> = [
  { value: 'PENDIENTE', label: 'Pendiente', badgeClass: 'bg-amber-50 text-amber-700 border-amber-200' },
  { value: 'APROBADO', label: 'Aprobado', badgeClass: 'bg-blue-50 text-blue-700 border-blue-200' },
  { value: 'ENTREGADO', label: 'Entregado', badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { value: 'RECHAZADO', label: 'Rechazado', badgeClass: 'bg-rose-50 text-rose-700 border-rose-200' },
];

const ESTADO_LABEL = ESTADO_OPTIONS.reduce<Record<ReservaItemSolicitadoEstado, string>>((acc, item) => {
  acc[item.value] = item.label;
  return acc;
}, { PENDIENTE: 'Pendiente', APROBADO: 'Aprobado', ENTREGADO: 'Entregado', RECHAZADO: 'Rechazado' });

export default function InventoryRequestsManagement() {
  const navigate = useNavigate();

  const [espacios, setEspacios] = useState<Espacio[]>([]);
  const [requestsPage, setRequestsPage] = useState<PagedResponse<ReservaItemSolicitado> | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [selectedEstados, setSelectedEstados] = useState<ReservaItemSolicitadoEstado[]>([]);
  const [selectedEspacio, setSelectedEspacio] = useState<number | null>(null);
  const [fechaDesde, setFechaDesde] = useState<Date | undefined>();
  const [fechaHasta, setFechaHasta] = useState<Date | undefined>();
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sort, setSort] = useState<{ field: string; direction: 'asc' | 'desc' }>({
    field: 'createdAt',
    direction: 'desc',
  });

  const [selectedRequest, setSelectedRequest] = useState<ReservaItemSolicitado | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [inventoryOptions, setInventoryOptions] = useState<InventarioItem[]>([]);
  const [inventoryLoading, setInventoryLoading] = useState(false);
  const [selectedInventoryId, setSelectedInventoryId] = useState<number | null>(null);
  const [observacionesEdit, setObservacionesEdit] = useState('');
  const [updatingRequest, setUpdatingRequest] = useState(false);

  useEffect(() => {
    const handler = setTimeout(() => setSearchTerm(searchInput.trim()), 400);
    return () => clearTimeout(handler);
  }, [searchInput]);

  const hasFilters = useMemo(
    () =>
      selectedEstados.length > 0 ||
      selectedEspacio !== null ||
      !!fechaDesde ||
      !!fechaHasta ||
      searchTerm.length > 0,
    [selectedEstados, selectedEspacio, fechaDesde, fechaHasta, searchTerm]
  );

  const fetchEspacios = useCallback(async () => {
    try {
      const response = await espaciosApi.obtenerEspacios();
      if (response.data) {
        setEspacios(response.data.filter((espacio) => espacio.activo));
      }
    } catch (error) {
      console.error('Error al cargar espacios', error);
      toast.error('No se pudieron cargar los espacios');
    }
  }, []);

  const fetchRequests = useCallback(
    async (opts?: Partial<InventoryRequestsQuery>) => {
      setLoading((prev) => prev && !refreshing);
      try {
        const query: InventoryRequestsQuery = {
          page,
          size: pageSize,
          estados: selectedEstados.length > 0 ? selectedEstados : undefined,
          espacioId: selectedEspacio ?? undefined,
          fechaDesde: fechaDesde ?? undefined,
          fechaHasta: fechaHasta ?? undefined,
          search: searchTerm || undefined,
          sortField: sort.field,
          sortDirection: sort.direction,
          ...opts,
        };

        const response = await reservationsApi.listarSolicitudesInventario(query);
        if (response.data) {
          setRequestsPage(response.data);
        } else {
          setRequestsPage({
            content: [],
            page: query.page ?? 0,
            size: query.size ?? 0,
            totalElements: 0,
            totalPages: 0,
            first: true,
            last: true,
            hasNext: false,
            hasPrevious: false,
            numberOfElements: 0,
          });
        }
      } catch (error: any) {
        console.error('Error al cargar solicitudes de inventario', error);
        toast.error(error?.message || 'No se pudieron cargar las solicitudes de inventario');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [fechaDesde, fechaHasta, page, pageSize, refreshing, searchTerm, selectedEstados, selectedEspacio, sort.direction, sort.field]
  );

  useEffect(() => {
    fetchEspacios();
  }, [fetchEspacios]);

  useEffect(() => {
    setPage(0);
  }, [selectedEstados, selectedEspacio, fechaDesde, fechaHasta, searchTerm]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  useEffect(() => {
    if (!selectedRequest) {
      setInventoryOptions([]);
      setSelectedInventoryId(null);
      setObservacionesEdit('');
      return;
    }

    setObservacionesEdit(selectedRequest.observaciones ?? '');
    setSelectedInventoryId(selectedRequest.inventarioItemId ?? null);
  }, [selectedRequest]);

  const loadInventoryOptions = useCallback(async () => {
    if (!selectedRequest) {
      setInventoryOptions([]);
      return;
    }

    if (selectedRequest.estado === 'RECHAZADO') {
      setInventoryOptions([]);
      return;
    }

    setInventoryLoading(true);
    try {
      const response = await espaciosApi.filtrarInventario(
        { tipoElementoId: selectedRequest.tipoElementoId, estado: 'DISPONIBLE' },
        'id',
        'asc'
      );
      setInventoryOptions(response.data ?? []);
    } catch (error) {
      console.error('Error al cargar items disponibles', error);
      toast.error('No se pudieron cargar los items disponibles');
    } finally {
      setInventoryLoading(false);
    }
  }, [selectedRequest]);

  useEffect(() => {
    if (!panelOpen || !selectedRequest) {
      return;
    }
    loadInventoryOptions();
  }, [panelOpen, selectedRequest, loadInventoryOptions]);

  const handleToggleEstado = (estado: ReservaItemSolicitadoEstado) => {
    setSelectedEstados((prev) =>
      prev.includes(estado) ? prev.filter((item) => item !== estado) : [...prev, estado]
    );
  };

  const handleClearFilters = () => {
    setSelectedEstados([]);
    setSelectedEspacio(null);
    setFechaDesde(undefined);
    setFechaHasta(undefined);
    setSearchInput('');
    setSearchTerm('');
    setPage(0);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchRequests();
  };

  const handlePageChange = (newPage: number) => {
    if (!requestsPage) return;
    if (newPage < 0 || newPage >= requestsPage.totalPages) return;
    setPage(newPage);
  };

  const summary = useMemo(() => {
    const counts: Record<ReservaItemSolicitadoEstado, number> = {
      PENDIENTE: 0,
      APROBADO: 0,
      ENTREGADO: 0,
      RECHAZADO: 0,
    };
    let pendientes = 0;
    requestsPage?.content.forEach((item) => {
      counts[item.estado] = (counts[item.estado] ?? 0) + 1;
      if (item.estado === 'PENDIENTE' || item.estado === 'APROBADO') {
        pendientes += item.cantidadSolicitada ?? 0;
      }
    });
    return {
      total: requestsPage?.totalElements ?? 0,
      statusCounts: counts,
      pendingItems: pendientes,
    };
  }, [requestsPage]);

  const formatDateTime = (iso: string | undefined) => {
    if (!iso) return '—';
    try {
      return new Intl.DateTimeFormat('es-PE', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(new Date(iso));
    } catch (error) {
      return iso;
    }
  };

  const handleOpenPanel = (request: ReservaItemSolicitado) => {
    setSelectedRequest(request);
    setPanelOpen(true);
  };

  const updateSelectedRequest = async (
    payload: InventoryRequestUpdatePayload,
    successMessage: string
  ) => {
    if (!selectedRequest) return;

    const requestId = selectedRequest.id;
    const sanitized: InventoryRequestUpdatePayload = {};

    if (payload.estado) {
      sanitized.estado = payload.estado;
    }
    if (payload.inventarioItemId !== undefined) {
      sanitized.inventarioItemId = payload.inventarioItemId;
    }
    if (payload.observaciones !== undefined) {
      sanitized.observaciones = payload.observaciones;
    }

    setUpdatingRequest(true);
    try {
      const response = await reservationsApi.actualizarSolicitudInventario(requestId, sanitized);
      if (response.data) {
        toast.success(successMessage);
        setSelectedRequest(response.data);
        setSelectedInventoryId(response.data.inventarioItemId ?? null);
        setObservacionesEdit(response.data.observaciones ?? '');
        await fetchRequests();
        await loadInventoryOptions();
      }
    } catch (error: any) {
      toast.error(error?.message || 'No se pudo actualizar la solicitud');
    } finally {
      setUpdatingRequest(false);
    }
  };

  const tableContent = useMemo(() => requestsPage?.content ?? [], [requestsPage]);

  const inventorySelectOptions = useMemo(() => {
    const options = inventoryOptions.map((item) => ({
      value: item.id,
      label: `Item #${item.id}${item.espacioNombre ? ` · ${item.espacioNombre}` : ''}`,
    }));

    if (
      selectedRequest?.inventarioItemId &&
      !options.some((option) => option.value === selectedRequest.inventarioItemId)
    ) {
      options.push({
        value: selectedRequest.inventarioItemId,
        label: `Item asignado (#${selectedRequest.inventarioItemId})`,
      });
    }

    return options;
  }, [inventoryOptions, selectedRequest?.inventarioItemId]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <Button variant="outline" onClick={() => navigate('/rooms')} className="self-start sm:self-auto">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
          <div className="space-y-1">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-utec-blue" />
              Solicitudes de Inventario
            </h2>
            <p className="text-muted-foreground max-w-xl">
              Visualiza y coordina los pedidos de equipamiento vinculados a las reservas de espacios.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 md:gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2 px-3 md:px-4 border rounded-lg shadow-sm bg-white h-10">
            <ClipboardList className="h-4 w-4 text-utec-blue" />
            <span className="font-bold text-sm">{summary.total}</span>
            <span className="text-sm text-muted-foreground hidden sm:inline">solicitudes</span>
          </div>

          <div className="flex items-center gap-2 px-3 md:px-4 border rounded-lg shadow-sm bg-white h-10">
            <Boxes className="h-4 w-4 text-utec-blue" />
            <span className="font-bold text-sm">{summary.pendingItems}</span>
            <span className="text-sm text-muted-foreground hidden sm:inline">items pendientes</span>
          </div>

          <Button
            variant="outline"
            className="h-10 flex-1 sm:flex-none"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 sm:mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Actualizar</span>
            <span className="sm:hidden">Refrescar</span>
          </Button>
        </div>
      </div>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Filtros</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Buscar por solicitante, tipo o ID..."
                className="pl-9"
              />
            </div>
            <div className="flex gap-2 items-center">
              <Label className="text-xs text-muted-foreground whitespace-nowrap">Estados:</Label>
              <div className="flex flex-wrap gap-2">
                {ESTADO_OPTIONS.map((option) => {
                  const active = selectedEstados.includes(option.value);
                  return (
                    <Button
                      key={option.value}
                      type="button"
                      variant={active ? 'default' : 'outline'}
                      className={active ? 'h-8 px-3 text-xs bg-utec-blue text-white' : 'h-8 px-3 text-xs'}
                      onClick={() => handleToggleEstado(option.value)}
                    >
                      {option.label}
                    </Button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Espacio</Label>
              <Select
                value={selectedEspacio !== null ? selectedEspacio.toString() : 'todos'}
                onValueChange={(value) => {
                  if (value === 'todos') {
                    setSelectedEspacio(null);
                  } else {
                    setSelectedEspacio(Number(value));
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos los espacios" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos los espacios</SelectItem>
                  {espacios.map((espacio) => (
                    <SelectItem key={espacio.id} value={espacio.id.toString()}>
                      {espacio.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Desde</Label>
              <DatePicker value={fechaDesde} onChange={setFechaDesde} placeholder="Fecha inicio" />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Hasta</Label>
              <DatePicker value={fechaHasta} onChange={setFechaHasta} placeholder="Fecha fin" />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Elementos por página</Label>
              <Select
                value={pageSize.toString()}
                onValueChange={(value) => {
                  setPageSize(Number(value));
                  setPage(0);
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[10, 20, 50].map((size) => (
                    <SelectItem key={size} value={size.toString()}>
                      {size}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {hasFilters ? (
                <span>{summary.total} resultados (filtros aplicados)</span>
              ) : (
                <span>{summary.total} resultados</span>
              )}
            </div>
            <Button type="button" variant="ghost" size="sm" onClick={handleClearFilters} disabled={!hasFilters}>
              Limpiar filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-card">
        <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle className="text-lg font-semibold">Solicitudes</CardTitle>
            <p className="text-xs text-muted-foreground">
              Gestiona los pedidos asociados a reservas aprobadas o pendientes de revisión.
            </p>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 text-muted-foreground animate-spin" />
            </div>
          ) : tableContent.length === 0 ? (
            <EmptyState
              icon={ClipboardList}
              title="Sin solicitudes registradas"
              description="No se encontraron solicitudes de inventario con los criterios actuales."
              action={hasFilters ? { label: 'Limpiar filtros', onClick: handleClearFilters } : undefined}
            />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Reserva</TableHead>
                    <TableHead>Solicitante</TableHead>
                    <TableHead>Elemento</TableHead>
                    <TableHead>Cantidad</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Creada</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tableContent.map((item) => {
                    const estadoConfig = ESTADO_OPTIONS.find((estado) => estado.value === item.estado);
                    return (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">#{item.id}</TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium text-sm text-gray-900">
                              {item.espacioNombre || '—'}
                            </span>
                            <span className="text-xs text-muted-foreground">Reserva #{item.reservaId}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-gray-900">
                              {item.solicitanteNombre || '—'}
                            </span>
                            <span className="text-xs text-muted-foreground">{item.solicitanteEmail || '—'}</span>
                          </div>
                        </TableCell>
                        <TableCell>{item.tipoElementoNombre}</TableCell>
                        <TableCell>{item.cantidadSolicitada}</TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={estadoConfig?.badgeClass ?? 'bg-gray-100 text-gray-700 border-gray-200'}
                          >
                            {ESTADO_LABEL[item.estado]}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatDateTime(item.createdAt)}</TableCell>
                        <TableCell className="text-right">
                          <Button size="sm" variant="outline" onClick={() => handleOpenPanel(item)}>
                            Gestionar
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>

        {!loading && requestsPage && requestsPage.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50/60">
            <p className="text-xs text-muted-foreground">
              Página {requestsPage.page + 1} de {requestsPage.totalPages}
            </p>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(page - 1)}
                disabled={page === 0}
              >
                Anterior
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(page + 1)}
                disabled={requestsPage.last}
              >
                Siguiente
              </Button>
            </div>
          </div>
        )}
      </Card>

      <Sheet open={panelOpen && !!selectedRequest} onOpenChange={setPanelOpen}>
        <SheetContent className="sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>Detalle de solicitud #{selectedRequest?.id}</SheetTitle>
          </SheetHeader>
          {selectedRequest ? (
            <div className="mt-4 space-y-6">
              <div className="rounded-lg border border-gray-200 bg-white p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{selectedRequest.tipoElementoNombre}</p>
                    <p className="text-xs text-muted-foreground">Reserva #{selectedRequest.reservaId}</p>
                  </div>
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                    x{selectedRequest.cantidadSolicitada}
                  </Badge>
                </div>
                <div className="grid grid-cols-1 gap-2 text-xs text-muted-foreground">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-700">Espacio</span>
                    <span>{selectedRequest.espacioNombre || '—'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-700">Solicitante</span>
                    <span>{selectedRequest.solicitanteNombre || '—'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-700">Correo</span>
                    <span>{selectedRequest.solicitanteEmail || '—'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-700">Inicio</span>
                    <span>{formatDateTime(selectedRequest.reservaInicio)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-700">Fin</span>
                    <span>{formatDateTime(selectedRequest.reservaFin)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-700">Creada</span>
                    <span>{formatDateTime(selectedRequest.createdAt)}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-xs font-semibold text-muted-foreground uppercase">Estado actual</p>
                <Badge
                  variant="outline"
                  className={
                    ESTADO_OPTIONS.find((estado) => estado.value === selectedRequest.estado)?.badgeClass ??
                    'bg-gray-100 text-gray-700 border-gray-200'
                  }
                >
                  {ESTADO_LABEL[selectedRequest.estado]}
                </Badge>
                <p className="text-[11px] text-muted-foreground">
                  Última actualización: {formatDateTime(selectedRequest.updatedAt)}
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-muted-foreground uppercase">Inventario asignado</p>
                  {inventoryLoading && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
                </div>
                <Select
                  value={selectedInventoryId !== null ? selectedInventoryId.toString() : 'none'}
                  onValueChange={(value) => {
                    if (value === 'none') {
                      setSelectedInventoryId(null);
                    } else {
                      setSelectedInventoryId(Number(value));
                    }
                  }}
                  disabled={inventoryLoading || selectedRequest.estado === 'RECHAZADO'}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un item disponible" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sin asignar</SelectItem>
                    {inventorySelectOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value.toString()}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    onClick={() => {
                      if (selectedInventoryId === null) {
                        toast.error('Selecciona un item disponible');
                        return;
                      }
                      if (selectedInventoryId === selectedRequest.inventarioItemId) {
                        toast.info('El item ya está asignado a esta solicitud');
                        return;
                      }
                      updateSelectedRequest(
                        { inventarioItemId: selectedInventoryId },
                        'Item de inventario asignado'
                      );
                    }}
                    disabled={
                      updatingRequest ||
                      selectedInventoryId === null ||
                      selectedInventoryId === selectedRequest.inventarioItemId
                    }
                  >
                    Asignar item
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      updateSelectedRequest(
                        { inventarioItemId: 0 },
                        'Item de inventario liberado'
                      )
                    }
                    disabled={updatingRequest || selectedRequest.inventarioItemId == null}
                  >
                    Liberar item
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const efectivo = selectedInventoryId ?? selectedRequest.inventarioItemId ?? null;
                      if (!efectivo) {
                        toast.error('Asigna un item disponible antes de marcar como entregado');
                        return;
                      }
                      updateSelectedRequest(
                        { estado: 'ENTREGADO', inventarioItemId: efectivo },
                        'Solicitud marcada como entregada'
                      );
                    }}
                    disabled={
                      updatingRequest ||
                      selectedRequest.estado !== 'APROBADO'
                    }
                  >
                    Marcar entregado
                  </Button>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Solo se listan items disponibles del mismo tipo. La entrega requiere un item asignado.
                </p>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase">Observaciones</p>
                <Textarea
                  value={observacionesEdit}
                  onChange={(event) => setObservacionesEdit(event.target.value)}
                  rows={4}
                />
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setObservacionesEdit(selectedRequest.observaciones ?? '')}
                    disabled={
                      updatingRequest || observacionesEdit === (selectedRequest.observaciones ?? '')
                    }
                  >
                    Deshacer
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() =>
                      updateSelectedRequest(
                        { observaciones: observacionesEdit },
                        'Observaciones actualizadas'
                      )
                    }
                    disabled={
                      updatingRequest || observacionesEdit === (selectedRequest.observaciones ?? '')
                    }
                  >
                    Guardar
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase">Acciones rápidas</p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      updateSelectedRequest(
                        { estado: 'APROBADO' },
                        'Solicitud marcada como aprobada'
                      )
                    }
                    disabled={updatingRequest || selectedRequest.estado !== 'PENDIENTE'}
                  >
                    Marcar como aprobada
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      updateSelectedRequest(
                        { estado: 'RECHAZADO', inventarioItemId: 0 },
                        'Solicitud marcada como rechazada'
                      )
                    }
                    disabled={
                      updatingRequest ||
                      selectedRequest.estado === 'RECHAZADO' ||
                      selectedRequest.estado === 'ENTREGADO'
                    }
                  >
                    Rechazar
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-sm text-muted-foreground">
              Selecciona una solicitud para ver sus detalles.
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

