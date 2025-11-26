# Sistema de Recomendaciones Inteligentes

## Arquitectura General

El sistema de recomendaciones inteligentes está diseñado para proporcionar sugerencias contextuales y personalizadas a los usuarios según su rol y comportamiento histórico. Utiliza una arquitectura híbrida que combina:

- **Filtrado basado en contenido**: Recomendaciones basadas en el historial del usuario
- **Filtrado colaborativo**: Recomendaciones basadas en usuarios similares
- **Análisis temporal**: Patrones de horarios y días de semana
- **Disponibilidad en tiempo real**: Considera la disponibilidad actual de recursos

## Componentes del Sistema

### Backend

#### Modelo de Datos

- **Recomendacion**: Entidad principal que almacena recomendaciones persistentes
  - Campos: `id`, `usuario`, `espacio`, `tipoRecomendacion`, `puntaje`, `metadata`, `razon`, `updatedAt`
  - Índices optimizados para búsquedas por usuario y tipo

- **TipoRecomendacion**: Enum que define los tipos de recomendaciones disponibles
  - `ESPACIO_PARA_RESERVA`: Recomendaciones de espacios al crear reserva
  - `HORARIO_OPTIMO`: Recomendaciones de mejores horarios
  - `ESPACIO_SIMILAR`: Espacios similares al preferido
  - `ITEM_MANTENIMIENTO_URGENTE`: Items que necesitan mantenimiento
  - `ESPACIO_ATENCION`: Espacios que requieren atención
  - `REASIGNACION_ITEM`: Items que deberían reasignarse
  - `COMPRA_NECESARIA`: Items que deberían comprarse
  - `ITEM_RECOMENDADO_RESERVA`: Items recomendados para reserva
  - `COMBINACION_ITEMS`: Combinaciones de items frecuentes
  - `ASIGNACION_ANALISTA`: Qué analista asignar
  - `RESERVA_PRIORITARIA`: Reservas que requieren atención prioritaria
  - `ESPACIO_MEJORA`: Espacios que necesitan mejoras
  - `OPTIMIZACION_RECURSOS`: Optimización de uso de recursos

#### Servicios

1. **RecomendacionService**: Servicio principal que coordina todas las recomendaciones
   - Maneja caché Redis
   - Guarda top 20 recomendaciones en BD
   - Delega a servicios especializados

2. **RecomendacionReservaService**: Recomendaciones relacionadas con reservas
   - Espacios recomendados basados en historial
   - Horarios óptimos según patrones temporales
   - Espacios similares por características

3. **RecomendacionInventarioService**: Recomendaciones de inventario y mantenimiento
   - Items que necesitan mantenimiento urgente
   - Espacios que requieren atención
   - Reasignaciones recomendadas
   - Compras necesarias

4. **RecomendacionItemService**: Recomendaciones de items para reservas
   - Items más solicitados por espacio
   - Combinaciones frecuentes de items

5. **RecomendacionAnalistaService**: Recomendaciones para analistas
   - Asignación de analista a docente
   - Reservas prioritarias para analistas

6. **RecomendacionScheduledService**: Tareas programadas
   - Actualización batch nocturna (2 AM)
   - Pre-cálculo de métricas base (2:30 AM)

#### Algoritmos

##### Recomendación de Espacios

El algoritmo calcula un puntaje combinando:

1. **Historial del usuario (35%)**: Frecuencia de reservas en espacios específicos
2. **Similitud (25%)**: Comparación de características (tipo, capacidad, estado)
3. **Disponibilidad (20%)**: Verificación de disponibilidad en tiempo real
4. **Popularidad (10%)**: Número total de reservas aprobadas
5. **Capacidad adecuada (10%)**: Proximidad a la capacidad requerida

##### Recomendación de Horarios

- Analiza patrones temporales del usuario
- Considera horarios frecuentemente usados
- Verifica disponibilidad en tiempo real
- Prioriza horarios con mayor frecuencia histórica

##### Recomendación de Items

- Analiza frecuencia de solicitudes por espacio
- Identifica combinaciones frecuentes
- Considera disponibilidad actual

##### Priorización de Reservas

Calcula urgencia basada en:
- Días pendientes desde creación
- Días hasta inicio de reserva
- Escala de 1-10

### Frontend

#### Componentes Base

- **RecomendacionCard**: Card genérica para mostrar recomendaciones
- **RecomendacionPanel**: Panel contenedor con título y lista
- **RecomendacionList**: Lista de recomendaciones con loading states

#### Componentes Específicos

