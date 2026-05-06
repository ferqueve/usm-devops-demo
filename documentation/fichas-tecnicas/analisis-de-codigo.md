# Análisis de Código

> **Última actualización**: 2026-05-06 · **Instancia SonarQube**: `https://usm-sonarqube.up.railway.app` · **Proyecto**: `USM` (unificado a partir del 6 de mayo de 2026)

## 1. Introducción

UTEC Space Manager incorpora desde el inicio un proceso continuo de **análisis estático de código y medición de cobertura de pruebas**. Esta práctica permite contar con indicadores objetivos sobre la calidad del software a lo largo de todo el ciclo de desarrollo y dejar evidencia trazable del cumplimiento de los criterios de calidad definidos por el equipo.

El análisis cubre los dos componentes del sistema dentro de un único proyecto SonarQube unificado a partir del 6 de mayo de 2026. La separación lógica entre backend y frontend se mantiene a nivel de carpetas dentro del repositorio, lo que permite leer en el dashboard la cobertura, duplicación e issues por componente sin necesidad de mantener dos dashboards paralelos:

- **Backend** (Spring Boot + Java): rama `backend/` del proyecto SonarQube `USM`, con cobertura medida por JaCoCo.
- **Frontend** (React + TypeScript): rama `frontend/` del proyecto SonarQube `USM`. La cobertura se incorporará cuando se sumen pruebas automatizadas al frontend.

El presente documento resume la metodología utilizada, los indicadores actuales para cada componente y la evolución del proyecto en el tiempo. Está pensado como **documento de progreso**: cada nuevo análisis se incorpora a la sección de evolución, para visibilizar la mejora continua.

## 2. Metodología y herramientas

### 2.1 Herramientas

| Herramienta | Propósito | Alcance |
|---|---|---|
| **SonarQube** (proyecto `USM`) | Análisis estático de calidad y seguridad del código del proyecto completo. | Backend Java + Spring Boot y Frontend React + TypeScript. |
| **SonarLint** (extensión IDE) | Marcado de issues en tiempo real durante la edición, con conexión al proyecto `USM` para usar el mismo perfil de reglas que el dashboard. | Editor (Cursor / VS Code). |
| **JaCoCo** | Medición de cobertura de pruebas (líneas y ramas). | Backend. |
| **GitGuardian** y **GitLeaks** | Detección de credenciales o secretos accidentalmente commiteados al repositorio. | Todo el repositorio. |

A partir del 6 de mayo de 2026 los dos proyectos previos (`USM-backend` y `USM-frontend`) se consolidaron en un único proyecto `USM`. El análisis sigue distinguiendo backend y frontend por la ruta de cada archivo (`backend/` y `frontend/`), de modo que la cobertura, la duplicación y las issues continúan siendo legibles por componente, pero un único dashboard concentra el estado global del producto.

JaCoCo se ejecuta como parte del ciclo estándar de Maven y su reporte se publica automáticamente en el proyecto. En el frontend, la cobertura de pruebas se incorporará cuando se sumen pruebas automatizadas con un test runner adecuado (por ejemplo, Vitest); hasta entonces el análisis del frontend cubre solo la calidad estática del código.

El pipeline de Integración Continua del proyecto ejecuta el análisis automáticamente en cada incorporación de código a la rama de desarrollo. A partir del 6 de mayo se sustituyeron los dos jobs paralelos previos por un único job en GitHub Actions que compila el backend (con Maven y JaCoCo), instala las dependencias del frontend y ejecuta el escáner oficial de SonarQube en la raíz del repositorio.

### 2.2 Quality Gate

El Quality Gate aplicado evalúa principalmente el **código nuevo** que se incorpora al proyecto. Los umbrales actuales son:

| Condición | Umbral |
|---|---|
| Violaciones nuevas | 0 |
| Densidad de líneas duplicadas en código nuevo | menor a 3 % |

Esta política tiene una intención clara: **garantizar que cada cambio nuevo eleve el estándar del proyecto**, aceptando que la base heredada mejora gradualmente con el trabajo de refactor planificado.

### 2.3 Indicadores monitoreados

El equipo monitorea los siguientes indicadores en cada análisis:

