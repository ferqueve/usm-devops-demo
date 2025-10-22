/**
 * Utilidades para formatear texto en la aplicación
 */

/**
 * Resultado del formateo de email
 */
export interface EmailFormatResult {
  needsBreak: boolean;
  firstLine: string;
  secondLine?: string;
}

/**
 * Formatea un email para mostrar en espacios reducidos como el sidebar
 * Divide el email de forma inteligente cortando en puntos y arrobas
 * 
 * @param email - El email a formatear
 * @param maxCharsPerLine - Máximo de caracteres por línea (default: 18)
 * @returns Objeto con la información del email formateado
 */
export const formatEmailForDisplay = (email: string, maxCharsPerLine: number = 18): EmailFormatResult => {
  // Si el email es corto, no dividir
  if (email.length <= maxCharsPerLine) {
    return {
      needsBreak: false,
      firstLine: email
    };
  }
  
  // Dividir en partes usando @ como separador principal
  const parts = email.split('@');
  if (parts.length !== 2) {
    return {
      needsBreak: false,
      firstLine: email
    };
  }
  
  const [username, domain] = parts;
  
  // Estrategia 1: Dividir después del @ si es posible
  const usernameWithAt = `${username}@`;
  if (usernameWithAt.length <= maxCharsPerLine && domain.length <= maxCharsPerLine) {
    return {
      needsBreak: true,
      firstLine: usernameWithAt,
      secondLine: domain
    };
  }
  
  // Estrategia 2: Si el username es muy largo, dividir en puntos
  if (username.length > maxCharsPerLine) {
    const usernameParts = username.split('.');
    if (usernameParts.length > 1) {
      // Intentar dividir en el primer punto
      const firstPart = usernameParts[0];
      const restParts = usernameParts.slice(1);
      
      // Si la primera parte + @ cabe en una línea
      if (firstPart.length + 1 <= maxCharsPerLine) {
        const secondLine = `${restParts.join('.')}@${domain}`;
        return {
          needsBreak: true,
          firstLine: `${firstPart}.`,
          secondLine: secondLine
        };
      }
      
      // Si no, dividir más agresivamente
      let firstLine = '';
      let secondLine = '';
      
      for (let i = 0; i < usernameParts.length; i++) {
        const part = usernameParts[i];
        const testFirstLine = firstLine ? `${firstLine}.${part}` : part;
        
        if (testFirstLine.length <= maxCharsPerLine) {
          firstLine = testFirstLine;
        } else {
          // Poner el resto en la segunda línea
          const remainingParts = usernameParts.slice(i);
          secondLine = `${remainingParts.join('.')}@${domain}`;
          break;
        }
      }
      
      if (secondLine) {
        return {
          needsBreak: true,
          firstLine: firstLine,
          secondLine: secondLine
        };
      }
    }
  }
  
  // Estrategia 3: Dividir el dominio en puntos
  const domainParts = domain.split('.');
  if (domainParts.length > 1) {
    const firstDomainPart = domainParts[0];
    const restDomain = domainParts.slice(1).join('.');
    
    // Intentar dividir después del primer punto del dominio
    const firstLine = `${username}@${firstDomainPart}`;
    const secondLine = restDomain;
    
    if (firstLine.length <= maxCharsPerLine && secondLine.length <= maxCharsPerLine) {
      return {
        needsBreak: true,
        firstLine,
        secondLine
      };
    }
    
    // Si aún es muy largo, dividir más agresivamente
    let currentFirstLine = `${username}@`;
    let currentSecondLine = '';
    
    for (let i = 0; i < domainParts.length; i++) {
      const part = domainParts[i];
      const testFirstLine = `${currentFirstLine}${part}`;
      
      if (testFirstLine.length <= maxCharsPerLine) {
        currentFirstLine = testFirstLine;
      } else {
        // Poner el resto en la segunda línea
        const remainingParts = domainParts.slice(i);
        currentSecondLine = remainingParts.join('.');
        break;
      }
    }
    
    if (currentSecondLine) {
      return {
        needsBreak: true,
        firstLine: currentFirstLine,
        secondLine: currentSecondLine
      };
    }
  }
  
  // Estrategia 4: Si todo falla, truncar
  return {
    needsBreak: false,
    firstLine: email.substring(0, maxCharsPerLine - 3) + '...'
  };
};

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
 * Resultado del formateo de nombre para display en sidebar
 */
export interface NameFormatResult {
  needsBreak: boolean;
  firstLine: string;
  secondLine?: string;
}

/**
 * Formatea un nombre para mostrar de forma compacta en el sidebar
 * Maneja nombres muy largos dividiéndolos inteligentemente
 * 
 * @param name - El nombre a formatear
 * @param maxCharsPerLine - Máximo de caracteres por línea (default: 16)
 * @returns Objeto con la información del nombre formateado
 */
export const formatNameForSidebar = (name: string, maxCharsPerLine: number = 28): NameFormatResult => {
  if (name.length <= maxCharsPerLine) {
    return {
      needsBreak: false,
      firstLine: name
    };
  }
  
  // Dividir en palabras
  const words = name.split(' ');
  
  if (words.length === 1) {
    // Si es una sola palabra muy larga, truncar
    return {
      needsBreak: false,
      firstLine: name.substring(0, maxCharsPerLine - 3) + '...'
    };
  }
  
  // Solo dividir si hay una palabra claramente más corta que la otra
  if (words.length === 2) {
    const [first, second] = words;
    // Solo dividir si una palabra es significativamente más corta
    if (first.length <= maxCharsPerLine && second.length <= maxCharsPerLine && 
        (first.length <= 8 || second.length <= 8)) {
      return {
        needsBreak: true,
        firstLine: first,
        secondLine: second
      };
    }
    // Si ambas palabras son largas, truncar en lugar de dividir
    return {
      needsBreak: false,
      firstLine: name.substring(0, maxCharsPerLine - 3) + '...'
    };
  }
  
  // Para más de 2 palabras, usar la lógica anterior
  let firstLine = '';
  let secondLine = '';
  let currentLine = 1;
  
  for (const word of words) {
    const testLine = currentLine === 1 ? firstLine : secondLine;
    const testWithWord = testLine ? `${testLine} ${word}` : word;
    
    if (testWithWord.length <= maxCharsPerLine) {
      if (currentLine === 1) {
        firstLine = testWithWord;
      } else {
        secondLine = testWithWord;
      }
    } else {
      if (currentLine === 1) {
        currentLine = 2;
        secondLine = word;
      } else {
        secondLine = testWithWord.substring(0, maxCharsPerLine - 3) + '...';
        break;
      }
    }
  }
  
  return {
    needsBreak: secondLine.length > 0,
    firstLine,
    secondLine: secondLine || undefined
  };
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
