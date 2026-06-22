import { useMemo, useState } from 'react';
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
  CalendarDays,
  Edit,
  Loader2,
  MapPin,
  Plus,
  Trash2,
  Users,
} from 'lucide-react';
import { toast } from 'sonner';
import PermissionGuard from '@/components/auth/PermissionGuard';
import { useAuth } from '@/hooks/useAuth';
import { useEventos } from '@/hooks/useEventos';
import { eventosApi } from '@/lib/api/eventos';
import type { Evento } from '@/lib/types/eventos';
import { EventoFormDialog } from './EventoFormDialog';
import { DeleteEventoDialog } from './DeleteEventoDialog';
import { InscriptosEventoDialog } from './InscriptosEventoDialog';

const ADMIN_ROLES = ['ADMIN', 'ANALISTA'];

function formatFecha(iso?: string): string {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString('es-UY', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function estadoVariant(estado: Evento['estado']): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (estado) {
    case 'PUBLICADO':
      return 'default';
    case 'CANCELADO':
      return 'destructive';
    case 'FINALIZADO':
      return 'secondary';
    default:
      return 'outline';
  }
}

export default function EventosManagement() {
  const { user } = useAuth();
  const rol = user?.rol ?? '';
  const isAdmin = ADMIN_ROLES.includes(rol);
  const isExterno = rol === 'EXTERNO';

  const { eventos, misInscripciones, loading, refresh } = useEventos();

  const [createDialog, setCreateDialog] = useState(false);
  const [editDialog, setEditDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [inscriptosDialog, setInscriptosDialog] = useState(false);
  const [selected, setSelected] = useState<Evento | null>(null);
  const [inscribiendo, setInscribiendo] = useState<number | null>(null);

  const titulo = isExterno ? 'Oferta abierta' : 'Eventos';

  const idsInscripto = useMemo(
    () => new Set(misInscripciones.map((e) => e.id)),
    [misInscripciones],
  );

  const handleEdit = (evento: Evento) => {
    setSelected(evento);
    setEditDialog(true);
  };
  const handleDelete = (evento: Evento) => {
    setSelected(evento);
    setDeleteDialog(true);
  };
  const handleVerInscriptos = (evento: Evento) => {
    setSelected(evento);
    setInscriptosDialog(true);
  };

  const handleInscribirse = async (evento: Evento) => {
    try {
      setInscribiendo(evento.id);
      await eventosApi.inscribirse(evento.id);
      toast.success('Inscripción realizada', { description: evento.titulo });
      await refresh();
    } catch (error: unknown) {
      const description = error instanceof Error ? error.message : 'No se pudo completar la inscripción';
      toast.error('Error al inscribirse', { description });
    } finally {
      setInscribiendo(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // ----- Vista ADMIN / ANALISTA: gestión (CRUD) -----
  if (isAdmin) {
    return (
      <div className="space-y-6 p-4 md:p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">{titulo}</h1>
            <p className="text-sm text-muted-foreground">
              Gestiona los eventos y cursos de oferta abierta.
            </p>
          </div>
          <PermissionGuard requiredPermission="evento:crear">
            <Button onClick={() => setCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Crear Evento
            </Button>
          </PermissionGuard>
        </div>

        {eventos.length === 0 ? (
          <div className="text-center py-16">
            <CalendarDays className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No hay eventos registrados</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {eventos.map((evento) => (
              <Card key={evento.id} className="flex flex-col">
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base">{evento.titulo}</CardTitle>
                    <Badge variant={estadoVariant(evento.estado)} className="text-xs shrink-0">
                      {evento.estado}
                    </Badge>
                  </div>
                  <CardDescription className="flex items-center gap-1 text-xs">
                    <Badge variant="outline" className="text-[10px]">{evento.tipo}</Badge>
                    {!evento.esPublico && <span>· Interno</span>}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1 space-y-2 text-sm">
                  {evento.descripcion && (
                    <p className="text-muted-foreground line-clamp-3">{evento.descripcion}</p>
                  )}
                  <p className="flex items-center gap-2 text-muted-foreground">
                    <CalendarDays className="h-4 w-4" />
                    {formatFecha(evento.inicio)}
                  </p>
                  {evento.espacioNombre && (
                    <p className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      {evento.espacioNombre}
                    </p>
                  )}
                  <p className="flex items-center gap-2 text-muted-foreground">
                    <Users className="h-4 w-4" />
                    {evento.inscriptosCount} inscripto(s)
                    {evento.cupo != null && ` · ${evento.plazasDisponibles ?? 0} plaza(s) disponible(s)`}
                  </p>
                </CardContent>
                <CardFooter className="flex justify-end gap-1">
                  <PermissionGuard requiredPermission="evento:ver_inscriptos">
                    <Button variant="ghost" size="sm" onClick={() => handleVerInscriptos(evento)}>
                      <Users className="h-4 w-4" />
                    </Button>
                  </PermissionGuard>
                  <PermissionGuard requiredPermission="evento:editar">
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(evento)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                  </PermissionGuard>
                  <PermissionGuard requiredPermission="evento:eliminar">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(evento)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </PermissionGuard>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}

        <EventoFormDialog evento={null} open={createDialog} onOpenChange={setCreateDialog} onSuccess={refresh} />
        <EventoFormDialog evento={selected} open={editDialog} onOpenChange={setEditDialog} onSuccess={refresh} />
        <DeleteEventoDialog evento={selected} open={deleteDialog} onOpenChange={setDeleteDialog} onSuccess={refresh} />
        <InscriptosEventoDialog evento={selected} open={inscriptosDialog} onOpenChange={setInscriptosDialog} />
      </div>
    );
  }

  // ----- Vista catálogo: DOCENTE / ESTUDIANTE / EXTERNO -----
  const renderCatalogoCard = (evento: Evento, inMisInscripciones: boolean) => {
    const yaInscrito = evento.yaInscrito || idsInscripto.has(evento.id) || inMisInscripciones;
    const sinPlazas = evento.cupo != null && (evento.plazasDisponibles ?? 0) <= 0;
    const deshabilitado = yaInscrito || sinPlazas || inscribiendo === evento.id;

    return (
      <Card key={evento.id} className="flex flex-col">
        <CardHeader>
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-base">{evento.titulo}</CardTitle>
            <Badge variant="outline" className="text-[10px] shrink-0">{evento.tipo}</Badge>
          </div>
        </CardHeader>
        <CardContent className="flex-1 space-y-2 text-sm">
          {evento.descripcion && (
            <p className="text-muted-foreground line-clamp-3">{evento.descripcion}</p>
          )}
          <p className="flex items-center gap-2 text-muted-foreground">
            <CalendarDays className="h-4 w-4" />
            {formatFecha(evento.inicio)}
          </p>
          {evento.espacioNombre && (
            <p className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-4 w-4" />
              {evento.espacioNombre}
            </p>
          )}
          {evento.cupo != null && (
            <p className="flex items-center gap-2 text-muted-foreground">
              <Users className="h-4 w-4" />
              {evento.plazasDisponibles ?? 0} plaza(s) disponible(s)
            </p>
          )}
        </CardContent>
        {!inMisInscripciones && (
          <CardFooter>
            <PermissionGuard requiredPermission="evento:inscribir">
              <Button
                className="w-full"
                disabled={deshabilitado}
                onClick={() => handleInscribirse(evento)}
              >
                {inscribiendo === evento.id && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                {(() => {
                  if (yaInscrito) return 'Ya inscrito';
                  if (sinPlazas) return 'Sin plazas';
                  return 'Inscribirme';
                })()}
              </Button>
            </PermissionGuard>
          </CardFooter>
        )}
      </Card>
    );
  };

  return (
    <div className="space-y-8 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-semibold">{titulo}</h1>
        <p className="text-sm text-muted-foreground">
          Explorá los eventos y cursos disponibles e inscribite.
        </p>
      </div>

      <section className="space-y-4">
        <h2 className="text-lg font-medium">Disponibles</h2>
        {eventos.length === 0 ? (
          <div className="text-center py-12">
            <CalendarDays className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No hay eventos disponibles</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {eventos.map((evento) => renderCatalogoCard(evento, false))}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-medium">Mis inscripciones</h2>
        {misInscripciones.length === 0 ? (
          <p className="text-sm text-muted-foreground">Todavía no te inscribiste a ningún evento.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {misInscripciones.map((evento) => renderCatalogoCard(evento, true))}
          </div>
        )}
      </section>
    </div>
  );
}
