# Ficha técnica · Sistema de Estadísticas

## 1. Resumen ejecutivo

UTEC Space Manager incorpora un subsistema de **estadísticas y analítica** accesible desde la ruta `/statistics`. La pantalla centraliza indicadores operativos del uso de espacios y del estado del inventario, y los presenta segmentados por dimensiones de interés (tiempo, espacio, carrera, edificio, usuario). La información se ofrece tanto como métricas resumidas (tarjetas y gráficos) como en formato exportable (PDF y CSV), adecuándose al rol del usuario que la consulta (administrador, analista, mantenimiento o docente).

Detrás de la pantalla conviven dos caminos de cálculo: por un lado, las **métricas globales legadas** (totales por estado, tendencias mensuales, ranking de espacios más usados) se calculan en tiempo real contra el modelo transaccional; por otro, las **métricas analíticas** introducidas en esta versión (ocupación, mapa de calor, tasa de cancelación, distribución por carrera y por edificio, ranking de usuarios reservadores) se sirven desde una **capa analítica** propia compuesta por dos tablas de hechos y un proceso ETL nocturno. Esta separación adopta los principios clásicos de la arquitectura OLTP/OLAP — sin requerir un Data Warehouse externo — y permite que las consultas analíticas no degraden el rendimiento de la operación cotidiana.

La elección de mantener la capa analítica en el mismo motor Postgres responde a una decisión deliberada de diseño basada en el volumen actual y en la complejidad operativa aceptable para un sistema universitario de esta escala. Las secciones siguientes documentan las decisiones de modelado, el catálogo de métricas y la justificación de cada componente.

---

## 2. Cómo se usa

Esta ficha cubre el detalle técnico. Para la guía orientada al usuario final, ver el manual de usuario, sección **"12. Estadísticas y Reportes"**.

Flujo end-to-end resumido:

1. El usuario abre `/statistics`. El componente `Statistics` resuelve la vista en función de los permisos del rol activo: ADMIN ve pestañas Reservas e Inventario, ANALISTA ve sólo Reservas, MANTENIMIENTO ve sólo Inventario y DOCENTE accede a una vista personal.
2. La pestaña Reservas dispara una primera llamada a `GET /api/v1/reservas/mis-reservas/stats`. El backend distingue por rol y devuelve estadísticas globales (administradores y analistas) o personales (docentes).
3. La sección **"Métricas avanzadas"** dispara en paralelo cinco llamadas a la capa analítica con el rango temporal seleccionado por el usuario (últimos treinta días, mes actual o año actual). Cada llamada retorna agregaciones pre-calculadas.
4. La pestaña Inventario consume `GET /api/v1/stats/inventario/detailed` con filtros por espacio, tipo de elemento y estado. La respuesta agrupa más de cuarenta indicadores y se cachea cinco minutos en Redis.
5. El usuario puede exportar la información visible a PDF o CSV mediante el menú "Exportar" disponible en cada pestaña.

En paralelo, durante la madrugada, el scheduler `EstadisticasScheduledService` actualiza las tablas de hechos para que el día siguiente las métricas estén listas. La intervención humana en este proceso se limita a inspección de logs y, eventualmente, a la ejecución manual de un *backfill* puntual si se detecta una desviación.

---

## 3. Detalle técnico

### 3.1 Arquitectura analítica

El subsistema sigue el patrón clásico de **separación entre OLTP y OLAP**:

- **Plano transaccional (OLTP)**: tablas `reserva`, `inventario_item`, `espacio`, `carrera`, `edificio`, etc. Optimizadas para escrituras concurrentes y lecturas individuales (ej. ver detalle de una reserva).
- **Plano analítico (OLAP)**: tablas `hechos_reserva_diario` y `hechos_inventario_diario`. Optimizadas para lecturas agregadas sobre grandes volúmenes históricos.

Entre ambos opera un proceso **ETL** (Extract – Transform – Load) que corre todas las noches:

1. **Extract**: el scheduler consulta las tablas OLTP del día (o ventana relevante).
2. **Transform**: aplica `GROUP BY` por las dimensiones del modelo dimensional y deriva métricas calculadas (`COUNT`, `SUM`, `AVG`, lógica condicional sobre cancelaciones, lead time).
3. **Load**: inserta las filas resultantes en las tablas de hechos, idempotentemente (borra y reinserta la ventana para absorber cambios retroactivos).

