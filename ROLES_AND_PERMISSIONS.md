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
| Ver tipos | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Crear tipos | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ |
| Editar tipos | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ |
| Eliminar tipos | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Reservas** |
| Crear reservas | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Solicitar reservas | ✅ | ✅ | ❌ | ✅ | ❌ | ✅ |
| Ver todas | ✅ | ✅ | ✅* | ✅ | ✅ | ❌ |
| Ver públicas | ✅ | ✅ | ✅* | ✅ | ✅ | ✅ |
| CRUD reservas | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Aprobar/rechazar | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Solicitudes inventario: crear | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Solicitudes inventario: aceptar | ✅ | ❌ | ✅*** | ❌ | ❌ | ❌ |
| **Carreras** |
| Ver carreras | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Gestionar carreras | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Estadísticas** |
| Ver estadísticas | ✅ | ✅**** | ✅***** | ❌ | ❌ | ❌ |
| Exportar reportes | ✅ | ✅**** | ✅***** | ❌ | ❌ | ❌ |
| **Sistema** |
| Vista Sistema | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Configuración | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Logs | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |

*MANTENIMIENTO puede ver reservas para conocer ocupación de espacios  
**DOCENTE/ESTUDIANTE pueden ver todas las reservas del sistema  
***MANTENIMIENTO acepta/rechaza solicitudes de inventario  
****ANALISTA solo estadísticas de reservas  
*****MANTENIMIENTO solo estadísticas de inventario y espacios

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

## 🎯 Permisos Granulares Propuestos

Para implementar el sistema de permisos granular, se propone:

### Permisos de Reservas
- `reserva:crear` - Crear reserva directamente (ADMIN, ANALISTA)
- `reserva:solicitar` - Solicitar reserva (ADMIN, ANALISTA, DOCENTE)
- `reserva:ver:todas` - Ver todas las reservas (ADMIN, ANALISTA)
- `reserva:ver:propias` - Ver propias reservas (DOCENTE)
- `reserva:ver:publicas` - Ver reservas públicas (ESTUDIANTE, EXTERNO)
- `reserva:editar` - Editar reservas (ADMIN, ANALISTA)
- `reserva:eliminar` - Eliminar reservas (ADMIN, ANALISTA)
- `reserva:aprobar` - Aprobar/rechazar (ADMIN, ANALISTA)
- `reserva:cancelar` - Cancelar reservas (ADMIN, ANALISTA, DOCENTE*)

### Permisos de Espacios
- `espacio:crear` - Crear espacios (ADMIN, MANTENIMIENTO)
- `espacio:editar` - Editar espacios (ADMIN, MANTENIMIENTO)
- `espacio:eliminar` - Eliminar espacios (ADMIN)
- `espacio:ver` - Ver espacios (TODOS)
- `espacio:gestionar` - Gestión completa (ADMIN, MANTENIMIENTO)
- `espacio:gestionar_estado` - Cambiar estado (ADMIN, MANTENIMIENTO)

### Permisos de Inventario
- `inventario:crear` - Crear items (ADMIN, MANTENIMIENTO)
- `inventario:editar` - Editar items (ADMIN, MANTENIMIENTO)
- `inventario:eliminar` - Eliminar items (ADMIN)
- `inventario:ver` - Ver inventario (ADMIN, MANTENIMIENTO)
- `inventario:asignar` - Asignar items (ADMIN, MANTENIMIENTO)
- `inventario:gestionar_estado` - Cambiar estado items (ADMIN, MANTENIMIENTO)
- `inventario:importar` - Importar inventario (ADMIN, MANTENIMIENTO)
- `inventario:exportar` - Exportar inventario (ADMIN, MANTENIMIENTO)

### Permisos de Tipos
- `tipo:crear` - Crear tipos elemento/espacio (ADMIN, MANTENIMIENTO)
- `tipo:editar` - Editar tipos (ADMIN, MANTENIMIENTO)
- `tipo:eliminar` - Eliminar tipos (ADMIN)
- `tipo:ver` - Ver tipos (ADMIN, ANALISTA, MANTENIMIENTO)

