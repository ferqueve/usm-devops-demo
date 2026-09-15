/** Mensaje de "no hay nada" dentro de un panel de estadísticas. */
export function Vacio({ texto = 'Sin datos en el período.' }: Readonly<{ texto?: string }>) {
  return <p className="py-8 text-center text-sm text-muted-foreground">{texto}</p>;
}