- **Tamaño y complejidad**: líneas de código, archivos, complejidad ciclomática y cognitiva.
- **Cobertura de pruebas**: cobertura global, de líneas y de ramas, sumado a la cantidad de pruebas y su tasa de éxito.
- **Calidad y confiabilidad**: bugs, vulnerabilidades, code smells, hotspots de seguridad.
- **Mantenibilidad**: deuda técnica estimada y rating asociado.
- **Duplicación**: líneas, bloques y archivos con código duplicado.
- **Calificaciones globales**: ratings de mantenibilidad, confiabilidad y seguridad (escala de A a E).

## 3. Indicadores actuales

Esta sección refleja el **estado actual** del proyecto a la fecha de la última actualización. La evolución a lo largo del tiempo se documenta en la sección 5.

> Snapshot del **6 de mayo de 2026**, sobre el proyecto unificado `USM`. La separación entre backend y frontend se preserva por la ruta de los archivos: el dashboard permite filtrar por las carpetas `backend/` y `frontend/` para leer cada componente por separado.

### 3.1 Estado del Quality Gate

El proyecto utiliza el Quality Gate personalizado `USM Strict`, que evalúa el estado total del código contra el estándar máximo. El indicador refleja honestamente cuánto falta para alcanzar ese máximo y se actualiza con cada análisis. Estado actual: **8 de 11 condiciones cumplidas**.

| Condición | Umbral | Valor actual | Estado |
|---|:-:|:-:|:-:|
| Hotspots de seguridad revisados | 100 % | 100 % | ✅ |
| Calificación de mantenibilidad | A | A | ✅ |
| Issues de confiabilidad | 0 | 0 | ✅ |
| Calificación de confiabilidad | A | A | ✅ |
| Issues de seguridad | 0 | 0 | ✅ |
| Calificación de seguridad | A | A | ✅ |
| Issues nuevas en código nuevo | 0 | 0 | ✅ |
| Densidad de duplicación en código nuevo | ≤ 3 % | 1,8 % | ✅ |
| Cobertura | ≥ 80 % | 26,8 % | ❌ |
| Cobertura en código nuevo | ≥ 80 % | 16,8 % | ❌ |
| Densidad de duplicación | ≤ 3 % | 6,9 % | ❌ |

### 3.2 Tamaño y complejidad

| Indicador | Valor |
|---|---|
| Líneas de código (sin comentarios) | 51.840 |
| Archivos analizados | ~387 |
| Distribución por componente | Backend ~13.000 LOC · Frontend ~38.800 LOC |

### 3.3 Cobertura de pruebas

| Indicador | Valor |
|---|---|
| Cobertura global del proyecto | 26,8 % |
| Cobertura del backend (filtrada por `backend/`) | 50,8 % |
| Cobertura del frontend (filtrada por `frontend/`) | 0 % (a la espera de pruebas automatizadas) |
| Cantidad de pruebas unitarias backend | 459 |

El frontend aún no cuenta con pruebas automatizadas, por lo que la cobertura por componente figura en 0 %. La incorporación de un test runner (Vitest) está prevista para una iteración próxima.

### 3.4 Calidad y mantenibilidad

| Indicador | Valor |
|---|---|
| Bugs | 0 |
| Vulnerabilidades | 0 |
| Issues de mantenibilidad (code smells) | 7 |
| Hotspots de seguridad pendientes de revisión | 0 |
| Densidad de líneas duplicadas | 6,9 % |

De las 7 issues abiertas en el momento del snapshot, 4 corresponden a refactors locales ya aplicados que se incorporarán al dashboard en el siguiente análisis del pipeline de Integración Continua. Las 3 restantes son una incidencia INFO sobre el patrón Singleton de `AuditBeanHolder` (intencional, registrada como aceptada en el dashboard) y dos comentarios `TODO` que ya no existen en el código pero que SonarQube todavía no había refrescado al momento de generar el snapshot (también registrados como falsos positivos).

### 3.5 Calificaciones

| Dimensión | Calificación |
|---|:-:|
| Mantenibilidad | A |
| Confiabilidad | A |
| Seguridad | A |

## 4. Lectura de los resultados

### 4.1 Fortalezas observadas

