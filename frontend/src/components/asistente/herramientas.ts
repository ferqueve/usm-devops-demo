import {
  BarChart3, Boxes, Building2, CalendarClock, CalendarDays, DoorOpen, GraduationCap, ListChecks,
  Search, Trophy, Wrench, type LucideIcon,
} from 'lucide-react';

/**
 * Nombre legible de cada tool del chatbot (ai/tools.py). El usuario ve qué
 * consultó la IA para responder, sin exponer el nombre técnico.
 */
export const HERRAMIENTAS: Record<string, { label: string; icon: LucideIcon }> = {
  obtener_fecha_actual: { label: 'Fecha de hoy', icon: CalendarDays },
  buscar_mis_reservas: { label: 'Tus reservas', icon: CalendarClock },
  buscar_espacios_disponibles: { label: 'Espacios libres', icon: DoorOpen },
  buscar_espacio_semantico: { label: 'Búsqueda de espacios', icon: Search },
  detalle_espacio: { label: 'Detalle del espacio', icon: DoorOpen },
  listar_inventario_de_espacio: { label: 'Equipamiento', icon: Boxes },
  listar_edificios: { label: 'Edificios', icon: Building2 },
  listar_carreras: { label: 'Carreras', icon: GraduationCap },
  obtener_estadistica_global: { label: 'Estadísticas', icon: BarChart3 },
  buscar_reservas_globales: { label: 'Reservas del sistema', icon: ListChecks },
  top_usuarios_reservadores: { label: 'Ranking de uso', icon: Trophy },
  buscar_inventario_global: { label: 'Inventario', icon: Boxes },
  items_en_mantenimiento: { label: 'Mantenimiento', icon: Wrench },
};

export function herramienta(nombre: string) {
  return HERRAMIENTAS[nombre] ?? { label: nombre.replaceAll('_', ' '), icon: Search };
}
