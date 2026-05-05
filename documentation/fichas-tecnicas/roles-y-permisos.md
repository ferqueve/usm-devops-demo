# Ficha técnica · Roles y Permisos

## 1. Resumen ejecutivo

UTEC Space Manager organiza el acceso a sus funcionalidades alrededor de **seis roles**: ADMIN, ANALISTA, MANTENIMIENTO, DOCENTE, ESTUDIANTE y EXTERNO. Cada rol determina qué módulos puede ver una persona y qué acciones puede realizar (crear reservas, gestionar espacios, aprobar solicitudes, etc.).

El control de acceso es **central y declarativo**: existe un único archivo en el código que define qué puede hacer cada rol, y el resto del sistema consulta ese archivo en cada operación. Esto garantiza que el comportamiento sea consistente entre el frontend, el backend y el panel de administración.

---

## 2. Cómo se usa

Para una vista orientada al usuario final ("¿qué puede hacer cada rol en la aplicación?"), ver el manual de usuario, capítulo 4 ("Roles y Permisos") y la sección "Áreas accesibles por rol".

A grandes rasgos:

| Rol | Resumen de capacidades |
|---|---|
| **ADMIN** | Acceso total al sistema. Único rol que puede gestionar usuarios y acceder a Auditoría y Sistema. |
| **ANALISTA** | Foco en gestión de reservas: crea, aprueba, edita, cancela. Ve espacios, inventario, estadísticas y carreras. Puede subir archivos y consultar recomendaciones. |
| **MANTENIMIENTO** | Foco en infraestructura: gestiona espacios, inventario y tipos (alta, baja, modificación). Aprueba solicitudes de inventario, gestiona el estado de las recomendaciones de mantenimiento, accede a recomendaciones de compras. |
| **DOCENTE** | Crea reservas (que entran como solicitudes pendientes de aprobación), ve sus reservas y las del sistema, ve espacios, recibe recomendaciones. |
| **ESTUDIANTE** | Solo lectura: ve reservas, espacios, tipos, carreras y estadísticas básicas. |
| **EXTERNO** | Similar a DOCENTE pero más limitado: puede solicitar reservas y ver las propias y las públicas. No accede a recomendaciones. |

### Cómo se aplica el control en la práctica

- Cuando un usuario inicia sesión, el sistema le asigna un rol (almacenado en el campo `rolApp` del usuario).
- En cada petición al backend, los endpoints declaran qué permiso requieren mediante anotaciones `@PreAuthorize("hasPermission(...)")`.
- Spring Security consulta el mapeo central de roles a permisos y autoriza o rechaza la petición.
- En el frontend, los componentes de navegación y los botones se ocultan cuando el usuario no tiene el permiso correspondiente, para que la interfaz refleje las capacidades reales de su rol.

---

## 3. Detalle técnico

### 3.1 Fuente de verdad

El mapeo entre roles y permisos vive en:

```
backend/src/main/java/com/utec/backend/security/RolePermissions.java
```

Esta clase mantiene un `Map<String, Set<String>>` inmutable. Si se necesita modificar los permisos de un rol o agregar uno nuevo, **este es el único archivo a tocar**.

ADMIN se modela con un comodín especial `"*"` que satisface cualquier verificación de permiso (más el permiso explícito `auditoria:ver`, listado por documentación).

### 3.2 Componentes que participan en la autorización

| Componente | Responsabilidad |
|---|---|
| `Constants.java` | Constantes con los nombres de los roles (`ROLE_ADMIN`, `ROLE_ANALISTA`, etc.). |
| `RolePermissions.java` | **Fuente de verdad** del mapeo rol → permisos. |
| `CustomPermissionEvaluator.java` | Implementación de `PermissionEvaluator` de Spring Security. Resuelve `hasPermission(...)` en las anotaciones `@PreAuthorize` consultando `RolePermissions`. |
| `MethodSecurityConfig.java` | Habilita `@EnableMethodSecurity` y registra `CustomPermissionEvaluator`. |
| `SecurityConfig.java` | Define la configuración HTTP: rutas públicas, rutas protegidas, restricciones específicas por rol a nivel de URL (por ejemplo `/api/v1/stats/inventario/detailed` restringido a ADMIN y MANTENIMIENTO). |
| `Usuario.RolApp` | Enum del modelo de usuario que define los seis valores posibles del rol. |

### 3.3 Formato de los permisos