- **Confiabilidad consolidada**: ambos componentes alcanzan la calificación A. El frontend pasó de 41 issues de confiabilidad a 0, igualando al backend.
- **Seguridad y mantenibilidad estables**: ambas calificaciones se mantienen en A. El proyecto no presenta issues ni hotspots de seguridad sin atender.
- **Hotspots al día**: el 100 % de los hotspots de seguridad fueron revisados y resueltos, con justificación documentada en cada caso.
- **Suite de pruebas backend en crecimiento**: 459 pruebas unitarias activas con tasa de éxito alta.
- **Estándar elevado autoimpuesto**: el equipo eligió un Quality Gate estricto que evalúa el estado total del código (no solo el nuevo), utilizándolo como vara de progreso hacia la calidad máxima.
- **Política de cero supresores**: la limpieza acumulada se realizó sin recurrir a `@SuppressWarnings`, `eslint-disable`, `// NOSONAR`, `@ts-ignore` ni casts a `any`. Los refactors aplicados son sustantivos (extracción de helpers, records de filtros, migración a `BeanWrapperImpl` y `Clock` inyectable, división de hooks de React) y no esconden la deuda.

### 4.2 Áreas en proceso de mejora

El análisis identifica áreas en las que el equipo está trabajando activamente como parte del proceso de calidad continua:

- **Cobertura del frontend**: la incorporación de un test runner (Vitest) está prevista para una iteración próxima. Mientras tanto el indicador global de cobertura se mueve principalmente al ritmo del backend.
- **Cobertura de ramas en el backend**: existen caminos lógicos sin verificación automatizada en condicionales complejos. La estrategia del equipo apunta a incrementar progresivamente este indicador como parte del trabajo de testing por feature.
- **Duplicación**: la densidad global del 6,9 % es el principal indicador del Quality Gate todavía en rojo. Se atiende mediante extracción de componentes y utilidades compartidas en el frontend, donde se concentra la mayor parte de la duplicación heredada.

### 4.3 Sobre las calificaciones

Es importante interpretar correctamente las calificaciones de SonarQube. Una calificación E en seguridad **no implica que existan vulnerabilidades activas explotables**, sino que existen hotspots o issues que requieren revisión humana para confirmarse como seguros. Una vez que los hotspots son revisados y marcados según corresponda, la calificación se ajusta automáticamente.

De la misma forma, las issues de mantenibilidad son sugerencias de mejora de calidad estructural, no defectos funcionales. Son atendidas según prioridad en el plan de refactor del equipo.

## 5. Evolución del proyecto

Esta sección registra los sucesivos snapshots de análisis para visualizar la evolución del proyecto en el tiempo. Cada nuevo análisis se incorpora como una nueva fila, sin reemplazar los anteriores. Las dos tablas muestran la evolución por separado para backend y frontend.

### 5.1 Backend

| Fecha | Cobertura | Issues confiabilidad | Issues seguridad | Hotspots revisados | Mantenibilidad | Confiabilidad | Seguridad | Deuda (h) |
|---|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|
| 2026-05-04 | 46,4 % | 10 | 1 | 0 % | A | D | E | 68 |
| 2026-05-05 | 50,3 % | 0 | 0 | 100 % | A | A | A | 20 |
| 2026-05-06 | 50,8 % | 0 | 0 | 100 % | A | A | A | 4 |

### 5.2 Frontend

| Fecha | LOC | Issues confiabilidad | Issues seguridad | Hotspots revisados | Duplicación | Mantenibilidad | Confiabilidad | Seguridad | Deuda (h) |
|---|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|
| 2026-05-04 | 38.045 | 174 | 0 | 0 % | 10,3 % | A | D | A | 47 |
| 2026-05-05 | 38.138 | 41 | 0 | 100 % | 10,2 % | A | D | A | 19 |
| 2026-05-06 | 38.840 | 0 | 0 | 100 % | 9,2 % | A | A | A | 3 |

A partir del 6 de mayo de 2026 los indicadores se obtienen del proyecto unificado `USM`, filtrando por las carpetas `backend/` y `frontend/` para preservar la lectura por componente.

### 5.3 Intervención de mejora del 5 de mayo de 2026

Durante esta jornada el equipo realizó un esfuerzo focalizado de reducción de deuda técnica, atendiendo de forma metódica las reglas con mayor cantidad de incidencias reportadas por SonarQube. El alcance fue de aproximadamente **350 incidencias cerradas** sumando ambos componentes, más la **revisión y resolución completa de los 8 hotspots de seguridad** que estaban pendientes (1 corregido en código y 7 marcados como seguros con justificación documentada).

