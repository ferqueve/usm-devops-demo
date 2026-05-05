/**
 * Utilidades para manejo de timezone y conversión UTC
 * 
 * El backend usa Instant (UTC) y envía/recibe fechas en formato ISO-8601 UTC (con 'Z')
 * El frontend debe convertir fechas locales del cliente a UTC al enviar
 * y mostrar fechas UTC del backend en la zona horaria local del cliente
 */

/**
 * Convierte un objeto Date local del cliente a string UTC ISO-8601 (con 'Z')
 * @param date - Objeto Date en la zona horaria local del cliente
 * @returns String en formato ISO-8601 UTC (ej: "2025-01-15T17:00:00Z")
 */
export function toUTC(date: Date): string {
  if (!date || !(date instanceof Date) || Number.isNaN(date.getTime())) {
    throw new Error('Fecha inválida');
  }
  return date.toISOString();
}

/**
 * Convierte un string UTC ISO-8601 a objeto Date en la zona horaria local del cliente
 * El navegador parsea automáticamente ISO-8601 UTC a Date local
 * @param utcDateString - String UTC ISO-8601 (ej: "2025-01-15T17:00:00Z")
 * @returns Objeto Date en la zona horaria local del cliente
 */
export function fromUTC(utcDateString: string): Date {
  if (!utcDateString) {
    throw new Error('String de fecha UTC requerido');
  }
  const date = new Date(utcDateString);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`Fecha UTC inválida: ${utcDateString}`);
  }
  return date;
}

/**
 * Formatea una fecha UTC para mostrar en la zona horaria local del cliente
 * @param utcDateString - String UTC ISO-8601 del backend
 * @param options - Opciones de formateo (opcional)
 * @returns String formateado en la zona horaria local del cliente
 */
export function formatInClientTimezone(
  utcDateString: string,
  options?: Intl.DateTimeFormatOptions
): string {
  try {
    const date = fromUTC(utcDateString);
    const defaultOptions: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      ...options,
    };
    return date.toLocaleString('es-UY', defaultOptions);
  } catch (error) {
    console.error('Error formateando fecha:', error);
    return 'Fecha inválida';
  }
}

/**
 * Crea una fecha/hora en la zona local del cliente y la convierte a UTC ISO string
 * Útil para construir fechas desde inputs de fecha + hora seleccionados por el usuario
 * @param date - Fecha seleccionada (solo fecha, sin hora)
 * @param hour - Hora en formato 24h (0-23)
 * @param minute - Minutos (0-59)
 * @returns String UTC ISO-8601 (ej: "2025-01-15T17:00:00Z")
 */
export function createLocalDateTimeUTC(
  date: Date,
  hour: number,
  minute: number
): string {
  if (!date || !(date instanceof Date) || Number.isNaN(date.getTime())) {
    throw new Error('Fecha inválida');
  }
  
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) {
    throw new Error('Hora o minuto inválido');
  }

  // Crear nueva fecha con la fecha seleccionada y hora/minuto en zona local
  const localDateTime = new Date(date);
  localDateTime.setHours(hour, minute, 0, 0);
  
  // Convertir a UTC ISO string
  return localDateTime.toISOString();
}

/**
 * Formatea solo la fecha (sin hora) de un string UTC
 * @param utcDateString - String UTC ISO-8601
 * @returns String formateado (ej: "15/01/2025")
 */
export function formatDateOnly(utcDateString: string): string {
  try {
    const date = fromUTC(utcDateString);
    return date.toLocaleDateString('es-UY', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  } catch (error) {
    console.error('Error formateando fecha:', error);
    return 'Fecha inválida';
  }
}

/**
 * Formatea solo la hora (sin fecha) de un string UTC
 * @param utcDateString - String UTC ISO-8601
 * @returns String formateado (ej: "14:00")
 */
export function formatTimeOnly(utcDateString: string): string {
  try {
    const date = fromUTC(utcDateString);
    return date.toLocaleTimeString('es-UY', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  } catch (error) {
    console.error('Error formateando hora:', error);
    return 'Hora inválida';
  }
}

