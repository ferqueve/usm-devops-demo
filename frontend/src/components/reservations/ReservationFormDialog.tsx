import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/Button';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogTitle,
} from '@/components/ui/dialog';
import { DatePicker } from '@/components/ui/date-picker';
import { Loader2, Sparkles, ChevronDown, ChevronUp, Users } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { espaciosApi } from '@/lib/api/spaces';
import { createLocalDateTimeUTC } from '@/lib/utils/timezone';
import { EspaciosRecomendados } from '@/components/recomendaciones/EspaciosRecomendados';
import { HorariosRecomendados } from '@/components/recomendaciones/HorariosRecomendados';
import { ItemsRecomendados } from '@/components/recomendaciones/ItemsRecomendados';
import { recomendacionesApi } from '@/lib/api/recomendaciones';
import type { DashboardRecomendaciones, RecomendacionEspacio } from '@/lib/types/recomendaciones';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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

function getPuntajeBadgeClass(puntaje: number): string {
  if (puntaje >= 0.8) return 'bg-emerald-100 text-emerald-700';
  if (puntaje >= 0.6) return 'bg-blue-100 text-blue-700';
  return 'bg-amber-100 text-amber-700';
}

// Carga espacios disponibles y los convierte a recomendaciones; null si no hay
async function fetchEspaciosComoRecomendacion(): Promise<DashboardRecomendaciones | null> {
  try {
    const espaciosResponse = await espaciosApi.obtenerEspacios();
    if (!espaciosResponse.data || espaciosResponse.data.length === 0) {
      return null;
    }
    const espaciosRecomendados: RecomendacionEspacio[] = espaciosResponse.data
      .slice(0, 4)
      .map(espacio => ({
        tipoRecomendacion: 'ESPACIO_PARA_RESERVA' as const,
        puntaje: 0.7,
        razon: 'Espacio disponible en el sistema',
        espacioId: espacio.id,
        espacioNombre: espacio.nombre,
        capacidad: espacio.capacidad || 0,
        tipoEspacioNombre: espacio.tipoEspacioNombre,
        tipoEspacioColor: espacio.tipoEspacioColor,
        disponible: true,
      }));
    return {
      espaciosRecomendados,
      itemsRecomendados: [],
      mantenimientoUrgente: [],
      reservasPrioritarias: [],
      totalRecomendaciones: espaciosRecomendados.length,
    };
  } catch (espaciosError) {
    console.error('Error cargando espacios como alternativa:', espaciosError);
    return null;
  }
}

// Tarjeta individual de espacio recomendado
interface RecomendacionEspacioCardProps {
  rec: RecomendacionEspacio;
  onSelect: (espacioId: number) => void;
}

function RecomendacionEspacioCard({ rec, onSelect }: Readonly<RecomendacionEspacioCardProps>) {
  return (
    <Card
      className="hover:shadow-md transition-all cursor-pointer border hover:border-primary/50"
      onClick={() => onSelect(rec.espacioId)}
      style={{
        borderLeft: rec.tipoEspacioColor ? `3px solid ${rec.tipoEspacioColor}` : undefined,
      }}
    >
      <CardContent className="px-3 py-1.5">
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-sm truncate mb-1">{rec.espacioNombre}</h4>
            <div className="flex items-center gap-2 flex-wrap">
              {rec.tipoEspacioNombre && (
                <Badge
                  variant="outline"
                  className="text-[10px] px-1.5 py-0.5 h-5"
                  style={{
                    borderColor: rec.tipoEspacioColor,
                    color: rec.tipoEspacioColor,
                  }}
                >
                  {rec.tipoEspacioNombre}
                </Badge>
              )}
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Users className="h-3 w-3" />
                <span>{rec.capacidad}</span>
              </div>
              {rec.disponible && (
                <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] px-1.5 py-0.5 h-5">
                  Disponible
                </Badge>
              )}
            </div>
          </div>
          <Badge
            className={`text-xs px-2 py-0.5 h-5 shrink-0 ${getPuntajeBadgeClass(rec.puntaje)}`}
          >
            {(rec.puntaje * 100).toFixed(0)}%
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}

// Panel con recomendaciones generales (cuando aún no se completó el formulario)
interface RecomendacionesGeneralesPanelProps {
  loading: boolean;
  recomendaciones: DashboardRecomendaciones | null;
  onSelectEspacio: (espacioId: number) => void;
}