### Permisos de Usuarios
- `usuario:gestionar` - Gestión completa (ADMIN)

### Permisos de Estadísticas
- `estadisticas:ver` - Ver estadísticas (ADMIN, ANALISTA, MANTENIMIENTO)
- `estadisticas:exportar` - Exportar reportes (ADMIN, ANALISTA, MANTENIMIENTO)
- `estadisticas:ver:reservas` - Ver estadísticas de reservas (ADMIN, ANALISTA)
- `estadisticas:ver:inventario` - Ver estadísticas de inventario (ADMIN, MANTENIMIENTO)
- `estadisticas:ver:espacios` - Ver estadísticas de espacios (ADMIN, MANTENIMIENTO)

### Permisos de Solicitudes
- `solicitud:inventario:crear` - Crear solicitudes de inventario para reservas (ADMIN, ANALISTA)
- `solicitud:inventario:aceptar` - Aceptar solicitudes de inventario (ADMIN, MANTENIMIENTO)
- `solicitud:inventario:rechazar` - Rechazar solicitudes de inventario (ADMIN, MANTENIMIENTO)

### Permisos de Sistema
- `sistema:acceder` - Acceso a vista de Sistema (ADMIN exclusivo)
- `sistema:configurar` - Configurar sistema (ADMIN)
- `sistema:logs` - Ver logs del sistema (ADMIN)

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

- [x] Sistema de roles básico (ADMIN, ANALISTA, DOCENTE, ESTUDIANTE, EXTERNO)
- [x] Control de acceso por rutas (`@PreAuthorize` en backend, `RoleGuard` en frontend)
- [x] Solicitudes de inventario para reservas (`ReservaItemSolicitado`)
- [x] Vista de Sistema (solo ADMIN)
- [x] Dashboard con información por rol
- [x] Calendario público
- [x] Estadísticas de inventario
- [x] Exportar inventario (CSV, PDF)
- [x] Ver inventario de espacios
- [x] Soft delete en todos los modelos

### 🚧 Parcialmente Implementado

- [ ] Sistema de permisos granular (solo control por rol, no por acción específica)
- [ ] Solicitudes de reserva diferenciadas (DOCENTE/EXTERNO deberían crear con PENDIENTE)
- [ ] Estadísticas de reservas (componente existe pero no está integrado en `/statistics`)
- [ ] Reservas públicas vs privadas (no hay campo `publica`, todas son visibles según rol)

### ❌ No Implementado

- [ ] Rol MANTENIMIENTO (existe en documentación, falta en código)
- [ ] Endpoint separado para "solicitar" vs "crear" reservas
- [ ] Permisos granulares por acción (solo permisos por rol)
- [ ] Auditoría de acciones por rol
- [ ] Exportar reportes de reservas

## 🔄 Actualizaciones Futuras

- [ ] Implementar sistema de permisos granular
- [ ] Agregar permisos específicos por acción
- [ ] Implementar endpoint para solicitar reservas (estado PENDIENTE para DOCENTE/EXTERNO)
- [ ] Agregar campo `publica` a reservas para diferenciar públicas/privadas
- [ ] Agregar permisos de exportación diferenciados
- [ ] Implementar auditoría de acciones por rol
- [ ] Agregar rol MANTENIMIENTO al backend y frontend
- [ ] Actualizar SecurityConfig para incluir MANTENIMIENTO
- [ ] Crear usuarios de prueba con rol MANTENIMIENTO
- [ ] Integrar `ReservationStats` en la vista de estadísticas
- [ ] Implementar filtros de estadísticas por rol

---

## 🔄 Cambios Recientes

### Agregado Rol MANTENIMIENTO
- Nuevo rol especializado en gestión de espacios e inventario
- ANALISTA ya no gestiona espacios/inventario (solo reservas)
- MANTENIMIENTO tiene permisos completos de espacios e inventario (excepto eliminar)
- MANTENIMIENTO puede ver reservas para conocer ocupación pero no gestionarlas

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

**Última actualización:** Revisado según código actual - Incluye rol MANTENIMIENTO (2024)

