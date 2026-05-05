# Análisis de Código

> **Última actualización**: 2026-05-05 · **Instancia SonarQube**: `https://usm-sonarqube.up.railway.app` · **Proyectos**: `USM-backend`, `USM-frontend`

## 1. Introducción

UTEC Space Manager incorpora desde el inicio un proceso continuo de **análisis estático de código y medición de cobertura de pruebas**. Esta práctica permite contar con indicadores objetivos sobre la calidad del software a lo largo de todo el ciclo de desarrollo y dejar evidencia trazable del cumplimiento de los criterios de calidad definidos por el equipo.

El análisis cubre los dos componentes del sistema de manera **independiente**, en línea con cómo se evalúan en la auditoría académica:

- **Backend** (Spring Boot + Java): proyecto SonarQube `USM-backend`, con cobertura medida por JaCoCo.
- **Frontend** (React + TypeScript): proyecto SonarQube `USM-frontend`. La cobertura se incorporará cuando se sumen pruebas automatizadas al frontend.

El presente documento resume la metodología utilizada, los indicadores actuales para cada componente y la evolución del proyecto en el tiempo. Está pensado como **documento de progreso**: cada nuevo análisis se incorpora a la sección de evolución, para visibilizar la mejora continua.

## 2. Metodología y herramientas

### 2.1 Herramientas

| Herramienta | Propósito | Alcance |
|---|---|---|
| **SonarQube** (proyecto `USM-backend`) | Análisis estático de calidad y seguridad del código backend. | Backend Java + Spring Boot. |
| **SonarQube** (proyecto `USM-frontend`) | Análisis estático de calidad y seguridad del código frontend. | Frontend React + TypeScript. |
| **JaCoCo** | Medición de cobertura de pruebas (líneas y ramas). | Backend. |
| **GitGuardian** y **GitLeaks** | Detección de credenciales o secretos accidentalmente commiteados al repositorio. | Todo el repositorio. |

Ambos proyectos SonarQube se alojan en la misma instancia dedicada del proyecto, lo que permite un acceso unificado a los dos dashboards manteniendo la separación lógica que requiere la evaluación académica.

JaCoCo se ejecuta como parte del ciclo estándar de Maven y su reporte se publica automáticamente en `USM-backend`. En el frontend, la cobertura de pruebas se incorporará cuando se sumen pruebas automatizadas con un test runner adecuado (por ejemplo, Vitest); hasta entonces el análisis del frontend cubre solo la calidad estática del código.

El pipeline de Integración Continua del proyecto ejecuta ambos análisis automáticamente en cada incorporación de código a la rama de desarrollo, mediante dos jobs paralelos en GitHub Actions: uno con Maven para el backend y otro con el escáner oficial de SonarQube para el frontend.

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

Los indicadores se presentan separados por componente (backend / frontend), reflejando los dos proyectos SonarQube.

### 3.1 Backend (snapshot del 5 de mayo de 2026)

#### Estado del Quality Gate

El proyecto utiliza el Quality Gate personalizado `USM Strict`, que evalúa el estado total del código contra el estándar máximo. El indicador refleja honestamente cuánto falta para alcanzar ese máximo y se actualiza con cada análisis. Estado actual: **5 de 10 condiciones cumplidas** (el día anterior eran 3 de 10).

| Condición | Umbral | Valor actual | Estado |
|---|:-:|:-:|:-:|
| Hotspots de seguridad revisados | 100 % | 100 % | ✅ |
| Calificación de mantenibilidad | A | A | ✅ |
| Issues de confiabilidad | 0 | 0 | ✅ |
| Calificación de confiabilidad | A | A | ✅ |
| Densidad de duplicación en código nuevo | < 3 % | 2,4 % | ✅ |
| Cobertura | ≥ 80 % | 50,3 % | ❌ |
| Issues de seguridad | 0 | 1 | ❌ |
| Calificación de seguridad | A | E | ❌ |
| Densidad de duplicación | ≤ 3 % | 3,8 % | ❌ |
| Issues nuevas en código nuevo | 0 | 5 | ❌ |

#### Tamaño y complejidad

| Indicador | Valor |
|---|---|
| Líneas de código (sin comentarios) | 12.318 |
| Líneas totales | 16.837 |
| Archivos | 153 |
| Complejidad ciclomática | 1.753 |
| Complejidad cognitiva | 1.464 |

#### Cobertura de pruebas

