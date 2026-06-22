// ============================================================================
// Tipos para el dashboard de Sostenibilidad (métricas derivadas)
// ============================================================================

export interface AhorroPorMes {
  mes: string; // formato "YYYY-MM"
  hojas: number;
}

export interface SostenibilidadStats {
  hojasEvitadas: number;
  papelAhorradoKg: number;
  co2EvitadoKg: number;
  aguaAhorradaL: number;
  recursosDigitalesTotales: number;
  recursosArchivo: number;
  recursosEnlace: number;
  arbolesSalvados: number;
  kmAutoEquivalente: number;
  ahorroPorMes: AhorroPorMes[];
}
