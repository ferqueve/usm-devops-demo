import { cva } from "class-variance-authority"

export /*
 * Sin `dark:bg-destructive/60`.
 *
 * shadcn baja el destructivo al 60 % de opacidad en modo oscuro porque su rojo
 * por defecto es muy brillante. El nuestro ya está calculado para ese fondo
 * —mismo tono de marca, con la luz y el croma que le corresponden ahí—, así
 * que esa capa de transparencia sólo lo lavaba: quedaba una pastilla apagada
 * al lado de una StatusBadge del mismo rojo a color pleno.
 */
const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-md border px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-[color,box-shadow] overflow-hidden",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground [a&]:hover:bg-primary/90",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground [a&]:hover:bg-secondary/90",
        destructive:
          "border-transparent bg-destructive text-white [a&]:hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40",
        outline:
          "text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)
