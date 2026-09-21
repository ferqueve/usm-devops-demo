import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import {
  reservationsApi,
  type InventoryRequestsQuery,
  type InventoryRequestUpdatePayload,
  type PagedResponse,
} from '@/lib/api/reservations';
import { inventarioApi } from '@/lib/api/inventory';
import { useEspacios } from '@/hooks/useEspacios';
import type { InventarioItem, ReservaItemSolicitado, ReservaItemSolicitadoEstado } from '@/lib/types/spaces';
import { Button } from '@/components/ui/Button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Card, CardContent } from '@/components/ui/card';
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
  ClipboardList,
  Boxes,
  RefreshCw,
  Loader2,
  CalendarClock,
  ClipboardCheck,
  PackageMinus,
  PackagePlus,
  CheckCircle2,
  XCircle,
  User as UserIcon,
  FileText,
  Settings2,
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
import { PageHeader, HEADER_ACTION_ICON } from '@/components/layouts/PageHeader';
import { MARCA } from '@/lib/design/paleta';

const ESTADO_OPTIONS: Array<{
  value: ReservaItemSolicitadoEstado;
  label: string;
  badgeClass: string;
}> = [
  { value: 'PENDIENTE', label: 'Pendiente', badgeClass: 'bg-warning-suave text-warning-texto border-warning-borde' },
  { value: 'APROBADO', label: 'Aprobado', badgeClass: 'bg-info-suave text-info-texto border-info-borde' },
  { value: 'ENTREGADO', label: 'Entregado', badgeClass: 'bg-success-suave text-success-texto border-success-borde' },
  { value: 'RECHAZADO', label: 'Rechazado', badgeClass: 'bg-danger-suave text-danger-texto border-danger-borde' },
];

const ESTADO_LABEL = ESTADO_OPTIONS.reduce<Record<ReservaItemSolicitadoEstado, string>>((acc, item) => {
  acc[item.value] = item.label;
  return acc;
}, { PENDIENTE: 'Pendiente', APROBADO: 'Aprobado', ENTREGADO: 'Entregado', RECHAZADO: 'Rechazado' });

