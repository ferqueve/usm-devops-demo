# Ficha técnica · Cliente Mobile

## 1. Resumen ejecutivo

El cliente mobile (`mobile/`) es una aplicación **Expo / React Native** que recrea la experiencia de UTEC Space Manager en un dispositivo, **consumiendo la misma API REST** del backend Spring Boot que usa el frontend web. No hay backend propio ni lógica de negocio duplicada: el mobile es una capa de presentación nativa sobre el mismo contrato (`/api/v1/...`, envelope `{ success, message, data, error }`, JWT). Cubre las diez áreas funcionales del sistema (inicio, calendario, reservas, espacios, inventario, estadísticas, asistente IA, usuarios, sistema, auditoría) más los flujos de autenticación, gateadas por rol igual que en el web, e incluye modo claro/oscuro.

El cliente replica el diseño de marca y consume el sistema desde un dispositivo nativo. Quedan pendientes el empaquetado para distribución (build de tienda) y el OAuth de Google, que requiere un entorno desplegado para ser ejercitado.

---

## 2. Cómo se usa

El cliente vive en `mobile/` y se ejecuta con el toolchain de Expo:

```bash
cd mobile
npx expo start            # abre Metro; tecla 'a' para emulador Android, 'i' para iOS
```

Para correrlo necesita alcanzar el backend. La URL base está en `mobile/src/config.ts`:

```ts
export const API_BASE_URL = 'http://10.0.2.2:8080/api/v1';
```

`10.0.2.2` es el alias del emulador Android hacia el `localhost` de la máquina anfitriona. Para un dispositivo físico en la misma WiFi se reemplaza por la IP LAN de la PC; para producción, por la URL del backend desplegado. El backend debe estar corriendo (perfil `dev`) con su infraestructura (Postgres, Redis, MinIO), igual que para el web.

Las credenciales de prueba son las mismas que las del backend en desarrollo (usuarios sembrados `@utec.edu.uy`).

---

## 3. Detalle técnico

### 3.1 Stack

| Dependencia | Función |
|---|---|
| `expo` ~56 + `react-native` 0.85 + `react` 19 | Runtime y framework. |
| `@react-navigation/drawer`, `@react-navigation/native-stack` | Navegación (cajón + stack de auth). |
| `react-native-gesture-handler`, `react-native-reanimated` (+ `react-native-worklets`) | Gestos y animaciones del drawer. |
| `@react-native-async-storage/async-storage` | Persistencia de sesión (token, usuario). |
| `lucide-react-native` + `react-native-svg` | Iconografía (los mismos iconos que el web). |
| `expo-linear-gradient` | Gradiente UTEC del login y avatares. |
| `@expo-google-fonts/poppins` + `expo-font` | Tipografía Poppins (cuerpo) + fuente corporativa UTEC (`assets/fonts/UTEC.ttf`). |
| `@react-native-community/datetimepicker` | Selección de fecha/hora (crear reserva). |
| `expo-web-browser` + `expo-linking` | Flujo OAuth de Google. |
| `expo-splash-screen` | Splash mientras cargan las fuentes. |

El proyecto usa el plugin de Babel `react-native-worklets/plugin` (en `babel.config.js`), requerido por Reanimated 4.

### 3.2 Estructura (`mobile/src/`)

```
theme/                 Sistema de diseño: colors (light/dark), ThemeProvider,
                       themed()/useColors, tipografía, spacing, radius, sombras
components/ui/         Primitivos: Text, Button, Card, Badge, StatusBadge,
                       MetricCard, BarChart, Input, SelectField, DateTimeField,
                       AvatarInitials, EmptyState, Screen, Fab, MarkdownText
components/<área>/     Componentes de dominio (reservations, spaces, inventory,
                       users): filas, cards, sheets de detalle, modales de form
lib/
  http.ts              Cliente HTTP (token + 401/refresh + envelope + getRaw/hostGet)
  types.ts             Modelos de dominio espejados del backend
  permissions.ts       Ítems de navegación gateados por rol
  format.ts            Helpers de fecha/hora/texto (es-UY)
  api/                 Módulos de API: auth, spaces, reservations, dashboard,
                       inventory, users, audit, stats, system, ai, carreras
contexts/AuthContext   Sesión (AsyncStorage), auto-logout en 401, login con Google
navigation/            DrawerContent (sidebar oscuro), AppHeader, AppNavigator,
                       RootNavigator (gate de auth), AuthNavigator, icons
screens/               Login, Register, ForgotPassword, Dashboard, Calendario,
                       Reservas, Espacios, Inventario, Estadisticas, Usuarios,
                       Sistema, Auditoria, Asistente
```