A continuación se enumeran las reglas de SonarQube atendidas, agrupadas por componente. Para el detalle de cada regla en sí (qué evalúa, ejemplo de patrón problemático y solución recomendada) puede consultarse el catálogo oficial de reglas de SonarQube.

#### Backend (`USM-backend`)

| Regla SonarQube | Tema | Aprox. issues atendidas |
|---|---|:-:|
| `java:S1192` | Literales duplicados que deben extraerse a constantes | ~75 |
| `java:S6204` | Modernización de Streams (`.toList()` en lugar de `.collect(...)`) | ~80 |
| `java:S112` | Reemplazo de excepciones genéricas por específicas | 49 |
| `java:S6813` | Migración de inyección por campo a inyección por constructor | 3 |
| `java:S6809` | Llamadas a métodos `@Transactional` vía referencia inyectada en lugar de `this` | 4 |
| `java:S6437` | Eliminación de contraseña hardcoded en seed de desarrollo (migrada a variable de entorno) | 1 vulnerability resuelta |
| `java:S2245` (hotspot) | Generación criptográficamente segura de contraseñas | 1 hotspot resuelto |
| `java:S4502` (hotspot) | CSRF deshabilitado: revisado y justificado | 1 hotspot resuelto |
| `java:S3577` | Renombrado de clases de test al patrón estándar | 5 |
| `java:S1128` | Eliminación de imports no utilizados | ~14 |
| `java:S1481`, `java:S1854`, `java:S1068` | Eliminación de variables y campos sin uso | ~9 |
| `java:S6068` | Limpieza de matchers `eq(...)` redundantes en tests | 10 |
| `java:S2184` | Cálculos numéricos con tipado correcto para evitar overflow | 6 |
| `java:S1155` | Uso de `isEmpty()` en lugar de comparación de tamaño | 5 |
| `java:S5411` | Comparación segura de booleanos | 7 |
| `java:S6201` | Uso del patrón `instanceof Type var` (Java 16+) en lugar de check + cast | 2 |
| `java:S6885` | Uso de `Math.clamp` (Java 21) en lugar de `Math.min(Math.max(...))` | 3 |
| `java:S3626` | Eliminación de `return;` redundantes al final de bloques `catch` | 2 |
| `java:S125` | Eliminación de bloques de código comentado | 1 |
| `java:S1612` | Uso de referencia a método en lugar de lambda equivalente | 3 |

Como parte del refactor se incorporaron además dos excepciones de dominio nuevas (`FileStorageException` y `EmailDeliveryException`), registradas en el `GlobalExceptionHandler` para producir respuestas HTTP coherentes ante fallos de almacenamiento y de envío de email.

#### Frontend (`USM-frontend`)

| Regla SonarQube | Tema | Aprox. issues atendidas |
|---|---|:-:|
| `typescript:S7773` | Modernización de funciones de parsing numérico (`Number.parseInt`, etc.) | ~130 |
| `typescript:S6759` | Props de React envueltas en `Readonly<T>` | ~90 |
| `typescript:S6479` | Llaves únicas en listas JSX (sin usar el índice como key) | 22 |
| `typescript:S7764` | Adopción del objeto global `globalThis` | ~18 |
| `typescript:S7778` | Combinación de llamadas consecutivas a `Array.push()` | 23 |
| `typescript:S4325` | Eliminación de aserciones de tipo redundantes | ~20 |
| `typescript:S1874` | Eliminación de APIs marcadas como `deprecated` | 7 |
| `typescript:S4043` | Métodos inmutables (`toSorted`, `toReversed`) | 3 |
| `typescript:S3863` | Imports duplicados unificados | 6 |
| `typescript:S3358` | Refactor de ternarios anidados a helpers o IIFEs | ~10 |
| `typescript:S125` | Eliminación de bloques de código comentado | 3 |
| `typescript:S1135` | Resolución de comentarios `TODO` obsoletos | 10 |
| `typescript:S6767` | Eliminación de props declaradas pero no utilizadas | 3 |
| `typescript:S5852` (hotspot) | Revisión de expresiones regulares (riesgo de backtracking) | 5 hotspots resueltos |
| `typescript:S2245` (hotspot) | Revisión del uso de `Math.random` | 1 hotspot resuelto |