| Indicador | Valor |
|---|---|
| Cobertura global | 50,3 % |
| Cobertura de líneas | 55,2 % |
| Cobertura de ramas | 36,8 % |
| Cantidad de pruebas unitarias | 459 |
| Tasa de éxito | 95,9 % |

#### Calidad y mantenibilidad

| Indicador | Valor |
|---|---|
| Issues de confiabilidad | 0 |
| Issues de seguridad | 1 |
| Issues de mantenibilidad | 181 |
| Hotspots de seguridad pendientes de revisión | 0 |
| Densidad de líneas duplicadas | 3,8 % |
| Deuda técnica estimada | 2.329 minutos (~39 horas) |

#### Calificaciones

| Dimensión | Calificación |
|---|:-:|
| Mantenibilidad | A |
| Confiabilidad | A |
| Seguridad | E |

### 3.2 Frontend (snapshot del 5 de mayo de 2026)

#### Estado del Quality Gate

El proyecto frontend utiliza el mismo Quality Gate `USM Strict` que el backend, con la salvedad de que la cobertura no se mide hasta que se incorporen pruebas automatizadas. Estado actual: **4 de 8 condiciones cumplidas** (el día anterior eran 3 de 8).

| Condición | Umbral | Valor actual | Estado |
|---|:-:|:-:|:-:|
| Hotspots de seguridad revisados | 100 % | 100 % | ✅ |
| Calificación de mantenibilidad | A | A | ✅ |
| Issues de seguridad | 0 | 0 | ✅ |
| Calificación de seguridad | A | A | ✅ |
| Issues de confiabilidad | 0 | 41 | ❌ |
| Calificación de confiabilidad | A | D | ❌ |
| Cobertura | ≥ 80 % | 0 % | ❌ |
| Densidad de duplicación | ≤ 3 % | 10,3 % | ❌ |

#### Tamaño y complejidad

| Indicador | Valor |
|---|---|
| Líneas de código (sin comentarios) | 38.141 |
| Líneas totales | 43.083 |
| Archivos | 234 |
| Complejidad ciclomática | 5.430 |
| Complejidad cognitiva | 3.114 |

#### Cobertura de pruebas

El frontend aún no cuenta con pruebas automatizadas, por lo que la cobertura figura en 0 %. Se incorporará un test runner en una iteración posterior y, a partir de ese momento, los indicadores de cobertura comenzarán a registrarse.

#### Calidad y mantenibilidad

| Indicador | Valor |
|---|---|
| Issues de confiabilidad | 41 |
| Issues de seguridad | 0 |
| Issues de mantenibilidad | 171 |
| Hotspots de seguridad pendientes de revisión | 0 |
| Densidad de líneas duplicadas | 10,3 % |
| Deuda técnica estimada | 1.405 minutos (~23 horas) |

#### Calificaciones

| Dimensión | Calificación |
|---|:-:|
| Mantenibilidad | A |
| Confiabilidad | D |
| Seguridad | A |

## 4. Lectura de los resultados

### 4.1 Backend

#### Fortalezas observadas

- **Mantenibilidad alta**: la calificación A refleja que la deuda técnica relativa al tamaño del proyecto es baja, lo que facilita la incorporación de nuevas funcionalidades.
- **Confiabilidad consolidada**: la calificación de Confiabilidad pasó a A tras el trabajo de refactor del 5 de mayo, sin issues de confiabilidad pendientes según el catálogo de SonarQube.
- **Suite de pruebas en crecimiento**: el proyecto cuenta con 459 pruebas unitarias activas y la cobertura global escaló de 46,4 % a 50,3 %.
- **Hotspots al día**: el 100 % de los hotspots de seguridad fueron revisados y resueltos.
- **Estándar elevado autoimpuesto**: el equipo eligió un Quality Gate estricto que evalúa el estado total del código (no solo el nuevo), utilizándolo como vara de progreso hacia la calidad máxima.

#### Áreas en proceso de mejora

El análisis identifica áreas en las que el equipo está trabajando activamente como parte del proceso de calidad continua:

- **Cobertura de ramas**: el 36,8 % de cobertura de ramas refleja que existen caminos lógicos sin verificación automatizada, especialmente en condicionales complejos. La estrategia del equipo apunta a incrementar progresivamente este indicador como parte del trabajo de testing por feature.
- **Estabilidad de la suite**: una porción de las pruebas presenta fallos o errores de ejecución, lo que requiere estabilización antes de seguir ampliando la cobertura.
- **Seguridad**: la calificación E está condicionada por una vulnerabilidad pendiente de revisión y resolución; su atención está prevista para la próxima iteración del proceso de calidad.
- **Duplicación**: la densidad del 3,8 % está apenas por encima del umbral del Quality Gate y se atenderá mediante la extracción de helpers compartidos en los servicios más afectados.

