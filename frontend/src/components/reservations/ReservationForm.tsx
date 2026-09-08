import { Button } from '@/components/ui/Button';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { DatePicker } from '@/components/ui/date-picker';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { createLocalDateTimeUTC } from '@/lib/utils/timezone';
import { AnalistaRecomendado } from '@/components/recomendaciones/AnalistaRecomendado';
import { EspaciosRecomendados } from '@/components/recomendaciones/EspaciosRecomendados';
import { HorariosRecomendados } from '@/components/recomendaciones/HorariosRecomendados';
import { ItemsRecomendados } from '@/components/recomendaciones/ItemsRecomendados';
import PermissionGuard from '@/components/auth/PermissionGuard';
import { useRolePermissions } from '@/hooks/useRolePermissions';
import { useAuth } from '@/hooks/useAuth';
import { useEspacios } from '@/hooks/useEspacios';
import { useCarreras } from '@/hooks/useCarreras';
import { useTiposElemento } from '@/hooks/useTiposElemento';
import { useReservationFormState } from './_shared/useReservationFormState';
import {
  AnalistaSelect,
  CarreraSelect,
  EspacioSelect,
  HoraInicioFinSection,
  ItemsSolicitadosSection,
  RecurrenciaSection,
} from './_shared/ReservationFormSections';