### 3.3 Capa de datos y reuso de la API

`lib/http.ts` reproduce la lógica del cliente del web (`frontend/src/lib/api/client.ts`):

- Inyecta `Authorization: Bearer <token>` desde AsyncStorage.
- Desempaqueta el envelope `{ success, message, data, error }`.
- Ante 401 / token expirado intenta refrescar una vez (`POST /auth/refresh` con header `Refresh-Token`); si falla, dispara un logout global que el `AuthContext` escucha.
- Expone variantes para endpoints que no siguen el envelope: `getRaw` (ej. `/usuarios`, que devuelve la página cruda con `pageNumber`/`pageSize`) y `hostGet` (rutas fuera de `/api/v1`, como `/actuator/*`).

Los tipos de dominio en `lib/types.ts` son un subconjunto de los del web, ajustados a lo que las pantallas consumen.

### 3.4 Navegación y gateo por rol

La navegación principal es un **drawer** que replica el sidebar oscuro del web (logo UTEC + USM, ítems con icono lucide, perfil con avatar de gradiente, cerrar sesión). Los ítems visibles se filtran por rol en `lib/permissions.ts` (`navItemsForRole`), con la misma matriz que el web: un docente ve Inicio/Calendario/Reservas, un admin ve las diez áreas, etc. El flujo de autenticación (Login → Register → ForgotPassword) es un stack aparte; `RootNavigator` alterna entre el stack de auth y el drawer según haya sesión.

### 3.5 Tema (claro/oscuro)

`theme/colors.ts` traduce los tokens shadcn del web (definidos en OKLCH) a hex, más la paleta corporativa UTEC. El `ThemeProvider` (`theme/ThemeProvider.tsx`) mantiene una **paleta activa mutable** y un Proxy `colors` en vivo; el helper `themed()` envuelve `StyleSheet.create` para que los estilos se reconstruyan al cambiar de tema. El toggle (sol/luna) vive en el `DrawerContent` y la preferencia se persiste en AsyncStorage. El drawer y el header son oscuros de marca en ambos modos, igual que en el web.

### 3.6 Funcionalidades de escritura

Además de la lectura, el cliente soporta: crear reserva (form con selects y pickers de fecha/hora), CRUD de espacios e inventario (FAB + modales de formulario), cambio de rol de usuario, registro y recuperación de contraseña, y el chat del **Asistente IA** (`POST /ai/chat`). El acceso con Google usa `expo-web-browser` con un deep link `usmutec://` (scheme declarado en `app.json`).

---

## 4. Métricas / evidencia

- **Pantallas**: 13 en total — 10 áreas funcionales + 3 de autenticación (login, registro, recuperar contraseña).
- **Primitivos UI propios**: ~15 en `components/ui/`.
- **Módulos de API**: 11 (auth, spaces, reservations, dashboard, inventory, users, audit, stats, system, ai, carreras).
- **Reuso**: 100% del backend; sin endpoints ni base de datos propios.
- **Verificación**: probado en emulador Android contra el backend `dev` real — login, navegación por rol, dashboards, listados, crear/aprobar reserva, toggle de tema y chat IA con datos reales.
- **Typecheck**: `npx tsc --noEmit` sin errores.

---

## 5. Riesgos, limitaciones y TODOs

### 5.1 Limitaciones

- **Sin build de distribución**: todavía no hay build empaquetado (Android `.apk`/`.aab` ni iOS) ni configuración de EAS Build. Se corre vía Expo Go / emulador.
- **URL base hardcodeada** en `config.ts` (`10.0.2.2` para emulador). Falta una configuración por entorno (dev/LAN/producción).
- **OAuth de Google** está implementado en el cliente pero **no es verificable en local** (Google no puede redirigir a un backend en `localhost`); requiere el backend desplegado y, para el retorno por deep link, un dev build con el scheme registrado.
- **Cobertura de escritura parcial**: están los flujos clave (crear reserva, CRUD espacios/inventario, cambio de rol), pero no todo lo que el web permite (ej. edición de perfil, gestión de solicitudes de inventario).

### 5.2 TODOs

- [ ] Configuración de API por entorno (sin hardcodear la IP).
- [ ] Build reproducible (EAS) para distribuir a testers.
- [ ] Completar OAuth de Google contra el entorno desplegado.
- [ ] Tests (no hay suite de pruebas del cliente mobile todavía).
