import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/badge';
import {
  CalendarClock,
  Edit,
  GraduationCap,
  Loader2,
  MapPin,
  Plus,
  Users,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import PermissionGuard from '@/components/auth/PermissionGuard';
import { useAuth } from '@/hooks/useAuth';
import { useTutorias } from '@/hooks/useTutorias';
import { tutoriasApi } from '@/lib/api/tutorias';
import type { Tutoria, TutoriaEstado } from '@/lib/types/tutorias';
import { TutoriaFormDialog } from './TutoriaFormDialog';

const DOCENTE_ROLES = ['DOCENTE', 'ADMIN', 'ANALISTA'];

function formatRango(inicio?: string, fin?: string): string {
  if (!inicio) return '';
  const inicioDate = new Date(inicio);
  if (Number.isNaN(inicioDate.getTime())) return '';
  const fecha = inicioDate.toLocaleString('es-UY', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
  if (!fin) return fecha;
  const finDate = new Date(fin);
  if (Number.isNaN(finDate.getTime())) return fecha;
  const horaFin = finDate.toLocaleString('es-UY', { hour: '2-digit', minute: '2-digit' });
  return `${fecha} - ${horaFin}`;
}

function estadoVariant(estado: TutoriaEstado): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (estado) {
    case 'ABIERTA':
      return 'default';
    case 'CANCELADA':
      return 'destructive';
    case 'CERRADA':
      return 'secondary';
    default:
      return 'outline';
  }
}

export default function TutoriasManagement() {
  const { user } = useAuth();
  const rol = user?.rol ?? '';
  const isDocente = DOCENTE_ROLES.includes(rol);

  if (isDocente) {
    return <DocenteView />;
  }
  return <EstudianteView />;
}

// ----- Vista DOCENTE: gestiona sus franjas de tutoría -----
function DocenteView() {
  const { tutorias, loading, refresh } = useTutorias({ scope: 'mias' });
  const [createDialog, setCreateDialog] = useState(false);
  const [editDialog, setEditDialog] = useState(false);
  const [selected, setSelected] = useState<Tutoria | null>(null);

  const handleEdit = (tutoria: Tutoria) => {
    setSelected(tutoria);
    setEditDialog(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Tutorías</h1>
          <p className="text-sm text-muted-foreground">
            Gestiona tus franjas de tutoría y revisa el cupo agendado.
          </p>
        </div>
        <PermissionGuard requiredPermission="tutoria:crear">
          <Button onClick={() => setCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Crear Tutoría
          </Button>
        </PermissionGuard>
      </div>

      {tutorias.length === 0 ? (
        <div className="text-center py-16">
          <GraduationCap className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No tenés franjas de tutoría registradas</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tutorias.map((tutoria) => (
            <Card key={tutoria.id} className="flex flex-col">
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base">{tutoria.materiaNombre}</CardTitle>
                  <Badge variant={estadoVariant(tutoria.estado)} className="text-xs shrink-0">
                    {tutoria.estado}
                  </Badge>
                </div>
                <CardDescription className="flex items-center gap-1 text-xs">
                  <CalendarClock className="h-3.5 w-3.5" />
                  {formatRango(tutoria.inicio, tutoria.fin)}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1 space-y-2 text-sm">
                {tutoria.espacioNombre && (
                  <p className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    {tutoria.espacioNombre}
                  </p>
                )}
                <p className="flex items-center gap-2 text-muted-foreground">
                  <Users className="h-4 w-4" />
                  {tutoria.cupo - tutoria.plazasDisponibles}/{tutoria.cupo} agendado(s)
                  {` · ${tutoria.plazasDisponibles} plaza(s) disponible(s)`}
                </p>
              </CardContent>
              <CardFooter className="flex justify-end gap-1">
                <PermissionGuard requiredPermission="tutoria:editar">
                  <Button variant="ghost" size="sm" onClick={() => handleEdit(tutoria)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                </PermissionGuard>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      <TutoriaFormDialog tutoria={null} open={createDialog} onOpenChange={setCreateDialog} onSuccess={refresh} />
      <TutoriaFormDialog tutoria={selected} open={editDialog} onOpenChange={setEditDialog} onSuccess={refresh} />
    </div>
  );
}

// ----- Vista ESTUDIANTE: lista franjas abiertas y sus tutorías agendadas -----
function EstudianteView() {
  const { tutorias: disponibles, loading: loadingDisponibles, refresh: refreshDisponibles } =
    useTutorias({ scope: 'todas' });
  const { tutorias: agendadas, loading: loadingAgendadas, refresh: refreshAgendadas } =
    useTutorias({ scope: 'mias' });

  const [accion, setAccion] = useState<number | null>(null);

  const refreshAll = async () => {
    await Promise.all([refreshDisponibles(), refreshAgendadas()]);
  };

  const handleAgendar = async (tutoria: Tutoria) => {
    try {
      setAccion(tutoria.id);
      await tutoriasApi.agendar(tutoria.id);
      toast.success('Tutoría agendada', { description: tutoria.materiaNombre });
      await refreshAll();
    } catch (error: unknown) {
      const description = error instanceof Error ? error.message : 'No se pudo agendar la tutoría';
      toast.error('Error al agendar', { description });
    } finally {
      setAccion(null);
    }
  };

  const handleCancelar = async (tutoria: Tutoria) => {
    if (tutoria.reservaId == null) return;
    try {
      setAccion(tutoria.id);
      await tutoriasApi.cancelarReserva(tutoria.reservaId);
      toast.success('Reserva cancelada', { description: tutoria.materiaNombre });
      await refreshAll();
    } catch (error: unknown) {
      const description = error instanceof Error ? error.message : 'No se pudo cancelar la reserva';
      toast.error('Error al cancelar', { description });
    } finally {
      setAccion(null);
    }
  };

  if (loadingDisponibles || loadingAgendadas) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const agendadasIds = new Set(agendadas.map((t) => t.id));
  const abiertas = disponibles.filter((t) => t.estado === 'ABIERTA');

  return (
    <div className="space-y-8 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-semibold">Tutorías</h1>
        <p className="text-sm text-muted-foreground">
          Explorá las tutorías disponibles y agendá un cupo.
        </p>
      </div>

      <section className="space-y-4">
        <h2 className="text-lg font-medium">Disponibles</h2>
        {abiertas.length === 0 ? (
          <div className="text-center py-12">
            <GraduationCap className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No hay tutorías disponibles</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {abiertas.map((tutoria) => {
              const yaAgendada = agendadasIds.has(tutoria.id);
              const sinPlazas = tutoria.plazasDisponibles <= 0;
              const deshabilitado = yaAgendada || sinPlazas || accion === tutoria.id;
              return (
                <Card key={tutoria.id} className="flex flex-col">
                  <CardHeader>
                    <CardTitle className="text-base">{tutoria.materiaNombre}</CardTitle>
                    <CardDescription className="flex items-center gap-1 text-xs">
                      <CalendarClock className="h-3.5 w-3.5" />
                      {formatRango(tutoria.inicio, tutoria.fin)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1 space-y-2 text-sm">
                    <p className="text-muted-foreground">Docente: {tutoria.docenteNombre}</p>
                    {tutoria.espacioNombre && (
                      <p className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        {tutoria.espacioNombre}
                      </p>
                    )}
                    <p className="flex items-center gap-2 text-muted-foreground">
                      <Users className="h-4 w-4" />
                      {tutoria.plazasDisponibles} plaza(s) disponible(s)
                    </p>
                  </CardContent>
                  <CardFooter>
                    <PermissionGuard requiredPermission="tutoria:agendar">
                      <Button
                        className="w-full"
                        disabled={deshabilitado}
                        onClick={() => handleAgendar(tutoria)}
                      >
                        {accion === tutoria.id && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                        {(() => {
                          if (yaAgendada) return 'Ya agendada';
                          if (sinPlazas) return 'Sin plazas';
                          return 'Agendar';
                        })()}
                      </Button>
                    </PermissionGuard>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-medium">Mis tutorías agendadas</h2>
        {agendadas.length === 0 ? (
          <p className="text-sm text-muted-foreground">Todavía no agendaste ninguna tutoría.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {agendadas.map((tutoria) => (
              <Card key={tutoria.id} className="flex flex-col">
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base">{tutoria.materiaNombre}</CardTitle>
                    <Badge variant={estadoVariant(tutoria.estado)} className="text-xs shrink-0">
                      {tutoria.estado}
                    </Badge>
                  </div>
                  <CardDescription className="flex items-center gap-1 text-xs">
                    <CalendarClock className="h-3.5 w-3.5" />
                    {formatRango(tutoria.inicio, tutoria.fin)}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1 space-y-2 text-sm">
                  <p className="text-muted-foreground">Docente: {tutoria.docenteNombre}</p>
                  {tutoria.espacioNombre && (
                    <p className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      {tutoria.espacioNombre}
                    </p>
                  )}
                </CardContent>
                <CardFooter>
                  <PermissionGuard requiredPermission="tutoria:cancelar_reserva">
                    <Button
                      variant="outline"
                      className="w-full text-destructive hover:text-destructive"
                      disabled={accion === tutoria.id}
                      onClick={() => handleCancelar(tutoria)}
                    >
                      {accion === tutoria.id
                        ? <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                        : <X className="h-4 w-4 mr-1" />}
                      Cancelar
                    </Button>
                  </PermissionGuard>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