Las consultas analíticas que sirven la pantalla `/statistics` leen únicamente de la capa OLAP y no impactan al plano transaccional. Esta separación es central al diseño dimensional propuesto por Kimball y permite, entre otras cosas, **preservar la serie histórica** aunque las filas transaccionales sean modificadas o eliminadas.

### 3.2 Modelo dimensional

Se siguen las convenciones de un *star schema* simplificado: las tablas de hechos contienen las **mediciones** (variables numéricas agregables) y referencian a las **dimensiones** del modelo de negocio, que en este caso se reutilizan directamente desde las tablas OLTP (`espacio`, `carrera`, `edificio`, `tipo_elemento`). Esta reutilización es válida porque las dimensiones tienen baja volatilidad y cardinalidad acotada.

#### Tabla `hechos_reserva_diario`

Grano: una fila por la combinación `(fecha × espacio × carrera × estado)`. Cada fila resume todas las reservas que comparten esas cuatro dimensiones en un día calendario.

| Columna | Tipo | Significado |
|---|---|---|
| `fecha` | DATE | Día calendario derivado de `reserva.inicio` (UTC) |
| `espacio_id` | BIGINT | FK lógica a `espacio` |
| `carrera_id` | BIGINT NULL | FK lógica a `carrera` (puede ser nula para reservas no asociadas) |
| `edificio_id` | BIGINT NULL | Denormalizado desde `espacio.edificio_id` para evitar el join en lecturas |
| `estado` | VARCHAR(20) | PENDIENTE / APROBADO / CANCELADO |
| `cant_reservas` | INTEGER | Conteo de reservas (`COUNT(*)`) |
| `horas_totales` | NUMERIC(10,2) | Horas reservadas (`SUM((fin - inicio))` en horas) |
| `cant_canceladas_late` | INTEGER | Cancelaciones realizadas con menos de veinticuatro horas de antelación (proxy de no-show) |
| `lead_time_promedio_dias` | NUMERIC(6,2) | Días promedio entre creación y fecha de inicio |
| `computed_at` | TIMESTAMPTZ | Marca temporal del cómputo |

Restricción de unicidad: `(fecha, espacio_id, COALESCE(carrera_id,-1), estado)`. Índices secundarios sobre `fecha` y `(espacio_id, fecha)` para acelerar los filtros temporales y por espacio.

#### Tabla `hechos_inventario_diario`

Grano: una fila por `(fecha × espacio × tipo_elemento × estado)`. Cada día se toma una **fotografía** del estado del inventario activo.

| Columna | Tipo | Significado |
|---|---|---|
| `fecha` | DATE | Día del snapshot |
| `espacio_id` | BIGINT NULL | NULL identifica items sin asignar |
| `tipo_elemento_id` | BIGINT | FK lógica a `tipo_elemento` |
| `estado` | VARCHAR(30) | DISPONIBLE / MANTENIMIENTO / DANADO |
| `count_items` | INTEGER | Número de filas de inventario |
| `suma_cantidad` | INTEGER | Suma del campo `cantidad` |
| `computed_at` | TIMESTAMPTZ | Marca temporal del cómputo |

Las FKs se modelan como **lógicas** (sin `REFERENCES`) deliberadamente, para que el dato histórico sobreviva al eventual borrado de una fila en la tabla OLTP. Esta es una práctica común en data warehouses, donde la integridad referencial se garantiza por el proceso ETL más que por restricciones declarativas.

Migración: `backend/src/main/resources/db/changelog/cambiosdb/021-create-hechos-tables.xml`.

### 3.3 Proceso ETL

Implementado en `EstadisticasScheduledService` (`backend/.../service/EstadisticasScheduledService.java`).

| Job | Cron | Función |
|---|---|---|
| `recalcularHechosReservaDiario` | `0 0 3 * * ?` (3:00 AM) | Recomputa los últimos siete días para absorber cambios retroactivos (aprobaciones, cancelaciones, reservas creadas con fecha pasada). |
| `recalcularHechosInventarioDiario` | `0 15 3 * * ?` (3:15 AM) | Genera el snapshot del día corriente del inventario activo. |