Los strings de permiso siguen el patrón `recurso:accion`, en singular y con guion bajo cuando la acción es compuesta:

```
reserva:crear
reserva:ver_propias
reserva:ver_todas
inventario:editar
solicitud_inventario:aprobar
recomendacion:gestionar_estado
estadisticas:ver_reservas
```

### 3.4 Flujo de una petición autorizada

1. El cliente envía una petición HTTP con su JWT en el header `Authorization`.
2. El filtro JWT (`backend/.../security/jwt/`) valida el token y carga el usuario.
3. `CustomUserDetailsService` arma el `UserDetails` con su rol.
4. La petición llega al controlador, donde la anotación `@PreAuthorize("hasPermission(null, 'reserva:crear')")` (o similar) se evalúa antes de invocar el método.
5. `CustomPermissionEvaluator` consulta `RolePermissions.hasPermission(rol, permiso)`.
6. Si el rol tiene `"*"` o el permiso específico, la petición avanza. Si no, se devuelve `403 Forbidden`.

### 3.5 Mapa completo de permisos por rol

#### ADMIN

`*` (acceso total) + `auditoria:ver` (declarado explícitamente).

Es el único rol con acceso a Auditoría, gestión de Usuarios, panel de Sistema, Actuator y Swagger UI.

#### ANALISTA

```
reserva:crear, reserva:ver_propias, reserva:ver_todas, reserva:editar,
reserva:cancelar, reserva:aprobar
espacio:ver
inventario:ver
tipo:ver
carrera:ver, carrera:crear, carrera:editar, carrera:eliminar
estadisticas:ver, estadisticas:ver_reservas
recomendacion:ver, recomendacion:solicitar, recomendacion:ver_estadisticas
usuario:ver_analistas
archivo:subir, archivo:ver
```

#### MANTENIMIENTO

```
reserva:ver_todas
espacio:ver, espacio:crear, espacio:editar, espacio:eliminar
inventario:ver, inventario:crear, inventario:editar, inventario:eliminar, inventario:asignar
tipo:ver, tipo:crear, tipo:editar, tipo:eliminar
solicitud_inventario:ver, solicitud_inventario:aprobar
estadisticas:ver, estadisticas:ver_inventario, estadisticas:ver_espacios
recomendacion:gestionar_estado, recomendacion:gestionar_asignaciones, recomendacion:ver_compras
archivo:subir, archivo:ver
```

#### DOCENTE

```
reserva:crear, reserva:ver_propias, reserva:ver_todas, reserva:cancelar
espacio:ver
tipo:ver
carrera:ver
recomendacion:ver, recomendacion:solicitar
usuario:ver_analistas
archivo:ver
```

> Las reservas creadas por DOCENTE entran con estado **PENDIENTE** (lo aplica `ReservaController` según el rol del usuario), aunque el permiso `reserva:crear` sea el mismo string que utiliza ANALISTA. La diferencia entre "crear directamente" y "crear como solicitud" es lógica del controlador, no de los permisos.

#### ESTUDIANTE

```
reserva:ver_todas
espacio:ver
tipo:ver
carrera:ver
estadisticas:ver
archivo:ver
```

#### EXTERNO

```
reserva:crear, reserva:ver_propias, reserva:ver_todas, reserva:cancelar
espacio:ver
tipo:ver
carrera:ver
archivo:ver
```

> Igual que DOCENTE, las reservas de EXTERNO entran con estado PENDIENTE. EXTERNO no tiene permisos de recomendaciones.

### 3.6 Tabla cruzada por permiso

Resumen de qué roles tienen cada permiso. ADMIN aparece en todos por su comodín `"*"` aunque no se liste explícitamente.

