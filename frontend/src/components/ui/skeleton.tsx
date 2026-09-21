import { cn } from "@/lib/utils/helpers"

/**
 * El bloque gris que ocupa el lugar de algo que todavía no llegó.
 *
 * Estaba escrito a mano 22 veces —`animate-pulse rounded-xl bg-muted`— con
 * esta primitiva al lado sin usar, y en otro gris: `bg-accent`. Tres tonos
 * distintos para el mismo hueco. Queda `muted`, que es el de los 22 y el que
 * sigue a `card` en la escala de superficies.
 *
 * El alto y el radio los pone quien lo usa: un hueco de tarjeta y uno de
 * renglón no se redondean igual.
 */
function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      aria-hidden
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  )
}

export { Skeleton }