La lógica de cómputo está expresada como una sola sentencia SQL `INSERT ... SELECT ... GROUP BY` por dominio (ver `HechosReservaRepository` y `HechosInventarioRepository`). El cálculo se ejecuta íntegramente en Postgres — el motor de base de datos es siempre más eficiente que Java para agregaciones masivas y evita el costo de transportar todas las filas al heap de la JVM.

El proceso es **idempotente**: cada ejecución borra y reinserta la ventana correspondiente, garantizando que el resultado final no dependa del orden ni del número de ejecuciones. Esta propiedad es clave en sistemas ETL: si el job falla a la mitad o si se ejecuta dos veces por error, el resultado es el mismo.

Métodos `backfillReservas(desde, hasta)` y `backfillInventario(desde, hasta)` permiten reprocesar rangos arbitrarios. Se exponen mediante `POST /api/v1/stats/admin/backfill`, restringido al rol ADMIN. Su uso típico es la inicialización tras el primer despliegue o la reposición de datos si se detecta un drift.

### 3.4 Endpoints expuestos

| Endpoint | Método | Permiso | Origen del dato |
|---|---|---|---|
| `/api/v1/reservas/mis-reservas/stats` | GET | `reserva:ver_propias` | Cómputo on-the-fly sobre `reserva` |
| `/api/v1/stats/inventario/detailed` | GET | `estadisticas:ver_inventario` | Cómputo on-the-fly sobre `inventario_item` con caché Redis cinco minutos |
| `/api/v1/stats/reservas/ocupacion` | GET | `estadisticas:ver_reservas` | Capa analítica (`hechos_reserva_diario`) |
| `/api/v1/stats/reservas/heatmap` | GET | `estadisticas:ver_reservas` | OLTP directo (la dimensión hora no está en el rollup) |
| `/api/v1/stats/reservas/por-carrera` | GET | `estadisticas:ver_reservas` | Capa analítica |
| `/api/v1/stats/reservas/por-edificio` | GET | `estadisticas:ver_reservas` | Capa analítica |
| `/api/v1/stats/reservas/top-usuarios` | GET | `estadisticas:ver_reservas` | OLTP directo (cardinalidad alta del usuario hace impráctico incluirlo en el rollup) |
| `/api/v1/stats/admin/backfill` | POST | `hasRole('ADMIN')` | Operación administrativa |

### 3.5 Frontend

La pantalla se compone en `frontend/src/components/statistics/`:

- `index.tsx` — resolución de vistas por rol.
- `ReservationStatsAnalista.tsx` — métricas legadas de la pestaña Reservas (tarjetas, gráficos recharts).
- `InventoryStats.tsx` y `InventoryCharts.tsx` — pestaña Inventario.
- `EstadisticasAvanzadas.tsx` — orquesta las cinco llamadas a la capa analítica, gestiona el selector de rango temporal y renderiza los cinco bloques de visualización (mapa de calor en grilla CSS, ocupación con barras de progreso, distribución por edificio, tasa de cancelación con badges, ranking de usuarios).
- `ReservationCharts.tsx` — gráficos del bloque legado (pie, line, bar).
- `StatCard.tsx` — primitivo reutilizable.

Cliente API: `frontend/src/lib/api/stats.ts` con tipos TypeScript dedicados (`OcupacionEspacio`, `HeatmapCelda`, `ResumenCarrera`, `ResumenEdificio`, `TopUsuario`).

### 3.6 Decisiones de diseño

#### Capa analítica en el mismo motor Postgres

Se evaluaron tres alternativas para alojar la capa analítica: (a) recalcular todo en tiempo real sobre OLTP, (b) introducir tablas de hechos en el mismo Postgres con scheduler propio, (c) montar un Data Warehouse separado (Postgres analítico, DuckDB, ClickHouse) con un orquestador de jobs (Airflow, dbt, Prefect).

La opción (a) es la que existía y se rechazó por dos motivos: degrada bajo crecimiento del dataset y no preserva serie histórica frente a borrados. La opción (c) introduciría sincronización, monitoreo y un componente nuevo de infraestructura que excede la complejidad razonable para el volumen y el modelo operativo actual de la institución. Se eligió la opción (b) como punto medio: aporta los beneficios principales del modelado dimensional (separación de caminos, agregaciones eficientes, historia preservada) al costo de una migración y un scheduler en la misma stack ya desplegada.