interface ReservationFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export default function ReservationForm({
  onSuccess,
  onCancel,
}: Readonly<ReservationFormProps>) {
  const { hasPermission } = useRolePermissions();
  const { user } = useAuth();

  // Lógica basada en permisos, no en roles
  const canApprove = hasPermission('reserva:aprobar');
  const canViewRecommendations = hasPermission('recomendacion:ver');
  const needsAnalystAssignment = !canApprove;
  // Un EXTERNO tampoco aprueba, pero no puede listar analistas: su solicitud va
  // sin asignar y la ve cualquiera de ellos. Antes el formulario se los pedia
  // igual, se comia un 403 y el boton de enviar quedaba deshabilitado para
  // siempre, asi que un externo no podia pedir una reserva.
  const puedeElegirAnalista = needsAnalystAssignment && hasPermission('usuario:ver_analistas');

  // Hooks compartidos con caché
  const { espacios } = useEspacios();
  const { carreras } = useCarreras();
  const { tiposElemento } = useTiposElemento();

  const formState = useReservationFormState(
    {
      needsAnalystAssignment,
      puedeElegirAnalista,
      canApprove,
      canViewRecommendations,
      userId: user?.id,
    },
    onSuccess,
  );

  const {
    formData,
    setFormData,
    fecha,
    setFecha,
    horaError,
    loading,
    itemsSolicitados,
    disabledDates,
    analistas,
    horasInicioDisponibles,
    horasFinDisponibles,
    minutosInicioDisponibles,
    minutosFinDisponibles,
    isFormValid,
    agregarItemSolicitado,
    eliminarItemSolicitado,
    actualizarItemSolicitado,
    agregarItemRecomendado,
    handleSelectHorarioRecomendado,
    handleSubmit,
  } = formState;

  const espaciosDisponibles = espacios.filter(e => e.estado === 'DISPONIBLE');

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver
        </Button>
        <div>
          <h1 className="text-3xl font-bold">
            {needsAnalystAssignment ? 'Nueva Solicitud de Reserva' : 'Nueva Reserva'}
          </h1>
          <p className="text-muted-foreground mt-1">
            Completa el formulario para {needsAnalystAssignment ? 'solicitar' : 'crear'} una reserva
          </p>
        </div>
      </div>

      {/* Contenido del formulario */}
      <form onSubmit={handleSubmit} className="bg-white rounded-lg border shadow-sm">
        <div className="p-6 space-y-6">
          {/* Espacio */}
          <EspacioSelect
            value={formData.espacioId}
            espaciosDisponibles={espaciosDisponibles}
            onChange={(value) => setFormData(prev => ({ ...prev, espacioId: value }))}
          />

          {/* Recomendaciones de espacios */}
          {fecha && formData.horaInicioHora && formData.horaFinHora && !formData.espacioId && canViewRecommendations && (
            <div className="mt-4">
              <EspaciosRecomendados
                inicio={createLocalDateTimeUTC(
                  fecha,
                  Number.parseInt(formData.horaInicioHora),
                  Number.parseInt(formData.horaInicioMinuto || '0'),
                )}
                fin={createLocalDateTimeUTC(
                  fecha,
                  Number.parseInt(formData.horaFinHora),
                  Number.parseInt(formData.horaFinMinuto || '0'),
                )}
                onSelectEspacio={(espacioId) => {
                  setFormData(prev => ({ ...prev, espacioId: espacioId.toString() }));
                }}
              />
            </div>
          )}

          <div className="border-t border-dashed border-gray-300 my-4"></div>

          {/* Título */}
          <div className="flex items-center gap-4">
            <Label htmlFor="titulo" className="text-sm font-semibold text-gray-700 min-w-[80px]">Título *</Label>
            <div className="flex-1">
              <Input
                id="titulo"
                type="text"
                value={formData.titulo}
                onChange={(e) => setFormData(prev => ({ ...prev, titulo: e.target.value }))}
                placeholder="Ej: Clase de Programación, Reunión de equipo, etc."
                maxLength={200}
                className="h-10"
              />
              <p className="text-xs text-muted-foreground mt-1">
                {formData.titulo.length}/200 caracteres
              </p>
            </div>
          </div>

          <div className="border-t border-dashed border-gray-300 my-4"></div>

          {/* Motivo de solicitud */}
          {needsAnalystAssignment && (
            <>
              <div className="flex items-center gap-4">
                <Label htmlFor="motivoSolicitud" className="text-sm font-semibold text-gray-700 min-w-[80px]">Motivo</Label>
                <div className="flex-1">
                  <Textarea
                    id="motivoSolicitud"
                    value={formData.motivoSolicitud}
                    onChange={(e) => setFormData(prev => ({ ...prev, motivoSolicitud: e.target.value }))}
                    placeholder="Describe brevemente el motivo de tu solicitud"
                    rows={3}
                    maxLength={500}
                    className="resize-none"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {formData.motivoSolicitud.length}/500 caracteres (opcional)
                  </p>
                </div>
              </div>

              <div className="border-t border-dashed border-gray-300 my-4"></div>
            </>
          )}

          {/* Carrera */}
          {canViewRecommendations && (
            <CarreraSelect
              value={formData.carreraId}
              carreras={carreras}
              onChange={(value) => setFormData(prev => ({ ...prev, carreraId: value }))}
            />
          )}

          <div className="border-t border-dashed border-gray-300 my-4"></div>

          {/* Analista asignado */}
          {puedeElegirAnalista && (
            <>
              <AnalistaSelect
                value={formData.analistaId}
                analistas={analistas}
                onChange={(value) => setFormData(prev => ({ ...prev, analistaId: value }))}
              />
              {user?.id && (
                <AnalistaRecomendado
                  docenteId={user.id}
                  analistaSeleccionadoId={
                    formData.analistaId ? Number.parseInt(formData.analistaId) : undefined
                  }
                  onSelectAnalista={(analistaId) =>
                    setFormData(prev => ({ ...prev, analistaId: analistaId.toString() }))
                  }
                />
              )}
              <div className="border-t border-dashed border-gray-300 my-4"></div>
            </>
          )}

          {/* Items recomendados */}
          {formData.espacioId && canViewRecommendations && (
            <div className="mb-4">
              <ItemsRecomendados
                espacioId={Number.parseInt(formData.espacioId)}
                onSelectItem={agregarItemRecomendado}
                itemsSeleccionados={new Set(itemsSolicitados.map(item => item.tipoElementoId))}
              />
            </div>
          )}

          {/* Items Solicitados */}
          <ItemsSolicitadosSection
            items={itemsSolicitados}
            tiposElemento={tiposElemento}
            onAgregar={() => agregarItemSolicitado(tiposElemento[0]?.id || 0)}
            onEliminar={eliminarItemSolicitado}
            onActualizar={actualizarItemSolicitado}
          />

          <div className="border-t border-dashed border-gray-300 my-4"></div>

          {/* Fecha */}
          <div className="flex items-center gap-4">
            <Label className="text-sm font-semibold text-gray-700 min-w-[80px]">Fecha *</Label>
            <div className="flex-1">
              <DatePicker
                value={fecha}
                onChange={setFecha}
                placeholder="Seleccionar fecha"
                minDate={new Date()}
                disabledDates={disabledDates}
              />
            </div>
          </div>

          <div className="border-t border-dashed border-gray-300 my-4"></div>

          {/* Horas de inicio y fin */}
          <HoraInicioFinSection
            formData={formData}
            setFormData={setFormData}
            horasInicioDisponibles={horasInicioDisponibles}
            horasFinDisponibles={horasFinDisponibles}
            minutosInicioDisponibles={minutosInicioDisponibles}
            minutosFinDisponibles={minutosFinDisponibles}
          />
          {horaError && (
            <p className="text-sm text-destructive font-medium">{horaError}</p>
          )}

          {/* Horarios recomendados */}
          {formData.espacioId && fecha && canViewRecommendations && (
            <div className="mt-4">
              <HorariosRecomendados
                espacioId={Number.parseInt(formData.espacioId)}
                fecha={fecha}
                onSelectHorario={handleSelectHorarioRecomendado}
                horarioSeleccionado={
                  formData.horaInicioHora && formData.horaFinHora
                    ? (() => {
                        const fechaStr = fecha.toISOString().split('T')[0];
                        return {
                          inicio: `${fechaStr}T${formData.horaInicioHora}:${formData.horaInicioMinuto}`,
                          fin: `${fechaStr}T${formData.horaFinHora}:${formData.horaFinMinuto}`,
                        };
                      })()
                    : undefined
                }
              />
            </div>
          )}

          <div className="border-t border-dashed border-gray-300 my-4"></div>

          {/* Recurrencia */}
          <RecurrenciaSection
            formData={formData}
            setFormData={setFormData}
            fecha={fecha}
          />
        </div>

        {/* Footer */}
        <div className="border-t bg-gray-50 px-6 py-4 flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={loading}
          >
            Cancelar
          </Button>
          <PermissionGuard requiredPermissions={['reserva:crear']}>
            <Button type="submit" disabled={loading || !isFormValid} className="bg-blue-600 hover:bg-blue-700">
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {needsAnalystAssignment ? 'Enviar Solicitud' : 'Crear Reserva'}
            </Button>
          </PermissionGuard>
        </div>
      </form>
    </div>
  );
}
