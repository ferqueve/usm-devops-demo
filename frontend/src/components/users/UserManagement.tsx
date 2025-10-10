import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { usuariosApi } from '@/core/api/api';
import { USER_ROLES, ROLE_LABELS, ROLE_BADGE_VARIANTS } from '@/core/config/users';
import type { User, UserRole, UserFilters } from '@/core/types/types';
import { Search, ChevronLeft, ChevronRight, Shield, Mail, User as UserIcon, Monitor, Loader2, RefreshCw, Eye, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
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
  
  // Local o sin proveedor
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
  
  // Filtros
  const [filters, setFilters] = useState<UserFilters>({});
  const [searchInput, setSearchInput] = useState('');
  
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
  
  // Ordenamiento
  const [sortField, setSortField] = useState<'nombre' | 'email' | 'rolApp' | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    fetchUsers();
  }, [page, filters]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await usuariosApi.listarUsuarios(page, pageSize, filters);
      
      // El backend de usuarios devuelve directamente el PagedUsuarioResponseDto
      // (no envuelto en ApiResponse como otros endpoints)
      const pagedData: any = response.data || response;
      
      if (pagedData?.content) {
        setUsers(pagedData.content);
        setTotalPages(pagedData.totalPages);
        setTotalElements(pagedData.totalElements);
      }
    } catch (error: any) {
      console.error('Error al cargar usuarios:', error);
      toast.error('Error al cargar usuarios', {
        description: error.message || 'No se pudo cargar la lista de usuarios'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(0);
    setFilters(prev => ({ ...prev, search: searchInput || undefined }));
  };

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
      
      // Actualización optimista del estado local
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
    } catch (error: any) {
      console.error('Error al cambiar rol:', error);
      toast.error('Error al cambiar rol', {
        description: error.message || 'No se pudo actualizar el rol del usuario'
      });
      // Recargar en caso de error para mantener consistencia
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
      
      // Actualización optimista del estado local
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
    } catch (error: any) {
      console.error('Error al cambiar estado:', error);
      toast.error('Error al cambiar estado', {
        description: error.message || 'No se pudo cambiar el estado del usuario'
      });
      // Recargar en caso de error para mantener consistencia
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
    toast.info('Filtros limpiados', {
      description: 'Se han eliminado todos los filtros'
    });
  };

  const handleRefresh = async () => {
    toast.info('Actualizando...', {
      description: 'Recargando lista de usuarios'
    });
    await fetchUsers();
    toast.success('Lista actualizada', {
      description: 'Los datos se han actualizado correctamente'
    });
  };

  const openDetailsDialog = (user: User) => {
    setUserDetails(user);
    setDetailsDialog(true);
  };

  const handleSort = (field: 'nombre' | 'email' | 'rolApp') => {
    if (sortField === field) {
      // Si ya está ordenado por este campo, cambiar dirección
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Nuevo campo, ordenar ascendente
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Aplicar ordenamiento a los usuarios
  const sortedUsers = React.useMemo(() => {
    if (!sortField) return users;

    return [...users].sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];

      // Convertir a string para comparación
      const aStr = String(aValue).toLowerCase();
      const bStr = String(bValue).toLowerCase();

      if (sortDirection === 'asc') {
        return aStr.localeCompare(bStr);
      } else {
        return bStr.localeCompare(aStr);
      }
    });
  }, [users, sortField, sortDirection]);

  // Contar filtros activos
  const activeFiltersCount = Object.keys(filters).filter(key => filters[key as keyof UserFilters] !== undefined).length;

  const SortIcon = ({ field }: { field: 'nombre' | 'email' | 'rolApp' }) => {
    if (sortField !== field) return <ArrowUpDown className="h-4 w-4 ml-1 inline opacity-40" />;
    return sortDirection === 'asc' 
      ? <ArrowUp className="h-4 w-4 ml-1 inline" />
      : <ArrowDown className="h-4 w-4 ml-1 inline" />;
  };

  return (
    <div className="space-y-0">
      {/* Título de filtros */}
      <div className="flex items-center justify-between px-6 pt-4 pb-2">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-semibold tracking-tight">Filtros</h2>
          <span className="text-muted-foreground">|</span>
          <p className="text-sm text-muted-foreground">Busca y filtra usuarios</p>
          {activeFiltersCount > 0 && (
            <Badge variant="secondary" className="ml-2">
              {activeFiltersCount} activo{activeFiltersCount !== 1 ? 's' : ''}
            </Badge>
          )}
        </div>
      </div>

      {/* Filtros */}
      <Card className="shadow-none rounded-none">
        <CardContent>
          <form onSubmit={handleSearch}>
            <div className="space-y-3">
              {/* Fila de filtros */}
              <div className="flex flex-wrap items-end gap-2">
                {/* Búsqueda */}
                <div className="flex-[2] min-w-[250px]">
                  <Label htmlFor="search">Buscar</Label>
                  <div className="relative mt-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      id="search"
                      placeholder="Email o nombre"
                      value={searchInput}
                      onChange={(e) => setSearchInput(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>

                {/* Filtro por rol */}
                <div className="flex-1 min-w-[150px]">
                  <Label htmlFor="role-filter">Rol</Label>
                  <Select 
                    value={filters.rol || 'all'} 
                    onValueChange={handleRoleFilter}
                  >
                    <SelectTrigger id="role-filter" className="mt-1 w-full">
                      <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      {USER_ROLES.map(role => (
                        <SelectItem key={role} value={role}>
                          {ROLE_LABELS[role]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Filtro por verificado */}
                <div className="flex-1 min-w-[150px]">
                  <Label htmlFor="verified-filter">Verificación</Label>
                  <Select 
                    value={
                      filters.verificado === undefined 
                        ? 'all' 
                        : filters.verificado 
                        ? 'true' 
                        : 'false'
                    } 
                    onValueChange={handleVerificadoFilter}
                  >
                    <SelectTrigger id="verified-filter" className="mt-1 w-full">
                      <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="true">Verificados</SelectItem>
                      <SelectItem value="false">Sin verificar</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Filtro por activo */}
                <div className="flex-1 min-w-[150px]">
                  <Label htmlFor="active-filter">Estado</Label>
                  <Select 
                    value={
                      filters.activo === undefined 
                        ? 'all' 
                        : filters.activo 
                        ? 'true' 
                        : 'false'
                    } 
                    onValueChange={handleActivoFilter}
                  >
                    <SelectTrigger id="active-filter" className="mt-1 w-full">
                      <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="true">Activos</SelectItem>
                      <SelectItem value="false">Inactivos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Fila de botones */}
              <div className="flex gap-2">
                <Button type="submit" size="default" className="w-[160px]">Buscar</Button>
                <Button type="button" variant="outline" onClick={clearFilters} className="w-[160px]">
                  Limpiar
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Título de usuarios */}
      <div className="flex items-center justify-between px-6 pt-8 pb-2">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-semibold tracking-tight">Usuarios</h2>
          <span className="text-muted-foreground">|</span>
          <p className="text-sm text-muted-foreground">
            {totalElements} usuario{totalElements !== 1 ? 's' : ''} en total
          </p>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleRefresh}
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Actualizar
        </Button>
      </div>

      {/* Tabla de usuarios */}
      <Card className="shadow-none border-0 rounded-none pt-0">
        <CardContent className="p-0">
          {loading ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Cargando usuarios...</p>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No se encontraron usuarios</p>
            </div>
          ) : (
            <>
              {/* Vista de tabla para desktop XL (1280px+) */}
              <div className="hidden xl:block rounded-none border">
                <div className="w-full overflow-x-auto">
                  <Table>
                    <TableHeader style={{ backgroundColor: '#525961' }}>
                      <TableRow className="hover:bg-transparent">
                        <TableHead 
                          className="min-w-[180px] max-w-[250px] text-[#d1d5db] cursor-pointer hover:text-white"
                          onClick={() => handleSort('email')}
                        >
                          Email <SortIcon field="email" />
                        </TableHead>
                        <TableHead 
                          className="min-w-[120px] text-[#d1d5db] cursor-pointer hover:text-white"
                          onClick={() => handleSort('nombre')}
                        >
                          Nombre <SortIcon field="nombre" />
                        </TableHead>
                        <TableHead 
                          className="min-w-[100px] text-[#d1d5db] cursor-pointer hover:text-white"
                          onClick={() => handleSort('rolApp')}
                        >
                          Rol <SortIcon field="rolApp" />
                        </TableHead>
                        <TableHead className="text-center min-w-[90px] text-[#d1d5db]">Verificado</TableHead>
                        <TableHead className="text-center min-w-[120px] text-[#d1d5db]">Estado</TableHead>
                        <TableHead className="min-w-[90px] text-[#d1d5db]">Proveedor</TableHead>
                        <TableHead className="text-right min-w-[140px] text-[#d1d5db]">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sortedUsers.map((user) => (
                        <TableRow key={user.id} className="hover:bg-muted/60">
                          <TableCell className="font-medium max-w-[250px]">
                            <div className="truncate" title={user.email}>
                              {user.email}
                            </div>
                          </TableCell>
                          <TableCell className="max-w-[150px]">
                            <div className="truncate" title={user.nombre}>
                              {user.nombre}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={ROLE_BADGE_VARIANTS[user.rolApp]} className="whitespace-nowrap">
                              {ROLE_LABELS[user.rolApp]}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            {user.verificado ? (
                              <Badge variant="default" className="bg-green-600 whitespace-nowrap">
                                Sí
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="whitespace-nowrap">No</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-2">
                              <Switch
                                checked={user.activo}
                                onCheckedChange={() => openConfirmStatusDialog(user)}
                              />
                              <span className="text-sm whitespace-nowrap">
                                {user.activo ? 'Activo' : 'Inactivo'}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <ProviderIcon provider={user.oauthProv} />
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openDetailsDialog(user)}
                                className="whitespace-nowrap"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openChangeRoleDialog(user)}
                                className="whitespace-nowrap"
                              >
                                <Shield className="h-4 w-4" />
                                Editar rol
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Vista de cards para móvil, tablet y laptop (hasta 1280px) */}
              <div className="xl:hidden space-y-4">
                {sortedUsers.map((user) => (
                  <Card key={user.id} className="shadow-none">
                    <CardContent className="p-4 space-y-3">
                      {/* Header del card con email y estado activo */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2 flex-1 min-w-0">
                          <Mail className="h-4 w-4 text-muted-foreground mt-1 flex-shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-sm break-all">{user.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Switch
                            checked={user.activo}
                            onCheckedChange={() => openConfirmStatusDialog(user)}
                          />
                        </div>
                      </div>

                      {/* Nombre */}
                      <div className="flex items-center gap-2 min-w-0">
                        <UserIcon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <span className="text-sm break-words">{user.nombre}</span>
                      </div>

                      {/* Badges: Rol, Verificado, Proveedor, Estado */}
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant={ROLE_BADGE_VARIANTS[user.rolApp]}>
                          {ROLE_LABELS[user.rolApp]}
                        </Badge>
                        {user.verificado ? (
                          <Badge variant="default" className="bg-green-600">
                            Verificado
                          </Badge>
                        ) : (
                          <Badge variant="secondary">Sin verificar</Badge>
                        )}
                        <div className="flex items-center gap-1">
                          <ProviderIcon provider={user.oauthProv} />
                        </div>
                        <Badge variant={user.activo ? "default" : "secondary"}>
                          {user.activo ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </div>

                      {/* Botones de acción */}
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openDetailsDialog(user)}
                          className="flex-1"
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Ver detalles
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openChangeRoleDialog(user)}
                          className="flex-1"
                        >
                          <Shield className="h-4 w-4 mr-2" />
                          Editar rol
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Paginación */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-4">
                <p className="text-sm text-muted-foreground text-center sm:text-left">
                  Página {page + 1} de {totalPages} ({totalElements} usuarios)
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.max(0, p - 1))}
                    disabled={page === 0 || loading}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    <span className="hidden sm:inline ml-1">Anterior</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                    disabled={page >= totalPages - 1 || loading}
                  >
                    <span className="hidden sm:inline mr-1">Siguiente</span>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Dialog para cambiar rol */}
      <Dialog open={changeRoleDialog} onOpenChange={setChangeRoleDialog}>
        <DialogContent className="sm:max-w-[425px] max-w-[95vw]">
          <DialogHeader>
            <DialogTitle>Editar rol de usuario</DialogTitle>
            <DialogDescription className="break-words">
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
            <div className="text-sm text-muted-foreground space-y-1">
              <p className="break-all"><strong>Email:</strong> {selectedUser?.email}</p>
              <p><strong>Rol actual:</strong> {selectedUser && ROLE_LABELS[selectedUser.rolApp]}</p>
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button 
              variant="outline" 
              onClick={() => setChangeRoleDialog(false)} 
              className="w-full sm:w-auto"
              disabled={changingRole}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleChangeRole} 
              disabled={newRole === selectedUser?.rolApp || changingRole} 
              className="w-full sm:w-auto"
            >
              {changingRole && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Guardar cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmación para cambiar estado */}
      <AlertDialog open={confirmStatusDialog} onOpenChange={setConfirmStatusDialog}>
        <AlertDialogContent className="sm:max-w-[425px] max-w-[95vw]">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {userToToggle?.activo ? 'Desactivar usuario' : 'Activar usuario'}
            </AlertDialogTitle>
            <AlertDialogDescription className="break-words">
              {userToToggle?.activo ? (
                <>
                  ¿Estás seguro de que deseas <strong>desactivar</strong> a{' '}
                  <strong>{userToToggle?.nombre}</strong>? El usuario no podrá acceder al sistema hasta que sea reactivado.
                </>
              ) : (
                <>
                  ¿Estás seguro de que deseas <strong>activar</strong> a{' '}
                  <strong>{userToToggle?.nombre}</strong>? El usuario podrá acceder al sistema nuevamente.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="text-sm text-muted-foreground space-y-1 py-2">
            <p className="break-all"><strong>Email:</strong> {userToToggle?.email}</p>
            <p><strong>Rol:</strong> {userToToggle && ROLE_LABELS[userToToggle.rolApp]}</p>
            <p><strong>Estado actual:</strong> {userToToggle?.activo ? 'Activo' : 'Inactivo'}</p>
          </div>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel disabled={togglingStatus} className="w-full sm:w-auto">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleToggleActivo}
              disabled={togglingStatus}
              className="w-full sm:w-auto"
            >
              {togglingStatus && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog de detalles del usuario */}
      <Dialog open={detailsDialog} onOpenChange={setDetailsDialog}>
        <DialogContent className="sm:max-w-[500px] max-w-[95vw]">
          <DialogHeader>
            <DialogTitle>Detalles del Usuario</DialogTitle>
            <DialogDescription>
              Información completa del usuario
            </DialogDescription>
          </DialogHeader>
          {userDetails && (
            <div className="space-y-4 py-4">
              {/* Información básica */}
              <div className="space-y-3">
                <div>
                  <Label className="text-xs text-muted-foreground">ID</Label>
                  <p className="font-medium">{userDetails.id}</p>
                </div>
                
                <div>
                  <Label className="text-xs text-muted-foreground">Nombre</Label>
                  <p className="font-medium break-words">{userDetails.nombre}</p>
                </div>
                
                <div>
                  <Label className="text-xs text-muted-foreground">Email</Label>
                  <p className="font-medium break-all">{userDetails.email}</p>
                </div>
                
                <div>
                  <Label className="text-xs text-muted-foreground">Rol</Label>
                  <div className="mt-1">
                    <Badge variant={ROLE_BADGE_VARIANTS[userDetails.rolApp]}>
                      {ROLE_LABELS[userDetails.rolApp]}
                    </Badge>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-muted-foreground">Verificado</Label>
                    <div className="mt-1">
                      {userDetails.verificado ? (
                        <Badge variant="default" className="bg-green-600">
                          Sí
                        </Badge>
                      ) : (
                        <Badge variant="secondary">No</Badge>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <Label className="text-xs text-muted-foreground">Estado</Label>
                    <div className="mt-1">
                      <Badge variant={userDetails.activo ? "default" : "secondary"}>
                        {userDetails.activo ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </div>
                  </div>
                </div>
                
                <div>
                  <Label className="text-xs text-muted-foreground">Proveedor de autenticación</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <ProviderIcon provider={userDetails.oauthProv} />
                    <span className="text-sm">
                      {userDetails.oauthProv?.toLowerCase() === 'google' ? 'Google' : 'Local'}
                    </span>
                  </div>
                </div>
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
    </div>
  );
}


