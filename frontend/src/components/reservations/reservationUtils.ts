import { CheckCircle2, XCircle, Hourglass } from 'lucide-react';
import type { Reserva } from '@/lib/types/spaces';

export function getEstadoConfig(estado: Reserva['estado']) {
  switch (estado) {
    case 'APROBADO':
      return {
        label: 'Aprobada',
        color: 'bg-green-50 text-green-700 border-green-200',
        iconColor: 'text-green-600',
        stripeColor: 'bg-green-700',
        borderColor: 'border-l-green-700',
        cornerBorderColor: 'border-t-green-700',
        icon: CheckCircle2
      };
    case 'PENDIENTE':
      return {
        label: 'Pendiente',
        color: 'bg-yellow-50 text-yellow-700 border-yellow-200',
        iconColor: 'text-yellow-600',
        stripeColor: 'bg-yellow-700',
        borderColor: 'border-l-yellow-700',
        cornerBorderColor: 'border-t-yellow-700',
        icon: Hourglass
      };
    case 'CANCELADO':
      return {
        label: 'Cancelada',
        color: 'bg-red-50 text-red-700 border-red-200',
        iconColor: 'text-red-600',
        stripeColor: 'bg-red-700',
        borderColor: 'border-l-red-700',
        cornerBorderColor: 'border-t-red-700',
        icon: XCircle
      };
    default:
      return {
        label: estado,
        color: 'bg-gray-50 text-gray-700 border-gray-200',
        iconColor: 'text-gray-600',
        stripeColor: 'bg-gray-700',
        borderColor: 'border-l-gray-700',
        cornerBorderColor: 'border-t-gray-700',
        icon: null
      };
  }
}

export function formatTime(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function formatShortDate(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
}

/**
 * Formatea una fecha en formato ISO local (sin convertir a UTC)
 * Esto es necesario porque el backend usa LocalDateTime que no tiene zona horaria
 * @param date - Objeto Date a formatear
 * @returns String en formato YYYY-MM-DDTHH:mm:ss
 */
export function formatLocalDateTime(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
}

