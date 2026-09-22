# Ficha técnica · Sistema de Diseño UI

> **Las reglas de trabajo viven en [`documentation/ui/README.md`](../ui/README.md)**
> y el catálogo funcionando en `localhost:5173/ui`. Esta ficha describe la
> arquitectura para el lector técnico; aquel documento dice cómo se usa y por
> qué cada decisión es la que es. Si los dos dicen cosas distintas, manda el
> otro.

## 1. Resumen ejecutivo

UTEC Space Manager utiliza un sistema de diseño propio construido sobre **Tailwind CSS v4** y **shadcn/ui** (estilo "new-york"), con tokens corporativos UTEC integrados al tema. El objetivo es ofrecer una experiencia visual coherente, accesible y rápida de iterar: micro-interacciones suaves, tipografía propia, paleta corporativa y un set de componentes reutilizables que estandarizan la presentación de información (avatars, badges de estado, métricas, anillos de progreso, barras de filtros, estados vacíos).

La configuración de tema vive **dentro del CSS** (no hay archivo `tailwind.config.*`): Tailwind v4 utiliza la directiva `@theme` en `frontend/src/index.css`. Esto simplifica la cadena de configuración y permite versionar el diseño como código.

---

## 2. Cómo se usa

Quien desarrolla un componente nuevo en el frontend tiene tres recursos a disposición:

1. **shadcn/ui** para componentes base (Button, Dialog, Tabs, Form, etc.). Configurado con estilo `new-york`.
2. **Componentes propios** ubicados en `frontend/src/components/ui/` (ver §3.4) que cubren patrones recurrentes: avatares con iniciales, badges de estado, cards de métrica, anillos de progreso, barras de filtros activos, estados vacíos.
3. **Utilidades CSS** definidas en `frontend/src/index.css` con la paleta UTEC y un set acotado de animaciones y efectos.

Convenciones:

- Los archivos en `components/ui/` son nombrados en kebab-case (`status-badge.tsx`).
- La función `cn(...)` para combinar clases vive en `frontend/src/lib/utils/helpers.ts`. Importar siempre desde `@/lib/utils/helpers`.
- Los componentes usan TypeScript con tipos estrictos. Las props se documentan en línea con JSDoc cuando ayuda.

---

## 3. Detalle técnico

### 3.1 Stack y dependencias

| Dependencia | Versión declarada | Función |
|---|---|---|
| `react` | ^19.1.1 | Biblioteca UI. |
| `tailwindcss` | ^4.1.12 | Sistema de utilidades CSS. |
| `@tailwindcss/vite` | ^4.1.12 | Plugin oficial de Tailwind v4 para Vite. |
| `tw-animate-css` | ^1.3.7 (dev) | Animaciones extra ya integradas con Tailwind. |
| `lucide-react` | ^0.542.0 | Iconografía. |
| `next-themes` | ^0.4.6 | Modo oscuro (ver §3.10). |
| `@photo-sphere-viewer/core` | ^5.14.1 | Visor de imágenes 360° equirectangulares (ver §3.11). |
| `three` | ^0.184.0 | Motor WebGL que usa el visor 360° (dependencia transitiva de photo-sphere-viewer). |
| `class-variance-authority`, `clsx`, `tailwind-merge` | (vía shadcn) | Helpers para variantes y combinación de clases. |

`frontend/components.json` configura shadcn/ui con `style: "new-york"` y aliases.

### 3.2 Tokens de tema (en `frontend/src/index.css`)

Tailwind v4 no usa `tailwind.config.*`: la configuración vive en la directiva
`@theme` del CSS. El archivo está organizado en este orden:

1. Import de fuentes y `@font-face` de la fuente corporativa UTEC.
2. `@theme inline` — todo lo que Tailwind expone como utilidad: colores,
   escala tipográfica, radios, elevación. El `inline` es necesario para que el
   modo oscuro funcione en cualquier parte del árbol y no sólo en el `<html>`.
3. `:root` y `.dark` — los valores de cada token, en OKLCH.
4. `@layer base` — escala tipográfica aplicada, foco visible, cifras tabulares.
5. `@layer utilities` — utilidades propias del proyecto (ver §3.5).