### 4.2 Frontend

#### Fortalezas observadas

- **Mantenibilidad alta**: igual que en el backend, la calificación A indica que la deuda técnica del frontend es proporcionalmente baja respecto al tamaño del proyecto.
- **Seguridad sólida**: el análisis no detecta issues de seguridad ni vulnerabilidades. La calificación A en seguridad demuestra que el código del frontend no expone patrones de riesgo según el catálogo de SonarQube.
- **Línea de base honesta**: ya con el primer escaneo, el frontend incorpora la misma vara de medición que el backend, lo que permite comparar y trazar la evolución de ambos componentes desde el primer momento.

#### Áreas en proceso de mejora

- **Confiabilidad**: las 41 issues de confiabilidad pendientes (frente a las 174 del snapshot anterior) concentran el foco de atención. Los patrones recurrentes restantes (manejo de promesas, valores potencialmente indefinidos, uso de hooks de React) se atenderán en iteraciones de refactor planificado.
- **Duplicación**: la densidad del 10,3 % está sensiblemente por encima del umbral del Quality Gate. Refleja oportunidades de extracción de componentes compartidos y de utilidades, que se prevé atender de forma incremental.
- **Cobertura de pruebas**: actualmente en 0 %. La incorporación de un test runner (planificada para una iteración posterior) habilitará el seguimiento de la cobertura como parte del proceso de mejora continua.

### 4.3 Sobre las calificaciones

Es importante interpretar correctamente las calificaciones de SonarQube. Una calificación E en seguridad **no implica que existan vulnerabilidades activas explotables**, sino que existen hotspots o issues que requieren revisión humana para confirmarse como seguros. Una vez que los hotspots son revisados y marcados según corresponda, la calificación se ajusta automáticamente.

De la misma forma, las issues de mantenibilidad (181 en backend, 171 en frontend) son sugerencias de mejora de calidad estructural, no defectos funcionales. Son atendidas según prioridad en el plan de refactor del equipo.

## 5. Evolución del proyecto

Esta sección registra los sucesivos snapshots de análisis para visualizar la evolución del proyecto en el tiempo. Cada nuevo análisis se incorpora como una nueva fila, sin reemplazar los anteriores. Las dos tablas muestran la evolución por separado para backend y frontend.

### 5.1 Backend (`USM-backend`)

| Fecha | Cobertura | Issues confiabilidad | Issues seguridad | Hotspots revisados | Mantenibilidad | Confiabilidad | Seguridad | Deuda (h) |
|---|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|
| 2026-05-04 | 46,4 % | 10 | 1 | 0 % | A | D | E | 68 |
| 2026-05-05 | 50,3 % | 0 | 1 | 100 % | A | A | E | 39 |

### 5.2 Frontend (`USM-frontend`)

| Fecha | LOC | Issues confiabilidad | Issues seguridad | Hotspots revisados | Duplicación | Mantenibilidad | Confiabilidad | Seguridad | Deuda (h) |
|---|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|
| 2026-05-04 | 38.045 | 174 | 0 | 0 % | 10,3 % | A | D | A | 47 |
| 2026-05-05 | 38.141 | 41 | 0 | 100 % | 10,3 % | A | D | A | 23 |

### 5.3 Intervención de mejora del 5 de mayo de 2026

Durante esta jornada el equipo realizó un esfuerzo focalizado de reducción de deuda técnica, atendiendo de forma metódica las reglas con mayor cantidad de incidencias reportadas por SonarQube. El alcance fue de aproximadamente **350 incidencias cerradas** sumando ambos componentes, más la **revisión y resolución completa de los 8 hotspots de seguridad** que estaban pendientes (1 corregido en código y 7 marcados como seguros con justificación documentada).

A continuación se enumeran las reglas de SonarQube atendidas, agrupadas por componente. Para el detalle de cada regla en sí (qué evalúa, ejemplo de patrón problemático y solución recomendada) puede consultarse el catálogo oficial de reglas de SonarQube.

#### Backend (`USM-backend`)

