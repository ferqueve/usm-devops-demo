# Ficha técnica · Sistema de Diseño UI

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
| `next-themes` | ^0.4.6 | Soporte de modo oscuro. |
| `class-variance-authority`, `clsx`, `tailwind-merge` | (vía shadcn) | Helpers para variantes y combinación de clases. |

`frontend/components.json` configura shadcn/ui con `style: "new-york"` y aliases.

### 3.2 Tokens de tema (en `frontend/src/index.css`)

El archivo `index.css` está organizado así:

- **Líneas 1–13**: imports (`@import "tailwindcss"`, fuentes Gilroy + Poppins, `@import "tw-animate-css"`).
- **Línea ~5**: `@font-face` para la fuente corporativa **UTEC**.
- **Línea ~18**: bloque `@theme` con los tokens de Tailwind v4.
- **Línea ~42**: `--radius: 0.625rem` (radio base para componentes shadcn).
- **Líneas 41–108**: variables shadcn en formato OKLCH, con bloque `.dark { ... }` para modo oscuro.
- **Línea ~121**: `html { font-size: 87.5% }` — reduce globalmente la jerarquía tipográfica para que los `rem` tengan una escala más compacta.
- **Líneas 167–222**: bloques de utilidades inline.
- **Líneas 225–454**: `@layer utilities` con todas las utilidades propias del proyecto (ver §3.5).

### 3.3 Paleta corporativa UTEC

Definida como utilidades de color (`text-utec-*`, `bg-utec-*`, `border-utec-*`):

| Color | Hex | Uso típico |
|---|---|---|
| Verde UTEC | `#86bb4c` | Éxito, estado activo. |
| Amarillo UTEC | `#F6CA21` | Alerta no crítica. |
| Naranja UTEC | `#DE7A27` | Advertencia. |
| Rojo UTEC | `#DF2B31` | Error, estado crítico. |
| Azul UTEC | `#184897` | Color primario corporativo. |
| Cian UTEC | `#00c7ff` | Información. |
| Púrpura UTEC | `#9333ea` | Categoría auxiliar. |
| Gris oscuro | `#343a40` (`utec-dark`), `#4a5057`, `#3a4046` | Sidebar, header. |

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
  - `DashboardHeader.tsx` — header superior.

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

---

## 4. Métricas / evidencia

- **Componentes propios en `components/ui/`**: 13+ (incluye los seis "destacados" + selects especializados + componentes específicos del panel de Sistema).
- **Tokens de paleta UTEC**: 8 colores principales con sus utilidades de texto/fondo/borde.
- **Animaciones propias**: 7 (sin contar las que provee `tw-animate-css`).
- **Sin `tailwind.config.*`**: la configuración entera del tema vive en `frontend/src/index.css` aprovechando la directiva `@theme` de Tailwind v4.
- **Modo oscuro**: soportado vía `next-themes`, con bloque `.dark { ... }` en `index.css`.

---

## 5. Riesgos, limitaciones y TODOs

### 5.1 Limitaciones

- **Tailwind v4 sin `tailwind.config.ts`**: ofrece simpleza, pero limita lo que se puede configurar fuera de CSS (por ejemplo, plugins JS extensos). Si en el futuro se necesitan plugins más complejos, habrá que migrar parcialmente la configuración.
- **`html { font-size: 87.5% }`** reduce globalmente la jerarquía tipográfica. Cualquier componente externo (third-party) que asuma 100% / 16px va a verse más chico de lo esperado y puede requerir overrides.
- **Las animaciones genéricas (`fade-in`, `slide-up`, etc.) vienen de `tw-animate-css`**: si esa dependencia se actualiza con cambios incompatibles, hay que revisar el catálogo de clases usadas en el proyecto.

### 5.2 Deuda técnica

- En el código frontend hay referencias a clases que **no están definidas** en `index.css` ni en `tw-animate-css` (por ejemplo `active-indicator`, `badge-pulse`, `hover-scale`, `animate-slide-up`). Hoy estos selectores no aplican ningún estilo. Hay dos vías para resolverlo:
  1. Definirlas formalmente en `index.css` como utilidades propias.
  2. Reemplazarlas por equivalentes existentes (`hover-lift`, `animate-fade-in-up`, etc.) y borrarlas del código.

### 5.3 TODOs

- [ ] Resolver las clases CSS huérfanas listadas en §5.2 (definirlas o reemplazarlas).
- [ ] Documentar la guía de contribución para componentes UI nuevos (cuándo extender shadcn vs crear componente propio en `components/ui/`).
- [ ] Sumar un Storybook (o equivalente) para visualizar el catálogo de componentes propios.
- [ ] Auditoría de accesibilidad (contraste, foco visible, navegación por teclado) y registrar resultados en esta ficha.
