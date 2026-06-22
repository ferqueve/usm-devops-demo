import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { EmptyState } from '@/components/ui/empty-state';
import {
  BookOpen,
  Edit,
  GraduationCap,
  Loader2,
  Plus,
  Trash2,
  UserPlus,
  Users,
  XCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { useMaterias, useMisMaterias } from '@/hooks/useMaterias';
import { useRolePermissions } from '@/hooks/useRolePermissions';
import { materiasApi } from '@/lib/api/materias';
import type { Materia } from '@/lib/types/materias';
import PermissionGuard from '@/components/auth/PermissionGuard';
import { MateriaFormDialog } from './MateriaFormDialog';
import { DeleteMateriaDialog } from './DeleteMateriaDialog';
import { InscriptosDialog } from './InscriptosDialog';

const ROLE_ANALISTA = 'ANALISTA';
const ROLE_ADMIN = 'ADMIN';
const ROLE_DOCENTE = 'DOCENTE';
const ROLE_ESTUDIANTE = 'ESTUDIANTE';

export default function MateriasManagement() {
  const { user } = useAuth();
  const rol = user?.rol ?? '';

  if (rol === ROLE_ANALISTA || rol === ROLE_ADMIN) {
    return <AdminMateriasView />;
  }
  if (rol === ROLE_DOCENTE) {
    return <DocenteMateriasView />;
  }
  if (rol === ROLE_ESTUDIANTE) {
    return <EstudianteMateriasView />;
  }

  return (
    <div className="p-6">
      <EmptyState
        icon={BookOpen}
        title="Materias"
        description="No tienes acceso al módulo de materias."
      />
    </div>
  );
}

// ============================================================================
// Vista ANALISTA / ADMIN - CRUD global con tabla
// ============================================================================
function AdminMateriasView() {
  const { materias, loading, refresh } = useMaterias();
  const [createDialog, setCreateDialog] = useState(false);
  const [editDialog, setEditDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [inscriptosDialog, setInscriptosDialog] = useState(false);
  const [selected, setSelected] = useState<Materia | null>(null);

  const activas = materias.filter((m) => !m.deletedAt);

  const handleEdit = (materia: Materia) => {
    setSelected(materia);
    setEditDialog(true);
  };
  const handleDelete = (materia: Materia) => {
    setSelected(materia);
    setDeleteDialog(true);
  };
  const handleInscriptos = (materia: Materia) => {
    setSelected(materia);
    setInscriptosDialog(true);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BookOpen className="h-6 w-6" />
            Gestión de Materias
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Administra las materias del sistema: alta, edición y baja lógica.
          </p>
        </div>
        <PermissionGuard requiredPermission="materia:crear">
          <Button onClick={() => setCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Crear Materia
          </Button>
        </PermissionGuard>
      </div>

      <Card>
        <CardContent className="p-0">
          {(() => {
            if (loading) {
              return (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              );
            }
            if (activas.length === 0) {
              return (
                <div className="py-12">
                  <EmptyState
                    icon={BookOpen}
                    title="No hay materias registradas"
                    description="Crea la primera materia para comenzar."
                  />
                </div>
              );
            }
            return (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Código</TableHead>
                    <TableHead>Carrera</TableHead>
                    <TableHead>Docente</TableHead>
                    <TableHead className="text-center">Semestre</TableHead>
                    <TableHead className="text-center">Créditos</TableHead>
                    <TableHead className="text-center">Inscriptos</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activas.map((materia) => (
                    <TableRow key={materia.id}>
                      <TableCell className="font-medium">{materia.nombre}</TableCell>
                      <TableCell>
                        {materia.codigo ? (
                          <Badge variant="outline" className="text-xs">{materia.codigo}</Badge>
                        ) : (
                          <span className="text-muted-foreground text-xs">—</span>
                        )}
                      </TableCell>
                      <TableCell>{materia.carreraNombre ?? '—'}</TableCell>
                      <TableCell>{materia.docenteNombre ?? '—'}</TableCell>
                      <TableCell className="text-center">{materia.semestre ?? '—'}</TableCell>
                      <TableCell className="text-center">{materia.creditos ?? '—'}</TableCell>
                      <TableCell className="text-center">{materia.totalInscriptos ?? 0}</TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          <PermissionGuard requiredPermission="materia:ver_inscriptos">
                            <Button variant="ghost" size="sm" onClick={() => handleInscriptos(materia)}>
                              <Users className="h-4 w-4" />
                            </Button>
                          </PermissionGuard>
                          <PermissionGuard requiredPermission="materia:editar">
                            <Button variant="ghost" size="sm" onClick={() => handleEdit(materia)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                          </PermissionGuard>
                          <PermissionGuard requiredPermission="materia:eliminar">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(materia)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </PermissionGuard>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            );
          })()}
        </CardContent>
      </Card>

      <MateriaFormDialog
        materia={null}
        open={createDialog}
        onOpenChange={setCreateDialog}
        onSuccess={() => refresh()}
      />
      <MateriaFormDialog
        materia={selected}
        open={editDialog}
        onOpenChange={setEditDialog}
        onSuccess={() => refresh()}
      />
      <DeleteMateriaDialog
        materia={selected}
        open={deleteDialog}
        onOpenChange={setDeleteDialog}
        onSuccess={() => refresh()}
      />
      <InscriptosDialog
        materia={selected}
        open={inscriptosDialog}
        onOpenChange={setInscriptosDialog}
      />
    </div>
  );
}

// ============================================================================
// Vista DOCENTE - sus materias con botón ver inscriptos / editar
// ============================================================================
function DocenteMateriasView() {
  const { materias, loading, refresh } = useMisMaterias();
  const [editDialog, setEditDialog] = useState(false);
  const [inscriptosDialog, setInscriptosDialog] = useState(false);
  const [selected, setSelected] = useState<Materia | null>(null);

  const handleEdit = (materia: Materia) => {
    setSelected(materia);
    setEditDialog(true);
  };
  const handleInscriptos = (materia: Materia) => {
    setSelected(materia);
    setInscriptosDialog(true);
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <BookOpen className="h-6 w-6" />
          Mis Materias
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Materias que dictas. Puedes ver los inscriptos y editar sus datos.
        </p>
      </div>

      {(() => {
        if (loading) {
          return (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          );
        }
        if (materias.length === 0) {
          return (
            <div className="py-12">
              <EmptyState
                icon={BookOpen}
                title="No dictas materias"
                description="Aún no tienes materias asignadas."
              />
            </div>
          );
        }
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {materias.map((materia) => (
              <Card key={materia.id}>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-muted-foreground" />
                    {materia.nombre}
                  </CardTitle>
                  <CardDescription>
                    {materia.carreraNombre ?? 'Sin carrera'}
                    {materia.codigo ? ` · ${materia.codigo}` : ''}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="h-4 w-4" />
                    {materia.totalInscriptos ?? 0} inscriptos
                  </div>
                  <div className="flex items-center gap-2">
                    <PermissionGuard requiredPermission="materia:ver_inscriptos">
                      <Button variant="outline" size="sm" onClick={() => handleInscriptos(materia)}>
                        <Users className="h-4 w-4 mr-1" />
                        Inscriptos
                      </Button>
                    </PermissionGuard>
                    <PermissionGuard requiredPermission="materia:editar">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(materia)}>
                        <Edit className="h-4 w-4 mr-1" />
                        Editar
                      </Button>
                    </PermissionGuard>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        );
      })()}

      <MateriaFormDialog
        materia={selected}
        open={editDialog}
        onOpenChange={setEditDialog}
        onSuccess={() => refresh()}
      />
      <InscriptosDialog
        materia={selected}
        open={inscriptosDialog}
        onOpenChange={setInscriptosDialog}
      />
    </div>
  );
}

// ============================================================================
// Vista ESTUDIANTE - materias inscriptas + inscribirse a otras
// ============================================================================
function EstudianteMateriasView() {
  const { hasPermission } = useRolePermissions();
  const { materias: misMaterias, loading: loadingMias, refresh: refreshMias } = useMisMaterias();
  const { materias: todas, loading: loadingTodas, refresh: refreshTodas } = useMaterias();
  const [actionId, setActionId] = useState<number | null>(null);

  const inscriptasIds = new Set(misMaterias.map((m) => m.id));
  const disponibles = todas.filter((m) => !m.deletedAt && !inscriptasIds.has(m.id));

  const handleInscribirse = async (materia: Materia) => {
    try {
      setActionId(materia.id);
      await materiasApi.inscribirse(materia.id);
      toast.success('Inscripción realizada', { description: `Te inscribiste en ${materia.nombre}.` });
      await Promise.all([refreshMias(), refreshTodas()]);
    } catch (error: unknown) {
      const description = error instanceof Error ? error.message : 'No se pudo completar la inscripción';
      toast.error('Error al inscribirse', { description });
    } finally {
      setActionId(null);
    }
  };

  const handleCancelar = async (materia: Materia) => {
    try {
      setActionId(materia.id);
      const response = await materiasApi.misInscripciones();
      const inscripcion = (response.data ?? []).find((i) => i.materiaId === materia.id);
      if (!inscripcion) {
        toast.error('No se encontró la inscripción a cancelar');
        return;
      }
      await materiasApi.cancelarInscripcion(inscripcion.id);
      toast.success('Inscripción cancelada', { description: `Cancelaste ${materia.nombre}.` });
      await Promise.all([refreshMias(), refreshTodas()]);
    } catch (error: unknown) {
      const description = error instanceof Error ? error.message : 'No se pudo cancelar la inscripción';
      toast.error('Error al cancelar', { description });
    } finally {
      setActionId(null);
    }
  };

  return (
    <div className="p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <GraduationCap className="h-6 w-6" />
          Mis Materias
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Consulta tus materias inscriptas e inscríbete en nuevas.
        </p>
      </div>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Inscriptas</h2>
        {(() => {
          if (loadingMias) {
            return (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            );
          }
          if (misMaterias.length === 0) {
            return (
              <EmptyState
                icon={GraduationCap}
                title="No estás inscripto en materias"
                description="Inscríbete en alguna de las materias disponibles."
              />
            );
          }
          return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {misMaterias.map((materia) => (
                <Card key={materia.id}>
                  <CardHeader>
                    <CardTitle className="text-base">{materia.nombre}</CardTitle>
                    <CardDescription>
                      {materia.carreraNombre ?? 'Sin carrera'}
                      {materia.docenteNombre ? ` · ${materia.docenteNombre}` : ''}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <PermissionGuard requiredPermission="inscripcion:cancelar">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCancelar(materia)}
                        disabled={actionId === materia.id}
                        className="text-destructive hover:text-destructive"
                      >
                        {actionId === materia.id ? (
                          <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                        ) : (
                          <XCircle className="h-4 w-4 mr-1" />
                        )}
                        Cancelar inscripción
                      </Button>
                    </PermissionGuard>
                  </CardContent>
                </Card>
              ))}
            </div>
          );
        })()}
      </section>

      {hasPermission('inscripcion:crear') && (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold">Disponibles para inscribirse</h2>
          {(() => {
            if (loadingTodas) {
              return (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              );
            }
            if (disponibles.length === 0) {
              return (
                <EmptyState
                  icon={BookOpen}
                  title="No hay materias disponibles"
                  description="Estás inscripto en todas las materias disponibles."
                />
              );
            }
            return (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {disponibles.map((materia) => (
                  <Card key={materia.id}>
                    <CardHeader>
                      <CardTitle className="text-base">{materia.nombre}</CardTitle>
                      <CardDescription>
                        {materia.carreraNombre ?? 'Sin carrera'}
                        {materia.docenteNombre ? ` · ${materia.docenteNombre}` : ''}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button
                        size="sm"
                        onClick={() => handleInscribirse(materia)}
                        disabled={actionId === materia.id}
                      >
                        {actionId === materia.id ? (
                          <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                        ) : (
                          <UserPlus className="h-4 w-4 mr-1" />
                        )}
                        Inscribirse
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            );
          })()}
        </section>
      )}
    </div>
  );
}