#### Resultado obtenido en el reanálisis posterior al push

El pipeline de Integración Continua ejecutó un nuevo análisis con los cambios aplicados. Los valores reales recuperados desde SonarQube son los que figuran en la fila del 5 de mayo de 2026 de las tablas 5.1 y 5.2. En síntesis:

**Backend (`USM-backend`)**

- Total de incidencias: **96** (frente a las 396 del snapshot anterior; reducción del orden del 76 %).
- Issues de confiabilidad: **0** (frente a 10).
- Issues de seguridad: **0** (frente a 1).
- Hotspots de seguridad pendientes de revisión: **0** (frente a 2).
- Cobertura global: **50,3 %** (frente a 46,4 %), con **459 pruebas** registradas (frente a 377).
- Densidad de líneas duplicadas: **3,6 %** (frente a 3,8 %).
- Deuda técnica estimada: **~20 horas** (frente a ~68 horas; reducción del orden del 70 %).
- Calificación de Confiabilidad: pasa de **D a A**.
- Calificación de Seguridad: pasa de **E a A** tras la resolución de la única vulnerabilidad pendiente.

**Frontend (`USM-frontend`)**

- Total de incidencias: **134** (frente a 593; reducción del orden del 77 %).
- Issues de confiabilidad: **41** (frente a 174).
- Issues de mantenibilidad: **108** (frente a 567).
- Hotspots de seguridad pendientes de revisión: **0** (frente a 6).
- Densidad de líneas duplicadas: **10,2 %** (frente a 10,3 %).
- Deuda técnica estimada: **~19 horas** (frente a ~47 horas; reducción del orden del 60 %).
- Calificaciones: Mantenibilidad **A**, Seguridad **A**, Confiabilidad **D** (sigue D porque aún hay incidencias de confiabilidad por resolver, aunque el progreso es sustantivo).

El Quality Gate del proyecto sigue marcando `ERROR` en ambos componentes. Esto es esperado dado que se utiliza un Quality Gate intencionalmente exigente, calibrado contra el estándar máximo del equipo: el indicador permanecerá en `ERROR` hasta cumplir con todas sus condiciones (cobertura ≥ 80 %, vulnerabilidad resuelta, duplicación ≤ 3 %), funcionando así como vara de progreso continuo.

### 5.4 Intervención de mejora del 6 de mayo de 2026

La jornada del 6 de mayo se centró en consolidar el análisis del proyecto y resolver el grueso de las incidencias remanentes sin recurrir a supresiones. El alcance fue de aproximadamente **165 incidencias cerradas** sumando ambos componentes, más cambios estructurales en el flujo de análisis del proyecto.

#### Cambios estructurales en el flujo de análisis

- **Consolidación de proyectos SonarQube**: los proyectos `USM-backend` y `USM-frontend` se fusionaron en un único proyecto `USM`. La separación lógica entre componentes se preserva por la ruta de cada archivo, lo que permite mantener la lectura por componente en cobertura, duplicación e issues, simplificando la operación del dashboard.
- **Pipeline de Integración Continua simplificado**: los dos jobs paralelos previos se reemplazaron por un único job que compila el backend con Maven (incluyendo JaCoCo), instala las dependencias del frontend y ejecuta el escáner desde la raíz del repositorio, leyendo el archivo `sonar-project.properties` unificado.
- **Exclusión de las plantillas HTML de email**: las reglas `Web:S1827` (atributos HTML deprecados como `cellpadding`, `cellspacing`, `width`), `Web:S5257` (reemplazo de tablas de layout por CSS) y `Web:S6819` (roles ARIA redundantes) son inaplicables a los HTML de email. Los clientes Outlook y Gmail no soportan layout CSS moderno y exigen las llamadas tablas de presentación con atributos heredados; corregir esos archivos rompería el render de los correos. Las plantillas se incorporaron a la sección `sonar.exclusions` con justificación documentada en el archivo de configuración.
- **Configuración de SonarLint en el editor**: se agregó la binding del proyecto en modo conectado (`/.sonarlint/connectedMode.json` en la raíz del repositorio), de modo que los desarrolladores reciben en el IDE las mismas reglas y perfil que aplica el dashboard, sin necesidad de esperar al pipeline.
- **Actualización de Spring Boot a 3.5.14**: salto de patch para alinear con la rama de soporte recomendada por Spring.