La decisión es **reversible y escalable**: la lógica de transformación ya está expresada como `INSERT ... SELECT` portable, por lo que una eventual migración a un DWH externo se reduce a redirigir el destino del proceso ETL. Los nombres `hechos_*` siguen la convención dimensional, facilitando esa transición.

#### Cómputo en SQL en lugar de Java

El proceso ETL ejecuta el `GROUP BY` directamente en la base de datos en vez de cargar las filas y agruparlas en Java. Esta decisión responde a tres principios: las bases relacionales están altamente optimizadas para agregaciones; evita el costo de transferencia y serialización; y permite que el proceso escale linealmente con el volumen de la tabla sin presión sobre el heap del backend.

#### Granularidad diaria

El grano de las tablas de hechos es **diario**. Las consultas que requieren menor granularidad (mes, año, semana) se obtienen por agregación adicional sobre el rollup. Bajar la granularidad a hora hubiera multiplicado el tamaño aproximadamente por veinticuatro sin beneficio operativo claro: ninguna decisión de gestión universitaria se toma a nivel de hora individual de un día puntual. La única excepción es el mapa de calor, que necesita la dimensión hora; para ese caso se consulta directamente la tabla OLTP, donde la agregación es aceptable porque se realiza una sola vez al renderizar.

#### Reutilización de dimensiones OLTP

Las tablas `espacio`, `carrera`, `edificio` y `tipo_elemento` se reutilizan como dimensiones sin replicarlas. Es una decisión válida porque cumplen las propiedades esperadas en una dimensión: baja volatilidad (cambian con poca frecuencia), cardinalidad acotada (decenas o pocos cientos de filas) y atributos descriptivos estables. Replicarlas no agregaría valor y duplicaría el trabajo de mantenimiento.

#### FKs lógicas en lugar de declaradas

Las referencias a las dimensiones se almacenan como columnas `BIGINT` sin restricción `REFERENCES`. Esto permite que la capa analítica conserve la traza de hechos cuyo registro original en OLTP fue eliminado (por ejemplo, un espacio dado de baja). En el modelado dimensional clásico esta práctica se conoce como "*slowly changing dimension* tipo cero" simplificado: aceptamos que la dimensión cambie pero priorizamos preservar el hecho histórico.

---

## 4. Catálogo de métricas

Cada métrica ofrecida por el subsistema se documenta a continuación con su definición operativa, su fórmula de cálculo y su utilidad para la toma de decisiones.

### 4.1 Métricas operativas de reservas

| Métrica | Definición | Cálculo | Uso |
|---|---|---|---|
| **Total de reservas** | Cantidad total de reservas registradas | `COUNT(*)` sobre `reserva` | Indicador de volumen agregado; punto de comparación interanual |
| **Aprobadas / Pendientes / Canceladas** | Composición por estado | `COUNT(*)` agrupado por `estado` | Salud del flujo de aprobación; cuello de botella si pendientes crece |
| **Reservas este mes vs. mes anterior** | Variación mensual absoluta | `COUNT` mes actual − `COUNT` mes previo | Tendencia de demanda a corto plazo |
| **Duración total y promedio** | Tiempo total y medio reservado | `SUM` y `AVG` de `(fin - inicio)` en horas | Caracterización del patrón de uso (reservas cortas vs. extensas) |
| **Mes con más reservas** | Pico histórico mensual | `MAX` sobre agrupación mensual | Identificación de estacionalidad |

### 4.2 Métricas analíticas (capa OLAP)

#### Ocupación porcentual por espacio

- **Definición**: porcentaje del tiempo disponible que cada espacio estuvo reservado en un rango.
- **Cálculo**: `SUM(horas_totales) WHERE estado='APROBADO'` dividido por `(días del rango × catorce horas/día)`. El denominador asume una jornada académica extendida de 8:00 a 22:00.
- **Uso**: identificar espacios subutilizados (candidatos a reasignar a otras carreras o a horarios extendidos) y espacios saturados (candidatos a duplicar o a redistribuir demanda). Es la métrica reina para la planificación de espacios.

#### Mapa de calor día × hora

- **Definición**: matriz que cuenta cuántas reservas aprobadas ocurren en cada combinación de día de la semana y hora del día.
- **Cálculo**: `COUNT(*) GROUP BY EXTRACT(DOW), EXTRACT(HOUR)`.
- **Uso**: detectar franjas pico (típicamente martes y jueves entre 14 y 18 horas en ámbitos universitarios) y franjas valle. Insumo directo para programación académica y para política de tarifación o restricción de uso intensivo.

