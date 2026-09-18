import { cva } from "class-variance-authority"

/**
 * Deshabilitado no es «lo mismo pero translúcido».
 *
 * Con `opacity-50` un botón primario queda azul claro y se sigue leyendo como
 * algo que se puede apretar; en la página /ui, al lado de Chico/Normal/Grande,
 * parecía un cuarto tamaño. Pasa a la superficie apagada, sin sombra: deja de
 * parecer un control disponible.
 */
/*
 * Sin `dark:bg-destructive/60`.
 *
 * shadcn baja el destructivo al 60 % de opacidad en modo oscuro porque su rojo
 * por defecto es muy brillante. El nuestro ya está calculado para ese fondo
 * —mismo tono de marca, con la luz y el croma que le corresponden ahí—, así
 * que esa capa de transparencia sólo lo lavaba: quedaba una pastilla apagada
 * al lado de una StatusBadge del mismo rojo a color pleno.
 */
export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:bg-muted disabled:text-muted-foreground disabled:border-transparent disabled:shadow-none [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-xs hover:bg-primary/90",
        destructive:
          "bg-destructive text-white shadow-xs hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40",
        outline:
          "border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50",
        secondary:
          "bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary/80",
        ghost:
          "hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50",
        link: "text-primary underline-offset-4 hover:underline",
      },
      /*
       * Una sola escala de alto para todos los controles:
       *   sm 32 · normal 36 · lg 40
       *
       * Estaba desparejo y se notaba: el botón medía 32, el input 36, el
       * toggle 36 y una pestaña 29. Cuatro alturas para cosas que se apoyan
       * una al lado de la otra en una barra de filtros, con lo que ninguna
       * fila quedaba alineada y todo se sentía apretado. El input ya estaba
       * en 36, así que es el que manda.
       */
      size: {
        default: "h-9 px-3.5 py-2 has-[>svg]:px-3",
        sm: "h-8 rounded-md gap-1 px-2.5 has-[>svg]:px-2",
        lg: "h-10 rounded-md px-5 has-[>svg]:px-4",
        icon: "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)