function RecomendacionesGeneralesPanel({
  loading,
  recomendaciones,
  onSelectEspacio,
}: Readonly<RecomendacionesGeneralesPanelProps>) {
  if (loading) {
    return (
      <div className="text-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground mx-auto" />
      </div>
    );
  }
  const espacios = recomendaciones?.espaciosRecomendados;
  if (espacios && espacios.length > 0) {
    return (
      <div className="space-y-2.5">
        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          <span>Espacios Recomendados</span>
        </div>
        <div className="grid grid-cols-1 gap-2">
          {espacios.slice(0, 4).map((rec) => (
            <RecomendacionEspacioCard
              key={rec.espacioId}
              rec={rec}
              onSelect={onSelectEspacio}
            />
          ))}
        </div>
      </div>
    );
  }
  return (
    <div className="text-center py-8 text-sm text-gray-500">
      <Sparkles className="h-8 w-8 mx-auto mb-2 text-gray-300" />
      <p>Completa el formulario para ver recomendaciones</p>
    </div>
  );
}

interface ReservationFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface RecomendacionesPanelContentProps {
  fecha: Date | undefined;
  formData: {
    espacioId: string;
    horaInicioHora: string;
    horaInicioMinuto: string;
    horaFinHora: string;
    horaFinMinuto: string;
  };
  itemsSeleccionados: Set<number>;
  onSelectEspacio: (espacioId: number) => void;
  onSelectHorario: (inicio: string, fin: string) => void;
  onSelectItem: (tipoElementoId: number, cantidad: number) => void;
  loadingGenerales: boolean;
  recomendacionesGenerales: DashboardRecomendaciones | null;
  // Cuando true, usa toISOString() en lugar de createLocalDateTimeUTC para EspaciosRecomendados.
  useIsoForEspacios?: boolean;
}

// Bloque interno reutilizado por el panel lateral (desktop) y el panel mobile.
function RecomendacionesPanelContent({
  fecha,
  formData,
  itemsSeleccionados,
  onSelectEspacio,
  onSelectHorario,
  onSelectItem,
  loadingGenerales,
  recomendacionesGenerales,
  useIsoForEspacios,
}: Readonly<RecomendacionesPanelContentProps>) {
  const tieneEspacio = !!formData.espacioId;
  const tieneHorario = !!formData.horaInicioHora && !!formData.horaFinHora;

  const computeInicioFin = (): { inicio: string; fin: string } => {
    if (!fecha) return { inicio: '', fin: '' };
    if (useIsoForEspacios) {
      const fechaStr = fecha.toISOString().split('T')[0];
      const horaInicio = `${formData.horaInicioHora}:${formData.horaInicioMinuto}`;
      const horaFin = `${formData.horaFinHora}:${formData.horaFinMinuto}`;
      return {
        inicio: new Date(`${fechaStr}T${horaInicio}`).toISOString(),
        fin: new Date(`${fechaStr}T${horaFin}`).toISOString(),
      };
    }
    return {
      inicio: createLocalDateTimeUTC(
        fecha,
        Number.parseInt(formData.horaInicioHora),
        Number.parseInt(formData.horaInicioMinuto || '0'),
      ),
      fin: createLocalDateTimeUTC(
        fecha,
        Number.parseInt(formData.horaFinHora),
        Number.parseInt(formData.horaFinMinuto || '0'),
      ),
    };
  };

  const horarioSeleccionado = (() => {
    if (!fecha || !formData.horaInicioHora || !formData.horaFinHora) return undefined;
    const fechaStr = fecha.toISOString().split('T')[0];
    return {
      inicio: `${fechaStr}T${formData.horaInicioHora}:${formData.horaInicioMinuto}`,
      fin: `${fechaStr}T${formData.horaFinHora}:${formData.horaFinMinuto}`,
    };
  })();

  return (
    <>
      {fecha && tieneHorario && !tieneEspacio && (
        <EspaciosRecomendados
          {...computeInicioFin()}
          onSelectEspacio={onSelectEspacio}
          espacioSeleccionadoId={tieneEspacio ? Number.parseInt(formData.espacioId) : undefined}
        />
      )}

      {tieneEspacio && fecha && (
        <HorariosRecomendados
          espacioId={Number.parseInt(formData.espacioId)}
          fecha={fecha}
          onSelectHorario={onSelectHorario}
          horarioSeleccionado={horarioSeleccionado}
        />
      )}

      {tieneEspacio && (
        <ItemsRecomendados
          espacioId={Number.parseInt(formData.espacioId)}
          onSelectItem={onSelectItem}
          itemsSeleccionados={itemsSeleccionados}
        />
      )}

      {!tieneEspacio && !formData.horaInicioHora && !formData.horaFinHora && (
        <RecomendacionesGeneralesPanel
          loading={loadingGenerales}
          recomendaciones={recomendacionesGenerales}
          onSelectEspacio={onSelectEspacio}
        />
      )}
    </>
  );
}