Los grupos de tokens son: superficies (`background`, `card`, `muted`,
`secondary`, `accent`, `chrome`, `sidebar`), roles semánticos (`info`,
`success`, `warning`, `danger`, `acento`, con cuatro piezas cada uno),
tipografía (`--text-2xs` a `--text-3xl` con su altura de línea), radio y
elevación.

La escala tipográfica y la de elevación están **declaradas**, no heredadas de
Tailwind. El detalle y el porqué, en la guía de la base visual.

### 3.3 Paleta corporativa UTEC

Los seis hex salen del Manual de Identidad Visual 2.1 (A.4), guardado en
`documentation/marca/`. **Cinco de ellos nombran un departamento**; no son un
semáforo ni una paleta decorativa:

| Color | Hex | Qué nombra |
|---|---|---|
| Azul | `#184897` | Departamento de Tecnologías de la Información |
| Verde | `#86bb4c` | Departamento de Sostenibilidad Ambiental |
| Amarillo | `#F6CA21` | Departamento de Innovación y Emprendimientos |
| Naranja | `#DE7A27` | Departamento de Alimentos |
| Rojo | `#DF2B31` | Departamento de Mecatrónica, Logística y Biomédica |
| Cian | `#00c7ff` | Color principal del sistema, centro del isotipo |
| Gris oscuro | `#343a40` | Bandas y barra lateral (`--chrome`, `--sidebar`) |

Todo lo demás se **deriva por cálculo** en `frontend/src/lib/design/paleta.ts`,
que es la única fuente: variantes de gráfico por tema, escalas por categoría y
medición de contraste. Ningún color se escribe a mano en un componente.

### 3.4 Componentes propios (`frontend/src/components/ui/`)

Componentes destacados que extienden shadcn/ui:

| Componente | Función |
|---|---|
| `avatar-initials.tsx` | Avatar con iniciales generadas a partir del nombre, con color derivado por hash. |
| `status-badge.tsx` | Badge de estado con icono e indicador de pulso opcional. |
| `metric-card.tsx` | Card especializada para métricas, con tendencia y barra de progreso. |
| `progress-ring.tsx` | Anillo de progreso circular animado. |
| `filter-bar.tsx` | Barra compacta de filtros activos como pills removibles. |
| `empty-state.tsx` | Componente para estados vacíos con icono, título, descripción y acción. |
| `combobox.tsx`, `date-picker.tsx`, `time-select.tsx` | Selects especializados. |
| `http-trace-table.tsx`, `liquibase-timeline.tsx`, `log-viewer.tsx`, `metrics-chart.tsx` | Componentes específicos del panel de Sistema. |

Cada uno se importa desde su path en `@/components/ui/...`.

### 3.5 Utilidades CSS reales

Definidas en el `@layer utilities` de `index.css`:

**Sombras y hover**

- `.shadow-card` — sombra base de cards (ya incluye estado hover).
- `.hover-lift` — eleva el elemento con sombra al pasar el cursor.

**Tipografía**

- `.font-utec` — aplica la fuente corporativa.

**Animaciones propias**

- `.animate-fade-in-up`, `.animate-fade-in-up-small`, `.animate-fade-in-up-small-fast`
- `.animate-stagger-children` y `.animate-stagger-children-fast` (para listas de hijos)
- `.animate-spin-once` — gira una sola vez.
- `.animate-utec-rotating-gradient` — gradiente UTEC rotante (loaders y backgrounds).

**Sidebar y secciones**

- `.sidebar-menu-item` (con estados `:hover` y `.active`).
- `.section-separator`, `.section-title`.

**Logs (panel Sistema)**

- `.log-line`, `.log-error`, `.log-warn`.

**Paleta**

- `.text-utec-*`, `.bg-utec-*`, `.border-utec-*` (ver §3.3).

> Animaciones extra (`fade`, `slide`, `scale`, etc.) **se obtienen vía `tw-animate-css`**. No están definidas como clases propias del proyecto sino que las provee la dependencia.

### 3.6 Estructura del módulo Sistema

El panel de Sistema es uno de los lugares con más concentración de UI personalizada. Su estructura interna:

- `frontend/src/components/system/SystemHeader.tsx` — encabezado con switch de auto-refresh.
- `frontend/src/components/system/tabs/` — tabs lazy-loaded (`OverviewTab`, `PerformanceTab`, `ActivityTab`, `DatabaseLogsTab`).
- `frontend/src/components/system/sections/` — bloques reutilizables (`MetricsCards`, `JvmCharts`, `JvmDetailsTable`, `DatabaseSection`, `EndpointsSection`, `HttpTraceSection`, `LogsSection`, `ActiveUsersCard`, `AppInfoCard`).

