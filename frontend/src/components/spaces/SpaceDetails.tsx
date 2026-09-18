import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from "@/components/ui/card";
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
import { SpaceImage } from "./SpaceImage";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { SpaceFormDialog } from './SpaceFormDialog';
import { DeleteSpaceDialog } from './DeleteSpaceDialog';
import { InventarioFormDialog } from './InventarioFormDialog';
import { DeleteInventarioDialog } from './DeleteInventarioDialog';
import { espaciosApi } from '@/lib/api/spaces';
import { inventarioApi } from '@/lib/api/inventory';
import { reservationsApi } from '@/lib/api/reservations';
import type { Espacio, InventarioItem, Reserva } from '@/lib/types/spaces';
import PermissionGuard from '@/components/auth/PermissionGuard';
import { useRolePermissions } from '@/hooks/useRolePermissions';
import {
  ArrowLeft,
  Edit,
  Trash2,
  Users,
  Calendar,
  Package,
  AlertCircle,
  CheckCircle,
  Wrench,
  Plus,
  Building2,
  CalendarClock,
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface SpaceDetailsProps {
  espacioId: number;
}

function getEstadoConfig(estado: string) {
  switch (estado) {
    case 'DISPONIBLE':
      return { label: 'Disponible', color: 'bg-utec-green text-white border-utec-green', icon: CheckCircle };
    case 'MANTENIMIENTO':
      return { label: 'Mantenimiento', color: 'bg-utec-yellow text-utec-dark border-utec-yellow', icon: Wrench };
    case 'DANADO':
      return { label: 'Dañado', color: 'bg-utec-red text-white border-utec-red', icon: AlertCircle };
    default:
      return { label: estado, color: 'bg-secondary text-utec-dark border-border', icon: AlertCircle };
  }
}

interface SectionProps {
  title: string;
  icon?: React.ReactNode;
  accentClass: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  bodyClass?: string;
}

function Section({ title, icon, accentClass, actions, children, bodyClass = 'p-4' }: Readonly<SectionProps>) {
  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      <div className="flex items-center gap-2.5 px-4 py-2.5 bg-chrome text-white">
        <span className={`w-1 h-4 rounded-sm shrink-0 ${accentClass}`} />
        {icon}
        <h3 className="text-sm font-semibold tracking-tight">{title}</h3>
        {actions && <div className="ml-auto">{actions}</div>}
      </div>
      <div className={bodyClass}>{children}</div>
    </div>
  );
}

