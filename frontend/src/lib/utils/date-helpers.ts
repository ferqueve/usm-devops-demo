/**
 * Utilidades para formateo y manejo de fechas
 */

/**
 * Formatea una fecha ISO string a formato legible
 */
export function formatDate(date: string): string {
  try {
    const dateObj = new Date(date);
    if (Number.isNaN(dateObj.getTime())) {
      return 'Fecha inválida';
    }
    return dateObj.toLocaleDateString('es-UY', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return 'Fecha inválida';
  }
}

/**
 * Formatea una fecha ISO string a formato relativo (hace X tiempo)
 */
export function formatRelativeTime(date: string): string {
  try {
    const dateObj = new Date(date);
    if (Number.isNaN(dateObj.getTime())) {
      return 'Fecha inválida';
    }
    const now = new Date();
    const diffInMs = now.getTime() - dateObj.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInMinutes < 1) {
      return 'Hace un momento';
    } else if (diffInMinutes < 60) {
      return `Hace ${diffInMinutes} minuto${diffInMinutes > 1 ? 's' : ''}`;
    } else if (diffInHours < 24) {
      return `Hace ${diffInHours} hora${diffInHours > 1 ? 's' : ''}`;
    } else if (diffInDays < 7) {
      return `Hace ${diffInDays} día${diffInDays > 1 ? 's' : ''}`;
    } else {
      return formatDate(date);
    }
  } catch {
    return 'Fecha inválida';
  }
}

/**
 * Formatea una fecha para input type="date"
 */
export function formatDateForInput(date: string): string {
  try {
    const dateObj = new Date(date);
    if (Number.isNaN(dateObj.getTime())) {
      return '';
    }
    return dateObj.toISOString().split('T')[0];
  } catch {
    return '';
  }
}

/**
 * Obtiene la fecha de hace X días
 */
export function getDateDaysAgo(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().split('T')[0];
}