| Permiso | ANALISTA | MANTENIMIENTO | DOCENTE | ESTUDIANTE | EXTERNO |
|---|:-:|:-:|:-:|:-:|:-:|
| `reserva:crear` | ✓ | | ✓ | | ✓ |
| `reserva:ver_propias` | ✓ | | ✓ | | ✓ |
| `reserva:ver_todas` | ✓ | ✓ | ✓ | ✓ | ✓ |
| `reserva:editar` | ✓ | | | | |
| `reserva:cancelar` | ✓ | | ✓ | | ✓ |
| `reserva:aprobar` | ✓ | | | | |
| `espacio:ver` | ✓ | ✓ | ✓ | ✓ | ✓ |
| `espacio:crear` | | ✓ | | | |
| `espacio:editar` | | ✓ | | | |
| `espacio:eliminar` | | ✓ | | | |
| `inventario:ver` | ✓ | ✓ | | | |
| `inventario:crear/editar/eliminar/asignar` | | ✓ | | | |
| `tipo:ver` | ✓ | ✓ | ✓ | ✓ | ✓ |
| `tipo:crear/editar/eliminar` | | ✓ | | | |
| `carrera:ver` | ✓ | | ✓ | ✓ | ✓ |
| `carrera:crear/editar/eliminar` | ✓ | | | | |
| `solicitud_inventario:ver/aprobar` | | ✓ | | | |
| `estadisticas:ver` | ✓ | ✓ | | ✓ | |
| `estadisticas:ver_reservas` | ✓ | | | | |
| `estadisticas:ver_inventario` | | ✓ | | | |
| `estadisticas:ver_espacios` | | ✓ | | | |
| `recomendacion:ver` | ✓ | | ✓ | | |
| `recomendacion:solicitar` | ✓ | | ✓ | | |
| `recomendacion:ver_estadisticas` | ✓ | | | | |
| `recomendacion:gestionar_estado` | | ✓ | | | |
| `recomendacion:gestionar_asignaciones` | | ✓ | | | |
| `recomendacion:ver_compras` | | ✓ | | | |
| `usuario:ver_analistas` | ✓ | | ✓ | | |
| `archivo:subir` | ✓ | ✓ | | | |
| `archivo:ver` | ✓ | ✓ | ✓ | ✓ | ✓ |
| `auditoria:ver` | (solo ADMIN) | | | | |

---

## 4. Métricas / evidencia

- **Roles definidos**: 6 (`ROLE_ADMIN`, `ROLE_ANALISTA`, `ROLE_MANTENIMIENTO`, `ROLE_DOCENTE`, `ROLE_ESTUDIANTE`, `ROLE_EXTERNO`).
- **Permisos individuales declarados**: ~30 strings únicos, agrupados en 11 dominios (reserva, espacio, inventario, tipo, carrera, solicitud_inventario, estadisticas, recomendacion, usuario, archivo, auditoria).
- **Punto único de verdad**: `RolePermissions.java`. Cualquier `@PreAuthorize` del sistema termina consultando este archivo a través de `CustomPermissionEvaluator`.
- **Tests asociados**: ver `backend/src/test/java/com/utec/backend/security/` y los tests de controladores que cubren autorización.

---

## 5. Riesgos, limitaciones y TODOs

### 5.1 Deuda técnica conocida

En el código existen dos artefactos paralelos al sistema oficial de permisos descrito arriba, que **actualmente no son consultados** por las anotaciones `@PreAuthorize`:

- `backend/.../service/PermissionService.java` — declara su propio `Map` de rol → permisos. Solo se usa para inflar las `GrantedAuthority` con prefijo `PERMISSION_` en `CustomUserDetailsService`. Su contenido está desincronizado con `RolePermissions.java`.
- `backend/.../security/Permission.java` — enum con strings con dos puntos (`reserva:ver:todas`) que no coinciden con los strings reales que usan los `@PreAuthorize` (`reserva:ver_todas`).

**Impacto**: ninguno operativo, pero genera ruido a quien lee el código por primera vez. Plan: eliminar `PermissionService` y `Permission` enum en una limpieza dedicada, dejando `RolePermissions.java` como única fuente.

### 5.2 Limitaciones de diseño

- Los permisos están **hardcodeados en código**: para agregar un permiso nuevo o cambiar el mapeo hay que modificar `RolePermissions.java` y desplegar. No existe administración de permisos por base de datos. Esto es una decisión deliberada (simpleza, evitar inconsistencias) pero limita la flexibilidad si en el futuro se necesita personalizar accesos por institución u organización.
- No hay roles compuestos ni herencia de permisos: cada rol declara su propio conjunto.

### 5.3 TODOs

- [ ] Limpieza de `PermissionService.java` y `Permission.java` para dejar solo `RolePermissions.java`.
- [ ] Sumar tests de integración que verifiquen que el mapa cubre todos los permisos referenciados por `@PreAuthorize` en los controladores (detección de "permiso huérfano").
- [ ] Documentar el procedimiento estándar para agregar un permiso nuevo (modificar `RolePermissions`, anotar el endpoint, revisar `useRolePermissions` en frontend, actualizar esta ficha).
