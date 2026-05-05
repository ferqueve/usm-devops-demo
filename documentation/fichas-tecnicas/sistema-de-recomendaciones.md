# Ficha técnica · Sistema de Recomendaciones

## 1. Resumen ejecutivo

UTEC Space Manager incluye un subsistema de **recomendaciones inteligentes** que sugiere espacios, horarios e ítems al crear reservas, prioriza tareas para personal de mantenimiento y analistas, y propone reasignaciones y compras en base al uso histórico. Las sugerencias se calculan combinando el historial del usuario, patrones temporales, similitud entre espacios y disponibilidad real en tiempo real, y se cachean en Redis para responder rápido durante el flujo normal de la aplicación.

El subsistema es **opcional desde la mirada del usuario** (las sugerencias nunca son obligatorias) pero está integrado profundamente con los servicios de reserva, inventario y asignación de analistas. Está pensado para escalar a ~50 usuarios activos.

---

## 2. Cómo se usa

Esta ficha cubre el detalle técnico. Para la guía orientada al usuario final, ver el manual de usuario, capítulo 16 ("Recomendaciones Inteligentes").

Resumen del flujo end-to-end:

1. El usuario abre un dashboard, un formulario de reserva o una vista de mantenimiento.
2. El frontend (componentes en `frontend/src/components/recomendaciones/` + hook `useRecomendacionesDashboard` / `useRecomendaciones`) hace una llamada GET al endpoint correspondiente.
3. El backend resuelve la respuesta consultando primero el caché Redis; si no está, calcula la recomendación y la guarda en caché.
4. El frontend renderiza la lista de sugerencias con su porcentaje de relevancia.
5. Cuando el usuario crea o cancela una reserva, su caché se invalida.
6. Por la noche, un job recalcula y persiste las top 20 recomendaciones por usuario.

---

## 3. Detalle técnico

### 3.1 Modelo de datos

Entidad `Recomendacion` (`backend/.../model/Recomendacion.java`):

- `id`, `usuario`, `espacio`
- `tipoRecomendacion` (enum, ver abajo)
- `puntaje` (BigDecimal entre 0.0 y 1.0)
- `metadata` (JSON con extras: capacidad, tipoEspacioId, etc.)
- `razon` (texto explicativo)
- `updatedAt`
- Constraint único en BD: `(usuario_id, espacio_id, tipo_recomendacion)`

Enum `TipoRecomendacion`:

```
ESPACIO_PARA_RESERVA, HORARIO_OPTIMO, ESPACIO_SIMILAR,
ITEM_MANTENIMIENTO_URGENTE, ESPACIO_ATENCION,
REASIGNACION_ITEM, COMPRA_NECESARIA,
ITEM_RECOMENDADO_RESERVA, COMBINACION_ITEMS,
ASIGNACION_ANALISTA, RESERVA_PRIORITARIA,
ESPACIO_MEJORA, OPTIMIZACION_RECURSOS
```

### 3.2 Servicios backend

| Servicio | Responsabilidad |
|---|---|
| `RecomendacionService` | Orquestador. Mantiene caché Redis, persiste top 20 en BD, delega a servicios especializados. |
| `RecomendacionReservaService` | Espacios e historial al crear reservas, horarios óptimos, espacios similares. |
| `RecomendacionInventarioService` | Items en mantenimiento, espacios que requieren atención, reasignaciones, compras. |
| `RecomendacionItemService` | Items más solicitados por espacio, combinaciones frecuentes. |
| `RecomendacionAnalistaService` | Asignación analista→docente y reservas prioritarias para analistas. |
| `RecomendacionScheduledService` | Jobs programados (ver §3.5). |

### 3.3 Algoritmos y pesos

**Recomendación de espacios** (`RecomendacionReservaService.obtenerRecomendacionesEspacios`): combinación ponderada de:

- 35% Historial del usuario (frecuencia de reservas en el espacio).
- 25% Similitud (combinación de tipo, capacidad y estado, ver abajo).
- 20% Disponibilidad en tiempo real para el horario solicitado.
- 10% Popularidad global (reservas aprobadas totales).
- 10% Capacidad adecuada (proximidad a la capacidad pedida).

