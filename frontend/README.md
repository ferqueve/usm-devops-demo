# UTEC Space Manager - Frontend

Frontend del sistema de gestión de espacios para UTEC construido con React + TypeScript + Vite.

---

## 🏗️ Stack Tecnológico

- **React** 18 + **TypeScript**
- **Vite** - Build tool
- **React Router** v6 - Routing
- **Tailwind CSS** - Estilos
- **shadcn/ui** - Componentes UI
- **Context API** - Estado global
- **Lucide React** - Iconos

---

## 📁 Estructura

```
src/
├── app/              # Páginas (routing)
├── components/       # Componentes reutilizables
│   ├── ui/          # shadcn/ui components
│   ├── layouts/     # Layouts
│   └── [features]/  # Por funcionalidad
├── contexts/        # React Contexts
├── hooks/           # Custom hooks
├── lib/             # Utilidades y API client
└── data/            # Datos mock
```

---

## 🚀 Inicio Rápido

### Instalación

```bash
cd frontend
npm install
```

### Desarrollo

```bash
# Local (solo localhost)
npm run dev

# Red local (accesible desde otros dispositivos)
npm run dev:network

# Variables de entorno en frontend/.env (editar manualmente)
```

**Acceso:** 
- Local: http://localhost:5173
- Red: http://192.168.x.x:5173 (IP configurada en .env)

### Build

```bash
# Build de producción
npm run build

# Preview de build
npm run preview
```

---

## 🔧 Configuración

### Variables de Entorno (`.env`)

El archivo `.env` se configura manualmente con las URLs necesarias:

```env
# Configurado manualmente - cambiar según tu entorno
VITE_API_URL=http://192.168.1.14:8080/api/v1
VITE_FRONTEND_URL=http://192.168.1.14:5173
VITE_GOOGLE_CLIENT_ID=tu-client-id.apps.googleusercontent.com
```

**Scripts de desarrollo:**
- `npm run dev` - Desarrollo local (localhost)
- `npm run dev:network` - Desarrollo accesible desde red (otros dispositivos)

**Nota:** Cambia manualmente las IPs en el archivo `.env` para configurar el acceso desde otros dispositivos.

---

## 🎯 Funcionalidades

### ✅ Implementado

- Autenticación (login, registro, verificación email)
- Dashboard con estadísticas
- Layouts responsive
- Protección de rutas por rol
- Auto-refresh de tokens

### 🚧 En Desarrollo (UI completa con datos mock)

- CRUD de salones
- Sistema de reservas
- Formulario de creación de reservas con items solicitados resumidos y edición en popover
- Gestor de solicitudes de inventario con filtros y panel de acciones (accesible desde Espacios)
- Calendario interactivo (la vista diaria ahora muestra el horario completo sin colapsar horas alejadas)
- Estadísticas y reportes

---

## 📱 Rutas

### Públicas
- `/` - Login y registro
- `/auth/verify` - Verificación de email

### Protegidas (requieren autenticación)
- `/dashboard` - Vista general
- `/calendar` - Calendario
- `/reservations` - Reservas
- `/rooms` - Salones
- `/statistics` - Estadísticas
- `/settings` - Configuración

---

## 🎨 Componentes UI

Usa **shadcn/ui** para componentes:

```bash
# Agregar componente
npx shadcn-ui@latest add [component-name]

# Ejemplos
npx shadcn-ui@latest add button
npx shadcn-ui@latest add card
```

**Componentes disponibles:** Button, Input, Card, Dialog, Select, Table, Calendar, Chart, y más...

---

## 🔐 Autenticación

### Context de Auth

```typescript
const { user, login, logout, isAuthenticated } = useAuth();
```

### Protección de Rutas

```typescript
<RoleProtectedRoute allowedRoles={['ADMIN', 'DOCENTE']}>
  <Component />
</RoleProtectedRoute>
```

---

## 🛠️ Comandos

```bash
# Desarrollo
npm run dev              # Local (localhost)
npm run dev:network      # Red local (accesible desde otros dispositivos)

# Build
npm run build           # Compilar
npm run preview         # Preview

# Linter
npm run lint           # ESLint
```

---

## 🐳 Docker

```bash
# Build imagen
docker build -t utec-frontend .

# Ejecutar
docker run -p 5173:5173 utec-frontend
```

---

## 📚 Recursos

- [Documentación completa](../PROJECT_STRUCTURE.md)
- [Backend API](../backend/README.md)
- [React Docs](https://react.dev)
- [Vite Docs](https://vitejs.dev)
- [Tailwind CSS](https://tailwindcss.com)
- [shadcn/ui](https://ui.shadcn.com)

---

**Desarrollador:** Mathias Pena  
**Versión:** 1.0.0  
**Fecha:** Octubre 2025

