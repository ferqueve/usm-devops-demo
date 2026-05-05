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

### 3.1 Backend (snapshot del 4 de mayo de 2026)

#### Estado del Quality Gate

El proyecto utiliza el Quality Gate personalizado `USM Strict`, que evalúa el estado total del código contra el estándar máximo. El indicador refleja honestamente cuánto falta para alcanzar ese máximo y se actualiza con cada análisis. Estado actual: **3 de 10 condiciones cumplidas**.

| Condición | Umbral | Valor actual | Estado |
|---|:-:|:-:|:-:|
| Issues nuevas en código nuevo | 0 | 0 | ✅ |
| Densidad de duplicación en código nuevo | < 3 % | 0 % | ✅ |
| Calificación de mantenibilidad | A | A | ✅ |
| Issues de confiabilidad | 0 | 10 | ❌ |
| Calificación de confiabilidad | A | D | ❌ |
| Issues de seguridad | 0 | 1 | ❌ |
| Calificación de seguridad | A | E | ❌ |
| Cobertura | ≥ 80 % | 46,4 % | ❌ |
| Densidad de duplicación | ≤ 3 % | 3,8 % | ❌ |
| Hotspots de seguridad revisados | 100 % | 0 % | ❌ |

#### Tamaño y complejidad

| Indicador | Valor |
|---|---|
| Líneas de código (sin comentarios) | 12.180 |
| Líneas totales | 16.653 |
| Archivos | 151 |
| Complejidad ciclomática | 1.743 |
| Complejidad cognitiva | 1.464 |

#### Cobertura de pruebas

| Indicador | Valor |
|---|---|
| Cobertura global | 46,4 % |
| Cobertura de líneas | 51,5 % |
| Cobertura de ramas | 32,4 % |
| Cantidad de pruebas unitarias | 377 |
| Tasa de éxito | 94,4 % |

#### Calidad y mantenibilidad

| Indicador | Valor |
|---|---|
| Issues de confiabilidad | 10 |
| Issues de seguridad | 1 |
| Issues de mantenibilidad | 388 |
| Hotspots de seguridad pendientes de revisión | 2 |
| Densidad de líneas duplicadas | 3,8 % |
| Deuda técnica estimada | 4.078 minutos (~68 horas) |

#### Calificaciones

| Dimensión | Calificación |
|---|:-:|
| Mantenibilidad | A |
| Confiabilidad | D |
| Seguridad | E |

### 3.2 Frontend (snapshot del 4 de mayo de 2026)

#### Estado del Quality Gate

El proyecto frontend utiliza el mismo Quality Gate `USM Strict` que el backend, con la salvedad de que la cobertura no se mide hasta que se incorporen pruebas automatizadas. Estado actual: **3 de 8 condiciones cumplidas**.

| Condición | Umbral | Valor actual | Estado |
|---|:-:|:-:|:-:|
| Calificación de mantenibilidad | A | A | ✅ |
| Issues de seguridad | 0 | 0 | ✅ |
| Calificación de seguridad | A | A | ✅ |
| Issues de confiabilidad | 0 | 174 | ❌ |
| Calificación de confiabilidad | A | D | ❌ |
| Cobertura | ≥ 80 % | 0 % | ❌ |
| Densidad de duplicación | ≤ 3 % | 10,3 % | ❌ |
| Hotspots de seguridad revisados | 100 % | 0 % | ❌ |

#### Tamaño y complejidad

| Indicador | Valor |
|---|---|
| Líneas de código (sin comentarios) | 38.045 |
| Líneas totales | 42.994 |
| Archivos | 234 |
| Complejidad ciclomática | 5.418 |
| Complejidad cognitiva | 3.182 |

#### Cobertura de pruebas

El frontend aún no cuenta con pruebas automatizadas, por lo que la cobertura figura en 0 %. Se incorporará un test runner en una iteración posterior y, a partir de ese momento, los indicadores de cobertura comenzarán a registrarse.

#### Calidad y mantenibilidad

| Indicador | Valor |
|---|---|
| Issues de confiabilidad | 174 |
| Issues de seguridad | 0 |
| Issues de mantenibilidad | 567 |
| Hotspots de seguridad pendientes de revisión | 6 |
| Densidad de líneas duplicadas | 10,3 % |
| Deuda técnica estimada | 2.844 minutos (~47 horas) |

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
- **Suite de pruebas significativa**: el proyecto cuenta con 377 pruebas unitarias activas, lo que demuestra una práctica establecida de testing automatizado.
- **Duplicación bajo control**: la densidad de líneas duplicadas se mantiene en un 3,8 %, muy cerca del umbral exigido por el Quality Gate.
- **Estándar elevado autoimpuesto**: el equipo eligió un Quality Gate estricto que evalúa el estado total del código (no solo el nuevo), utilizándolo como vara de progreso hacia la calidad máxima.

#### Áreas en proceso de mejora

El análisis identifica áreas en las que el equipo está trabajando activamente como parte del proceso de calidad continua:

- **Cobertura de ramas**: el 32,4 % de cobertura de ramas refleja que existen caminos lógicos sin verificación automatizada, especialmente en condicionales complejos. La estrategia del equipo apunta a incrementar progresivamente este indicador como parte del trabajo de testing por feature.
- **Estabilidad de la suite**: una porción de las pruebas presenta fallos o errores de ejecución, lo que requiere estabilización antes de seguir ampliando la cobertura.
- **Confiabilidad**: la calificación D refleja la presencia de issues de confiabilidad identificadas por SonarQube que están bajo análisis del equipo.
- **Seguridad**: la calificación E está condicionada por dos hotspots de seguridad pendientes de revisión humana y una issue de seguridad identificada. El equipo realiza una revisión específica que se documenta en la ficha de Análisis de Seguridad.
- **Patrones de mejora estructural**: el análisis detecta patrones recurrentes de oportunidad de refactor, principalmente la extracción de literales repetidos a constantes y la migración de inyección por campo a inyección por constructor en algunos servicios. Forman parte del backlog técnico planificado.

### 4.2 Frontend

#### Fortalezas observadas

- **Mantenibilidad alta**: igual que en el backend, la calificación A indica que la deuda técnica del frontend es proporcionalmente baja respecto al tamaño del proyecto.
- **Seguridad sólida**: el análisis no detecta issues de seguridad ni vulnerabilidades. La calificación A en seguridad demuestra que el código del frontend no expone patrones de riesgo según el catálogo de SonarQube.
- **Línea de base honesta**: ya con el primer escaneo, el frontend incorpora la misma vara de medición que el backend, lo que permite comparar y trazar la evolución de ambos componentes desde el primer momento.

#### Áreas en proceso de mejora

- **Confiabilidad**: la calificación D y las 174 issues de confiabilidad concentran el principal foco de atención. Una primera revisión permite identificar patrones recurrentes (manejo de promesas, valores potencialmente indefinidos, uso de hooks de React) que se atenderán en iteraciones de refactor planificado.
- **Duplicación**: la densidad del 10,3 % está sensiblemente por encima del umbral del Quality Gate. Refleja oportunidades de extracción de componentes compartidos y de utilidades, que se prevé atender de forma incremental.
- **Cobertura de pruebas**: actualmente en 0 %. La incorporación de un test runner (planificada para una iteración posterior) habilitará el seguimiento de la cobertura como parte del proceso de mejora continua.
- **Hotspots de seguridad**: se detectaron 6 hotspots pendientes de revisión. Aún no implican vulnerabilidades; cada uno será evaluado y marcado según corresponda en la ficha de Análisis de Seguridad.

### 4.3 Sobre las calificaciones

Es importante interpretar correctamente las calificaciones de SonarQube. Una calificación E en seguridad **no implica que existan vulnerabilidades activas explotables**, sino que existen hotspots o issues que requieren revisión humana para confirmarse como seguros. Una vez que los hotspots son revisados y marcados según corresponda, la calificación se ajusta automáticamente.

De la misma forma, las issues de mantenibilidad (388 en backend, 567 en frontend) son sugerencias de mejora de calidad estructural, no defectos funcionales. Son atendidas según prioridad en el plan de refactor del equipo.

## 5. Evolución del proyecto

Esta sección registra los sucesivos snapshots de análisis para visualizar la evolución del proyecto en el tiempo. Cada nuevo análisis se incorpora como una nueva fila, sin reemplazar los anteriores. Las dos tablas muestran la evolución por separado para backend y frontend.

### 5.1 Backend (`USM-backend`)

| Fecha | Cobertura | Issues confiabilidad | Issues seguridad | Hotspots revisados | Mantenibilidad | Confiabilidad | Seguridad | Deuda (h) |
|---|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|
| 2026-05-04 | 46,4 % | 10 | 1 | 0 % | A | D | E | 68 |
| 2026-05-05 | (pendiente reanálisis tras intervención) | (esperado: ↓) | 0 | 100 % | A | (esperado: ↑) | (esperado: ↑) | (esperado: ↓) |

### 5.2 Frontend (`USM-frontend`)

| Fecha | LOC | Issues confiabilidad | Issues seguridad | Hotspots revisados | Duplicación | Mantenibilidad | Confiabilidad | Seguridad | Deuda (h) |
|---|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|
| 2026-05-04 | 38.045 | 174 | 0 | 0 % | 10,3 % | A | D | A | 47 |
| 2026-05-05 | 38.045 | (esperado: ↓) | 0 | 100 % | 10,3 % | A | (esperado: ↑) | A | (esperado: ↓) |

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

#### Resultado esperado en el próximo análisis

Con los cambios aplicados, el próximo escaneo automático del pipeline de Integración Continua debería reflejar:

- **Backend**: descenso significativo del total de incidencias, `Security Hotspots Reviewed = 100 %`, vulnerabilidad resuelta y mejora de las calificaciones de Confiabilidad y Seguridad.
- **Frontend**: descenso de incidencias por la modernización de patrones, `Security Hotspots Reviewed = 100 %` y mejora de la calificación de Confiabilidad.

Las celdas marcadas como "esperado" en las tablas 5.1 y 5.2 se completarán con los valores reales una vez que el pipeline publique el nuevo análisis a SonarQube.

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
