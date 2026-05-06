import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/Button';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Loader2, Pencil, Plus, X } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';
import { TimeSelect } from '@/components/ui/time-select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { toast } from 'sonner';
import { reservationsApi } from '@/lib/api/reservations';
import { usuariosApi } from '@/lib/api/users';
import type { Reserva } from '@/lib/types/spaces';
import type { User } from '@/lib/types/users';
import { createLocalDateTimeUTC, toUTC } from '@/lib/utils/timezone';
import { EspaciosRecomendados } from '@/components/recomendaciones/EspaciosRecomendados';
import { HorariosRecomendados } from '@/components/recomendaciones/HorariosRecomendados';
import { ItemsRecomendados } from '@/components/recomendaciones/ItemsRecomendados';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import PermissionGuard from '@/components/auth/PermissionGuard';
import { useRolePermissions } from '@/hooks/useRolePermissions';
import { useAuth } from '@/hooks/useAuth';
import { useEspacios } from '@/hooks/useEspacios';
import { useCarreras } from '@/hooks/useCarreras';
import { useTiposElemento } from '@/hooks/useTiposElemento';

interface ReservationFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

interface ReservaFormValidation {
  titulo?: string;
  espacioId?: string;
  fecha?: Date;
  horaInicioHora?: string;
  horaFinHora?: string;
  inicio: Date;
  fin: Date;
  needsAnalystAssignment: boolean;
  analistaId?: string;
  tipoRecurrencia?: string;
  fechaFinRecurrencia?: Date;
}

// Valida los campos requeridos del formulario
function validateRequiredFields(input: ReservaFormValidation): string | null {
  if (!input.titulo || input.titulo.trim() === '') return 'Por favor ingresa un título para la reserva';
  if (!input.espacioId) return 'Por favor selecciona un espacio';
  if (!input.fecha) return 'Por favor selecciona una fecha';
  if (!input.horaInicioHora) return 'Por favor selecciona la hora de inicio';
  if (!input.horaFinHora) return 'Por favor selecciona la hora de fin';
  return null;
}

// Valida el rango de fechas/horas de la reserva
function validateReservationDates(input: ReservaFormValidation): string | null {
  if (Number.isNaN(input.inicio.getTime()) || Number.isNaN(input.fin.getTime())) {
    return 'Las horas ingresadas no son válidas';
  }
  if (input.fin <= input.inicio) return 'La hora de fin debe ser posterior a la hora de inicio';
  if (input.inicio < new Date()) return 'No se puede reservar en el pasado';
  if ((input.fin.getTime() - input.inicio.getTime()) / 60000 < 30) {
    return 'La reserva debe tener una duración mínima de 30 minutos';
  }
  return null;
}

// Valida los datos de recurrencia si aplica
function validateRecurrencia(input: ReservaFormValidation): string | null {
  if (!input.tipoRecurrencia) return null;
  if (!input.fechaFinRecurrencia) return 'Por favor selecciona la fecha de fin de recurrencia';
  if (input.fecha && input.fechaFinRecurrencia <= input.fecha) {
    return 'La fecha de fin de recurrencia debe ser posterior a la fecha de inicio';
  }
  return null;
}

// Valida los datos del formulario de reserva. Devuelve mensaje de error o null
function validateReservationFormData(input: ReservaFormValidation): string | null {
  const requiredError = validateRequiredFields(input);
  if (requiredError) return requiredError;
  const dateError = validateReservationDates(input);
  if (dateError) return dateError;
  if (input.needsAnalystAssignment && !input.analistaId) {
    return 'Por favor selecciona un analista para gestionar tu solicitud';
  }
  return validateRecurrencia(input);
}

// Convierte la fecha de fin de recurrencia a ISO UTC con final de día
function toFinDeDiaISOForm(fechaFin: Date): string {
  const fecha = new Date(fechaFin);
  fecha.setHours(23, 59, 59, 999);
  return toUTC(fecha);
}

// Construye el mensaje de éxito tras crear (o solicitar) una o más reservas
function buildMensajeExitoReserva(args: {
  cantidadReservas: number;
  needsAnalystAssignment: boolean;
}): string {
  const esPlural = args.cantidadReservas > 1;
  if (args.needsAnalystAssignment) {
    const sufijoSolicitud = esPlural ? `es de ${args.cantidadReservas} reservas` : ' de reserva';
    const sufijoS = esPlural ? 's' : '';
    return `Solicitud${sufijoSolicitud} enviada${sufijoS} exitosamente. Esperando aprobación.`;
  }
  return esPlural
    ? `${args.cantidadReservas} reservas creadas exitosamente`
    : 'Reserva creada exitosamente';
}