export default function InventoryRequestsManagement() {
  const { espacios } = useEspacios();

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
      const response = await inventarioApi.filtrarInventario(
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
        pendientes += 1;
      }
    });
    return {
      total: requestsPage?.totalElements ?? 0,
      statusCounts: counts,
      // Conteo de solicitudes (no unidades) en la página actual, evita confusión
      // como "17 items" cuando hay 4000+ solicitudes totales.
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
      manageDialogOpen && selectedRequest?.id === target.id;

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
    const options = inventoryOptions.map((item) => {
      const espacioSuffix = item.espacioNombre ? ` · ${item.espacioNombre}` : '';
      return {
        value: item.id,
        label: `Item #${item.id}${espacioSuffix}`,
      };
    });

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
  const canDeliver = isRequestApproved && selectedRequest?.inventarioItemId != null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Solicitudes"
        count={summary.total}
        description={`Pedidos de inventario de las reservas · ${summary.pendingItems} activas en esta página.`}
        accentColor={MARCA.amarillo}
        actions={
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleRefresh}
                disabled={refreshing}
                aria-label="Actualizar"
                className={HEADER_ACTION_ICON}
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Actualizar</TooltipContent>
          </Tooltip>
        }
      />

      <Card className="shadow-card">
        <div className="px-6 pt-4 pb-4">
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
        <CardContent className="px-4 pb-4 pt-0">
          {(() => {
            if (loading) {
              return (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="h-6 w-6 text-muted-foreground animate-spin" />
                </div>
              );
            }
            if (tableContent.length === 0) {
              return (
                <EmptyState
                  icon={ClipboardList}
                  title="Sin solicitudes registradas"
                  description="No se encontraron solicitudes de inventario con los criterios actuales."
                  action={hasFilters ? { label: 'Limpiar filtros', onClick: handleClearFilters } : undefined}
                />
              );
            }
            return viewMode === 'table' ? (
            <div className="overflow-x-auto border rounded-lg overflow-hidden">
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
                            <span className="font-medium text-sm text-foreground">
                              {item.espacioNombre || '—'}
                            </span>
                            <span className="text-xs text-muted-foreground">Reserva #{item.reservaId}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-foreground">
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
                            className={estadoConfig?.badgeClass ?? 'bg-muted text-foreground/80 border-border'}
                          >
                            {ESTADO_LABEL[item.estado]}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatDateTime(item.createdAt)}</TableCell>
                        <TableCell className="flex items-center justify-end gap-1">
                          <PermissionGuard requiredPermission="solicitud_inventario:aprobar">
                            {item.estado === 'APROBADO' && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    onClick={() => handleMarkDelivered(item)}
                                    disabled={processingRequestId === item.id || item.inventarioItemId == null}
                                    aria-label="Marcar entregado"
                                    className="h-8 w-8"
                                  >
                                    <ClipboardCheck className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Marcar entregado</TooltipContent>
                              </Tooltip>
                            )}
                          </PermissionGuard>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => handleOpenDialog(item)}
                                disabled={processingRequestId === item.id}
                                aria-label="Gestionar"
                                className="h-8 w-8"
                              >
                                <Settings2 className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Gestionar</TooltipContent>
                          </Tooltip>
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
          );
          })()}
        </CardContent>

        {!loading && requestsPage && requestsPage.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t bg-muted/60">
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
        <DialogContent showCloseButton={false} className="sm:max-w-[520px] max-h-[90vh] flex flex-col p-0 gap-0">
          {selectedRequest ? (
            <>
              <DialogHeader className="px-6 pt-5 pb-4 border-b">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <DialogTitle className="text-base font-semibold truncate">
                      {selectedRequest.tipoElementoNombre}
                    </DialogTitle>
                    <DialogDescription className="text-sm text-muted-foreground mt-0.5">
                      {selectedRequest.cantidadSolicitada} unidad{selectedRequest.cantidadSolicitada === 1 ? '' : 'es'}
                      {selectedRequest.espacioNombre ? ` · ${selectedRequest.espacioNombre}` : ''}
                      {` · Reserva #${selectedRequest.reservaId}`}
                    </DialogDescription>
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <Badge
                      variant="outline"
                      className={ESTADO_OPTIONS.find((e) => e.value === selectedRequest.estado)?.badgeClass ?? 'bg-muted text-foreground/80 border-border'}
                    >
                      {ESTADO_LABEL[selectedRequest.estado]}
                    </Badge>
                    <span className="text-2xs text-muted-foreground">#{selectedRequest.id}</span>
                  </div>
                </div>
              </DialogHeader>

              <div className="flex-1 min-h-0 overflow-y-auto">
                <div className="px-6 py-4 space-y-4 text-sm">
                  <div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <UserIcon className="h-3.5 w-3.5" />
                      Solicitante
                    </div>
                    <p className="mt-0.5 font-medium">{selectedRequest.solicitanteNombre ?? '—'}</p>
                    <p className="text-xs text-muted-foreground break-all">
                      {selectedRequest.solicitanteEmail ?? '—'}
                    </p>
                  </div>

                  <div className="pt-3 border-t">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <CalendarClock className="h-3.5 w-3.5" />
                      Reserva
                    </div>
                    <p className="mt-0.5 font-medium">
                      {formatCompactDateTime(selectedRequest.reservaInicio)} – {formatCompactDateTime(selectedRequest.reservaFin)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Creada {formatCompactDateTime(selectedRequest.createdAt)} · actualizada {formatCompactDateTime(selectedRequest.updatedAt)}
                    </p>
                  </div>

                  <div className="pt-3 border-t space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Boxes className="h-3.5 w-3.5" />
                        Inventario asignado
                      </div>
                      {inventoryLoading && (
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                      )}
                    </div>
                  <Select
                    value={selectedInventoryId === null ? 'none' : selectedInventoryId.toString()}
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

                  <div className="pt-3 border-t space-y-2">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <FileText className="h-3.5 w-3.5" />
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
                        Guardar
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="px-6 py-3 border-t bg-muted/30 flex flex-col-reverse sm:flex-row sm:justify-end gap-2 flex-shrink-0">
                <Button
                  variant="outline"
                  onClick={() => handleManageDialogChange(false)}
                >
                  Cerrar
                </Button>
                <PermissionGuard requiredPermission="solicitud_inventario:aprobar">
                  <Button
                    variant="outline"
                    title={canReject ? undefined : 'La solicitud ya fue cerrada'}
                    onClick={() => {
                      if (!selectedRequest) return;
                      updateRequest(
                        selectedRequest,
                        { estado: 'RECHAZADO', inventarioItemId: 0 },
                        'Solicitud rechazada'
                      );
                    }}
                    disabled={updatingRequest || !canReject}
                    className="border-danger-borde text-danger-texto hover:bg-danger-suave hover:text-danger-texto"
                  >
                    <XCircle className="h-4 w-4 mr-1.5" />
                    Rechazar
                  </Button>
                  {isRequestApproved ? (
                    <Button
                      title={canDeliver ? undefined : 'Asigna un item antes de confirmar la entrega'}
                      onClick={() => {
                        if (!selectedRequest) return;
                        handleMarkDelivered(selectedRequest);
                      }}
                      disabled={updatingRequest || !canDeliver}
                      className="bg-success hover:bg-success text-white"
                    >
                      <ClipboardCheck className="h-4 w-4 mr-1.5" />
                      Confirmar entrega
                    </Button>
                  ) : (
                    <Button
                      title={canApprove ? undefined : 'Asigna un item antes de aprobar'}
                      onClick={() => {
                        if (!selectedRequest) return;
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
                      className="bg-success hover:bg-success text-white"
                    >
                      <CheckCircle2 className="h-4 w-4 mr-1.5" />
                      Aprobar
                    </Button>
                  )}
                </PermissionGuard>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}

