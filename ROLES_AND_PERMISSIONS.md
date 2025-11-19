# 🔐 Roles y Permisos del Sistema - UTEC Space Manager

Documentación completa de los roles del sistema y sus permisos específicos.

> **Nota sobre implementación**: Este documento describe los permisos según el código actual. Algunas funcionalidades pueden estar parcialmente implementadas o en desarrollo.

---

## 📋 Roles del Sistema

El sistema cuenta con **6 roles** principales:

1. **ADMIN** - Administrador del sistema
2. **ANALISTA** - Personal administrativo
3. **MANTENIMIENTO** - Personal de mantenimiento (espacios e inventario)
4. **DOCENTE** - Profesores
5. **ESTUDIANTE** - Estudiantes
6. **EXTERNO** - Usuarios externos

---

## 👤 ADMIN - Administrador

### Descripción
Rol con acceso completo al sistema. Puede gestionar todos los aspectos de la plataforma.

### Permisos Completos

#### ✅ Usuarios
- ✅ Ver todos los usuarios
- ✅ Crear usuarios
- ✅ Editar usuarios
- ✅ Eliminar usuarios
- ✅ Cambiar roles de usuarios
- ✅ Activar/desactivar usuarios
- ✅ Ver estadísticas de usuarios
- ✅ Exportar usuarios a CSV
- ✅ Reenviar verificación de email
- ✅ Restablecer contraseñas

#### ✅ Espacios
- ✅ Crear espacios
- ✅ Editar espacios
- ✅ Eliminar espacios
- ✅ Ver todos los espacios
- ✅ Buscar y filtrar espacios
- ✅ Ver estadísticas de espacios
- ✅ Gestionar inventario de espacios

#### ✅ Inventario
- ✅ Crear items de inventario
- ✅ Editar items de inventario
- ✅ Eliminar items de inventario
- ✅ Ver todo el inventario
- ✅ Asignar items a espacios
- ✅ Ver estadísticas de inventario
- ✅ Filtrar y buscar inventario

#### ✅ Reservas
- ✅ Crear reservas directamente
- ✅ Ver todas las reservas
- ✅ Editar reservas
- ✅ Eliminar reservas
- ✅ Aprobar/rechazar reservas
- ✅ Cancelar reservas
- ✅ Ver estadísticas de reservas

#### ✅ Carreras
- ✅ Crear carreras
- ✅ Editar carreras
- ✅ Eliminar carreras
- ✅ Ver todas las carreras
- ✅ Ver estadísticas de carreras

#### ✅ Estadísticas y Reportes
- ✅ Ver todas las estadísticas
- ✅ Exportar reportes
- ✅ Acceder a Swagger/API docs
- ✅ Acceder a Actuator (monitoreo)

#### ✅ Sistema
- ✅ **Acceso exclusivo a la vista de Sistema**
- ✅ Configuración del sistema
- ✅ Logs del sistema
- ✅ Gestión de configuración general
- ✅ Monitoreo del sistema

### Rutas Frontend Permitidas
- `/dashboard`
- `/rooms` (y `/rooms/:id`)
- `/reservations`
- `/calendar`
- `/users`
- `/inventory` (y `/inventory/requests`)
- `/statistics`
- `/system` (**EXCLUSIVO para ADMIN**)

---

## 📊 ANALISTA - Personal Administrativo

### Descripción
Personal administrativo con autoridad completa sobre las reservas. Pueden ver espacios e inventario para información, pero no gestionarlos. Pueden crear solicitudes de inventario para reservas.

### Permisos

#### ✅ Reservas (Autoridad Completa)
- ✅ **CRUD completo de reservas** (Crear, Leer, Actualizar, Eliminar)
- ✅ Crear reservas de diferentes modos
- ✅ Ver todas las reservas
- ✅ Editar reservas
- ✅ Eliminar reservas
- ✅ Aprobar/rechazar solicitudes de reserva
- ✅ Cancelar reservas
- ✅ Ver reservas por espacio
- ✅ Ver reservas por usuario

#### ✅ Solicitudes
- ✅ **Aceptar solicitudes de reserva**
- ✅ Rechazar solicitudes de reserva
- ✅ Ver todas las solicitudes pendientes

#### ✅ Inventario para Reservas
- ✅ **Crear solicitudes de inventario para la reserva** (al crear una reserva, puede incluir `itemsSolicitados`)
- ✅ Ver qué items de inventario se necesitan para una reserva
- ✅ Solicitar items específicos para reservas
- ✅ Ver solicitudes de inventario pendientes (en `/inventory/requests`)
- ❌ Aceptar/rechazar solicitudes de inventario (solo MANTENIMIENTO/ADMIN)

#### ✅ Espacios (Solo Visualización)
- ✅ Ver todos los espacios
- ✅ Ver detalles de espacios
- ✅ Ver disponibilidad de espacios
- ✅ Ver capacidad de espacios
- ✅ Ver estado de espacios
- ❌ Crear/editar/eliminar espacios (solo MANTENIMIENTO/ADMIN)
- ❌ Gestionar espacios

#### ✅ Inventario (Solo Visualización)
- ✅ **Ver inventario de los salones** (al ver detalles de un espacio, se muestra su inventario)
- ✅ Ver qué items hay en cada espacio
- ✅ Ver estado del inventario (DISPONIBLE, MANTENIMIENTO, DANADO)
- ✅ Ver cantidad de items por espacio
- ✅ Ver tipos de elemento (necesario para crear solicitudes)
- ❌ Crear/editar/eliminar items (solo MANTENIMIENTO/ADMIN)
- ❌ Asignar/desasignar items (solo MANTENIMIENTO/ADMIN)
- ❌ Gestionar inventario

#### ✅ Estadísticas
- ✅ **Ver estadísticas de reservas**
- ✅ Exportar reportes de reservas
- ✅ Ver métricas de uso de espacios (relacionadas a reservas)

#### ❌ Usuarios
- ❌ Ver usuarios
- ❌ Gestionar usuarios
- ❌ Cambiar roles

#### ❌ Sistema
- ❌ Acceso a vista de Sistema
- ❌ Configuración del sistema
- ❌ Logs del sistema

### Rutas Frontend Permitidas
- `/dashboard`
- `/reservations`
- `/calendar`
- `/rooms` (solo visualización)
- `/rooms/:id` (solo visualización)
- `/statistics` (solo reservas)

---

## 🔧 MANTENIMIENTO - Personal de Mantenimiento