export default function ReservationFormDialog({
  open,
  onOpenChange,
  onSuccess,
}: Readonly<ReservationFormDialogProps>) {
  const { hasPermission } = useRolePermissions();
  const { user } = useAuth();

  const canApprove = hasPermission('reserva:aprobar');
  const canViewRecommendations = hasPermission('recomendacion:ver');
  const needsAnalystAssignment = !canApprove;

  // Ref para medir la altura del formulario y aplicarla al panel de recomendaciones
  const formContainerRef = useRef<HTMLDivElement>(null);
  const [formHeight, setFormHeight] = useState<number | null>(null);

  // Recomendaciones generales del dashboard (cuando no hay datos seleccionados)
  const [recomendacionesGenerales, setRecomendacionesGenerales] = useState<DashboardRecomendaciones | null>(null);
  const [loadingRecomendacionesGenerales, setLoadingRecomendacionesGenerales] = useState(false);

  useEffect(() => {
    const formContainer = formContainerRef.current;
    if (!formContainer) return;

    const updateHeight = () => {
      setFormHeight(formContainer.offsetHeight);
    };

    updateHeight();

    const resizeObserver = new ResizeObserver(() => {
      updateHeight();
    });

    resizeObserver.observe(formContainer);
    return () => resizeObserver.disconnect();
  }, []);

  // Hooks compartidos con caché
  const { espacios } = useEspacios();
  const { carreras } = useCarreras();
  const { tiposElemento } = useTiposElemento();

  const [showRecomendacionesMobile, setShowRecomendacionesMobile] = useState(false);

  const formState = useReservationFormState(
    {
      needsAnalystAssignment,
      canApprove,
      canViewRecommendations,
      userId: user?.id,
      open,
      mensajeExitoVariantDocente: canViewRecommendations,
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

  // Cargar recomendaciones generales del dashboard
  const fetchRecomendacionesGenerales = useCallback(async () => {
    const tieneEspacio = formData.espacioId && formData.espacioId.trim() !== '';
    const tieneHorarioCompleto = formData.horaInicioHora && formData.horaFinHora;

    if (tieneEspacio || tieneHorarioCompleto) {
      setRecomendacionesGenerales(null);
      return;
    }

    setLoadingRecomendacionesGenerales(true);
    try {
      const response = await recomendacionesApi.obtenerRecomendacionesDashboard();
      const tieneRecomendaciones = response.success
        && (response.data?.espaciosRecomendados?.length ?? 0) > 0;
      if (tieneRecomendaciones) {
        setRecomendacionesGenerales(response.data!);
      } else {
        const fallback = await fetchEspaciosComoRecomendacion();
        setRecomendacionesGenerales(fallback);
      }
    } catch (error) {
      console.error('Error cargando recomendaciones generales:', error);
      setRecomendacionesGenerales(null);
    } finally {
      setLoadingRecomendacionesGenerales(false);
    }
  }, [formData.espacioId, formData.horaInicioHora, formData.horaFinHora]);

  // Recargar recomendaciones generales cuando cambian los datos del formulario o se abre
  useEffect(() => {
    if (canViewRecommendations && open) {
      fetchRecomendacionesGenerales();
    }
  }, [formData.espacioId, formData.horaInicioHora, formData.horaFinHora, open, canViewRecommendations, fetchRecomendacionesGenerales]);

  const espaciosDisponibles = espacios.filter(e => e.estado === 'DISPONIBLE');

  // Wrapper que delega en el handler base agregando el flag esPublica para usuarios externos.
  const onFormSubmit = (e: React.FormEvent) => {
    handleSubmit(e, { esPublica: canViewRecommendations ? undefined : true });
  };

  const itemsSeleccionados = new Set(itemsSolicitados.map(item => item.tipoElementoId));
  const handleSelectEspacioRec = (espacioId: number) =>
    setFormData(prev => ({ ...prev, espacioId: espacioId.toString() }));

  const submitLabel = (() => {
    if (!needsAnalystAssignment) return 'Crear Reserva';
    return canViewRecommendations ? 'Enviar Solicitud' : 'Crear Solicitud';
  })();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!grid-cols-1 w-[95vw] max-w-[1400px] lg:max-w-[1400px] !p-0 !gap-0 max-h-[90vh] !flex !flex-col overflow-hidden">
        <form onSubmit={onFormSubmit} className="flex flex-col h-full min-h-0">
          {/* Header compacto */}
          <div className="relative bg-gradient-to-br from-blue-500 to-blue-600 px-4 sm:px-6 pt-4 pb-3 flex-shrink-0">
            <div className="flex items-center gap-3 mb-2">
              <p className="text-xs font-medium text-white/90">NUEVA RESERVA</p>
              <div className="bg-white/20 text-white text-xs font-semibold px-2 py-0.5 rounded-full">
                Crear
              </div>
            </div>
            <DialogTitle className="text-lg font-bold text-white">
              {needsAnalystAssignment ? 'Nueva Solicitud de Reserva' : 'Nueva Reserva'}
            </DialogTitle>
            <div className="absolute bottom-0 left-0 right-0 flex justify-between px-4">
              <div className="w-3 h-3 bg-white rounded-full -mb-1.5"></div>
              <div className="w-3 h-3 bg-white rounded-full -mb-1.5"></div>
              <div className="w-3 h-3 bg-white rounded-full -mb-1.5"></div>
              <div className="w-3 h-3 bg-white rounded-full -mb-1.5"></div>
              <div className="w-3 h-3 bg-white rounded-full -mb-1.5"></div>
              <div className="w-3 h-3 bg-white rounded-full -mb-1.5"></div>
            </div>
          </div>

          <div className="relative flex flex-col lg:flex-row flex-1 min-h-0 overflow-hidden">
            <div ref={formContainerRef} className={`bg-white min-h-0 overflow-y-auto overflow-x-hidden px-6 py-6 space-y-6 ${canViewRecommendations ? 'lg:w-[calc(100%-400px)]' : 'lg:w-full'}`}>
              {/* Espacio */}
              <EspacioSelect
                value={formData.espacioId}
                espaciosDisponibles={espaciosDisponibles}
                onChange={(value) => setFormData(prev => ({ ...prev, espacioId: value }))}
              />

              <div className="border-t border-dashed border-gray-300 my-4"></div>

              {/* Carrera */}
              {canViewRecommendations && (
                <CarreraSelect
                  value={formData.carreraId}
                  carreras={carreras}
                  onChange={(value) => setFormData(prev => ({ ...prev, carreraId: value }))}
                />
              )}

              <div className="border-t border-dashed border-gray-300 my-4"></div>

              {/* Título */}
              <div className="space-y-2">
                <Label htmlFor="titulo" className="text-sm font-semibold text-gray-700">Título *</Label>
                <Input
                  id="titulo"
                  value={formData.titulo}
                  onChange={(e) => setFormData(prev => ({ ...prev, titulo: e.target.value }))}
                  placeholder="Ej: Clase de Matemáticas, Reunión de equipo, etc."
                  className="h-10"
                  maxLength={200}
                />
                <p className="text-xs text-gray-500">{formData.titulo.length}/200 caracteres</p>
              </div>

              <div className="border-t border-dashed border-gray-300 my-4"></div>

              {/* Motivo de solicitud */}
              {needsAnalystAssignment && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="motivoSolicitud" className="text-sm font-semibold text-gray-700">Motivo de la solicitud</Label>
                    <Textarea
                      id="motivoSolicitud"
                      value={formData.motivoSolicitud}
                      onChange={(e) => setFormData(prev => ({ ...prev, motivoSolicitud: e.target.value }))}
                      placeholder="Explica brevemente el motivo de tu solicitud (opcional)"
                      className="min-h-[80px] resize-none"
                    />
                  </div>

                  <div className="border-t border-dashed border-gray-300 my-4"></div>
                </>
              )}

              {/* Indicador de reserva pública - solo para externos */}
              {!canViewRecommendations && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                  <div className="flex items-start gap-2">
                    <div className="text-blue-600 mt-0.5">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-blue-900">Reserva Pública</p>
                      <p className="text-xs text-blue-700 mt-1">
                        Tu solicitud de reserva será pública y visible para todos los usuarios del sistema.
                        Un analista revisará y aprobará tu solicitud.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Analista asignado */}
              {needsAnalystAssignment && (
                <>
                  <AnalistaSelect
                    value={formData.analistaId}
                    analistas={analistas}
                    onChange={(value) => setFormData(prev => ({ ...prev, analistaId: value }))}
                  />
                  <div className="border-t border-dashed border-gray-300 my-4"></div>
                </>
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
                useDynamicKeys
              />
              {horaError && (
                <p className="text-sm text-destructive font-medium">{horaError}</p>
              )}

              <div className="border-t border-dashed border-gray-300 my-4"></div>

              {/* Recurrencia */}
              <RecurrenciaSection
                formData={formData}
                setFormData={setFormData}
                fecha={fecha}
              />
            </div>

            {/* Panel de Recomendaciones - Lado derecho */}
            {canViewRecommendations && (
              <div
                className="hidden lg:flex lg:absolute lg:right-0 lg:top-0 w-full lg:w-[400px] border-t lg:border-t-0 lg:border-l border-gray-200 bg-gray-50 flex-col overflow-hidden"
                style={{ height: formHeight ? `${formHeight}px` : '100%' }}
              >
                <div className="bg-white border-b border-gray-200 px-4 py-3 flex-shrink-0">
                  <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    Recomendaciones del Sistema
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">Sugerencias opcionales basadas en tus preferencias</p>
                </div>
                <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4 space-y-4">
                  <RecomendacionesPanelContent
                    fecha={fecha}
                    formData={formData}
                    itemsSeleccionados={itemsSeleccionados}
                    onSelectEspacio={handleSelectEspacioRec}
                    onSelectHorario={handleSelectHorarioRecomendado}
                    onSelectItem={agregarItemRecomendado}
                    loadingGenerales={loadingRecomendacionesGenerales}
                    recomendacionesGenerales={recomendacionesGenerales}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Panel de Recomendaciones - Móvil */}
          {canViewRecommendations && (
            <div className="w-full lg:hidden border-t border-gray-200 bg-gray-50 flex-shrink-0">
              <button
                type="button"
                onClick={() => setShowRecomendacionesMobile(!showRecomendacionesMobile)}
                className="w-full bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <h3 className="text-sm font-semibold text-gray-700">Recomendaciones del Sistema</h3>
                </div>
                {showRecomendacionesMobile ? (
                  <ChevronUp className="h-4 w-4 text-gray-500" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-gray-500" />
                )}
              </button>
              {showRecomendacionesMobile && (
                <div className="px-4 py-4 space-y-4 max-h-[400px] overflow-y-auto">
                  <RecomendacionesPanelContent
                    fecha={fecha}
                    formData={formData}
                    itemsSeleccionados={itemsSeleccionados}
                    onSelectEspacio={handleSelectEspacioRec}
                    onSelectHorario={handleSelectHorarioRecomendado}
                    onSelectItem={agregarItemRecomendado}
                    loadingGenerales={loadingRecomendacionesGenerales}
                    recomendacionesGenerales={recomendacionesGenerales}
                    useIsoForEspacios
                  />
                </div>
              )}
            </div>
          )}

          {/* Footer tipo ticket */}
          <div className="relative bg-gray-50 px-5 py-3 border-t border-dashed border-gray-300 flex-shrink-0">
            <div className="absolute top-0 left-0 right-0 flex justify-between px-4 -mt-1.5">
              <div className="w-3 h-3 bg-white rounded-full"></div>
              <div className="w-3 h-3 bg-white rounded-full"></div>
              <div className="w-3 h-3 bg-white rounded-full"></div>
              <div className="w-3 h-3 bg-white rounded-full"></div>
              <div className="w-3 h-3 bg-white rounded-full"></div>
              <div className="w-3 h-3 bg-white rounded-full"></div>
            </div>
            <DialogFooter className="mt-0 gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading}
                className="flex-1"
              >
                Cancelar
              </Button>
              <PermissionGuard requiredPermissions={['reserva:crear']}>
                <Button type="submit" disabled={loading || !isFormValid} className="flex-1 bg-blue-600 hover:bg-blue-700">
                  {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {submitLabel}
                </Button>
              </PermissionGuard>
            </DialogFooter>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
