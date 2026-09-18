import { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/Button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserStatsCards } from './UserStatsCards';
import { EditUserDialog } from './EditUserDialog';
import { exportUsersToCSV } from '@/lib/utils/csv-export';
import { formatDate, formatRelativeTime } from '@/lib/utils/date-helpers';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Switch } from "@/components/ui/switch";
import { AvatarInitials } from "@/components/ui/avatar-initials";
import { StatusBadge } from "@/components/ui/status-badge";
import { FilterBar } from "@/components/ui/filter-bar";
import type { FilterItem } from "@/components/ui/filter-bar";
import { EmptyState } from "@/components/ui/empty-state";
import { usuariosApi } from '@/lib/api/users';
import { USER_ROLES, ROLE_LABELS, ROLE_BADGE_VARIANTS, ROLES } from '@/lib/config/constants';
import type { User, UserRole, UserFilters } from '@/lib/types/users';
import PermissionGuard from '@/components/auth/PermissionGuard';
import { PageHeader, HEADER_ACTION_ICON } from '@/components/layouts/PageHeader';
import { 
  Search, 
  ChevronLeft,
  ChevronRight, 
  Shield, 
  Mail, 
  Monitor, 
  Loader2, 
  RefreshCw, 
  Eye,
  Filter,
  Users as UsersIcon,
  Download,
  Edit,
  Mail as MailIcon,
  KeyRound,
  UserCog,
  CheckCircle2,
  XCircle,
  Hourglass,
} from 'lucide-react';
import {
  PopoverFilterSection,
  EnumFilterSection,
  DateRangeFilterSection,
  ClearFiltersButton,
} from '@/components/ui/compact-filter';
import { toast } from 'sonner';
import { MARCA } from '@/lib/design/paleta';

