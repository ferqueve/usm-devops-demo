import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';
import { TimeSelect } from '@/components/ui/time-select';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { espaciosApi } from '@/lib/api/spaces';
import { reservationsApi } from '@/lib/api/reservations';
import type { Espacio, Reserva } from '@/lib/types/spaces';
import { formatLocalDateTime } from './reservationUtils';

interface ReservationFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export default function ReservationFormDialog({
  open,
  onOpenChange,
  onSuccess
}: ReservationFormDialogProps) {
  const [loading, setLoading] = useState(false);
  const [espacios, setEspacios] = useState<Espacio[]>([]);
  const [fecha, setFecha] = useState<Date | undefined>(new Date());
  const [horaError, setHoraError] = useState<string>('');
  const [reservasEspacio, setReservasEspacio] = useState<Reserva[]>([]);
  const [disabledDates, setDisabledDates] = useState<Date[]>([]);
  const [formData, setFormData] = useState({
    espacioId: '',
    horaInicioHora: '',
    horaInicioMinuto: '00',
    horaFinHora: '',
    horaFinMinuto: '00'
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
    const esHoy = fecha && fecha.toDateString() === ahora.toDateString();
    const horaActual = ahora.getHours();

    return horas.filter(hora => {
      const horaNum = parseInt(hora);
      
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
        const horaFinNum = parseInt(formData.horaFinHora);
        // Si la hora de inicio es igual a la de fin, verificar minutos
        if (horaNum === horaFinNum) {
          // Si los minutos de inicio son mayores o iguales a los de fin, no es válido
          const minInicio = parseInt(formData.horaInicioMinuto || '0');
          const minFin = parseInt(formData.horaFinMinuto || '0');
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
    const esHoy = fecha && fecha.toDateString() === ahora.toDateString();
    const horaActual = ahora.getHours();

    return horas.filter(hora => {
      const horaNum = parseInt(hora);
      
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
        const horaInicioNum = parseInt(formData.horaInicioHora);
        
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
    const esHoy = fecha && fecha.toDateString() === ahora.toDateString();
    const horaActual = ahora.getHours();
    const minutoActual = ahora.getMinutes();
    const horaInicioNum = parseInt(formData.horaInicioHora);

    // Si es hoy y es la hora actual, excluir minutos pasados
    if (esHoy && horaInicioNum === horaActual) {
      return minutos.filter(min => parseInt(min) > minutoActual);
    }

    // Si hay hora de fin seleccionada y es la misma hora, filtrar minutos
    if (formData.horaFinHora && formData.horaInicioHora === formData.horaFinHora) {
      const minFin = parseInt(formData.horaFinMinuto || '0');
      return minutos.filter(min => parseInt(min) < minFin);
    }

    return minutos;
  };

  // Obtener minutos disponibles para fin
  const getMinutosFinDisponibles = () => {
    if (!formData.horaFinHora) {
      return minutos;
    }

    const ahora = new Date();
    const esHoy = fecha && fecha.toDateString() === ahora.toDateString();
    const horaActual = ahora.getHours();
    const minutoActual = ahora.getMinutes();
    const horaFinNum = parseInt(formData.horaFinHora);

    // Si es hoy y es la hora actual, excluir minutos pasados
    if (esHoy && horaFinNum === horaActual) {
      return minutos.filter(min => parseInt(min) > minutoActual);
    }

    // Si hay hora de inicio seleccionada y es la misma hora, asegurar diferencia mínima de 30 minutos
    if (formData.horaInicioHora && formData.horaInicioHora === formData.horaFinHora) {
      const minInicio = parseInt(formData.horaInicioMinuto || '0');
      return minutos.filter(min => {
        const minNum = parseInt(min);
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
    if (open) {
      fetchEspacios();
      setFecha(new Date());
      setHoraError('');
      setFormData({
        espacioId: '',
        horaInicioHora: '',
        horaInicioMinuto: '00',
        horaFinHora: '',
        horaFinMinuto: '00'
      });
    }
  }, [open]);

  // Cargar reservas cuando se selecciona un espacio
  useEffect(() => {
    if (formData.espacioId) {
      fetchReservasEspacio(formData.espacioId);
    } else {
      setReservasEspacio([]);
      setDisabledDates([]);
    }
  }, [formData.espacioId]);

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

  const fetchEspacios = async () => {
    try {
      const response = await espaciosApi.obtenerEspacios();
      if (response.data) {
        setEspacios(response.data);
      }
    } catch (error) {
      console.error('Error al cargar espacios:', error);
      toast.error('Error al cargar espacios');
    }
  };

  // Cargar reservas del espacio seleccionado
  const fetchReservasEspacio = async (espacioId: string) => {
    if (!espacioId) {
      setReservasEspacio([]);
      setDisabledDates([]);
      return;
    }

    try {
      const response = await reservationsApi.obtenerReservasPorEspacio(parseInt(espacioId));
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
  };

  // Calcular días completamente ocupados
  const calcularDiasOcupados = (reservas: Reserva[]) => {
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
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // ===== VALIDACIONES =====
    
    // 1. Validar Espacio (obligatorio)
    if (!formData.espacioId) {
      toast.error('Por favor selecciona un espacio');
      return;
    }

    // 2. Validar Fecha (obligatorio)
    if (!fecha) {
      toast.error('Por favor selecciona una fecha');
      return;
    }

    // 3. Validar Hora de Inicio (obligatorio)
    if (!formData.horaInicioHora) {
      toast.error('Por favor selecciona la hora de inicio');
      return;
    }

    // 4. Validar Hora de Fin (obligatorio)
    if (!formData.horaFinHora) {
      toast.error('Por favor selecciona la hora de fin');
      return;
    }

    // Construir las horas completas
    const horaInicio = `${formData.horaInicioHora}:${formData.horaInicioMinuto}`;
    const horaFin = `${formData.horaFinHora}:${formData.horaFinMinuto}`;

    // 5. Validar formato de horas
    const fechaStr = fecha.toISOString().split('T')[0];
    const inicio = new Date(`${fechaStr}T${horaInicio}`);
    const fin = new Date(`${fechaStr}T${horaFin}`);

    if (isNaN(inicio.getTime()) || isNaN(fin.getTime())) {
      toast.error('Las horas ingresadas no son válidas');
      return;
    }

    // 6. Validar que fin > inicio
    if (fin <= inicio) {
      toast.error('La hora de fin debe ser posterior a la hora de inicio');
      return;
    }

    // 7. Validar que no sea en el pasado
    if (inicio < new Date()) {
      toast.error('No se puede reservar en el pasado');
      return;
    }

    // 8. Validar duración mínima (30 minutos)
    const diferenciaMinutos = (fin.getTime() - inicio.getTime()) / (1000 * 60);
    if (diferenciaMinutos < 30) {
      toast.error('La reserva debe tener una duración mínima de 30 minutos');
      return;
    }

    setLoading(true);
    try {
      // Formatear fechas en formato ISO local (sin convertir a UTC)
      // Esto es necesario porque el backend usa LocalDateTime que no tiene zona horaria
      const inicioISO = formatLocalDateTime(inicio);
      const finISO = formatLocalDateTime(fin);

      await reservationsApi.crearReserva({
        espacioId: parseInt(formData.espacioId),
        inicio: inicioISO,
        fin: finISO
      });

      toast.success('Reserva creada exitosamente');
      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      console.error('Error al crear reserva:', error);
      const mensaje = error.message || 'No se pudo crear la reserva';
      
      // Mensajes de error más específicos
      if (mensaje.includes('ocupado') || mensaje.includes('conflicto')) {
        toast.error('El espacio ya está reservado en ese horario', {
          description: 'Por favor selecciona otro horario'
        });
      } else if (mensaje.includes('pasado')) {
        toast.error('No se puede reservar en el pasado');
      } else {
        toast.error('Error al crear reserva', {
          description: mensaje
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const espaciosDisponibles = espacios.filter(e => e.estado === 'DISPONIBLE');

  // Verificar si el formulario está completo y sin errores
  const isFormValid = !!(
    formData.espacioId &&
    fecha &&
    formData.horaInicioHora &&
    formData.horaFinHora &&
    !horaError
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Nueva Reserva</DialogTitle>
            <DialogDescription>
              Completa los datos para crear una nueva reserva
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Espacio */}
            <div className="space-y-2">
              <Label htmlFor="espacio">Espacio *</Label>
              <Select
                value={formData.espacioId}
                onValueChange={(value) => setFormData(prev => ({ ...prev, espacioId: value }))}
              >
                <SelectTrigger id="espacio">
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

            {/* Fecha */}
            <div className="space-y-2">
              <Label>Fecha *</Label>
              <DatePicker
                value={fecha}
                onChange={setFecha}
                placeholder="Seleccionar fecha"
                minDate={new Date()}
                disabledDates={disabledDates}
              />
            </div>

            {/* Hora de inicio */}
            <div className="space-y-2">
              <Label>Hora de inicio *</Label>
              <div className="flex gap-2 items-center">
                <div className="flex-1">
                  <TimeSelect
                    options={horasInicioDisponibles}
                    value={formData.horaInicioHora}
                    onChange={(value) => {
                      setFormData(prev => ({ ...prev, horaInicioHora: value }));
                      // Si la hora de fin seleccionada es menor o igual a la nueva hora de inicio, limpiarla
                      if (formData.horaFinHora && parseInt(value) >= parseInt(formData.horaFinHora)) {
                        setFormData(prev => ({ ...prev, horaFinHora: '' }));
                      }
                    }}
                    placeholder="00"
                  />
                </div>
                <div className="text-lg font-semibold px-1">:</div>
                <div className="flex-1">
                  <TimeSelect
                    options={minutosInicioDisponibles}
                    value={formData.horaInicioMinuto}
                    onChange={(value) => {
                      setFormData(prev => ({ ...prev, horaInicioMinuto: value }));
                      // Si hay hora de fin, verificar que siga siendo válida
                      if (formData.horaInicioHora && formData.horaFinHora) {
                        const horaInicioNum = parseInt(formData.horaInicioHora);
                        const horaFinNum = parseInt(formData.horaFinHora);
                        const minInicio = parseInt(value);
                        const minFin = parseInt(formData.horaFinMinuto || '0');
                        
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

            {/* Hora de fin */}
            <div className="space-y-2">
              <Label>Hora de fin *</Label>
              <div className="flex gap-2 items-center">
                <div className="flex-1">
                  <TimeSelect
                    options={horasFinDisponibles}
                    value={formData.horaFinHora}
                    onChange={(value) => {
                      setFormData(prev => ({ ...prev, horaFinHora: value }));
                      // Si la nueva hora de fin es igual a la de inicio y los minutos no son válidos, limpiar minutos de fin
                      if (formData.horaInicioHora && value === formData.horaInicioHora) {
                        const minInicio = parseInt(formData.horaInicioMinuto || '0');
                        const minFin = parseInt(formData.horaFinMinuto || '0');
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
                <div className="text-lg font-semibold px-1">:</div>
                <div className="flex-1">
                  <TimeSelect
                    options={minutosFinDisponibles}
                    value={formData.horaFinMinuto}
                    onChange={(value) => setFormData(prev => ({ ...prev, horaFinMinuto: value }))}
                    placeholder="00"
                  />
                </div>
              </div>
              {horaError && (
                <p className="text-sm text-destructive font-medium">{horaError}</p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || !isFormValid}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Crear Reserva
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}