### Descripción
Personal encargado de la gestión completa de espacios e inventario. Tienen autoridad sobre todo lo relacionado con espacios físicos y recursos, pero no pueden crear reservas.

### Permisos

#### ✅ Espacios (Gestión Completa)
- ✅ Ver todos los espacios
- ✅ Crear espacios
- ✅ Editar espacios
- ✅ Actualizar estado de espacios (DISPONIBLE, MANTENIMIENTO, OCUPADO)
- ✅ Buscar y filtrar espacios
- ✅ Ver detalles de espacios
- ✅ Ver disponibilidad de espacios
- ✅ Gestionar imágenes y planos de espacios
- ✅ Actualizar capacidad de espacios
- ✅ Gestionar características de espacios
- ❌ Eliminar espacios (solo ADMIN)

#### ✅ Inventario (Gestión Completa)
- ✅ Ver todo el inventario
- ✅ Crear items de inventario
- ✅ Editar items de inventario
- ✅ Actualizar estado de items (DISPONIBLE, MANTENIMIENTO, DANADO)
- ✅ **Asignar items a espacios**
- ✅ **Desasignar items de espacios**
- ✅ Reasignar items entre espacios
- ✅ Filtrar y buscar inventario
- ✅ **Exportar información de inventario**
- ✅ Importar inventario
- ❌ Eliminar items (solo ADMIN)

#### ✅ Solicitudes de Inventario
- ✅ **Aceptar solicitudes de inventario** (cambiar estado a APROBADO/ENTREGADO)
- ✅ **Rechazar solicitudes de inventario** (cambiar estado a RECHAZADO)
- ✅ Ver solicitudes de inventario pendientes (en `/inventory/requests`)
- ✅ Gestionar solicitudes relacionadas con inventario
- ✅ Ver historial de solicitudes de inventario
- ✅ Filtrar solicitudes por estado, espacio, fecha

#### ✅ Tipos de Elemento
- ✅ Ver tipos de elemento
- ✅ Crear tipos de elemento
- ✅ Editar tipos de elemento
- ❌ Eliminar tipos (solo ADMIN)

#### ✅ Tipos de Espacio
- ✅ Ver tipos de espacio
- ✅ Crear tipos de espacio
- ✅ Editar tipos de espacio
- ❌ Eliminar tipos (solo ADMIN)

#### ✅ Reservas (Solo Visualización)
- ✅ Ver reservas (para conocer ocupación de espacios)
- ✅ Ver calendario de espacios
- ❌ Crear reservas
- ❌ Editar reservas
- ❌ Eliminar reservas
- ❌ Aprobar/rechazar reservas
- ❌ Gestionar reservas

#### ✅ Estadísticas
- ✅ **Ver estadísticas de inventario**
- ✅ **Ver estadísticas de espacios**
- ✅ Ver ocupación de espacios
- ✅ **Exportar reportes de inventario/espacios**

#### ❌ Usuarios
- ❌ Ver usuarios
- ❌ Gestionar usuarios
- ❌ Cambiar roles

#### ❌ Sistema
- ❌ Acceso a vista de Sistema
- ❌ Configuración del sistema
- ❌ Logs del sistema

### Rutas Frontend Permitidas
- `/dashboard`
- `/rooms` (y `/rooms/:id`) - Gestión completa
- `/calendar` (solo visualización)
- `/inventory` (y `/inventory/requests`) - Gestión completa
- `/statistics` (solo inventario y espacios)

### Responsabilidades
- Mantener actualizado el inventario de cada espacio
- Registrar el estado de los items (disponible, en mantenimiento, dañado)
- Asignar y desasignar items entre espacios
- Actualizar la capacidad y características de los espacios
- Registrar cuando un espacio está en mantenimiento
- Aceptar/rechazar solicitudes de inventario
- Generar y exportar reportes de inventario y espacios

---

## 🎓 DOCENTE - Profesores

### Descripción
Profesores que pueden ver todas las reservas del sistema y solicitar reservas de todo tipo (por inventario, salón, etc.).

### Permisos

#### ✅ Reservas
- ✅ **Ver reservas de todo el sistema** (todas las reservas, sin restricciones)
- ✅ **Solicitar reservas de todo tipo**:
  - Reservas por inventario (puede incluir `itemsSolicitados` en la solicitud)
  - Reservas por salón (espacio específico)
  - Reservas con items específicos (solicitar items de inventario)
  - Reservas de diferentes modos (con o sin carrera, con diferentes horarios)
- ✅ Ver sus propias reservas
- ✅ Ver estado de sus solicitudes (PENDIENTE, APROBADO, CANCELADO)
- ✅ Ver calendario con todas las reservas
- ❌ Crear reservas directamente (solo ADMIN/ANALISTA crean con estado APROBADO)
- ❌ Aprobar/rechazar reservas
- ❌ Editar reservas de otros
- ❌ Eliminar reservas

#### ✅ Espacios
- ✅ Ver todos los espacios
- ✅ Ver detalles de espacios
- ✅ Ver disponibilidad de espacios
- ✅ Buscar espacios
- ❌ Crear/editar/eliminar espacios
- ❌ Gestionar espacios

#### ✅ Calendario
- ✅ Ver calendario completo
- ✅ Ver todas las reservas (aprobadas y pendientes)
- ✅ Filtrar por espacio, carrera, tipo

#### ✅ Inventario (Solo Visualización de Espacios)
- ✅ Ver inventario de espacios (al ver detalles de un espacio)
- ✅ Ver qué items hay en cada espacio
- ❌ Ver todo el inventario del sistema
- ❌ Gestionar inventario

#### ❌ Usuarios
- ❌ Ver usuarios
- ❌ Gestionar usuarios

#### ❌ Estadísticas
- ❌ Ver estadísticas

#### ❌ Sistema
- ❌ Acceso a vista de Sistema

### Rutas Frontend Permitidas
- `/dashboard`
- `/reservations` (solicitar y ver todas)
- `/calendar`

### Flujo de Reserva para DOCENTE
1. **Ver todas las reservas del sistema**
2. **Solicitar Reserva** (de cualquier tipo: por inventario, salón, etc.) → Estado: `PENDIENTE`
3. **Esperar Aprobación** → ADMIN/ANALISTA aprueba
4. **Reserva Aprobada** → Estado: `APROBADO`

---

## 🎒 ESTUDIANTE - Estudiantes

### Descripción
Estudiantes con acceso limitado. Solo pueden ver las reservas del sistema.