| Regla SonarQube | Tema | Aprox. issues atendidas |
|---|---|:-:|
| `java:S1192` | Literales duplicados que deben extraerse a constantes | ~25 |
| `java:S6204` | Modernización de Streams (`.toList()` en lugar de `.collect(...)`) | ~80 |
| `java:S112` | Reemplazo de excepciones genéricas por específicas | 49 |
| `java:S6813` | Migración de inyección por campo a inyección por constructor | 3 |
| `java:S6809` | Llamadas a métodos `@Transactional` vía referencia inyectada en lugar de `this` | 4 |
| `java:S2245` (hotspot) | Generación criptográficamente segura de contraseñas | 1 hotspot resuelto |
| `java:S4502` (hotspot) | CSRF deshabilitado: revisado y justificado | 1 hotspot resuelto |
| `java:S3577` | Renombrado de clases de test al patrón estándar | 5 |
| `java:S1128` | Eliminación de imports no utilizados | ~10 |
| `java:S1481`, `java:S1854`, `java:S1068` | Eliminación de variables y campos sin uso | ~9 |
| `java:S6068` | Limpieza de matchers `eq(...)` redundantes en tests | 10 |
| `java:S2184` | Cálculos numéricos con tipado correcto para evitar overflow | 6 |
| `java:S1155` | Uso de `isEmpty()` en lugar de comparación de tamaño | 4 |
| `java:S5411` | Comparación segura de booleanos | 7 |
| `java:S125` | Eliminación de bloques de código comentado | 1 |
| `java:S1612` | Uso de referencia a método en lugar de lambda equivalente | 1 |

Como parte del refactor se incorporaron además dos excepciones de dominio nuevas (`FileStorageException` y `EmailDeliveryException`), registradas en el `GlobalExceptionHandler` para producir respuestas HTTP coherentes ante fallos de almacenamiento y de envío de email.

#### Frontend (`USM-frontend`)

| Regla SonarQube | Tema | Aprox. issues atendidas |
|---|---|:-:|
| `typescript:S7773` | Modernización de funciones de parsing numérico (`Number.parseInt`, etc.) | ~130 |
| `typescript:S6759` | Props de React envueltas en `Readonly<T>` | ~55 |
| `typescript:S6479` | Llaves únicas en listas JSX (sin usar el índice como key) | 17 |
| `typescript:S7764` | Adopción del objeto global `globalThis` | ~15 |
| `typescript:S7778` | Combinación de llamadas consecutivas a `Array.push()` | 23 |
| `typescript:S4325` | Eliminación de aserciones de tipo redundantes | ~10 |
| `typescript:S1874` | Eliminación de APIs marcadas como `deprecated` | 7 |
| `typescript:S4043` | Métodos inmutables (`toSorted`, `toReversed`) | 3 |
| `typescript:S3863` | Imports duplicados unificados | 6 |
| `typescript:S125` | Eliminación de bloques de código comentado | 3 |
| `typescript:S1135` | Resolución de comentarios `TODO` obsoletos | 5 |
| `typescript:S6767` | Eliminación de props declaradas pero no utilizadas | 3 |
| `typescript:S5852` (hotspot) | Revisión de expresiones regulares (riesgo de backtracking) | 5 hotspots resueltos |
| `typescript:S2245` (hotspot) | Revisión del uso de `Math.random` | 1 hotspot resuelto |

#### Resultado obtenido en el reanálisis posterior al push

El pipeline de Integración Continua ejecutó un nuevo análisis con los cambios aplicados. Los valores reales recuperados desde SonarQube son los que figuran en la fila del 5 de mayo de 2026 de las tablas 5.1 y 5.2. En síntesis:

**Backend (`USM-backend`)**

- Total de incidencias: **182** (frente a las 396 del snapshot anterior; reducción del orden del 54 %).
- Issues de confiabilidad: **0** (frente a 10).
- Hotspots de seguridad pendientes de revisión: **0** (frente a 2).
- Cobertura global: **50,3 %** (frente a 46,4 %), con **459 pruebas** registradas (frente a 377).
- Deuda técnica estimada: **~39 horas** (frente a ~68 horas).
- Calificación de Confiabilidad: pasa de **D a A**.
- Calificación de Seguridad: se mantiene en **E** condicionada por la única vulnerabilidad pendiente, cuyo tratamiento está previsto para la próxima iteración (su resolución llevará la calificación a A).

**Frontend (`USM-frontend`)**

- Total de incidencias: **197** (frente a 593; reducción del orden del 67 %).
- Issues de confiabilidad: **41** (frente a 174).
- Issues de mantenibilidad: **171** (frente a 567).
- Hotspots de seguridad pendientes de revisión: **0** (frente a 6).
- Deuda técnica estimada: **~23 horas** (frente a ~47 horas).
- Calificaciones: Mantenibilidad **A**, Seguridad **A**, Confiabilidad **D** (sigue D porque aún hay incidencias de confiabilidad por resolver, aunque el progreso es sustantivo).