#### Tasa de cancelación por carrera

- **Definición**: porcentaje de reservas canceladas sobre el total de reservas (aprobadas más canceladas) atribuidas a cada carrera.
- **Cálculo**: `canceladas / (aprobadas + canceladas) * 100`.
- **Uso**: detectar problemas de planificación a nivel de carrera. Una tasa elevada y persistente sugiere prácticas de reserva especulativa (reservar por las dudas y cancelar después) que conviene corregir mediante política. Las carreras con tasas superiores al quince por ciento se destacan visualmente con badge rojo.

#### Distribución por edificio

- **Definición**: cantidad de reservas aprobadas por edificio en el rango.
- **Cálculo**: `SUM(cant_reservas) WHERE estado='APROBADO' GROUP BY edificio_id`.
- **Uso**: detectar desbalanceos de demanda entre edificios de la sede. Sirve para decisiones de mantenimiento (un edificio con poca demanda puede tolerar tareas intensivas en horario laboral) y para asignación de recursos auxiliares (limpieza, conserjería).

#### Top usuarios reservadores

- **Definición**: ranking de los diez usuarios con más reservas en el rango.
- **Cálculo**: `COUNT(*) GROUP BY usuario_id ORDER BY ... LIMIT 10`.
- **Uso**: identificación de usuarios de uso intensivo. Útil tanto para reconocer perfiles de adopción de la herramienta como para detectar usos anómalos que merezcan revisión administrativa.

#### Lead time promedio

- **Definición**: días promedio entre la creación de una reserva y la fecha de su inicio.
- **Cálculo**: `AVG((inicio - created_at))` en días.
- **Uso**: indicador de **cultura de planificación**. Un lead time corto sugiere que los usuarios reservan al límite, con riesgo de no encontrar disponibilidad. Un lead time creciente en el tiempo indica mejora en la planificación institucional.

#### Cancelaciones tardías

- **Definición**: cancelaciones realizadas con menos de veinticuatro horas de antelación al inicio.
- **Cálculo**: `COUNT(*)` cuando `estado='CANCELADO'` y `(inicio - updated_at) < 24 horas`.
- **Uso**: proxy de comportamiento de tipo *no-show*. Métrica útil para política institucional (por ejemplo, limitar reservas a usuarios con alta tasa de cancelaciones tardías).

### 4.3 Métricas operativas de inventario

| Métrica | Definición | Uso |
|---|---|---|
| **Total de items y cantidad** | Composición del parque | Punto de referencia para crecimiento del inventario |
| **Distribución por estado** | DISPONIBLE / MANTENIMIENTO / DANADO con porcentajes | Salud general del parque |
| **Ratio de salud y de problemas** | Items disponibles vs. items en mantenimiento o dañados | Indicador agregado para reporting ejecutivo |
| **Antigüedad promedio** | Días promedio desde la creación de los items | Justificar planes de renovación o de baja |
| **Cobertura de espacios** | Porcentaje de espacios con al menos un item registrado | Detectar espacios sin inventariar |
| **Items críticos** | Suma de items dañados más los problemáticos sin asignar | Cola de trabajo para mantenimiento |
| **Top espacios y top tipos** | Rankings descendentes por volumen | Identificar concentraciones de recursos |
| **Espacios y tipos con más problemas** | Rankings de mayor proporción en estado MANTENIMIENTO o DANADO | Priorización de intervenciones |

### 4.4 Selección y filtrado

La pestaña Inventario permite filtrar por espacio, tipo de elemento y estado. La sección Métricas avanzadas de la pestaña Reservas opera sobre rangos temporales seleccionables: últimos treinta días, mes en curso o año en curso. Esta combinación cubre los tres horizontes típicos de análisis de gestión: monitoreo táctico (treinta días), reporte mensual y reporte anual.

---

## 5. Evidencia y consideraciones operativas

### 5.1 Evidencia cuantitativa

Sobre el conjunto de datos del entorno de desarrollo (9 321 reservas, 51 items de inventario activo):