### Permisos

#### ✅ Reservas
- ✅ **Ver reservas del sistema**
- ✅ Ver calendario con reservas
- ❌ Crear reservas
- ❌ Solicitar reservas
- ❌ Editar reservas
- ❌ Eliminar reservas
- ❌ Aprobar/rechazar reservas

#### ✅ Espacios
- ✅ Ver todos los espacios (para contexto de reservas)
- ✅ Ver detalles de espacios
- ✅ Ver disponibilidad de espacios
- ✅ Ver inventario de espacios (al ver detalles)
- ❌ Crear/editar/eliminar espacios
- ❌ Gestionar espacios

#### ✅ Calendario
- ✅ Ver calendario con reservas del sistema
- ✅ Filtrar por espacio, carrera, tipo

#### ❌ Inventario
- ❌ Ver inventario
- ❌ Gestionar inventario

#### ❌ Usuarios
- ❌ Ver usuarios
- ❌ Gestionar usuarios

#### ❌ Estadísticas
- ❌ Ver estadísticas

#### ❌ Sistema
- ❌ Acceso a vista de Sistema

### Rutas Frontend Permitidas
- `/dashboard`
- `/calendar`

---

## 🌐 EXTERNO - Usuarios Externos

### Descripción
Usuarios externos a UTEC con acceso limitado. Pueden solicitar reservas y ver reservas públicas.

### Permisos

#### ✅ Reservas
- ✅ **Solicitar reservas** (crear con estado PENDIENTE, requiere aprobación)
- ✅ **Ver reservas públicas** (todas las reservas aprobadas del sistema)
- ✅ Ver calendario público (reservas aprobadas)
- ✅ Ver estado de sus solicitudes (PENDIENTE, APROBADO, CANCELADO)
- ❌ Crear reservas directamente (solo ADMIN/ANALISTA crean con estado APROBADO)
- ❌ Ver reservas pendientes de otros usuarios
- ❌ Editar reservas
- ❌ Eliminar reservas
- ❌ Aprobar/rechazar reservas

#### ✅ Espacios
- ✅ Ver espacios públicos
- ✅ Ver detalles de espacios
- ✅ Ver disponibilidad básica
- ✅ Ver inventario de espacios (al ver detalles)
- ❌ Ver información completa
- ❌ Gestionar espacios

#### ✅ Calendario
- ✅ Ver calendario público
- ✅ Ver reservas públicas (aprobadas)
- ✅ Filtrar por espacio, carrera, tipo

#### ❌ Inventario
- ❌ Ver inventario
- ❌ Gestionar inventario

#### ❌ Usuarios
- ❌ Ver usuarios
- ❌ Gestionar usuarios

#### ❌ Estadísticas
- ❌ Ver estadísticas

#### ❌ Sistema
- ❌ Acceso a vista de Sistema

### Rutas Frontend Permitidas
- `/dashboard`
- `/reservations` (solo solicitar y ver públicas)
- `/calendar`

---

## 📊 Tabla Comparativa de Permisos

| Funcionalidad | ADMIN | ANALISTA | MANTENIMIENTO | DOCENTE | ESTUDIANTE | EXTERNO |
|---------------|:-----:|:--------:|:------------:|:-------:|:----------:|:-------:|
| **Usuarios** |
| Ver usuarios | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Gestionar usuarios | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Cambiar roles | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Espacios** |
| Ver espacios | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Crear espacios | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ |
| Editar espacios | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ |
| Eliminar espacios | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Gestionar estado | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ |
| **Inventario** |
| Ver inventario | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ |
| Crear items | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ |
| Editar items | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ |
| Eliminar items | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Asignar items | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ |
| Gestionar estado | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ |
| **Tipos de Elemento/Espacio** |
| Ver tipos | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Crear tipos | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ |
| Editar tipos | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ |
| Eliminar tipos | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Reservas** |
| Crear reservas | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Solicitar reservas | ✅ | ✅ | ❌ | ✅ | ❌ | ✅ |
| Ver todas | ✅ | ✅ | ✅* | ✅ | ✅ | ✅ |
| Ver públicas | ✅ | ✅ | ✅* | ✅ | ✅ | ✅ |
| Ver reservas por espacio | ✅ | ✅ | ✅* | ✅ | ✅ | ✅ |
| CRUD reservas | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Aprobar/rechazar | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Solicitudes inventario: crear | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Solicitudes inventario: aceptar | ✅ | ❌ | ✅*** | ❌ | ❌ | ❌ |
| **Carreras** |
| Ver carreras | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Gestionar carreras | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Inventario** |
| Ver inventario de espacio | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Ver todo el inventario | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Estadísticas** |
| Ver estadísticas | ✅ | ✅**** | ✅***** | ❌ | ❌ | ❌ |
| Exportar reportes | ✅ | ✅**** | ✅***** | ❌ | ❌ | ❌ |
| **Sistema** |
| Vista Sistema | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Configuración | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Logs | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |

*MANTENIMIENTO puede ver reservas para conocer ocupación de espacios  
**DOCENTE/ESTUDIANTE/EXTERNO pueden ver todas las reservas del sistema  
***MANTENIMIENTO acepta/rechaza solicitudes de inventario  
****ANALISTA solo estadísticas de reservas  
*****MANTENIMIENTO solo estadísticas de inventario y espacios

**Nota sobre permisos de lectura:**
- Todos los usuarios autenticados pueden ver espacios, tipos de espacio, tipos de elemento y carreras (GET)
- Todos los usuarios autenticados pueden ver reservas de un espacio específico (para ver disponibilidad)
- Todos los usuarios autenticados pueden ver inventario de un espacio específico (al ver detalles del espacio)
- Las operaciones de escritura (POST, PUT, DELETE) siguen restringidas según rol

---

## 🔄 Flujos de Trabajo por Rol

### Flujo de Reserva - DOCENTE
```
DOCENTE → Solicitar Reserva → PENDIENTE
         ↓
    ADMIN/ANALISTA → Revisar → Aprobar/Rechazar
         ↓
    APROBADO → Reserva activa
         ↓
    DOCENTE → Puede cancelar si es suya
```

### Flujo de Reserva - ADMIN/ANALISTA
```
ADMIN/ANALISTA → Crear Reserva → APROBADO (directamente)
                ↓
            Reserva activa
                ↓
            Puede editar/cancelar/eliminar
```

