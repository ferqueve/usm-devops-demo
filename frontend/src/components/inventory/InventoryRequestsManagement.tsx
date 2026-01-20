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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  Boxes,
  RefreshCw,
  Loader2,
  Building2,
  CalendarClock,
  ClipboardCheck,
  History,
  Mail,
  PackageMinus,
  PackagePlus,
  CheckCircle2,
  XCircle,
  User as UserIcon,
  FileText,
  Undo2,
  Save,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { InventoryRequestFilters } from '@/components/inventory/InventoryRequestFilters';
import InventoryRequestsCardView from '@/components/inventory/InventoryRequestsCardView';
import PermissionGuard from '@/components/auth/PermissionGuard';

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

const ESTADO_ACCENT: Record<ReservaItemSolicitadoEstado, string> = {
  PENDIENTE: 'from-amber-500 via-amber-600 to-orange-600',
  APROBADO: 'from-blue-500 via-blue-600 to-indigo-600',
  ENTREGADO: 'from-emerald-500 via-teal-600 to-sky-600',
  RECHAZADO: 'from-rose-500 via-rose-600 to-fuchsia-600',
};

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
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const sortField = 'createdAt';
  const sortDirection: 'asc' | 'desc' = 'desc';

  const [selectedRequest, setSelectedRequest] = useState<ReservaItemSolicitado | null>(null);
  const [manageDialogOpen, setManageDialogOpen] = useState(false);
  const [inventoryOptions, setInventoryOptions] = useState<InventarioItem[]>([]);
  const [inventoryLoading, setInventoryLoading] = useState(false);
  const [selectedInventoryId, setSelectedInventoryId] = useState<number | null>(null);
  const [observacionesEdit, setObservacionesEdit] = useState('');
  const [updatingRequest, setUpdatingRequest] = useState(false);
  const [processingRequestId, setProcessingRequestId] = useState<number | null>(null);

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
      setEspacios(response.data ?? []);
    } catch (error: unknown) {
      console.error('Error al cargar espacios', error);
      const message = error instanceof Error ? error.message : undefined;
      toast.error(message || 'No se pudieron cargar los espacios');
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
          sortField,
          sortDirection,
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
      } catch (error: unknown) {
        console.error('Error al cargar solicitudes de inventario', error);
        const message = error instanceof Error ? error.message : undefined;
        toast.error(message || 'No se pudieron cargar las solicitudes de inventario');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [fechaDesde, fechaHasta, page, pageSize, refreshing, searchTerm, selectedEstados, selectedEspacio, sortDirection, sortField]
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
    } catch (error: unknown) {
      console.error('Error al cargar items disponibles', error);
      const message = error instanceof Error ? error.message : undefined;
      toast.error(message || 'No se pudieron cargar los items disponibles');
    } finally {
      setInventoryLoading(false);
    }
  }, [selectedRequest]);

  useEffect(() => {
    if (!manageDialogOpen || !selectedRequest) {
      return;
    }
    loadInventoryOptions();
  }, [manageDialogOpen, selectedRequest, loadInventoryOptions]);

  const handleToggleEstado = (estado: ReservaItemSolicitadoEstado) => {
    setSelectedEstados((prev) => (prev.includes(estado) ? [] : [estado]));
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
    } catch {
      return iso;
    }
  };

  const formatCompactDateTime = (iso?: string) => {
    if (!iso) return '—';
    try {
      return new Intl.DateTimeFormat('es-PE', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      })
        .format(new Date(iso))
        .replace('.', '')
        .replace(',', '');
    } catch {
      return formatDateTime(iso);
    }
  };

  const handleOpenDialog = (request: ReservaItemSolicitado) => {
    setSelectedRequest(request);
    setManageDialogOpen(true);
  };

  const handleManageDialogChange = (open: boolean) => {
    if (!open) {
      setManageDialogOpen(false);
      setSelectedRequest(null);
      return;
    }
    if (selectedRequest) {
      setManageDialogOpen(true);
    }
  };

  const handleMarkDelivered = (request: ReservaItemSolicitado) => {
    if (request.estado === 'ENTREGADO') {
      toast.info('La solicitud ya fue marcada como entregada');
      return;
    }
    if (request.estado !== 'APROBADO') {
      toast.error('Solo puedes confirmar entrega cuando la solicitud está aprobada');
      return;
    }
    if (!request.inventarioItemId) {
      toast.error('Asigna un item antes de confirmar la entrega');
      return;
    }
    updateRequest(
      request,
      { estado: 'ENTREGADO', inventarioItemId: request.inventarioItemId },
      'Entrega confirmada'
    );
  };

  const updateRequest = async (
    target: ReservaItemSolicitado,
    payload: InventoryRequestUpdatePayload,
    successMessage: string
  ) => {
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

    const isDialogTarget =
      manageDialogOpen && selectedRequest && selectedRequest.id === target.id;

    if (isDialogTarget) {
      setUpdatingRequest(true);
    }
    setProcessingRequestId(target.id);

    try {
      const response = await reservationsApi.actualizarSolicitudInventario(target.id, sanitized);
      if (response.data) {
        toast.success(successMessage);
        await fetchRequests();

        if (isDialogTarget) {
          setSelectedRequest(response.data);
          setSelectedInventoryId(response.data.inventarioItemId ?? null);
          setObservacionesEdit(response.data.observaciones ?? '');
          await loadInventoryOptions();
        }
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : undefined;
      toast.error(message || 'No se pudo actualizar la solicitud');
    } finally {
      if (isDialogTarget) {
        setUpdatingRequest(false);
      }
      setProcessingRequestId(null);
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

  const isRequestApproved = selectedRequest?.estado === 'APROBADO';
  const isRequestRejected = selectedRequest?.estado === 'RECHAZADO';
  const isRequestDelivered = selectedRequest?.estado === 'ENTREGADO';
  const inventoryLocked = Boolean(isRequestApproved || isRequestRejected || isRequestDelivered);
  const canApprove =
    selectedRequest?.estado === 'PENDIENTE' && selectedRequest?.inventarioItemId != null;
  const canReject = Boolean(selectedRequest && !isRequestRejected && !isRequestDelivered);

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
        <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle className="text-lg font-semibold">Solicitudes</CardTitle>
            <p className="text-xs text-muted-foreground">
              Gestiona los pedidos asociados a reservas aprobadas o pendientes de revisión.
            </p>
          </div>
        </CardHeader>
        <div className="px-6 pb-4">
          <InventoryRequestFilters
            searchValue={searchInput}
            activeSearch={searchTerm}
            onSearchChange={setSearchInput}
            onSearchClear={() => {
              setSearchInput('');
              setSearchTerm('');
            }}
            selectedEstados={selectedEstados}
            onToggleEstado={handleToggleEstado}
            onClearEstados={() => setSelectedEstados([])}
            espacios={espacios}
            selectedEspacio={selectedEspacio}
            onEspacioChange={(id) => {
              setSelectedEspacio(id);
              setPage(0);
            }}
            fechaDesde={fechaDesde}
            fechaHasta={fechaHasta}
            onFechaDesdeChange={(date) => {
              setFechaDesde(date);
              setPage(0);
            }}
            onFechaHastaChange={(date) => {
              setFechaHasta(date);
              setPage(0);
            }}
            onResetFechas={() => {
              setFechaDesde(undefined);
              setFechaHasta(undefined);
              setPage(0);
            }}
            pageSize={pageSize}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setPage(0);
            }}
            hasFilters={hasFilters}
            onClearFilters={handleClearFilters}
            viewMode={viewMode}
            onViewModeChange={(mode) => {
              setViewMode(mode);
              setPage(0);
            }}
          />
        </div>
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
          ) : viewMode === 'table' ? (
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
                        <TableCell className="flex items-center justify-end gap-2">
                          <PermissionGuard requiredPermission="solicitud_inventario:entregar">
                            {item.estado === 'APROBADO' && (
                              <Button
                                size="sm"
                                onClick={() => handleMarkDelivered(item)}
                                disabled={processingRequestId === item.id || item.inventarioItemId == null}
                              >
                                <ClipboardCheck className="h-3.5 w-3.5" />
                                Entregado
                              </Button>
                            )}
                          </PermissionGuard>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenDialog(item)}
                            disabled={processingRequestId === item.id}
                          >
                            Gestionar
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="px-6 py-5">
              <InventoryRequestsCardView
                requests={tableContent}
                onManage={handleOpenDialog}
                onDeliver={handleMarkDelivered}
                processingRequestId={processingRequestId}
                formatDateTime={formatDateTime}
                estadoOptions={ESTADO_OPTIONS}
                estadoLabel={ESTADO_LABEL}
              />
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

      <Dialog
        open={manageDialogOpen && !!selectedRequest}
        onOpenChange={handleManageDialogChange}
      >
        <DialogContent className="max-w-[520px] max-h-[85vh] gap-0 p-0 overflow-hidden border border-slate-200 bg-white shadow-2xl flex flex-col">
          {selectedRequest ? (
            <>
              {/* Header fijo */}
              <DialogHeader
                className={`shrink-0 gap-2 bg-gradient-to-br px-5 py-4 text-left text-white sm:text-left ${ESTADO_ACCENT[selectedRequest.estado] ?? 'from-slate-600 to-slate-800'}`}
              >
                <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-white/70">
                  <span>Solicitud #{selectedRequest.id}</span>
                  <Badge className="bg-white/90 text-slate-900 border-0 px-2 py-0 text-[11px] font-semibold shadow-sm">
                    {ESTADO_LABEL[selectedRequest.estado]}
                  </Badge>
                  <span className="ml-auto text-[10px] normal-case text-white/70">
                    {formatCompactDateTime(selectedRequest.updatedAt)}
                  </span>
                </div>
                <DialogTitle className="text-xl font-semibold leading-tight text-white">
                  {selectedRequest.tipoElementoNombre}
                </DialogTitle>
                <DialogDescription className="text-xs text-white/80">
                  Gestiona el estado, inventario y observaciones asociadas a esta solicitud de equipamiento.
                </DialogDescription>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] font-semibold">
                  <span className="inline-flex items-center gap-1 rounded-md bg-white/20 px-2 py-0.5">
                    <Boxes className="h-3.5 w-3.5" />
                    x{selectedRequest.cantidadSolicitada}
                  </span>
                  {selectedRequest.espacioNombre && (
                    <span className="inline-flex items-center gap-1 rounded-md bg-white/15 px-2 py-0.5">
                      <Building2 className="h-3.5 w-3.5" />
                      {selectedRequest.espacioNombre}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1 rounded-md bg-white/15 px-2 py-0.5">
                    <ClipboardList className="h-3.5 w-3.5" />
                    R#{selectedRequest.reservaId}
                  </span>
                </div>
              </DialogHeader>

              {/* Contenido scrolleable */}
              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3 text-sm text-slate-900">
                <div className="grid gap-2">
                  <div className="flex items-start gap-2">
                    <UserIcon className="mt-0.5 h-4 w-4 text-muted-foreground" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold leading-tight">
                        {selectedRequest.solicitanteNombre ?? '—'}
                      </p>
                      <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                        <Mail className="h-3 w-3 shrink-0" />
                        <span className="truncate break-all">
                          {selectedRequest.solicitanteEmail ?? '—'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <CalendarClock className="mt-0.5 h-4 w-4 text-muted-foreground" />
                    <div className="flex flex-wrap items-center gap-1 text-sm font-semibold leading-tight text-slate-900">
                      <span>{formatCompactDateTime(selectedRequest.reservaInicio)}</span>
                      <span className="text-[10px] text-muted-foreground">→</span>
                      <span>{formatCompactDateTime(selectedRequest.reservaFin)}</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 text-[11px] text-muted-foreground">
                    <History className="mt-0.5 h-3.5 w-3.5" />
                    <span>Creada {formatCompactDateTime(selectedRequest.createdAt)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="font-semibold uppercase tracking-wide text-slate-500">Estado</span>
                  <Badge
                    variant="outline"
                    className={`px-2 py-0 text-[11px] font-semibold ${ESTADO_OPTIONS.find((estado) => estado.value === selectedRequest.estado)?.badgeClass ?? 'bg-gray-100 text-gray-700 border-gray-200'}`}
                  >
                    {ESTADO_LABEL[selectedRequest.estado]}
                  </Badge>
                  <span className="ml-auto text-[10px]">
                    Actualizado {formatCompactDateTime(selectedRequest.updatedAt)}
                  </span>
                </div>

                <div className="space-y-2 rounded-md border border-slate-200 bg-slate-50/70 p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                      <Boxes className="h-3.5 w-3.5 text-blue-600" />
                      <span>Inventario</span>
                    </div>
                    {inventoryLoading && (
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                    )}
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
                    disabled={inventoryLoading || inventoryLocked}
                  >
                    <SelectTrigger className="h-9 text-sm">
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
                  <PermissionGuard requiredPermission="solicitud_inventario:aprobar">
                    <div className="grid gap-2 sm:grid-cols-2">
                      <Button
                        size="sm"
                        onClick={() => {
                          if (selectedInventoryId === null) {
                            toast.error('Selecciona un item disponible');
                            return;
                          }
                          if (!selectedRequest) {
                            return;
                          }
                          if (selectedInventoryId === selectedRequest.inventarioItemId) {
                            toast.info('El item ya está asignado a esta solicitud');
                            return;
                          }
                          updateRequest(
                            selectedRequest,
                            { inventarioItemId: selectedInventoryId },
                            'Item de inventario asignado'
                          );
                        }}
                        disabled={
                          updatingRequest ||
                          inventoryLocked ||
                          selectedInventoryId === null ||
                          (selectedRequest?.inventarioItemId != null &&
                            selectedInventoryId === selectedRequest.inventarioItemId)
                        }
                        className="justify-center"
                      >
                        <PackagePlus className="h-3.5 w-3.5" />
                        Asignar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          if (!selectedRequest) {
                            return;
                          }
                          updateRequest(
                            selectedRequest,
                            { inventarioItemId: 0 },
                            'Item de inventario liberado'
                          );
                        }}
                        disabled={
                          updatingRequest ||
                          inventoryLocked ||
                          selectedRequest.inventarioItemId == null
                        }
                        className="justify-center"
                      >
                        <PackageMinus className="h-3.5 w-3.5" />
                        Liberar
                      </Button>
                    </div>
                  </PermissionGuard>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    <FileText className="h-3.5 w-3.5 text-slate-500" />
                    Observaciones
                  </div>
                  <Textarea
                    value={observacionesEdit}
                    onChange={(event) => setObservacionesEdit(event.target.value)}
                    rows={3}
                    className="resize-none text-sm"
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
                      <Undo2 className="h-3.5 w-3.5" />
                      Deshacer
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => {
                        if (!selectedRequest) {
                          return;
                        }
                        updateRequest(
                          selectedRequest,
                          { observaciones: observacionesEdit },
                          'Observaciones actualizadas'
                        );
                      }}
                      disabled={
                        updatingRequest || observacionesEdit === (selectedRequest.observaciones ?? '')
                      }
                    >
                      <Save className="h-3.5 w-3.5" />
                      Guardar
                    </Button>
                  </div>
                </div>
              </div>

              {/* Footer fijo con acciones */}
              <div className="shrink-0 border-t border-slate-200 bg-slate-50 px-5 py-3">
                <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9 px-4"
                    onClick={() => handleManageDialogChange(false)}
                  >
                    Cerrar
                  </Button>
                  <PermissionGuard requiredPermissions={['solicitud_inventario:aprobar', 'solicitud_inventario:rechazar']} requireAll={false}>
                    <div className="flex items-center gap-2">
                      <PermissionGuard requiredPermission="solicitud_inventario:rechazar">
                        <Button
                          size="sm"
                          variant="outline"
                          title={!canReject ? 'La solicitud ya fue cerrada' : undefined}
                          onClick={() => {
                            if (!selectedRequest) {
                              return;
                            }
                            updateRequest(
                              selectedRequest,
                              { estado: 'RECHAZADO', inventarioItemId: 0 },
                              'Solicitud rechazada'
                            );
                          }}
                          disabled={updatingRequest || !canReject}
                          className="h-9 border-rose-200 text-rose-700 hover:bg-rose-50 hover:text-rose-800"
                        >
                          <XCircle className="h-4 w-4" />
                          Rechazar
                        </Button>
                      </PermissionGuard>
                      <PermissionGuard requiredPermission="solicitud_inventario:aprobar">
                        <Button
                          size="sm"
                          title={!canApprove ? 'Asigna un item antes de aprobar' : undefined}
                          onClick={() => {
                            if (!selectedRequest) {
                              return;
                            }
                            if (!canApprove) {
                              toast.error('Asigna un item antes de aprobar la solicitud');
                              return;
                            }
                            updateRequest(
                              selectedRequest,
                              { estado: 'APROBADO' },
                              'Solicitud aprobada'
                            );
                          }}
                          disabled={updatingRequest || !canApprove}
                          className="h-9 bg-emerald-600 hover:bg-emerald-700"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                          Aprobar
                        </Button>
                      </PermissionGuard>
                    </div>
                  </PermissionGuard>
                </div>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}