El Quality Gate del proyecto sigue marcando `ERROR` en ambos componentes. Esto es esperado dado que se utiliza un Quality Gate intencionalmente exigente, calibrado contra el estándar máximo del equipo: el indicador permanecerá en `ERROR` hasta cumplir con todas sus condiciones (cobertura ≥ 80 %, vulnerabilidad resuelta, duplicación ≤ 3 %), funcionando así como vara de progreso continuo.

#### Segundo barrido del 5 de mayo de 2026

Tras el primer reanálisis se realizó un **segundo barrido** dentro de la misma jornada para atacar reglas de menor frecuencia y completar trabajos pendientes.

**Backend**

| Regla SonarQube | Tema | Aprox. issues atendidas |
|---|---|:-:|
| `java:S6437` | Vulnerabilidad de severidad BLOCKER por contraseña hardcoded en seed de desarrollo (movida a variable de entorno `DEV_SEED_PASSWORD`) | 1 vulnerability resuelta |
| `java:S1192` | Segunda tanda de extracción de constantes en `DevDataInitializer`, `EmailService` y `ReservaService` | ~50 |
| `java:S1128` | Imports `java.util.stream.Collectors` y `org.mockito.ArgumentMatchers` no utilizados | 4 |
| `java:S1612` | Lambda `r -> r.getEsPublica()` reemplazada por `Reserva::getEsPublica` | 2 |
| `java:S6201` | Uso del nuevo patrón `instanceof Type var` (Java 16+) en lugar de check + cast | 2 |
| `java:S6885` | Uso de `Math.clamp` (Java 21) en lugar de `Math.min(Math.max(...))` | 3 |
| `java:S3626` | Eliminación de `return;` redundantes al final de bloques `catch` | 2 |
| `java:S1155` | `Collectors` import limpiado en `StatisticsService` tras refactor | 1 |

**Frontend**

| Regla SonarQube | Tema | Aprox. issues atendidas |
|---|---|:-:|
| `typescript:S6759` | Segunda tanda de props envueltas en `Readonly<T>` | 35 |
| `typescript:S6479` | Llaves únicas en listas JSX (más casos) | 5 |
| `typescript:S7764` | Adopción de `globalThis` (más casos) | 3 |
| `typescript:S4325` | Aserciones de tipo redundantes (`as Tipo`, `!`) | 10 |
| `typescript:S1135` | Resolución y reformulación de comentarios `TODO` obsoletos | 5 |
| `typescript:S3358` | Refactor de ternarios anidados a helpers o IIFEs | 5 |

Tras este segundo barrido se ejecutará un nuevo análisis de SonarQube cuyos números se sumarán a la tabla de evolución del proyecto en cuanto el pipeline publique los resultados.

### 5.4 Hitos del proceso de calidad

| Fecha | Hito |
|---|---|
| 2025-12-22 | Incorporación de SonarQube al pipeline de análisis del proyecto (commit `6077513`). |
| 2026-01-04 | Incorporación de JaCoCo para medición de cobertura del backend (commit `224f696`). |
| 2026-05-04 | Primer snapshot formal documentado en esta ficha y adopción del Quality Gate estricto `USM Strict` para evaluación contra estándar máximo. |
| 2026-05-04 | Separación del análisis en dos proyectos SonarQube (`USM-backend` y `USM-frontend`) y configuración del pipeline de Integración Continua para escanear ambos componentes en paralelo. |
| 2026-05-04 | Primer análisis exitoso del frontend con incorporación al Quality Gate `USM Strict`. |
| 2026-05-05 | Intervención focalizada de reducción de deuda técnica: refactor de constantes y modernización de Streams en backend, modernización de patrones TypeScript y revisión completa de los ocho hotspots de seguridad pendientes (ver detalle en sección 5.3). |

## 6. Cierre

El análisis estático y la medición de cobertura permiten al equipo de UTEC Space Manager **conocer con datos objetivos el estado del código**, identificar áreas de mejora y demostrar progreso a lo largo del ciclo de vida del proyecto. La incorporación temprana de estas herramientas al flujo de trabajo refleja una decisión consciente de priorizar la calidad como atributo del producto.

Este documento se actualiza en cada nuevo análisis y constituye, junto con el Plan de Calidad de proceso, la evidencia técnica del cumplimiento de los criterios de calidad definidos para el proyecto.