### Flujo de Inventario - MANTENIMIENTO
```
MANTENIMIENTO → Ver Inventario → Ver items
              ↓
         Crear/Editar items
              ↓
         Asignar/Desasignar a espacios
              ↓
         Actualizar estados (DISPONIBLE, MANTENIMIENTO, DANADO)
              ↓
         Exportar reportes (CSV, PDF)
              ↓
         Ver estadísticas
```

### Flujo de Espacios - MANTENIMIENTO
```
MANTENIMIENTO → Ver Espacios → Ver detalles
              ↓
         Crear/Editar espacios
              ↓
         Actualizar capacidad
              ↓
         Gestionar inventario del espacio
              ↓
         Actualizar estado (DISPONIBLE, MANTENIMIENTO, OCUPADO)
```

### Flujo de Solicitudes de Inventario - MANTENIMIENTO
```
MANTENIMIENTO → Ver Solicitudes Pendientes (/inventory/requests)
              ↓
         Revisar solicitud de inventario
              ↓
         Aprobar → Estado: APROBADO → Entregar → Estado: ENTREGADO
         O Rechazar → Estado: RECHAZADO
              ↓
         Asignar item de inventario si es necesario
```

---

## 🎯 Permisos Granulares Implementados

El sistema de permisos granular está completamente implementado. Los permisos siguen el formato `recurso:accion`:

### Permisos de Reservas (✅ Implementado)
- `reservas:crear` - Crear reserva directamente (ADMIN, ANALISTA)
- `reservas:solicitar` - Solicitar reserva (ADMIN, ANALISTA, DOCENTE, EXTERNO)
- `reservas:leer` - Ver reservas (todos los roles autenticados, con diferentes niveles)
- `reservas:editar` - Editar reservas (ADMIN, ANALISTA)
- `reservas:eliminar` - Eliminar reservas (ADMIN, ANALISTA)
- `reservas:aprobar` - Aprobar/rechazar (ADMIN, ANALISTA)
- `reservas:cancelar` - Cancelar reservas (ADMIN, ANALISTA, DOCENTE)

### Permisos de Espacios (✅ Implementado)
- `espacios:crear` - Crear espacios (ADMIN, MANTENIMIENTO)
- `espacios:editar` - Editar espacios (ADMIN, MANTENIMIENTO)
- `espacios:eliminar` - Eliminar espacios (ADMIN)
- `espacios:leer` - Ver espacios (todos los usuarios autenticados)
- `espacios:gestionar_estado` - Cambiar estado (ADMIN, MANTENIMIENTO)

### Permisos de Inventario (✅ Implementado)
- `inventario:crear` - Crear items (ADMIN, MANTENIMIENTO)
- `inventario:editar` - Editar items (ADMIN, MANTENIMIENTO)
- `inventario:eliminar` - Eliminar items (ADMIN)
- `inventario:leer` - Ver inventario (ADMIN, ANALISTA, MANTENIMIENTO)
- `inventario:asignar` - Asignar items a espacios (ADMIN, MANTENIMIENTO)
- `inventario:gestionar_estado` - Cambiar estado items (ADMIN, MANTENIMIENTO)
- `inventario:importar` - Importar inventario desde CSV (ADMIN, MANTENIMIENTO)
- `inventario:exportar` - Exportar inventario a CSV (ADMIN, MANTENIMIENTO)

### Permisos de Tipos (✅ Implementado)
- `tipos_elemento:crear` - Crear tipos de elemento (ADMIN, MANTENIMIENTO)
- `tipos_elemento:leer` - Ver tipos de elemento (ADMIN, ANALISTA, MANTENIMIENTO)
- `tipos_elemento:editar` - Editar tipos de elemento (ADMIN, MANTENIMIENTO)
- `tipos_elemento:eliminar` - Eliminar tipos de elemento (ADMIN)
- `tipos_espacio:crear` - Crear tipos de espacio (ADMIN, MANTENIMIENTO)
- `tipos_espacio:leer` - Ver tipos de espacio (ADMIN, ANALISTA, MANTENIMIENTO)
- `tipos_espacio:editar` - Editar tipos de espacio (ADMIN, MANTENIMIENTO)
- `tipos_espacio:eliminar` - Eliminar tipos de espacio (ADMIN)

### Permisos de Usuarios (✅ Implementado)
- `usuarios:gestionar` - Gestión completa de usuarios (ADMIN)
- `usuarios:ver` - Ver usuarios (ADMIN)

### Permisos de Estadísticas (✅ Implementado)
- `estadisticas:ver` - Ver estadísticas (ADMIN, ANALISTA, MANTENIMIENTO)
- `estadisticas:exportar` - Exportar reportes (ADMIN, ANALISTA, MANTENIMIENTO)
- `estadisticas:ver:reservas` - Ver estadísticas de reservas (ADMIN, ANALISTA) - *Pendiente de integración*
- `estadisticas:ver:inventario` - Ver estadísticas de inventario (ADMIN, MANTENIMIENTO)
- `estadisticas:ver:espacios` - Ver estadísticas de espacios (ADMIN, MANTENIMIENTO)

### Permisos de Solicitudes de Inventario (✅ Implementado)
- `solicitudes_inventario:crear` - Crear solicitudes de inventario para reservas (ADMIN, ANALISTA)
- `solicitudes_inventario:leer` - Ver solicitudes de inventario (ADMIN, ANALISTA, MANTENIMIENTO)
- `solicitudes_inventario:aprobar` - Aprobar solicitudes de inventario (ADMIN, MANTENIMIENTO)
- `solicitudes_inventario:rechazar` - Rechazar solicitudes de inventario (ADMIN, MANTENIMIENTO)
- `solicitudes_inventario:entregar` - Marcar como entregado (ADMIN, MANTENIMIENTO)

### Permisos de Carreras (✅ Implementado)
- `carreras:gestionar` - Gestión completa de carreras (ADMIN)

### Permisos de Sistema (✅ Implementado)
- `sistema:acceder` - Acceso a vista de Sistema (ADMIN exclusivo)
- `sistema:configurar` - Configurar sistema (ADMIN) - *Pendiente de implementación*
- `sistema:logs` - Ver logs del sistema (ADMIN) - *Pendiente de implementación*

---

## 💻 Uso del Sistema de Permisos en el Código

### Frontend

#### Usando PermissionGuard Component