#### Reglas atendidas

A continuación se enumeran las reglas de SonarQube atendidas, agrupadas por componente. Para el detalle de cada regla en sí (qué evalúa, ejemplo de patrón problemático y solución recomendada) puede consultarse el catálogo oficial de reglas de SonarQube.

##### Backend

| Regla SonarQube | Tema | Aprox. issues atendidas |
|---|---|:-:|
| `java:S3776` | Refactor de métodos con alta complejidad cognitiva (`StatisticsService.getDetailedInventarioStatistics`, `ReservaService.createReserva`, `cambiarEstadoReserva`, `updateReserva`, `EspacioService.filterEspacios`, `UsuarioConfiguracionService.filtrarPreferenciasVistaPorRol`, etc.) | 20 |
| `java:S107` | Métodos con más de 7 parámetros agrupados en records de filtros (`ReservaFilters`, `UsuarioFilters`, `EspacioFilters`) | 9 |
| `java:S1141` | Bloques `try` anidados extraídos a métodos auxiliares | 4 |
| `java:S3011` | Reemplazo de acceso reflexivo a campos privados por `BeanWrapperImpl` de Spring | 4 |
| `java:S2696` | Reemplazo del campo estático `applicationContext` en el listener JPA por un `AuditBeanHolder` administrado por Spring que expone la única instancia | 1 |
| `java:S2925` | Reemplazo de `Thread.sleep` en test JWT por inyección de `Clock` mockeable | 1 |
| `java:S1118` | Constructor privado en clases utilitarias (`RolUtil`, `AuditContext`) | 2 |
| `java:S1066` | Fusión de `if` anidados | 3 |
| `java:S1192` | Literales duplicados extraídos a constantes | 30 |
| `java:S6916` | Adopción de `pattern match` en lugar de `if/instanceof` separados | 2 |
| `java:S6208` | Casos de `switch` consecutivos fusionados con etiqueta separada por coma (Java 14+) | 5 |
| `java:S135` | Reducción del número de `break`/`continue` por loop mediante extracción a un método | 2 |
| `java:S1602` | Eliminación de llaves innecesarias en lambdas | 2 |
| `java:S1126` | Sustitución de `if/else` por una sola expresión booleana | 1 |
| `java:S2178` | Reemplazo de operadores `\|`/`&` lógicos por `\|\|`/`&&` con extracción de operandos cuando hay efectos colaterales | 2 |
| `java:S125` | Eliminación de bloques de código comentado | 2 |
| `java:S1640` | Migración de `Map<EnumKey, …>` a `EnumMap` | 1 |
| `java:S1135` | Resolución o eliminación de comentarios `TODO` obsoletos | 1 |
| `java:S1172`, `java:S1488`, `java:S1125`, `java:S4030`, `java:S2737`, `java:S1130`, `java:S5778`, `java:S5785`, `java:S3358` | Limpieza puntual: parámetros sin uso, asignaciones redundantes, ramas innecesarias, lambdas con múltiples invocaciones, `assertEquals` en lugar de `assertTrue`, declaraciones `throws` innecesarias, ternarios anidados | 12 |
| `java:S4977` | Renombrado de parámetros de tipo que ocultaban un parámetro externo | 1 |
| `java:S1186` | Documentación del cuerpo vacío del test de bootstrap de Spring | 1 |
| `java:S1874` | Actualización de Spring Boot 3.5.6 → 3.5.14 (patch update) | 1 |

##### Frontend

