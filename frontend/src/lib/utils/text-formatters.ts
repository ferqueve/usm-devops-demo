/**
 * Helpers de formateo de texto para la UI.
 */

/**
 * Trunca un texto a un número específico de caracteres
 * 
 * @param text - El texto a truncar
 * @param maxLength - Longitud máxima (default: 50)
 * @param suffix - Sufijo a agregar cuando se trunca (default: '...')
 * @returns El texto truncado
 */
export const truncateText = (text: string, maxLength: number = 50, suffix: string = '...'): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - suffix.length) + suffix;
};

/**
 * Formatea un nombre para mostrar de forma compacta
 * 
 * @param name - El nombre a formatear
 * @param maxLength - Longitud máxima (default: 20)
 * @returns El nombre formateado
 */
export const formatNameForDisplay = (name: string, maxLength: number = 20): string => {
  if (name.length <= maxLength) return name;
  
  // Si es muy largo, intentar dividir en palabras
  const words = name.split(' ');
  if (words.length > 1) {
    const firstWord = words[0];
    const rest = words.slice(1).join(' ');
    
    if (firstWord.length + rest.length + 1 <= maxLength) {
      return `${firstWord} ${rest}`;
    }
  }
  
  return truncateText(name, maxLength);
};