export default function ReservationForm({
  onSuccess,
  onCancel
}: Readonly<ReservationFormProps>) {
  const { hasPermission } = useRolePermissions();
  const { user } = useAuth();

  // Lógica basada en permisos, no en roles
  const canApprove = hasPermission('reserva:aprobar');
  const canViewRecommendations = hasPermission('recomendacion:ver');
  const needsAnalystAssignment = !canApprove; // Si no puede aprobar, debe seleccionar analista

  // Usar hooks compartidos con caché
  const { espacios } = useEspacios();
  const { carreras } = useCarreras();
  const { tiposElemento } = useTiposElemento();

  const [loading, setLoading] = useState(false);
  const [analistas, setAnalistas] = useState<User[]>([]);
  const [fecha, setFecha] = useState<Date | undefined>(new Date());
  const [horaError, setHoraError] = useState<string>('');
  const [reservasEspacio, setReservasEspacio] = useState<Reserva[]>([]);
  const [disabledDates, setDisabledDates] = useState<Date[]>([]);
  const [itemsSolicitados, setItemsSolicitados] = useState<Array<{
    tipoElementoId: number;
    inventarioItemId?: number;
    cantidadSolicitada: number;
    observaciones?: string;
  }>>([]);
  const [formData, setFormData] = useState({
    espacioId: '',
    carreraId: '',
    titulo: '',
    motivoSolicitud: '',
    horaInicioHora: '',
    horaInicioMinuto: '00',
    horaFinHora: '',
    horaFinMinuto: '00',
    tipoRecurrencia: '' as '' | 'DIARIA' | 'SEMANAL' | 'MENSUAL',
    fechaFinRecurrencia: undefined as Date | undefined,
    analistaId: ''
  });

  // Generar opciones de hora
  const horas = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
  const minutos = ['00', '15', '30', '45'];

  // Obtener horas ocupadas por reservas existentes
  const getHorasOcupadas = () => {
    if (!fecha || reservasEspacio.length === 0) {
      return new Set<number>();
    }

    const fechaStr = fecha.toISOString().split('T')[0];
    const reservasDia = reservasEspacio.filter(reserva => {
      const inicio = new Date(reserva.inicio);
      const fin = new Date(reserva.fin);
      const inicioStr = inicio.toISOString().split('T')[0];
      const finStr = fin.toISOString().split('T')[0];
      
      return inicioStr === fechaStr || finStr === fechaStr ||
             (inicio.toISOString() < fecha + 'T23:59:59' && fin.toISOString() > fecha + 'T00:00:00');
    });

    const horasOcupadas = new Set<number>();
    
    reservasDia.forEach(reserva => {
      const inicio = new Date(reserva.inicio);
      const fin = new Date(reserva.fin);
      const inicioStr = inicio.toISOString().split('T')[0];
      const finStr = fin.toISOString().split('T')[0];
      
      if (inicioStr === fechaStr && finStr === fechaStr) {
        const horaInicio = inicio.getHours();
        const horaFin = fin.getHours();
        
        for (let h = horaInicio; h <= horaFin; h++) {
          horasOcupadas.add(h);
        }
      }
    });

    return horasOcupadas;
  };

  // Obtener horas disponibles para inicio
  const getHorasInicioDisponibles = () => {
    const horasOcupadas = getHorasOcupadas();
    const ahora = new Date();
    const esHoy = fecha?.toDateString() === ahora.toDateString();
    const horaActual = ahora.getHours();

    return horas.filter(hora => {
      const horaNum = Number.parseInt(hora);
      
      // Excluir horas ocupadas
      if (horasOcupadas.has(horaNum)) {
        return false;
      }

      // Si es hoy, excluir horas pasadas
      if (esHoy) {
        if (horaNum < horaActual) {
          return false;
        }
        // Si es la hora actual, solo permitir si hay minutos disponibles después del minuto actual
        if (horaNum === horaActual) {
          // Los minutos se filtrarán en getMinutosInicioDisponibles
          return true;
        }
      }

      // Si hay hora de fin seleccionada, solo mostrar horas anteriores
      if (formData.horaFinHora) {
        const horaFinNum = Number.parseInt(formData.horaFinHora);
        // Si la hora de inicio es igual a la de fin, verificar minutos
        if (horaNum === horaFinNum) {
          // Si los minutos de inicio son mayores o iguales a los de fin, no es válido
          const minInicio = Number.parseInt(formData.horaInicioMinuto || '0');
          const minFin = Number.parseInt(formData.horaFinMinuto || '0');
          return minInicio < minFin;
        }
        return horaNum < horaFinNum;
      }

      return true;
    });
  };

  // Obtener horas disponibles para fin
  const getHorasFinDisponibles = () => {
    const horasOcupadas = getHorasOcupadas();
    const ahora = new Date();
    const esHoy = fecha?.toDateString() === ahora.toDateString();
    const horaActual = ahora.getHours();

    return horas.filter(hora => {
      const horaNum = Number.parseInt(hora);
      
      // Excluir horas ocupadas
      if (horasOcupadas.has(horaNum)) {
        return false;
      }

      // Si es hoy, excluir horas pasadas
      if (esHoy && horaNum < horaActual) {
        return false;
      }

      // Si hay hora de inicio seleccionada, solo mostrar horas posteriores
      if (formData.horaInicioHora) {
        const horaInicioNum = Number.parseInt(formData.horaInicioHora);
        
        // Si la hora de fin es igual a la de inicio, verificar minutos
        if (horaNum === horaInicioNum) {
          // Los minutos se filtrarán en getMinutosFinDisponibles para asegurar 30 minutos mínimos
          return true;
        }
        
        return horaNum > horaInicioNum;
      }

      return true;
    });
  };

  const horasInicioDisponibles = getHorasInicioDisponibles();
  const horasFinDisponibles = getHorasFinDisponibles();

  // Obtener minutos disponibles para inicio
  const getMinutosInicioDisponibles = () => {
    if (!formData.horaInicioHora) {
      return minutos;
    }

    const ahora = new Date();
    const esHoy = fecha?.toDateString() === ahora.toDateString();
    const horaActual = ahora.getHours();
    const minutoActual = ahora.getMinutes();
    const horaInicioNum = Number.parseInt(formData.horaInicioHora);

    // Si es hoy y es la hora actual, excluir minutos pasados
    if (esHoy && horaInicioNum === horaActual) {
      return minutos.filter(min => Number.parseInt(min) > minutoActual);
    }

    // Si hay hora de fin seleccionada y es la misma hora, filtrar minutos
    if (formData.horaFinHora && formData.horaInicioHora === formData.horaFinHora) {
      const minFin = Number.parseInt(formData.horaFinMinuto || '0');
      return minutos.filter(min => Number.parseInt(min) < minFin);
    }

    return minutos;
  };

  // Obtener minutos disponibles para fin
  const getMinutosFinDisponibles = () => {
    if (!formData.horaFinHora) {
      return minutos;
    }

    const ahora = new Date();
    const esHoy = fecha?.toDateString() === ahora.toDateString();
    const horaActual = ahora.getHours();
    const minutoActual = ahora.getMinutes();
    const horaFinNum = Number.parseInt(formData.horaFinHora);

    // Si es hoy y es la hora actual, excluir minutos pasados
    if (esHoy && horaFinNum === horaActual) {
      return minutos.filter(min => Number.parseInt(min) > minutoActual);
    }

    // Si hay hora de inicio seleccionada y es la misma hora, asegurar diferencia mínima de 30 minutos
    if (formData.horaInicioHora && formData.horaInicioHora === formData.horaFinHora) {
      const minInicio = Number.parseInt(formData.horaInicioMinuto || '0');
      return minutos.filter(min => {
        const minNum = Number.parseInt(min);
        const diferenciaMinutos = minNum - minInicio;
        return diferenciaMinutos >= 30;
      });
    }

    // Si no hay hora de inicio o la hora de fin es mayor que la de inicio, todos los minutos están disponibles
    return minutos;
  };

  const minutosInicioDisponibles = getMinutosInicioDisponibles();
  const minutosFinDisponibles = getMinutosFinDisponibles();

  useEffect(() => {
    if (needsAnalystAssignment) {
      fetchAnalistas();
    }
    setFecha(new Date());
    setHoraError('');
    setItemsSolicitados([]);
    setFormData({
      espacioId: '',
      carreraId: '',
      titulo: '',
      motivoSolicitud: '',
      horaInicioHora: '',
      horaInicioMinuto: '00',
      horaFinHora: '',
      horaFinMinuto: '00',
      tipoRecurrencia: '',
      fechaFinRecurrencia: undefined,
      analistaId: ''
    });
  }, [needsAnalystAssignment]);

  // Calcular días completamente ocupados
  const calcularDiasOcupados = useCallback((reservas: Reserva[]) => {
    const diasOcupados = new Set<string>();
    
    reservas.forEach(reserva => {
      const inicio = new Date(reserva.inicio);
      const fin = new Date(reserva.fin);
      
      // Verificar si el día está completamente ocupado (24 horas)
      if (inicio.getHours() === 0 && inicio.getMinutes() === 0 && 
          fin.getHours() === 23 && fin.getMinutes() === 59) {
        const fechaKey = inicio.toISOString().split('T')[0];
        diasOcupados.add(fechaKey);
      }
    });
    
    const fechasDeshabilitadas = Array.from(diasOcupados).map(fechaStr => {
      const [year, month, day] = fechaStr.split('-').map(Number);
      return new Date(year, month - 1, day);
    });
    
    setDisabledDates(fechasDeshabilitadas);
  }, []);

  // Cargar reservas del espacio seleccionado
  const fetchReservasEspacio = useCallback(async (espacioId: string) => {
    if (!espacioId) {
      setReservasEspacio([]);
      setDisabledDates([]);
      return;
    }

    try {
      const response = await reservationsApi.obtenerReservasPorEspacio(Number.parseInt(espacioId));
      if (response.data) {
        const reservasAprobadas = response.data.filter(r => r.estado === 'APROBADO');
        setReservasEspacio(reservasAprobadas);
        
        // Calcular días completamente ocupados
        calcularDiasOcupados(reservasAprobadas);
      }
    } catch (error) {
      console.error('Error al cargar reservas del espacio:', error);
      setReservasEspacio([]);
      setDisabledDates([]);
    }
  }, [calcularDiasOcupados]);

  // Cargar reservas cuando se selecciona un espacio
  useEffect(() => {
    if (formData.espacioId) {
      fetchReservasEspacio(formData.espacioId);
    } else {
      setReservasEspacio([]);
      setDisabledDates([]);
    }
  }, [formData.espacioId, fetchReservasEspacio]);

  // Validar horas en tiempo real
  useEffect(() => {
    if (formData.horaInicioHora && formData.horaFinHora && fecha) {
      const horaInicio = `${formData.horaInicioHora}:${formData.horaInicioMinuto}`;
      const horaFin = `${formData.horaFinHora}:${formData.horaFinMinuto}`;
      
      const fechaStr = fecha.toISOString().split('T')[0];
      const inicio = new Date(`${fechaStr}T${horaInicio}`);
      const fin = new Date(`${fechaStr}T${horaFin}`);

      if (fin <= inicio) {
        setHoraError('La hora de fin debe ser posterior a la hora de inicio');
      } else {
        setHoraError('');
      }
    } else {
      setHoraError('');
    }
  }, [formData, fecha]);

  const fetchAnalistas = async () => {
    try {
      const response = await usuariosApi.listarAnalistas();
      if (response.data) {
        setAnalistas(response.data);
        if (response.data.length === 0) {
          toast.warning('No hay analistas disponibles en el sistema. Contacta al administrador.', {
            duration: 5000
          });
        }
      }
    } catch (error) {
      console.error('Error al cargar analistas:', error);
      toast.error('Error al cargar analistas disponibles', {
        description: 'Por favor, contacta al administrador del sistema'
      });
    }
  };

  const agregarItemSolicitado = () => {
    setItemsSolicitados(prev => [...prev, {
      tipoElementoId: tiposElemento[0]?.id || 0,
      cantidadSolicitada: 1,
      observaciones: ''
    }]);
  };

  const eliminarItemSolicitado = (index: number) => {
    setItemsSolicitados(prev => prev.filter((_, i) => i !== index));
  };

  const actualizarItemSolicitado = (index: number, field: string, value: string | number) => {
    setItemsSolicitados(prev => prev.map((item, i) => 
      i === index ? { ...item, [field]: value } : item
    ));
  };

  // Calcular cantidad aproximada de reservas que se crearán
  const calcularCantidadReservas = (
    fechaInicio: Date,
    fechaFin: Date,
    tipoRecurrencia: 'DIARIA' | 'SEMANAL' | 'MENSUAL'
  ): number => {
    if (!fechaInicio || !fechaFin || fechaFin <= fechaInicio) {
      return 0;
    }

    const diffTime = fechaFin.getTime() - fechaInicio.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    switch (tipoRecurrencia) {
      case 'DIARIA':
        return diffDays + 1;
      case 'SEMANAL':
        return Math.floor(diffDays / 7) + 1;
      case 'MENSUAL': {
        // Aproximación: meses entre fechas
        const meses = (fechaFin.getFullYear() - fechaInicio.getFullYear()) * 12 
                   + (fechaFin.getMonth() - fechaInicio.getMonth());
        return meses + 1;
      }
      default:
        return 1;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const horaInicio = `${formData.horaInicioHora}:${formData.horaInicioMinuto}`;
    const horaFin = `${formData.horaFinHora}:${formData.horaFinMinuto}`;
    const fechaStr = fecha?.toISOString().split('T')[0] ?? '';
    const inicio = new Date(`${fechaStr}T${horaInicio}`);
    const fin = new Date(`${fechaStr}T${horaFin}`);

    const validationError = validateReservationFormData({
      titulo: formData.titulo,
      espacioId: formData.espacioId,
      fecha,
      horaInicioHora: formData.horaInicioHora,
      horaFinHora: formData.horaFinHora,
      inicio,
      fin,
      needsAnalystAssignment,
      analistaId: formData.analistaId,
      tipoRecurrencia: formData.tipoRecurrencia,
      fechaFinRecurrencia: formData.fechaFinRecurrencia,
    });
    if (validationError) {
      toast.error(validationError);
      return;
    }

    setLoading(true);
    try {
      const inicioISO = toUTC(inicio);
      const finISO = toUTC(fin);
      const fechaFinRecurrenciaISO = formData.fechaFinRecurrencia
        ? toFinDeDiaISOForm(formData.fechaFinRecurrencia)
        : undefined;

      const analistaIdResuelto = (() => {
        if (canApprove) return user?.id;
        if (needsAnalystAssignment && formData.analistaId) {
          return Number.parseInt(formData.analistaId);
        }
        return undefined;
      })();

      const itemsParaEnviar = itemsSolicitados.length > 0
        ? itemsSolicitados.map(item => ({
            tipoElementoId: item.tipoElementoId,
            inventarioItemId: item.inventarioItemId,
            cantidadSolicitada: item.cantidadSolicitada,
            observaciones: item.observaciones || undefined,
          }))
        : undefined;

      await reservationsApi.crearReserva({
        espacioId: Number.parseInt(formData.espacioId),
        carreraId: formData.carreraId ? Number.parseInt(formData.carreraId) : undefined,
        titulo: formData.titulo.trim(),
        motivoSolicitud: formData.motivoSolicitud?.trim() || undefined,
        inicio: inicioISO,
        fin: finISO,
        tipoRecurrencia: formData.tipoRecurrencia || undefined,
        fechaFinRecurrencia: fechaFinRecurrenciaISO,
        analistaId: analistaIdResuelto,
        itemsSolicitados: itemsParaEnviar,
      });

      const cantidadReservas = formData.tipoRecurrencia && formData.fechaFinRecurrencia && fecha
        ? calcularCantidadReservas(fecha, formData.fechaFinRecurrencia, formData.tipoRecurrencia)
        : 1;
      toast.success(buildMensajeExitoReserva({ cantidadReservas, needsAnalystAssignment }));
      onSuccess();
    } catch (error: unknown) {
      console.error('Error al crear reserva:', error);
      const mensaje = error instanceof Error ? error.message : 'No se pudo crear la reserva';
      if (mensaje.includes('ocupado') || mensaje.includes('conflicto')) {
        toast.error('El espacio ya está reservado en ese horario', {
          description: 'Por favor selecciona otro horario',
        });
      } else if (mensaje.includes('pasado')) {
        toast.error('No se puede reservar en el pasado');
      } else {
        toast.error('Error al crear reserva', { description: mensaje });
      }
    } finally {
      setLoading(false);
    }
  };

  const espaciosDisponibles = espacios.filter(e => e.estado === 'DISPONIBLE');

  // Verificar si el formulario está completo y sin errores
  const isFormValid = !!(
    formData.titulo &&
    formData.titulo.trim() !== '' &&
    formData.espacioId &&
    fecha &&
    formData.horaInicioHora &&
    formData.horaFinHora &&
    !horaError &&
    (!needsAnalystAssignment || formData.analistaId) // DOCENTE/EXTERNO must select analyst
  );

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
            <div className="flex items-center gap-4">
              <Label htmlFor="espacio" className="text-sm font-semibold text-gray-700 min-w-[80px]">Espacio *</Label>
              <div className="flex-1">
                <Select
                  value={formData.espacioId}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, espacioId: value }))}
                >
                  <SelectTrigger id="espacio" className="h-10">
                    <SelectValue placeholder="Seleccionar espacio" />
                  </SelectTrigger>
                  <SelectContent>
                    {espaciosDisponibles.length === 0 ? (
                      <div className="px-2 py-1.5 text-sm text-muted-foreground">
                        No hay espacios disponibles
                      </div>
                    ) : (
                      espaciosDisponibles.map((espacio) => (
                        <SelectItem key={espacio.id} value={espacio.id.toString()}>
                          {espacio.nombre} (Cap: {espacio.capacidad})
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Recomendaciones de espacios - mostrar si hay fecha y hora seleccionadas y tiene permiso */}
            {fecha && formData.horaInicioHora && formData.horaFinHora && !formData.espacioId && canViewRecommendations && (
              <div className="mt-4">
                <EspaciosRecomendados
                  inicio={(() => {
                    if (!fecha || !formData.horaInicioHora) return '';
                    return createLocalDateTimeUTC(
                      fecha,
                      Number.parseInt(formData.horaInicioHora),
                      Number.parseInt(formData.horaInicioMinuto || '0')
                    );
                  })()}
                  fin={(() => {
                    if (!fecha || !formData.horaFinHora) return '';
                    return createLocalDateTimeUTC(
                      fecha,
                      Number.parseInt(formData.horaFinHora),
                      Number.parseInt(formData.horaFinMinuto || '0')
                    );
                  })()}
                  onSelectEspacio={(espacioId) => {
                    setFormData(prev => ({ ...prev, espacioId: espacioId.toString() }));
                  }}
                />
              </div>
            )}

            {/* Línea punteada */}
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

            {/* Línea punteada */}
            <div className="border-t border-dashed border-gray-300 my-4"></div>

            {/* Motivo de solicitud - Solo visible para usuarios que necesitan aprobación */}
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

                {/* Línea punteada */}
                <div className="border-t border-dashed border-gray-300 my-4"></div>
              </>
            )}

            {/* Carrera - Oculto para usuarios externos (sin permiso recomendacion:ver) */}
            {canViewRecommendations && (
            <div className="flex items-center gap-4">
              <Label htmlFor="carrera" className="text-sm font-semibold text-gray-700 min-w-[80px]">Carrera</Label>
              <div className="flex-1">
                <Select
                  value={formData.carreraId || "ninguna"}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, carreraId: value === "ninguna" ? '' : value }))}
                >
                  <SelectTrigger id="carrera" className="h-10">
                    <SelectValue placeholder="Seleccionar carrera" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ninguna">Ninguna</SelectItem>
                    {carreras.map((carrera) => (
                      <SelectItem key={carrera.id} value={carrera.id.toString()}>
                        {carrera.nombre} {carrera.codigo ? `(${carrera.codigo})` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            )}

            {/* Línea punteada */}
            <div className="border-t border-dashed border-gray-300 my-4"></div>

            {/* Analista asignado - solo si necesita asignación (DOCENTE/EXTERNO) */}
            {needsAnalystAssignment && (
              <>
                <div className="flex items-center gap-4">
                  <Label htmlFor="analista" className="text-sm font-semibold text-gray-700 min-w-[80px]">
                    Analista *
                  </Label>
                  <div className="flex-1">
                    <Select
                      value={formData.analistaId}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, analistaId: value }))}
                    >
                      <SelectTrigger id="analista" className="h-10">
                        <SelectValue placeholder="Seleccionar analista" />
                      </SelectTrigger>
                      <SelectContent>
                        {analistas.length === 0 ? (
                          <div className="px-2 py-1.5 text-sm text-muted-foreground text-center">
                            <p className="font-medium mb-1">No hay analistas disponibles</p>
                            <p className="text-xs">Contacta al administrador para crear un analista</p>
                          </div>
                        ) : (
                          analistas.map((analista) => (
                            <SelectItem key={analista.id} value={analista.id.toString()}>
                              {analista.nombre} ({analista.email})
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Línea punteada */}
                <div className="border-t border-dashed border-gray-300 my-4"></div>
              </>
            )}

            {/* Items recomendados - mostrar si hay espacio seleccionado y tiene permiso */}
            {formData.espacioId && canViewRecommendations && (
              <div className="mb-4">
                <ItemsRecomendados
                  espacioId={Number.parseInt(formData.espacioId)}
                  onSelectItem={(tipoElementoId, cantidad) => {
                    // Verificar si el item ya está en la lista
                    const existe = itemsSolicitados.some(item => item.tipoElementoId === tipoElementoId);
                    if (!existe) {
                      setItemsSolicitados(prev => [...prev, {
                        tipoElementoId,
                        cantidadSolicitada: cantidad,
                        observaciones: ''
                      }]);
                    }
                  }}
                  itemsSeleccionados={new Set(itemsSolicitados.map(item => item.tipoElementoId))}
                />
              </div>
            )}

            {/* Items Solicitados */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold text-gray-700">Items Solicitados</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={agregarItemSolicitado}
                  disabled={tiposElemento.length === 0}
                  className="h-8 text-xs"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Agregar
                </Button>
              </div>
              {itemsSolicitados.length > 0 && (
                <div className="space-y-3 border border-gray-200 rounded-lg p-2 bg-gray-50">
                  {itemsSolicitados.map((item, index) => {
                    const tipo = tiposElemento.find((tipo) => tipo.id === item.tipoElementoId);
                    const observacionLimpia = item.observaciones?.trim() || '';
                    const observacionResumen =
                      observacionLimpia.length > 45
                        ? `${observacionLimpia.slice(0, 42)}...`
                        : observacionLimpia || 'Sin observaciones';

                    return (
                      <div key={item.tipoElementoId} className="bg-white rounded-md border border-gray-200 p-3 flex items-center gap-3">
                        <div className="flex-1 flex flex-wrap items-center gap-x-2 gap-y-1">
                          <span className="text-sm font-semibold text-gray-800">
                            {tipo?.nombre ?? 'Tipo sin definir'}
                          </span>
                          <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                            x{item.cantidadSolicitada}
                          </span>
                          <span className="text-xs text-gray-500 truncate max-w-[200px] sm:max-w-[260px]">
                            Obs: {observacionResumen}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-blue-500 hover:text-blue-700 hover:bg-blue-50"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                            </PopoverTrigger>
                          <PopoverContent align="start" className="w-[320px] space-y-4">
                            <div className="space-y-2">
                              <Label className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                                Tipo de elemento
                              </Label>
                              <Select
                                value={item.tipoElementoId.toString()}
                                onValueChange={(value) => actualizarItemSolicitado(index, 'tipoElementoId', Number.parseInt(value))}
                              >
                                <SelectTrigger className="h-9 text-sm">
                                  <SelectValue placeholder="Seleccionar tipo" />
                                </SelectTrigger>
                                <SelectContent>
                                  {tiposElemento.map((tipo) => (
                                    <SelectItem key={tipo.id} value={tipo.id.toString()}>
                                      {tipo.nombre}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                                Cantidad
                              </Label>
                              <Input
                                type="number"
                                min="1"
                                value={item.cantidadSolicitada}
                                onChange={(e) =>
                                  actualizarItemSolicitado(index, 'cantidadSolicitada', Number.parseInt(e.target.value) || 1)
                                }
                                className="h-9 text-sm"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                                Observaciones (opcional)
                              </Label>
                              <Textarea
                                value={item.observaciones || ''}
                                onChange={(e) => actualizarItemSolicitado(index, 'observaciones', e.target.value)}
                                placeholder="Ej: Necesito marcadores nuevos"
                                className="text-sm min-h-[80px] resize-none"
                              />
                            </div>
                          </PopoverContent>
                          </Popover>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => eliminarItemSolicitado(index)}
                            className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              {itemsSolicitados.length === 0 && (
                <p className="text-xs text-gray-500 italic">No hay items solicitados. Haz clic en "Agregar" para añadir uno.</p>
              )}
            </div>

            {/* Línea punteada */}
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

            {/* Línea punteada */}
            <div className="border-t border-dashed border-gray-300 my-4"></div>

            {/* Horas de inicio y fin */}
            <div className="flex gap-6">
              {/* Hora de inicio */}
              <div className="flex-1 space-y-3">
                <Label className="text-sm font-semibold text-gray-700">Hora de inicio *</Label>
                <div className="flex gap-3 items-center">
                  <div className="flex-1">
                    <TimeSelect
                      options={horasInicioDisponibles}
                      value={formData.horaInicioHora}
                      onChange={(value) => {
                        setFormData(prev => ({ ...prev, horaInicioHora: value }));
                        // Si la hora de fin seleccionada es menor o igual a la nueva hora de inicio, limpiarla
                        if (formData.horaFinHora && Number.parseInt(value) >= Number.parseInt(formData.horaFinHora)) {
                          setFormData(prev => ({ ...prev, horaFinHora: '' }));
                        }
                      }}
                      placeholder="00"
                    />
                  </div>
                  <div className="text-lg font-semibold px-1.5">:</div>
                  <div className="flex-1">
                    <TimeSelect
                      options={minutosInicioDisponibles}
                      value={formData.horaInicioMinuto}
                      onChange={(value) => {
                        setFormData(prev => ({ ...prev, horaInicioMinuto: value }));
                        // Si hay hora de fin, verificar que siga siendo válida
                        if (formData.horaInicioHora && formData.horaFinHora) {
                          const horaInicioNum = Number.parseInt(formData.horaInicioHora);
                          const horaFinNum = Number.parseInt(formData.horaFinHora);
                          const minInicio = Number.parseInt(value);
                          const minFin = Number.parseInt(formData.horaFinMinuto || '0');
                          
                          if (horaInicioNum === horaFinNum && minInicio >= minFin) {
                            setFormData(prev => ({ ...prev, horaFinHora: '', horaFinMinuto: '00' }));
                          }
                        }
                      }}
                      placeholder="00"
                    />
                  </div>
                </div>
              </div>

              {/* Separador vertical */}
              <div className="border-l border-dashed border-gray-300 self-stretch mx-1.5"></div>

              {/* Hora de fin */}
              <div className="flex-1 space-y-3">
                <Label className="text-sm font-semibold text-gray-700">Hora de fin *</Label>
                <div className="flex gap-3 items-center">
                  <div className="flex-1">
                    <TimeSelect
                      options={horasFinDisponibles}
                      value={formData.horaFinHora}
                      onChange={(value) => {
                        setFormData(prev => ({ ...prev, horaFinHora: value }));
                        // Si la nueva hora de fin es igual a la de inicio y los minutos no son válidos, limpiar minutos de fin
                        if (formData.horaInicioHora && value === formData.horaInicioHora) {
                          const minInicio = Number.parseInt(formData.horaInicioMinuto || '0');
                          const minFin = Number.parseInt(formData.horaFinMinuto || '0');
                          if (minFin <= minInicio) {
                            // Buscar el próximo minuto válido (al menos 30 minutos después)
                            const minValido = minInicio + 30;
                            if (minValido >= 60) {
                              // Si no hay minutos válidos en esta hora, limpiar
                              setFormData(prev => ({ ...prev, horaFinHora: '', horaFinMinuto: '00' }));
                            } else {
                              setFormData(prev => ({ ...prev, horaFinMinuto: minValido.toString().padStart(2, '0') }));
                            }
                          }
                        }
                      }}
                      placeholder="00"
                    />
                  </div>
                  <div className="text-lg font-semibold px-1.5">:</div>
                  <div className="flex-1">
                    <TimeSelect
                      options={minutosFinDisponibles}
                      value={formData.horaFinMinuto}
                      onChange={(value) => setFormData(prev => ({ ...prev, horaFinMinuto: value }))}
                      placeholder="00"
                    />
                  </div>
                </div>
              </div>
            </div>
            {horaError && (
              <p className="text-sm text-destructive font-medium">{horaError}</p>
            )}

            {/* Horarios recomendados - mostrar si hay espacio y fecha seleccionados y tiene permiso */}
            {formData.espacioId && fecha && canViewRecommendations && (
              <div className="mt-4">
                <HorariosRecomendados
                  espacioId={Number.parseInt(formData.espacioId)}
                  fecha={fecha}
                  onSelectHorario={(inicio, fin) => {
                    const inicioDate = new Date(inicio);
                    const finDate = new Date(fin);
                    setFormData(prev => ({
                      ...prev,
                      horaInicioHora: inicioDate.getHours().toString().padStart(2, '0'),
                      horaInicioMinuto: inicioDate.getMinutes().toString().padStart(2, '0'),
                      horaFinHora: finDate.getHours().toString().padStart(2, '0'),
                      horaFinMinuto: finDate.getMinutes().toString().padStart(2, '0'),
                    }));
                  }}
                  horarioSeleccionado={
                    formData.horaInicioHora && formData.horaFinHora
                      ? {
                          inicio: (() => {
                            const fechaStr = fecha.toISOString().split('T')[0];
                            return `${fechaStr}T${formData.horaInicioHora}:${formData.horaInicioMinuto}`;
                          })(),
                          fin: (() => {
                            const fechaStr = fecha.toISOString().split('T')[0];
                            return `${fechaStr}T${formData.horaFinHora}:${formData.horaFinMinuto}`;
                          })(),
                        }
                      : undefined
                  }
                />
              </div>
            )}

            {/* Línea punteada */}
            <div className="border-t border-dashed border-gray-300 my-4"></div>

            {/* Recurrencia */}
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Label className="text-sm font-semibold text-gray-700 min-w-[80px]">Recurrencia</Label>
                <div className="flex-1">
                  <Select
                    value={formData.tipoRecurrencia || "ninguna"}
                    onValueChange={(value) => {
                      setFormData(prev => ({ 
                        ...prev, 
                        tipoRecurrencia: value === "ninguna" ? '' : value as 'DIARIA' | 'SEMANAL' | 'MENSUAL',
                        fechaFinRecurrencia: value === "ninguna" ? undefined : prev.fechaFinRecurrencia
                      }));
                    }}
                  >
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="Seleccionar recurrencia" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ninguna">Sin recurrencia (una sola vez)</SelectItem>
                      <SelectItem value="DIARIA">Diaria (todos los días)</SelectItem>
                      <SelectItem value="SEMANAL">Semanal (mismo día de la semana)</SelectItem>
                      <SelectItem value="MENSUAL">Mensual (mismo día del mes)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Fecha fin de recurrencia - solo visible si hay recurrencia */}
              {formData.tipoRecurrencia && (
                <>
                  <div className="flex items-center gap-4">
                    <Label className="text-sm font-semibold text-gray-700 min-w-[80px]">
                      Hasta el día
                    </Label>
                    <div className="flex-1">
                      <DatePicker
                        value={formData.fechaFinRecurrencia}
                        onChange={(date) => setFormData(prev => ({ ...prev, fechaFinRecurrencia: date }))}
                        placeholder="Seleccionar fecha de fin"
                        minDate={fecha ? new Date(fecha.getTime() + 24 * 60 * 60 * 1000) : new Date()}
                      />
                    </div>
                  </div>

                  {/* Resumen de reservas que se crearán */}
                  {formData.fechaFinRecurrencia && fecha && formData.tipoRecurrencia && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <p className="text-sm font-medium text-blue-900">
                        Se crearán aproximadamente{' '}
                        <span className="font-bold">
                          {calcularCantidadReservas(
                            fecha,
                            formData.fechaFinRecurrencia,
                            formData.tipoRecurrencia
                          )}
                        </span>{' '}
                        reservas
                      </p>
                      <p className="text-xs text-blue-700 mt-1">
                        {formData.tipoRecurrencia === 'DIARIA' && 'Una reserva por día'}
                        {formData.tipoRecurrencia === 'SEMANAL' && 'Una reserva por semana'}
                        {formData.tipoRecurrencia === 'MENSUAL' && 'Una reserva por mes'}
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
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