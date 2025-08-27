// Paleta cromática UTEC
// Regla: El color principal es el cian (#00A9E0). Negro y blanco son institucionales.
// Cada departamento tiene un color propio (TI, Innovación, Mecatrónica, Alimentos, Sostenibilidad).

export const UTEC_COLORS = {
  // Color principal institucional
  PRIMARY: '#00A9E0',
  
  // Colores institucionales
  BLACK: '#000000',
  WHITE: '#FFFFFF',
  
  // Colores por departamento
  DEPARTMENTS: {
    TI: '#184897',
    INNOVATION: '#86BB4C',
    MECHATRONICS: '#F6CA21',
    FOOD: '#DF2B31',
    SUSTAINABILITY: '#DE7A27',
  },
} as const;

// Nombres de colores para uso en Tailwind
export const TAILWIND_COLORS = {
  primary: UTEC_COLORS.PRIMARY,
  black: UTEC_COLORS.BLACK,
  white: UTEC_COLORS.WHITE,
  ti: UTEC_COLORS.DEPARTMENTS.TI,
  innovation: UTEC_COLORS.DEPARTMENTS.INNOVATION,
  mechatronics: UTEC_COLORS.DEPARTMENTS.MECHATRONICS,
  food: UTEC_COLORS.DEPARTMENTS.FOOD,
  sustainability: UTEC_COLORS.DEPARTMENTS.SUSTAINABILITY,
} as const;
