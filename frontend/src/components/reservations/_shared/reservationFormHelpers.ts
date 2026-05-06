import { toUTC } from '@/lib/utils/timezone';

export interface ReservaFormValidation {
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
export function validateReservationFormData(input: ReservaFormValidation): string | null {
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
export function toFinDeDiaISO(fechaFin: Date): string {
  const fecha = new Date(fechaFin);
  fecha.setHours(23, 59, 59, 999);
  return toUTC(fecha);
}

export interface MensajeExitoArgs {
  cantidadReservas: number;
  needsAnalystAssignment: boolean;
  // Cuando true (DOCENTE), usa "enviada"; cuando false (EXTERNO), usa "creada".
  // En ReservationForm el comportamiento original era siempre "enviada" sin distinguir.
  variantDocente?: boolean;
}

// Construye el mensaje de éxito tras crear (o solicitar) una o más reservas
export function buildMensajeExitoReserva(args: MensajeExitoArgs): string {
  const esPlural = args.cantidadReservas > 1;
  if (args.needsAnalystAssignment) {
    const sufijoSolicitud = esPlural ? `es de ${args.cantidadReservas} reservas` : ' de reserva';
    const sufijoS = esPlural ? 's' : '';
    const verbo = args.variantDocente === false ? 'creada' : 'enviada';
    return `Solicitud${sufijoSolicitud} ${verbo}${sufijoS} exitosamente. Esperando aprobación.`;
  }
  return esPlural
    ? `${args.cantidadReservas} reservas creadas exitosamente`
    : 'Reserva creada exitosamente';
}

// Resuelve el id del analista a asignar según el rol del usuario actual
export function resolverAnalistaId(args: {
  canApprove: boolean;
  needsAnalystAssignment: boolean;
  analistaId?: string;
  userId?: number;
}): number | undefined {
  if (args.canApprove) return args.userId;
  if (args.needsAnalystAssignment && args.analistaId) {
    return Number.parseInt(args.analistaId);
  }
  return undefined;
}

// Calcular cantidad aproximada de reservas que se crearán
export function calcularCantidadReservas(
  fechaInicio: Date,
  fechaFin: Date,
  tipoRecurrencia: 'DIARIA' | 'SEMANAL' | 'MENSUAL'
): number {
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
      const meses = (fechaFin.getFullYear() - fechaInicio.getFullYear()) * 12
                 + (fechaFin.getMonth() - fechaInicio.getMonth());
      return meses + 1;
    }
    default:
      return 1;
  }
}

export interface HorarioFormFields {
  horaInicioHora: string;
  horaInicioMinuto: string;
  horaFinHora: string;
  horaFinMinuto: string;
}

export const HORARIO_VACIO: HorarioFormFields = {
  horaInicioHora: '',
  horaInicioMinuto: '00',
  horaFinHora: '',
  horaFinMinuto: '00',
};

// Convierte fechas ISO de inicio/fin a campos del formulario; retorna null si las fechas son inválidas
export function parseHorarioRecomendado(inicio: string, fin: string): HorarioFormFields | null {
  const inicioDate = new Date(inicio);
  const finDate = new Date(fin);
  if (Number.isNaN(inicioDate.getTime()) || Number.isNaN(finDate.getTime())) {
    return null;
  }
  return {
    horaInicioHora: inicioDate.getHours().toString().padStart(2, '0'),
    horaInicioMinuto: inicioDate.getMinutes().toString().padStart(2, '0'),
    horaFinHora: finDate.getHours().toString().padStart(2, '0'),
    horaFinMinuto: finDate.getMinutes().toString().padStart(2, '0'),
  };
}

export interface ReservaFormDataShape {
  espacioId: string;
  carreraId: string;
  titulo: string;
  motivoSolicitud: string;
  horaInicioHora: string;
  horaInicioMinuto: string;
  horaFinHora: string;
  horaFinMinuto: string;
  tipoRecurrencia: '' | 'DIARIA' | 'SEMANAL' | 'MENSUAL';
  fechaFinRecurrencia: Date | undefined;
  analistaId: string;
}

export const INITIAL_FORM_DATA: ReservaFormDataShape = {
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
  analistaId: '',
};

export interface ItemSolicitadoForm {
  tipoElementoId: number;
  inventarioItemId?: number;
  cantidadSolicitada: number;
  observaciones?: string;
}

// Construye el payload de items para el endpoint de creación; devuelve undefined si no hay items
export function buildItemsParaEnviar(items: ItemSolicitadoForm[]) {
  if (items.length === 0) return undefined;
  return items.map(item => ({
    tipoElementoId: item.tipoElementoId,
    inventarioItemId: item.inventarioItemId,
    cantidadSolicitada: item.cantidadSolicitada,
    observaciones: item.observaciones || undefined,
  }));
}

// Convierte un mensaje crudo de error a un toast con descripción amigable
export interface ErrorToastDescriptor {
  title: string;
  description?: string;
}

export function describeReservationError(error: unknown): ErrorToastDescriptor {
  const mensaje = error instanceof Error ? error.message : 'No se pudo crear la reserva';
  if (mensaje.includes('ocupado') || mensaje.includes('conflicto')) {
    return {
      title: 'El espacio ya está reservado en ese horario',
      description: 'Por favor selecciona otro horario',
    };
  }
  if (mensaje.includes('pasado')) {
    return { title: 'No se puede reservar en el pasado' };
  }
  return { title: 'Error al crear reserva', description: mensaje };
}
