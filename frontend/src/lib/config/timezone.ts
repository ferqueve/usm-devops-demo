/**
 * Configuración de zona horaria de la aplicación
 * La zona horaria se lee de la variable de entorno VITE_APP_TIMEZONE
 * Si no está definida, usa America/Montevideo como valor por defecto
 */

export const APP_TIMEZONE = import.meta.env.VITE_APP_TIMEZONE || 'America/Montevideo';