- **EspaciosRecomendados**: Muestra espacios recomendados para reserva
- **HorariosRecomendados**: Muestra horarios óptimos sugeridos
- **ItemsRecomendados**: Muestra items recomendados para reserva
- **MantenimientoRecomendaciones**: Panel de recomendaciones de mantenimiento
- **AnalistaRecomendado**: Recomendaciones de asignación de analista

#### Hooks

- **useRecomendacionesDashboard**: Hook para obtener recomendaciones del dashboard

## Endpoints API

### Recomendaciones de Reservas

- `GET /api/v1/recomendaciones/reservas/espacios`
  - Params: `inicio`, `fin`, `capacidad` (opcional)
  - Roles: DOCENTE, ANALISTA, ADMIN

- `GET /api/v1/recomendaciones/reservas/horarios`
  - Params: `espacioId`, `fecha`
  - Roles: DOCENTE, ANALISTA, ADMIN

- `GET /api/v1/recomendaciones/reservas/espacios-similares`
  - Params: `espacioId`
  - Roles: DOCENTE, ANALISTA, ADMIN

### Recomendaciones de Inventario

- `GET /api/v1/recomendaciones/inventario/mantenimiento`
  - Roles: MANTENIMIENTO, ADMIN

- `GET /api/v1/recomendaciones/inventario/espacios-atencion`
  - Roles: MANTENIMIENTO, ADMIN

- `GET /api/v1/recomendaciones/inventario/reasignaciones`
  - Roles: ADMIN, ANALISTA

- `GET /api/v1/recomendaciones/inventario/compras`
  - Roles: ADMIN

### Recomendaciones de Items

- `GET /api/v1/recomendaciones/items/para-reserva`
  - Params: `espacioId`
  - Roles: DOCENTE, ANALISTA, ADMIN

- `GET /api/v1/recomendaciones/items/combinaciones`
  - Params: `espacioId`
  - Roles: DOCENTE, ANALISTA, ADMIN

### Recomendaciones de Analistas

- `GET /api/v1/recomendaciones/analistas/asignacion`
  - Params: `docenteId`
  - Roles: ADMIN

- `GET /api/v1/recomendaciones/analistas/prioritarias`
  - Roles: ANALISTA

### Dashboard

- `GET /api/v1/recomendaciones/dashboard`
  - Retorna recomendaciones personalizadas según rol
  - Roles: Todos

## Configuración de Caché

### Redis

- **recomendaciones**: TTL de 30 minutos
  - Almacena recomendaciones calculadas por usuario
  - Se invalida cuando cambian datos relevantes

- **recomendaciones:metricas**: TTL de 24 horas
  - Almacena métricas pre-calculadas
  - Se actualiza en batch nocturno

### Persistencia en BD

- Se guardan las top 20 recomendaciones por usuario en BD
- Permite análisis histórico y recuperación rápida
- Se actualiza en batch nocturno

## Tareas Programadas

### Actualización Batch Nocturna

- **Horario**: 2:00 AM diariamente
- **Proceso**:
  1. Identifica usuarios activos (reservas en últimos 30 días)
  2. Calcula recomendaciones para cada usuario
  3. Guarda top 20 en BD
  4. Actualiza caché Redis

### Pre-cálculo de Métricas

- **Horario**: 2:30 AM diariamente
- **Proceso**:
  1. Pre-calcula métricas pesadas
  2. Almacena en caché de largo plazo
  3. Reduce carga durante horas pico

## Integración con Servicios Existentes

### ReservaService

- Invalida caché de recomendaciones al crear/cancelar reserva
- Actualiza recomendaciones asíncronamente

### InventarioItemService

- Invalida caché cuando cambia estado de item
- Actualiza recomendaciones de mantenimiento

## Consideraciones de Performance

1. **Caché agresivo**: Recomendaciones se cachean por 30 minutos
2. **Cálculos batch**: Métricas pesadas se calculan de noche
3. **Lazy loading**: Solo se calculan para usuarios activos
4. **Límites**: Máximo 20 recomendaciones por tipo
5. **Queries optimizadas**: Índices en BD para búsquedas rápidas

## Escalabilidad

- Diseñado para ~50 usuarios
- Cálculos incrementales
- Solo usuarios activos (últimos 30 días)
- Top 20 persistido en BD (~100-400 KB total)

## Mantenimiento

### Monitoreo

- Revisar logs de tareas programadas
- Verificar uso de caché Redis
- Monitorear tiempos de respuesta de endpoints

### Ajustes

- Modificar pesos de algoritmos en servicios específicos
- Ajustar TTLs de caché según necesidades
- Actualizar criterios de urgencia en RecomendacionAnalistaService

