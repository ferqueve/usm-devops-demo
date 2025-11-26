import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/Button';
import { Calendar, Clock, User, Hourglass, CheckCircle2, Users, Eye, ChevronRight, ChevronLeft, AlertTriangle } from 'lucide-react';
import type { Reserva } from '@/lib/types/spaces';
import { getEstadoConfig, formatTime, formatShortDate } from './reservationUtils';
import { recomendacionesApi } from '@/lib/api/recomendaciones';
import type { RecomendacionAnalista } from '@/lib/types/recomendaciones';


interface ReservationPendientesProps {
  reservasPendientes: Reserva[];
  loading: boolean;
  onViewDetails: (reserva: Reserva) => void;
  collapsed: boolean;
  onCollapsedChange: (collapsed: boolean) => void;
}

export default function ReservationPendientes({ 
  reservasPendientes, 
  loading, 
  onViewDetails,
  collapsed,
  onCollapsedChange
}: ReservationPendientesProps) {
  const [isVerticalLayout, setIsVerticalLayout] = useState(false);
  const [reservasPrioritarias, setReservasPrioritarias] = useState<RecomendacionAnalista[]>([]);

  // Detectar cuando el layout está en vertical (menor a lg breakpoint)
  useEffect(() => {
    const checkLayout = () => {
      setIsVerticalLayout(window.innerWidth < 1024); // lg breakpoint de Tailwind
    };

    checkLayout();
    window.addEventListener('resize', checkLayout);
    return () => window.removeEventListener('resize', checkLayout);
  }, []);

  // Cuando cambia a modo vertical, asegurar que siempre esté extendido
  useEffect(() => {
    if (isVerticalLayout && collapsed) {
      onCollapsedChange(false);
    }
  }, [isVerticalLayout, collapsed, onCollapsedChange]);

  // Cargar reservas prioritarias
  useEffect(() => {
    const fetchPrioritarias = async () => {
      if (reservasPendientes.length === 0) return;
      
      try {
        const response = await recomendacionesApi.obtenerReservasPrioritarias();
        if (response.success && response.data) {
          setReservasPrioritarias(response.data);
        }
      } catch (error) {
        console.warn('No se pudieron cargar reservas prioritarias:', error);
      }
    };

    fetchPrioritarias();
  }, [reservasPendientes.length]);

  // Función para obtener urgencia de una reserva
  const getUrgencia = (reservaId: number): number => {
    const rec = reservasPrioritarias.find(r => {
      const reservaIdFromMeta = r.metadata?.reservaId as number;
      return reservaIdFromMeta === reservaId;
    });
    if (rec && rec.metadata) {
      return (rec.metadata.urgencia as number) || 0;
    }
    return 0;
  };

  // Ordenar reservas por urgencia (mayor primero)
  const reservasOrdenadas = [...reservasPendientes].sort((a, b) => {
    const urgenciaA = getUrgencia(a.id);
    const urgenciaB = getUrgencia(b.id);
    return urgenciaB - urgenciaA;
  });

  // En modo vertical, forzar que siempre esté extendido
  const isCollapsed = isVerticalLayout ? false : collapsed;

  return (
    <Card className={`h-fit overflow-hidden transition-all duration-500 ease-in-out ${
      isCollapsed 
        ? 'w-14 sm:w-16 md:w-20 max-w-20' 
        : 'w-full sm:w-full md:w-full lg:w-[300px] xl:w-[328px] lg:max-w-[328px] lg:sticky lg:top-6'
    }`}>
      <CardHeader className={isCollapsed ? "pb-2 px-1.5 sm:px-2" : "pb-2 sm:pb-3 px-3 sm:px-4"}>
        {isCollapsed ? (
          <div className="flex flex-col items-center gap-1.5 sm:gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onCollapsedChange(false)}
              className="h-5 w-5 sm:h-6 sm:w-6 p-0"
              title="Expandir"
            >
              <ChevronLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </Button>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
              <Hourglass className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-600 shrink-0" />
              <CardTitle className="text-sm sm:text-base truncate">
                Pendientes
                {reservasPendientes.length > 0 && (
                  <span className="ml-1.5 sm:ml-2 text-xs sm:text-sm font-normal text-muted-foreground">
                    ({reservasPendientes.length})
                  </span>
                )}
              </CardTitle>
            </div>
            {!isVerticalLayout && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onCollapsedChange(true)}
                className="h-6 w-6 sm:h-7 sm:w-7 p-0 shrink-0"
                title="Colapsar"
              >
                <ChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </Button>
            )}
          </div>
        )}
      </CardHeader>
      <div className={isCollapsed ? "" : ""}>
        {isCollapsed ? (
          <CardContent className="px-1.5 sm:px-2 pb-2">
            {!loading && (
              <div className="flex flex-col items-center justify-center p-1.5 sm:p-2 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="text-muted-foreground mb-0.5 sm:mb-1">
                  <Hourglass className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-yellow-600" />
                </div>
                <div className="text-xs sm:text-sm font-semibold text-center leading-tight truncate w-full">
                  {reservasPendientes.length}
                </div>
              </div>
            )}
          </CardContent>
        ) : (
        <CardContent className="space-y-2 sm:space-y-3 px-3 sm:px-4 pb-3 sm:pb-4">
          {loading ? (
            <div className="text-center py-6 sm:py-8">
              <div className="inline-block animate-spin rounded-full h-5 w-5 sm:h-6 sm:w-6 border-b-2 border-yellow-600"></div>
              <p className="text-xs sm:text-sm text-muted-foreground mt-2">Cargando solicitudes...</p>
            </div>
          ) : reservasPendientes.length === 0 ? (
            <div className="text-center py-6 sm:py-8 bg-gray-50 rounded-lg border border-gray-200 px-2">
              <CheckCircle2 className="h-10 w-10 sm:h-12 sm:w-12 text-green-500 mx-auto mb-2 sm:mb-3" />
              <p className="text-xs sm:text-sm font-medium text-gray-700">No hay solicitudes pendientes</p>
              <p className="text-[10px] sm:text-xs text-gray-500 mt-1">Todas las reservas están procesadas</p>
            </div>
          ) : (
            <div className="space-y-1.5 sm:space-y-2 max-h-[500px] sm:max-h-[600px] overflow-y-auto pr-0.5 sm:pr-1">
              {reservasOrdenadas.map((reserva) => {
                const estadoConfig = getEstadoConfig(reserva.estado);
                const urgencia = getUrgencia(reserva.id);
                const isPrioritaria = urgencia > 0;
                const isAltaUrgencia = urgencia >= 7;
                
                return (
                  <div
                    key={reserva.id}
                    className={`group relative overflow-hidden rounded-xl sm:rounded-2xl ${estadoConfig.borderColor} border-r border-t border-b transition-all hover:shadow-sm border-gray-200 hover:border-gray-300 bg-white cursor-pointer ${
                      isAltaUrgencia ? 'ring-2 ring-red-200' : isPrioritaria ? 'ring-1 ring-orange-200' : ''
                    }`}
                    onClick={() => onViewDetails(reserva)}
                    >
                    {/* Franja de color recta en el lado izquierdo */}
                    <div className={`absolute left-0 top-0 bottom-0 w-1 sm:w-1.5 ${estadoConfig.stripeColor}`} />
                    <div className="p-2 sm:p-2.5 md:p-3">
                      <div className="flex items-start gap-2 sm:gap-2.5">
                        {/* Contenido principal */}
                        <div className="flex-1 min-w-0 flex flex-col gap-1 sm:gap-1.5">
                          <div className="flex items-center gap-1 sm:gap-1.5 min-w-0">
                            {/* Estado como icono */}
                            {estadoConfig.icon ? (() => {
                              const EstadoIcon = estadoConfig.icon;
                              return (
                                <div className={`${estadoConfig.iconColor} shrink-0`}>
                                  <EstadoIcon className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                                </div>
                              );
                            })() : null}
                            {/* Badge de urgencia */}
                            {isPrioritaria && (
                              <div className={`flex items-center gap-0.5 px-1 py-0.5 rounded text-[9px] sm:text-[10px] font-semibold shrink-0 ${
                                isAltaUrgencia 
                                  ? 'bg-red-100 text-red-700 border border-red-300' 
                                  : 'bg-orange-100 text-orange-700 border border-orange-300'
                              }`}>
                                <AlertTriangle className="h-2 w-2 sm:h-2.5 sm:w-2.5" />
                                <span>{urgencia}/10</span>
                              </div>
                            )}
                            {/* Punto de color del tipo de espacio */}
                            {reserva.tipoEspacioColor ? (
                              <div 
                                className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full shrink-0" 
                                style={{ backgroundColor: reserva.tipoEspacioColor }}
                                title={reserva.tipoEspacioNombre || 'Tipo de espacio'}
                              />
                            ) : null}
                            <h3 className="text-xs sm:text-sm font-semibold truncate">
                              {reserva.espacioNombre}
                            </h3>
                          </div>
                          <div className="flex flex-wrap items-center gap-x-1.5 sm:gap-x-2 md:gap-x-3 gap-y-0.5 text-[10px] sm:text-xs text-muted-foreground">
                            <div className="flex items-center gap-0.5 sm:gap-1">
                              <Calendar className="h-2.5 w-2.5 sm:h-3 sm:w-3 shrink-0" />
                              <span className="truncate">{formatShortDate(reserva.inicio)}</span>
                            </div>
                            <div className="flex items-center gap-0.5 sm:gap-1">
                              <Clock className="h-2.5 w-2.5 sm:h-3 sm:w-3 shrink-0" />
                              <span className="truncate text-[10px] sm:text-xs">{formatTime(reserva.inicio)} - {formatTime(reserva.fin)}</span>
                            </div>
                            <div className="flex items-center gap-0.5 sm:gap-1">
                              <Users className="h-2.5 w-2.5 sm:h-3 sm:w-3 shrink-0" />
                              <span className="text-[10px] sm:text-xs">Cap. {reserva.capacidadEspacio}</span>
                            </div>
                            <div className="flex items-center gap-0.5 sm:gap-1">
                              <User className="h-2.5 w-2.5 sm:h-3 sm:w-3 shrink-0" />
                              <span className="truncate text-[10px] sm:text-xs">{reserva.usuarioNombre}</span>
                            </div>
                          </div>
                        </div>

                        {/* Acciones - a la derecha */}
                        <div className="flex-shrink-0 flex items-center gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onViewDetails(reserva);
                            }}
                            className="p-1 sm:p-1.5 rounded transition-colors text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                            title="Ver detalles"
                          >
                            <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
        )}
      </div>
    </Card>
  );
}