### 3.7 Layouts

- `frontend/src/components/layouts/DashboardLayout/`:
  - `DashboardLayout.tsx` — contenedor principal autenticado.
  - `DashboardSidebar.tsx` — navegación lateral.
  - `DashboardHeader.tsx` — header superior. Aloja el toggle de tema (ver §3.10).
- `frontend/src/components/layouts/AuthLayout/`:
  - `AuthSidePanel.tsx` — panel lateral de la pantalla de login. Fondo oscuro de marca con formas geométricas planas en los colores UTEC (§3.3) que flotan solas y reaccionan al mouse con parallax por capas; el título usa la fuente corporativa UTEC (`.font-utec`).
  - `NodeNetwork.tsx` — red de nodos animada (constelación) dibujada en `<canvas>` detrás de las formas: los nodos derivan, se enlazan entre sí y hacia el cursor. Respeta `prefers-reduced-motion`.

### 3.8 Ejemplos de uso

```tsx
import { AvatarInitials } from '@/components/ui/avatar-initials';
import { StatusBadge } from '@/components/ui/status-badge';
import { MetricCard } from '@/components/ui/metric-card';
import { Users } from 'lucide-react';

<AvatarInitials name="Juan Pérez" email="juan@utec.edu.uy" size="lg" />

<StatusBadge status="success" label="Activo" pulse />

<MetricCard
  title="Usuarios Activos"
  value="1,234"
  icon={Users}
  description="En las últimas 24 horas"
  trend={{ value: 12.5, isPositive: true }}
  progress={75}
  variant="success"
/>
```

### 3.9 Responsive

Breakpoints estándar de Tailwind:

| Breakpoint | Ancho | Comportamiento general |
|---|---|---|
| `< 640px` | Mobile | Sidebar colapsado, cards en 1 columna, tablas como cards. |
| `640–1024px` | Tablet | Sidebar colapsable, grids 2-columnas. |
| `1024–1536px` | Desktop | Sidebar fijo, tablas completas, todos los filtros visibles. |
| `> 1536px` | XL | Sidebar expandido, máximo aprovechamiento de espacio. |

### 3.10 Modo oscuro

El tema lo gestiona **next-themes**, montado en `frontend/src/main.tsx` mediante un wrapper propio `frontend/src/components/theme-provider.tsx` con `attribute="class"`, `defaultTheme="light"`, `enableSystem={false}` y `storageKey="utec-theme"` (la preferencia se persiste en `localStorage`). El toggle (sol/luna) es `frontend/src/components/ui/theme-toggle.tsx` y se ubica en el `DashboardHeader`.

next-themes alterna la clase `.dark` en `<html>`. A partir de ahí, el modo oscuro se resuelve en dos niveles dentro de `index.css`:

1. **Tokens shadcn**: el bloque `.dark { ... }` ya redefine las variables OKLCH (`--background`, `--card`, `--foreground`, etc.). Todo componente que use clases de token (`bg-background`, `text-foreground`, `bg-card`…) se adapta solo.
2. **Utilidades hardcodeadas**: buena parte de la app se construyó con grises y blancos literales (`bg-white`, `bg-gray-50/100/200`, `text-gray-900/700/500`, `border-gray-*`, y los azules del heatmap `bg-blue-50…400`). Para no editar decenas de componentes uno por uno, `index.css` incluye un bloque de overrides `.dark .bg-white { … }`, `.dark .bg-gray-100 { … }`, etc., que remapea esas utilidades a los tokens del tema (o a colores explícitos en el caso del heatmap, que debe seguir siendo azul y no gris en oscuro). Incluye también variantes con opacidad (`.dark .bg-gray-50\/50`).

Casos puntuales con color inline (no por clase, por lo que el override CSS no los alcanza) se corrigieron en el componente usando variables CSS: la vista de día/semana del calendario (`ReservationCalendarView.tsx`) usa `var(--background)`, `var(--card)`, `var(--muted)` y `var(--border)` en lugar de hex fijos.

### 3.11 Imágenes 360° de espacios