**Similitud entre espacios** (`calcularSimilitudEntreEspacios`): 40% tipo + 30% capacidad + 30% estado.

**Horarios óptimos** (`obtenerHorariosOptimos`): solo entre 8:00 y 20:00, bloques de 2 horas con paso de 1 hora, máximo 10 resultados. Puntaje base **0.5** cuando el usuario no tiene historial para ese horario.

**Combinaciones de items** (`obtenerCombinacionesItems`): pares de items (no n-tuplas) que aparecen juntos en al menos **3** reservas, máximo **5** resultados.

**Asignación de analistas** (`RecomendacionAnalistaService`): 40% historial conjunto con el docente + 30% carga actual + 30% tasa de aprobación. Tasa por defecto **0.5** si el analista no tiene reservas completadas.

**Reasignación de items**: puntaje fijo **0.8** (no se calcula).

**Filtro temporal**: las recomendaciones de espacios consideran únicamente el historial de los **últimos 6 meses** (variable `hace6Meses` en código).

**Urgencia de mantenimiento**: items en estado `MANTENIMIENTO`. Umbrales: > 7 días = baja, > 15 días = media, > 30 días = alta. Items en estado `DANADO` se reportan como parte de "Espacios que requieren atención", no en "Items que requieren mantenimiento".

**Urgencia de reservas pendientes** (analistas): escala 1–10, capeada con `Math.min(urgencia, 10)`.

### 3.4 Caché Redis

| Cache name | TTL | Contenido |
|---|---|---|
| `recomendaciones` | 30 min (1.800.000 ms) | Recomendaciones calculadas por usuario. |
| `recomendaciones:metricas` | 24 h (86.400.000 ms) | Métricas pre-calculadas (preparado, ver §5). |

Configuración en `RedisConfig.java`. Invalidación:

- `ReservaService` invalida la caché del usuario al crear/cancelar reserva (ver llamadas a `cacheManager` en `ReservaService` líneas 246, 753, 1003).
- `InventarioItemService` tiene un hook previsto para invalidar caché al cambiar el estado de un item, pero **el cuerpo del bloque actualmente está vacío** — pendiente de implementar.

### 3.5 Tareas programadas

`RecomendacionScheduledService`:

| Job | Cron | Estado |
|---|---|---|
| Actualización batch nocturna de top 20 | `0 0 2 * * ?` (2:00 AM) | Operativo. Identifica usuarios activos (con reservas en últimos 30 días), calcula recomendaciones, persiste top 20 y refresca caché. |
| Pre-cálculo de métricas pesadas | `0 30 2 * * ?` (2:30 AM) | **Cron agendado pero el cuerpo del método es un no-op** (sólo logs y comentario `"Por ahora, estas métricas se calculan on-demand"`). TODO. |

### 3.6 Endpoints HTTP

Todos bajo `/api/v1/recomendaciones/...`. Cada endpoint declara un permiso del catálogo de permisos del sistema (ver `documentation/fichas-tecnicas/roles-y-permisos.md`).

| Endpoint | Permiso | Roles que lo cumplen |
|---|---|---|
| `GET /reservas/espacios?inicio=&fin=&capacidad=` | `recomendacion:ver` o `recomendacion:solicitar` | DOCENTE, ANALISTA, ADMIN |
| `GET /reservas/horarios?espacioId=&fecha=` | `recomendacion:solicitar` | DOCENTE, ANALISTA, ADMIN |
| `GET /reservas/espacios-similares?espacioId=` | `recomendacion:ver` | DOCENTE, ANALISTA, ADMIN |
| `GET /items/para-reserva?espacioId=` | `recomendacion:solicitar` | DOCENTE, ANALISTA, ADMIN |
| `GET /items/combinaciones?espacioId=` | `recomendacion:solicitar` | DOCENTE, ANALISTA, ADMIN |
| `GET /inventario/mantenimiento` | `recomendacion:gestionar_estado` | MANTENIMIENTO, ADMIN |
| `GET /inventario/espacios-atencion` | `recomendacion:gestionar_estado` | MANTENIMIENTO, ADMIN |
| `GET /inventario/reasignaciones` | `recomendacion:ver_estadisticas` | ANALISTA, ADMIN |
| `GET /inventario/compras` | `recomendacion:ver_compras` | MANTENIMIENTO, ADMIN |
| `GET /analistas/asignacion?docenteId=` | `recomendacion:gestionar_asignaciones` | MANTENIMIENTO, ADMIN |
| `GET /analistas/prioritarias` | `recomendacion:ver_estadisticas` | ANALISTA, ADMIN |
| `GET /dashboard` | autenticado | Todos los roles autenticados (ver §3.7) |