```tsx
import PermissionGuard from '@/components/auth/PermissionGuard';

// Ocultar botón si no tiene permiso
<PermissionGuard requiredPermission="inventario:crear">
  <Button onClick={handleCreate}>Crear Item</Button>
</PermissionGuard>

// Requiere cualquiera de los permisos
<PermissionGuard 
  requiredPermissions={['inventario:editar', 'inventario:eliminar']}
  requireAll={false}
>
  <Button>Acción</Button>
</PermissionGuard>

// Requiere todos los permisos
<PermissionGuard 
  requiredPermissions={['inventario:editar', 'inventario:asignar']}
  requireAll={true}
>
  <Button>Acción Compleja</Button>
</PermissionGuard>
```

#### Usando useRolePermissions Hook

```tsx
import { useRolePermissions } from '@/hooks/useRolePermissions';

function MyComponent() {
  const { 
    hasPermission, 
    canCreate, 
    canEdit, 
    canDelete,
    canApprove 
  } = useRolePermissions();

  // Verificar permiso específico
  if (hasPermission('inventario:crear')) {
    // ...
  }

  // Usar funciones de conveniencia
  if (canCreate('inventario')) {
    // ...
  }

  // Verificar múltiples permisos
  if (canEdit('espacios') && canManageState('espacios')) {
    // ...
  }

  return (
    <div>
      {canApprove('solicitudes_inventario') && (
        <Button onClick={handleApprove}>Aprobar</Button>
      )}
    </div>
  );
}
```

### Backend

#### Usando @PreAuthorize

```java
@RestController
@RequestMapping("/api/v1/inventario")
public class InventarioItemController {

    @PostMapping
    @PreAuthorize("hasRole('" + ROLE_ADMIN + "') or hasRole('" + ROLE_MANTENIMIENTO + "')")
    public ResponseEntity<ApiResponse<InventarioItem>> createInventarioItem(
        @Valid @RequestBody InventarioItemCreateDto dto
    ) {
        // Solo ADMIN y MANTENIMIENTO pueden crear
    }

    @GetMapping
    @PreAuthorize("hasRole('" + ROLE_ADMIN + "') or hasRole('" + ROLE_ANALISTA + "') or hasRole('" + ROLE_MANTENIMIENTO + "')")
    public ResponseEntity<ApiResponse<List<InventarioItem>>> getAllInventarioItems() {
        // ADMIN, ANALISTA y MANTENIMIENTO pueden ver
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('" + ROLE_ADMIN + "')")
    public ResponseEntity<ApiResponse<Void>> deleteInventarioItem(@PathVariable Long id) {
        // Solo ADMIN puede eliminar
    }
}
```

### Estructura de Archivos

```
frontend/src/
├── lib/config/
│   ├── permissions.ts          # Definición de todos los permisos granulares
│   ├── permissions-map.ts      # Mapeo de permisos por componente
│   └── constants.ts            # Configuración de roles y rutas
├── components/auth/
│   ├── PermissionGuard.tsx     # Componente para control de UI
│   └── RoleGuard.tsx           # Componente para control de rutas
└── hooks/
    └── useRolePermissions.ts   # Hook para verificar permisos
```

---

## 📝 Notas Importantes

1. **ADMIN** es el único rol con acceso a la vista de Sistema (`/system`)
2. **ANALISTA** tiene autoridad completa sobre reservas (CRUD), puede ver espacios/inventario pero no gestionarlos
3. **ANALISTA** puede crear solicitudes de inventario para reservas
4. **MANTENIMIENTO** gestiona completamente espacios e inventario, acepta/rechaza solicitudes de inventario, pero NO puede crear reservas
5. **DOCENTE** puede ver todas las reservas del sistema y solicitar reservas de todo tipo
6. **ESTUDIANTE** solo puede ver reservas del sistema (lectura)
7. **EXTERNO** puede solicitar reservas y ver reservas públicas
8. Todos los roles pueden acceder al Dashboard (con información limitada según rol)
9. El calendario es accesible para todos los roles autenticados (con diferentes niveles de información)

---

## 🔄 Estado de Implementación

### ✅ Implementado

- [x] Sistema de roles básico (ADMIN, ANALISTA, MANTENIMIENTO, DOCENTE, ESTUDIANTE, EXTERNO)
- [x] Control de acceso por rutas (`@PreAuthorize` en backend, `RoleGuard` en frontend)
- [x] **Sistema de permisos granular** (implementado completamente)
  - [x] Archivo `permissions.ts` con todos los permisos granulares definidos
  - [x] Componente `PermissionGuard` para control de UI basado en permisos
  - [x] Hook `useRolePermissions` extendido con funciones de permisos granulares
  - [x] Aplicación de `PermissionGuard` en componentes de inventario, espacios y solicitudes
  - [x] Mapeo de permisos por componente en `permissions-map.ts`
- [x] Solicitudes de inventario para reservas (`ReservaItemSolicitado`)
- [x] Vista de Sistema (solo ADMIN)
- [x] Dashboard con información por rol
- [x] Calendario público
- [x] Estadísticas de inventario
- [x] Exportar inventario (CSV, PDF)
- [x] Ver inventario de espacios
- [x] Soft delete en todos los modelos
- [x] **Rol MANTENIMIENTO completamente implementado**
  - [x] Backend: `@PreAuthorize` actualizado en controladores
  - [x] Frontend: Permisos configurados y aplicados
  - [x] Controladores actualizados: `InventarioItemController`, `EspacioController`, `TipoElementoController`, `TipoEspacioController`, `ReservaItemSolicitadoController`

### 🚧 Parcialmente Implementado

- [ ] Solicitudes de reserva diferenciadas (DOCENTE/EXTERNO deberían crear con PENDIENTE)
- [ ] Estadísticas de reservas (componente existe pero no está integrado en `/statistics`)
- [ ] Reservas públicas vs privadas (no hay campo `publica`, todas son visibles según rol)

### ❌ No Implementado

- [ ] Endpoint separado para "solicitar" vs "crear" reservas
- [ ] Auditoría de acciones por rol
- [ ] Exportar reportes de reservas

## 🔄 Actualizaciones Futuras

- [ ] Implementar endpoint para solicitar reservas (estado PENDIENTE para DOCENTE/EXTERNO)
- [ ] Agregar campo `publica` a reservas para diferenciar públicas/privadas
- [ ] Implementar auditoría de acciones por rol
- [ ] Integrar `ReservationStats` en la vista de estadísticas
- [ ] Implementar filtros de estadísticas por rol

---

## 🔄 Cambios Recientes

### ✅ Sistema de Permisos Granular Implementado (2024)