| Regla SonarQube | Tema | Aprox. issues atendidas |
|---|---|:-:|
| `typescript:S3923` | Ramas duplicadas detectadas como bug en `ReservationManagement`, `ReservationDetailsDialog`, `ReservationPendientes`, `SpaceFormDialog`, `SpaceCard`, `TermsAndPrivacyDialog` | 6 |
| `typescript:S1871` | Casos `switch` con bloque idéntico fusionados | 2 |
| `typescript:S4144` | Funciones con implementación idéntica unificadas (`ReservationCalendarView`, `ReservationFormDialog`, `pdf-export`) | 4 |
| `typescript:S6481` | Valores pasados a `Context.Provider` envueltos en `useMemo` (`Carousel`, `Chart`, `Form`, `ToggleGroup`) | 5 |
| `typescript:S6478` | Componentes definidos dentro de otro componente extraídos a top-level | 9 |
| `typescript:S1082` + `typescript:S6848` | Accesibilidad: divs y spans con `onClick` reemplazados por `<button>` o complementados con `role`, `tabIndex` y `onKeyDown` | 19 |
| `typescript:S6853` | `<label>` asociados a controles de formulario | 6 |
| `typescript:S6819` | Reemplazo de roles ARIA redundantes por elementos HTML semánticos (`<a>`, `<section aria-label>`, `<button>`, `<fieldset>`) | 9 |
| `typescript:S3776` | Refactor de funciones con alta complejidad cognitiva mediante extracción de hooks y subcomponentes (`ReservationManagement`, `ReservationFormDialog`, `ReservationCalendarView`, `UnifiedDashboard`, `PreferencesModal`, `UserManagement`, `pdf-export`, `audit-export`, `liquibase-timeline`) | 19 |
| `typescript:S2004` | Anidación de funciones reducida a 4 niveles o menos | 11 |
| `typescript:S107` | Métodos con más de 7 parámetros agrupados en objetos de query (`obtenerMisReservasPaged`, `obtenerTodasReservasPaged`, `EspacioFilters`) | 4 |
| `typescript:S4624` | Reemplazo de template literals anidados por variables intermedias | 1 |
| `react-refresh/only-export-components` | División de archivos shadcn/ui que mezclaban componentes con `cva` o contexts (`Button`, `badge`, `toggle`, `navigation-menu`, `sidebar`, `form`) en archivos hermanos | 6 |
| `@typescript-eslint/no-explicit-any` | Tipado real de cerca de 70 ocurrencias de `: any` con DTOs y tipos de la librería (recharts, react-day-picker, Spring Actuator) | 70 |
| `react-hooks/exhaustive-deps` | Dependencias completas en `useEffect`, con patrón de `ref` cuando es necesario evitar ciclos | 2 |
| `typescript:S6582` | Sustitución de `x && x.y && x.y.z` por encadenamiento opcional (`x?.y?.z`) | 1 |
| `typescript:S6606` | Sustitución de ternarios `x !== null ? x : default` por `??` | 2 |
| `typescript:S6594` | Uso de `RegExp.exec()` en lugar de `String.match()` cuando se ignora el resultado de `match` | 4 |
| `typescript:S6571` | Eliminación de uniones de tipo redundantes con `string` | 1 |
| `typescript:S6754` | Corrección del uso de `useState` mal destructurado | 1 |
| `typescript:S6749` | Eliminación de fragmentos con un único hijo | 1 |
| `typescript:S6772` | Espaciado JSX explícito | 1 |
| `typescript:S6582`, `typescript:S6439`, `typescript:S4624`, `typescript:S4323`, `typescript:S4123`, `typescript:S2871`, `typescript:S2486`, `typescript:S1854`, `typescript:S6551`, `typescript:S7723`, `typescript:S7735`, `typescript:S7755`, `typescript:S7756`, `typescript:S7758`, `typescript:S7762`, `typescript:S7764`, `typescript:S7765`, `typescript:S7776`, `typescript:S7781`, `typescript:S7786` | Modernizaciones de API: `??`, conversión a booleano explícita, type alias en lugar de unión, `await` solo sobre Promesas, `localeCompare` en `sort`, manejo de `unknown` en `catch`, `String#replaceAll`, `Array.from`/`new Array()`, `Blob#text()`, `globalThis`, `String#codePointAt`, `String#includes`, `Element#remove()`, `TypeError`, `Set` en lugar de Array para búsquedas, `String.at(-i)` | ~30 |
| Hotspots `typescript:S5852` | Revisión de expresiones regulares con potencial de backtracking — todos clasificados como seguros con justificación documentada (input acotado por `maxLength`, regex sin grupos repetidos sobre alfabetos solapados) | 4 |
| Hotspot `java:S5693` | Revisión del límite de tamaño de archivo de subida (50 MB para imágenes en alta calidad) — clasificado como seguro: el endpoint requiere autenticación y permiso `archivo:subir`, y el servicio valida tamaño y MIME antes de aceptar el archivo | 2 |
| Hotspot `typescript:S2245` | Revisión de `Math.random` en `sidebar.tsx` para randomización visual de un placeholder — clasificado como seguro: no es uso criptográfico | 1 |

