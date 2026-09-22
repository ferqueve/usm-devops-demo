# Base visual de USM

Las reglas que gobiernan cómo se ve el sistema, por qué, y dónde tocarlas.

**La pantalla manda sobre este documento.** Todo lo que está acá se puede ver
funcionando en `/ui` (sólo en desarrollo). Si el texto y la pantalla no
coinciden, la pantalla tiene razón y este archivo está viejo.

---

## Dónde vive cada cosa

| Qué | Dónde |
|---|---|
| Tokens del tema: color, tipografía, radio, elevación | `frontend/src/index.css` |
| Paleta de marca y cálculo de derivados | `frontend/src/lib/design/paleta.ts` |
| Catálogo de componentes | `frontend/src/app/ui/` → `localhost:5173/ui` |
| Inventario de cobertura | `frontend/scripts/inventario-ui.mjs` |
| Manual de marca UTEC 2.1 | `documentation/marca/` |

---

## Color

### Los seis de la marca no se tocan

Salen del Manual de Identidad Visual 2.1 (A.4) y cada uno nombra un
departamento:

| hex | departamento |
|---|---|
| `#184897` | Tecnologías de la Información |
| `#86bb4c` | Sostenibilidad Ambiental |
| `#F6CA21` | Innovación y Emprendimientos |
| `#DE7A27` | Alimentos |
| `#DF2B31` | Mecatrónica, Logística y Biomédica |
| `#00c7ff` | cian, el centro del isotipo |

No son un semáforo ni una paleta decorativa. Van donde el dato habla de una
carrera, una materia, una tutoría o un evento. En una métrica de operación el
color no significa nada, y ahí es decoración de la casa.

### Nunca escribir un color a mano

Ni un hex, ni `bg-blue-500`, ni `text-gray-600`. Todo sale de un token o de
`lib/design/paleta`. Si hace falta un color que no existe, se agrega al tema;
no se escribe en el componente.

Las únicas excepciones son los patrones decorativos de fondo y los afiches de
evento, donde el color **es** el dibujo y no un rol.

### Los cinco roles

Cada uno tiene cuatro piezas:

```
bg-danger-suave      fondo tenue
border-danger-borde  su borde
bg-danger            relleno macizo
text-danger-texto    texto que se lee encima del tenue
```

Roles: `info` · `success` · `warning` · `danger` · `acento`.

`acento` (cian) es para cuando hace falta **otra categoría** y no un estado: el
rol ADMIN, un chip de filtro, un tile.

### El relleno macizo no cambia con el tema

Un bloque con su propio texto sólo tiene que separarse de la tarjeta, y el hex
de marca ya lo hace. Aclararlo "para compensar el fondo oscuro" lo único que
logra es romper el contraste del texto: así el botón Eliminar quedó una vez en
3,17:1.

Lo que **sí** cambia por tema son las líneas finas de gráfico, los fondos
tenues, los bordes y el texto — todo lo que vive contra el fondo.

### Relleno y texto son dos familias distintas

`--color-utec-*` son los hexes exactos del manual. Sirven para **rellenar**:
un bloque macizo, una barra, un punto de leyenda.

Como **color de texto** no sirven. El azul `#184897` sobre una tarjeta oscura
da 1,32:1. Para texto e íconos está la otra familia, que sí cambia con el
tema:

```
text-marca-azul-texto      text-marca-naranja-texto
text-marca-verde-texto     text-marca-rojo-texto
text-marca-amarillo-texto  text-marca-cian-texto
```

Las lightness salen de bajar o subir la luz hasta pasar 4,7:1 contra el fondo
de página, medido. No se eligieron a ojo.

Y `text-marca-tinta` es la tinta que se lee **encima** de un relleno de marca.
No cambia con el tema, porque el relleno tampoco.

Sobre una superficie que es oscura en los dos temas —`chrome`, el visor de
logs, la tarjeta de servicios— tampoco sirven `marca-*-texto`: en tema claro
son los tonos oscuros y ahí dan 2,2:1. Para eso están `text-alerta-en-oscuro`
y `text-ok-en-oscuro`.

### La opacidad no es una forma de bajar el tono

`text-muted-foreground/50` a 11 px da 2,09:1. El token ya es el tono bajo; la
opacidad encima lo saca del mínimo. Eran 500 de los 591 textos que no
llegaban.

En una celda de color pasa lo mismo: el pie de un tile en blanco al 75% sobre
rojo da 2,89:1, y ni al 90% llega. La jerarquía la dan el tamaño y el peso
—28 px semibold contra 13 px normal—, que ya son bien distintos.