| Indicador | Valor |
|---|---|
| Tamaño de `hechos_reserva_diario` tras backfill completo | 7 231 filas |
| Tamaño promedio de `hechos_inventario_diario` por día | 51 filas |
| Tiempo de respuesta — `/ocupacion` | ~15 ms |
| Tiempo de respuesta — `/heatmap` | ~18 ms |
| Tiempo de respuesta — `/por-carrera` | ~12 ms |
| Tiempo de respuesta — `/por-edificio` | ~8 ms |
| Tiempo de respuesta — `/top-usuarios` | ~25 ms |
| Tiempo del scheduler diario de reservas | < 1 s |
| Validación de integridad | `SUM(cant_reservas) = COUNT(*)` exacto (9 321 = 9 321) |

La validación de integridad confirma que el proceso ETL no introduce pérdida ni duplicación de filas: el total agregado en la capa analítica coincide exactamente con el total transaccional.

### 5.2 Resiliencia y operación

El proceso ETL es idempotente y la ventana de recomputación cubre los últimos siete días, lo que tolera fallos puntuales del scheduler sin pérdida de datos. Si una ejecución no se completa, la siguiente reprocesa la ventana y restablece la consistencia. La marca temporal `computed_at` en cada fila permite implementar un health check sencillo sobre la frescura del dato (`MAX(computed_at)`) y disparar alertas automáticas si la marca queda por detrás del umbral esperado.

El endpoint administrativo `POST /api/v1/stats/admin/backfill` se reserva para situaciones excepcionales de reposición y queda restringido al rol ADMIN. Su uso ordinario no es necesario gracias al scheduler.

### 5.3 Consideraciones de modelado

La zona horaria empleada para el corte diario es UTC. Esta elección sigue la convención del backend (`Instant`) y simplifica el cálculo en SQL. La conversión a hora local América/Montevideo (UTC-3) se aplica en la capa de presentación cuando corresponde a la lectura humana, sin alterar las agregaciones almacenadas.

Las reservas que cruzan la medianoche se atribuyen al día de su inicio. Esta convención simplifica el grano sin afectar significativamente los indicadores agregados, dado que las reservas multi-día son una fracción menor del total y los rangos analíticos típicos abarcan suficientes días como para que la diferencia se diluya.

El usuario no figura como dimensión en el rollup de reservas: incluirlo elevaría la cardinalidad de las filas en un orden de magnitud sin agregar valor analítico claro a ese grano (las decisiones de gestión por usuario individual se toman puntualmente, no como serie temporal agregada). Las consultas de top usuarios se resuelven sobre la tabla OLTP filtrada por rango, donde la cardinalidad ya es manejable.

### 5.4 Plan de evolución

La arquitectura está pensada para crecer por adición sin requerir reescritura. Aumentos sustantivos del volumen (un orden de magnitud o más en reservas) o demandas analíticas más complejas (forecasting, segmentación, modelos predictivos) pueden absorberse incorporando:

- Nuevas tablas de hechos con granos alternativos (mensual, por hora, por usuario) sin tocar las existentes.
- Vistas materializadas en Postgres para indicadores en tiempo casi real, con refresh programado.
- En el horizonte más distante, una migración a un DWH externo si los volúmenes o las herramientas BI lo justifican; el proceso ETL actual es portable como punto de partida.

La construcción presente cubre con holgura el escenario operativo previsto para el sistema y deja la puerta abierta a estas evoluciones sin imponerlas hoy.

---

## Apéndice — paths críticos

- Migración: `backend/src/main/resources/db/changelog/cambiosdb/021-create-hechos-tables.xml`
- Entidades: `backend/src/main/java/com/utec/backend/model/HechosReservaDiario.java`, `HechosInventarioDiario.java`
- Repositorios: `backend/src/main/java/com/utec/backend/repository/HechosReservaRepository.java`, `HechosInventarioRepository.java`
- Scheduler ETL: `backend/src/main/java/com/utec/backend/service/EstadisticasScheduledService.java`
- Servicio de lectura analítica: `backend/src/main/java/com/utec/backend/service/EstadisticasReservaService.java`
- Servicio de cómputo on-the-fly (inventario): `backend/src/main/java/com/utec/backend/service/StatisticsService.java`
- Controlador: `backend/src/main/java/com/utec/backend/controller/StatsController.java`
- Cliente API frontend: `frontend/src/lib/api/stats.ts`
- Componente analítico frontend: `frontend/src/components/statistics/EstadisticasAvanzadas.tsx`
- Página principal: `frontend/src/app/statistics/page.tsx`