### 3.7 Comportamiento del dashboard por rol

`RecomendacionService.obtenerRecomendacionesDashboard` arma una respuesta distinta según el rol del usuario:

- **DOCENTE**: setea espacios recomendados (no ítems).
- **ANALISTA**: setea reservas prioritarias.
- **MANTENIMIENTO**: setea items urgentes y espacios que requieren atención.
- **ADMIN**: panorama completo.
- **ESTUDIANTE** y **EXTERNO**: dashboard vacío (decisión explícita).

### 3.8 Frontend

`frontend/src/components/recomendaciones/`:

- Componentes base: `RecomendacionCard`, `RecomendacionPanel`, `RecomendacionList`.
- Componentes específicos: `EspaciosRecomendados`, `HorariosRecomendados`, `ItemsRecomendados`, `MantenimientoRecomendaciones`, `AnalistaRecomendado`.
- Hooks: `useRecomendacionesDashboard`, `useRecomendaciones`.

Las recomendaciones aparecen integradas en `ReservationForm.tsx` y `ReservationFormDialog.tsx` después de seleccionar fecha y espacio.

---

## 4. Métricas / evidencia

- **Volumen estimado**: top 20 recomendaciones por usuario activo, ~50 usuarios activos. Persistencia en BD ≈ 100–400 KB total.
- **TTL de caché**: 30 min para recomendaciones de usuario, 24 h para métricas (cuando estén implementadas).
- **Pesos del algoritmo de espacios**: 35/25/20/10/10. Pesos de similitud: 40/30/30. Pesos de asignación de analistas: 40/30/30.
- **Umbral de combinaciones**: ≥ 3 ocurrencias, máximo 5 resultados.
- **Filtro temporal**: últimos 6 meses para historial de reservas.

---

## 5. Riesgos, limitaciones y TODOs

### 5.1 Limitaciones actuales

- **Hook de invalidación incompleto en `InventarioItemService`**: el bloque que debería invalidar el caché de recomendaciones cuando un item cambia de estado tiene cuerpo vacío. Mientras no se implemente, las recomendaciones de mantenimiento se actualizan recién cuando expira el TTL de Redis o corre el batch nocturno.
- **Pre-cálculo de métricas (cron 2:30 AM) no funcional**: el job está agendado pero la lógica está pendiente. Hoy las métricas pesadas se calculan on-demand.
- **Sin recálculo inmediato al crear/cancelar reserva**: solo se invalida el caché del usuario afectado; no se dispara recálculo asíncrono. La próxima vez que el usuario abra el formulario o el dashboard se vuelve a calcular.
- **Pesos hardcodeados**: cualquier ajuste de pesos requiere modificar el código y redeploy.
- **No hay UI para que un usuario desactive las sugerencias**.

### 5.2 Escalabilidad

El subsistema está pensado para ~50 usuarios. Si se escalara a varios cientos:

- El batch nocturno crecería linealmente con la cantidad de usuarios activos.
- La estrategia de "top 20 por usuario × tipo" en BD podría volverse pesada.
- Convendría revisar si los pesos siguen produciendo sugerencias relevantes con más diversidad de usuarios.

### 5.3 TODOs

- [ ] Implementar el cuerpo del cron de pre-cálculo de métricas (2:30 AM) o eliminarlo si se decide que las métricas siempre se calcularán on-demand.
- [ ] Implementar la invalidación de caché en `InventarioItemService` cuando cambia el estado de un item.
- [ ] Externalizar los pesos del algoritmo a configuración (properties o BD) para poder afinarlos sin redeploy.
- [ ] Sumar tests de regresión para los pesos y umbrales documentados en §3.3.
- [ ] Considerar dispararle al usuario un recálculo asíncrono al crear/cancelar reserva, en vez de invalidar y dejar que el próximo request lo recalcule.