No usar los roles —`text-success-texto`, `text-danger-texto`— para esto: esos
significan algo. El color de marca acá es la paleta de la casa, no un estado.

### Elegir la tinta midiendo, no a ojo

Sobre el verde de marca, el blanco da **2,28:1**. Parece que va; no va.

```ts
import { tintaSobre, contraste } from '@/lib/design/paleta';
tintaSobre('#86bb4c')          // el que gana
contraste('#86bb4c', '#fff')   // 2.28
```

Referencias: **4,5:1** para texto normal, **3:1** para texto grande o para un
elemento de interfaz que hay que poder distinguir del fondo.

### Superficies

De la más honda a la más alta, y cada una tiene que separarse de la de al lado:

```
background < card < muted < secondary < accent
chrome      la banda oscura: cabeceras de tabla, encabezados de panel
sidebar     la barra lateral
```

Esto ya se rompió dos veces por tenerlas en el mismo valor: el esqueleto de
carga quedaba invisible y una pastilla `secondary` desaparecía contra la
página. Al mover una, verificar las vecinas en `/ui#paleta`.

---

## Tipografía

Gilroy es la oficial para web según el manual (A.9), y **Poppins es el fallback
que el manual mismo prevé** cuando Gilroy no se puede usar. Gilroy es comercial
y no está en Google Fonts: hay que licenciarla y servirla desde `/fonts`. Está
declarada en la pila, así que el día que se suba el archivo entra sola.

No proponer otra tipografía.

### La escala

| clase | tamaño | para qué |
|---|---|---|
| `text-2xs` | 11 px | el piso. Etiquetas mínimas. |
| `text-xs` | 13 px | dato secundario, pies, badges |
| `text-sm` | 14 px | **el cuerpo de la interfaz** |
| `text-base` | 16 px | texto de lectura |
| `text-lg` a `text-3xl` | | títulos |

**Nada por debajo de 11 px, y nunca un tamaño arbitrario.** La aplicación llegó
a tener 917 de 1345 usos de texto en 12 px o menos, con nueve, diez, once, doce
y trece conviviendo. Es una herramienta donde se pasan horas leyendo tablas.

`text-xs` con `text-muted-foreground` es chico y de poco contraste a la vez.
Usar la combinación con criterio.

---

## Densidad

Una sola escala de alto para todo lo que se pueda apretar:

| | alto |
|---|---|
| `sm` | 32 px |
| normal | **36 px** |
| `lg` | 40 px |

El input manda: ya estaba en 36. Botón, toggle y select lo acompañan; si no,
nada queda alineado en una barra de filtros.

Las celdas de tabla van en `0.625rem 0.75rem`, que deja filas de ~44 px. Es el
mínimo cómodo para apuntar y para leer una tabla largo rato.

---

## Elevación

`shadow-2xs` a `shadow-2xl`, desde el tema. En claro van teñidas con la tinta
(33 37 41) y no con negro puro, que sobre grises fríos ensucia. En oscuro
llevan más opacidad **más un filo claro arriba**, que es lo que de verdad
despega una superficie cuando el fondo ya es oscuro.

`shadow-card` y `hover-lift` son alias históricos que ahora salen de la escala.

---

## Radio

Cuanto más grande la superficie, más radio. Un input y una tarjeta no se
redondean igual.

```
rounded-sm   control      rounded-lg   tarjeta
rounded-md   botón        rounded-xl   panel
```

---

## Modo oscuro

Funciona con `@theme inline`. Sin `inline`, `--color-background:
var(--background)` se resuelve una vez en `:root` y los hijos heredan el valor
ya calculado: un `.dark` anidado redefine la variable y nadie la vuelve a leer.
Con `inline` Tailwind la sustituye donde se usa.

Eso es lo que permite que `/ui` muestre los dos temas al mismo tiempo.

**Los gráficos son la excepción.** Eligen su paleta en JavaScript, no en CSS,
así que un contenedor `.dark` anidado no los alcanza. Para acotarles el tema:

```tsx
<TemaGraficosContexto.Provider value="oscuro">
```

Sin contexto caen en el tema global, que es lo que quieren las pantallas
normales.

---

## Cuando no hay nada que mostrar

Son tres estados, no uno: **cargando**, **error** y **vacío**. Los tres viven
en `components/common/EstadoCarga` y se ven en `/ui#estados`.

El que faltaba era el del error. El patrón que había era `.catch(() => {})`
seguido de `if (!datos) return null`: cuando la llamada fallaba, el bloque
desaparecía de la pantalla. Quien lo miraba no veía un error, veía que la
sección no existía. `StatsListWidget` lo tenía incluso escrito en su propio
comentario —«consumer may want to render a fallback at a higher level»— y
ninguno de sus dos consumidores lo hacía.

