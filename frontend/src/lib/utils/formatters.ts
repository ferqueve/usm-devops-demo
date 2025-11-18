/**
 * Formatea bytes a formato legible (KB, MB, GB, etc.)
 */
export const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
};

/**
 * Formatea milisegundos a tiempo legible (días, horas, minutos, segundos)
 */
export const formatUptime = (ms: number): string => {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) return `${days}d ${hours % 24}h`;
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
};

/**
 * Formatea un número como moneda (USD)
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN',
  }).format(amount);
};

/**
 * Genera un color consistente basado en un string (nombre del espacio)
 */
export const generateColorFromString = (str: string): string => {
  if (!str || str.trim() === '') {
    str = 'default';
  }
  
  // Generar hash del string
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const codePoint = str.codePointAt(i) ?? 0;
    hash = codePoint + ((hash << 5) - hash);
  }
  
  hash = hash < 0 ? -hash : hash;
  
  // Usar solo colores brillantes/pastel (evitando muy claros)
  const r = 100 + (hash % 100);
  const g = 100 + ((hash / 100) % 100);
  const b = 100 + ((hash / 10000) % 100);
  
  const rValid = Math.min(255, Math.max(100, r));
  const gValid = Math.min(255, Math.max(100, g));
  const bValid = Math.min(255, Math.max(100, b));
  
  return `#${rValid.toString(16).padStart(2, '0')}${gValid.toString(16).padStart(2, '0')}${bValid.toString(16).padStart(2, '0')}`;
};