El detalle de espacio (`SpaceDetails.tsx`) muestra la imagen mediante `frontend/src/components/spaces/SpaceImage.tsx`, que:

- Renderiza siempre la foto normal (`<img>`).
- **Detecta panorámicas equirectangulares** por la relación de aspecto: carga la imagen en memoria y la considera 360° si el ratio ancho/alto está entre 1.9 y 2.2 (las equirectangulares son ~2:1). No requiere metadato ni flag en el backend.
- Si es 360°, superpone un botón **"360°"** (icono `Rotate3d`) que abre un visor panorámico interactivo a pantalla completa.

El visor es `frontend/src/components/spaces/Panorama360Viewer.tsx`, basado en `@photo-sphere-viewer/core` (sobre `three`). Se carga **lazy** (`React.lazy`) para no incluir `three` en el bundle salvo que el usuario abra una 360.

Dos decisiones de implementación quedan documentadas por ser no obvias:

- El overlay es **propio** (`fixed inset-0`), no un `Dialog` de Radix: el `FocusScope` del Dialog monta un `MutationObserver` que choca con el visor (que reescribe el DOM del canvas).
- La instancia del `Viewer` se crea diferida un tick (`setTimeout(…, 0)`): así se evita el doble-montaje de React StrictMode (crear → destruir → crear), que dejaba la carga de la textura colgada.

---

## 4. Métricas / evidencia

- **Componentes propios en `components/ui/`**: 13+ (incluye los seis "destacados" + selects especializados + componentes específicos del panel de Sistema).
- **Tokens de paleta UTEC**: 8 colores principales con sus utilidades de texto/fondo/borde.
- **Animaciones propias**: 7 (sin contar las que provee `tw-animate-css`).
- **Sin `tailwind.config.*`**: la configuración entera del tema vive en `frontend/src/index.css` aprovechando la directiva `@theme` de Tailwind v4.
- **Modo oscuro**: activo. `ThemeProvider` (next-themes) montado en `main.tsx` + toggle en el header; resuelto en `index.css` con el bloque `.dark { ... }` de tokens shadcn más overrides de las utilidades hardcodeadas (`bg-white`, `bg-gray-*`, `text-gray-*`, heatmap `bg-blue-*`). Ver §3.10.

---

## 5. Riesgos, limitaciones y TODOs

### 5.1 Limitaciones

- **Tailwind v4 sin `tailwind.config.ts`**: ofrece simpleza, pero limita lo que se puede configurar fuera de CSS (por ejemplo, plugins JS extensos). Si en el futuro se necesitan plugins más complejos, habrá que migrar parcialmente la configuración.
- **La escala tipográfica arranca en 11 px** (`text-2xs`) y el cuerpo de la
  interfaz es 14 px. Es una herramienta densa a propósito; un componente
  externo que asuma 16 px de cuerpo va a verse más grande que el resto.
- **Las animaciones genéricas (`fade-in`, `slide-up`, etc.) vienen de `tw-animate-css`**: si esa dependencia se actualiza con cambios incompatibles, hay que revisar el catálogo de clases usadas en el proyecto.

### 5.2 Deuda técnica

**Familias duplicadas.** Verlas juntas en `/ui` es lo que las hizo visibles.
Los tokens las dejaron *consistentes*, pero siguen siendo varias
implementaciones de lo mismo:

| familia | copias | estado |
|---|---|---|
| Confirmación de borrado | 8 → 1 | hecho: `components/common/ConfirmarBorradoDialog` |
| `EmptyState` | 3 → 1 | hecho: `components/ui/empty-state` con variante `linea` |
| `Panel` | 6 → 2 | `components/common/Panel`; queda el de `RuntimeCards`, que tiene otra forma |
| Hooks con caché de lista | 4 → 1 | `hooks/cacheDeLista.ts`, con test |
| Estrellas de valoración | 4 → 1 | `components/common/Estrellas` |
| `sumarDias` | 4 → 1 | `lib/utils/fechas` |
| `API_BASE_URL` | 5 → 1 | `lib/config/api` |
| Descarga de CSV | 6 → 1 | `descargarCSV` en `lib/utils/csv-helpers` |
| `UTEC` (paleta en inglés) | 3 → 1 | `MARCA_EN` en `lib/design/paleta` |
| Días de la semana | 6 → 2 | `lib/utils/fechas`, uno por cada orden |
| Estado → color | 14 → 1 | `components/common/estados`, con los cinco dominios |
| Formateo de fechas | 16 → 1 | `lib/utils/fechas.ts` |
| Esqueletos de carga | 23 → 1 | la primitiva `ui/skeleton`, en `bg-muted` |
| Globo de gráfico | 15 → 1 | `GloboGrafico` en `components/common/dataviz` |
| Tiras de métricas | 9 → 2 | `components/common/StatStrip`; queda `SysStat`, que lleva barras y umbrales |
| Tablas y vistas de fichas | 3 + 3 | **no se colapsan a propósito**: `ReservationTableView` no es una tabla, es media pantalla con filtros, paginación y pantalla completa. Serían 36 props. Lo que sí se unificó es el encabezado. |
| Pistas de barra de progreso | 47 | **no se colapsan a propósito**: la clase se repite pero las implementaciones no compiten —el alto varía según dónde vive la barra— y tocar 47 lugares es riesgo sin beneficio. |

**Código muerto: borrado.** 65 archivos y 5461 líneas. Eran tres capas:

- La generación anterior del dashboard —`DashboardStats`, `DashboardCharts`,
  `UpcomingReservations`, `QuickActions` y toda la carpeta `widgets/`—, que
  las vistas por rol ya habían reemplazado con `StatStrip` y `Panel`. Estaba
  escondida detrás de un barrel que tampoco importaba nadie.
- 22 primitivas de shadcn que nunca se usaron, y con ellas 26 dependencias.
- Restos sueltos: `components/rooms` (superado por `components/spaces`),
  `InscriptosDialog` (superado por el panel de `MateriaDetail`),
  `mock-data.ts`, `lib/config/timezone.ts` y 13 exports sin un solo uso.

Lo encuentra `node scripts/muerto.mjs`.

### 5.3 TODOs

- [x] Resolver las clases CSS huérfanas. `active-indicator`, `transition-smooth`
      y `animate-slide-up` se borraron del markup; `hover-scale` y `badge-pulse`
      se definieron, porque la intención estaba clara y no hacían nada.
- [x] Documentar la guía de contribución. Está en
      [`documentation/ui/README.md`](../ui/README.md).
- [x] Sumar un catálogo de componentes. Es la ruta `/ui`, sólo en desarrollo,
      con los 108 componentes que pueden montarse sin backend y los dos temas
      lado a lado. La cobertura la calcula `scripts/inventario-ui.mjs`.
- [x] Colapsar las ocho confirmaciones de borrado. Eran ~690 líneas repetidas;
      hoy son ocho envoltorios sobre `ConfirmarBorradoDialog`, cada uno con su
      firma original para no tocar a quien los llama. En el camino se
      recuperaron tres `PermissionGuard` y se corrigió el género gramatical
      ("el evento", no "la evento").
- [x] Terminar los estados de error. De 21 cargas que se comían el error
      quedan 4, todas legítimas: dos son el prefetch del dashboard —la
      petición que cuenta la hace el componente y ésa sí lo muestra— y dos
      son datos opcionales.
- [ ] (hecho) Terminar los estados de error. `components/common/EstadoCarga` ya
      existe y lo usan los dos paneles de valoración y `StatsListWidget`.
      Quedan 33 `catch` que se comen el error en 20 archivos; los que
      envuelven una llamada de datos hay que pasarlos.
- [ ] Terminar la pasada de contraste. `node scripts/contraste.mjs` bajó de
      821 textos a 613, y lo peor pasó de 1,00:1 a 1,70:1. Lo que queda son
      103 grupos, casi todos entre 3 y 4,5 —`text-muted-foreground` en
      tamaños chicos—, que es una decisión de sistema y no colores sueltos.
- [x] Auditoría de accesibilidad: teclado y foco. Recorridas catorce
      pantallas con Tab: todo lo que se enfoca tiene nombre accesible y
      anillo de foco visible. Los diálogos atrapan el foco y cierran con
      Escape, y ahora devuelven el foco al botón que los abrió.
- [ ] Auditoría de accesibilidad. El contraste está medido y visible en
      `/ui#paleta`, y el foco es visible en toda la aplicación. Falta la pasada
      de navegación por teclado, orden de foco y etiquetas en los botones que
      son sólo icono.