Se ha implementado completamente el sistema de permisos granular en el frontend y backend:

#### Frontend

**Archivos creados:**
- `frontend/src/lib/config/permissions.ts`: Define todos los permisos granulares por rol
- `frontend/src/components/auth/PermissionGuard.tsx`: Componente para controlar visibilidad de UI basado en permisos
- `frontend/src/hooks/useRolePermissions.ts`: Hook extendido con funciones de verificación de permisos granulares
- `frontend/src/lib/config/permissions-map.ts`: Documentación de permisos requeridos por componente

**Permisos implementados:**
- **Inventario**: `crear`, `leer`, `editar`, `eliminar`, `asignar`, `exportar`, `importar`, `gestionar_estado`
- **Espacios**: `crear`, `leer`, `editar`, `eliminar`, `gestionar_estado`
- **Reservas**: `crear`, `leer`, `editar`, `eliminar`, `aprobar`, `cancelar`, `solicitar`
- **Solicitudes de Inventario**: `crear`, `leer`, `aprobar`, `rechazar`, `entregar`
- **Tipos**: `tipos_elemento:crear/leer/editar/eliminar`, `tipos_espacio:crear/leer/editar/eliminar` (ANALISTA solo tiene `leer` para ver tipos al crear solicitudes/reservas)
- **Estadísticas**: `ver`, `exportar`, `ver:reservas`, `ver:inventario`, `ver:espacios`
- **Sistema**: `acceder`, `configurar`, `logs`
- **Usuarios**: `gestionar`, `ver`
- **Carreras**: `gestionar`

**Componentes actualizados con PermissionGuard:**
- `InventoryManagement.tsx`: Botones de crear, importar, exportar
- `InventoryTable.tsx`: Botones de editar, eliminar, asignar
- `InventoryCardView.tsx`: Botones de editar, eliminar, asignar
- `BulkActionsBar.tsx`: Acciones masivas (asignar, exportar, cambiar estado)
- `InventoryRequestsManagement.tsx`: Botones de aprobar, rechazar, entregar, asignar
- `InventoryRequestsCardView.tsx`: Botón de entregar
- `SpacesManagement.tsx`: Botones de crear, exportar, gestionar tipos
- `SpaceTable.tsx`: Botones de editar, eliminar
- `SpaceCard.tsx`: Botón de editar

**Funciones del hook `useRolePermissions`:**
- `hasPermission(permission)`: Verifica un permiso específico
- `hasAnyPermission(permissions[])`: Verifica si tiene alguno de los permisos
- `hasAllPermissions(permissions[])`: Verifica si tiene todos los permisos
- `canCreate(resource)`, `canRead(resource)`, `canEdit(resource)`, `canDelete(resource)`: Funciones de conveniencia por recurso
- `canApprove(resource)`, `canCancel(resource)`, `canRequest(resource)`, etc.: Funciones específicas por acción
- `canAccessFeature(feature)`: Mapeo de funcionalidades a permisos

#### Backend

**Controladores actualizados con `@PreAuthorize`:**

1. **`InventarioItemController`**:
   - `createInventarioItem`: `ROLE_ADMIN`, `ROLE_MANTENIMIENTO`
   - `getAllInventarioItems`, `getInventarioItemById`, etc. (GET): `ROLE_ADMIN`, `ROLE_ANALISTA`, `ROLE_MANTENIMIENTO`
   - `updateInventarioItem`: `ROLE_ADMIN`, `ROLE_MANTENIMIENTO`
   - `deleteInventarioItem`: `ROLE_ADMIN`

2. **`EspacioController`**:
   - `createEspacio`: `ROLE_ADMIN`, `ROLE_MANTENIMIENTO`
   - `getAllEspacios`, `getEspacioById`, etc. (GET): `isAuthenticated()` (todos los usuarios autenticados)
   - `updateEspacio`: `ROLE_ADMIN`, `ROLE_MANTENIMIENTO`
   - `deleteEspacio`: `ROLE_ADMIN`
   - `getEspacioStats`: `ROLE_ADMIN`, `ROLE_ANALISTA`, `ROLE_MANTENIMIENTO`

3. **`TipoElementoController`**:
   - `createTipoElemento`: `ROLE_ADMIN`, `ROLE_MANTENIMIENTO`
   - `getAllTiposElemento`, etc. (GET): `ROLE_ADMIN`, `ROLE_ANALISTA`, `ROLE_MANTENIMIENTO`
   - `updateTipoElemento`: `ROLE_ADMIN`, `ROLE_MANTENIMIENTO`
   - `deleteTipoElemento`: `ROLE_ADMIN`

4. **`TipoEspacioController`**:
   - `createTipoEspacio`: `ROLE_ADMIN`, `ROLE_MANTENIMIENTO`
   - `getAllTiposEspacio`, etc. (GET): `ROLE_ADMIN`, `ROLE_ANALISTA`, `ROLE_MANTENIMIENTO`
   - `updateTipoEspacio`: `ROLE_ADMIN`, `ROLE_MANTENIMIENTO`
   - `deleteTipoEspacio`: `ROLE_ADMIN`

5. **`ReservaItemSolicitadoController`**:
   - `listarSolicitudes` (GET): `ROLE_ADMIN`, `ROLE_ANALISTA`, `ROLE_MANTENIMIENTO`
   - `actualizarSolicitud` (PATCH): `ROLE_ADMIN`, `ROLE_MANTENIMIENTO`

#### Beneficios de la Implementación

1. **Control granular**: Cada acción en la UI está protegida por permisos específicos
2. **Consistencia**: Los permisos del frontend coinciden con los del backend
3. **Mantenibilidad**: Fácil agregar nuevos permisos o modificar existentes
4. **Seguridad**: Doble capa de protección (frontend oculta UI, backend valida requests)
5. **UX mejorada**: Los usuarios solo ven las acciones que pueden realizar

### ✅ Agregado Rol MANTENIMIENTO
- Nuevo rol especializado en gestión de espacios e inventario
- ANALISTA ya no gestiona espacios/inventario (solo reservas)
- MANTENIMIENTO tiene permisos completos de espacios e inventario (excepto eliminar)
- MANTENIMIENTO puede ver reservas para conocer ocupación pero no gestionarlas
- MANTENIMIENTO puede aprobar/rechazar/entregar solicitudes de inventario

---

## 📋 Detalles Técnicos de Implementación

### Solicitudes de Inventario

