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

// Funciones auxiliares para reducir complejidad
function splitEmailByAt(email: string, maxCharsPerLine: number): EmailFormatResult | null {
  const parts = email.split('@');
  if (parts.length !== 2) return null;
  
  const [username, domain] = parts;
  const usernameWithAt = `${username}@`;
  
  if (usernameWithAt.length <= maxCharsPerLine && domain.length <= maxCharsPerLine) {
    return {
      needsBreak: true,
      firstLine: usernameWithAt,
      secondLine: domain
    };
  }
  
  return null;
}

function splitLongUsername(username: string, domain: string, maxCharsPerLine: number): EmailFormatResult | null {
  if (username.length <= maxCharsPerLine) return null;
  
  const usernameParts = username.split('.');
  if (usernameParts.length <= 1) return null;
  
  const firstPart = usernameParts[0];
  const restParts = usernameParts.slice(1);
  
  if (firstPart.length + 1 <= maxCharsPerLine) {
    return {
      needsBreak: true,
      firstLine: `${firstPart}.`,
      secondLine: `${restParts.join('.')}@${domain}`
    };
  }
  
  let firstLine = '';
  let secondLine = '';
  
  for (let i = 0; i < usernameParts.length; i++) {
    const part = usernameParts[i];
    const testFirstLine = firstLine ? `${firstLine}.${part}` : part;
    
    if (testFirstLine.length <= maxCharsPerLine) {
      firstLine = testFirstLine;
    } else {
      const remainingParts = usernameParts.slice(i);
      secondLine = `${remainingParts.join('.')}@${domain}`;
      break;
    }
  }
  
  return secondLine ? {
    needsBreak: true,
    firstLine,
    secondLine
  } : null;
}

function splitLongDomain(username: string, domain: string, maxCharsPerLine: number): EmailFormatResult | null {
  const domainParts = domain.split('.');
  if (domainParts.length <= 1) return null;
  
  const firstDomainPart = domainParts[0];
  const restDomain = domainParts.slice(1).join('.');
  const firstLine = `${username}@${firstDomainPart}`;
  
  if (firstLine.length <= maxCharsPerLine && restDomain.length <= maxCharsPerLine) {
    return {
      needsBreak: true,
      firstLine,
      secondLine: restDomain
    };
  }
  
  let currentFirstLine = `${username}@`;
  let currentSecondLine = '';
  
  for (let i = 0; i < domainParts.length; i++) {
    const part = domainParts[i];
    const testFirstLine = `${currentFirstLine}${part}`;
    
    if (testFirstLine.length <= maxCharsPerLine) {
      currentFirstLine = testFirstLine;
    } else {
      const remainingParts = domainParts.slice(i);
      currentSecondLine = remainingParts.join('.');
      break;
    }
  }
  
  return currentSecondLine ? {
    needsBreak: true,
    firstLine: currentFirstLine,
    secondLine: currentSecondLine
  } : null;
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
  if (email.length <= maxCharsPerLine) {
    return {
      needsBreak: false,
      firstLine: email
    };
  }
  
  const parts = email.split('@');
  if (parts.length !== 2) {
    return {
      needsBreak: false,
      firstLine: email
    };
  }
  
  const [username, domain] = parts;
  
  // Estrategia 1: Dividir después del @
  const result1 = splitEmailByAt(email, maxCharsPerLine);
  if (result1) return result1;
  
  // Estrategia 2: Dividir username largo
  const result2 = splitLongUsername(username, domain, maxCharsPerLine);
  if (result2) return result2;
  
  // Estrategia 3: Dividir dominio largo
  const result3 = splitLongDomain(username, domain, maxCharsPerLine);
  if (result3) return result3;
  
  // Fallback: Truncar si todas las estrategias fallan
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

// Funciones auxiliares para formatear nombres
function handleSingleWordName(name: string, maxCharsPerLine: number): NameFormatResult {
  return {
    needsBreak: false,
    firstLine: name.substring(0, maxCharsPerLine - 3) + '...'
  };
}

function handleTwoWordName(words: string[], maxCharsPerLine: number): NameFormatResult {
  const [first, second] = words;
  const canSplit = first.length <= maxCharsPerLine && 
                   second.length <= maxCharsPerLine && 
                   (first.length <= 8 || second.length <= 8);
  
  if (canSplit) {
    return {
      needsBreak: true,
      firstLine: first,
      secondLine: second
    };
  }
  
  return {
    needsBreak: false,
    firstLine: `${first} ${second}`.substring(0, maxCharsPerLine - 3) + '...'
  };
}

function distributeWordsToLines(words: string[], maxCharsPerLine: number): NameFormatResult {
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
    } else if (currentLine === 1) {
      currentLine = 2;
      secondLine = word;
    } else {
      secondLine = testWithWord.substring(0, maxCharsPerLine - 3) + '...';
      break;
    }
  }
  
  return {
    needsBreak: secondLine.length > 0,
    firstLine,
    secondLine: secondLine || undefined
  };
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
  
  const words = name.split(' ');
  
  if (words.length === 1) {
    return handleSingleWordName(name, maxCharsPerLine);
  }
  
  if (words.length === 2) {
    return handleTwoWordName(words, maxCharsPerLine);
  }
  
  return distributeWordsToLines(words, maxCharsPerLine);
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