#### Resultado obtenido en el reanálisis posterior al push

El pipeline de Integración Continua ejecutó el primer análisis del proyecto unificado `USM` con los cambios aplicados. Los valores reales recuperados desde SonarQube son los que figuran en la fila del 6 de mayo de 2026 de las tablas 5.1 y 5.2. En síntesis:

- **Total de incidencias del proyecto**: pasa de 311 (sumadas backend + frontend antes de la unificación) a **7** abiertas en el dashboard. De esas 7 quedan únicamente: una incidencia `INFO` sobre el patrón Singleton del `AuditBeanHolder` registrada como aceptada por ser intencional, dos comentarios `TODO` registrados como falsos positivos por ya no existir en el código y cuatro refactors locales en proceso de incorporación al dashboard mediante el siguiente análisis.
- **Bugs**: 0 en el proyecto.
- **Vulnerabilidades**: 0 en el proyecto.
- **Hotspots de seguridad pendientes de revisión**: 0 (los siete hotspots heredados se resolvieron tras revisión y se marcaron con su justificación correspondiente).
- **Calificaciones globales**: Mantenibilidad **A**, Confiabilidad **A**, Seguridad **A**.
- **Política de cero supresores**: la limpieza se realizó sin `@SuppressWarnings`, `eslint-disable`, `// NOSONAR`, `@ts-ignore` ni casts a `any`. Los refactors aplicados son sustantivos: extracción de helpers, records de filtros, migración a `BeanWrapperImpl` y `Clock` inyectable, división de componentes shadcn en archivos hermanos, hooks personalizados, tipos reales en lugar de `any`.

El Quality Gate del proyecto sigue marcando `ERROR` solo por las condiciones de cobertura global (26,8 % vs. umbral 80 %) y duplicación global (6,9 % vs. umbral 3 %). La cobertura se elevará al incorporar el test runner del frontend y la duplicación se irá atendiendo de forma incremental con extracción de utilidades y componentes compartidos.

### 5.5 Hitos del proceso de calidad

| Fecha | Hito |
|---|---|
| 2025-12-22 | Incorporación de SonarQube al pipeline de análisis del proyecto (commit `6077513`). |
| 2026-01-04 | Incorporación de JaCoCo para medición de cobertura del backend (commit `224f696`). |
| 2026-05-04 | Primer snapshot formal documentado en esta ficha y adopción del Quality Gate estricto `USM Strict` para evaluación contra estándar máximo. |
| 2026-05-04 | Separación del análisis en dos proyectos SonarQube (`USM-backend` y `USM-frontend`) y configuración del pipeline de Integración Continua para escanear ambos componentes en paralelo. |
| 2026-05-04 | Primer análisis exitoso del frontend con incorporación al Quality Gate `USM Strict`. |
| 2026-05-05 | Intervención focalizada de reducción de deuda técnica: refactor de constantes y modernización de Streams en backend, modernización de patrones TypeScript y revisión completa de los ocho hotspots de seguridad pendientes (ver detalle en sección 5.3). |
| 2026-05-06 | Consolidación de los proyectos SonarQube en un único proyecto `USM`. Pipeline simplificado a un solo job. Configuración de SonarLint en modo conectado en el editor. Resolución del grueso de las incidencias remanentes sin supresiones. Calificación global de Confiabilidad alcanza **A** (ver detalle en sección 5.4). |

## 6. Cierre

El análisis estático y la medición de cobertura permiten al equipo de UTEC Space Manager **conocer con datos objetivos el estado del código**, identificar áreas de mejora y demostrar progreso a lo largo del ciclo de vida del proyecto. La incorporación temprana de estas herramientas al flujo de trabajo refleja una decisión consciente de priorizar la calidad como atributo del producto.

Este documento se actualiza en cada nuevo análisis y constituye, junto con el Plan de Calidad de proceso, la evidencia técnica del cumplimiento de los criterios de calidad definidos para el proyecto.