**Modelo**: `ReservaItemSolicitado`
- Se vincula a una `Reserva` mediante `reserva_id`
- Estados: `PENDIENTE`, `APROBADO`, `RECHAZADO`, `ENTREGADO`
- Se crean junto con la reserva (campo `itemsSolicitados` en `ReservaCreateDto`)
- Endpoint: `/api/v1/reservas/items-solicitados`
- Vista frontend: `/inventory/requests`

**Flujo**:
1. ANALISTA crea reserva con `itemsSolicitados` → Estado: PENDIENTE
2. MANTENIMIENTO ve solicitudes en `/inventory/requests`
3. MANTENIMIENTO aprueba/rechaza → Cambia estado
4. Si se aprueba, puede asignar item de inventario existente

### Estados de Reserva

**Modelo**: `Reserva.EstadoReserva`
- `PENDIENTE`: Reserva solicitada, esperando aprobación
- `APROBADO`: Reserva aprobada y activa
- `CANCELADO`: Reserva cancelada

**Quién crea con qué estado**:
- ADMIN/ANALISTA: Crean directamente con `APROBADO`
- DOCENTE/EXTERNO: Deberían crear con `PENDIENTE` (requiere implementación)

### Soft Delete

Todos los modelos principales usan **soft delete**:
- `Usuario.deletedAt`
- `Espacio.deletedAt`
- `InventarioItem.deletedAt`
- `ReservaItemSolicitado.deletedAt`
- `Carrera.deletedAt`
- `TipoElemento.deletedAt`
- `TipoEspacio.deletedAt`

Los items con `deletedAt != null` no se muestran en las consultas normales.

### Vista de Sistema

**Ruta**: `/system` (solo ADMIN)

**Componentes**:
- `OverviewTab`: Métricas generales, salud del sistema
- `PerformanceTab`: CPU, memoria, threads, rendimiento
- `ActivityTab`: Actividad HTTP, endpoints, usuarios activos
- `DatabaseLogsTab`: Logs de base de datos y aplicación

**Endpoints utilizados**:
- `/actuator/health`
- `/actuator/info`
- `/actuator/metrics`
- `/actuator/httptrace`
- `/actuator/mappings`
- `/actuator/loggers`

### Estadísticas

**Vista actual**: `/statistics`
- Componente principal: `InventoryStats` (inventario y espacios)
- Componente disponible pero no integrado: `ReservationStats` (reservas)

**Filtros disponibles**:
- Por espacio
- Por tipo de elemento
- Por estado (DISPONIBLE, MANTENIMIENTO, DANADO)

**Exportación**:
- PDF: `exportInventoryStatsToPDF()`
- CSV: `exportInventarioToCSV()`

### Dashboard

**Ruta**: `/dashboard` (todos los roles)

**Componentes**:
- `DashboardStats`: Estadísticas principales (reservas hoy, espacios disponibles, etc.)
- `UpcomingReservations`: Próximas reservas (con filtro "Mis reservas")
- `DashboardCharts`: Gráficos de reservas (por estado, por día, espacios más usados)
- `QuickActions`: Acciones rápidas (nueva reserva, ver calendario, gestionar espacios)

**Información por rol**:
- ADMIN/ANALISTA: Estadísticas completas, todas las reservas
- MANTENIMIENTO: Estadísticas de espacios/inventario
- DOCENTE/ESTUDIANTE/EXTERNO: Información general, próximas reservas

---

---

## 🔄 Implementación Exhaustiva de Protección de Permisos - Diciembre 2024

### Resumen de Cambios

Se realizó una implementación exhaustiva de protección de permisos en toda la aplicación, cubriendo todos los componentes del frontend y endpoints del backend. Esta implementación asegura que cada acción, botón y función esté protegida según los permisos granulares definidos.

### Componentes Frontend Protegidos

#### 1. Componentes de Reservas
- ✅ **ReservationManagement.tsx**: Botón "Nueva Reserva" protegido con `reservas:crear` o `reservas:solicitar`
- ✅ **ReservationTableView.tsx**: 
  - Botón "Crear reserva" en EmptyState protegido
  - Botón "Ver Detalles" protegido con `reservas:leer`
  - Botón "Cancelar" protegido con `reservas:cancelar`
- ✅ **ReservationCardView.tsx**: Mismos permisos que ReservationTableView
- ✅ **ReservationFormDialog.tsx**: Botón submit protegido con `reservas:crear` o `reservas:solicitar`

#### 2. Componentes de Usuarios
- ✅ **UserManagement.tsx**:
  - Botón "Exportar CSV" protegido con `usuarios:gestionar`
  - Botones "Editar" protegidos con `usuarios:gestionar`
  - Botones "Cambiar Rol" protegidos con `usuarios:gestionar`
  - Switch de activar/desactivar protegido con `usuarios:gestionar`
  - Botón "Reenviar Verificación" protegido con `usuarios:gestionar`
  - Botón "Restablecer Contraseña" protegido con `usuarios:gestionar`
- ✅ **EditUserDialog.tsx**: Botón "Guardar Cambios" protegido con `usuarios:gestionar`

#### 3. Componentes de Tipos de Espacio
- ✅ **TipoEspacioManagement.tsx**:
  - Botón "Crear Tipo" protegido con `tipos_espacio:crear`
  - Botones "Editar" protegidos con `tipos_espacio:editar`
  - Botones "Eliminar" protegidos con `tipos_espacio:eliminar`
- ✅ **TipoEspacioFormDialog.tsx**: Botón submit protegido dinámicamente (`tipos_espacio:crear` o `tipos_espacio:editar`)

#### 4. Componentes de Espacios - Detalles
- ✅ **SpaceDetails.tsx**:
  - Botón "Editar Espacio" protegido con `espacios:editar`
  - Botón "Eliminar Espacio" protegido con `espacios:eliminar`
  - Botón "Agregar Elemento" protegido con `inventario:crear`
  - Botones "Editar Inventario" protegidos con `inventario:editar`
  - Botones "Eliminar Inventario" protegidos con `inventario:eliminar`
  - Columna "Acciones" en tabla protegida con `inventario:editar` o `inventario:eliminar`

#### 5. Componentes de Estadísticas y Dashboard
- ✅ **InventoryStats.tsx**: Botón "Exportar PDF" protegido con `estadisticas:exportar`
- ✅ **QuickActions.tsx**: 
  - Botón "Nueva Reserva" protegido con `reservas:crear` o `reservas:solicitar`
  - Botón "Gestionar Espacios" protegido con `espacios:leer`
  - Botón "Ver Estadísticas" protegido con `estadisticas:ver`