export function SpaceDetails({ espacioId }: Readonly<SpaceDetailsProps>) {
  const { hasPermission } = useRolePermissions();
  const puedeVerInventario = hasPermission('inventario:ver');
  const navigate = useNavigate();
  const [espacio, setEspacio] = useState<Espacio | null>(null);
  const [inventario, setInventario] = useState<InventarioItem[]>([]);
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingInventario, setLoadingInventario] = useState(true);
  const [loadingReservas, setLoadingReservas] = useState(true);

  const [editDialog, setEditDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [inventarioFormDialog, setInventarioFormDialog] = useState(false);
  const [deleteInventarioDialog, setDeleteInventarioDialog] = useState(false);
  const [selectedInventarioItem, setSelectedInventarioItem] = useState<InventarioItem | null>(null);

  const fetchEspacio = useCallback(async () => {
    try {
      setLoading(true);
      const response = await espaciosApi.obtenerEspacio(espacioId);
      if (response.data) setEspacio(response.data);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'No se pudo cargar la información del espacio';
      console.error('Error al cargar espacio:', error);
      toast.error('Error al cargar espacio', { description: errorMessage });
    } finally {
      setLoading(false);
    }
  }, [espacioId]);

  // El inventario de un espacio es para quien lo administra: un ESTUDIANTE que
  // abria el detalle se comia un 403 y un toast de error.
  const fetchInventario = useCallback(async () => {
    if (!puedeVerInventario) return;
    try {
      setLoadingInventario(true);
      const response = await inventarioApi.listarInventarioPorEspacio(espacioId);
      if (response.data) setInventario(response.data);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'No se pudo cargar el inventario del espacio';
      console.error('Error al cargar inventario:', error);
      toast.error('Error al cargar inventario', { description: errorMessage });
    } finally {
      setLoadingInventario(false);
    }
  }, [espacioId, puedeVerInventario]);

  const fetchReservas = useCallback(async () => {
    try {
      setLoadingReservas(true);
      const response = await reservationsApi.obtenerReservasPorEspacio(espacioId);
      if (response.data) setReservas(response.data);
    } catch (error: unknown) {
      console.warn('No se pudieron cargar las reservas del espacio:', error);
    } finally {
      setLoadingReservas(false);
    }
  }, [espacioId]);

  useEffect(() => {
    fetchEspacio();
    fetchInventario();
    fetchReservas();
  }, [fetchEspacio, fetchInventario, fetchReservas]);

  useEffect(() => {
    if (espacio) document.title = `Espacios - ${espacio.nombre}`;
    else document.title = 'Espacios';
    return () => { document.title = 'USM Space Manager'; };
  }, [espacio]);

  // Próximas reservas (futuras, no canceladas), ordenadas por inicio
  const proximasReservas = useMemo(() => {
    const ahora = Date.now();
    return reservas
      .filter(r => r.estado !== 'CANCELADO' && new Date(r.inicio).getTime() >= ahora)
      .sort((a, b) => new Date(a.inicio).getTime() - new Date(b.inicio).getTime())
      .slice(0, 5);
  }, [reservas]);

  // Stats del inventario
  const inventarioStats = useMemo(() => {
    const total = inventario.reduce((acc, i) => acc + (i.cantidad || 1), 0);
    const disponibles = inventario.filter(i => i.estado === 'DISPONIBLE').reduce((a, i) => a + (i.cantidad || 1), 0);
    const mantenimiento = inventario.filter(i => i.estado === 'MANTENIMIENTO').reduce((a, i) => a + (i.cantidad || 1), 0);
    const danados = inventario.filter(i => i.estado === 'DANADO').reduce((a, i) => a + (i.cantidad || 1), 0);
    return { total, disponibles, mantenimiento, danados };
  }, [inventario]);

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
      setInventario(prev => {
        const index = prev.findIndex(i => i.id === item.id);
        if (index !== -1) {
          const newInventario = [...prev];
          newInventario[index] = item;
          return newInventario;
        }
        return prev.map(i => i.id === item.id ? item : i);
      });
    } else {
      setInventario(prev => [...prev, item]);
    }
    setSelectedInventarioItem(null);
  };

  const handleDeleteInventarioSuccess = () => {
    if (selectedInventarioItem) {
      setInventario(prev => prev.filter(i => i.id !== selectedInventarioItem.id));
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

  const handleBack = () => navigate(-1);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <Card><CardContent className="p-6"><Skeleton className="h-48 w-full" /></CardContent></Card>
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

  const estadoConfig = getEstadoConfig(espacio.estado);
  const EstadoIcon = estadoConfig.icon;

  const statCells: { label: string; value: string | number; accent?: string; icon: typeof Users }[] = [
    { label: 'Capacidad', value: `${espacio.capacidad}`, icon: Users },
    { label: 'Total items', value: inventarioStats.total, icon: Package },
    { label: 'Disponibles', value: inventarioStats.disponibles, accent: 'text-utec-green', icon: CheckCircle },
    { label: 'Mantenimiento', value: inventarioStats.mantenimiento, accent: 'text-utec-yellow', icon: Wrench },
    { label: 'Dañados', value: inventarioStats.danados, accent: 'text-utec-red', icon: AlertCircle },
    { label: 'Próximas reservas', value: proximasReservas.length, accent: 'text-utec-blue', icon: CalendarClock },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            className="h-9 mt-0.5"
          >
            <ArrowLeft className="h-4 w-4 mr-1.5" />
            Volver
          </Button>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold leading-tight">{espacio.nombre}</h1>
              <Badge className={`${estadoConfig.color} border font-medium`}>
                <EstadoIcon className="h-3.5 w-3.5 mr-1.5" />
                {estadoConfig.label}
              </Badge>
              {espacio.tipoEspacioNombre && espacio.tipoEspacioNombre !== espacio.nombre && (
                espacio.tipoEspacioColor ? (
                  <span
                    className="px-2 py-0.5 rounded text-white text-xs font-medium"
                    style={{ backgroundColor: espacio.tipoEspacioColor }}
                  >
                    {espacio.tipoEspacioNombre}
                  </span>
                ) : (
                  <Badge className="bg-muted text-foreground">
                    {espacio.tipoEspacioNombre}
                  </Badge>
                )
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              <span className="font-medium text-foreground">{espacio.capacidad}</span> personas
              {espacio.edificioNombre && <> · {espacio.edificioNombre}</>}
              {' · creado el '}
              {new Date(espacio.createdAt).toLocaleDateString('es-ES')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <PermissionGuard requiredPermission="espacio:editar">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setEditDialog(true)}
                  aria-label="Editar"
                  className="h-9 w-9"
                >
                  <Edit className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Editar</TooltipContent>
            </Tooltip>
          </PermissionGuard>
          <PermissionGuard requiredPermission="espacio:eliminar">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setDeleteDialog(true)}
                  aria-label="Eliminar"
                  className="h-9 w-9 text-utec-red hover:text-utec-red"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Eliminar</TooltipContent>
            </Tooltip>
          </PermissionGuard>
        </div>
      </div>

      {/* Strip de stats */}
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 text-sm">
        {statCells.map(({ label, value, accent, icon: Icon }) => (
          <div key={label} className="rounded-lg bg-chrome text-white px-3 py-2 min-w-0">
            <div className="flex items-center gap-1.5 text-2xs text-white/60 mb-0.5">
              <Icon className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{label}</span>
            </div>
            <div className={`text-lg font-semibold tabular-nums ${accent ?? ''}`}>{value}</div>
          </div>
        ))}
      </div>

      {/* Row: Imagen + Info (izq) | Próximas reservas (der) */}
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
        {/* Columna izquierda: imagen + información */}
        <div className="space-y-4">
          {/* Imagen / placeholder compacto */}
          <div className="rounded-xl border bg-card overflow-hidden">
            {espacio.imagenUrl ? (
              <SpaceImage
                src={espacio.imagenUrl}
                thumbSrc={espacio.imagenThumbUrl}
                alt={espacio.nombre}
              />
            ) : (
              <div className="aspect-[16/7] bg-chrome flex flex-col items-center justify-center gap-2">
                <Building2 className="h-10 w-10 text-white/30" />
                <span className="text-xs text-white/40">Sin imagen</span>
              </div>
            )}
          </div>

          {/* Información del espacio */}
          <Section
            title="Información del espacio"
            icon={<Building2 className="h-4 w-4 text-utec-blue" />}
            accentClass="bg-utec-blue"
            bodyClass="p-0"
          >
            <dl className="divide-y divide-border/60">
              <div className="flex items-center justify-between px-4 py-2 text-sm">
                <dt className="flex items-center gap-2 text-muted-foreground">
                  <Users className="h-4 w-4" /> Capacidad
                </dt>
                <dd className="font-semibold tabular-nums">{espacio.capacidad} personas</dd>
              </div>
              <div className="flex items-center justify-between px-4 py-2 text-sm">
                <dt className="flex items-center gap-2 text-muted-foreground">
                  <Package className="h-4 w-4" /> Tipo
                </dt>
                <dd>
                  {espacio.tipoEspacioColor ? (
                    <span
                      className="px-2 py-0.5 rounded text-white text-xs font-medium"
                      style={{ backgroundColor: espacio.tipoEspacioColor }}
                    >
                      {espacio.tipoEspacioNombre}
                    </span>
                  ) : (
                    <Badge className="bg-muted text-foreground">
                      {espacio.tipoEspacioNombre || 'Sin tipo'}
                    </Badge>
                  )}
                </dd>
              </div>
              {espacio.edificioNombre && (
                <div className="flex items-center justify-between px-4 py-2 text-sm">
                  <dt className="flex items-center gap-2 text-muted-foreground">
                    <Building2 className="h-4 w-4" /> Edificio
                  </dt>
                  <dd className="font-medium">{espacio.edificioNombre}</dd>
                </div>
              )}
              <div className="flex items-center justify-between px-4 py-2 text-sm">
                <dt className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4" /> Creado
                </dt>
                <dd>{new Date(espacio.createdAt).toLocaleDateString('es-ES')}</dd>
              </div>
            </dl>
          </Section>
        </div>

        {/* Columna derecha: próximas reservas */}
        <Section
          title="Próximas reservas"
          icon={<CalendarClock className="h-4 w-4 text-utec-green" />}
          accentClass="bg-utec-green"
          bodyClass=""
        >
          {(() => {
            if (loadingReservas) {
              return (
                <div className="p-4 space-y-2">
                  {Array.from({ length: 3 }, (_, i) => `r-skel-${i}`).map(k => (
                    <Skeleton key={k} className="h-8 w-full" />
                  ))}
                </div>
              );
            }
            if (proximasReservas.length === 0) {
              return (
                <div className="p-6 text-center text-sm text-muted-foreground">
                  No hay reservas próximas para este espacio.
                </div>
              );
            }
            return (
              <div className="divide-y divide-border/60">
                {proximasReservas.map(r => {
                  const inicio = new Date(r.inicio);
                  const fin = new Date(r.fin);
                  const estadoBadgeClass = r.estado === 'APROBADO'
                    ? 'bg-utec-green text-white border-utec-green'
                    : 'bg-utec-yellow text-utec-dark border-utec-yellow';
                  return (
                    <button
                      type="button"
                      key={r.id}
                      onClick={() => navigate(`/reservations?reservaId=${r.id}`)}
                      className="w-full text-left flex items-center justify-between px-4 py-2.5 text-sm hover:bg-muted/40 transition-colors"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{r.titulo}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {format(inicio, "d 'de' MMM, HH:mm", { locale: es })} – {format(fin, 'HH:mm', { locale: es })}
                          {' · '}
                          {r.usuarioNombre}
                        </p>
                      </div>
                      <Badge className={`${estadoBadgeClass} border font-medium ml-2`}>
                        {r.estado === 'APROBADO' ? 'Aprobada' : 'Pendiente'}
                      </Badge>
                    </button>
                  );
                })}
              </div>
            );
          })()}
        </Section>
      </div>

      {/* Inventario: solo para quien lo administra. */}
      {puedeVerInventario && (
      <Section
        title="Inventario del espacio"
        icon={<Package className="h-4 w-4 text-utec-yellow" />}
        accentClass="bg-utec-yellow"
        bodyClass=""
        actions={
          <PermissionGuard requiredPermission="inventario:crear">
            <Button onClick={handleAddInventario} size="sm" variant="secondary" className="h-7">
              <Plus className="h-3.5 w-3.5 mr-1" />
              Agregar elemento
            </Button>
          </PermissionGuard>
        }
      >
        {(() => {
          if (loadingInventario) {
            return (
              <div className="p-4 space-y-2">
                {Array.from({ length: 3 }, (_, index) => `inv-skeleton-${index}`).map(skeletonKey => (
                  <div key={skeletonKey} className="flex items-center space-x-4">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                ))}
              </div>
            );
          }
          if (inventario.length === 0) {
            return (
              <div className="text-center py-8">
                <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Sin inventario</h3>
                <p className="text-muted-foreground">
                  Este espacio no tiene inventario registrado.
                </p>
              </div>
            );
          }
          return (
            <>
              {/* Vista de cards en móvil */}
              <div className="md:hidden space-y-3 p-4">
                {inventario.map(item => {
                  const cfg = getEstadoConfig(item.estado);
                  const Icon = cfg.icon;
                  return (
                    <Card key={item.id} className="shadow-sm">
                      <CardContent className="p-4 space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <p className="font-semibold text-sm mb-1">{item.tipoElementoNombre}</p>
                            <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                              <span>Cant: {item.cantidad}</span>
                            </div>
                          </div>
                          <Badge className={`${cfg.color} border font-medium`}>
                            <Icon className="h-3.5 w-3.5 mr-1.5" />
                            {cfg.label}
                          </Badge>
                        </div>

                        <div className="flex gap-2 pt-2 border-t">
                          <PermissionGuard requiredPermission="inventario:editar">
                            <Button variant="outline" size="sm" onClick={() => handleEditInventario(item)} className="flex-1">
                              <Edit className="h-3 w-3 mr-1" />
                              Editar
                            </Button>
                          </PermissionGuard>
                          <PermissionGuard requiredPermission="inventario:eliminar">
                            <Button variant="outline" size="sm" onClick={() => handleDeleteInventario(item)} className="flex-1">
                              <Trash2 className="h-3 w-3 mr-1" />
                              Eliminar
                            </Button>
                          </PermissionGuard>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {/* Vista de tabla en desktop */}
              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent border-b-0">
                      <TableHead className="h-10 bg-chrome text-white/70">Tipo de Elemento</TableHead>
                      <TableHead className="h-10 bg-chrome text-white/70">Cantidad</TableHead>
                      <TableHead className="h-10 bg-chrome text-white/70">Estado</TableHead>
                      <PermissionGuard requiredPermissions={['inventario:editar', 'inventario:eliminar']}>
                        <TableHead className="h-10 bg-chrome text-white/70 text-right">Acciones</TableHead>
                      </PermissionGuard>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {inventario.map(item => {
                      const cfg = getEstadoConfig(item.estado);
                      const Icon = cfg.icon;
                      return (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">{item.tipoElementoNombre}</TableCell>
                          <TableCell>{item.cantidad}</TableCell>
                          <TableCell>
                            <Badge className={`${cfg.color} border font-medium`}>
                              <Icon className="h-3.5 w-3.5 mr-1.5" />
                              {cfg.label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1 justify-end">
                              <PermissionGuard requiredPermission="inventario:editar">
                                <Button variant="outline" size="sm" onClick={() => handleEditInventario(item)}>
                                  <Edit className="h-3 w-3" />
                                </Button>
                              </PermissionGuard>
                              <PermissionGuard requiredPermission="inventario:eliminar">
                                <Button variant="outline" size="sm" onClick={() => handleDeleteInventario(item)}>
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </PermissionGuard>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </>
          );
        })()}
      </Section>
      )}

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
