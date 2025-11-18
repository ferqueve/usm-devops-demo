import { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/Button";
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
import { FiltersPanel, type FilterField } from "@/components/common/FiltersPanel";
import { usuariosApi } from '@/lib/api/users';
import { USER_ROLES, ROLE_LABELS, ROLE_BADGE_VARIANTS } from '@/lib/config/constants';
import type { User, UserRole, UserFilters } from '@/lib/types/users';
import PermissionGuard from '@/components/auth/PermissionGuard';
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
  KeyRound
} from 'lucide-react';
import { toast } from 'sonner';

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
  const [showFilters, setShowFilters] = useState(false);
  
  // Modal de cambio de rol
  const [changeRoleDialog, setChangeRoleDialog] = useState(false);
  const [changingRole, setChangingRole] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newRole, setNewRole] = useState<UserRole>('ESTUDIANTE');
  
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

  const handleRoleFilter = (rol: string) => {
    setPage(0);
    setFilters(prev => ({ 
      ...prev, 
      rol: rol === 'all' ? undefined : (rol as UserRole) 
    }));
  };

  const handleVerificadoFilter = (value: string) => {
    setPage(0);
    setFilters(prev => ({ 
      ...prev, 
      verificado: value === 'all' ? undefined : value === 'true' 
    }));
  };

  const handleActivoFilter = (value: string) => {
    setPage(0);
    setFilters(prev => ({ 
      ...prev, 
      activo: value === 'all' ? undefined : value === 'true' 
    }));
  };

  const handleFechaDesdeFilter = (value: string) => {
    setPage(0);
    setFilters(prev => ({ 
      ...prev, 
      fechaDesde: value || undefined 
    }));
  };

  const handleFechaHastaFilter = (value: string) => {
    setPage(0);
    setFilters(prev => ({ 
      ...prev, 
      fechaHasta: value || undefined 
    }));
  };

  const openChangeRoleDialog = (user: User) => {
    setSelectedUser(user);
    setNewRole(user.rolApp);
    setChangeRoleDialog(true);
  };

  const handleChangeRole = async () => {
    if (!selectedUser) return;

    try {
      setChangingRole(true);
      await usuariosApi.cambiarRol(selectedUser.id, newRole);
      
      setUsers(prevUsers => 
        prevUsers.map(u => 
          u.id === selectedUser.id 
            ? { ...u, rolApp: newRole }
            : u
        )
      );
      
      toast.success('Rol actualizado', {
        description: `El rol de ${selectedUser.nombre} se actualizó a ${ROLE_LABELS[newRole]}`
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'No se pudo actualizar el rol del usuario';
      console.error('Error al cambiar rol:', error);
      toast.error('Error al cambiar rol', {
        description: errorMessage
      });
      fetchUsers();
    } finally {
      setChangingRole(false);
      setChangeRoleDialog(false);
    }
  };

  const openConfirmStatusDialog = (user: User) => {
    setUserToToggle(user);
    setConfirmStatusDialog(true);
  };

  const handleToggleActivo = async () => {
    if (!userToToggle) return;

    try {
      setTogglingStatus(true);
      await usuariosApi.toggleActivo(userToToggle.id);
      
      const newStatus = !userToToggle.activo;
      const action = newStatus ? 'activado' : 'desactivado';
      
      setUsers(prevUsers => 
        prevUsers.map(u => 
          u.id === userToToggle.id 
            ? { ...u, activo: newStatus }
            : u
        )
      );
      
      toast.success(`Usuario ${action}`, {
        description: `${userToToggle.nombre} ha sido ${action} exitosamente`
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'No se pudo cambiar el estado del usuario';
      console.error('Error al cambiar estado:', error);
      toast.error('Error al cambiar estado', {
        description: errorMessage
      });
      fetchUsers();
    } finally {
      setTogglingStatus(false);
      setConfirmStatusDialog(false);
    }
  };

  const clearFilters = () => {
    setSearchInput('');
    setFilters({});
    setPage(0);
    toast.info('Filtros limpiados');
  };

  const handleExportCSV = async () => {
    try {
      await exportUsersToCSV(filters);
      toast.success('Exportación completada', {
        description: 'El archivo CSV se ha descargado exitosamente'
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'No se pudo exportar el archivo CSV';
      console.error('Error al exportar CSV:', error);
      toast.error('Error al exportar', {
        description: errorMessage
      });
    }
  };

  const openEditDialog = (user: User) => {
    setEditingUser(user);
    setEditDialog(true);
  };

  const handleEditSuccess = (updatedUser: User) => {
    setUsers(prevUsers => 
      prevUsers.map(u => 
        u.id === updatedUser.id ? updatedUser : u
      )
    );
    setEditDialog(false);
  };

  const handleResendVerification = async (userId: number) => {
    try {
      setResendingVerification(true);
      await usuariosApi.reenviarVerificacion(userId);
      toast.success('Email reenviado', {
        description: 'Se ha reenviado el email de verificación'
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'No se pudo reenviar el email de verificación';
      console.error('Error al reenviar verificación:', error);
      toast.error('Error al reenviar', {
        description: errorMessage
      });
    } finally {
      setResendingVerification(false);
    }
  };

  const handleResetPassword = async (userId: number, userName: string) => {
    try {
      setResettingPassword(true);
      await usuariosApi.restablecerPassword(userId);
      toast.success('Contraseña restablecida', {
        description: `Se ha enviado una nueva contraseña temporal a ${userName}`
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'No se pudo restablecer la contraseña';
      console.error('Error al restablecer contraseña:', error);
      toast.error('Error al restablecer', {
        description: errorMessage
      });
    } finally {
      setResettingPassword(false);
    }
  };

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
    
    if (filters.rol) {
      items.push({
        id: 'rol',
        label: `Rol: ${ROLE_LABELS[filters.rol]}`,
        value: filters.rol,
        onRemove: () => setFilters(prev => ({ ...prev, rol: undefined }))
      });
    }
    
    if (filters.verificado !== undefined) {
      items.push({
        id: 'verificado',
        label: `Verificado: ${filters.verificado ? 'Sí' : 'No'}`,
        value: filters.verificado,
        onRemove: () => setFilters(prev => ({ ...prev, verificado: undefined }))
      });
    }
    
    if (filters.activo !== undefined) {
      items.push({
        id: 'activo',
        label: `Estado: ${filters.activo ? 'Activo' : 'Inactivo'}`,
        value: filters.activo,
        onRemove: () => setFilters(prev => ({ ...prev, activo: undefined }))
      });
    }
    
    if (filters.fechaDesde) {
      items.push({
        id: 'fechaDesde',
        label: `Desde: ${filters.fechaDesde}`,
        value: filters.fechaDesde,
        onRemove: () => setFilters(prev => ({ ...prev, fechaDesde: undefined }))
      });
    }
    
    if (filters.fechaHasta) {
      items.push({
        id: 'fechaHasta',
        label: `Hasta: ${filters.fechaHasta}`,
        value: filters.fechaHasta,
        onRemove: () => setFilters(prev => ({ ...prev, fechaHasta: undefined }))
      });
    }
    
    return items;
  }, [filters]);

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
      {/* Header con estadísticas */}
      <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-3xl font-bold tracking-tight">Gestión de Usuarios</h2>
          <p className="text-muted-foreground">
            Administra los usuarios del sistema
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-4 border rounded-lg shadow-sm bg-white h-10">
            <UsersIcon className="h-4 w-4 text-utec-blue" />
            <span className="font-bold text-sm">{totalElements}</span>
            <span className="text-sm text-muted-foreground whitespace-nowrap">usuarios</span>
          </div>
          
          <PermissionGuard requiredPermission="usuarios:gestionar">
            <Button 
              variant="outline"
              onClick={handleExportCSV}
              className="h-10"
            >
              <Download className="h-4 w-4 mr-2" />
              Exportar CSV
            </Button>
          </PermissionGuard>
          
          <div 
            onClick={!isRefreshing ? handleRefresh : undefined}
            className={`flex items-center gap-2 px-4 border rounded-lg shadow-sm bg-white h-10 transition-all ${isRefreshing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-gray-50'}`}
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin-once' : ''}`} key={isRefreshing ? 'spinning' : 'static'} />
            <span className="text-sm font-medium whitespace-nowrap">Actualizar</span>
          </div>
        </div>
      </div>

      {/* Estadísticas de usuarios */}
      <UserStatsCards />

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
                    placeholder="Buscar por email o nombre..."
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
                  id: 'role-filter',
                  label: 'Rol',
                  type: 'select',
                  value: filters.rol || 'all',
                  options: [
                    { value: 'all', label: 'Todos los roles' },
                    ...USER_ROLES.map(role => ({ 
                      value: role, 
                      label: ROLE_LABELS[role] 
                    }))
                  ],
                  onChange: handleRoleFilter
                },
                {
                  id: 'verified-filter',
                  label: 'Verificación',
                  type: 'select',
                  value: filters.verificado === undefined 
                    ? 'all' 
                    : filters.verificado 
                    ? 'true' 
                    : 'false',
                  options: [
                    { value: 'all', label: 'Todos' },
                    { value: 'true', label: 'Verificados' },
                    { value: 'false', label: 'Sin verificar' }
                  ],
                  onChange: handleVerificadoFilter
                },
                {
                  id: 'active-filter',
                  label: 'Estado',
                  type: 'select',
                  value: filters.activo === undefined 
                    ? 'all' 
                    : filters.activo 
                    ? 'true' 
                    : 'false',
                  options: [
                    { value: 'all', label: 'Todos' },
                    { value: 'true', label: 'Activos' },
                    { value: 'false', label: 'Inactivos' }
                  ],
                  onChange: handleActivoFilter
                },
                {
                  id: 'fecha-desde',
                  label: 'Fecha desde',
                  type: 'date',
                  value: filters.fechaDesde,
                  onChange: (value) => handleFechaDesdeFilter(value)
                },
                {
                  id: 'fecha-hasta',
                  label: 'Fecha hasta',
                  type: 'date',
                  value: filters.fechaHasta,
                  onChange: (value) => handleFechaHastaFilter(value)
                }
              ];

              return <FiltersPanel showFilters={showFilters} fields={filterFields} />;
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

      {/* Tabla de usuarios */}
      <div className="border rounded-lg shadow-card overflow-hidden bg-white">
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
              <div className="hidden xl:block">
                <Table>
                    <TableHeader style={{ backgroundColor: '#525961' }}>
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="text-[#d1d5db] min-w-[200px]">Email</TableHead>
                        <TableHead className="text-[#d1d5db] min-w-[150px]">Nombre</TableHead>
                        <TableHead className="text-[#d1d5db]">Rol</TableHead>
                        <TableHead className="text-[#d1d5db] text-center">Estado</TableHead>
                        <TableHead className="text-[#d1d5db] text-right">Acciones</TableHead>
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
                            <PermissionGuard requiredPermission="usuarios:gestionar">
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
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openDetailsDialog(user)}
                                className="whitespace-nowrap rounded-2xl"
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                Ver
                              </Button>
                              <PermissionGuard requiredPermission="usuarios:gestionar">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => openEditDialog(user)}
                                  className="whitespace-nowrap rounded-2xl"
                                >
                                  <Edit className="h-4 w-4 mr-2" />
                                  Editar
                                </Button>
                              </PermissionGuard>
                              <PermissionGuard requiredPermission="usuarios:gestionar">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => openChangeRoleDialog(user)}
                                  className="whitespace-nowrap rounded-2xl"
                                >
                                  <Shield className="h-4 w-4 mr-2" />
                                  Rol
                                </Button>
                              </PermissionGuard>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
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
                          <PermissionGuard requiredPermission="usuarios:gestionar">
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
                          <PermissionGuard requiredPermission="usuarios:gestionar">
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
                          <PermissionGuard requiredPermission="usuarios:gestionar">
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
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-3 border-t bg-gray-50/50">
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
                      <PermissionGuard requiredPermission="usuarios:gestionar">
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
                <PermissionGuard requiredPermission="usuarios:gestionar">
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