#### 6. Diálogos de Formularios
- ✅ **InventoryFormDialog.tsx**: Botón submit protegido dinámicamente (`inventario:crear` o `inventario:editar`)
- ✅ **ImportCSVDialog.tsx**: Botón "Importar" protegido con `inventario:importar`
- ✅ **InventarioFormDialog.tsx** (en spaces): Botón submit protegido dinámicamente (`inventario:crear` o `inventario:editar`)

### Controladores Backend Actualizados

#### 1. ReservaController.java
- ✅ Todos los endpoints actualizados para usar constantes de `Constants.java`
- ✅ Todos los `@PreAuthorize` ahora usan `ROLE_ADMIN`, `ROLE_ANALISTA` en lugar de strings literales
- ✅ Endpoints protegidos:
  - `POST /api/v1/reservas` - Crear reserva
  - `GET /api/v1/reservas/mis-reservas` - Ver mis reservas
  - `GET /api/v1/reservas/mis-reservas/paged` - Ver mis reservas paginadas
  - `GET /api/v1/reservas/{id}` - Ver reserva por ID
  - `PUT /api/v1/reservas/{id}` - Actualizar reserva
  - `DELETE /api/v1/reservas/{id}` - Cancelar reserva
  - `GET /api/v1/reservas/espacio/{espacioId}` - Ver reservas por espacio
  - `GET /api/v1/reservas/mis-reservas/stats` - Estadísticas personales

#### 2. StatsController.java
- ✅ Todos los endpoints actualizados para usar constantes de `Constants.java`
- ✅ `GET /api/v1/stats/active-users` - Solo ADMIN (usando `ROLE_ADMIN`)
- ✅ `GET /api/v1/stats/inventario/detailed` - ADMIN, ANALISTA, MANTENIMIENTO (usando constantes)

### Alineación Frontend-Backend

#### Verificación de Consistencia
- ✅ Todos los permisos del frontend tienen su equivalente en el backend
- ✅ Los roles usados en `@PreAuthorize` coinciden con los permisos definidos en `permissions.ts`
- ✅ Las constantes de roles se usan consistentemente en todo el backend

#### Mapeo de Permisos Frontend-Backend

| Permiso Frontend | Endpoint Backend | Roles Permitidos |
|------------------|------------------|------------------|
| `reservas:crear` | `POST /api/v1/reservas` | ADMIN, ANALISTA |
| `reservas:leer` | `GET /api/v1/reservas/{id}` | ADMIN, ANALISTA |
| `reservas:cancelar` | `DELETE /api/v1/reservas/{id}` | ADMIN, ANALISTA |
| `usuarios:gestionar` | `PUT /api/v1/usuarios/{id}` | ADMIN |
| `usuarios:gestionar` | `PUT /api/v1/usuarios/{id}/rol` | ADMIN |
| `usuarios:gestionar` | `PUT /api/v1/usuarios/{id}/toggle-activo` | ADMIN |
| `tipos_espacio:crear` | `POST /api/v1/tipos-espacio` | ADMIN, MANTENIMIENTO |
| `tipos_espacio:editar` | `PUT /api/v1/tipos-espacio/{id}` | ADMIN, MANTENIMIENTO |
| `tipos_espacio:eliminar` | `DELETE /api/v1/tipos-espacio/{id}` | ADMIN |
| `espacios:editar` | `PUT /api/v1/espacios/{id}` | ADMIN, MANTENIMIENTO |
| `espacios:eliminar` | `DELETE /api/v1/espacios/{id}` | ADMIN |
| `inventario:crear` | `POST /api/v1/inventario` | ADMIN, MANTENIMIENTO |
| `inventario:editar` | `PUT /api/v1/inventario/{id}` | ADMIN, MANTENIMIENTO |
| `inventario:eliminar` | `DELETE /api/v1/inventario/{id}` | ADMIN |
| `inventario:importar` | `POST /api/v1/inventario/import` | ADMIN, MANTENIMIENTO |
| `estadisticas:exportar` | `GET /api/v1/stats/inventario/detailed` | ADMIN, ANALISTA, MANTENIMIENTO |

### Archivos Modificados

#### Frontend (16 archivos)
1. `frontend/src/components/reservations/ReservationManagement.tsx`
2. `frontend/src/components/reservations/ReservationTableView.tsx`
3. `frontend/src/components/reservations/ReservationCardView.tsx`
4. `frontend/src/components/reservations/ReservationFormDialog.tsx`
5. `frontend/src/components/users/UserManagement.tsx`
6. `frontend/src/components/users/EditUserDialog.tsx`
7. `frontend/src/components/spaces/TipoEspacioManagement.tsx`
8. `frontend/src/components/spaces/TipoEspacioFormDialog.tsx`
9. `frontend/src/components/spaces/SpaceDetails.tsx`
10. `frontend/src/components/statistics/InventoryStats.tsx`
11. `frontend/src/components/dashboard/QuickActions.tsx`
12. `frontend/src/components/inventory/InventoryFormDialog.tsx`
13. `frontend/src/components/inventory/ImportCSVDialog.tsx`
14. `frontend/src/components/spaces/InventarioFormDialog.tsx`

#### Backend (2 archivos)
1. `backend/src/main/java/com/utec/backend/controller/ReservaController.java`
2. `backend/src/main/java/com/utec/backend/controller/StatsController.java`

### Mejoras Implementadas

1. **Consistencia en el Backend**: Todos los controladores ahora usan constantes de `Constants.java` en lugar de strings literales
2. **Protección Granular**: Cada botón y acción está protegido con el permiso específico necesario
3. **Alineación Completa**: Los permisos del frontend están perfectamente alineados con los del backend
4. **Mantenibilidad**: El uso de constantes facilita el mantenimiento y reduce errores
5. **Seguridad Mejorada**: No hay acciones accesibles sin los permisos correctos

### Criterios de Éxito Cumplidos

- ✅ Todos los botones de acción en el frontend están protegidos con `PermissionGuard`
- ✅ Todos los endpoints del backend tienen `@PreAuthorize` apropiado
- ✅ Los permisos del frontend y backend están alineados
- ✅ No hay acciones accesibles sin los permisos correctos
- ✅ La documentación está actualizada con todos los cambios

---

**Última actualización:** Sistema de permisos granular implementado completamente - Diciembre 2024

