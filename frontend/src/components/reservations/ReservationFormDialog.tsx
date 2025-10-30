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

  // Obtener horas disponibles para el día seleccionado
  const getHorasDisponibles = () => {
    if (!fecha || reservasEspacio.length === 0) {
      return horas;
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

    if (reservasDia.length === 0) {
      return horas;
    }

    const horasOcupadas = new Set<number>();
    
    reservasDia.forEach(reserva => {
      const inicio = new Date(reserva.inicio);
      const fin = new Date(reserva.fin);
      
      // Si es el mismo día, marcar las horas ocupadas
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

    return horas.filter(hora => !horasOcupadas.has(parseInt(hora)));
  };

  const horasDisponibles = getHorasDisponibles();

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
      // Formatear fechas en ISO para el backend
      const inicioISO = inicio.toISOString();
      const finISO = fin.toISOString();

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
      <DialogContent className="sm:max-w-[500px]">
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
                    options={horasDisponibles}
                    value={formData.horaInicioHora}
                    onChange={(value) => setFormData(prev => ({ ...prev, horaInicioHora: value }))}
                    placeholder="00"
                  />
                </div>
                <div className="text-lg font-semibold px-1">:</div>
                <div className="flex-1">
                  <TimeSelect
                    options={minutos}
                    value={formData.horaInicioMinuto}
                    onChange={(value) => setFormData(prev => ({ ...prev, horaInicioMinuto: value }))}
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
                    options={horasDisponibles}
                    value={formData.horaFinHora}
                    onChange={(value) => setFormData(prev => ({ ...prev, horaFinHora: value }))}
                    placeholder="00"
                  />
                </div>
                <div className="text-lg font-semibold px-1">:</div>
                <div className="flex-1">
                  <TimeSelect
                    options={minutos}
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