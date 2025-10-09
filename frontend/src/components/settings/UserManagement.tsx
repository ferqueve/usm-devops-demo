import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Switch } from "@/components/ui/switch";
import { usuariosApi } from '@/core/api/api';
import { USER_ROLES, ROLE_LABELS, ROLE_BADGE_VARIANTS } from '@/core/config/users';
import type { User, UserRole, UserFilters } from '@/core/types/types';
import { Search, ChevronLeft, ChevronRight, UserCog, Shield } from 'lucide-react';
import { toast } from 'sonner';

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
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newRole, setNewRole] = useState<UserRole>('ESTUDIANTE');

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
      await usuariosApi.cambiarRol(selectedUser.id, newRole);
      toast.success('Rol actualizado', {
        description: `El rol de ${selectedUser.nombre} se actualizó a ${ROLE_LABELS[newRole]}`
      });
      setChangeRoleDialog(false);
      fetchUsers();
    } catch (error: any) {
      console.error('Error al cambiar rol:', error);
      toast.error('Error al cambiar rol', {
        description: error.message || 'No se pudo actualizar el rol del usuario'
      });
    }
  };

  const handleToggleActivo = async (user: User) => {
    try {
      await usuariosApi.toggleActivo(user.id);
      const action = user.activo ? 'desactivado' : 'activado';
      toast.success(`Usuario ${action}`, {
        description: `${user.nombre} ha sido ${action} exitosamente`
      });
      fetchUsers();
    } catch (error: any) {
      console.error('Error al cambiar estado:', error);
      toast.error('Error al cambiar estado', {
        description: error.message || 'No se pudo cambiar el estado del usuario'
      });
    }
  };

  const clearFilters = () => {
    setSearchInput('');
    setFilters({});
    setPage(0);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold flex items-center gap-2">
          <UserCog className="h-8 w-8" />
          Gestión de Usuarios
        </h2>
        <p className="text-muted-foreground mt-2">
          Administra usuarios, roles y permisos del sistema
        </p>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filtros</CardTitle>
          <CardDescription>Busca y filtra usuarios</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            {/* Búsqueda */}
            <form onSubmit={handleSearch} className="col-span-2">
              <Label htmlFor="search">Buscar</Label>
              <div className="flex gap-2 mt-1">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    id="search"
                    placeholder="Email o nombre..."
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Button type="submit" size="default">Buscar</Button>
              </div>
            </form>

            {/* Filtro por rol */}
            <div>
              <Label htmlFor="role-filter">Rol</Label>
              <Select 
                value={filters.rol || 'all'} 
                onValueChange={handleRoleFilter}
              >
                <SelectTrigger id="role-filter" className="mt-1">
                  <SelectValue placeholder="Todos los roles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los roles</SelectItem>
                  {USER_ROLES.map(role => (
                    <SelectItem key={role} value={role}>
                      {ROLE_LABELS[role]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Filtro por verificado */}
            <div>
              <Label htmlFor="verified-filter">Estado verificación</Label>
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
                <SelectTrigger id="verified-filter" className="mt-1">
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
            <div>
              <Label htmlFor="active-filter">Estado usuario</Label>
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
                <SelectTrigger id="active-filter" className="mt-1">
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

          {/* Botón limpiar filtros */}
          {(filters.search || filters.rol || filters.verificado !== undefined || filters.activo !== undefined) && (
            <div className="mt-4">
              <Button variant="outline" onClick={clearFilters}>
                Limpiar filtros
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tabla de usuarios */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Usuarios</CardTitle>
              <CardDescription>
                {totalElements} usuario{totalElements !== 1 ? 's' : ''} en total
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
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
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Rol</TableHead>
                      <TableHead className="text-center">Verificado</TableHead>
                      <TableHead className="text-center">Estado</TableHead>
                      <TableHead>Proveedor</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.email}</TableCell>
                        <TableCell>{user.nombre}</TableCell>
                        <TableCell>
                          <Badge variant={ROLE_BADGE_VARIANTS[user.rolApp]}>
                            {ROLE_LABELS[user.rolApp]}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          {user.verificado ? (
                            <Badge variant="default" className="bg-green-600">
                              Sí
                            </Badge>
                          ) : (
                            <Badge variant="secondary">No</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-2">
                            <Switch
                              checked={user.activo}
                              onCheckedChange={() => handleToggleActivo(user)}
                            />
                            <span className="text-sm">
                              {user.activo ? 'Activo' : 'Inactivo'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {user.oauthProv ? (
                            <Badge variant="outline">{user.oauthProv}</Badge>
                          ) : (
                            <span className="text-muted-foreground text-sm">Local</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openChangeRoleDialog(user)}
                          >
                            <Shield className="h-4 w-4 mr-1" />
                            Cambiar rol
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Paginación */}
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-muted-foreground">
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
                    Anterior
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                    disabled={page >= totalPages - 1 || loading}
                  >
                    Siguiente
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
        <DialogContent>
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
            <div className="text-sm text-muted-foreground space-y-1">
              <p><strong>Email:</strong> {selectedUser?.email}</p>
              <p><strong>Rol actual:</strong> {selectedUser && ROLE_LABELS[selectedUser.rolApp]}</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setChangeRoleDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleChangeRole} disabled={newRole === selectedUser?.rolApp}>
              Guardar cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}