**Un bloque que no puede mostrar lo suyo tiene que decirlo y dejar
reintentar.** Vacío y error no son lo mismo: «no hay solicitudes» y «no
pudimos traer las solicitudes» llevan a decisiones distintas.

```tsx
<EstadoCarga
  cargando={cargando}
  error={error}
  alReintentar={cargar}
  vacio={!datos}
  textoVacio="Sin solicitudes en este período."
>
  {…}
</EstadoCarga>
```

Quedan 33 `catch` que se comen el error en 20 archivos. Algunos son
legítimos —portapapeles, `localStorage`, generar un QR—; los que envuelven
una llamada de datos no lo son.

---

## El catálogo

`localhost:5173/ui`, sólo en desarrollo.

Están **los 108 componentes que pueden montarse sin backend**. Lo que queda
fuera tiene el motivo escrito: pide datos, es una ruta entera, es estructura, o
es una primitiva de shadcn sin cambios propios.

```bash
node scripts/inventario-ui.mjs   # recalcula la cobertura
node scripts/muerto.mjs          # qué no importa nadie
```

`muerto.mjs` separa tres casos, porque no significan lo mismo: lo que **sólo
usa el catálogo** —existe, se ve en `/ui`, y ninguna pantalla lo usa—, lo que
**sólo usan los tests** —el módulo y su test se sostienen mutuamente— y lo que
**no importa nadie**. El primero es el más engañoso: parece vivo porque se
puede mirar. Un barrel muerto esconde a sus hijos, así que después de borrar
conviene volver a correrlo.

La cobertura no se anota a mano: el script lee qué importan las secciones de
`/ui`. Si se agrega una pantalla y no se pone en el catálogo, aparece como
pendiente sola.

### Reglas del catálogo

**Los datos de muestra van tipados.** Un `as never` calla al compilador y el
error aparece recién en el navegador, con la página en blanco. Ya pasó con el
log de auditoría, que tenía tres campos inventados. El `as never` queda sólo
donde el componente muestra dos campos de un tipo enorme.

**Los datos imitan un sistema con algo mal**: un servicio caído, cola
acumulada, un 500 en la traza. El estado sano no muestra cómo se ve una alerta,
que es justo lo que hay que poder revisar.

---

## Sobre shadcn

No es una dependencia: es código propio en `components/ui`. Tocarlo es el flujo
previsto, no una señal de que falle. Quedan 39 primitivas y las usan 151 de
los 379 archivos de `src`.

Se borraron 22 que no usaba nadie —acordeón, carrusel, menubar, formulario,
OTP…— y con ellas 26 dependencias. Venían de instalar shadcn entero, no de
haberlas necesitado.

Lo que sí es dependencia es **Radix**, que hace la parte difícil: foco atrapado
en un modal, navegación por teclado, `aria-*`, portales, cerrar con Escape,
devolver el foco al disparador. Eso no se rehace.

Cuando shadcn trae una decisión ajena —`opacity-50` en deshabilitado,
`dark:bg-destructive/60`— se corrige una vez en el variant y baja a toda la
aplicación.

---

## Antes de dar algo por terminado

- [ ] ¿Se ve en `/ui`, en los dos temas?
- [ ] ¿Algún color escrito a mano? No debería haber ninguno.
- [ ] ¿El contraste del texto sobre su fondo llega a 4,5:1? Medirlo.
- [ ] ¿Tiene estado vacío, de carga y de error?
- [ ] ¿El foco se ve al recorrer con Tab?
- [ ] `node scripts/contraste.mjs` — no debería sumar grupos nuevos
- [ ] `npx tsc --noEmit` · `npx eslint` · `npx vitest run`

---

## Medir el contraste, no confiar en la clase

```bash
node scripts/contraste.mjs          # lo que no llega al mínimo
node scripts/contraste.mjs --todo   # además, lo que pasa raspando
```

Abre `/ui`, lee el color que el navegador resolvió para cada texto y el fondo
real que tiene debajo —apilando las capas translúcidas, y leyendo el `fill`
del `<rect>` de al lado cuando es un SVG— y calcula el ratio.

Una clase puede estar bien escrita y fallar igual por el fondo que le tocó.
Así aparecieron el visor de logs —`text-foreground` sobre `bg-chrome`, que es
oscuro fijo: 1,14:1 en tema claro—, una tarjeta con `bg-white/95` que en
oscuro se quedaba blanca con el texto claro encima, y 143 usos de un color de
marca como color de texto.
