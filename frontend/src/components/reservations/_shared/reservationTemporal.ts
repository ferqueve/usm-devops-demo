// Devuelve flags temporales (esFutura/esPasada) usados para resaltar reservas en las listas.
export function getReservaTemporal(inicio: string): { esFutura: boolean; esPasada: boolean } {
  const esFutura = new Date(inicio) > new Date();
  return { esFutura, esPasada: !esFutura };
}
