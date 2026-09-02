// ============================================================================
// Tipos para el dashboard de Sostenibilidad (métricas derivadas)
// ============================================================================

export interface AhorroPorMes {
  mes: string; // formato "YYYY-MM"
  hojas: number;
}

export interface RankingItem {
  nombre: string;
  hojas: number;
  recursos: number;
  papelKg: number;
  co2Kg: number;
  deltaPct?: number;
}

export interface SostenibilidadRanking {
  carreras: RankingItem[];
  docentes: RankingItem[];
  comparativa: { mesActual: number; mesAnterior: number; deltaPct: number };
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