// Componente para mostrar el icono del proveedor
const ProviderIcon = ({ provider }: { provider?: string }) => {
  if (provider?.toLowerCase() === 'google') {
    return (
      <div className="flex items-center justify-center" title="Google">
        <img src="/google-icon.svg" alt="Google" className="h-5 w-5" />
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center text-muted-foreground" title="Local">
      <Monitor className="h-5 w-5" />
    </div>
  );
};

// Construye los chips de filtro activos a partir del estado de filtros
function buildActiveUserFilters(
  filters: UserFilters,
  setSearchInput: (value: string) => void,
  setFilters: React.Dispatch<React.SetStateAction<UserFilters>>
): FilterItem[] {
  const items: FilterItem[] = [];
  if (filters.search) {
    items.push({
      id: 'search',
      label: `Búsqueda: ${filters.search}`,
      value: filters.search,
      onRemove: () => {
        setSearchInput('');
        setFilters(prev => ({ ...prev, search: undefined }));
      },
    });
  }
  if (filters.rol) {
    items.push({
      id: 'rol',
      label: `Rol: ${ROLE_LABELS[filters.rol]}`,
      value: filters.rol,
      onRemove: () => setFilters(prev => ({ ...prev, rol: undefined })),
    });
  }
  if (filters.verificado !== undefined) {
    items.push({
      id: 'verificado',
      label: `Verificado: ${filters.verificado ? 'Sí' : 'No'}`,
      value: filters.verificado,
      onRemove: () => setFilters(prev => ({ ...prev, verificado: undefined })),
    });
  }
  if (filters.activo !== undefined) {
    items.push({
      id: 'activo',
      label: `Estado: ${filters.activo ? 'Activo' : 'Inactivo'}`,
      value: filters.activo,
      onRemove: () => setFilters(prev => ({ ...prev, activo: undefined })),
    });
  }
  if (filters.fechaDesde) {
    items.push({
      id: 'fechaDesde',
      label: `Desde: ${filters.fechaDesde}`,
      value: filters.fechaDesde,
      onRemove: () => setFilters(prev => ({ ...prev, fechaDesde: undefined })),
    });
  }
  if (filters.fechaHasta) {
    items.push({
      id: 'fechaHasta',
      label: `Hasta: ${filters.fechaHasta}`,
      value: filters.fechaHasta,
      onRemove: () => setFilters(prev => ({ ...prev, fechaHasta: undefined })),
    });
  }
  return items;
}

// Updaters reutilizables para mantener bajo el nivel de anidación en los
// handlers de UserManagement (S2004).
const updateUserRole = (newRole: UserRole) => (u: User): User => ({ ...u, rolApp: newRole });
const updateUserActivo = (activo: boolean) => (u: User): User => ({ ...u, activo });

// Convierte un filtro booleano opcional al string que usa el control select.
// Reemplaza un usuario por id en la lista, manteniendo la posición original
function replaceUserById(prevUsers: User[], userId: number, updater: (u: User) => User): User[] {
  const index = prevUsers.findIndex(u => u.id === userId);
  if (index !== -1) {
    const newUsers = [...prevUsers];
    newUsers[index] = updater(newUsers[index]);
    return newUsers;
  }
  return prevUsers.map(u => (u.id === userId ? updater(u) : u));
}

// Ejecuta una acción async con toast de éxito/error y maneja el spinner.
async function runUserAction(
  action: () => Promise<void>,
  opts: {
    errorTitle: string;
    defaultErrorMessage: string;
    setBusy?: (busy: boolean) => void;
    onError?: () => void;
    onFinally?: () => void;
  },
): Promise<void> {
  opts.setBusy?.(true);
  try {
    await action();
  } catch (error: unknown) {
    const description = error instanceof Error ? error.message : opts.defaultErrorMessage;
    console.error(`${opts.errorTitle}:`, error);
    toast.error(opts.errorTitle, { description });
    opts.onError?.();
  } finally {
    opts.setBusy?.(false);
    opts.onFinally?.();
  }
}

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [pageSize] = useState(10);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Filtros
  const [filters, setFilters] = useState<UserFilters>({});
  const [searchInput, setSearchInput] = useState('');
  

  // Modal de cambio de rol
  const [changeRoleDialog, setChangeRoleDialog] = useState(false);
  const [changingRole, setChangingRole] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newRole, setNewRole] = useState<UserRole>(ROLES.ESTUDIANTE);
  
  // Modal de confirmación de cambio de estado
  const [confirmStatusDialog, setConfirmStatusDialog] = useState(false);
  const [userToToggle, setUserToToggle] = useState<User | null>(null);
  const [togglingStatus, setTogglingStatus] = useState(false);
  
  // Modal de detalles de usuario
  const [detailsDialog, setDetailsDialog] = useState(false);
  const [userDetails, setUserDetails] = useState<User | null>(null);
  
  // Modal de edición de usuario
  const [editDialog, setEditDialog] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  
  // Estado para reenvío de verificación
  const [resendingVerification, setResendingVerification] = useState(false);
  
  // Estado para restablecimiento de contraseña
  const [resettingPassword, setResettingPassword] = useState(false);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await usuariosApi.listarUsuarios(page, pageSize, filters);
      const pagedData = response.data || response;
      
      if (pagedData && typeof pagedData === 'object' && 'content' in pagedData) {
        setUsers(pagedData.content);
        setTotalPages(pagedData.totalPages);
        setTotalElements(pagedData.totalElements);
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'No se pudo cargar la lista de usuarios';
      console.error('Error al cargar usuarios:', error);
      toast.error('Error al cargar usuarios', {
        description: errorMessage
      });
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, filters]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Debouncer para búsqueda
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(0);
      setFilters(prev => ({ ...prev, search: searchInput || undefined }));
    }, 500);

    return () => clearTimeout(timer);
  }, [searchInput]);

  const updateFilter = <K extends keyof UserFilters>(patch: Partial<UserFilters>) => {
    setPage(0);
    setFilters(prev => ({ ...prev, ...patch } as UserFilters & Record<K, UserFilters[K]>));
  };

  const handleRoleFilter = (rol: string) =>
    updateFilter({ rol: rol === 'all' ? undefined : (rol as UserRole) });
  const handleVerificadoFilter = (value: string) =>
    updateFilter({ verificado: value === 'all' ? undefined : value === 'true' });
  const handleActivoFilter = (value: string) =>
    updateFilter({ activo: value === 'all' ? undefined : value === 'true' });
  const handleFechaDesdeFilter = (value: string) =>
    updateFilter({ fechaDesde: value || undefined });
  const handleFechaHastaFilter = (value: string) =>
    updateFilter({ fechaHasta: value || undefined });

  const openChangeRoleDialog = (user: User) => {
    setSelectedUser(user);
    setNewRole(user.rolApp);
    setChangeRoleDialog(true);
  };

  const handleChangeRole = () => {
    if (!selectedUser) return Promise.resolve();
    const userSnapshot = selectedUser;
    return runUserAction(
      async () => {
        await usuariosApi.cambiarRol(userSnapshot.id, newRole);
        setUsers(prev => replaceUserById(prev, userSnapshot.id, updateUserRole(newRole)));
        toast.success('Rol actualizado', {
          description: `El rol de ${userSnapshot.nombre} se actualizó a ${ROLE_LABELS[newRole]}`,
        });
      },
      {
        errorTitle: 'Error al cambiar rol',
        defaultErrorMessage: 'No se pudo actualizar el rol del usuario',
        setBusy: setChangingRole,
        onError: () => fetchUsers(),
        onFinally: () => setChangeRoleDialog(false),
      },
    );
  };

  const openConfirmStatusDialog = (user: User) => {
    setUserToToggle(user);
    setConfirmStatusDialog(true);
  };

  const handleToggleActivo = () => {
    if (!userToToggle) return Promise.resolve();
    const userSnapshot = userToToggle;
    const newStatus = !userSnapshot.activo;
    const action = newStatus ? 'activado' : 'desactivado';
    return runUserAction(
      async () => {
        await usuariosApi.toggleActivo(userSnapshot.id);
        setUsers(prev => replaceUserById(prev, userSnapshot.id, updateUserActivo(newStatus)));
        toast.success(`Usuario ${action}`, {
          description: `${userSnapshot.nombre} ha sido ${action} exitosamente`,
        });
      },
      {
        errorTitle: 'Error al cambiar estado',
        defaultErrorMessage: 'No se pudo cambiar el estado del usuario',
        setBusy: setTogglingStatus,
        onError: () => fetchUsers(),
        onFinally: () => setConfirmStatusDialog(false),
      },
    );
  };

  const clearFilters = () => {
    setSearchInput('');
    setFilters({});
    setPage(0);
    toast.info('Filtros limpiados');
  };

  const handleExportCSV = () => runUserAction(
    async () => {
      await exportUsersToCSV(filters);
      toast.success('Exportación completada', {
        description: 'El archivo CSV se ha descargado exitosamente',
      });
    },
    { errorTitle: 'Error al exportar', defaultErrorMessage: 'No se pudo exportar el archivo CSV' },
  );

  const openEditDialog = (user: User) => {
    setEditingUser(user);
    setEditDialog(true);
  };

  const handleEditSuccess = (updatedUser: User) => {
    setUsers(prevUsers => replaceUserById(prevUsers, updatedUser.id, () => updatedUser));
    setEditDialog(false);
  };

  const handleResendVerification = (userId: number) => runUserAction(
    async () => {
      await usuariosApi.reenviarVerificacion(userId);
      toast.success('Email reenviado', { description: 'Se ha reenviado el email de verificación' });
    },
    {
      errorTitle: 'Error al reenviar',
      defaultErrorMessage: 'No se pudo reenviar el email de verificación',
      setBusy: setResendingVerification,
    },
  );

  const handleResetPassword = (userId: number, userName: string) => runUserAction(
    async () => {
      await usuariosApi.restablecerPassword(userId);
      toast.success('Contraseña restablecida', {
        description: `Se ha enviado una nueva contraseña temporal a ${userName}`,
      });
    },
    {
      errorTitle: 'Error al restablecer',
      defaultErrorMessage: 'No se pudo restablecer la contraseña',
      setBusy: setResettingPassword,
    },
  );

  const handleRefresh = async () => {
    setIsRefreshing(true);
    const startTime = Date.now();
    
    await fetchUsers();
    toast.success('Lista actualizada');
    
    // Asegurar que la animación complete al menos 600ms
    const elapsed = Date.now() - startTime;
    const remaining = Math.max(0, 600 - elapsed);
    
    setTimeout(() => {
      setIsRefreshing(false);
    }, remaining);
  };

  const openDetailsDialog = (user: User) => {
    setUserDetails(user);
    setDetailsDialog(true);
  };

  // Crear array de filtros activos para FilterBar
  const activeFilters: FilterItem[] = useMemo(
    () => buildActiveUserFilters(filters, setSearchInput, setFilters),
    [filters]
  );


  if (loading && users.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin mx-auto text-muted-foreground" />
          <p className="text-muted-foreground">Cargando usuarios...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Usuarios"
        count={totalElements}
        description="Cuentas del sistema, sus roles y su estado."
        accentColor={MARCA.azul}
        actions={
          <>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={isRefreshing ? undefined : handleRefresh}
                  disabled={isRefreshing}
                  aria-label="Actualizar"
                  className={HEADER_ACTION_ICON}
                >
                  <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin-once' : ''}`} key={isRefreshing ? 'spinning' : 'static'} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Actualizar</TooltipContent>
            </Tooltip>

            <PermissionGuard requiredPermission="usuario:gestionar">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleExportCSV}
                    aria-label="Exportar CSV"
                    className={HEADER_ACTION_ICON}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Exportar CSV</TooltipContent>
              </Tooltip>
            </PermissionGuard>
          </>
        }
      />

      {/* Estadísticas de usuarios */}
      <UserStatsCards />

      {/* Tabla de usuarios con filtros embebidos */}
      <div className="border rounded-lg shadow-card overflow-hidden bg-card">
        <div className="px-4 pt-4 pb-3">
          <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Buscar por email o nombre..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <PopoverFilterSection<string>
                selectedId={filters.rol ?? null}
                items={USER_ROLES.map(r => ({ id: r, primary: ROLE_LABELS[r] }))}
                onChange={(v) => handleRoleFilter(v ?? '')}
                Icon={UserCog}
                tooltipNone="Todos los roles"
                activeBgClass="bg-info-suave text-info-texto shadow-md ring-1 ring-info-borde"
                activeTextColorClass="text-info-texto"
              />
              <EnumFilterSection
                value={filters.verificado === undefined ? null : (filters.verificado ? 'true' : 'false')}
                options={[
                  { value: null, tooltip: 'Todos', Icon: Filter },
                  {
                    value: 'true',
                    tooltip: 'Verificados',
                    Icon: CheckCircle2,
                    activeColorClass: 'text-success-texto',
                    inactiveColorClass: 'text-success',
                  },
                  {
                    value: 'false',
                    tooltip: 'Sin verificar',
                    Icon: Hourglass,
                    activeColorClass: 'text-warning-texto',
                    inactiveColorClass: 'text-warning',
                  },
                ]}
                onChange={(v) => handleVerificadoFilter(v ?? '')}
              />
              <EnumFilterSection
                value={filters.activo === undefined ? null : (filters.activo ? 'true' : 'false')}
                options={[
                  { value: null, tooltip: 'Todos', Icon: Filter },
                  {
                    value: 'true',
                    tooltip: 'Activos',
                    Icon: CheckCircle2,
                    activeColorClass: 'text-success-texto',
                    inactiveColorClass: 'text-success',
                  },
                  {
                    value: 'false',
                    tooltip: 'Inactivos',
                    Icon: XCircle,
                    activeColorClass: 'text-danger-texto',
                    inactiveColorClass: 'text-danger',
                  },
                ]}
                onChange={(v) => handleActivoFilter(v ?? '')}
              />
              <DateRangeFilterSection
                fechaInicio={filters.fechaDesde ? new Date(filters.fechaDesde) : undefined}
                fechaFin={filters.fechaHasta ? new Date(filters.fechaHasta) : undefined}
                onFechaInicioChange={(d) =>
                  handleFechaDesdeFilter(d ? d.toISOString().slice(0, 10) : '')
                }
                onFechaFinChange={(d) =>
                  handleFechaHastaFilter(d ? d.toISOString().slice(0, 10) : '')
                }
              />
              <ClearFiltersButton
                visible={activeFilters.length > 0}
                onClear={clearFilters}
              />
            </div>
          </div>
          {activeFilters.length > 0 && (
            <FilterBar
              filters={activeFilters}
              onClearAll={clearFilters}
              className="mt-3"
            />
          )}
        </div>
        {users.length === 0 ? (
          <EmptyState
            icon={UsersIcon}
            title="No se encontraron usuarios"
            description="No hay usuarios que coincidan con los criterios de búsqueda"
            action={{
              label: 'Limpiar filtros',
              onClick: clearFilters
            }}
          />
        ) : (
            <>
              {/* Vista de tabla para desktop (1280px+) */}
              <div className="hidden xl:block px-4 pt-2">
                <div className="border rounded-lg overflow-hidden">
                <Table>
                    <TableHeader className="bg-chrome">
                      <TableRow className="hover:bg-transparent border-b-0">
                        <TableHead className="h-10 text-white/80 min-w-[200px]">Email</TableHead>
                        <TableHead className="h-10 text-white/80 min-w-[150px]">Nombre</TableHead>
                        <TableHead className="h-10 text-white/80">Rol</TableHead>
                        <TableHead className="h-10 text-white/80 text-center">Estado</TableHead>
                        <TableHead className="h-10 text-white/80 text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((user) => (
                        <TableRow 
                          key={user.id} 
                          className="hover:bg-muted/60 transition-colors"
                        >
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <AvatarInitials name={user.nombre} email={user.email} size="md" />
                              <p className="text-sm truncate">{user.email}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <p className="font-medium truncate">{user.nombre}</p>
                          </TableCell>
                          <TableCell>
                            <Badge variant={ROLE_BADGE_VARIANTS[user.rolApp]} className="whitespace-nowrap">
                              {ROLE_LABELS[user.rolApp]}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <PermissionGuard requiredPermission="usuario:gestionar">
                              <div className="flex items-center justify-center gap-2">
                                <Switch
                                  checked={user.activo}
                                  onCheckedChange={() => openConfirmStatusDialog(user)}
                                />
                                <span className="text-sm">
                                  {user.activo ? 'Activo' : 'Inactivo'}
                                </span>
                              </div>
                            </PermissionGuard>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => openDetailsDialog(user)}
                                    aria-label="Ver detalles"
                                    className="h-8 w-8"
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Ver detalles</TooltipContent>
                              </Tooltip>
                              <PermissionGuard requiredPermission="usuario:gestionar">
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => openEditDialog(user)}
                                      aria-label="Editar usuario"
                                      className="h-8 w-8"
                                    >
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Editar usuario</TooltipContent>
                                </Tooltip>
                              </PermissionGuard>
                              <PermissionGuard requiredPermission="usuario:gestionar">
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => openChangeRoleDialog(user)}
                                      aria-label="Cambiar rol"
                                      className="h-8 w-8"
                                    >
                                      <Shield className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Cambiar rol</TooltipContent>
                                </Tooltip>
                              </PermissionGuard>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Vista de cards para móvil, tablet y desktop pequeño (< 1280px) */}
              <div className="xl:hidden space-y-3 px-4 py-3">
                {users.map((user) => (
                  <Card key={user.id} className="shadow-sm hover-lift">
                    <CardContent className="p-4">
                      <div className="space-y-4">
                        {/* Header del card */}
                        <div className="flex items-start gap-3">
                          <AvatarInitials name={user.nombre} email={user.email} size="lg" />
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold truncate">{user.nombre}</p>
                            <p className="text-sm text-muted-foreground truncate flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {user.email}
                            </p>
                          </div>
                          <PermissionGuard requiredPermission="usuario:gestionar">
                            <Switch
                              checked={user.activo}
                              onCheckedChange={() => openConfirmStatusDialog(user)}
                            />
                          </PermissionGuard>
                        </div>

                        {/* Badges */}
                        <div className="flex flex-wrap gap-2">
                          <Badge variant={ROLE_BADGE_VARIANTS[user.rolApp]}>
                            {ROLE_LABELS[user.rolApp]}
                          </Badge>
                          <StatusBadge 
                            status={user.verificado ? 'success' : 'neutral'}
                            label={user.verificado ? 'Verificado' : 'Pendiente'}
                            icon={false}
                          />
                          <Badge variant={user.activo ? "default" : "secondary"}>
                            {user.activo ? 'Activo' : 'Inactivo'}
                          </Badge>
                          <div className="flex items-center gap-1">
                            <ProviderIcon provider={user.oauthProv} />
                          </div>
                        </div>

                        {/* Acciones */}
                        <div className="flex gap-2 pt-2 border-t">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openDetailsDialog(user)}
                            className="flex-1 rounded-2xl"
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Ver
                          </Button>
                          <PermissionGuard requiredPermission="usuario:gestionar">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openEditDialog(user)}
                              className="flex-1 rounded-2xl"
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Editar
                            </Button>
                          </PermissionGuard>
                          <PermissionGuard requiredPermission="usuario:gestionar">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openChangeRoleDialog(user)}
                              className="flex-1 rounded-2xl"
                            >
                              <Shield className="h-4 w-4 mr-2" />
                              Rol
                            </Button>
                          </PermissionGuard>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Paginación */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-3">
                <p className="text-sm text-muted-foreground">
                  Mostrando {users.length} de {totalElements} usuarios (Página {page + 1} de {totalPages})
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
      </div>

      {/* Dialog para cambiar rol */}
      <Dialog open={changeRoleDialog} onOpenChange={setChangeRoleDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Cambiar rol de usuario</DialogTitle>
            <DialogDescription>
              Selecciona el nuevo rol para {selectedUser?.nombre}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="new-role">Nuevo rol</Label>
              <Select value={newRole} onValueChange={(value) => setNewRole(value as UserRole)}>
                <SelectTrigger id="new-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {USER_ROLES.map(role => (
                    <SelectItem key={role} value={role}>
                      {ROLE_LABELS[role]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="text-sm text-muted-foreground space-y-1 p-3 bg-muted rounded-lg">
              <p><strong>Email:</strong> {selectedUser?.email}</p>
              <p><strong>Rol actual:</strong> {selectedUser && ROLE_LABELS[selectedUser.rolApp]}</p>
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setChangeRoleDialog(false)} 
              disabled={changingRole}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleChangeRole} 
              disabled={newRole === selectedUser?.rolApp || changingRole}
            >
              {changingRole && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Guardar cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmación para cambiar estado */}
      <AlertDialog open={confirmStatusDialog} onOpenChange={setConfirmStatusDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {userToToggle?.activo ? 'Desactivar usuario' : 'Activar usuario'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {userToToggle?.activo ? (
                <>
                  ¿Estás seguro de que deseas <strong>desactivar</strong> a{' '}
                  <strong>{userToToggle?.nombre}</strong>? El usuario no podrá acceder al sistema.
                </>
              ) : (
                <>
                  ¿Estás seguro de que deseas <strong>activar</strong> a{' '}
                  <strong>{userToToggle?.nombre}</strong>? El usuario podrá acceder al sistema nuevamente.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="text-sm text-muted-foreground space-y-1 py-2 px-3 bg-muted rounded-lg">
            <p><strong>Email:</strong> {userToToggle?.email}</p>
            <p><strong>Rol:</strong> {userToToggle && ROLE_LABELS[userToToggle.rolApp]}</p>
            <p><strong>Estado actual:</strong> {userToToggle?.activo ? 'Activo' : 'Inactivo'}</p>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={togglingStatus}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleToggleActivo}
              disabled={togglingStatus}
            >
              {togglingStatus && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog de detalles del usuario */}
      <Dialog open={detailsDialog} onOpenChange={setDetailsDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Detalles del Usuario</DialogTitle>
            <DialogDescription>
              Información completa del usuario
            </DialogDescription>
          </DialogHeader>
          {userDetails && (
            <div className="space-y-4 py-4">
              {/* Avatar y nombre */}
              <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
                <AvatarInitials name={userDetails.nombre} email={userDetails.email} size="xl" />
                <div>
                  <p className="font-semibold text-lg">{userDetails.nombre}</p>
                  <p className="text-sm text-muted-foreground">{userDetails.email}</p>
                </div>
              </div>

              {/* Información básica */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">ID</Label>
                  <p className="font-medium">{userDetails.id}</p>
                </div>
                
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Rol</Label>
                  <div>
                    <Badge variant={ROLE_BADGE_VARIANTS[userDetails.rolApp]}>
                      {ROLE_LABELS[userDetails.rolApp]}
                    </Badge>
                  </div>
                </div>
                
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Verificado</Label>
                  <div className="flex items-center gap-2">
                    <StatusBadge 
                      status={userDetails.verificado ? 'success' : 'neutral'}
                      label={userDetails.verificado ? 'Verificado' : 'Pendiente'}
                    />
                    {!userDetails.verificado && (
                      <PermissionGuard requiredPermission="usuario:gestionar">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleResendVerification(userDetails.id)}
                          disabled={resendingVerification}
                          className="h-6 px-2 text-xs"
                        >
                          {resendingVerification ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <MailIcon className="h-3 w-3 mr-1" />
                          )}
                          Reenviar
                        </Button>
                      </PermissionGuard>
                    )}
                  </div>
                </div>
                
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Estado</Label>
                  <div>
                    <Badge variant={userDetails.activo ? "default" : "secondary"}>
                      {userDetails.activo ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </div>
                </div>
              </div>
              
              {/* Fechas */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Fecha de Registro</Label>
                  <p className="text-sm font-medium">{formatDate(userDetails.createdAt)}</p>
                  <p className="text-xs text-muted-foreground">{formatRelativeTime(userDetails.createdAt)}</p>
                </div>
                
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Última Actualización</Label>
                  <p className="text-sm font-medium">{formatDate(userDetails.updatedAt)}</p>
                  <p className="text-xs text-muted-foreground">{formatRelativeTime(userDetails.updatedAt)}</p>
                </div>
              </div>
              
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Proveedor de autenticación</Label>
                <div className="flex items-center gap-2">
                  <ProviderIcon provider={userDetails.oauthProv} />
                  <span className="text-sm">
                    {userDetails.oauthProv?.toLowerCase() === 'google' ? 'Google' : 'Local'}
                  </span>
                </div>
              </div>
              
              {/* Botón de restablecer contraseña */}
              <div className="col-span-2 pt-2 border-t">
                <PermissionGuard requiredPermission="usuario:gestionar">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleResetPassword(userDetails.id, userDetails.nombre)}
                    disabled={resettingPassword}
                    className="w-full"
                  >
                    {resettingPassword ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <KeyRound className="h-4 w-4 mr-2" />
                    )}
                    Restablecer Contraseña
                  </Button>
                  <p className="text-xs text-muted-foreground mt-2 text-center">
                    Se enviará una contraseña temporal por email
                  </p>
                </PermissionGuard>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailsDialog(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de edición de usuario */}
      <EditUserDialog
        user={editingUser}
        open={editDialog}
        onOpenChange={setEditDialog}
        onSuccess={handleEditSuccess}
      />

    </div>
  );
}
